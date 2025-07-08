import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc, Timestamp } from 'firebase/firestore';

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

async function setTournamentTTL() {
  const tournamentId = 'hqVhhe0br6vbFr0ElAO6';
  
  try {
    console.log(`Setting TTL for tournament ${tournamentId}...`);
    
    // Since the tournament was ended, it should have expired 10 minutes after ending
    // The tournament was ended at 2025-07-08T19:27:36.918Z
    // So it should have been deleted at 2025-07-08T19:37:36.918Z
    
    // Set TTL to now (so it expires immediately)
    const ttlDate = new Date();
    const ttlTimestamp = Timestamp.fromDate(ttlDate);
    
    const docRef = doc(db, 'tournaments', tournamentId);
    await updateDoc(docRef, {
      ttl: ttlTimestamp
    });
    
    console.log(`✅ TTL set to ${ttlDate.toISOString()} - tournament should be deleted immediately`);
    
  } catch (error) {
    console.error('Error setting tournament TTL:', error);
  }
}

setTournamentTTL();
