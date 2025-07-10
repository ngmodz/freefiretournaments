import admin from 'firebase-admin';

// Initialize Firebase Admin SDK (reuse the same config)
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

async function debugTournamentData() {
  try {
    console.log('🔍 Debug: Checking tournament data...');
    console.log(`⏰ Current time: ${new Date().toISOString()}`);
    console.log(`⏰ Current local time: ${new Date().toLocaleString()}`);

    // Get the specific test tournament
    const tournamentId = 'KsgCPmFbEqCadBDI2ddy';
    const tournamentDoc = await db.collection('tournaments').doc(tournamentId).get();
    
    if (!tournamentDoc.exists) {
      console.log('❌ Tournament not found!');
      return;
    }

    const tournament = tournamentDoc.data();
    console.log('\n📋 Tournament Data:');
    console.log(`ID: ${tournamentId}`);
    console.log(`Name: ${tournament.name}`);
    console.log(`Status: ${tournament.status}`);
    console.log(`Host ID: ${tournament.host_id}`);
    console.log(`Notification Sent: ${tournament.notificationSent}`);
    
    // Check start_date
    const startDate = tournament.start_date.toDate();
    console.log(`Start Date (Firestore): ${tournament.start_date.toDate().toISOString()}`);
    console.log(`Start Date (Local): ${tournament.start_date.toDate().toLocaleString()}`);
    
    // Calculate minutes to start
    const now = new Date();
    const minutesToStart = (startDate.getTime() - now.getTime()) / (1000 * 60);
    console.log(`Minutes to start: ${minutesToStart.toFixed(1)}`);
    
    // Check if it should be in notification window (19-21 minutes)
    if (minutesToStart >= 19 && minutesToStart <= 21) {
      console.log('✅ Tournament is in notification window (19-21 minutes)');
    } else {
      console.log(`❌ Tournament is NOT in notification window. It's ${minutesToStart.toFixed(1)} minutes away`);
    }

    // Also check for tournaments in the next 24 hours to see if API query finds it
    console.log('\n🔍 Checking if API query would find this tournament...');
    const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    const query = db.collection('tournaments')
      .where('status', '==', 'active')
      .where('start_date', '>=', now)
      .where('start_date', '<=', twentyFourHoursFromNow);
    
    const snapshot = await query.get();
    console.log(`Found ${snapshot.size} tournaments in next 24 hours`);
    
    snapshot.forEach(doc => {
      const t = doc.data();
      const tStartDate = t.start_date.toDate();
      const tMinutesToStart = (tStartDate.getTime() - now.getTime()) / (1000 * 60);
      console.log(`- ${doc.id}: ${t.name}, starts in ${tMinutesToStart.toFixed(1)} minutes`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugTournamentData();
