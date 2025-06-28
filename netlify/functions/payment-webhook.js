const crypto = require('crypto');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');
const admin = require('firebase-admin');

let db;

// Initialize Firebase Admin if not already initialized
if (!process.env.FIREBASE_ADMIN_INITIALIZED) {
  try {
    // Initialize Firebase Admin using service account
    const serviceAccountPath = process.env.SERVICE_ACCOUNT_KEY_PATH;
    
    const app = initializeApp({
      credential: cert(serviceAccountPath)
    });
    
    db = getFirestore(app);
    process.env.FIREBASE_ADMIN_INITIALIZED = 'true';
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
  }
} else {
  db = getFirestore();
}

// Initialize Firebase Admin SDK
let serviceAccount;
try {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} catch (error) {
  console.error('Error parsing Firebase service account:', error);
}

let app;
if (!admin.apps.length && serviceAccount) {
  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} else if (admin.apps.length) {
  app = admin.apps[0];
}

const dbAdmin = app ? admin.firestore() : null;

/**
 * Verify Cashfree webhook signature
 */
function verifyWebhookSignature(payload, signature, secretKey) {
  try {
    // Convert payload to string if it's an object
    const data = typeof payload === 'object' ? JSON.stringify(payload) : payload;
    
    // Create HMAC using secret key and payload
    const hmac = crypto.createHmac('sha256', secretKey);
    hmac.update(data);
    const generatedSignature = hmac.digest('hex');
    
    // Compare the generated signature with the received one
    return crypto.timingSafeEqual(
      Buffer.from(generatedSignature, 'hex'),
      Buffer.from(signature, 'hex')
    );
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
}

/**
 * Update payment status in Firestore
 */
async function updatePaymentStatus(orderId, paymentData) {
  try {
    // Create a reference to the payments collection
    const paymentRef = db.collection('payments').doc(orderId);
    
    // Update the payment document with new status
    await paymentRef.set({
      ...paymentData,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    
    console.log(`Payment status updated for order ${orderId}`);
    return true;
  } catch (error) {
    console.error(`Error updating payment status for order ${orderId}:`, error);
    return false;
  }
}

/**
 * Update user's wallet balance
 * @param {string} userId - User ID
 * @param {number} amount - Amount to add to wallet
 * @returns {Promise<void>}
 */
async function updateWalletBalance(userId, amount) {
  if (!dbAdmin) {
    throw new Error('Firebase not initialized');
  }

  const walletRef = dbAdmin.collection('wallets').doc(userId);
  const walletDoc = await walletRef.get();

  if (!walletDoc.exists) {
    // Initialize wallet if it doesn't exist
    await walletRef.set({
      balance: amount,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    });
  } else {
    // Update existing wallet
    await walletRef.update({
      balance: admin.firestore.FieldValue.increment(amount),
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    });
  }
}

/**
 * Add transaction record to Firestore
 * @param {Object} transaction - Transaction details
 * @returns {Promise<string>} - Transaction ID
 */
async function addTransaction(transaction) {
  if (!dbAdmin) {
    throw new Error('Firebase not initialized');
  }

  const transactionsRef = dbAdmin.collection('transactions');
  const newTransaction = {
    ...transaction,
    date: admin.firestore.FieldValue.serverTimestamp()
  };

  const docRef = await transactionsRef.add(newTransaction);
  return docRef.id;
}

/**
 * Add credits to user account after successful payment
 * @param {string} userId - Firebase Auth UID of the user
 * @param {number} creditsAmount - Number of credits to add
 * @param {string} creditType - Type of credits ('tournament' or 'host')
 * @param {Object} details - Payment details
 * @returns {Promise<boolean>} - Success status
 */
const addCreditsToUserAccount = async (
  userId,
  creditsAmount,
  creditType,
  details
) => {
  try {
    // Get Firestore references
    const userRef = dbAdmin.collection("users").doc(userId);
    const transactionRef = dbAdmin.collection("creditTransactions").doc();
    
    // Process in a transaction for data consistency
    await dbAdmin.runTransaction(async (transaction) => {
      // Get current user data
      const userDoc = await transaction.get(userRef);
      
      if (!userDoc.exists) {
        throw new Error(`User ${userId} not found`);
      }
      
      // Get user data and wallet
      const userData = userDoc.data();
      const wallet = userData.wallet || {
        tournamentCredits: 0,
        hostCredits: 0,
        earnings: 0,
        totalPurchasedTournamentCredits: 0,
        totalPurchasedHostCredits: 0,
        firstPurchaseCompleted: false
      };
      
      // Calculate new values
      const walletField = creditType === 'tournament' ? 'tournamentCredits' : 'hostCredits';
      const totalField = creditType === 'tournament' ? 'totalPurchasedTournamentCredits' : 'totalPurchasedHostCredits';
      const currentBalance = wallet[walletField] || 0;
      const newBalance = currentBalance + creditsAmount;
      
      // Prepare transaction data
      const transactionType = creditType === 'tournament' ? 'tournament_credit_purchase' : 'host_credit_purchase';
      const transactionData = {
        userId,
        type: transactionType,
        amount: creditsAmount,
        value: details.amount,
        balanceBefore: currentBalance,
        balanceAfter: newBalance,
        walletType: walletField,
        description: `Purchased ${creditsAmount} ${creditType} credits - ${details.packageName || details.packageId}`,
        transactionDetails: {
          packageId: details.packageId,
          packageName: details.packageName || details.packageId,
          paymentId: details.paymentId,
          orderId: details.orderId
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      // Update user wallet
      transaction.update(userRef, {
        [`wallet.${walletField}`]: newBalance,
        [`wallet.${totalField}`]: admin.firestore.FieldValue.increment(creditsAmount),
        'wallet.firstPurchaseCompleted': true
      });
      
      // Record the transaction
      transaction.set(transactionRef, transactionData);
    });
    
    console.log(`Successfully added ${creditsAmount} ${creditType} credits to user ${userId}`);
    return true;
  } catch (error) {
    console.error(`Error adding credits to user ${userId}:`, error);
    return false;
  }
};

/**
 * Process payment webhook
 */
exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    // Parse webhook payload
    const webhookData = JSON.parse(event.body);
    console.log('Received payment webhook:', webhookData);

    // Verify payment data
    const {
      order_id,
      payment_id,
      status,
      amount,
      user_id,
      package_id,
      package_type,
      credits_amount,
      signature
    } = webhookData;

    // In a production environment, you would verify the signature here
    // using your Cashfree API key and the webhook payload

    // Process the payment based on status
    if (status === 'SUCCESS') {
      console.log(`Processing successful payment: Order ID ${order_id}, User ID ${user_id}`);

      if (package_type && credits_amount && package_id) {
        // This is a credit purchase
        const creditsAmount = parseInt(credits_amount, 10);
        
        // Add credits to user account
        await addCreditsToUserAccount(
          user_id,
          creditsAmount,
          package_type,
          {
            amount: parseFloat(amount),
            packageId: package_id,
            orderId: order_id,
            paymentId: payment_id
          }
        );
        
      return {
        statusCode: 200,
          body: JSON.stringify({
            success: true,
            message: `Successfully processed credit purchase for user ${user_id}`
          })
      };
      } else {
        // This is a wallet top-up
        const walletAmount = parseFloat(amount);
        
        // Update wallet balance
        await updateWalletBalance(user_id, walletAmount);
        
        // Add transaction record
        const transactionId = await addTransaction({
          userId: user_id,
          type: 'deposit',
          amount: walletAmount,
          status: 'completed',
          paymentDetails: {
            orderId: order_id,
            paymentId: payment_id,
          }
        });
        
      return {
          statusCode: 200,
          body: JSON.stringify({
            success: true,
            message: `Successfully processed wallet top-up for user ${user_id}`,
            transactionId
          })
      };
    }
    } else {
      // Failed payment
      console.log(`Received failed payment notification: Order ID ${order_id}, Status: ${status}`);
    
      // Record the failed transaction for audit purposes
      await addTransaction({
        userId: user_id || 'unknown',
        type: 'failed_payment',
        amount: parseFloat(amount),
        status: 'failed',
        paymentDetails: {
          orderId: order_id,
          paymentId: payment_id,
          failureReason: webhookData.failure_reason || 'Unknown failure'
        }
      });
      
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: false,
          message: `Recorded failed payment for order ${order_id}`
        })
    };
    }
  } catch (error) {
    console.error('Error processing payment webhook:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: 'Failed to process payment webhook',
        details: error.message
      })
    };
  }
};
