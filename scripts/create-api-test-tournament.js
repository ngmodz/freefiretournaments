import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';
import { firebaseConfig } from './firebase-config-es.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function createNotificationTestTournament() {
  try {
    const now = new Date();
    const istNow = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    
    // Create a tournament that starts in exactly 20 minutes from now
    const startTime = new Date(istNow.getTime() + 20 * 60 * 1000);
    
    console.log(`Current time: ${istNow.toLocaleString()} IST`);
    console.log(`Creating tournament to start at: ${startTime.toLocaleString()} IST`);
    console.log(`Tournament will start in exactly 20 minutes`);
    
    const tournamentData = {
      name: `API Test Tournament ${Date.now()}`,
      mode: 'Squad',
      map: 'Bermuda',
      room_type: 'Regular',
      max_players: 20,
      filled_spots: 5,
      entry_fee: 0,
      prize_pool: 0,
      start_date: Timestamp.fromDate(startTime),
      status: 'active',
      host_id: 'aDYdh0V2SwXt45Y11Iqti4UdM5o1', // Using existing host ID
      notificationSent: false,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now()
    };
    
    const docRef = await addDoc(collection(db, 'tournaments'), tournamentData);
    console.log(`✅ Test tournament created with ID: ${docRef.id}`);
    console.log(`This tournament should trigger a notification in the next API call`);
    
    return docRef.id;
    
  } catch (error) {
    console.error('❌ Error creating test tournament:', error);
    throw error;
  }
}

createNotificationTestTournament()
  .then(id => {
    console.log(`Tournament ID: ${id}`);
    console.log(`Now test the API in 1-2 minutes to see if notification is sent`);
  })
  .catch(error => {
    console.error('Error:', error);
  });
