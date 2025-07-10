import admin from 'firebase-admin';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Initialize Firebase Admin SDK
let serviceAccount;
try {
  // Try to read from environment variable first
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } 
  // Fallback to service account file if environment variable fails
  else if (process.env.SERVICE_ACCOUNT_KEY_PATH && fs.existsSync(process.env.SERVICE_ACCOUNT_KEY_PATH)) {
    const serviceAccountFile = fs.readFileSync(process.env.SERVICE_ACCOUNT_KEY_PATH, 'utf8');
    serviceAccount = JSON.parse(serviceAccountFile);
  }
  // Manual fallback for this project - load from service account file or exit
  else {
    console.error('No Firebase service account found. Please set SERVICE_ACCOUNT_KEY_PATH in your .env file');
    process.exit(1);
  }

  if (!serviceAccount.project_id) {
    throw new Error('Invalid service account configuration');
  }
} catch (error) {
  console.error('❌ Error parsing Firebase service account:', error);
  console.log('💡 Make sure Firebase credentials are properly configured');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function updateTournamentTime() {
  try {
    const tournamentId = 'qGxsD7oc7YI8y3Ic1fUR';
    
    // Set start time to exactly 20 minutes from now in IST
    const now = new Date();
    const istNow = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    const newStartTime = new Date(istNow.getTime() + 20 * 60 * 1000);
    
    await db.collection('tournaments').doc(tournamentId).update({
      start_date: admin.firestore.Timestamp.fromDate(newStartTime),
      notificationSent: false // Reset notification flag
    });
    
    console.log('✅ Tournament updated successfully!');
    console.log(`⏰ New start time (IST): ${newStartTime.toLocaleString('en-US', {timeZone: 'Asia/Kolkata'})}`);
    console.log('🕐 That\'s exactly 20 minutes from now in IST');
    console.log('');
    console.log('🧪 Now test the notification system:');
    console.log('1. Wait 1 minute (to get into 19-21 minute window)');
    console.log('2. Run: node scripts/send-tournament-notifications.js');
    console.log('3. Or call: https://your-app.vercel.app/api/tournament-notifications');
    console.log('4. Check microft1007@gmail.com for notification');
    
  } catch (error) {
    console.error('❌ Error updating tournament:', error);
  }
}

updateTournamentTime();
