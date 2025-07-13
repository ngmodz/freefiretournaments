import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

const firebaseConfig = {
  // Add your Firebase config here
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function testPrizeDistribution() {
  try {
    // Sign in anonymously for testing
    await signInAnonymously(auth);
    console.log('✅ Signed in');

    // Test tournament ID (replace with actual tournament ID)
    const tournamentId = 'test-tournament-123';
    
    // Get tournament data
    const tournamentRef = doc(db, 'tournaments', tournamentId);
    const tournamentSnap = await getDoc(tournamentRef);
    
    if (!tournamentSnap.exists()) {
      console.log('❌ Tournament not found');
      return;
    }
    
    const tournament = tournamentSnap.data();
    console.log('📊 Tournament current prize pool:', tournament.currentPrizePool);
    console.log('🏆 Tournament status:', tournament.status);
    
    // Test prize distribution data
    const testWinners = [
      { 
        userId: 'user1', 
        username: 'TestUser1', 
        position: 1, 
        amount: 100 
      },
      { 
        userId: 'user2', 
        username: 'TestUser2', 
        position: 2, 
        amount: 50 
      }
    ];
    
    const totalPrizes = testWinners.reduce((sum, winner) => sum + winner.amount, 0);
    const newCurrentPrizePool = tournament.currentPrizePool - totalPrizes;
    
    console.log('💰 Total prizes to distribute:', totalPrizes);
    console.log('💰 New prize pool after distribution:', newCurrentPrizePool);
    
    // Simulate prize distribution update
    const updateData = {
      winners: testWinners,
      currentPrizePool: newCurrentPrizePool
    };
    
    console.log('🔄 Testing prize distribution update...');
    
    // This will test our Firestore rules
    await updateDoc(tournamentRef, updateData);
    
    console.log('✅ Prize distribution successful!');
    console.log('✅ All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testPrizeDistribution();
