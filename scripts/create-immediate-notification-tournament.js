import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
const serviceAccount = {
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

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function createInWindowTournament() {
  try {
    console.log('🚀 Creating tournament that should trigger notifications RIGHT NOW...');
    
    // Create tournament that starts exactly 20 minutes from now in IST
    const now = new Date();
    const istNow = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    const startTime = new Date(istNow.getTime() + 20 * 60 * 1000); // 20 minutes from now
    
    console.log(`⏰ Current IST time: ${istNow.toLocaleString()}`);
    console.log(`🎯 Tournament starts (IST): ${startTime.toLocaleString()}`);
    
    // Create test host user first
    const testHostId = 'notification-test-host';
    const hostData = {
      email: 'microft1007@gmail.com',
      display_name: 'Notification Test Host',
      ign: 'TestHost123',
      uid_freefire: '123456789',
      created_at: admin.firestore.Timestamp.now()
    };
    
    console.log('📧 Host email:', hostData.email);
    await db.collection('users').doc(testHostId).set(hostData);
    
    // Create tournament
    const tournamentData = {
      name: 'NOTIFICATION TEST: Tournament Starting in 20min',
      status: 'active',
      mode: 'Solo',
      map: 'Bermuda',
      room_type: 'Classic',
      max_players: 12,
      filled_spots: 8,
      entry_fee: 10,
      prize_pool: 100,
      start_date: admin.firestore.Timestamp.fromDate(startTime),
      host_id: testHostId,
      notificationSent: false,
      created_at: admin.firestore.Timestamp.now()
    };
    
    const docRef = await db.collection('tournaments').add(tournamentData);
    console.log(`✅ Tournament created with ID: ${docRef.id}`);
    console.log(`🎯 This tournament should be found by the notification system IMMEDIATELY!`);
    console.log(`🔄 Test it now:`);
    console.log(`1. node scripts/send-tournament-notifications.js`);
    console.log(`2. Check microft1007@gmail.com for the notification email!`);
    
  } catch (error) {
    console.error('❌ Error creating tournament:', error);
  } finally {
    process.exit(0);
  }
}

createInWindowTournament();
