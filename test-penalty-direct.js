import 'dotenv/config';
import admin from 'firebase-admin';

// Initialize Firebase
let serviceAccount;
try {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} catch (error) {
  console.error('Error parsing FIREBASE_SERVICE_ACCOUNT from .env file.', error);
  process.exit(1);
}

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (error) {
  if (error.code === 'app/duplicate-app') {
    console.log('Firebase Admin already initialized.');
  } else {
    console.error('Firebase Admin initialization error:', error);
    process.exit(1);
  }
}

const db = admin.firestore();

async function testPenaltyFunction() {
  console.log('--- Testing Penalty Function Directly ---');
  
  const hostId = 'EaiefFlrNzMgpPEBUjyJvZ4Ydlx1';
  const testTournament = {
    id: 'test-penalty-123',
    name: 'Direct Test Penalty'
  };
  
  try {
    // Test the penalty function directly
    const penaltyAmount = 10;
    const userRef = db.collection("users").doc(hostId);
    
    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) {
        throw new Error(`Host user ${hostId} not found`);
      }

      const wallet = userDoc.data().wallet || {};
      const currentTournamentCredits = wallet.tournamentCredits || 0;
      const newTournamentCredits = currentTournamentCredits - penaltyAmount;

      // Print debug info
      console.log(`Current Tournament Credits: ${currentTournamentCredits}`);
      console.log(`New Tournament Credits: ${newTournamentCredits}`);
      
      // Update wallet
      transaction.update(userRef, { "wallet.tournamentCredits": newTournamentCredits });

      // Create transaction record
      const transactionData = {
        userId: hostId,
        type: "host_penalty",
        amount: -penaltyAmount,
        balanceBefore: currentTournamentCredits,
        balanceAfter: newTournamentCredits,
        walletType: "tournamentCredits", // THIS SHOULD BE tournamentCredits!
        description: `Direct test penalty: ${testTournament.name}`,
        transactionDetails: {
          tournamentId: testTournament.id,
          tournamentName: testTournament.name,
        },
        createdAt: new Date()
      };
      
      console.log('Transaction Data to be saved:', JSON.stringify(transactionData, null, 2));
      
      const newDocRef = db.collection("creditTransactions").doc();
      transaction.set(newDocRef, transactionData);
    });
    
    console.log('✅ Direct penalty test completed successfully');
    
    // Check the latest transaction
    const latestTransaction = await db.collection('creditTransactions')
      .where('userId', '==', hostId)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();
    
    if (!latestTransaction.empty) {
      const data = latestTransaction.docs[0].data();
      console.log('\n--- Latest Transaction from Database ---');
      console.log(`Wallet Type: ${data.walletType}`);
      console.log(`Amount: ${data.amount}`);
      console.log(`Description: ${data.description}`);
    }
    
  } catch (error) {
    console.error('❌ Error during direct penalty test:', error);
  }
}

testPenaltyFunction().then(() => {
  console.log('\n--- Direct test complete ---');
  process.exit(0);
});
