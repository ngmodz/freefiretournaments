/**
 * Simple test to verify the minimum participants API endpoint
 */
async function testMinimumParticipantsAPI() {
  try {
    console.log('🧪 Testing minimum participants API endpoint...');
    
    const apiUrl = 'http://localhost:8084/api/tournament-management';
    
    console.log(`📡 Calling: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'check-minimum-participants'
      }),
    });
    
    console.log(`📊 Response Status: ${response.status} ${response.statusText}`);
    
    const result = await response.json();
    
    console.log('📋 Response Body:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('✅ API endpoint is working correctly!');
      console.log(`Tournaments checked: ${result.checkedCount || 0}`);
      console.log(`Tournaments cancelled: ${result.cancelledCount || 0}`);
    } else {
      console.log('❌ API returned an error:', result.error || result.message);
    }
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
  }
}

// Test the API
testMinimumParticipantsAPI();
