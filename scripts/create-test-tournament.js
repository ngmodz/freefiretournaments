import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';
import { firebaseConfig } from './firebase-config-es.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Create a test tournament that will trigger a notification in 20 minutes
 */
async function createTestTournament() {
  try {
    // Create a tournament that starts in 20 minutes using IST
    const now = new Date();
    const istNow = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    const startTime = new Date(istNow.getTime() + 20 * 60 * 1000);
    
    const testTournament = {
      name: "Test Notification Tournament",
      status: "active",
      mode: "Solo",
      map: "Bermuda",
      room_type: "Classic",
      max_players: 12,
      filled_spots: 8,
      entry_fee: 10,
      prize_pool: 100,
      start_date: Timestamp.fromDate(startTime),
      host_id: "test-host-id", // Replace with a real user ID that has an email
      notificationSent: false,
      created_at: Timestamp.now()
    };

    const docRef = await addDoc(collection(db, 'tournaments'), testTournament);
    
    console.log('✅ Test tournament created successfully!');
    console.log(`📍 Tournament ID: ${docRef.id}`);
    console.log(`⏰ Start time: ${startTime.toLocaleString()}`);
    console.log(`📧 Host ID: ${testTournament.host_id}`);
    console.log('');
    console.log('⚠️  NOTE: Make sure the host_id exists in your users collection with a valid email address.');
    console.log('');
    console.log('🔍 To test notification:');
    console.log('1. Ensure the Firestore index is created and active');
    console.log('2. Wait until 19-21 minutes before the start time');
    console.log('3. Run: node scripts/send-tournament-notifications.js');
    console.log('4. Or call the API: GET /api/tournament-notifications');
    console.log('');
    console.log('🗑️  To clean up: Delete this tournament from Firestore console after testing');

  } catch (error) {
    console.error('❌ Error creating test tournament:', error);
    
    if (error.code === 'failed-precondition') {
      console.log('');
      console.log('💡 This error might be due to missing Firestore index.');
      console.log('   Create the index first, then try again.');
    }
  }
}

// Run the function
createTestTournament();
