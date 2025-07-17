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

async function cleanupDuplicateFlags() {
  console.log('--- Cleaning up tournament duplicate flags ---');
  
  try {
    // Check for tournaments that might be stuck in pending states without proper flags
    const pendingPenaltyQuery = await db.collection('tournaments').where('status', '==', 'pending_penalty').get();
    const pendingCancellationQuery = await db.collection('tournaments').where('status', '==', 'pending_cancellation').get();
    
    console.log(`Found ${pendingPenaltyQuery.size} tournaments pending penalty`);
    console.log(`Found ${pendingCancellationQuery.size} tournaments pending cancellation`);
    
    // Reset any tournaments that are stuck in pending states
    const batch = db.batch();
    let updates = 0;
    
    for (const doc of pendingPenaltyQuery.docs) {
      const data = doc.data();
      console.log(`Penalty tournament: ${doc.id} - ${data.name} - penalty_notification_sent: ${data.penalty_notification_sent}`);
      
      // If notification was already sent, move to penalty_applied
      if (data.penalty_notification_sent) {
        batch.update(doc.ref, { status: 'penalty_applied' });
        updates++;
        console.log(`→ Moving ${doc.id} to penalty_applied status`);
      }
    }
    
    for (const doc of pendingCancellationQuery.docs) {
      const data = doc.data();
      console.log(`Cancellation tournament: ${doc.id} - ${data.name} - cancellation_notification_sent: ${data.cancellation_notification_sent}`);
      
      // If notification was already sent, move to cancelled
      if (data.cancellation_notification_sent) {
        batch.update(doc.ref, { status: 'cancelled' });
        updates++;
        console.log(`→ Moving ${doc.id} to cancelled status`);
      }
    }
    
    if (updates > 0) {
      await batch.commit();
      console.log(`✅ Updated ${updates} tournaments to prevent duplicates`);
    } else {
      console.log('✅ No cleanup needed');
    }
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

cleanupDuplicateFlags().then(() => {
  console.log('--- Cleanup complete ---');
  process.exit(0);
});
