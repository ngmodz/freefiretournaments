// Netlify serverless function to initiate payment with Cashfree
const admin = require('firebase-admin');

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
 * Serverless function to initiate payment with Cashfree
 * In a real implementation, this would:
 * 1. Validate the request
 * 2. Call Cashfree API to create an order
 * 3. Return the order token for the frontend to initialize the payment
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
    // Parse request body
    const data = JSON.parse(event.body);
    const { userId, amount, name, email, phone } = data;

    // Validate request
    if (!userId || !amount || amount < 100) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid request. Amount must be at least ₹100.' })
      };
    }

    // In a real implementation, we would call Cashfree API here
    // const cashfreeResponse = await initiatePayment(userId, amount, name, email, phone);

    // For demonstration, we'll create a mock response
    const orderId = `deposit_${userId}_${Date.now()}`;
    const mockPaymentLink = `https://example.com/pay/${orderId}`;

    // For demonstration purposes only - return success
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        orderId: orderId,
        amount: amount,
        paymentLink: mockPaymentLink,
        token: 'mock_token_123', // Cashfree would provide this
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 min expiry
      })
    };
  } catch (error) {
    console.error('Error initiating payment:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' })
    };
  }
}; 