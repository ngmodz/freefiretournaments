// Migrate existing tournaments to have currentPrizePool field
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { firebaseConfig } from './firebase-config-es.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrateTournaments() {
  try {
    console.log('🔄 Migrating existing tournaments to include currentPrizePool field...\n');

    // Get all tournaments
    const tournamentsRef = collection(db, 'tournaments');
    const tournamentsSnapshot = await getDocs(tournamentsRef);
    
    if (tournamentsSnapshot.empty) {
      console.log('❌ No tournaments found in database');
      return;
    }

    console.log(`Found ${tournamentsSnapshot.size} tournament(s) to process\n`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const docSnapshot of tournamentsSnapshot.docs) {
      const data = docSnapshot.data();
      
      // Skip if currentPrizePool already exists
      if (data.currentPrizePool !== undefined) {
        console.log(`⏭️ Skipping "${data.name}" - already has currentPrizePool: ${data.currentPrizePool}`);
        skippedCount++;
        continue;
      }

      // Calculate currentPrizePool based on entry fee and filled spots
      const currentPrizePool = data.entry_fee * (data.filled_spots || 0);
      
      // Update the tournament document
      const tournamentRef = doc(db, 'tournaments', docSnapshot.id);
      await updateDoc(tournamentRef, {
        currentPrizePool: currentPrizePool
      });

      console.log(`✅ Updated "${data.name}"`);
      console.log(`   - Entry Fee: ${data.entry_fee}`);
      console.log(`   - Filled Spots: ${data.filled_spots || 0}`);
      console.log(`   - Current Prize Pool: ${currentPrizePool}`);
      
      migratedCount++;
    }

    console.log(`\n📊 Migration Summary:`);
    console.log(`   - Tournaments migrated: ${migratedCount}`);
    console.log(`   - Tournaments skipped: ${skippedCount}`);
    console.log(`   - Total tournaments: ${tournamentsSnapshot.size}`);
    
    console.log('\n✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during migration:', error);
  }
}

// Run the migration
migrateTournaments().catch(console.error);
