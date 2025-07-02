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
 * Update user's wallet with credits after successful payment
 */
async function updateUserWallet(userId, packageType, amount) {
  try {
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

    // Update based on package type
    if (packageType === 'host') {
      // Add host credits
      return userRef.update({
        'wallet.hostCredits': admin.firestore.FieldValue.increment(amount),
        'wallet.totalPurchasedHostCredits': admin.firestore.FieldValue.increment(amount),
        'wallet.firstPurchaseCompleted': true,
        'wallet.lastUpdated': admin.firestore.FieldValue.serverTimestamp()
      });
    } else {
      // Default: Add tournament credits
      return userRef.update({
        'wallet.tournamentCredits': admin.firestore.FieldValue.increment(amount),
        'wallet.totalPurchasedTournamentCredits': admin.firestore.FieldValue.increment(amount),
        'wallet.firstPurchaseCompleted': true,
        'wallet.lastUpdated': admin.firestore.FieldValue.serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error updating user wallet:', error);
    throw error;
  }
}

/**
 * Process successful payment
 */
async function processSuccessfulPayment(orderData, webhookData) {
  try {
    const { userId, order_amount } = webhookData?.data?.order || {};
    const { packageType, packageId, packageName } = webhookData?.data?.order?.order_tags || {};
    
    if (!userId) {
      throw new Error('User ID not found in webhook data');
    }

    const amount = parseInt(order_amount || 0);
    if (isNaN(amount) || amount <= 0) {
      throw new Error('Invalid order amount');
    }
    
    console.log(`Processing payment for user ${userId}, package type: ${packageType}, amount: ${amount}`);
    
    // Update user's wallet with credits
    await updateUserWallet(userId, packageType, amount);
    
    // Create a transaction record
    const walletType = packageType === 'host' ? 'hostCredits' : 'tournamentCredits';
    const txType = packageType === 'host' ? 'host_credit_purchase' : 'tournament_credit_purchase';
    
    // Add credit transaction
    await db.collection('creditTransactions').add({
      userId,
      type: txType,
      amount: amount,
      value: amount,
      walletType,
      description: `Purchase of ${packageType} credits`,
      transactionDetails: {
        packageId: packageId || '',
        packageName: packageName || 'Credits',
        orderId: webhookData?.data?.order?.order_id || '',
        paymentId: webhookData?.data?.payment?.cf_payment_id || '',
        status: 'completed'
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`✅ Credits added successfully: ${amount} ${walletType} for user ${userId}`);
    return { success: true, userId, amount, packageType };
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
    console.log('Processing payment webhook:', JSON.stringify(webhookData));

    // Initialize Firebase
    if (!db) {
      db = initializeFirebase();
      if (!db) {
        throw new Error('Failed to initialize Firebase');
      }
    }

    // Validate webhook data structure
    if (!webhookData?.data?.order?.order_id) {
      throw new Error('Invalid webhook data: missing order ID');
    }

    const orderId = webhookData.data.order.order_id;
    const paymentStatus = webhookData.data.payment.payment_status || 'FAILED';
    
    console.log(`Processing payment webhook for order ${orderId}, status: ${paymentStatus}`);

    // Store webhook data in Firestore for reference
    const webhookRef = db.collection('paymentWebhooks').doc();
    await webhookRef.set({
      webhookData,
      receivedAt: admin.firestore.FieldValue.serverTimestamp(),
      orderId
    });

    // If payment is successful, process the payment
    if (paymentStatus === 'SUCCESS') {
      await processSuccessfulPayment(null, webhookData);
    }

    console.log('✅ Webhook processed successfully for order:', orderId);
    return { success: true, orderId, paymentStatus };

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
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-webhook-signature, x-webhook-timestamp');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get raw body and headers for signature verification
    const rawBody = JSON.stringify(req.body);
    const signature = req.headers['x-webhook-signature'];
    const timestamp = req.headers['x-webhook-timestamp'];

    // Log the webhook received
    console.log('Cashfree webhook received:', { 
      timestamp, 
      hasSignature: !!signature,
      body: typeof req.body === 'object' ? '(object)' : rawBody.substring(0, 100) + '...'
    });

    // Verify webhook signature in production
    if (process.env.NODE_ENV === 'production' && signature && timestamp) {
      const isValidSignature = verifyCashFreeSignature(rawBody, signature, timestamp);
      if (!isValidSignature) {
        console.error('Invalid webhook signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }
      console.log('✅ Webhook signature verified');
    } else {
      console.warn('⚠️ Webhook signature verification skipped (development mode or missing headers)');
    }

    // Process the webhook data
    const result = await processPaymentWebhook(req.body);
    
    // Return success response
    return res.status(200).json({ success: true, message: 'Webhook processed successfully', data: result });

  } catch (error) {
    console.error('Webhook processing error:', error);
    
    // Always return 200 to Cashfree to prevent retries
    // But include the error in the response
    return res.status(200).json({ 
      success: false, 
      error: error.message || 'Error processing webhook',
      message: 'Webhook received but failed to process' 
    });
  }
}
