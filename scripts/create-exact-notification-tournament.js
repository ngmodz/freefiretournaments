import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';
import { firebaseConfig } from './firebase-config-es.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Create a test tournament that will trigger a notification in 20 minutes
 */
async function createExactNotificationTournament() {
  try {
    // Create a tournament that starts in exactly 20 minutes using IST
    const now = new Date();
    const istNow = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    const startTime = new Date(istNow.getTime() + 20 * 60 * 1000);
    
    console.log(`Current time: ${istNow.toLocaleString()} IST`);
    console.log(`Creating tournament to start at: ${startTime.toLocaleString()} IST`);
    console.log(`Tournament will start in exactly 20 minutes`);
    console.log(`This will enter the 19-21 minute notification window immediately`);
    
    const testTournament = {
      name: `Test-${Math.floor(Math.random() * 10000)}`,
      status: "active",
      mode: "Solo",
      map: "Bermuda",
      room_type: "Classic",
      max_players: 12,
      filled_spots: 8,
      entry_fee: 10,
      prize_pool: 100,
      start_date: Timestamp.fromDate(startTime),
      host_id: "aDYdh0V2SwXt45Y11Iqti4UdM5o1", // Using your existing host ID
      notificationSent: false,
      created_at: Timestamp.now()
    };

    const docRef = await addDoc(collection(db, 'tournaments'), testTournament);
    
    console.log('\n✅ Tournament created successfully!');
    console.log(`📍 Tournament ID: ${docRef.id}`);
    console.log(`📝 Tournament Name: ${testTournament.name}`);
    console.log(`⏰ Start time: ${startTime.toLocaleString()} IST`);
    console.log(`📧 Host ID: ${testTournament.host_id}`);
    
    console.log('\n🔍 Next Steps:');
    console.log('1. Run: node scripts/check-notification-window.js');
    console.log('   This will check if the tournament is in the notification window');
    console.log('2. Run: node scripts/fixed-notifications.js');
    console.log('   This will send the notification if the tournament is in the window');
    console.log('3. Check your email at: microft1007@gmail.com');

  } catch (error) {
    console.error('❌ Error creating test tournament:', error);
  }
}

// Run the function
createExactNotificationTournament();
