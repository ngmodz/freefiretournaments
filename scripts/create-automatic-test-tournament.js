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

async function createAutomaticTestTournament() {
  try {
    console.log('🤖 Creating tournament for AUTOMATIC notification testing...');
    console.log('📡 This will test the cron-job.org system calling our API every 2 minutes');
    
    // Create tournament that starts exactly 22 minutes from now in IST
    const now = new Date();
    const istNow = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    const startTime = new Date(istNow.getTime() + 22 * 60 * 1000); // 22 minutes from now
    
    console.log(`⏰ Current IST time: ${istNow.toLocaleString()}`);
    console.log(`🎯 Tournament starts (IST): ${startTime.toLocaleString()}`);
    
    // Calculate when notification should be sent (when it's 19-21 minutes away)
    const notificationStartWindow = new Date(istNow.getTime() + 1 * 60 * 1000); // 1 minute from now
    const notificationEndWindow = new Date(istNow.getTime() + 3 * 60 * 1000); // 3 minutes from now
    
    console.log(`📬 Automatic notification should be sent between:`);
    console.log(`   From: ${notificationStartWindow.toLocaleString()} IST`);
    console.log(`   To:   ${notificationEndWindow.toLocaleString()} IST`);
    console.log(`   (When tournament is 19-21 minutes away)`);
    
    // Use the same test host user
    const testHostId = 'notification-test-host';
    console.log('📧 Host email: microft1007@gmail.com');
    
    // Create tournament with unique details
    const tournamentData = {
      name: 'AUTO-TEST: Elite Champions League 2025',
      status: 'active',
      mode: 'Squad',
      map: 'Bermuda Remastered',
      room_type: 'Ranked',
      max_players: 24,
      filled_spots: 20,
      entry_fee: 75,
      prize_pool: 1800,
      start_date: admin.firestore.Timestamp.fromDate(startTime),
      host_id: testHostId,
      notificationSent: false,
      created_at: admin.firestore.Timestamp.now(),
      custom_settings: {
        auto_aim: false,
        character_skill: true,
        pet_enabled: true,
        advance_settings: true,
        loadout_locked: true
      }
    };
    
    const docRef = await db.collection('tournaments').add(tournamentData);
    console.log('');
    console.log(`✅ AUTOMATIC TEST Tournament created with ID: ${docRef.id}`);
    console.log(`🏆 Tournament Name: "${tournamentData.name}"`);
    console.log(`🎮 Mode: ${tournamentData.mode} | Map: ${tournamentData.map}`);
    console.log(`💰 Entry Fee: ₹${tournamentData.entry_fee} | Prize Pool: ₹${tournamentData.prize_pool}`);
    console.log(`👥 Participants: ${tournamentData.filled_spots}/${tournamentData.max_players}`);
    console.log('');
    console.log('🤖 NOW WE WAIT FOR THE AUTOMATIC SYSTEM:');
    console.log('⏱️  1. Your cron-job.org calls the API every 2 minutes');
    console.log('📡 2. When the tournament is 19-21 minutes away, notification will be sent');
    console.log('📧 3. Check microft1007@gmail.com in 1-3 minutes for the AUTOMATIC email!');
    console.log('');
    console.log('🔍 You can monitor by calling the API manually:');
    console.log('   http://localhost:8083/api/tournament-notifications');
    console.log('');
    console.log('⏰ Expected automatic notification time: 1-3 minutes from now');
    
  } catch (error) {
    console.error('❌ Error creating tournament:', error);
  } finally {
    process.exit(0);
  }
}

createAutomaticTestTournament();
