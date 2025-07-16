import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { firebaseConfig } from './firebase-config-es.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Check the status of a specific tournament
 */
async function checkTournamentStatus(tournamentId) {
  try {
    if (!tournamentId) {
      console.error('❌ Tournament ID is required');
      console.log('Usage: node scripts/check-tournament-status.js <tournament-id>');
      return;
    }

    console.log(`🔍 Checking tournament status: ${tournamentId}`);
    console.log('='.repeat(50));
    
    const tournamentRef = doc(db, 'tournaments', tournamentId);
    const tournamentDoc = await getDoc(tournamentRef);
    
    if (!tournamentDoc.exists()) {
      console.log('❌ Tournament not found - may have been deleted');
      return;
    }
    
    const tournament = tournamentDoc.data();
    
    console.log('📊 TOURNAMENT DETAILS:');
    console.log(`Name: ${tournament.name}`);
    console.log(`Status: ${tournament.status}`);
    console.log(`Participants: ${tournament.filled_spots}/${tournament.max_players}`);
    console.log(`Minimum Required: ${tournament.min_participants || 'Not set'}`);
    console.log(`Entry Fee: ${tournament.entry_fee || 0} credits`);
    console.log(`Current Prize Pool: ${tournament.currentPrizePool || 0} credits`);
    
    // Parse start date
    const startDate = tournament.start_date instanceof Date 
      ? tournament.start_date 
      : tournament.start_date.toDate();
    
    console.log(`Start Date: ${startDate.toLocaleString()}`);
    
    const now = new Date();
    const timeDiff = startDate.getTime() - now.getTime();
    const minutesUntilStart = timeDiff / (1000 * 60);
    
    if (minutesUntilStart > 0) {
      console.log(`⏳ Starts in: ${minutesUntilStart.toFixed(1)} minutes`);
    } else {
      console.log(`⏰ Started: ${Math.abs(minutesUntilStart).toFixed(1)} minutes ago`);
    }
    
    // Check minimum participants status
    console.log('\n📋 MINIMUM PARTICIPANTS ANALYSIS:');
    if (tournament.min_participants) {
      const hasEnoughParticipants = tournament.filled_spots >= tournament.min_participants;
      console.log(`✓ Minimum required: ${tournament.min_participants}`);
      console.log(`✓ Current participants: ${tournament.filled_spots}`);
      console.log(`✓ Has enough participants: ${hasEnoughParticipants ? '✅ YES' : '❌ NO'}`);
      
      if (!hasEnoughParticipants) {
        const needed = tournament.min_participants - tournament.filled_spots;
        console.log(`⚠️  Need ${needed} more participant(s) to start`);
        
        if (minutesUntilStart <= 0 && tournament.status === 'active') {
          console.log('🚨 TOURNAMENT SHOULD BE CANCELLED (past start time with insufficient participants)');
        }
      }
    } else {
      console.log('⚠️  No minimum participants requirement set');
    }
    
    // Show cancellation info if cancelled
    if (tournament.status === 'cancelled') {
      console.log('\n🚫 CANCELLATION DETAILS:');
      if (tournament.cancelled_at) {
        const cancelledDate = tournament.cancelled_at.toDate();
        console.log(`Cancelled at: ${cancelledDate.toLocaleString()}`);
      }
      if (tournament.cancellation_reason) {
        console.log(`Reason: ${tournament.cancellation_reason}`);
      }
      if (tournament.ttl) {
        const ttlDate = tournament.ttl.toDate();
        console.log(`Will be deleted at: ${ttlDate.toLocaleString()}`);
      }
    }
    
    // Show TTL info
    if (tournament.ttl) {
      console.log('\n⏰ AUTO-DELETION INFO:');
      const ttlDate = tournament.ttl.toDate();
      console.log(`TTL: ${ttlDate.toLocaleString()}`);
      const ttlDiff = ttlDate.getTime() - now.getTime();
      const minutesUntilDeletion = ttlDiff / (1000 * 60);
      if (minutesUntilDeletion > 0) {
        console.log(`Will be deleted in: ${minutesUntilDeletion.toFixed(1)} minutes`);
      } else {
        console.log(`Should have been deleted: ${Math.abs(minutesUntilDeletion).toFixed(1)} minutes ago`);
      }
    }
    
    console.log('\n🔧 USEFUL COMMANDS:');
    console.log('Check minimum participants: curl -X POST https://freefiretournaments.vercel.app/api/check-minimum-participants');
    console.log(`Check this tournament again: node scripts/check-tournament-status.js ${tournamentId}`);

  } catch (error) {
    console.error('❌ Error checking tournament status:', error);
  }
}

// Get tournament ID from command line arguments
const tournamentId = process.argv[2];
checkTournamentStatus(tournamentId);
