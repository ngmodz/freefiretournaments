import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, limit } from 'firebase/firestore';

// Firebase config from the main app
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function diagnoseTournamentTimers() {
  console.log('🔍 Diagnosing tournament auto deletion timers...\n');

  try {
    // Check all tournaments
    const tournamentsQuery = query(
      collection(db, 'tournaments'),
      limit(20)
    );

    const tournamentsSnapshot = await getDocs(tournamentsQuery);
    
    if (tournamentsSnapshot.empty) {
      console.log('❌ No tournaments found in database');
      return;
    }

    console.log(`📊 Found ${tournamentsSnapshot.size} tournaments\n`);

    let hasIssues = false;

    tournamentsSnapshot.forEach((doc) => {
      const data = doc.data();
      const now = new Date();

      console.log(`🎯 Tournament: ${data.name} (${doc.id})`);
      console.log(`   Status: ${data.status}`);
      console.log(`   Start Date: ${data.start_date?.toDate?.()?.toISOString() || data.start_date}`);
      console.log(`   TTL: ${data.ttl ? (data.ttl?.toDate?.()?.toISOString() || data.ttl) : '❌ NOT SET'}`);

      // Check for issues
      if (data.status === 'ongoing' && !data.ttl) {
        console.log(`   ❌ ISSUE: Ongoing tournament without TTL`);
        hasIssues = true;
      }

      if (data.status === 'ended' && !data.ttl) {
        console.log(`   ❌ ISSUE: Ended tournament without TTL`);
        hasIssues = true;
      }

      if (data.ttl) {
        const ttlDate = data.ttl?.toDate?.() ? data.ttl.toDate() : new Date(data.ttl);
        if (now > ttlDate) {
          const overdueMins = Math.floor((now - ttlDate) / 1000 / 60);
          console.log(`   ❌ ISSUE: Tournament expired ${overdueMins} minutes ago but not deleted`);
          hasIssues = true;
        } else {
          const remainingMins = Math.floor((ttlDate - now) / 1000 / 60);
          console.log(`   ✅ TTL valid - expires in ${remainingMins} minutes`);
        }
      }

      console.log('');
    });

    if (!hasIssues) {
      console.log('✅ No issues found with tournament timers');
    } else {
      console.log('❌ Issues found - tournament auto deletion timers need fixing');
    }

    // Check cloud functions schedule
    console.log('\n🔧 Expected Cloud Functions:');
    console.log('   • setTournamentTTLAtScheduledTime: every 5 minutes');
    console.log('   • cleanupExpiredTournaments: every 15 minutes');
    console.log('   • sendUpcomingTournamentNotifications: every 5 minutes');

  } catch (error) {
    console.error('❌ Error diagnosing tournaments:', error);
    console.log('\n💡 This might be due to:');
    console.log('   • Firebase not configured properly');
    console.log('   • Missing environment variables');
    console.log('   • Network connection issues');
  }
}

diagnoseTournamentTimers();
