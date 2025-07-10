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
  // Manual fallback for this project
  else {
    serviceAccount = {
      "type": "service_account",
      "project_id": "freefire-tournaments-ba2a6",
      "private_key_id": "2ede2bbed81ac8e5c809ae3961bc688b455eefda",
      "private_key": "-----BEGIN PRIVATE KEY-----
REDACTED_PRIVATE_KEY
-----END PRIVATE KEY-----\n",
      "client_email": "firebase-adminsdk-fbsvc@freefire-tournaments-ba2a6.iam.gserviceaccount.com",
      "client_id": "113510107770544525831",
      "auth_uri": "https://accounts.google.com/o/oauth2/auth",
      "token_uri": "https://oauth2.googleapis.com/token",
      "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
      "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40freefire-tournaments-ba2a6.iam.gserviceaccount.com",
      "universe_domain": "googleapis.com"
    };
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
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
});

const db = admin.firestore();

/**
 * Create test user and tournament for notification testing
 */
async function createTestData() {
  try {
    // Step 1: Create test host user
    const testHostId = 'test-host-' + Date.now();
    const hostData = {
      email: 'microft1007@gmail.com',
      name: 'Test Host',
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      credits: 100,
      total_credits: 100,
      wallet_credits: 50
    };

    console.log('Creating test host user...');
    await db.collection('users').doc(testHostId).set(hostData);
    console.log(`✅ Created test host user with ID: ${testHostId}`);
    console.log(`📧 Host email: ${hostData.email}`);

    // Step 2: Create test tournament starting in 20 minutes using IST
    const now = new Date();
    const istNow = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    const startTime = new Date(istNow.getTime() + 20 * 60 * 1000); // 20 minutes from now in IST
    const testTournament = {
      name: 'TEST: Email Notification Tournament',
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
      host_id: testHostId,
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
    console.log(`✅ Created test tournament with ID: ${tournamentRef.id}`);
    console.log(`⏰ Tournament starts at: ${startTime.toLocaleString()}`);
    console.log(`🕐 That's in 20 minutes from now (${new Date().toLocaleString()})`);

    console.log('\n📋 Test Setup Complete!');
    console.log('================================');
    console.log(`Host User ID: ${testHostId}`);
    console.log(`Host Email: ${hostData.email}`);
    console.log(`Tournament ID: ${tournamentRef.id}`);
    console.log(`Tournament Name: ${testTournament.name}`);
    console.log(`Start Time: ${startTime.toLocaleString()}`);
    console.log('================================');

    console.log('\n🧪 How to Test:');
    console.log('1. Wait about 19-21 minutes from now');
    console.log('2. Your cron-job.org should automatically trigger the notification');
    console.log('3. Or manually test with:');
    console.log('   node scripts/send-tournament-notifications.js');
    console.log('4. Or call API: GET https://your-app.vercel.app/api/tournament-notifications');
    console.log('5. Check microft1007@gmail.com for the notification email');

    console.log('\n🧹 Cleanup:');
    console.log('After testing, you can delete these test records:');
    console.log(`- User: ${testHostId}`);
    console.log(`- Tournament: ${tournamentRef.id}`);

  } catch (error) {
    console.error('❌ Error creating test data:', error);
    process.exit(1);
  }
}

// Run the function
createTestData()
  .then(() => {
    console.log('\n✅ Test data creation completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed to create test data:', error);
    process.exit(1);
  });
