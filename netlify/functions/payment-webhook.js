const crypto = require('crypto');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
let serviceAccount;
try {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} catch (error) {
  console.error('Error parsing Firebase service account:', error);
}

let app;
let db;
if (!admin.apps.length && serviceAccount) {
  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  db = admin.firestore();
} else if (admin.apps.length) {
  app = admin.apps[0];
  db = admin.firestore();
}

/**
 * Verify CashFree webhook signature
 */
function verifyCashFreeSignature(rawBody, signature, timestamp) {
  try {
    const secretKey = process.env.CASHFREE_SECRET_KEY;
    if (!secretKey) {
      console.error('CashFree secret key not found');
      return false;
    }

    // Create expected signature
    const expectedSignature = crypto
      .createHmac('sha256', secretKey)
      .update(timestamp + rawBody)
      .digest('base64');

    // Compare signatures using timing-safe comparison
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'base64'),
      Buffer.from(expectedSignature, 'base64')
    );
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

/**
 * Process payment webhook data
 */
async function processPaymentWebhook(webhookData) {
  try {
    console.log('Processing payment webhook:', webhookData);

    const {
      orderId,
      cfOrderId,
      orderAmount,
      orderCurrency,
      orderStatus,
      paymentSessionId,
      paymentAmount,
      paymentCurrency,
      paymentTime,
      paymentMethod,
      paymentStatus,
      paymentMessage,
      txId,
      txStatus,
      txMsg,
      txTime,
      referenceId
    } = webhookData.data || webhookData;

    if (!db) {
      throw new Error('Firebase not initialized');
    }

    // Update payment order status
    const orderRef = db.collection('paymentOrders').doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      console.error('Payment order not found:', orderId);
      throw new Error('Payment order not found');
    }

    const orderData = orderDoc.data();
    const userId = orderData.userId;

    // Update order with payment details
    await orderRef.update({
      orderStatus,
      paymentStatus,
      paymentAmount,
      paymentCurrency,
      paymentTime,
      paymentMethod,
      paymentMessage,
      txId,
      txStatus,
      txMsg,
      txTime,
      referenceId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      webhookProcessedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // If payment is successful, add credits to user account
    if (paymentStatus === 'SUCCESS' || txStatus === 'SUCCESS') {
      await processSuccessfulPayment(orderData, webhookData);
    } else if (paymentStatus === 'FAILED' || txStatus === 'FAILED') {
      await processFailedPayment(orderData, webhookData);
    }

    console.log('Webhook processed successfully for order:', orderId);
    return { success: true, orderId };

  } catch (error) {
    console.error('Error processing payment webhook:', error);
    throw error;
  }
}

/**
 * Process successful payment
 */
async function processSuccessfulPayment(orderData, webhookData) {
  try {
    const { userId, amount, orderTags } = orderData;
    const { packageType, packageId, packageName } = orderTags || {};

    console.log('Processing successful payment for user:', userId);

    // Get user document
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      throw new Error(`User not found: ${userId}`);
    }

    const userData = userDoc.data();

    // Calculate credits to add based on package
    let creditsToAdd = 0;
    let hostCreditsToAdd = 0;
    let walletType = 'tournamentCredits';

    if (packageType === 'tournament') {
      // Add tournament credits (usually 1:1 ratio with amount)
      creditsToAdd = amount;
      walletType = 'tournamentCredits';
    } else if (packageType === 'host') {
      // Add host credits
      hostCreditsToAdd = amount;
      walletType = 'hostCredits';
    } else {
      // Default to tournament credits
      creditsToAdd = amount;
      walletType = 'tournamentCredits';
    }

    // Update user credits using transaction
    await db.runTransaction(async (transaction) => {
      const userSnapshot = await transaction.get(userRef);
      
      if (!userSnapshot.exists) {
        throw new Error('User not found during transaction');
      }

      const currentUserData = userSnapshot.data();
      const updates = {};

      if (creditsToAdd > 0) {
        updates.tournamentCredits = (currentUserData.tournamentCredits || 0) + creditsToAdd;
      }
      
      if (hostCreditsToAdd > 0) {
        updates.hostCredits = (currentUserData.hostCredits || 0) + hostCreditsToAdd;
      }

      updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();

      transaction.update(userRef, updates);

      // Log credit transaction
      const creditTransactionRef = db.collection('creditTransactions').doc();
      const creditTransaction = {
        userId,
        type: packageType === 'host' ? 'host_credit_purchase' : 'tournament_credit_purchase',
        amount: creditsToAdd || hostCreditsToAdd,
        value: amount,
        balanceBefore: walletType === 'hostCredits' ? (currentUserData.hostCredits || 0) : (currentUserData.tournamentCredits || 0),
        balanceAfter: walletType === 'hostCredits' ? ((currentUserData.hostCredits || 0) + hostCreditsToAdd) : ((currentUserData.tournamentCredits || 0) + creditsToAdd),
        walletType,
        description: `Credit purchase: ${packageName || 'Credits'}`,
        transactionDetails: {
          packageId,
          packageName,
          paymentId: webhookData.data?.txId || webhookData.txId,
          orderId: orderData.orderId,
          paymentMethod: webhookData.data?.paymentMethod || webhookData.paymentMethod,
          status: 'completed'
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };

      transaction.set(creditTransactionRef, creditTransaction);
    });

    console.log(`Credits added successfully: ${creditsToAdd + hostCreditsToAdd} credits to user ${userId}`);

  } catch (error) {
    console.error('Error processing successful payment:', error);
    throw error;
  }
}

/**
 * Process failed payment
 */
async function processFailedPayment(orderData, webhookData) {
  try {
    const { userId, orderId } = orderData;

    console.log('Processing failed payment for order:', orderId);

    // Log failed transaction for audit purposes
    const failedTransactionRef = db.collection('failedTransactions').doc();
    const failedTransaction = {
      userId,
      orderId,
      amount: orderData.amount,
      reason: webhookData.data?.paymentMessage || webhookData.paymentMessage || 'Payment failed',
      webhookData: webhookData,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await failedTransactionRef.set(failedTransaction);

    console.log('Failed payment logged for order:', orderId);

  } catch (error) {
    console.error('Error processing failed payment:', error);
    throw error;
  }
}

/**
 * Netlify function handler for CashFree payment webhooks
 */
exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, x-cashfree-signature, x-cashfree-timestamp',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    console.log('Received webhook request');
    console.log('Headers:', event.headers);
    console.log('Body:', event.body);

    // Get signature and timestamp from headers
    const signature = event.headers['x-cashfree-signature'];
    const timestamp = event.headers['x-cashfree-timestamp'];

    // Verify webhook signature in production
    if (process.env.VITE_CASHFREE_ENVIRONMENT === 'PRODUCTION') {
      if (!signature || !timestamp) {
        console.error('Missing webhook signature or timestamp');
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Missing signature or timestamp' })
        };
      }

      if (!verifyCashFreeSignature(event.body, signature, timestamp)) {
        console.error('Invalid webhook signature');
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Invalid signature' })
        };
      }
    }

    // Parse webhook payload
    const webhookData = JSON.parse(event.body);
    
    // Process the webhook
    const result = await processPaymentWebhook(webhookData);

    console.log('Webhook processed successfully:', result);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Webhook processed successfully',
        orderId: result.orderId
      })
    };

  } catch (error) {
    console.error('Error processing webhook:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Internal server error',
        ...(process.env.NODE_ENV !== 'production' && { 
          details: error.message 
        })
      })
    };
  }
};
