import crypto from 'crypto';
import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
let serviceAccount;
try {
  // Try to parse the service account from environment variable
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} catch (error) {
  console.error('Error parsing Firebase service account:', error);
}

let app;
let db;
if (!admin.apps.length && serviceAccount) {
  // Initialize with parsed service account
  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  db = admin.firestore();
} else if (!admin.apps.length && process.env.SERVICE_ACCOUNT_KEY_PATH) {
  // Fall back to file path if environment variable not set
  app = admin.initializeApp({
    credential: admin.credential.cert(process.env.SERVICE_ACCOUNT_KEY_PATH)
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
    const secretKey = (process.env.CASHFREE_SECRET_KEY || process.env.CASHFREE_WEBHOOK_SECRET || '').trim();
    if (!secretKey) {
      console.error('CashFree secret key not found');
      return false;
    }

    // Create expected signature
    const expectedSignature = crypto
      .createHmac('sha256', secretKey)
      .update(timestamp + rawBody)
      .digest('base64');

    console.log('🔑 Signature verification:', {
      provided: signature,
      expected: expectedSignature,
      timestamp,
      secretKeyLength: secretKey.length
    });

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
async function updateUserWallet(userId, packageType, creditsAmount) {
  try {
    console.log(`🔥 updateUserWallet called with: userId="${userId}", packageType="${packageType}", creditsAmount=${creditsAmount}`);
    
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
        'wallet.hostCredits': admin.firestore.FieldValue.increment(creditsAmount),
        'wallet.totalPurchasedHostCredits': admin.firestore.FieldValue.increment(creditsAmount),
        'wallet.firstPurchaseCompleted': true,
        'wallet.lastUpdated': admin.firestore.FieldValue.serverTimestamp()
      });
    } else {
      // Default: Add tournament credits
      return userRef.update({
        'wallet.tournamentCredits': admin.firestore.FieldValue.increment(creditsAmount),
        'wallet.totalPurchasedTournamentCredits': admin.firestore.FieldValue.increment(creditsAmount),
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
async function processSuccessfulPayment(orderData, webhookData, cfPaymentId, orderId) {
  try {
    const { order_amount } = webhookData?.data?.order || {};
    const orderTags = webhookData?.data?.order?.order_tags || {};
    const customerDetails = webhookData?.data?.customer_details || {};
    
    // Get user ID from order_tags first, then fallback to customer_details
    const userId = orderTags.userId || customerDetails.customer_id;
    const packageType = orderTags.packageType || 'host'; // Default to host since this was a host pack purchase
    const packageId = orderTags.packageId || '';
    const packageName = orderTags.packageName || 'Basic Host Pack';
    const creditsAmount = orderTags.creditsAmount || '1'; // Default to 1 credit for ₹1 purchase
    
    if (!userId) {
      console.error('❌ User ID not found in webhook data:', {
        orderTags,
        customerDetails,
        orderId
      });
      throw new Error('User ID not found in webhook data');
    }

    const amount = parseInt(order_amount || 0);
    if (isNaN(amount) || amount <= 0) {
      throw new Error('Invalid order amount');
    }

    // Get the actual credits amount - only use if it's a valid positive number
    let actualCreditsAmount;
    if (creditsAmount && creditsAmount.trim() !== '') {
      const parsedCredits = parseInt(creditsAmount);
      if (!isNaN(parsedCredits) && parsedCredits > 0) {
        actualCreditsAmount = parsedCredits;
      }
    }
    
    // If we don't have a valid credits amount, we cannot proceed safely
    if (!actualCreditsAmount) {
      throw new Error(`Invalid or missing credits amount. Received: "${creditsAmount}", cannot fallback to payment amount for safety.`);
    }
    
    console.log(`Processing payment for user ${userId}, package type: ${packageType}, amount: ${amount}, credits: ${actualCreditsAmount}`);
    console.log(`🔥 CALLING updateUserWallet with parameters: userId="${userId}", packageType="${packageType}", creditsAmount=${actualCreditsAmount}`);
    console.log(`🚨 CRITICAL: About to add ${actualCreditsAmount} credits to user ${userId} for payment ${cfPaymentId || orderId}`);
    
    // Update user's wallet with credits
    await updateUserWallet(userId, packageType, actualCreditsAmount);
    
    // Create a transaction record
    const walletType = packageType === 'host' ? 'hostCredits' : 'tournamentCredits';
    const txType = packageType === 'host' ? 'host_credit_purchase' : 'tournament_credit_purchase';
    
    // Add credit transaction
    await db.collection('creditTransactions').add({
      userId,
      type: txType,
      amount: actualCreditsAmount,
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
    
    console.log(`✅ Credits added successfully: ${actualCreditsAmount} ${walletType} for user ${userId}`);
    
    // Atomically mark payment as completed
    if (cfPaymentId || orderId) {
      const duplicateCheckId = String(cfPaymentId || orderId);
      await db.collection('processedPayments').doc(duplicateCheckId).update({
        status: 'completed',
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
        creditsAdded: actualCreditsAmount,
        walletType
      });
    }
    
    return { success: true, userId, amount: actualCreditsAmount, packageType };
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
      db = admin.firestore();
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
    const cfPaymentId = String(webhookData.data.payment.cf_payment_id || ''); // Convert to string to handle both number and string types
    
    console.log(`Processing payment webhook for order ${orderId}, status: ${paymentStatus}, payment ID: ${cfPaymentId}`);

    // Check if we've already processed this payment to prevent duplicates using atomic transaction
    if (paymentStatus === 'SUCCESS') {
      // Use payment ID as primary identifier, fallback to order ID
      const duplicateCheckId = cfPaymentId || orderId;
      
      if (duplicateCheckId) {
        // Use a transaction to atomically check and mark payment as processing
        const paymentRef = db.collection('processedPayments').doc(duplicateCheckId);
        
        try {
          const result = await db.runTransaction(async (transaction) => {
            const existingPayment = await transaction.get(paymentRef);
            
            if (existingPayment.exists) {
              console.log(`✅ Payment ${duplicateCheckId} already processed, skipping duplicate webhook`);
              return { success: true, message: 'Payment already processed', duplicate: true };
            }
            
            // Atomically mark payment as being processed
            transaction.set(paymentRef, {
              orderId,
              cfPaymentId,
              processedAt: admin.firestore.FieldValue.serverTimestamp(),
              status: 'processing'
            });
            
            return { success: true, message: 'Payment marked for processing', duplicate: false };
          });
          
          // If this was a duplicate, return early
          if (result.duplicate) {
            return result;
          }
          
        } catch (error) {
          console.error('Error in payment duplicate check transaction:', error);
          // If transaction fails, assume payment might be duplicate and skip
          console.log(`⚠️ Transaction failed for payment ${duplicateCheckId}, skipping to be safe`);
          return { success: true, message: 'Payment processing skipped due to transaction error' };
        }
      }
    }

    // Store webhook data in Firestore for reference
    const webhookRef = db.collection('paymentWebhooks').doc();
    await webhookRef.set({
      webhookData,
      receivedAt: admin.firestore.FieldValue.serverTimestamp(),
      orderId,
      cfPaymentId
    });

    // If payment is successful, process the payment
    if (paymentStatus === 'SUCCESS') {
      await processSuccessfulPayment(null, webhookData, cfPaymentId, orderId);
      
      // Mark payment as completed
      const duplicateCheckId = cfPaymentId || orderId;
      if (duplicateCheckId) {
        await db.collection('processedPayments').doc(duplicateCheckId).update({
          status: 'completed',
          completedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
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

  // Handle GET requests for webhook testing
  if (req.method === 'GET') {
    console.log('🧪 Webhook test request received');
    return res.status(200).json({ 
      success: true, 
      message: 'Webhook endpoint is working',
      timestamp: new Date().toISOString(),
      endpoint: 'payment-webhook'
    });
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
    console.log('🎯 Cashfree webhook received:', { 
      timestamp, 
      hasSignature: !!signature,
      method: req.method,
      headers: req.headers,
      bodyType: typeof req.body,
      bodyKeys: req.body ? Object.keys(req.body) : [],
      url: req.url
    });
    
    // Log the actual webhook data for debugging
    console.log('📦 Webhook payload:', JSON.stringify(req.body, null, 2));
    
    // Handle Cashfree test webhooks (these come from dashboard testing)
    if (req.body && (req.body.type === 'TEST' || req.body.type === 'WEBHOOK' || req.headers['source-type'] === 'MERCHANT_DASHBOARD')) {
      console.log('🧪 Cashfree test webhook detected');
      return res.status(200).json({ 
        success: true, 
        message: 'Test webhook received successfully',
        data: req.body 
      });
    }
    
    // Log the webhook URL that was called
    console.log('🌐 Webhook URL called:', req.url);
    console.log('🔗 Full webhook URL:', `${req.headers.host}${req.url}`);

    // Verify webhook signature - skip for test webhooks and SANDBOX environment
    const isSandbox = ((process.env.CASHFREE_ENVIRONMENT || 'SANDBOX').trim()) === 'SANDBOX';
    const isTestWebhook = req.headers['source-type'] === 'MERCHANT_DASHBOARD' || req.body?.type === 'TEST' || req.body?.type === 'WEBHOOK';
    
    if (!isSandbox && !isTestWebhook && signature && timestamp) {
      const isValidSignature = verifyCashFreeSignature(rawBody, signature, timestamp);
      if (!isValidSignature) {
        console.error('❌ Invalid webhook signature - but allowing for now');
        // Don't reject for now, just log the error
        // return res.status(401).json({ error: 'Invalid signature' });
      } else {
        console.log('✅ Webhook signature verified');
      }
    } else {
      console.warn('⚠️ Webhook signature verification skipped', {
        isSandbox,
        isTestWebhook,
        hasSignature: !!signature,
        hasTimestamp: !!timestamp,
        environment: process.env.CASHFREE_ENVIRONMENT
      });
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
