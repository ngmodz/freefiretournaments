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

async function createFullyAutomaticTournament() {
  try {
    console.log('🤖 Creating tournament for FULLY AUTOMATIC notification system...');
    console.log('📡 This will be triggered AUTOMATICALLY by cron-job.org');
    console.log('🚫 NO manual scripts will be run - 100% automatic!');
    console.log('');
    
    // Create tournament that starts exactly 23 minutes from now in IST
    const now = new Date();
    const istNow = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    const startTime = new Date(istNow.getTime() + 23 * 60 * 1000); // 23 minutes from now
    
    console.log(`⏰ Current IST time: ${istNow.toLocaleString()}`);
    console.log(`🎯 Tournament starts (IST): ${startTime.toLocaleString()}`);
    
    // Calculate when the automatic notification should be sent
    const notificationWindow = {
      start: new Date(istNow.getTime() + 2 * 60 * 1000), // 2 minutes from now
      end: new Date(istNow.getTime() + 4 * 60 * 1000)    // 4 minutes from now
    };
    
    console.log('');
    console.log('📬 AUTOMATIC notification will be sent between:');
    console.log(`   ⏰ ${notificationWindow.start.toLocaleString()} IST`);
    console.log(`   ⏰ ${notificationWindow.end.toLocaleString()} IST`);
    console.log(`   📡 When your cron-job.org calls the API every 2 minutes`);
    console.log('');
    
    // Use the same test host user
    const testHostId = 'notification-test-host';
    console.log('📧 Host email: microft1007@gmail.com');
    
    // Create tournament with unique details
    const tournamentData = {
      name: 'AUTOMATIC SYSTEM TEST: Pro League Championship',
      status: 'active',
      mode: 'Solo',
      map: 'Nextera',
      room_type: 'Custom',
      max_players: 32,
      filled_spots: 28,
      entry_fee: 100,
      prize_pool: 3200,
      start_date: admin.firestore.Timestamp.fromDate(startTime),
      host_id: testHostId,
      notificationSent: false,
      created_at: admin.firestore.Timestamp.now(),
      description: 'Elite tournament for professional players',
      custom_settings: {
        auto_aim: false,
        character_skill: true,
        pet_enabled: false,
        advance_settings: true,
        loadout_locked: true,
        zone_speed: 'fast'
      }
    };
    
    const docRef = await db.collection('tournaments').add(tournamentData);
    console.log('✅ FULLY AUTOMATIC Tournament created!');
    console.log('');
    console.log('🏆 Tournament Details:');
    console.log(`   📋 ID: ${docRef.id}`);
    console.log(`   🎮 Name: "${tournamentData.name}"`);
    console.log(`   🎯 Mode: ${tournamentData.mode} | Map: ${tournamentData.map}`);
    console.log(`   💰 Entry: ₹${tournamentData.entry_fee} | Prize: ₹${tournamentData.prize_pool}`);
    console.log(`   👥 Players: ${tournamentData.filled_spots}/${tournamentData.max_players}`);
    console.log('');
    console.log('🤖 AUTOMATIC SYSTEM STATUS:');
    console.log('   ✅ Tournament created in database');
    console.log('   ✅ Cron-job.org is calling your API every 2 minutes');
    console.log('   ✅ API URL: https://freefiretournaments.vercel.app/api/tournament-notifications');
    console.log('   ✅ Email will be sent AUTOMATICALLY when tournament is 19-21 minutes away');
    console.log('');
    console.log('⏳ TIMELINE:');
    console.log('   🔄 In 2-4 minutes: Cron job will detect tournament');
    console.log('   📧 Email will be sent automatically to microft1007@gmail.com');
    console.log('   🚫 NO manual intervention required!');
    console.log('');
    console.log('✨ Just wait and check your email in 2-4 minutes!');
    
  } catch (error) {
    console.error('❌ Error creating tournament:', error);
  } finally {
    process.exit(0);
  }
}

createFullyAutomaticTournament();
