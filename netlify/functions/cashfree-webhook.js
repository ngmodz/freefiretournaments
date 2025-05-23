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
 * @param {string} webhookSecret - Your Cashfree webhook secret key
 * @returns {boolean} - Whether the signature is valid
 */
function verifyWebhookSignature(payload, signature, webhookSecret) {
  if (!payload || !signature || !webhookSecret) {
    console.error('Missing payload, signature, or webhookSecret for verification');
    return false;
  }
  try {
    const hmac = crypto.createHmac('sha256', webhookSecret);
    hmac.update(payload);
    const computedSignature = hmac.digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(computedSignature));
  } catch (error) {
    console.error('Error during webhook signature verification:', error);
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
                      event.headers['X-Webhook-Signature'] || 
                      event.headers['x-cf-signature']; // Added x-cf-signature as per recent Cashfree docs

    // Verify signature
    const webhookSecret = process.env.CASHFREE_SECRET_KEY;
    if (!webhookSecret) {
      console.error('CASHFREE_SECRET_KEY is not set.');
      return { statusCode: 500, body: JSON.stringify({ error: 'API secret key (CASHFREE_SECRET_KEY) not configured for webhook verification' }) };
    }

    if (!signature || !verifyWebhookSignature(event.body, signature, webhookSecret)) {
      console.warn('Invalid webhook signature attempt.', { signature, bodyLength: event.body.length });
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Invalid signature' })
      };
    }

    // Parse webhook payload
    const payload = JSON.parse(event.body);
    // const { event: eventType, data: paymentData } = data; // Old structure

    // According to Cashfree docs for orders API, webhook structure is different
    // Key fields: data.order.order_status, data.order.order_id, data.payment.payment_status, data.order.order_meta
    console.log('Received Cashfree webhook payload:', JSON.stringify(payload, null, 2));

    const orderData = payload.data?.order;
    const paymentData = payload.data?.payment;
    const transactionData = payload.data?.transaction; // Cashfree may send this as well

    if (!orderData || !transactionData) {
      console.error('Webhook payload missing order or transaction data.', payload);
      return { statusCode: 400, body: JSON.stringify({ error: 'Malformed webhook payload' }) };
    }

    // Check payment status (using PAID and SUCCESS as per guide)
    if (orderData.order_status === 'PAID' && transactionData.tx_status === 'SUCCESS') { // tx_status can also be used
      const orderMeta = orderData.order_meta;
      const orderId = orderData.order_id;

      if (!orderMeta) {
        console.error('Webhook payload missing order_meta.', payload);
        return { statusCode: 400, body: JSON.stringify({ error: 'Missing order_meta in webhook' }) };
      }

      const { userId, amount, purchaseType } = orderMeta;
      const paymentAmount = parseFloat(orderData.order_amount); // Use order_amount from the main order data

      if (!userId || amount === undefined || !purchaseType) {
         console.error('Missing userId, amount, or purchaseType in order_meta.', orderMeta);
         return { statusCode: 400, body: JSON.stringify({ error: 'Invalid order_meta content' }) };
      }
      
      // Ensure the amount from order_meta matches the actual paid amount for security, if necessary
      if (parseFloat(amount) !== paymentAmount) {
        console.warn(`Amount mismatch in order_meta (${amount}) vs order_data (${paymentAmount}) for order ${orderId}. Proceeding with order_amount.`);
        // Potentially flag this or handle as an error depending on security requirements
      }

      if (purchaseType === 'walletTopUp') {
        console.log(`Processing walletTopUp for userId: ${userId}, amount: ${paymentAmount}`);
        // Update user's wallet balance
        await updateWalletBalance(userId, paymentAmount);

        // Record the transaction
        await addTransaction({
          userId,
          amount: paymentAmount,
          type: 'deposit', // Keeping as 'deposit' for now for the generic wallet
          status: 'completed',
          details: {
            orderId: orderId,
            transactionId: transactionData.cf_payment_id || transactionData.cf_tx_id || transactionData.tx_id, // Use cf_payment_id or tx_id
            paymentMethod: paymentData?.payment_method || transactionData.payment_mode || 'N/A' // payment_method might be in paymentData if available
          }
        });
        console.log(`Wallet updated and transaction logged for userId: ${userId}`);
      } else {
        console.log(`Received webhook for unhandled purchaseType: ${purchaseType} for order ${orderId}`);
      }

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