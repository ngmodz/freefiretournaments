import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { firebaseConfig } from './firebase-config-es.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function debugQuery() {
  try {
    // Use IST timezone consistently
    const now = new Date();
    const istNow = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    
    console.log('🔍 Debug Query Analysis');
    console.log(`Current local time: ${now.toLocaleString()}`);
    console.log(`Current IST time: ${istNow.toLocaleString()}`);
    
    // Check what tournaments exist with any status
    console.log('\n📋 All tournaments in database:');
    const allTournamentsQuery = query(collection(db, 'tournaments'));
    const allSnapshot = await getDocs(allTournamentsQuery);
    
    console.log(`Found ${allSnapshot.size} total tournaments`);
    
    allSnapshot.forEach(doc => {
      const t = doc.data();
      const startDate = t.start_date.toDate();
      const minutesToStart = (startDate.getTime() - istNow.getTime()) / (1000 * 60);
      console.log(`- ${doc.id}: ${t.name}`);
      console.log(`  Status: ${t.status}`);
      console.log(`  Start: ${startDate.toLocaleString()} (${minutesToStart.toFixed(1)} min from now)`);
      console.log(`  Host: ${t.host_id}`);
      console.log(`  Notification sent: ${t.notificationSent}`);
      console.log('');
    });
    
    // Now test the actual query with different time windows
    console.log('🔍 Testing notification query...');
    
    const twentyMinutesFromNow = new Date(istNow.getTime() + 20 * 60 * 1000);
    const twentyMinutesPlusBuffer = new Date(istNow.getTime() + 20 * 60 * 1000 + 30 * 1000);
    
    console.log(`Looking for tournaments between:`);
    console.log(`  From: ${twentyMinutesFromNow.toLocaleString()}`);
    console.log(`  To: ${twentyMinutesPlusBuffer.toLocaleString()}`);
    
    const notificationQuery = query(
      collection(db, 'tournaments'),
      where('status', '==', 'active'),
      where('start_date', '>=', twentyMinutesFromNow),
      where('start_date', '<=', twentyMinutesPlusBuffer)
    );
    
    const notificationSnapshot = await getDocs(notificationQuery);
    console.log(`Found ${notificationSnapshot.size} tournaments in notification window`);
    
    if (notificationSnapshot.size > 0) {
      notificationSnapshot.forEach(doc => {
        const t = doc.data();
        console.log(`✅ Found: ${doc.id} - ${t.name}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugQuery();
