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
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
});

const db = admin.firestore();

async function createPerfectTimingTournament() {
  try {
    // Use IST timezone consistently
    const now = new Date();
    const istNow = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    
    // Create tournament that starts in exactly 20 minutes from current IST time
    const startTime = new Date(istNow.getTime() + 20 * 60 * 1000); // 20 minutes from IST now
    
    const tournament = {
      name: 'LIVE TEST: IST Perfect Timing Tournament',
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
      host_id: 'test-host-1752117844962', // Using existing test host with microft1007@gmail.com
      host_credits: 10,
      notificationSent: false,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      game: 'free-fire',
      tournament_type: 'solo',
      room_id: '',
      room_password: '',
      rules: 'Standard tournament rules',
      description: 'IST timezone test tournament for notification system'
    };

    console.log('🚀 Creating tournament with perfect IST timing...');
    console.log(`⏰ Current IST time: ${istNow.toLocaleString()}`);
    console.log(`🎯 Tournament starts (IST): ${startTime.toLocaleString()}`);
    console.log(`📧 Host email: microft1007@gmail.com`);

    const tournamentRef = await db.collection('tournaments').add(tournament);
    
    console.log(`✅ Tournament created with ID: ${tournamentRef.id}`);
    console.log('\n🎯 Perfect! The tournament is now set to start in exactly 20 minutes.');
    console.log('🔄 Your cron-job.org should pick this up in the next 2 minutes!');
    console.log('\n🧪 To test immediately:');
    console.log('1. node scripts/send-tournament-notifications.js');
    console.log('2. curl https://freefiretournaments-nishus-projects-70e433b8.vercel.app/api/tournament-notifications');
    console.log('\n📧 Check microft1007@gmail.com for the notification email!');

    // Show exactly when notification should be sent
    const notificationTime = new Date(now.getTime() + 1 * 60 * 1000); // In about 1 minute
    console.log(`\n⏰ Notification should be sent around: ${notificationTime.toLocaleString()}`);

  } catch (error) {
    console.error('❌ Error creating tournament:', error);
  }
}

createPerfectTimingTournament();
