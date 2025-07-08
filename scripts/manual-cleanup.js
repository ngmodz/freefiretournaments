import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, Timestamp, writeBatch, limit } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDtMRCW8yZjbhL6PSJHrIx7qzJlWHJJ9e8",
  authDomain: "freefire-tournaments-ba2a6.firebaseapp.com",
  projectId: "freefire-tournaments-ba2a6",
  storageBucket: "freefire-tournaments-ba2a6.appspot.com",
  messagingSenderId: "1096983059652",
  appId: "1:1096983059652:web:a3a8c9c4f2a3b6c7d8e9f0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function cleanupExpiredTournaments() {
  try {
    console.log('🧹 Starting manual tournament cleanup...');
    
    const now = Timestamp.now();
    
    // Query for tournaments that have expired (ttl is in the past)
    const expiredQuery = query(
      collection(db, 'tournaments'),
      where('ttl', '<=', now),
      limit(50)
    );
    
    const expiredTournaments = await getDocs(expiredQuery);
    console.log(`Found ${expiredTournaments.size} tournaments with expired TTL`);
    
    // Also check for ended tournaments without TTL that should have expired
    const endedWithoutTTLQuery = query(
      collection(db, 'tournaments'),
      where('status', '==', 'ended')
    );
    
    const endedWithoutTTL = await getDocs(endedWithoutTTLQuery);
    console.log(`Found ${endedWithoutTTL.size} ended tournaments`);
    
    // Filter ended tournaments that should have expired (10 minutes after ending)
    const expiredEndedTournaments = endedWithoutTTL.docs.filter(doc => {
      const data = doc.data();
      if (data.ended_at && !data.ttl) {
        const endedAt = data.ended_at.toDate();
        const shouldExpireAt = new Date(endedAt.getTime() + 10 * 60 * 1000);
        const hasExpired = now.toDate() > shouldExpireAt;
        
        console.log(`Tournament ${doc.id} (${data.name}):`);
        console.log(`  Ended at: ${endedAt.toISOString()}`);
        console.log(`  Should expire at: ${shouldExpireAt.toISOString()}`);
        console.log(`  Has expired: ${hasExpired}`);
        
        return hasExpired;
      }
      return false;
    });
    
    // Combine both sets of tournaments to delete
    const allExpiredTournaments = [...expiredTournaments.docs, ...expiredEndedTournaments];
    
    if (allExpiredTournaments.length === 0) {
      console.log('✅ No expired tournaments found');
      return;
    }
    
    console.log(`🗑️ Found ${allExpiredTournaments.length} expired tournaments to delete`);
    
    // Use batch write for better performance
    const batch = writeBatch(db);
    let deletedCount = 0;
    
    allExpiredTournaments.forEach((docSnap) => {
      const tournamentData = docSnap.data();
      console.log(`🗑️ Marking tournament for deletion: ${docSnap.id} - ${tournamentData.name}`);
      batch.delete(docSnap.ref);
      deletedCount++;
    });
    
    // Commit the batch deletion
    await batch.commit();
    
    console.log(`✅ Successfully deleted ${deletedCount} expired tournaments`);
    
  } catch (error) {
    console.error('❌ Error during tournament cleanup:', error);
  }
}

cleanupExpiredTournaments();
