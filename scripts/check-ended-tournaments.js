import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';

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

async function checkEndedTournaments() {
  try {
    console.log('Checking for ended tournaments...');
    
    const now = new Date();
    console.log('Current time:', now.toISOString());
    
    // Query for all ended tournaments
    const endedQuery = query(
      collection(db, 'tournaments'),
      where('status', '==', 'ended')
    );
    
    const endedTournaments = await getDocs(endedQuery);
    console.log(`Found ${endedTournaments.size} ended tournaments`);
    
    endedTournaments.forEach(doc => {
      const data = doc.data();
      console.log(`\nTournament ID: ${doc.id}`);
      console.log(`Name: ${data.name}`);
      console.log(`Status: ${data.status}`);
      console.log(`Ended At: ${data.ended_at ? data.ended_at.toDate().toISOString() : 'Not set'}`);
      console.log(`TTL: ${data.ttl ? data.ttl.toDate().toISOString() : 'Not set'}`);
      
      if (data.ended_at && !data.ttl) {
        const endedAt = data.ended_at.toDate();
        const shouldHaveExpiredAt = new Date(endedAt.getTime() + 10 * 60 * 1000);
        console.log(`Should have expired at: ${shouldHaveExpiredAt.toISOString()}`);
        
        if (now > shouldHaveExpiredAt) {
          console.log(`❌ This tournament should have been deleted ${Math.floor((now - shouldHaveExpiredAt) / 1000 / 60)} minutes ago!`);
        } else {
          console.log(`✅ This tournament is still within the 10-minute window`);
        }
      } else if (data.ttl) {
        const ttlDate = data.ttl.toDate();
        if (now > ttlDate) {
          console.log(`❌ This tournament has expired and should be deleted`);
        } else {
          console.log(`✅ This tournament is still valid`);
        }
      }
    });
    
  } catch (error) {
    console.error('Error checking ended tournaments:', error);
  }
}

checkEndedTournaments();
