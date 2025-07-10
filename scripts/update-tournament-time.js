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

async function updateTournamentTime() {
  try {
    const tournamentId = 'qGxsD7oc7YI8y3Ic1fUR';
    
    // Set start time to exactly 20 minutes from now in IST
    const now = new Date();
    const istNow = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    const newStartTime = new Date(istNow.getTime() + 20 * 60 * 1000);
    
    await db.collection('tournaments').doc(tournamentId).update({
      start_date: admin.firestore.Timestamp.fromDate(newStartTime),
      notificationSent: false // Reset notification flag
    });
    
    console.log('✅ Tournament updated successfully!');
    console.log(`⏰ New start time (IST): ${newStartTime.toLocaleString('en-US', {timeZone: 'Asia/Kolkata'})}`);
    console.log('🕐 That\'s exactly 20 minutes from now in IST');
    console.log('');
    console.log('🧪 Now test the notification system:');
    console.log('1. Wait 1 minute (to get into 19-21 minute window)');
    console.log('2. Run: node scripts/send-tournament-notifications.js');
    console.log('3. Or call: https://your-app.vercel.app/api/tournament-notifications');
    console.log('4. Check microft1007@gmail.com for notification');
    
  } catch (error) {
    console.error('❌ Error updating tournament:', error);
  }
}

updateTournamentTime();
