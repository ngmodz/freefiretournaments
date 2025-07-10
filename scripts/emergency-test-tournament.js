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

async function createTestTournamentInWindow() {
  try {
    const now = new Date();
    const istNow = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    
    // Create a tournament that starts in exactly 20 minutes (in notification window)
    const startTime = new Date(istNow.getTime() + 20 * 60 * 1000);
    
    console.log(`Current IST time: ${istNow.toLocaleString()}`);
    console.log(`Creating tournament to start at: ${startTime.toLocaleString()}`);
    console.log(`This tournament should trigger notification immediately!`);
    
    const tournamentData = {
      name: `Notification Test ${Date.now()}`,
      mode: 'Squad',
      map: 'Bermuda',
      room_type: 'Regular',
      max_players: 20,
      filled_spots: 5,
      entry_fee: 0,
      prize_pool: 0,
      start_date: Timestamp.fromDate(startTime),
      status: 'active',
      host_id: 'aDYdh0V2SwXt45Y11Iqti4UdM5o1', // Using known host ID
      notificationSent: false,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now()
    };
    
    const docRef = await addDoc(collection(db, 'tournaments'), tournamentData);
    console.log(`✅ Created test tournament with ID: ${docRef.id}`);
    console.log(`Host ID: aDYdh0V2SwXt45Y11Iqti4UdM5o1`);
    console.log(`Now the API should find this tournament and send notification!`);
    
  } catch (error) {
    console.error('❌ Error creating tournament:', error);
  }
}

createTestTournamentInWindow();
