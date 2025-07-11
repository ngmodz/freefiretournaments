// Test script for the tournament notification endpoint
const fetch = require('node-fetch');

// Replace with your actual Vercel deployment URL
const VERCEL_URL = 'https://your-vercel-app.vercel.app';

async function testNotificationEndpoint() {
  try {
    console.log('Testing tournament notification endpoint...');
    
    // Make a request to the endpoint
    const response = await fetch(`${VERCEL_URL}/api/check-tournament?all=true`);
    const data = await response.json();
    
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log(`✅ Success! Checked ${data.checked} tournaments, sent ${data.notifications} notifications.`);
    } else {
      console.log(`❌ Error: ${data.error || 'Unknown error'}`);
    }
    
    if (data.errors && data.errors.length > 0) {
      console.log('Errors encountered:');
      data.errors.forEach(error => console.log(`- ${error}`));
    }
    
  } catch (error) {
    console.error('Failed to test endpoint:', error);
  }
}

// Run the test
testNotificationEndpoint(); 