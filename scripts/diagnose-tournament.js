import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { firebaseConfig } from './firebase-config-es.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Find and diagnose the tournament created for testing
 */
async function diagnoseTournament() {
  try {
    // Use IST timezone consistently
    const now = new Date();
    const istNow = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    
    console.log(`Current time: ${now.toLocaleString()} (Local)`);
    console.log(`Current time (IST): ${istNow.toLocaleString()}`);
    console.log('Looking for tournaments with name "nnnnnn"...');
    
    // Query for tournaments with specific name (from the screenshot)
    const tournamentsQuery = query(
      collection(db, 'tournaments'),
      where('name', '==', 'nnnnnn')
    );
    
    const tournamentSnapshot = await getDocs(tournamentsQuery);
    
    if (tournamentSnapshot.empty) {
      console.log('No tournament found with name "nnnnnn"');
      return;
    }
    
    console.log(`Found ${tournamentSnapshot.size} tournament(s) with name "nnnnnn"`);
    
    // Process each tournament
    tournamentSnapshot.forEach(tournamentDoc => {
      const tournament = tournamentDoc.data();
      const tournamentId = tournamentDoc.id;
      
      console.log('\n=== Tournament Details ===');
      console.log(`ID: ${tournamentId}`);
      console.log(`Name: ${tournament.name}`);
      console.log(`Status: ${tournament.status}`);
      
      // Format start date
      const startDate = tournament.start_date instanceof Date ? tournament.start_date : 
                      (tournament.start_date.toDate ? tournament.start_date.toDate() : new Date(tournament.start_date));
      
      console.log(`Start Date: ${startDate.toLocaleString()} (${startDate.toLocaleString("en-US", {timeZone: "Asia/Kolkata"})} IST)`);
      
      // Calculate minutes to start
      const minutesToStart = (startDate.getTime() - istNow.getTime()) / (1000 * 60);
      console.log(`Minutes until start: ${minutesToStart.toFixed(1)}`);
      
      // Check if it's within notification window
      const inNotificationWindow = minutesToStart >= 19 && minutesToStart <= 21;
      console.log(`In notification window (19-21 minutes): ${inNotificationWindow}`);
      
      // Show host details
      const hostId = tournament.host_id;
      console.log(`Host ID: ${hostId || 'Not set'}`);
      console.log(`Notification sent: ${tournament.notificationSent ? 'Yes' : 'No'}`);
      
      // Command to force send notification
      console.log('\n=== Debug Commands ===');
      console.log(`To force send notification: node scripts/force-send-notification.js ${tournamentId}`);
      
      // Show notification window times
      const nineteenMinutesMark = new Date(startDate.getTime() - 19 * 60 * 1000);
      const twentyOneMinutesMark = new Date(startDate.getTime() - 21 * 60 * 1000);
      console.log(`\nNotification window: ${twentyOneMinutesMark.toLocaleString("en-US", {timeZone: "Asia/Kolkata"})} to ${nineteenMinutesMark.toLocaleString("en-US", {timeZone: "Asia/Kolkata"})} IST`);
      
      // Current time in IST
      console.log(`Current time (IST): ${istNow.toLocaleString()}`);
    });
  } catch (error) {
    console.error('Error diagnosing tournament:', error);
  }
}

// Run the function
diagnoseTournament()
  .then(() => {
    console.log('\nTournament diagnosis completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error in diagnosis process:', error);
    process.exit(1);
  });
