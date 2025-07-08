import admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
let db;
if (!admin.apps.length) {
  try {
    let serviceAccount;
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } else {
      throw new Error('Firebase credentials not available');
    }
    db = admin.firestore();
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
  }
} else {
  db = admin.firestore();
}

/**
 * Debug endpoint to manually add credits for successful payments
 */
export default async function handler(req, res) {
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
    const { userId, packageType, creditsAmount, orderId, adminKey } = req.body;

    // Simple admin check (you should use a more secure method in production)
    if (adminKey !== 'debug-2025-credits') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!userId || !packageType || !creditsAmount || !orderId) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId, packageType, creditsAmount, orderId' 
      });
    }

    // Get user document
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: `User not found: ${userId}` });
    }

    const userData = userDoc.data();
    const currentCredits = packageType === 'host' 
      ? (userData.wallet?.hostCredits || 0)
      : (userData.wallet?.tournamentCredits || 0);

    // Update user wallet
    const updates = {};
    if (packageType === 'host') {
      updates['wallet.hostCredits'] = admin.firestore.FieldValue.increment(creditsAmount);
      updates['wallet.totalPurchasedHostCredits'] = admin.firestore.FieldValue.increment(creditsAmount);
    } else {
      updates['wallet.tournamentCredits'] = admin.firestore.FieldValue.increment(creditsAmount);
      updates['wallet.totalPurchasedTournamentCredits'] = admin.firestore.FieldValue.increment(creditsAmount);
    }
    
    updates['wallet.firstPurchaseCompleted'] = true;
    updates['wallet.lastUpdated'] = admin.firestore.FieldValue.serverTimestamp();

    await userRef.update(updates);

    // Create transaction record
    await db.collection('creditTransactions').add({
      userId,
      type: packageType === 'host' ? 'host_credit_purchase' : 'tournament_credit_purchase',
      amount: creditsAmount,
      value: creditsAmount, // Using credits as value for debug
      balanceBefore: currentCredits,
      balanceAfter: currentCredits + creditsAmount,
      walletType: packageType === 'host' ? 'hostCredits' : 'tournamentCredits',
      description: `Manual credit addition via debug endpoint`,
      transactionDetails: {
        orderId,
        status: 'completed',
        debugAdded: true
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`✅ Debug: Added ${creditsAmount} ${packageType} credits to user ${userId}`);

    res.status(200).json({
      success: true,
      message: `Successfully added ${creditsAmount} ${packageType} credits to user ${userId}`,
      userId,
      packageType,
      creditsAmount,
      orderId
    });

  } catch (error) {
    console.error('Error in debug add credits:', error);
    res.status(500).json({
      error: error.message || 'Internal server error',
      success: false
    });
  }
}
