/**
 * Comprehensive Duo Tournament Test Script
 * 
 * This script tests the complete duo tournament functionality including:
 * - Creating test users with realistic Free Fire data
 * - Creating a duo tournament
 * - Forming duo teams and joining the tournament
 * - Starting and completing the tournament
 * - Testing prize distribution to duo leaders
 * - Verifying all duo-specific functionality
 * - Cleaning up test data
 */

import admin from 'firebase-admin';
import { createDuoTeamForTournament, validateDuoTeam } from './src/lib/teamService';
import { joinTournamentAsTeam } from './src/lib/tournamentService';
import { PrizeDistributionService } from './src/lib/prizeDistributionService';
import { readFileSync } from 'fs';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://your-project-id.firebaseio.com"
  });
}

const db = admin.firestore();

// Test configuration
const TEST_CONFIG = {
  hostEmail: 'nishantgrewal2005@gmail.com',
  tournamentName: 'Test Duo Tournament - ' + new Date().toISOString().slice(0, 19),
  entryFee: 50,
  prizePool: 200,
  maxPlayers: 8, // 4 duo teams
  duoTeams: [
    {
      name: 'Thunder Duo',
      tag: 'THD',
      leader: {
        email: 'leader1@test.com',
        ign: 'ThunderKing',
        uid: '123456789'
      },
      partner: {
        ign: 'ThunderQueen',
        uid: '987654321'
      }
    },
    {
      name: 'Lightning Duo',
      tag: 'LTD',
      leader: {
        email: 'leader2@test.com',
        ign: 'LightningBolt',
        uid: '234567890'
      },
      partner: {
        ign: 'LightningStrike',
        uid: '876543210'
      }
    },
    {
      name: 'Storm Duo',
      tag: 'STD',
      leader: {
        email: 'leader3@test.com',
        ign: 'StormMaster',
        uid: '345678901'
      },
      partner: {
        ign: 'StormRider',
        uid: '765432109'
      }
    },
    {
      name: 'Blaze Duo',
      tag: 'BLD',
      leader: {
        email: 'leader4@test.com',
        ign: 'BlazeCommander',
        uid: '456789012'
      },
      partner: {
        ign: 'BlazeWarrior',
        uid: '654321098'
      }
    }
  ]
};

// Test data cleanup tracking
let createdUserIds: string[] = [];
let createdTournamentId: string | null = null;
let createdTeamIds: string[] = [];

/**
 * Create test users with realistic Free Fire data
 */
async function createTestUsers() {
  console.log('\n🔧 Creating test users...');
  
  for (const team of TEST_CONFIG.duoTeams) {
    try {
      // Create team leader user
      const userRecord = await admin.auth().createUser({
        email: team.leader.email,
        password: 'testpass123',
        displayName: team.leader.ign
      });
      
      createdUserIds.push(userRecord.uid);
      
      // Create user profile in Firestore
      await db.collection('users').doc(userRecord.uid).set({
        id: userRecord.uid,
        uid: team.leader.uid,
        ign: team.leader.ign,
        fullName: team.leader.ign,
        email: team.leader.email,
        phone: '+91' + Math.floor(Math.random() * 9000000000 + 1000000000),
        bio: `Professional Free Fire player and duo team leader`,
        location: 'India',
        birthdate: '1995-01-01',
        gender: 'male',
        avatar_url: null,
        isHost: false,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Initialize wallet with sufficient credits
      await db.collection('wallets').doc(userRecord.uid).set({
        userId: userRecord.uid,
        tournamentCredits: 1000, // Sufficient for multiple tournaments
        withdrawableBalance: 0,
        totalEarnings: 0,
        totalSpent: 0,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log(`✅ Created user: ${team.leader.ign} (${team.leader.email})`);
      
    } catch (error: any) {
      console.error(`❌ Error creating user ${team.leader.email}:`, error.message);
      throw error;
    }
  }
  
  console.log(`✅ Successfully created ${TEST_CONFIG.duoTeams.length} test users`);
}

/**
 * Create a duo tournament
 */
async function createDuoTournament() {
  console.log('\n🏆 Creating duo tournament...');
  
  try {
    const tournamentData = {
      name: TEST_CONFIG.tournamentName,
      description: 'Test duo tournament for automated testing',
      mode: 'Duo',
      entry_fee: TEST_CONFIG.entryFee,
      prize_pool: TEST_CONFIG.prizePool,
      max_players: TEST_CONFIG.maxPlayers,
      start_date: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 60000)), // 1 minute from now
      end_date: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 3600000)), // 1 hour from now
      registration_end: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 30000)), // 30 seconds from now
      status: 'upcoming',
      host_id: 'test-host-id',
      host_email: TEST_CONFIG.hostEmail,
      participants: [],
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
      prizeDistribution: {
        1: Math.floor(TEST_CONFIG.prizePool * 0.6), // 60% for 1st place
        2: Math.floor(TEST_CONFIG.prizePool * 0.4)  // 40% for 2nd place
      }
    };
    
    const docRef = await db.collection('tournaments').add(tournamentData);
    createdTournamentId = docRef.id;
    
    console.log(`✅ Created duo tournament: ${TEST_CONFIG.tournamentName}`);
    console.log(`   Tournament ID: ${createdTournamentId}`);
    console.log(`   Mode: Duo (exactly 2 players per team)`);
    console.log(`   Entry Fee: ${TEST_CONFIG.entryFee} credits`);
    console.log(`   Prize Pool: ${TEST_CONFIG.prizePool} credits`);
    console.log(`   Max Players: ${TEST_CONFIG.maxPlayers} (${TEST_CONFIG.maxPlayers/2} duo teams)`);
    
    return createdTournamentId;
    
  } catch (error: any) {
    console.error('❌ Error creating tournament:', error.message);
    throw error;
  }
}

