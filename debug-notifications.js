// Debug script to check notification status
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

async function debugNotifications() {
  console.log('=== DEBUGGING TOURNAMENT NOTIFICATIONS ===');
  
  try {
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    const now = new Date();
    const istNow = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    
    console.log('Current IST time:', istNow.toLocaleString());
    console.log('Looking for active tournaments...');
    
    // Get all active tournaments
    const tournamentsQuery = query(
      collection(db, 'tournaments'),
      where('status', '==', 'active')
    );
    
    const snapshot = await getDocs(tournamentsQuery);
    
    if (snapshot.empty) {
      console.log('❌ No active tournaments found');
      return;
    }
    
    console.log(`✅ Found ${snapshot.size} active tournaments`);
    
    snapshot.docs.forEach(doc => {
      const tournament = doc.data();
      const startDate = tournament.start_date instanceof Date ? tournament.start_date : 
                      (tournament.start_date.toDate ? tournament.start_date.toDate() : new Date(tournament.start_date));
      
      const minutesToStart = (startDate.getTime() - istNow.getTime()) / (1000 * 60);
      
      console.log(`\n--- Tournament: ${tournament.name} (ID: ${doc.id}) ---`);
      console.log(`Host ID: ${tournament.host_id}`);
      console.log(`Start Date: ${startDate.toLocaleString()}`);
      console.log(`Minutes to start: ${minutesToStart.toFixed(1)}`);
      console.log(`Notification sent: ${tournament.notificationSent}`);
      console.log(`Notification sent at: ${tournament.notificationSentAt ? tournament.notificationSentAt.toDate().toLocaleString() : 'Never'}`);
      
      if (minutesToStart >= 19 && minutesToStart <= 21) {
        console.log('🟡 IN NOTIFICATION WINDOW (19-21 minutes)');
        if (tournament.notificationSent) {
          console.log('⚠️  But notification already sent');
        } else {
          console.log('✅ SHOULD SEND NOTIFICATION');
        }
      } else if (minutesToStart < 19) {
        console.log('🔴 TOO CLOSE TO START (< 19 minutes)');
      } else {
        console.log('🔵 TOO FAR FROM START (> 21 minutes)');
      }
    });
    
  } catch (error) {
    console.error('Error debugging notifications:', error);
  }
}

debugNotifications();
