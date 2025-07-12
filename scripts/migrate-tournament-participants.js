// Migration script: Convert tournament participants from [authUid, ...] to [{customUid, ign, authUid}, ...]
const { getFirestore } = require('./secure-firebase-admin');

const db = getFirestore();

async function migrateTournamentParticipants() {
  try {
    const tournamentsRef = db.collection('tournaments');
    const tournamentsSnapshot = await tournamentsRef.get();
    let updatedCount = 0;

    for (const tournamentDoc of tournamentsSnapshot.docs) {
      const tournamentData = tournamentDoc.data();
      const participants = tournamentData.participants;
      if (!Array.isArray(participants) || participants.length === 0) continue;
      // If already migrated, skip
      if (typeof participants[0] === 'object' && participants[0].customUid) continue;

      const newParticipants = [];
      for (const authUid of participants) {
        // Fetch user profile by authUid
        const userDoc = await db.collection('users').doc(authUid).get();
        if (!userDoc.exists) {
          console.warn(`User not found for UID: ${authUid}`);
          continue;
        }
        const userData = userDoc.data();
        newParticipants.push({
          customUid: userData.uid || '',
          ign: userData.ign || '',
          authUid: authUid
        });
      }
      // Update tournament document
      await tournamentDoc.ref.update({ participants: newParticipants });
      updatedCount++;
      console.log(`Updated tournament ${tournamentDoc.id} with ${newParticipants.length} participants.`);
    }
    console.log(`\nMigration complete. Updated ${updatedCount} tournaments.`);
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    process.exit();
  }
}

migrateTournamentParticipants(); 