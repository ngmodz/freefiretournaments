import crypto from 'crypto';
import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
let app;
let db;

const initializeFirebase = () => {
  if (!app && !admin.apps.length) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      db = admin.firestore();
      console.log('✅ Firebase Admin initialized');
    } catch (error) {
      console.error('❌ Firebase initialization error:', error);
    }
  } else if (admin.apps.length) {
    app = admin.apps[0];
    db = admin.firestore();
  }
  return db;
};

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
      creditsToAdd = amount;
      walletType = 'tournamentCredits';
    } else if (packageType === 'host') {
      hostCreditsToAdd = amount;
      walletType = 'hostCredits';
    } else {
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
        description: `Credit purchase via CashFree: ${packageName || 'Credits'}`,
        transactionDetails: {
          packageId,
          packageName,
          paymentId: webhookData.payment_id || webhookData.cf_payment_id,
          orderId: webhookData.order_id,
          status: 'completed'
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      };

      transaction.set(creditTransactionRef, creditTransaction);
    });

    console.log(`✅ Credits added successfully: ${creditsToAdd || hostCreditsToAdd} ${walletType} for user ${userId}`);

  } catch (error) {
    console.error('Error processing successful payment:', error);
    throw error;
  }
}

/**
 * Process payment webhook data
 */
async function processPaymentWebhook(webhookData) {
  try {
    console.log('Processing payment webhook:', webhookData);

    const {
      order_id: orderId,
      cf_order_id: cfOrderId,
      order_amount: orderAmount,
      order_currency: orderCurrency,
      order_status: orderStatus,
      payment_session_id: paymentSessionId,
      payment_amount: paymentAmount,
      payment_currency: paymentCurrency,
      payment_time: paymentTime,
      payment_method: paymentMethod,
      payment_status: paymentStatus,
      payment_message: paymentMessage,
      payment_id: paymentId
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

    // Update order with payment details
    await orderRef.update({
      orderStatus,
      paymentStatus,
      paymentAmount: paymentAmount || orderAmount,
      paymentCurrency: paymentCurrency || orderCurrency,
      paymentTime,
      paymentMethod,
      paymentMessage,
      paymentId,
      cfOrderId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      webhookProcessedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // If payment is successful, add credits to user account
    if (paymentStatus === 'SUCCESS' || orderStatus === 'PAID') {
      await processSuccessfulPayment(orderData, webhookData.data || webhookData);
    }

    console.log('✅ Webhook processed successfully for order:', orderId);
    return { success: true, orderId };

  } catch (error) {
    console.error('Error processing payment webhook:', error);
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
    // Initialize Firebase
    const database = initializeFirebase();
    if (!database) {
      throw new Error('Firebase not initialized');
    }

    // Get raw body for signature verification
    const rawBody = JSON.stringify(req.body);
    const signature = req.headers['x-webhook-signature'];
    const timestamp = req.headers['x-webhook-timestamp'];

    // Verify webhook signature
    if (signature && timestamp) {
      const isValidSignature = verifyCashFreeSignature(rawBody, signature, timestamp);
      if (!isValidSignature) {
        console.error('Invalid webhook signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }
      console.log('✅ Webhook signature verified');
    } else {
      console.warn('⚠️ Webhook signature headers missing');
    }

    // Process the webhook
    const result = await processPaymentWebhook(req.body);
    
    res.status(200).json({
      success: true,
      message: 'Webhook processed successfully',
      orderId: result.orderId
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({
      error: error.message || 'Internal server error',
      success: false
    });
  }
}
