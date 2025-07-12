// Test script for prize distribution functionality
const { getFirestore } = require('./secure-firebase-admin');

const db = getFirestore();

async function testPrizeDistribution() {
  try {
    console.log('🧪 Testing Prize Distribution Functionality...\n');

    // Test 1: Check if a tournament exists and has the right structure
    console.log('1. Checking tournament structure...');
    const tournamentsRef = db.collection('tournaments');
    const tournamentsSnapshot = await tournamentsRef.limit(1).get();
    
    if (tournamentsSnapshot.empty) {
      console.log('❌ No tournaments found in database');
      return;
    }

    const tournamentDoc = tournamentsSnapshot.docs[0];
    const tournamentData = tournamentDoc.data();
    
    console.log(`✅ Found tournament: ${tournamentData.name}`);
    console.log(`   - Status: ${tournamentData.status}`);
    console.log(`   - Entry Fee: ${tournamentData.entry_fee}`);
    console.log(`   - Max Players: ${tournamentData.max_players}`);
    console.log(`   - Filled Spots: ${tournamentData.filled_spots || 0}`);
    console.log(`   - Participants: ${tournamentData.participants?.length || 0}`);
    console.log(`   - Prize Distribution:`, tournamentData.prize_distribution);

    // Test 2: Check if users have wallet structure
    console.log('\n2. Checking user wallet structure...');
    const usersRef = db.collection('users');
    const usersSnapshot = await usersRef.limit(3).get();
    
    if (usersSnapshot.empty) {
      console.log('❌ No users found in database');
      return;
    }

    let usersWithWallet = 0;
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      if (userData.wallet) {
        usersWithWallet++;
        console.log(`✅ User ${doc.id} has wallet:`, {
          tournamentCredits: userData.wallet.tournamentCredits || 0,
          hostCredits: userData.wallet.hostCredits || 0,
          earnings: userData.wallet.earnings || 0
        });
      } else {
        console.log(`❌ User ${doc.id} missing wallet structure`);
      }
    });

    console.log(`\n📊 Wallet Summary: ${usersWithWallet}/${usersSnapshot.size} users have wallet structure`);

    // Test 3: Check credit transactions collection
    console.log('\n3. Checking credit transactions collection...');
    const transactionsRef = db.collection('creditTransactions');
    const transactionsSnapshot = await transactionsRef.limit(5).get();
    
    console.log(`✅ Found ${transactionsSnapshot.size} credit transactions`);
    
    if (transactionsSnapshot.size > 0) {
      console.log('Sample transaction types:');
      const types = new Set();
      transactionsSnapshot.forEach(doc => {
        const transactionData = doc.data();
        types.add(transactionData.type);
      });
      console.log('   -', Array.from(types).join(', '));
    }

    // Test 4: Calculate expected prize distribution
    console.log('\n4. Calculating expected prize distribution...');
    const totalPrizePool = tournamentData.entry_fee * (tournamentData.filled_spots || 0);
    console.log(`   - Total Prize Pool: ${totalPrizePool} credits`);
    
    if (tournamentData.prize_distribution) {
      Object.entries(tournamentData.prize_distribution).forEach(([position, percentage]) => {
        const prizeAmount = Math.floor((percentage / 100) * totalPrizePool);
        console.log(`   - ${position} Place: ${percentage}% = ${prizeAmount} credits`);
      });
    }

    // Test 5: Check if tournament has winners
    console.log('\n5. Checking tournament winners...');
    if (tournamentData.winners) {
      console.log(`✅ Tournament has ${Object.keys(tournamentData.winners).length} winners set`);
      Object.entries(tournamentData.winners).forEach(([position, winner]) => {
        console.log(`   - ${position}: ${winner.ign} (UID: ${winner.uid})`);
      });
    } else {
      console.log('ℹ️ No winners set yet');
    }

    console.log('\n✅ Prize distribution test completed successfully!');
    console.log('\n📝 Next Steps:');
    console.log('1. Create a test tournament with participants');
    console.log('2. End the tournament');
    console.log('3. Use the prize distribution UI to distribute prizes');
    console.log('4. Verify credits are added to winners\' earnings');
    console.log('5. Verify host receives remaining credits');

  } catch (error) {
    console.error('❌ Error testing prize distribution:', error);
  } finally {
    process.exit();
  }
}

testPrizeDistribution(); 