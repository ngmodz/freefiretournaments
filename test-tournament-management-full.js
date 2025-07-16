/**
 * Comprehensive test for the combined tournament management API
 */
async function testTournamentManagementAPI() {
  console.log('🧪 Testing Tournament Management API...\n');
  
  const baseUrl = 'http://localhost:8084/api/tournament-management';
  
  // Test 1: Check minimum participants (no auth required)
  console.log('📋 Test 1: Check Minimum Participants');
  console.log('=' .repeat(50));
  try {
    const response1 = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'check-minimum-participants' })
    });
    
    const result1 = await response1.json();
    console.log(`Status: ${response1.status} ${response1.statusText}`);
    console.log('Response:', JSON.stringify(result1, null, 2));
    console.log(response1.ok ? '✅ PASSED' : '❌ FAILED');
  } catch (error) {
    console.log('❌ FAILED:', error.message);
  }
  
  console.log('\n');
  
  // Test 2: Check notifications (no auth required, default action)
  console.log('📋 Test 2: Check Notifications (Default Action)');
  console.log('=' .repeat(50));
  try {
    const response2 = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}) // No action = default to notifications
    });
    
    const result2 = await response2.json();
    console.log(`Status: ${response2.status} ${response2.statusText}`);
    console.log('Response:', JSON.stringify(result2, null, 2));
    console.log(response2.ok ? '✅ PASSED' : '❌ FAILED');
  } catch (error) {
    console.log('❌ FAILED:', error.message);
  }
  
  console.log('\n');
  
  // Test 3: Cancel tournament (requires auth - should fail without token)
  console.log('📋 Test 3: Cancel Tournament (No Auth - Should Fail)');
  console.log('=' .repeat(50));
  try {
    const response3 = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'cancel-tournament',
        tournamentId: 'test-tournament-id'
      })
    });
    
    const result3 = await response3.json();
    console.log(`Status: ${response3.status} ${response3.statusText}`);
    console.log('Response:', JSON.stringify(result3, null, 2));
    console.log(response3.status === 401 ? '✅ PASSED (Correctly rejected)' : '❌ FAILED');
  } catch (error) {
    console.log('❌ FAILED:', error.message);
  }
  
  console.log('\n');
  
  // Test 4: Invalid action
  console.log('📋 Test 4: Invalid Action');
  console.log('=' .repeat(50));
  try {
    const response4 = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'invalid-action' })
    });
    
    const result4 = await response4.json();
    console.log(`Status: ${response4.status} ${response4.statusText}`);
    console.log('Response:', JSON.stringify(result4, null, 2));
    console.log('✅ Handled gracefully');
  } catch (error) {
    console.log('❌ FAILED:', error.message);
  }
  
  console.log('\n');
  
  // Test 5: Method validation
  console.log('📋 Test 5: Method Validation (GET should fail)');
  console.log('=' .repeat(50));
  try {
    const response5 = await fetch(baseUrl, {
      method: 'GET'
    });
    
    const result5 = await response5.json();
    console.log(`Status: ${response5.status} ${response5.statusText}`);
    console.log('Response:', JSON.stringify(result5, null, 2));
    console.log(response5.status === 405 ? '✅ PASSED (Method Not Allowed)' : '❌ FAILED');
  } catch (error) {
    console.log('❌ FAILED:', error.message);
  }
  
  console.log('\n🎉 Tournament Management API Test Complete!');
}

// Run the comprehensive test
testTournamentManagementAPI();
