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

async function createThirdTestTournament() {
  try {
    console.log('🚀 Creating THIRD test tournament - FINAL CONFIRMATION...');
    
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
      name: 'ULTIMATE FINALE: Victory Royale Tournament',
      status: 'active',
      mode: 'Duo',
      map: 'Kalahari',
      room_type: 'Custom',
      max_players: 20,
      filled_spots: 18,
      entry_fee: 50,
      prize_pool: 1000,
      start_date: admin.firestore.Timestamp.fromDate(startTime),
      host_id: testHostId,
      notificationSent: false,
      created_at: admin.firestore.Timestamp.now(),
      custom_settings: {
        auto_aim: false,
        character_skill: true,
        pet_enabled: false,
        advance_settings: true
      }
    };
    
    const docRef = await db.collection('tournaments').add(tournamentData);
    console.log(`✅ FINAL Tournament created with ID: ${docRef.id}`);
    console.log(`🏆 Tournament Name: "${tournamentData.name}"`);
    console.log(`🎮 Mode: ${tournamentData.mode} | Map: ${tournamentData.map}`);
    console.log(`💰 Entry Fee: ₹${tournamentData.entry_fee} | Prize Pool: ₹${tournamentData.prize_pool}`);
    console.log(`👥 Participants: ${tournamentData.filled_spots}/${tournamentData.max_players}`);
    console.log(`🎯 This tournament should trigger notification IMMEDIATELY!`);
    console.log('');
    console.log(`🔄 Test NOW:`);
    console.log(`node scripts/debug-notification-verbose.js`);
    
  } catch (error) {
    console.error('❌ Error creating tournament:', error);
  } finally {
    process.exit(0);
  }
}

createThirdTestTournament();