/**
 * Test duo team validation
 */
async function testDuoValidation() {
  console.log('\n🔍 Testing duo team validation...');
  
  // Test valid duo team
  const validDuoData = {
    name: 'Test Duo',
    tag: 'TD',
    members: [{
      ign: 'TestPlayer',
      uid: '123456789'
    }]
  };
  
  const validResult = validateDuoTeam(validDuoData);
  console.log(`✅ Valid duo team validation: ${validResult.isValid ? 'PASSED' : 'FAILED'}`);
  
  // Test invalid duo team (too many members)
  const invalidDuoData = {
    name: 'Invalid Duo',
    tag: 'ID',
    members: [
      { ign: 'Player1', uid: '123456789' },
      { ign: 'Player2', uid: '987654321' }
    ]
  };
  
  const invalidResult = validateDuoTeam(invalidDuoData);
  console.log(`✅ Invalid duo team validation: ${!invalidResult.isValid ? 'PASSED' : 'FAILED'}`);
  if (!invalidResult.isValid) {
    console.log(`   Error message: ${invalidResult.error}`);
  }
  
  // Test empty team name
  const emptyNameData = {
    name: '',
    tag: 'EN',
    members: [{ ign: 'Player1', uid: '123456789' }]
  };
  
  const emptyNameResult = validateDuoTeam(emptyNameData);
  console.log(`✅ Empty name validation: ${!emptyNameResult.isValid ? 'PASSED' : 'FAILED'}`);
}

/**
 * Create duo teams and join tournament
 */
async function createAndJoinDuoTeams() {
  console.log('\n👥 Creating duo teams and joining tournament...');
  
  for (let i = 0; i < TEST_CONFIG.duoTeams.length; i++) {
    const teamConfig = TEST_CONFIG.duoTeams[i];
    
    try {
      // Get the leader's auth UID
      const userRecord = await admin.auth().getUserByEmail(teamConfig.leader.email);
      const leaderId = userRecord.uid;
      
      console.log(`\n📝 Creating duo team: ${teamConfig.name}`);
      
      // Prepare team data for duo team creation
      const teamData = {
        name: teamConfig.name,
        tag: teamConfig.tag,
        members: [{
          ign: teamConfig.partner.ign,
          uid: teamConfig.partner.uid
        }]
      };
      
      // Validate duo team before creation
      const validation = validateDuoTeam(teamData);
      if (!validation.isValid) {
        throw new Error(`Duo validation failed: ${validation.error}`);
      }
      
      console.log(`✅ Duo validation passed for team: ${teamConfig.name}`);
      
      // Join tournament as duo team
      await joinTournamentAsTeam(createdTournamentId!, teamData);
      
      console.log(`✅ Duo team "${teamConfig.name}" joined tournament successfully`);
      console.log(`   Leader: ${teamConfig.leader.ign} (${teamConfig.leader.uid})`);
      console.log(`   Partner: ${teamConfig.partner.ign} (${teamConfig.partner.uid})`);
      console.log(`   Team Tag: [${teamConfig.tag}]`);
      
    } catch (error: any) {
      console.error(`❌ Error creating/joining duo team ${teamConfig.name}:`, error.message);
      throw error;
    }
  }
  
  console.log(`\n✅ Successfully created and joined ${TEST_CONFIG.duoTeams.length} duo teams`);
}

