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

async function createSecondTestTournament() {
  try {
    console.log('🚀 Creating SECOND test tournament for confirmation...');
    
    // Create tournament that starts exactly 20 minutes from now in IST
    const now = new Date();
    const istNow = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    const startTime = new Date(istNow.getTime() + 20 * 60 * 1000); // 20 minutes from now
    
    console.log(`⏰ Current IST time: ${istNow.toLocaleString()}`);
    console.log(`🎯 Tournament starts (IST): ${startTime.toLocaleString()}`);
    
    // Use the same test host user
    const testHostId = 'notification-test-host';
    console.log('📧 Using existing host with email: microft1007@gmail.com');
    
    // Create tournament with different details
    const tournamentData = {
      name: 'MEGA SHOWDOWN: Championship Battle Arena',
      status: 'active',
      mode: 'Squad',
      map: 'Purgatory',
      room_type: 'Ranked',
      max_players: 16,
      filled_spots: 12,
      entry_fee: 25,
      prize_pool: 400,
      start_date: admin.firestore.Timestamp.fromDate(startTime),
      host_id: testHostId,
      notificationSent: false,
      created_at: admin.firestore.Timestamp.now(),
      custom_settings: {
        auto_aim: false,
        character_skill: true,
        pet_enabled: true
      }
    };
    
    const docRef = await db.collection('tournaments').add(tournamentData);
    console.log(`✅ NEW Tournament created with ID: ${docRef.id}`);
    console.log(`🏆 Tournament Name: "${tournamentData.name}"`);
    console.log(`🎮 Mode: ${tournamentData.mode} | Map: ${tournamentData.map}`);
    console.log(`💰 Entry Fee: ₹${tournamentData.entry_fee} | Prize Pool: ₹${tournamentData.prize_pool}`);
    console.log(`👥 Participants: ${tournamentData.filled_spots}/${tournamentData.max_players}`);
    console.log(`🎯 This tournament should trigger notification in exactly 20 minutes!`);
    console.log('');
    console.log(`🔄 Test the notification system:`);
    console.log(`1. Wait 1 minute (so it's 19-21 minutes away)`);
    console.log(`2. Run: node scripts/debug-notification-verbose.js`);
    console.log(`3. Check microft1007@gmail.com for the NEW notification email!`);
    
  } catch (error) {
    console.error('❌ Error creating tournament:', error);
  } finally {
    process.exit(0);
  }
}

createSecondTestTournament();
