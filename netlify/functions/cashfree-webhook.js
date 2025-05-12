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
 * @param {string} payload - Request body as string
 * @param {string} signature - X-Webhook-Signature header from Cashfree
 * @returns {boolean} - Whether the signature is valid
 */
function verifyWebhookSignature(payload, signature) {
  // In a real implementation, compute HMAC using the Cashfree secret key
  // const hmac = crypto.createHmac('sha256', process.env.CASHFREE_SECRET_KEY);
  // hmac.update(payload);
  // const computedSignature = hmac.digest('hex');
  // return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(computedSignature));
  
  // For demonstration, always return true
  return true;
}

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
 * Serverless function to handle Cashfree payment webhooks
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
    // Get webhook signature from headers
    const signature = event.headers['x-webhook-signature'] || 
                      event.headers['X-Webhook-Signature'];

    // Verify signature
    if (!signature || !verifyWebhookSignature(event.body, signature)) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Invalid signature' })
      };
    }

    // Parse webhook payload
    const data = JSON.parse(event.body);
    const { event: eventType, data: paymentData } = data;

    // Check payment status
    if (eventType === 'PAYMENT_SUCCESS') {
      const orderId = paymentData.order.orderId;
      const amount = parseFloat(paymentData.order.orderAmount);
      
      // Extract user ID from order ID (format: deposit_userId_timestamp)
      const userId = orderId.split('_')[1];
      
      if (!userId) {
        throw new Error('Invalid order ID format');
      }

      // Update user's wallet balance
      await updateWalletBalance(userId, amount);

      // Record the transaction
      await addTransaction({
        userId,
        amount,
        type: 'deposit',
        status: 'completed',
        details: {
          transactionId: paymentData.transaction.transactionId,
          paymentMethod: paymentData.payment.paymentMethod
        }
      });

      return {
        statusCode: 200,
        body: JSON.stringify({ success: true })
      };
    }
    
    // Handle other event types if needed
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: 'Event processed' })
    };
  } catch (error) {
    console.error('Error processing webhook:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' })
    };
  }
}; 