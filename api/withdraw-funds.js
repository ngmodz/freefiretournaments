import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK
let serviceAccount;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  }
} catch (error) {
  console.error('Error parsing Firebase service account:', error);
}

const firebaseConfig = serviceAccount ? { credential: cert(serviceAccount) } : {};
initializeApp(firebaseConfig);

const db = getFirestore();

/**
 * Get user's wallet balance
 * @param {string} userId - User ID
 * @returns {Promise<number>} - Current balance
 */
async function getWalletBalance(userId) {
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
  if (amount > 0) {
    throw new Error('Amount to subtract should be negative');
  }

  const walletRef = db.collection('wallets').doc(userId);
  await walletRef.update({
    balance: FieldValue.increment(amount),
    lastUpdated: FieldValue.serverTimestamp()
  });
}

/**
 * Add transaction record to Firestore
 * @param {Object} transaction - Transaction details
 * @returns {Promise<string>} - Transaction ID
 */
async function addTransaction(transaction) {
  const transactionsRef = db.collection('transactions');
  const newTransaction = {
    ...transaction,
    date: FieldValue.serverTimestamp()
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
  // In a real implementation, check if user has completed KYC
  // For demonstration, always return true
  return true;
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, amount, withdrawalMethod, upiId } = req.body;

    if (!userId || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid request parameters' });
    }

    if (withdrawalMethod === 'upi' && !upiId) {
      return res.status(400).json({ error: 'UPI ID is required for UPI withdrawals' });
    }

    const kycCompleted = await hasCompletedKYC(userId);
    if (!kycCompleted) {
      return res.status(403).json({ error: 'KYC verification required for withdrawals' });
    }

    const currentBalance = await getWalletBalance(userId);
    if (currentBalance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // In a real implementation, we would call Payout API here
    const transferId = `withdraw_${userId}_${Date.now()}`;

    await updateWalletBalance(userId, -amount);

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

    return res.status(200).json({
      success: true,
      transferId,
      amount,
      message: `Withdrawal of ₹${amount} initiated successfully`
    });
  } catch (error) {
    console.error('Error processing withdrawal:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
} 