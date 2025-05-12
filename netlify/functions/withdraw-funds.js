// Netlify serverless function to handle fund withdrawals
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
 * Get user's wallet balance
 * @param {string} userId - User ID
 * @returns {Promise<number>} - Current balance
 */
async function getWalletBalance(userId) {
  if (!db) {
    throw new Error('Firebase not initialized');
  }

  const walletRef = db.collection('wallets').doc(userId);
  const walletDoc = await walletRef.get();

  if (!walletDoc.exists) {
    return 0;
  }

  return walletDoc.data().balance || 0;
}

/**
 * Update user's wallet balance
 * @param {string} userId - User ID
 * @param {number} amount - Amount to subtract (should be negative)
 * @returns {Promise<void>}
 */
async function updateWalletBalance(userId, amount) {
  if (!db) {
    throw new Error('Firebase not initialized');
  }

  if (amount > 0) {
    throw new Error('Amount to subtract should be negative');
  }

  const walletRef = db.collection('wallets').doc(userId);
  await walletRef.update({
    balance: admin.firestore.FieldValue.increment(amount),
    lastUpdated: admin.firestore.FieldValue.serverTimestamp()
  });
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
 * Check if user has KYC completed
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} - Whether user has completed KYC
 */
async function hasCompletedKYC(userId) {
  if (!db) {
    throw new Error('Firebase not initialized');
  }

  // In a real implementation, check if user has completed KYC
  // For demonstration, always return true
  return true;
}

/**
 * Serverless function to handle fund withdrawals
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
    const { userId, amount, withdrawalMethod, upiId } = data;

    // Validate request
    if (!userId || !amount || amount <= 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid request parameters' })
      };
    }

    if (withdrawalMethod === 'upi' && !upiId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'UPI ID is required for UPI withdrawals' })
      };
    }

    // Check if user has completed KYC
    const kycCompleted = await hasCompletedKYC(userId);
    if (!kycCompleted) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'KYC verification required for withdrawals' })
      };
    }

    // Check if user has sufficient balance
    const currentBalance = await getWalletBalance(userId);
    if (currentBalance < amount) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Insufficient balance' })
      };
    }

    // In a real implementation, we would call Cashfree Payout API here
    // const payoutResponse = await initiatePayout(userId, amount, withdrawalMethod, upiId);

    // Create a transfer ID
    const transferId = `withdraw_${userId}_${Date.now()}`;

    // Update wallet balance (subtract amount)
    await updateWalletBalance(userId, -amount);

    // Record the transaction
    await addTransaction({
      userId,
      amount,
      type: 'withdrawal',
      status: 'completed',
      details: {
        transferId,
        paymentMethod: withdrawalMethod,
        recipient: upiId || 'bank'
      }
    });

    // Return success response
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        transferId,
        amount,
        message: `Withdrawal of ₹${amount} initiated successfully`
      })
    };
  } catch (error) {
    console.error('Error processing withdrawal:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error' })
    };
  }
}; 