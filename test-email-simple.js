/**
 * Simple Host Approval Email Test
 * Tests the API endpoint directly
 */

console.log('🧪 Testing Host Approval Email Functionality...\n');

// Test email parameters
const testEmail = process.argv[2] || 'test@example.com';
const testName = process.argv[3] || 'Test User';

console.log(`📤 Testing host approval email to: ${testEmail}`);
console.log(`👤 Test user name: ${testName}`);

async function testEmailAPI() {
  try {
    // Test host approval email
    console.log('\n📡 Testing host approval email API...');
    
    const response = await fetch('http://localhost:8084/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'general-email',
        type: 'hostApproval',
        to: testEmail,
        name: testName
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Host approval email sent successfully!');
      console.log('📧 Response:', result);
    } else {
      console.log('❌ Host approval email failed');
      console.log('📧 Status:', response.status);
      console.log('📧 Response:', await response.text());
    }
    
    // Test application confirmation email
    console.log('\n📡 Testing application confirmation email...');
    
    const appResponse = await fetch('http://localhost:8084/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'general-email',
        type: 'applicationConfirmation',
        to: testEmail,
        name: testName
      })
    });
    
    if (appResponse.ok) {
      const result = await appResponse.json();
      console.log('✅ Application confirmation email sent successfully!');
      console.log('📧 Response:', result);
    } else {
      console.log('❌ Application confirmation email failed');
      console.log('📧 Status:', appResponse.status);
      console.log('📧 Response:', await appResponse.text());
    }
    
    console.log('\n🎉 Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('📝 Make sure the API server is running on port 8084');
  }
}

// Run the test
testEmailAPI();
