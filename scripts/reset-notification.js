import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import { firebaseConfig } from './firebase-config-es.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const tournamentId = process.argv[2];

if (!tournamentId) {
  console.error('Please provide tournament ID as argument');
  process.exit(1);
}

try {
  await updateDoc(doc(db, 'tournaments', tournamentId), {
    notificationSent: false,
    notificationSentAt: null
  });
  
  console.log(`✅ Reset notification status for tournament ${tournamentId}`);
} catch (error) {
  console.error('❌ Error resetting notification status:', error.message);
}
