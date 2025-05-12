const crypto = require('crypto');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');

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
 * Netlify function to handle Cashfree payment webhooks
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
    // Parse webhook data
    const webhookData = JSON.parse(event.body);
    
    // Special handling for test events from Cashfree
    if (webhookData.type === 'TEST') {
      console.log('Received test webhook from Cashfree');
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, message: 'Test webhook received successfully' })
      };
    }
    
    const signature = event.headers['x-webhook-signature'] || event.headers['X-Webhook-Signature'];
    
    if (!signature) {
      console.error('Missing webhook signature');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing webhook signature' })
      };
    }
    
    // Get Cashfree secret key from environment variables
    const secretKey = process.env.CASHFREE_SECRET_KEY;
    
    // Verify webhook signature
    const isSignatureValid = verifyWebhookSignature(webhookData, signature, secretKey);
    
    if (!isSignatureValid) {
      console.error('Invalid webhook signature');
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Invalid signature' })
      };
    }
    
    console.log('Webhook signature verified successfully');
    
    // Process the payment notification
    const orderId = webhookData.data?.order?.order_id;
    
    if (!orderId) {
      console.error('Missing order ID in webhook data');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing order ID in webhook data' })
      };
    }
    
    // Prepare data to store in Firestore
    const paymentData = {
      orderId: orderId,
      orderAmount: webhookData.data?.order?.order_amount,
      orderCurrency: webhookData.data?.order?.order_currency,
      orderStatus: webhookData.data?.order?.order_status,
      paymentStatus: webhookData.data?.payment?.payment_status,
      paymentMethod: webhookData.data?.payment?.payment_method,
      paymentTime: webhookData.data?.payment?.payment_time,
      webhookData: webhookData,
      receivedAt: new Date().toISOString()
    };
    
    // Update payment status in Firestore
    await updatePaymentStatus(orderId, paymentData);
    
    // Return success response
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: 'Webhook processed successfully' })
    };
  } catch (error) {
    console.error('Error processing webhook:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to process webhook',
        details: error.message
      })
    };
  }
};
