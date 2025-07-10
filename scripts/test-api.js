// Direct notification API testing script
// Run with: node test-api.js

import fetch from 'node-fetch';

async function testAPI() {
  try {
    const response = await fetch('https://freefiretournaments.vercel.app/api/tournament-notifications');
    const result = await response.text();
    console.log('API Response:', result);
  } catch (error) {
    console.error('Error calling API:', error);
  }
}

testAPI();
