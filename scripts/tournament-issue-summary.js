import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDtMRCW8yZjbhL6PSJHrIx7qzJlWHJJ9e8",
  authDomain: "freefire-tournaments-ba2a6.firebaseapp.com",
  projectId: "freefire-tournaments-ba2a6",
  storageBucket: "freefire-tournaments-ba2a6.appspot.com",
  messagingSenderId: "1096983059652",
  appId: "1:1096983059652:web:a3a8c9c4f2a3b6c7d8e9f0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function summarizeIssue() {
  console.log('=== TOURNAMENT DELETION ISSUE SUMMARY ===\n');
  
  // Check the problematic tournament
  const tournamentId = 'hqVhhe0br6vbFr0ElAO6';
  
  try {
    const docRef = doc(db, 'tournaments', tournamentId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      
      console.log('📋 Tournament Details:');
      console.log(`  ID: ${tournamentId}`);
      console.log(`  Name: ${data.name}`);
      console.log(`  Status: ${data.status}`);
      console.log(`  Start Date: ${data.start_date}`);
      console.log(`  Started At: ${data.started_at ? data.started_at.toDate().toISOString() : 'Not started'}`);
      console.log(`  Ended At: ${data.ended_at ? data.ended_at.toDate().toISOString() : 'Not ended'}`);
      console.log(`  TTL: ${data.ttl ? data.ttl.toDate().toISOString() : '❌ NOT SET'}`);
      
      console.log('\n🔍 Analysis:');
      if (data.status === 'ended' && data.ended_at && !data.ttl) {
        const endedAt = data.ended_at.toDate();
        const shouldExpireAt = new Date(endedAt.getTime() + 10 * 60 * 1000);
        const now = new Date();
        const overdue = Math.floor((now - shouldExpireAt) / 1000 / 60);
        
        console.log(`  ❌ Tournament ended but TTL not set`);
        console.log(`  ❌ Should have expired at: ${shouldExpireAt.toISOString()}`);
        console.log(`  ❌ Overdue by: ${overdue} minutes`);
        console.log(`  ❌ Issue: endTournament function failed to set TTL`);
      } else if (data.status === 'ongoing' && data.started_at && !data.ttl) {
        console.log(`  ❌ Tournament started but TTL not set`);
        console.log(`  ❌ Issue: startTournament function failed to set TTL`);
      } else if (data.ttl) {
        const ttlDate = data.ttl.toDate();
        const now = new Date();
        if (now > ttlDate) {
          console.log(`  ❌ Tournament expired but not deleted`);
          console.log(`  ❌ Issue: Cleanup service not working`);
        } else {
          console.log(`  ✅ Tournament has valid TTL`);
        }
      }
      
      console.log('\n💡 Solution:');
      console.log('  1. Enhanced cleanup service to handle ended tournaments without TTL');
      console.log('  2. Fixed warning thresholds (30 minutes instead of 1 minute)');
      console.log('  3. Tournament service already correctly sets 2-hour TTL');
      console.log('  4. Need to test cleanup service via UI button');
      
    } else {
      console.log('❌ Tournament not found - may have been deleted');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  console.log('\n🎯 Expected Behavior:');
  console.log('  • Host creates tournament → No TTL set');
  console.log('  • Host starts tournament → TTL set to 2 hours after scheduled time');
  console.log('  • Host ends tournament → TTL set to 10 minutes after ending');
  console.log('  • If host doesn\'t end → Tournament expires 2 hours after scheduled time');
  console.log('  • After prize distribution → Tournament can be marked as completed');
  console.log('  • Cleanup service deletes expired tournaments automatically');
}

summarizeIssue();
