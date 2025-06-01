// Netlify serverless function to handle Cashfree payment webhooks
const admin = require('firebase-admin');
const crypto = require('crypto');

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

const db = app ? admin.firestore() : null;

/**
 * Verify webhook signature from Cashfree
 * @param {string} signature - Signature from webhook header
 * @param {string} body - Raw request body
 * @param {string} secretKey - Cashfree webhook secret key
 * @returns {boolean} - Whether signature is valid
 */
const verifyWebhookSignature = (signature, body, secretKey) => {
  try {
    const expectedSignature = crypto
      .createHmac("sha256", secretKey)
      .update(body)
      .digest("base64");
    
    return signature === expectedSignature;
  } catch (error) {
    console.error("Error verifying webhook signature:", error);
    return false;
  }
};

/**
 * Update user's wallet balance
 * @param {string} userId - User ID
 * @param {number} amount - Amount to add to wallet
 * @returns {Promise<void>}
 */
async function updateWalletBalance(userId, amount) {
  if (!db) {
    throw new Error('Firebase not initialized');
  }

  const walletRef = db.collection('wallets').doc(userId);
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
  if (!db) {
    throw new Error('Firebase not initialized');
  }

  const transactionsRef = db.collection('transactions');
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
    const userRef = db.collection("users").doc(userId);
    const transactionRef = db.collection("creditTransactions").doc();
    
    // Process in a transaction for data consistency
    await db.runTransaction(async (transaction) => {
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
 * Process Cashfree payment webhook
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
    // Get signature from header
    const signature = event.headers['x-webhook-signature'] || 
                      event.headers['X-Webhook-Signature'];

    if (!signature) {
      console.error('Missing webhook signature');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing webhook signature' })
      };
    }

    // Verify signature
    const webhookSecret = process.env.CASHFREE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('CASHFREE_WEBHOOK_SECRET is not set.');
      return { statusCode: 500, body: JSON.stringify({ error: 'API secret key (CASHFREE_WEBHOOK_SECRET) not configured for webhook verification' }) };
    }

    if (!verifyWebhookSignature(signature, event.body, webhookSecret)) {
      console.error('Invalid webhook signature');
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Invalid signature' })
      };
    }

    // Parse webhook payload
    const webhookData = JSON.parse(event.body);
    console.log('Received Cashfree webhook:', webhookData.type);

    // Process different event types
    const eventType = webhookData.type;
    
    // We're mainly interested in successful payments
    if (eventType === 'PAYMENT_SUCCESS_WEBHOOK' || eventType === 'ORDER_PAID_WEBHOOK') {
      const orderId = webhookData.data.order.order_id;
      const orderAmount = parseFloat(webhookData.data.order.order_amount);
      const paymentId = webhookData.data.payment?.payment_id;
      
      console.log(`Processing successful payment for order ${orderId}`);
      
      // Check if this is a credit order
      try {
        // Get order details from Firestore
        const creditOrderDoc = await db.collection('creditOrders').doc(orderId).get();
        
        if (creditOrderDoc.exists) {
          const orderData = creditOrderDoc.data();
          console.log('Found credit order data:', orderData);
          
          // Check if already processed to prevent duplicates
          if (orderData.status === 'PAID') {
            console.log(`Order ${orderId} already processed`);
            return {
              statusCode: 200,
              body: JSON.stringify({ message: 'Already processed' })
            };
          }
          
          // Get order details
          const userId = orderData.userId;
          const packageId = orderData.packageId;
          const packageType = orderData.packageType;
          const creditsAmount = orderData.creditsAmount;
          
          if (!userId || !packageType || !creditsAmount) {
            throw new Error(`Invalid credit order data for order ${orderId}`);
          }
          
          // Add credits to user account
          const success = await addCreditsToUserAccount(
            userId,
            creditsAmount,
            packageType,
            {
              orderId,
              paymentId,
              packageId,
              amount: orderAmount
            }
          );
          
          if (success) {
            // Update order status in Firestore
            await db.collection('creditOrders').doc(orderId).update({
              status: 'PAID',
              paidAt: admin.firestore.FieldValue.serverTimestamp(),
              paymentId: paymentId,
              webhookData: webhookData
            });
            
            console.log(`Successfully processed credit order ${orderId}`);
          } else {
            throw new Error(`Failed to add credits for order ${orderId}`);
          }
        } else {
          console.log(`No credit order found for order ${orderId}, might be a regular payment`);
        }
      } catch (error) {
        console.error(`Error processing credit order ${orderId}:`, error);
        
        // Still return 200 to acknowledge the webhook
        return {
          statusCode: 200,
          body: JSON.stringify({
            message: 'Webhook received with errors',
            error: error.message
          })
        };
      }
    } else if (eventType === 'PAYMENT_FAILED_WEBHOOK') {
      const orderId = webhookData.data.order.order_id;
      
      try {
        // Update order status if it's a credit order
        const creditOrderDoc = await db.collection('creditOrders').doc(orderId).get();
        
        if (creditOrderDoc.exists) {
          await db.collection('creditOrders').doc(orderId).update({
            status: 'FAILED',
            failedAt: admin.firestore.FieldValue.serverTimestamp(),
            webhookData: webhookData
          });
          
          console.log(`Updated failed credit order ${orderId}`);
        }
      } catch (error) {
        console.error(`Error updating failed credit order ${orderId}:`, error);
      }
    }
    
    // Always acknowledge webhook receipt with 200 status
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Webhook processed successfully' })
    };
  } catch (error) {
    console.error('Error processing webhook:', error);
    
    // Still return 200 to acknowledge the webhook
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'Webhook received but encountered error',
        error: error.message 
      })
    };
  }
}; 