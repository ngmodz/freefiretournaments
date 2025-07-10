import fetch from 'node-fetch';

/**
 * This script tests if the notification endpoint is accessible and working
 */
async function testNotificationEndpoint() {
  // URLs to test - both local and production
  const urls = [
    // Production URL
    'https://freefiretournaments.vercel.app/api/tournament-notifications',
    // Local URL (if running local dev server)
    'http://localhost:3000/api/tournament-notifications'
  ];

  console.log('Testing tournament notification endpoints...');
  console.log('This simulates what cron-job.org would do');
  console.log('Current time:', new Date().toLocaleString());

  for (const url of urls) {
    try {
      console.log(`\n📡 Testing endpoint: ${url}`);
      console.log('Sending request...');
      
      const startTime = Date.now();
      const response = await fetch(url);
      const endTime = Date.now();
      
      console.log(`Response status: ${response.status} (${response.statusText})`);
      console.log(`Response time: ${endTime - startTime}ms`);
      
      // Get the response body
      const data = await response.json();
      console.log('Response data:', JSON.stringify(data, null, 2));
      
      if (response.ok) {
        console.log('✅ Endpoint is working!');
      } else {
        console.log('❌ Endpoint returned an error');
      }
    } catch (error) {
      console.error(`❌ Error calling ${url}:`, error.message);
    }
  }
}

// Run the test
testNotificationEndpoint()
  .then(() => console.log('\n✅ Test completed'))
  .catch(err => console.error('❌ Test failed:', err));
