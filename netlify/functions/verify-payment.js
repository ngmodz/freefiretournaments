const axios = require('axios');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

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
 * Verify payment status from Cashfree
 */
exports.handler = async function(event, context) {
  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  const { orderId } = event.queryStringParameters;

  if (!orderId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Order ID is required' })
    };
  }

  try {
    // First, check our database for the payment status
    const paymentRef = db.collection('payments').doc(orderId);
    const paymentDoc = await paymentRef.get();

    // If we have the payment record in our database, return that status
    if (paymentDoc.exists) {
      const paymentData = paymentDoc.data();
      
      return {
        statusCode: 200,
        body: JSON.stringify({
          orderId,
          status: paymentData.status,
          amount: paymentData.amount,
          paymentId: paymentData.paymentId,
          paymentTime: paymentData.paymentTime
        })
      };
    }

    // If we don't have a record, check with Cashfree API
    // Note: For payment forms, we rely on webhooks to update our database
    // This is a fallback mechanism if the webhook hasn't been processed yet
    
    // For payment forms, we don't have direct API access, so return pending
    return {
      statusCode: 200,
      body: JSON.stringify({
        orderId,
        status: 'PENDING',
        message: 'Payment status not yet updated via webhook'
      })
    };
  } catch (error) {
    console.error(`Error verifying payment for order ${orderId}:`, error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to verify payment status',
        details: error.message
      })
    };
  }
}; 