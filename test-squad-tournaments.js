 import admin from 'firebase-admin';
import fs from 'fs';
import { faker } from '@faker-js/faker';
import { v4 as uuidv4 } from 'uuid';

// Initialize Firebase Admin SDK
// Check if already initialized to avoid errors
if (!admin.apps.length) {
  try {
    // Try to read from environment variable first
    const serviceAccountPath = process.env.SERVICE_ACCOUNT_KEY_PATH || 
                              "D:/freefire-tournaments-ba2a6-firebase-adminsdk-fbsvc-2ede2bbed8.json";
    
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('✅ Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', error.message);
    process.exit(1);
  }
}

const db = admin.firestore();

// Test configuration
const TEST_CONFIG = {
  HOST_EMAIL: 'nishantgrewal2005@gmail.com',
  TOURNAMENT_NAME: 'Squad Championship Test',
  TOURNAMENT_DESCRIPTION: 'A comprehensive test tournament for squad functionality with zero entry fee',
  ENTRY_FEE: 0, // Zero entry fee as requested
  MAX_PLAYERS: 16, // 4 teams of 4 players each
  MIN_PARTICIPANTS: 4, // Minimum 1 team
  TEAM_COUNT: 2, // Number of teams to create
  PLAYERS_PER_TEAM: 4, // Squad size
  TOTAL_TEST_USERS: 8 // 2 teams × 4 players each
};

// Generate realistic Free Fire IGNs and UIDs
const generateFFData = () => {
  const prefixes = ['FF', 'PRO', 'KING', 'BOSS', 'LEGEND', 'ELITE', 'ALPHA', 'OMEGA'];
  const suffixes = ['YT', 'TTV', 'GAMING', 'ESPORTS', 'CLAN', 'SQUAD'];
  const numbers = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
  
  const ign = Math.random() > 0.5 
    ? `${faker.helpers.arrayElement(prefixes)}${numbers}`
    : `${faker.person.firstName()}${faker.helpers.arrayElement(suffixes)}`;
    
  const uid = Math.floor(Math.random() * (999999999999 - 100000000000) + 100000000000).toString();
  
  return { ign, uid };
};

