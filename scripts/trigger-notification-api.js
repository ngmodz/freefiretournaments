import fetch from 'node-fetch';

// URLs to test
const urls = [
  'https://freefiretournaments.vercel.app/api/tournament-notifications',
  'https://freefiretournaments.vercel.app/api/tournament-notifications?debug=true'
];

async function testNotificationAPI() {
  console.log('Testing tournament notification API endpoints...');
  console.log('Current time:', new Date().toLocaleString());

  for (const url of urls) {
    try {
      console.log(`\nTesting URL: ${url}`);
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('Status:', response.status);
      console.log('Response:', JSON.stringify(data, null, 2));
    } catch (error) {
      console.error(`Error calling ${url}:`, error.message);
    }
  }
}

testNotificationAPI()
  .then(() => console.log('\nAPI test completed'))
  .catch(err => console.error('Test failed:', err));
