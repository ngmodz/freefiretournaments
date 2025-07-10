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
 * Check for tournaments in the exact 19-21 minute window
 */
async function checkNotificationWindow() {
  try {
    // Use IST timezone consistently
    const now = new Date();
    const istNow = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    
    console.log(`Current time: ${now.toLocaleString()} (Local)`);
    console.log(`Current time (IST): ${istNow.toLocaleString()}`);
    
    // Calculate the notification window (19-21 minutes from now)
    const startWindow = new Date(istNow.getTime() + 19 * 60 * 1000);
    const endWindow = new Date(istNow.getTime() + 21 * 60 * 1000);
    
    console.log(`Looking for tournaments that start between:`);
    console.log(`  ${startWindow.toLocaleString()} and ${endWindow.toLocaleString()} IST`);
    console.log(`  (which is 19-21 minutes from now)`);
    
    // Get all active tournaments 
    const tournamentsQuery = query(
      collection(db, 'tournaments'),
      where('status', '==', 'active')
    );
    
    const tournamentsSnapshot = await getDocs(tournamentsQuery);
    
    if (tournamentsSnapshot.empty) {
      console.log('No active tournaments found');
      return;
    }
    
    console.log(`\nFound ${tournamentsSnapshot.size} active tournaments, checking each...`);
    
    // Check each tournament to see if it falls in the 19-21 minute window
    let inWindowCount = 0;
    
    for (const tournamentDoc of tournamentsSnapshot.docs) {
      const tournament = tournamentDoc.data();
      const tournamentId = tournamentDoc.id;
      
      // Get the start date
      const startDate = tournament.start_date instanceof Date ? tournament.start_date : 
                      (tournament.start_date.toDate ? tournament.start_date.toDate() : new Date(tournament.start_date));
      
      // Calculate minutes until start
      const minutesToStart = (startDate.getTime() - istNow.getTime()) / (1000 * 60);
      
      // Check if it's in the 19-21 minute window
      const inWindow = minutesToStart >= 19 && minutesToStart <= 21;
      
      console.log(`\nTournament: ${tournament.name} (${tournamentId})`);
      console.log(`  Start time: ${startDate.toLocaleString()} (${minutesToStart.toFixed(1)} minutes from now)`);
      console.log(`  In 19-21 minute window: ${inWindow ? 'YES - SHOULD SEND NOTIFICATION' : 'no - outside window'}`);
      console.log(`  Notification already sent: ${tournament.notificationSent ? 'Yes' : 'No'}`);
      
      if (inWindow) {
        inWindowCount++;
        console.log(`  → THIS TOURNAMENT SHOULD RECEIVE A NOTIFICATION`);
      }
    }
    
    console.log(`\n=== SUMMARY ===`);
    console.log(`Total active tournaments: ${tournamentsSnapshot.size}`);
    console.log(`Tournaments in 19-21 minute window: ${inWindowCount}`);
    
    if (inWindowCount > 0) {
      console.log(`\n✅ Tournaments found that should receive notifications!`);
      console.log(`To send notifications manually, run: node scripts/send-tournament-notifications.js`);
    } else {
      console.log(`\n❌ No tournaments found that need notifications right now.`);
      console.log(`Try again in a few minutes or create a new test tournament.`);
    }
    
  } catch (error) {
    console.error('Error checking notification window:', error);
  }
}

// Run the function
checkNotificationWindow()
  .then(() => {
    console.log('\nCheck completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nError in check process:', error);
    process.exit(1);
  });
