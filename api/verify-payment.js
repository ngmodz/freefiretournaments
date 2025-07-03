import crypto from 'crypto';
import admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
let db;
if (!admin.apps.length) {
  try {
    // Check for service account environment variable first
    let serviceAccount;
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } else if (process.env.SERVICE_ACCOUNT_KEY_PATH) {
      // Fall back to file path if environment variable not set
      admin.initializeApp({
        credential: admin.credential.cert(process.env.SERVICE_ACCOUNT_KEY_PATH)
      });
    } else {
      throw new Error('Firebase credentials not available');
    }
    db = admin.firestore();
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
  }
} else {
  db = admin.firestore();
}

// CashFree API configuration
const getCashFreeConfig = () => {
  const environment = process.env.CASHFREE_ENVIRONMENT || 'SANDBOX';
  return {
    appId: process.env.VITE_CASHFREE_APP_ID || process.env.CASHFREE_APP_ID,
    secretKey: process.env.CASHFREE_SECRET_KEY,
    environment: environment,
    baseUrl: environment === 'PRODUCTION' 
      ? 'https://api.cashfree.com/pg' 
      : 'https://sandbox.cashfree.com/pg'
  };
};

// Generate CashFree headers
const generateCashFreeHeaders = (config) => {
  return {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'x-api-version': '2023-08-01',
    'x-client-id': config.appId,
    'x-client-secret': config.secretKey
  };
};

/**
 * Update user's wallet with credits after successful payment
 */
