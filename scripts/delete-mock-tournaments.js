// Script to delete all mock tournaments from Firestore
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { firebaseConfig } from './firebase-config.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function deleteMockTournaments() {
  try {
    console.log('Starting to delete mock tournaments...');
    
    // Get all tournaments
    const tournamentsRef = collection(db, 'tournaments');
    const tournamentsSnapshot = await getDocs(tournamentsRef);
    
    if (tournamentsSnapshot.empty) {
      console.log('No tournaments found in the database.');
      return;
    }
    
    console.log(`Found ${tournamentsSnapshot.size} tournaments.`);
    let deletedCount = 0;
    
    // Delete all tournaments
    for (const tournamentDoc of tournamentsSnapshot.docs) {
      const tournamentRef = doc(db, 'tournaments', tournamentDoc.id);
      await deleteDoc(tournamentRef);
      deletedCount++;
      console.log(`Deleted tournament with ID: ${tournamentDoc.id}`);
    }
    
    console.log(`Successfully deleted ${deletedCount} tournaments.`);
    
    // Also clean up any tournament drafts
    const draftsRef = collection(db, 'tournament_drafts');
    const draftsSnapshot = await getDocs(draftsRef);
    
    if (!draftsSnapshot.empty) {
      console.log(`Found ${draftsSnapshot.size} tournament drafts.`);
      let deletedDraftsCount = 0;
      
      for (const draftDoc of draftsSnapshot.docs) {
        const draftRef = doc(db, 'tournament_drafts', draftDoc.id);
        await deleteDoc(draftRef);
        deletedDraftsCount++;
        console.log(`Deleted tournament draft with ID: ${draftDoc.id}`);
      }
      
      console.log(`Successfully deleted ${deletedDraftsCount} tournament drafts.`);
    } else {
      console.log('No tournament drafts found in the database.');
    }
    
    console.log('Database cleanup completed successfully.');
  } catch (error) {
    console.error('Error deleting tournaments:', error);
  }
}

// Run the function
deleteMockTournaments(); 