import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { firebaseConfig } from './firebase-config-es.js';
import fetch from 'node-fetch';
import readline from 'readline';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// API endpoint URL
const API_URL = 'https://freefiretournaments.vercel.app/api/tournament-notifications';

/**
 * This script monitors the notification system in real-time
 * It checks for tournaments entering the notification window and watches for changes
 */
async function monitorNotificationSystem() {
  console.log('🔔 TOURNAMENT NOTIFICATION SYSTEM MONITOR 🔔');
  console.log('==========================================');
  console.log('');
  console.log('This script will:');
  console.log('1. Monitor all active tournaments in real-time');
  console.log('2. Alert you when tournaments enter the notification window (19-21 minutes before start)');
  console.log('3. Call the API endpoint to trigger notifications');
  console.log('4. Show you when notifications are sent');
  console.log('');
  console.log('Press Ctrl+C to exit');
  console.log('');
  
  // Start time of monitoring
  const startTime = new Date();
  
  // Set up a listener for active tournaments
  const tournamentsQuery = query(
    collection(db, 'tournaments'),
    where('status', '==', 'active')
  );
  
  // First, get all current tournaments
  let currentTournaments = new Map();
  
  const initialSnapshot = await getDocs(tournamentsQuery);
  initialSnapshot.forEach(doc => {
    currentTournaments.set(doc.id, {
      id: doc.id,
      ...doc.data(),
      monitored: true
    });
  });
  
  console.log(`📋 Found ${currentTournaments.size} active tournaments`);
  
  // Set up real-time listener
  const unsubscribe = onSnapshot(tournamentsQuery, async (snapshot) => {
    // Handle tournament updates
    snapshot.docChanges().forEach(change => {
      const tournamentData = change.doc.data();
      const tournamentId = change.doc.id;
      
      if (change.type === 'added' && !currentTournaments.has(tournamentId)) {
        console.log(`➕ New tournament added: "${tournamentData.name}" (${tournamentId})`);
        currentTournaments.set(tournamentId, {
          id: tournamentId,
          ...tournamentData,
          monitored: true
        });
      } else if (change.type === 'modified') {
        const oldData = currentTournaments.get(tournamentId);
        
        // Check if notification status changed
        if (!oldData.notificationSent && tournamentData.notificationSent) {
          console.log(`🔔 Notification sent for tournament: "${tournamentData.name}" (${tournamentId})`);
        }
        
        // Update stored data
        currentTournaments.set(tournamentId, {
          id: tournamentId,
          ...tournamentData,
          monitored: true
        });
      } else if (change.type === 'removed') {
        console.log(`➖ Tournament removed: "${tournamentData.name}" (${tournamentId})`);
        currentTournaments.delete(tournamentId);
      }
    });
    
    // Check for tournaments entering notification window
    await checkNotificationWindows();
  });
  
  // Function to check notification windows and call API when needed
  async function checkNotificationWindows() {
    // Use IST timezone consistently
    const now = new Date();
    const istNow = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    
    // Show current monitoring status
    const runningTime = Math.floor((now - startTime) / 1000);
    const hours = Math.floor(runningTime / 3600);
    const minutes = Math.floor((runningTime % 3600) / 60);
    const seconds = runningTime % 60;
    
    readline.clearLine(process.stdout, 0);
    readline.cursorTo(process.stdout, 0);
    process.stdout.write(`Monitoring ${currentTournaments.size} tournaments | Running for ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} | Current IST: ${istNow.toLocaleString()}`);
    
    // Check each tournament
    currentTournaments.forEach(async (tournament) => {
      // Skip if already notified
      if (tournament.notificationSent) return;
      
      // Calculate time to start
      const startDate = tournament.start_date instanceof Date ? tournament.start_date : 
                      (tournament.start_date.toDate ? tournament.start_date.toDate() : new Date(tournament.start_date));
      
      const minutesToStart = (startDate.getTime() - istNow.getTime()) / (1000 * 60);
      
      // Check if tournament just entered notification window (between 19-21 minutes)
      if (minutesToStart >= 19 && minutesToStart <= 21) {
        // Only log once per tournament when it enters the window
        if (!tournament.inWindow) {
          console.log(`\n🚨 Tournament "${tournament.name}" (${tournament.id}) entered notification window!`);
          console.log(`   Start time: ${startDate.toLocaleString()} IST`);
          console.log(`   Minutes to start: ${minutesToStart.toFixed(1)}`);
          console.log(`   Calling API endpoint...`);
          
          // Mark as in window
          currentTournaments.set(tournament.id, {
            ...tournament,
            inWindow: true
          });
          
          // Call the API endpoint
          try {
            const response = await fetch(API_URL);
            if (!response.ok) {
              console.log(`   ❌ API call failed: ${response.status} ${response.statusText}`);
            } else {
              const result = await response.json();
              console.log(`   ✅ API call successful: ${JSON.stringify(result)}`);
            }
          } catch (error) {
            console.log(`   ❌ API call error: ${error.message}`);
          }
        }
      }
    });
  }
  
  // Check every 30 seconds
  const checkInterval = setInterval(checkNotificationWindows, 30000);
  
  // Initial check
  await checkNotificationWindows();
  
  // Handle cleanup on exit
  process.on('SIGINT', () => {
    console.log('\n\nStopping notification monitor...');
    clearInterval(checkInterval);
    unsubscribe();
    console.log('Monitor stopped. Goodbye!');
    process.exit(0);
  });
}

// Start monitoring
monitorNotificationSystem().catch(error => {
  console.error(`\nError in notification monitor: ${error.message}`);
  process.exit(1);
});