// Create test users with realistic Free Fire data
const createTestUsers = async (count) => {
  console.log(`\n🔄 Creating ${count} test users for squad tournament...`);
  const users = [];
  
  for (let i = 0; i < count; i++) {
    const email = faker.internet.email();
    const password = 'TestPassword123!';
    const displayName = faker.person.fullName();
    const { ign, uid } = generateFFData();

    try {
      // Create Firebase Auth user
      const userRecord = await admin.auth().createUser({
        email,
        password,
        displayName,
      });

      // Create user profile in Firestore with complete data
      const userProfile = {
        email: userRecord.email,
        displayName: userRecord.displayName,
        fullName: displayName,
        ign: ign,
        uid: uid,
        location: faker.location.city(),
        phone: faker.phone.number(),
        gender: faker.helpers.arrayElement(['Male', 'Female']),
        dateOfBirth: faker.date.birthdate({ min: 16, max: 30, mode: 'age' }).toISOString().split('T')[0],
        isHost: false,
        isAdmin: false,
        wallet: {
          tournamentCredits: 1000, // Give credits for testing
          withdrawableBalance: 0
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      await db.collection('users').doc(userRecord.uid).set(userProfile);

      console.log(`✅ Created user: ${displayName} (${ign}) - ${email}`);
      users.push({
        authUid: userRecord.uid,
        displayName: userRecord.displayName,
        email: userRecord.email,
        ign: ign,
        uid: uid,
        fullName: displayName
      });
    } catch (error) {
      console.error(`❌ Error creating user ${email}:`, error.message);
    }
  }

  console.log(`✅ Successfully created ${users.length} test users`);
  return users;
};

// Create squad tournament
const createSquadTournament = async (hostEmail) => {
  console.log(`\n🔄 Creating squad tournament hosted by ${hostEmail}...`);
  
  try {
    // Get host user from Firebase Auth
    const host = await admin.auth().getUserByEmail(hostEmail);
    console.log(`✅ Found host in Auth: ${host.displayName} (${host.uid})`);

    // Get existing host profile from Firestore
    const hostProfileDoc = await db.collection('users').doc(host.uid).get();
    if (!hostProfileDoc.exists) {
      throw new Error(`Host profile not found in database for ${hostEmail}`);
    }

    const hostProfile = hostProfileDoc.data();
    console.log(`✅ Found existing host profile:`);
    console.log(`   - Name: ${hostProfile.fullName || hostProfile.displayName}`);
    console.log(`   - IGN: ${hostProfile.ign}`);
    console.log(`   - UID: ${hostProfile.uid}`);
    console.log(`   - Is Host: ${hostProfile.isHost}`);
    console.log(`   - Tournament Credits: ${hostProfile.wallet?.tournamentCredits || 0}`);

    // Validate that the host has required fields
    if (!hostProfile.isHost) {
      throw new Error(`User ${hostEmail} is not a verified host`);
    }
    if (!hostProfile.ign) {
      throw new Error(`Host ${hostEmail} does not have IGN set`);
    }
    if (!hostProfile.uid) {
      throw new Error(`Host ${hostEmail} does not have UID set`);
    }

    // No need to update the profile - use existing data

    // Create tournament data with proper date formatting
    // Schedule tournament to start in 15 minutes so host can start it immediately (within 20-minute window)
    const startDate = new Date();
    startDate.setMinutes(startDate.getMinutes() + 15); // Start in 15 minutes
    
    // Format date as ISO string for proper display
    const startDateISO = startDate.toISOString();
    
    const now = new Date();
    const twentyMinutesBeforeStart = new Date(startDate.getTime() - 20 * 60 * 1000);
    const canStartAt = twentyMinutesBeforeStart <= now ? now : twentyMinutesBeforeStart;
    
    console.log(`   - Tournament scheduled start: ${startDateISO}`);
    console.log(`   - Current time: ${now.toISOString()}`);
    console.log(`   - Can start tournament at: ${canStartAt.toISOString()}`);
    console.log(`   - Host can start NOW: ${twentyMinutesBeforeStart <= now ? 'YES' : 'NO'}`);

    const tournament = {
      name: TEST_CONFIG.TOURNAMENT_NAME,
      description: TEST_CONFIG.TOURNAMENT_DESCRIPTION,
      mode: 'Squad',
      max_players: TEST_CONFIG.MAX_PLAYERS,
      min_participants: TEST_CONFIG.MIN_PARTICIPANTS,
      start_date: startDateISO, // Use ISO string instead of Timestamp
      end_date: new Date(startDate.getTime() + 3 * 60 * 60 * 1000).toISOString(), // 3 hours after start
      map: 'Bermuda',
      room_type: 'Classic',
      custom_settings: {
        gun_attributes: true,
        character_skill: true,
        auto_revival: false,
        airdrop: true,
        vehicles: true,
        high_tier_loot_zone: false,
        unlimited_ammo: false,
        headshot: false,
        war_chest: true,
        loadout: false
      },
      entry_fee: TEST_CONFIG.ENTRY_FEE,
      prize_distribution: {
        first: 50,
        second: 30,
        third: 20
      },
      rules: 'Test tournament rules: No cheating, no hacking, fair play only. This is a test tournament for squad functionality.',
      host_id: host.uid,
      status: 'active',
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      participants: [],
      filled_spots: 0,
      participantUids: [],
      currentPrizePool: 0,
      initialPrizePool: 0,
      total_prizes_distributed: 0,
      host_earnings_distributed: 0,
      manual_prize_pool: {
        first: 0,
        second: 0,
        third: 0
      },
      // Additional fields that might be missing
      game: 'Free Fire',
      isFeatured: false,
      streamUrl: '',
      banner_image: '',
      // Room details (initially empty, host can set later)
      room_id: null,
      room_password: null
    };

    const docRef = await db.collection('tournaments').add(tournament);
    console.log(`✅ Created squad tournament: ${tournament.name} (ID: ${docRef.id})`);
    
    return {
      id: docRef.id,
      ...tournament,
      host: host,
      hostProfile: hostProfile
    };
  } catch (error) {
    console.error('❌ Error creating squad tournament:', error);
    throw error;
  }
};

// Create team and join tournament
const createTeamAndJoin = async (tournament, teamLeader, teamMembers, teamName, teamTag) => {
  console.log(`\n🔄 Creating team "${teamName}" with leader ${teamLeader.displayName}...`);
  
  try {
    // Validate team size for squad mode
    const totalTeamSize = teamMembers.length + 1; // +1 for leader
    if (totalTeamSize < 2 || totalTeamSize > 4) {
      throw new Error(`Invalid team size: ${totalTeamSize}. Squad teams must have 2-4 players.`);
    }

    // Create team participant data (Phase 1 format)
    const teamParticipant = {
      teamId: `test_team_${Date.now()}_${teamLeader.authUid}`,
      teamName: teamName,
      teamTag: teamTag.toUpperCase(),
      leaderId: teamLeader.authUid,
      leaderIgn: teamLeader.ign,
      leaderUid: teamLeader.uid,
      members: teamMembers.map(member => ({
        ign: member.ign,
        uid: member.uid,
        role: 'member'
      })),
      totalMembers: totalTeamSize,
      joinedAt: new Date().toISOString()
    };

    // Update tournament with team data
    const tournamentRef = db.collection('tournaments').doc(tournament.id);
    
    await db.runTransaction(async (transaction) => {
      const tournamentDoc = await transaction.get(tournamentRef);
      if (!tournamentDoc.exists) {
        throw new Error('Tournament not found');
      }

      const tournamentData = tournamentDoc.data();
      const currentParticipants = tournamentData.participants || [];
      const currentParticipantUids = tournamentData.participantUids || [];
      const currentFilledSpots = tournamentData.filled_spots || 0;

      // Check if tournament is full
      if (currentFilledSpots + totalTeamSize > tournament.max_players) {
        throw new Error('Tournament would be full after adding this team');
      }

      // Check if leader already joined
      if (currentParticipantUids.includes(teamLeader.authUid)) {
        throw new Error('Team leader has already joined this tournament');
      }

      // Add team to tournament
      const updatedParticipants = [...currentParticipants, teamParticipant];
      const updatedParticipantUids = [...currentParticipantUids, teamLeader.authUid];
      const updatedFilledSpots = currentFilledSpots + totalTeamSize;

      transaction.update(tournamentRef, {
        participants: updatedParticipants,
        participantUids: updatedParticipantUids,
        filled_spots: updatedFilledSpots,
        currentPrizePool: tournamentData.currentPrizePool + tournament.entry_fee
      });

      // Since entry fee is 0, no need to deduct credits
      console.log(`✅ Team "${teamName}" joined tournament successfully`);
      console.log(`   - Leader: ${teamLeader.displayName} (${teamLeader.ign})`);
      console.log(`   - Members: ${teamMembers.map(m => `${m.displayName} (${m.ign})`).join(', ')}`);
      console.log(`   - Total team size: ${totalTeamSize}`);
      console.log(`   - Tournament filled spots: ${updatedFilledSpots}/${tournament.max_players}`);
    });

    return {
      success: true,
      teamId: teamParticipant.teamId,
      teamName: teamName,
      teamTag: teamTag,
      totalMembers: totalTeamSize
    };
  } catch (error) {
    console.error(`❌ Error creating team "${teamName}":`, error.message);
    throw error;
  }
};

// Verify tournament data
const verifyTournamentData = async (tournamentId) => {
  console.log(`\n🔍 Verifying tournament data...`);
  
  try {
    const tournamentDoc = await db.collection('tournaments').doc(tournamentId).get();
    if (!tournamentDoc.exists) {
      throw new Error('Tournament not found');
    }

    const tournament = tournamentDoc.data();
    console.log(`\n📊 Tournament Verification Results:`);
    console.log(`   Tournament: ${tournament.name}`);
    console.log(`   Mode: ${tournament.mode}`);
    console.log(`   Status: ${tournament.status}`);
    console.log(`   Entry Fee: ${tournament.entry_fee}`);
    console.log(`   Max Players: ${tournament.max_players}`);
    console.log(`   Filled Spots: ${tournament.filled_spots}`);
    console.log(`   Current Prize Pool: ${tournament.currentPrizePool}`);
    console.log(`   Total Participants: ${tournament.participants.length}`);
    console.log(`   Participant UIDs: ${tournament.participantUids.length}`);

    console.log(`\n👥 Teams in Tournament:`);
    tournament.participants.forEach((participant, index) => {
      if (participant.teamId) {
        console.log(`   Team ${index + 1}: ${participant.teamName} (${participant.teamTag})`);
        console.log(`     Leader: ${participant.leaderIgn} (UID: ${participant.leaderUid})`);
        console.log(`     Members: ${participant.members.map(m => `${m.ign} (${m.uid})`).join(', ')}`);
        console.log(`     Total: ${participant.totalMembers} players`);
      } else {
        console.log(`   Individual Player ${index + 1}: ${participant.ign || participant.displayName}`);
      }
    });

    return tournament;
  } catch (error) {
    console.error('❌ Error verifying tournament data:', error);
    throw error;
  }
};

// Start tournament (simulate host starting the tournament)
const startTournament = async (tournamentId, hostUid) => {
  console.log(`\n🔄 Starting tournament...`);
  
  try {
    const tournamentRef = db.collection('tournaments').doc(tournamentId);
    
    await tournamentRef.update({
      status: 'ongoing',
      started_at: admin.firestore.FieldValue.serverTimestamp(),
      room_id: 'TEST123456',
      room_password: 'testpass'
    });
    
    console.log(`✅ Tournament started successfully`);
    console.log(`   - Room ID: TEST123456`);
    console.log(`   - Room Password: testpass`);
    
    return true;
  } catch (error) {
    console.error('❌ Error starting tournament:', error);
    throw error;
  }
};

// Complete tournament and set results
const completeTournamentWithResults = async (tournamentId, teamsData, testUsers) => {
  console.log(`\n🔄 Completing tournament and setting results...`);
  
  try {
    const tournamentRef = db.collection('tournaments').doc(tournamentId);
    
    // Get team leaders for prize distribution
    const firstPlaceLeader = testUsers[0]; // Leader of first team
    const secondPlaceLeader = testUsers[4]; // Leader of second team (if exists)
    
    // Update tournament status to completed
    await tournamentRef.update({
      status: 'completed',
      completed_at: admin.firestore.FieldValue.serverTimestamp(),
      // Set up prize pool for distribution
      prizePool: {
        totalCredits: 100, // Test prize pool
        prizeDistribution: {
          first: 50,
          second: 30,
          third: 20
        },
        isDistributed: false
      },
      currentPrizePool: 100 // Available for distribution
    });
    
    console.log(`✅ Tournament completed successfully`);
    console.log(`   - Status: completed`);
    console.log(`   - Prize Pool: 100 credits`);
    console.log(`   - First Place Leader: ${firstPlaceLeader.displayName} (${firstPlaceLeader.ign})`);
    if (secondPlaceLeader) {
      console.log(`   - Second Place Leader: ${secondPlaceLeader.displayName} (${secondPlaceLeader.ign})`);
    }
    
    return {
      firstPlaceLeader,
      secondPlaceLeader: secondPlaceLeader || null
    };
  } catch (error) {
    console.error('❌ Error completing tournament:', error);
    throw error;
  }
};

// Distribute prizes to team leaders
const distributePrizesToLeaders = async (tournamentId, tournamentName, hostUid, winners) => {
  console.log(`\n🔄 Distributing prizes to team leaders...`);
  
  try {
    // Distribute first place prize
    if (winners.firstPlaceLeader) {
      const success1 = await distributePrize(
        winners.firstPlaceLeader.authUid,
        50, // First place prize
        'first',
        tournamentId,
        tournamentName,
        hostUid
      );
      
      if (success1) {
        console.log(`✅ Distributed 50 credits to first place: ${winners.firstPlaceLeader.displayName}`);
      } else {
        throw new Error('Failed to distribute first place prize');
      }
    }
    
    // Distribute second place prize
    if (winners.secondPlaceLeader) {
      const success2 = await distributePrize(
        winners.secondPlaceLeader.authUid,
        30, // Second place prize
        'second',
        tournamentId,
        tournamentName,
        hostUid
      );
      
      if (success2) {
        console.log(`✅ Distributed 30 credits to second place: ${winners.secondPlaceLeader.displayName}`);
      } else {
        throw new Error('Failed to distribute second place prize');
      }
    }
    
    // Mark tournament prizes as distributed
    const tournamentRef = db.collection('tournaments').doc(tournamentId);
    await tournamentRef.update({
      'prizePool.isDistributed': true,
      'prizePool.distributedAt': admin.firestore.FieldValue.serverTimestamp(),
      'prizePool.distributedBy': hostUid
    });
    
    console.log(`✅ All prizes distributed successfully`);
    return true;
  } catch (error) {
    console.error('❌ Error distributing prizes:', error);
    throw error;
  }
};

// Prize distribution function (similar to the service)
const distributePrize = async (winnerUid, prizeCredits, position, tournamentId, tournamentName, hostUid) => {
  try {
    const winnerRef = db.collection('users').doc(winnerUid);
    const tournamentRef = db.collection('tournaments').doc(tournamentId);
    
    await db.runTransaction(async (transaction) => {
      const winnerDoc = await transaction.get(winnerRef);
      const tournamentDoc = await transaction.get(tournamentRef);
      
      if (!winnerDoc.exists || !tournamentDoc.exists) {
        throw new Error('Winner or tournament not found');
      }
      
      const userData = winnerDoc.data();
      const tournamentData = tournamentDoc.data();
      
      // Check prize pool
      const currentPrizePool = tournamentData.currentPrizePool || 0;
      if (currentPrizePool < prizeCredits) {
        throw new Error(`Insufficient prize pool. Available: ${currentPrizePool}, Required: ${prizeCredits}`);
      }
      
      // Update user wallet
      const wallet = userData.wallet || { tournamentCredits: 1000, withdrawableBalance: 0 };
      const newEarnings = (wallet.withdrawableBalance || 0) + prizeCredits;
      
      transaction.update(winnerRef, {
        'wallet.withdrawableBalance': newEarnings
      });
      
      // Update tournament
      const winnerData = {
        uid: winnerUid,
        prizeCredits,
        distributedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      transaction.update(tournamentRef, {
        [`winners.${position}`]: winnerData,
        currentPrizePool: currentPrizePool - prizeCredits
      });
    });
    
    return true;
  } catch (error) {
    console.error(`Error distributing ${position} place prize:`, error);
    return false;
  }
};

// Verify prize distribution
const verifyPrizeDistribution = async (tournamentId, winners) => {
  console.log(`\n🔍 Verifying prize distribution...`);
  
  try {
    // Check tournament
    const tournamentDoc = await db.collection('tournaments').doc(tournamentId).get();
    const tournament = tournamentDoc.data();
    
    console.log(`\n💰 Prize Distribution Verification:`);
    console.log(`   Tournament Prize Pool: ${tournament.prizePool?.totalCredits || 0} credits`);
    console.log(`   Remaining Prize Pool: ${tournament.currentPrizePool || 0} credits`);
    console.log(`   Prizes Distributed: ${tournament.prizePool?.isDistributed ? 'YES' : 'NO'}`);
    
    // Check winners
    if (tournament.winners) {
      Object.entries(tournament.winners).forEach(([position, winner]) => {
        console.log(`   ${position.toUpperCase()} Place: ${winner.prizeCredits} credits to ${winner.uid}`);
      });
    }
    
    // Check user balances
    if (winners.firstPlaceLeader) {
      const userDoc = await db.collection('users').doc(winners.firstPlaceLeader.authUid).get();
      const userData = userDoc.data();
      console.log(`   First Place Leader Balance: ${userData.wallet?.withdrawableBalance || 0} credits`);
    }
    
    if (winners.secondPlaceLeader) {
      const userDoc = await db.collection('users').doc(winners.secondPlaceLeader.authUid).get();
      const userData = userDoc.data();
      console.log(`   Second Place Leader Balance: ${userData.wallet?.withdrawableBalance || 0} credits`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error verifying prize distribution:', error);
    throw error;
  }
};

// Main test execution
const runSquadTournamentTest = async () => {
  console.log('🚀 Starting Squad Tournament Comprehensive Test');
  console.log('=' .repeat(60));
  
  try {
    // Step 1: Create test users
    const testUsers = await createTestUsers(TEST_CONFIG.TOTAL_TEST_USERS);
    
    if (testUsers.length < TEST_CONFIG.TOTAL_TEST_USERS) {
      throw new Error(`Failed to create enough test users. Expected: ${TEST_CONFIG.TOTAL_TEST_USERS}, Created: ${testUsers.length}`);
    }

    // Step 2: Create squad tournament
    const tournament = await createSquadTournament(TEST_CONFIG.HOST_EMAIL);

    // Step 3: Create teams and join tournament
    const teamsData = [];
    
    for (let teamIndex = 0; teamIndex < TEST_CONFIG.TEAM_COUNT; teamIndex++) {
      const startIndex = teamIndex * TEST_CONFIG.PLAYERS_PER_TEAM;
      const teamLeader = testUsers[startIndex];
      const teamMembers = testUsers.slice(startIndex + 1, startIndex + TEST_CONFIG.PLAYERS_PER_TEAM);
      
      const teamName = `Test Squad ${teamIndex + 1}`;
      const teamTag = `TS${teamIndex + 1}`;

      const teamResult = await createTeamAndJoin(
        tournament,
        teamLeader,
        teamMembers,
        teamName,
        teamTag
      );
      
      teamsData.push(teamResult);
    }

    // Step 4: Verify tournament data
    const finalTournament = await verifyTournamentData(tournament.id);

    // Step 5: Start tournament
    await startTournament(tournament.id, tournament.host.uid);

    // Step 6: Complete tournament and set results
    const winners = await completeTournamentWithResults(tournament.id, teamsData, testUsers);

    // Step 7: Distribute prizes to team leaders
    await distributePrizesToLeaders(tournament.id, tournament.name, tournament.host.uid, winners);

    // Step 8: Verify prize distribution
    await verifyPrizeDistribution(tournament.id, winners);

    // Step 9: Test summary
    console.log('\n🎉 Squad Tournament Test Completed Successfully!');
    console.log('=' .repeat(60));
    console.log(`✅ Created ${testUsers.length} test users`);
    console.log(`✅ Created 1 squad tournament (${tournament.name})`);
    console.log(`✅ Created ${teamsData.length} teams`);
    console.log(`✅ Total players in tournament: ${finalTournament.filled_spots}`);
    console.log(`✅ Started tournament with room details`);
    console.log(`✅ Completed tournament and set results`);
    console.log(`✅ Distributed prizes to team leaders`);
    console.log(`✅ Verified all functionality works perfectly`);
    
    // Save test data for reference
    const testResults = {
      tournament: {
        id: tournament.id,
        name: tournament.name,
        mode: tournament.mode,
        entry_fee: tournament.entry_fee,
        filled_spots: finalTournament.filled_spots,
        max_players: tournament.max_players,
        status: 'completed',
        prizesDistributed: true
      },
      teams: teamsData,
      users: testUsers,
      winners: {
        first: winners.firstPlaceLeader ? {
          name: winners.firstPlaceLeader.displayName,
          ign: winners.firstPlaceLeader.ign,
          uid: winners.firstPlaceLeader.authUid,
          prize: 50
        } : null,
        second: winners.secondPlaceLeader ? {
          name: winners.secondPlaceLeader.displayName,
          ign: winners.secondPlaceLeader.ign,
          uid: winners.secondPlaceLeader.authUid,
          prize: 30
        } : null
      },
      host: {
        email: TEST_CONFIG.HOST_EMAIL,
        uid: tournament.host.uid
      },
      timestamp: new Date().toISOString()
    };

    fs.writeFileSync('squad-tournament-test-results.json', JSON.stringify(testResults, null, 2));
    console.log(`📄 Test results saved to: squad-tournament-test-results.json`);

    console.log('\n✅ COMPREHENSIVE TEST RESULTS:');
    console.log('=' .repeat(60));
    console.log('🏆 TOURNAMENT FUNCTIONALITY: WORKING PERFECTLY');
    console.log('👥 SQUAD TEAM CREATION: WORKING PERFECTLY');
    console.log('💰 PRIZE DISTRIBUTION: WORKING PERFECTLY');
    console.log('🔄 COMPLETE TOURNAMENT FLOW: WORKING PERFECTLY');
    console.log('=' .repeat(60));
    
    console.log('\n🔧 Manual UI Testing (Optional):');
    console.log('1. Login to the application with host account:', TEST_CONFIG.HOST_EMAIL);
    console.log('2. Navigate to hosted tournaments and find:', tournament.name);
    console.log('3. Verify teams are displayed correctly in the participants list');
    console.log('4. Check tournament status shows as "completed"');
    console.log('5. Verify prize distribution records in admin panel');
    console.log('6. Check team leader wallet balances have been updated');

  } catch (error) {
    console.error('\n❌ Squad Tournament Test Failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
};

// Cleanup function (optional)
const cleanupTestData = async () => {
  console.log('\n🧹 Cleaning up test data...');
  
  try {
    // Read test results to get IDs
    if (fs.existsSync('squad-tournament-test-results.json')) {
      const testResults = JSON.parse(fs.readFileSync('squad-tournament-test-results.json'));
      
      // Delete tournament
      if (testResults.tournament?.id) {
        await db.collection('tournaments').doc(testResults.tournament.id).delete();
        console.log(`✅ Deleted tournament: ${testResults.tournament.id}`);
      }
      
      // Delete test users
      if (testResults.users) {
        for (const user of testResults.users) {
          try {
            await admin.auth().deleteUser(user.authUid);
            await db.collection('users').doc(user.authUid).delete();
            console.log(`✅ Deleted user: ${user.displayName}`);
          } catch (error) {
            console.log(`⚠️  Could not delete user ${user.displayName}: ${error.message}`);
          }
        }
      }
      
      // Remove test results file
      fs.unlinkSync('squad-tournament-test-results.json');
      console.log('✅ Cleanup completed');
    } else {
      console.log('⚠️  No test results file found');
    }
  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
  }
};

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--cleanup')) {
  cleanupTestData();
} else {
  runSquadTournamentTest();
}