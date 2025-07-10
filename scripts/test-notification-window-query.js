import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Test the notification window query - looks for tournaments in the 19-21 minute window
 */
async function testNotificationWindowQuery() {
  try {
    // Use IST timezone consistently
    const now = new Date();
    const istNow = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    
    console.log(`Current time: ${now.toLocaleString()} (Local)`);
    console.log(`Current time (IST): ${istNow.toLocaleString()}`);
    
    // Calculate notification window (19-21 minutes from now)
    const nineteenMinutesFromNow = new Date(istNow.getTime() + 19 * 60 * 1000);
    const twentyOneMinutesFromNow = new Date(istNow.getTime() + 21 * 60 * 1000);
    
    console.log(`Notification window: ${nineteenMinutesFromNow.toLocaleString()} to ${twentyOneMinutesFromNow.toLocaleString()}`);
    
    // Query for tournaments that are starting in the notification window (19-21 minutes)
    console.log('Searching for tournaments in notification window...');
    const tournamentsQuery = query(
      collection(db, 'tournaments'),
      where('status', '==', 'active'),
      where('start_date', '>=', nineteenMinutesFromNow),
      where('start_date', '<=', twentyOneMinutesFromNow)
    );
    
    const upcomingTournamentsSnapshot = await getDocs(tournamentsQuery);
    
    if (upcomingTournamentsSnapshot.empty) {
      console.log('No tournaments found in the notification window');
    } else {
      console.log(`Found ${upcomingTournamentsSnapshot.size} tournament(s) in notification window`);
      
      upcomingTournamentsSnapshot.forEach(tournamentDoc => {
        const tournament = tournamentDoc.data();
        const tournamentId = tournamentDoc.id;
        
        const startDate = tournament.start_date instanceof Date ? tournament.start_date : 
                        (tournament.start_date.toDate ? tournament.start_date.toDate() : new Date(tournament.start_date));
                        
        console.log(`\n----- Tournament in Notification Window -----`);
        console.log(`ID: ${tournamentId}`);
        console.log(`Name: ${tournament.name}`);
        console.log(`Start: ${startDate.toLocaleString()}`);
        console.log(`Host ID: ${tournament.host_id || 'Not set'}`);
        console.log(`Notification sent: ${tournament.notificationSent ? 'Yes' : 'No'}`);
      });
    }
    
    // Alternate approach: check all active tournaments and manually filter
    console.log('\nAlternate approach: Checking all active tournaments...');
    const allTournamentsQuery = query(
      collection(db, 'tournaments'),
      where('status', '==', 'active')
    );
    
    const allTournamentsSnapshot = await getDocs(allTournamentsQuery);
    
    if (allTournamentsSnapshot.empty) {
      console.log('No active tournaments found');
      return;
    }
    
    console.log(`Found ${allTournamentsSnapshot.size} active tournament(s)`);
    
    // Filter for tournaments in notification window
    const inWindowTournaments = [];
    
    allTournamentsSnapshot.forEach(tournamentDoc => {
      const tournament = tournamentDoc.data();
      const tournamentId = tournamentDoc.id;
      
      const startDate = tournament.start_date instanceof Date ? tournament.start_date : 
                      (tournament.start_date.toDate ? tournament.start_date.toDate() : new Date(tournament.start_date));
      
      const minutesToStart = (startDate.getTime() - istNow.getTime()) / (1000 * 60);
      
      if (minutesToStart >= 19 && minutesToStart <= 21) {
        inWindowTournaments.push({
          id: tournamentId,
          name: tournament.name,
          startDate: startDate,
          minutesToStart: minutesToStart,
          hostId: tournament.host_id,
          notificationSent: tournament.notificationSent
        });
      }
    });
    
    if (inWindowTournaments.length === 0) {
      console.log('No tournaments in 19-21 minute notification window');
    } else {
      console.log(`Found ${inWindowTournaments.length} tournament(s) in 19-21 minute window:`);
      
      inWindowTournaments.forEach(t => {
        console.log(`\n----- Tournament in 19-21 Minute Window -----`);
        console.log(`ID: ${t.id}`);
        console.log(`Name: ${t.name}`);
        console.log(`Start: ${t.startDate.toLocaleString()} (${t.minutesToStart.toFixed(1)} minutes from now)`);
        console.log(`Host ID: ${t.hostId || 'Not set'}`);
        console.log(`Notification sent: ${t.notificationSent ? 'Yes' : 'No'}`);
      });
    }
  } catch (error) {
    if (error.code === 'failed-precondition' && error.toString().includes('requires an index')) {
      console.error('Error: Missing Firestore index. You need to create a composite index for this query.');
      console.error('Please create an index for:');
      console.error('Collection: tournaments');
      console.error('Fields: status (Ascending), start_date (Ascending)');
    } else {
      console.error('Error testing notification window query:', error);
    }
  }
}

// Run the function
testNotificationWindowQuery()
  .then(() => {
    console.log('\nTest completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error in test process:', error);
    process.exit(1);
  });
