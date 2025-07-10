import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { firebaseConfig } from './firebase-config-es.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Check a tournament's notification status and eligibility
 */
async function checkTournamentNotificationStatus(tournamentId) {
  if (!tournamentId) {
    console.error('❌ Error: Please provide a tournament ID');
    console.log('Usage: node check-tournament-notification-status.js TOURNAMENT_ID');
    process.exit(1);
  }

  try {
    console.log(`🔍 Checking notification status for tournament: ${tournamentId}`);
    
    // Get the tournament document
    const tournamentDoc = await getDoc(doc(db, 'tournaments', tournamentId));
    
    if (!tournamentDoc.exists()) {
      console.error(`❌ Error: Tournament ${tournamentId} not found`);
      process.exit(1);
    }
    
    const tournament = tournamentDoc.data();
    
    // Use IST timezone consistently
    const now = new Date();
    const istNow = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    
    // Calculate time to start
    const startDate = tournament.start_date instanceof Date ? tournament.start_date : 
                    (tournament.start_date.toDate ? tournament.start_date.toDate() : new Date(tournament.start_date));
    
    const minutesToStart = (startDate.getTime() - istNow.getTime()) / (1000 * 60);
    
    // Print tournament details
    console.log('\n📋 TOURNAMENT DETAILS:');
    console.log(`Name: ${tournament.name}`);
    console.log(`Status: ${tournament.status}`);
    console.log(`Start Time: ${startDate.toLocaleString()} IST`);
    console.log(`Minutes to Start: ${minutesToStart.toFixed(1)}`);
    console.log(`Notification Sent: ${tournament.notificationSent ? 'Yes' : 'No'}`);
    console.log(`Host ID: ${tournament.host_id}`);
    
    // Check if tournament is eligible for notification
    console.log('\n🔔 NOTIFICATION ELIGIBILITY:');
    
    if (tournament.status !== 'active') {
      console.log(`❌ Tournament is not active (status: ${tournament.status})`);
      console.log('Only active tournaments receive notifications');
    } else {
      console.log(`✅ Tournament is active`);
    }
    
    if (tournament.notificationSent) {
      console.log(`❌ Notification already sent`);
      console.log('Tournaments only receive one notification');
    } else {
      console.log(`✅ Notification not yet sent`);
    }
    
    if (!tournament.host_id) {
      console.log(`❌ No host_id specified`);
      console.log('Tournaments must have a host_id to receive notifications');
    } else {
      // Try to get host information
      const hostDoc = await getDoc(doc(db, 'users', tournament.host_id));
      if (!hostDoc.exists()) {
        console.log(`❌ Host user ${tournament.host_id} not found`);
      } else {
        const hostData = hostDoc.data();
        if (!hostData.email) {
          console.log(`❌ Host has no email address`);
        } else {
          console.log(`✅ Host email found: ${hostData.email}`);
        }
      }
    }
    
    // Check notification window
    if (minutesToStart >= 19 && minutesToStart <= 21) {
      console.log(`✅ Tournament is IN NOTIFICATION WINDOW NOW (19-21 minutes before start)`);
      console.log('It should receive a notification on the next API call');
    } else if (minutesToStart > 21) {
      console.log(`⏳ Tournament is not yet in notification window`);
      console.log(`Will enter window in ${(minutesToStart - 21).toFixed(1)} minutes`);
    } else if (minutesToStart < 19 && minutesToStart > 0) {
      console.log(`⌛ Tournament has passed the notification window`);
      console.log(`Window was ${(19 - minutesToStart).toFixed(1)} minutes ago`);
    } else {
      console.log(`⌛ Tournament has already started or has invalid time`);
    }
    
    // Summary
    console.log('\n📋 NOTIFICATION STATUS SUMMARY:');
    if (tournament.status === 'active' && !tournament.notificationSent && tournament.host_id && minutesToStart >= 19 && minutesToStart <= 21) {
      console.log('✅ This tournament SHOULD receive a notification on the next API call');
      console.log('The API endpoint is called every 2 minutes by cron-job.org');
    } else if (tournament.status === 'active' && !tournament.notificationSent && tournament.host_id && minutesToStart > 21) {
      console.log('⏳ This tournament WILL receive a notification when it enters the 19-21 minute window');
      console.log(`That will happen in approximately ${(minutesToStart - 21).toFixed(1)} minutes`);
    } else if (tournament.notificationSent) {
      console.log('ℹ️ This tournament has ALREADY received a notification');
    } else if (minutesToStart < 19) {
      console.log('⌛ This tournament has MISSED its notification window');
    } else {
      console.log('❌ This tournament is NOT ELIGIBLE for notifications');
      console.log('See details above for reasons');
    }
    
  } catch (error) {
    console.error(`❌ Error checking tournament: ${error}`);
  }
}

// Get tournament ID from command line arguments
const tournamentId = process.argv[2];
checkTournamentNotificationStatus(tournamentId);