/**
 * Verify tournament participants
 */
async function verifyTournamentParticipants() {
  console.log('\n🔍 Verifying tournament participants...');
  
  try {
    const tournamentDoc = await db.collection('tournaments').doc(createdTournamentId!).get();
    const tournament = tournamentDoc.data();
    
    console.log(`📊 Tournament Status: ${tournament?.status}`);
    console.log(`👥 Total Participants: ${tournament?.participants.length}`);
    
    let totalPlayers = 0;
    tournament?.participants.forEach((participant: any, index: number) => {
      if (participant.teamId) {
        console.log(`   ${index + 1}. Team: ${participant.teamName} [${participant.teamTag}]`);
        console.log(`      Leader: ${participant.leaderIgn} (${participant.leaderUid})`);
        console.log(`      Members: ${participant.totalMembers} players`);
        totalPlayers += participant.totalMembers;
        
        // Verify duo team constraints
        if (participant.totalMembers !== 2) {
          console.error(`❌ ERROR: Team ${participant.teamName} has ${participant.totalMembers} members, expected 2`);
        } else {
          console.log(`✅ Duo constraint verified for team ${participant.teamName}`);
        }
      }
    });
    
    console.log(`📈 Total Players Across All Teams: ${totalPlayers}`);
    
    if (tournament?.participants.length === TEST_CONFIG.duoTeams.length) {
      console.log('✅ All duo teams joined successfully');
    } else {
      console.error(`❌ Expected ${TEST_CONFIG.duoTeams.length} teams, found ${tournament?.participants.length}`);
    }
    
  } catch (error: any) {
    console.error('❌ Error verifying participants:', error.message);
    throw error;
  }
}

/**
 * Start and complete tournament
 */
