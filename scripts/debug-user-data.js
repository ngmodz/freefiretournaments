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

async function checkUserData() {
  try {
    console.log('🔍 Checking host user data...');
    
    // Check if the test host user exists
    const hostId = 'notification-test-host';
    const userDoc = await db.collection('users').doc(hostId).get();
    
    if (userDoc.exists) {
      const userData = userDoc.data();
      console.log('✅ User exists:');
      console.log('ID:', hostId);
      console.log('Email:', userData.email);
      console.log('Display name:', userData.display_name);
      console.log('Data:', userData);
    } else {
      console.log('❌ User does not exist!');
    }
    
    // Also check the tournament
    console.log('\\n🔍 Checking tournament data...');
    const tournamentsSnapshot = await db.collection('tournaments')
      .where('host_id', '==', hostId)
      .where('status', '==', 'active')
      .get();
    
    if (!tournamentsSnapshot.empty) {
      tournamentsSnapshot.forEach(doc => {
        const tournament = doc.data();
        console.log(`\\n✅ Found tournament: ${doc.id}`);
        console.log('Name:', tournament.name);
        console.log('Host ID:', tournament.host_id);
        console.log('Status:', tournament.status);
        console.log('Notification sent:', tournament.notificationSent);
        console.log('Start date:', tournament.start_date.toDate().toLocaleString());
      });
    } else {
      console.log('❌ No tournaments found for this host!');
    }
    
  } catch (error) {
    console.error('❌ Error checking data:', error);
  } finally {
    process.exit(0);
  }
}

checkUserData();
