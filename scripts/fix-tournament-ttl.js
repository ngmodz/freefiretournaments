import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { firebaseConfig } from './firebase-config.js';

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