async function updateUserWallet(userId, packageType, amount, orderId, paymentDetails) {
  try {
    console.log(`Updating wallet for user ${userId}, package type: ${packageType}, amount: ${amount}`);
    
    // Get user document
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      throw new Error(`User not found: ${userId}`);
    }

    const userData = userDoc.data();
    const wallet = userData.wallet || {
      tournamentCredits: 0,
      hostCredits: 0,
      earnings: 0,
      totalPurchasedTournamentCredits: 0,
      totalPurchasedHostCredits: 0,
      firstPurchaseCompleted: false
    };
    
    // Use transaction to ensure data consistency
    await db.runTransaction(async (transaction) => {
      const userSnapshot = await transaction.get(userRef);
      
      if (!userSnapshot.exists) {
        throw new Error('User not found during transaction');
      }
      
      const currentUserData = userSnapshot.data();
      const updates = {};
      let creditsToAdd = 0;
      let walletType = 'tournamentCredits';

      // Update based on package type
      if (packageType === 'host') {
        // Add host credits
        creditsToAdd = amount;
        walletType = 'hostCredits';
        updates['wallet.hostCredits'] = admin.firestore.FieldValue.increment(amount);
        updates['wallet.totalPurchasedHostCredits'] = admin.firestore.FieldValue.increment(amount);
      } else {
        // Default: Add tournament credits
        creditsToAdd = amount;
        walletType = 'tournamentCredits';
        updates['wallet.tournamentCredits'] = admin.firestore.FieldValue.increment(amount);
        updates['wallet.totalPurchasedTournamentCredits'] = admin.firestore.FieldValue.increment(amount);
      }
      
      updates['wallet.firstPurchaseCompleted'] = true;
      updates['wallet.lastUpdated'] = admin.firestore.FieldValue.serverTimestamp();
      
      transaction.update(userRef, updates);
      
      // Create transaction record
      const creditTransactionRef = db.collection('creditTransactions').doc();
      const creditTransaction = {
        userId,
        type: packageType === 'host' ? 'host_credit_purchase' : 'tournament_credit_purchase',
        amount: creditsToAdd,
        value: amount,
        balanceBefore: walletType === 'hostCredits' 
          ? (currentUserData.wallet?.hostCredits || 0)
          : (currentUserData.wallet?.tournamentCredits || 0),
        balanceAfter: walletType === 'hostCredits'
          ? (currentUserData.wallet?.hostCredits || 0) + creditsToAdd
          : (currentUserData.wallet?.tournamentCredits || 0) + creditsToAdd,
        walletType,
        description: `Credit purchase: ${packageType === 'host' ? 'Host' : 'Tournament'} Credits`,
        transactionDetails: {
          packageId: paymentDetails?.order_tags?.packageId || '',
          packageName: paymentDetails?.order_tags?.packageName || 'Credits',
          paymentId: paymentDetails?.cf_payment_id || '',
          orderId: orderId,
          paymentMethod: paymentDetails?.payment_method || '',
          status: 'completed'
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      transaction.set(creditTransactionRef, creditTransaction);
    });
    
    console.log(`✅ Credits added successfully: ${amount} ${packageType} credits for user ${userId}`);
    return true;
  } catch (error) {
    console.error('Error updating user wallet:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const config = getCashFreeConfig();
    
    if (!config.appId || !config.secretKey) {
      throw new Error('CashFree credentials not configured');
    }

    const { orderId, skipCreditUpdate } = req.body;

    if (!orderId) {
      return res.status(400).json({
        error: 'Order ID is required',
        success: false
      });
    }

    console.log('Verifying payment for order:', orderId);

    // First check if order exists in our database
    if (db) {
      const orderRef = db.collection('paymentOrders').doc(orderId);
      const orderDoc = await orderRef.get();
      
      // If order exists and is already marked as paid, return success
      if (orderDoc.exists && orderDoc.data().orderStatus === 'PAID') {
        console.log('Order already verified and marked as paid:', orderId);
        return res.status(200).json({
          success: true,
          verified: true,
          orderId: orderId,
          orderStatus: 'PAID',
          orderAmount: orderDoc.data().amount,
          paymentDetails: orderDoc.data().paymentDetails || null,
          message: 'Payment already verified successfully'
        });
      }
    }

    // Call CashFree API to get order details
    const response = await fetch(`${config.baseUrl}/orders/${orderId}`, {
      method: 'GET',
      headers: generateCashFreeHeaders(config)
    });

    const orderData = await response.json();

    if (!response.ok) {
      console.error('CashFree API error:', orderData);
      throw new Error(orderData.message || 'Failed to verify payment');
    }

    console.log('Payment verification result:', orderData.order_status);

    // Get payment details if order is paid
    let paymentDetails = null;
    if (orderData.order_status === 'PAID') {
      try {
        const paymentsResponse = await fetch(`${config.baseUrl}/orders/${orderId}/payments`, {
          method: 'GET',
          headers: generateCashFreeHeaders(config)
        });

        if (paymentsResponse.ok) {
          const paymentsData = await paymentsResponse.json();
          paymentDetails = paymentsData && paymentsData.length > 0 ? paymentsData[0] : null;
        }
      } catch (error) {
        console.warn('Could not fetch payment details:', error.message);
      }
      
      // Update order status in database and add credits if payment successful
      if (db && !skipCreditUpdate && orderData.order_tags && orderData.order_tags.userId) {
        try {
          // Update order status in database
          const orderRef = db.collection('paymentOrders').doc(orderId);
          await orderRef.set({
            orderId: orderData.order_id,
            userId: orderData.order_tags.userId,
            amount: parseInt(orderData.order_amount),
            currency: orderData.order_currency,
            orderStatus: orderData.order_status,
            orderTags: orderData.order_tags,
            customerDetails: orderData.customer_details,
            paymentDetails: paymentDetails,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            verifiedAt: admin.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
          
          // Update user wallet with credits
          const userId = orderData.order_tags.userId;
          const packageType = orderData.order_tags.packageType || 'tournament';
          const amount = parseInt(orderData.order_amount);
          
          await updateUserWallet(userId, packageType, amount, orderId, paymentDetails);
          console.log('Order status updated and credits added for order:', orderId);
        } catch (error) {
          console.error('Error updating order status or adding credits:', error);
        }
      }
    }

    // Return verification result
    res.status(200).json({
      success: true,
      verified: orderData.order_status === 'PAID',
      orderId: orderData.order_id,
      orderStatus: orderData.order_status,
      orderAmount: orderData.order_amount,
      orderCurrency: orderData.order_currency,
      paymentDetails: paymentDetails,
      userId: orderData.order_tags?.userId,
      packageType: orderData.order_tags?.packageType,
      message: orderData.order_status === 'PAID' ? 'Payment verified successfully' : 'Payment not completed'
    });

  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({
      error: error.message || 'Internal server error',
      success: false,
      verified: false
    });
  }
}
