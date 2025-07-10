import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';
import { firebaseConfig } from './firebase-config-es.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Create a test tournament that will enter the notification window soon
 * This tournament starts in 23 minutes, so it will enter the notification window in 2-4 minutes
 * Perfect for testing the automatic notification via cron-job.org
 */
async function createAutomationTestTournament() {
  try {
    // Create a tournament that starts in 23 minutes using IST
    // This will enter the 19-21 minute notification window in 2-4 minutes
    const now = new Date();
    const istNow = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    const startTime = new Date(istNow.getTime() + 23 * 60 * 1000); // 23 minutes from now
    
    console.log(`⏰ Current IST time: ${istNow.toLocaleString()}`);
    console.log(`🎯 Creating tournament that starts at: ${startTime.toLocaleString()} IST`);
    console.log(`🕐 That's in 23 minutes from now`);
    console.log('');
    
    // Ensure we have a host ID with a valid email
    const hostId = 'test-host-automation'; // Make sure this user exists with a valid email
    console.log(`👤 Using host ID: ${hostId}`);
    console.log('ℹ️ Make sure this user exists in your Firestore with a valid email');
    
    const testTournament = {
      name: "AUTOMATION TEST: Notification System",
      status: "active",
      mode: "Solo",
      map: "Bermuda",
      room_type: "Classic",
      max_players: 12,
      filled_spots: 8,
      entry_fee: 10,
      prize_pool: 100,
      start_date: Timestamp.fromDate(startTime),
      host_id: hostId,
      notificationSent: false,
      created_at: Timestamp.now()
    };
    
    const docRef = await addDoc(collection(db, 'tournaments'), testTournament);
    
    console.log('✅ Test tournament created successfully!');
    console.log(`📍 Tournament ID: ${docRef.id}`);
    console.log(`⏰ Start time: ${startTime.toLocaleString()} IST`);
    console.log(`📧 Host ID: ${testTournament.host_id}`);
    console.log('');
    
    console.log('🤖 AUTOMATION TEST TIMELINE:');
    console.log(`1. Created tournament starting in 23 minutes at ${startTime.toLocaleString()} IST`);
    
    // Calculate when it will enter notification window
    const enterWindowTime = new Date(startTime.getTime() - 21 * 60 * 1000);
    console.log(`2. Tournament will enter notification window at ${enterWindowTime.toLocaleString()} IST`);
    console.log(`   (That's in about ${Math.round((enterWindowTime - istNow) / (1000 * 60))} minutes from now)`);
    
    // Calculate when it will exit notification window
    const exitWindowTime = new Date(startTime.getTime() - 19 * 60 * 1000);
    console.log(`3. Tournament will exit notification window at ${exitWindowTime.toLocaleString()} IST`);
    
    console.log('');
    console.log('📡 AUTOMATION TEST PROCESS:');
    console.log('1. cron-job.org hits your API endpoint every 2 minutes');
    console.log('2. When tournament enters the 19-21 minute window, notification will be sent');
    console.log('3. Check your email for the notification');
    console.log('4. No manual intervention should be required!');
    console.log('');
    console.log('🔍 If no notification is received, use these scripts:');
    console.log('  - node scripts/verify-cron-job-setup.js (to check API response)');
    console.log('  - node scripts/check-environment-variables.js (to verify env variables)');
    console.log('  - node scripts/check-notification-window.js (to see if any tournaments are in window)');
    
  } catch (error) {
    console.error('❌ Error creating test tournament:', error);
  }
}

// Run the function
createAutomationTestTournament();
