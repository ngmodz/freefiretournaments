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
  // Use hard-coded path for local testing
  else {
    const serviceAccountPath = path.resolve(__dirname, '../service-account.json');
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccountFile = fs.readFileSync(serviceAccountPath, 'utf8');
      serviceAccount = JSON.parse(serviceAccountFile);
    } else {
      throw new Error('No service account file found at ' + serviceAccountPath);
    }
  }

  if (!serviceAccount?.project_id) {
    throw new Error('Invalid service account configuration');
  }
} catch (error) {
  console.error('❌ Error parsing Firebase service account:', error);
  console.log('Please check your .env file or service-account.json file');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
});

const db = admin.firestore();

/**
 * Create a tournament that will be in the notification window
 */
async function createNotificationTestTournament() {
  try {
    // Create a tournament that starts in 20 minutes using IST
    const now = new Date();
    const istNow = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    const startTime = new Date(istNow.getTime() + 20 * 60 * 1000); // 20 minutes from now in IST
    
    console.log(`Current time: ${istNow.toLocaleString()} IST`);
    console.log(`Creating tournament to start at: ${startTime.toLocaleString()} IST`);
    console.log(`Tournament will start in exactly 20 minutes`);
    
    const testTournament = {
      name: `NotificationTest-${Math.floor(Math.random() * 10000)}`,
      status: 'active',
      mode: 'Solo',
      map: 'Bermuda',
      room_type: 'Classic',
      max_players: 12,
      filled_spots: 8,
      entry_fee: 10,
      entry_fee_credits: 10,
      prize_pool: 100,
      start_date: admin.firestore.Timestamp.fromDate(startTime),
      host_id: "aDYdh0V2SwXt45Y11Iqti4UdM5o1", // Using your user ID
      host_credits: 10,
      notificationSent: false,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      game: 'free-fire',
      tournament_type: 'solo',
      room_id: '',
      room_password: '',
      rules: 'Standard tournament rules',
      description: 'Test tournament for email notification system'
    };

    console.log('Creating test tournament...');
    const tournamentRef = await db.collection('tournaments').add(testTournament);
    
    console.log('\n✅ Test tournament created successfully!');
    console.log(`📍 Tournament ID: ${tournamentRef.id}`);
    console.log(`📝 Tournament Name: ${testTournament.name}`);
    console.log(`⏰ Tournament starts at: ${startTime.toLocaleString()} IST`);
    console.log(`⏱️ That's in 20 minutes from now`);
    
    console.log('\n🔍 Next Steps:');
    console.log('1. Wait about 1 minute for the tournament to be in the 19-21 minute window');
    console.log('2. Run: node scripts/check-notification-window.js');
    console.log('   This will check if the tournament is in the notification window');
    console.log('3. Run: node scripts/fixed-notifications.js');
    console.log('   This will send the notification if the tournament is in the window');
    console.log('4. Check your email at: microft1007@gmail.com');

  } catch (error) {
    console.error('❌ Error creating test tournament:', error);
  }
}

// Run the function
createNotificationTestTournament()
  .then(() => {
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
