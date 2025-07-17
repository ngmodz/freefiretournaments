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

async function emergencyStopEmails() {
  console.log('🚨 EMERGENCY: Stopping continuous emails by setting flags 🚨');
  
  try {
    // Get all test tournaments that might be causing issues
    const testTournaments = await db.collection('tournaments')
      .where('name', 'in', ['Aggressive Penalty Test', 'Aggressive Cancellation Test'])
      .get();
    
    console.log(`Found ${testTournaments.size} problematic tournaments`);
    
    const batch = db.batch();
    let updates = 0;
    
    for (const doc of testTournaments.docs) {
      const data = doc.data();
      console.log(`\n🔧 Fixing tournament: ${data.name} (${doc.id})`);
      console.log(`Current status: ${data.status}`);
      
      // Set ALL flags to prevent any further processing
      const updateData = {
        moderator_processed: true,
        moderator_processed_at: new Date(),
        penalty_notification_sent: true,
        penalty_notification_sent_at: new Date(),
        cancellation_notification_sent: true,
        cancellation_notification_sent_at: new Date(),
        // Ensure status is final
        status: 'cancelled'
      };
      
      batch.update(doc.ref, updateData);
      updates++;
      console.log(`✅ Will set all notification flags for ${doc.id}`);
    }
    
    if (updates > 0) {
      await batch.commit();
      console.log(`\n🎉 EMERGENCY FIX APPLIED: Updated ${updates} tournaments`);
      console.log('📧 No more duplicate emails should be sent!');
    } else {
      console.log('ℹ️ No tournaments needed updating');
    }
    
    // Double-check by listing current pending tournaments
    console.log('\n🔍 Checking for any remaining pending tournaments...');
    const pendingPenalty = await db.collection('tournaments').where('status', '==', 'pending_penalty').get();
    const pendingCancellation = await db.collection('tournaments').where('status', '==', 'pending_cancellation').get();
    
    console.log(`Pending penalty: ${pendingPenalty.size}`);
    console.log(`Pending cancellation: ${pendingCancellation.size}`);
    
    if (pendingPenalty.size === 0 && pendingCancellation.size === 0) {
      console.log('✅ No pending tournaments found - emails should stop!');
    } else {
      console.log('⚠️ Still have pending tournaments - may need additional cleanup');
    }
    
  } catch (error) {
    console.error('❌ Error during emergency fix:', error);
  }
}

emergencyStopEmails().then(() => {
  console.log('\n--- Emergency fix complete ---');
  process.exit(0);
});
