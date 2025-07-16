import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';
import { firebaseConfig } from './firebase-config-es.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Create a test tournament to verify minimum participants functionality
 */
async function createMinParticipantsTestTournament() {
  try {
    console.log('🧪 CREATING TOURNAMENT FOR MINIMUM PARTICIPANTS TEST 🧪');
    console.log('======================================================');
    
    // Create a tournament that starts in 2 minutes (for quick testing)
    const now = new Date();
    const startTime = new Date(now.getTime() + 2 * 60 * 1000); // 2 minutes from now
    
    console.log(`Current time: ${now.toLocaleString()}`);
    console.log(`Tournament will start at: ${startTime.toLocaleString()}`);
    console.log(`Tournament will start in 2 minutes`);
    
    const testTournament = {
      name: `MinParticipants-Test-${Math.floor(Math.random() * 10000)}`,
      description: "Test tournament to verify minimum participants feature",
      status: "active",
      mode: "Solo",
      map: "Bermuda",
      room_type: "Classic",
      max_players: 10,
      min_participants: 5, // Require at least 5 participants
      filled_spots: 2, // Only 2 people joined (less than minimum)
      entry_fee: 50,
      prize_distribution: {
        "1st": 60,
        "2nd": 25,
        "3rd": 15
      },
      rules: "Test tournament rules",
      start_date: Timestamp.fromDate(startTime),
      host_id: "aDYdh0V2SwXt45Y11Iqti4UdM5o1", // Your host ID
      participants: [
        "aDYdh0V2SwXt45Y11Iqti4UdM5o1", // Host as participant for testing
        "test_user_1" // Another test user
      ],
      participantUids: [
        "aDYdh0V2SwXt45Y11Iqti4UdM5o1",
        "test_user_1"
      ],
      currentPrizePool: 100, // 2 participants × 50 entry fee
      custom_settings: {
        gun_attributes: false,
        character_skill: false,
        auto_revival: false,
        airdrop: false,
        vehicles: false,
        high_tier_loot_zone: false,
        unlimited_ammo: false,
        headshot: false,
        war_chest: false,
        loadout: false,
      },
      notificationSent: false,
      created_at: Timestamp.now()
    };

    const docRef = await addDoc(collection(db, 'tournaments'), testTournament);
    
    console.log('\n✅ Test tournament created successfully!');
    console.log(`📍 Tournament ID: ${docRef.id}`);
    console.log(`📝 Tournament Name: ${testTournament.name}`);
    console.log(`👥 Participants: ${testTournament.filled_spots}/${testTournament.max_players} (min: ${testTournament.min_participants})`);
    console.log(`⏰ Start time: ${startTime.toLocaleString()}`);
    console.log(`💰 Entry fee: ${testTournament.entry_fee} credits`);
    console.log(`💰 Current prize pool: ${testTournament.currentPrizePool} credits`);
    
    console.log('\n🔍 Expected Behavior:');
    console.log('1. Tournament should NOT be cancelled yet (start time is in the future)');
    console.log('2. After start time passes (in 2 minutes), the check-minimum-participants API should:');
    console.log('   - Detect that tournament has only 2 participants (less than minimum 5)');
    console.log('   - Cancel the tournament automatically');
    console.log('   - Refund all participants their entry fees');
    console.log('   - Send cancellation emails to host and participants');
    console.log('   - Set tournament status to "cancelled" with TTL for cleanup');
    
    console.log('\n📋 Testing Steps:');
    console.log('1. Wait 2+ minutes for the tournament start time to pass');
    console.log('2. Manually call the minimum participants check API:');
    console.log('   POST /api/check-minimum-participants');
    console.log('3. Check that the tournament gets cancelled and users get refunded');
    console.log('4. Verify cancellation emails are sent');
    
    console.log('\n🛠️ Manual API Test Command:');
    console.log('curl -X POST https://freefiretournaments.vercel.app/api/check-minimum-participants');
    
    console.log('\n🔍 Check Tournament Status:');
    console.log(`node scripts/check-tournament-status.js ${docRef.id}`);

  } catch (error) {
    console.error('❌ Error creating test tournament:', error);
  }
}

// Run the function
createMinParticipantsTestTournament();
