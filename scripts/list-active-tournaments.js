import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
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
 * List all active tournaments
 */
async function listActiveTournaments() {
  try {
    // Use IST timezone consistently
    const now = new Date();
    const istNow = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    
    console.log(`Current time: ${now.toLocaleString()} (Local)`);
    console.log(`Current time (IST): ${istNow.toLocaleString()}`);
    
    // Query for all active tournaments
    const tournamentsQuery = query(
      collection(db, 'tournaments'),
      where('status', '==', 'active')
    );
    
    const tournamentSnapshot = await getDocs(tournamentsQuery);
    
    if (tournamentSnapshot.empty) {
      console.log('No active tournaments found.');
      return;
    }
    
    console.log(`Found ${tournamentSnapshot.size} active tournament(s)`);
    
    // Process each tournament
    tournamentSnapshot.forEach(tournamentDoc => {
      const tournament = tournamentDoc.data();
      const tournamentId = tournamentDoc.id;
      
      // Format start date
      const startDate = tournament.start_date instanceof Date ? tournament.start_date : 
                      (tournament.start_date.toDate ? tournament.start_date.toDate() : new Date(tournament.start_date));
      
      // Calculate minutes to start
      const minutesToStart = (startDate.getTime() - istNow.getTime()) / (1000 * 60);
      
      // Check if it's within notification window
      const inNotificationWindow = minutesToStart >= 19 && minutesToStart <= 21;
      
      console.log(`\n----- Tournament -----`);
      console.log(`ID: ${tournamentId}`);
      console.log(`Name: ${tournament.name}`);
      console.log(`Start: ${startDate.toLocaleString()} (${minutesToStart.toFixed(1)} minutes from now)`);
      console.log(`Status: ${tournament.status}`);
      console.log(`In notification window: ${inNotificationWindow}`);
      console.log(`Host ID: ${tournament.host_id || 'Not set'}`);
      console.log(`Notification sent: ${tournament.notificationSent ? 'Yes' : 'No'}`);
    });
    
    console.log('\nTo check if a specific tournament should receive notification, use:');
    console.log('node scripts/diagnose-tournament.js');
    console.log('\nTo manually send a notification to a specific tournament, use:');
    console.log('node scripts/force-send-notification.js <tournament-id>');
  } catch (error) {
    console.error('Error listing tournaments:', error);
  }
}

// Run the function
listActiveTournaments()
  .then(() => {
    console.log('\nListing completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error in listing process:', error);
    process.exit(1);
  });
