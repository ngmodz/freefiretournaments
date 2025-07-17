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

async function checkTournamentStatus() {
  console.log('--- Checking Tournament Status ---');
  
  try {
    // Check for test tournaments
    const testTournaments = await db.collection('tournaments')
      .where('name', 'in', ['Aggressive Penalty Test', 'Aggressive Cancellation Test'])
      .get();
    
    console.log(`Found ${testTournaments.size} test tournaments`);
    
    for (const doc of testTournaments.docs) {
      const data = doc.data();
      console.log(`\n--- Tournament: ${data.name} ---`);
      console.log(`ID: ${doc.id}`);
      console.log(`Status: ${data.status}`);
      console.log(`Host ID: ${data.host_id}`);
      console.log(`Moderator Processed: ${data.moderator_processed}`);
      console.log(`Penalty Notification Sent: ${data.penalty_notification_sent}`);
      console.log(`Cancellation Notification Sent: ${data.cancellation_notification_sent}`);
      console.log(`Host Penalized: ${data.host_penalized}`);
    }
    
    // Check credit transactions for the host
    console.log('\n--- Recent Credit Transactions ---');
    const transactions = await db.collection('creditTransactions')
      .where('userId', '==', 'EaiefFlrNzMgpPEBUjyJvZ4Ydlx1')
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();
    
    for (const doc of transactions.docs) {
      const data = doc.data();
      console.log(`\nTransaction: ${data.type}`);
      console.log(`Amount: ${data.amount}`);
      console.log(`Wallet Type: ${data.walletType}`);
      console.log(`Description: ${data.description}`);
      console.log(`Created: ${data.createdAt?.toDate()}`);
    }
    
  } catch (error) {
    console.error('❌ Error during check:', error);
  }
}

checkTournamentStatus().then(() => {
  console.log('\n--- Check complete ---');
  process.exit(0);
});