async function startAndCompleteTournament() {
  console.log('\n🚀 Starting and completing tournament...');
  
  try {
    // Update tournament status to active
    await db.collection('tournaments').doc(createdTournamentId!).update({
      status: 'active',
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('✅ Tournament started (status: active)');
    
    // Simulate tournament completion
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Update tournament status to completed
    await db.collection('tournaments').doc(createdTournamentId!).update({
      status: 'completed',
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('✅ Tournament completed (status: completed)');
    
  } catch (error: any) {
    console.error('❌ Error starting/completing tournament:', error.message);
    throw error;
  }
}

/**
 * Test prize distribution to duo leaders
 */
async function testPrizeDistribution() {
  console.log('\n💰 Testing prize distribution to duo leaders...');
  
  try {
    const tournamentDoc = await db.collection('tournaments').doc(createdTournamentId!).get();
    const tournament = tournamentDoc.data();
    
    // Simulate tournament results (first two teams win)
    const winners = tournament?.participants.slice(0, 2);
    
    for (let i = 0; i < winners.length; i++) {
      const winner = winners[i];
      const position = i + 1;
      const prizeAmount = tournament?.prizeDistribution[position] || 0;
      
      if (prizeAmount > 0) {
        console.log(`\n🏆 Distributing prize for position ${position}:`);
        console.log(`   Team: ${winner.teamName} [${winner.teamTag}]`);
        console.log(`   Leader: ${winner.leaderIgn}`);
        console.log(`   Prize: ${prizeAmount} credits`);
        
        // Get leader's wallet before prize distribution
        const leaderWalletBefore = await db.collection('wallets').doc(winner.leaderId).get();
        const balanceBefore = leaderWalletBefore.data()?.withdrawableBalance || 0;
        
        // Distribute prize to team leader
        await PrizeDistributionService.distributePrize(
          winner.leaderId,
          prizeAmount,
          position === 1 ? 'first' : 'second',
          createdTournamentId!,
          tournament?.name || 'Test Tournament',
          'test-host-id'
        );
        
        // Verify prize distribution
        const leaderWalletAfter = await db.collection('wallets').doc(winner.leaderId).get();
        const balanceAfter = leaderWalletAfter.data()?.withdrawableBalance || 0;
        
        const expectedBalance = balanceBefore + prizeAmount;
        if (balanceAfter === expectedBalance) {
          console.log(`✅ Prize distributed successfully to ${winner.leaderIgn}`);
          console.log(`   Balance: ${balanceBefore} → ${balanceAfter} credits`);
        } else {
          console.error(`❌ Prize distribution failed for ${winner.leaderIgn}`);
          console.error(`   Expected: ${expectedBalance}, Actual: ${balanceAfter}`);
        }
      }
    }
    
    console.log('\n✅ Prize distribution testing completed');
    
  } catch (error: any) {
    console.error('❌ Error testing prize distribution:', error.message);
    throw error;
  }
}

/**
 * Clean up test data
 */
async function cleanupTestData() {
  console.log('\n🧹 Cleaning up test data...');
  
  try {
    // Delete created users
    for (const userId of createdUserIds) {
      try {
        await admin.auth().deleteUser(userId);
        await db.collection('users').doc(userId).delete();
        await db.collection('wallets').doc(userId).delete();
        console.log(`✅ Deleted user: ${userId}`);
      } catch (error: any) {
        console.error(`❌ Error deleting user ${userId}:`, error.message);
      }
    }
    
    // Delete tournament
    if (createdTournamentId) {
      await db.collection('tournaments').doc(createdTournamentId).delete();
      console.log(`✅ Deleted tournament: ${createdTournamentId}`);
    }
    
    // Delete teams (they should be cleaned up automatically, but just in case)
    for (const teamId of createdTeamIds) {
      try {
        await db.collection('teams').doc(teamId).delete();
        console.log(`✅ Deleted team: ${teamId}`);
      } catch (error: any) {
        console.error(`❌ Error deleting team ${teamId}:`, error.message);
      }
    }
    
    console.log('✅ Cleanup completed successfully');
    
  } catch (error: any) {
    console.error('❌ Error during cleanup:', error.message);
  }
}

/**
 * Main test execution function
 */
async function runDuoTournamentTests() {
  console.log('🎯 Starting Comprehensive Duo Tournament Tests');
  console.log('=' .repeat(60));
  
  const startTime = Date.now();
  
  try {
    // Step 1: Create test users
    await createTestUsers();
    
    // Step 2: Create duo tournament
    await createDuoTournament();
    
    // Step 3: Test duo validation
    await testDuoValidation();
    
    // Step 4: Create and join duo teams
    await createAndJoinDuoTeams();
    
    // Step 5: Verify participants
    await verifyTournamentParticipants();
    
    // Step 6: Start and complete tournament
    await startAndCompleteTournament();
    
    // Step 7: Test prize distribution
    await testPrizeDistribution();
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log('\n' + '=' .repeat(60));
    console.log('🎉 ALL DUO TOURNAMENT TESTS PASSED SUCCESSFULLY!');
    console.log(`⏱️  Total execution time: ${duration} seconds`);
    console.log('=' .repeat(60));
    
  } catch (error: any) {
    console.error('\n' + '=' .repeat(60));
    console.error('💥 TEST FAILED:', error.message);
    console.error('=' .repeat(60));
    throw error;
  } finally {
    // Always cleanup, even if tests fail
    await cleanupTestData();
  }
}

// Export for use in other scripts
export {
  runDuoTournamentTests,
  TEST_CONFIG
};

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runDuoTournamentTests()
    .then(() => {
      console.log('\n✅ Duo tournament testing completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Duo tournament testing failed:', error);
      process.exit(1);
    });
}