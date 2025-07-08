import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

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

async function checkTournamentTTL() {
  const tournamentId = 'hqVhhe0br6vbFr0ElAO6';
  
  try {
    console.log(`Checking tournament ${tournamentId}...`);
    
    const docRef = doc(db, 'tournaments', tournamentId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      console.log('Tournament exists!');
      console.log('Name:', data.name);
      console.log('Status:', data.status);
      console.log('Start Date:', data.start_date);
      console.log('Started At:', data.started_at ? data.started_at.toDate() : 'Not started');
      console.log('Ended At:', data.ended_at ? data.ended_at.toDate() : 'Not ended');
      console.log('TTL:', data.ttl ? data.ttl.toDate() : 'No TTL set');
      
      if (data.ttl) {
        const now = new Date();
        const ttlDate = data.ttl.toDate();
        const timeDiff = ttlDate.getTime() - now.getTime();
        
        console.log('Current time:', now.toISOString());
        console.log('TTL time:', ttlDate.toISOString());
        console.log('Time remaining:', Math.floor(timeDiff / 1000 / 60), 'minutes');
        
        if (timeDiff <= 0) {
          console.log('❌ Tournament has EXPIRED and should be deleted!');
        } else {
          console.log('✅ Tournament is still valid');
        }
      } else {
        console.log('ℹ️ No TTL set (tournament not started by host)');
      }
    } else {
      console.log('Tournament does not exist');
    }
    
  } catch (error) {
    console.error('Error checking tournament:', error);
  }
}

checkTournamentTTL();
