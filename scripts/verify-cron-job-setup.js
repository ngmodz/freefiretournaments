import fetch from 'node-fetch';

/**
 * This script verifies that:
 * 1. Your API endpoint is accessible
 * 2. It responds correctly
 * 3. The environment variables are set correctly
 */

const API_URL = 'https://freefiretournaments.vercel.app/api/tournament-notifications';

async function testEndpoint() {
  console.log(`🔍 Testing tournament notification endpoint: ${API_URL}`);
  console.log('This simulates what cron-job.org would do every 2 minutes');
  console.log('');
  
  try {
    console.log('📡 Sending request...');
    const response = await fetch(API_URL);
    
    if (!response.ok) {
      console.error(`❌ Error: API returned status ${response.status}`);
      const errorText = await response.text();
      console.error(`Error details: ${errorText}`);
      return;
    }
    
    const result = await response.json();
    console.log('✅ API responded successfully!');
    console.log('Response details:');
    console.log(JSON.stringify(result, null, 2));
    
    // Check if response has the correct structure
    if (result.success === true) {
      console.log('✅ API is working correctly');
      
      if (result.checked === 0) {
        console.log('ℹ️ No tournaments were found to check (this is normal if there are no active tournaments)');
      } else if (result.notifications > 0) {
        console.log(`✅ ${result.notifications} notification(s) sent!`);
      } else {
        console.log('ℹ️ No tournaments needed notifications at this time (this is normal)');
      }
      
      console.log('\n🔍 Environment Checks:');
      if (result.environmentDetails) {
        const env = result.environmentDetails;
        console.log(`Firebase config: ${env.firebase?.configValid ? '✅ Valid' : '❌ Invalid'}`);
        console.log(`Email config: ${env.email?.user ? '✅ Available' : '❌ Missing'}`);
      } else {
        console.log('⚠️ No environment details returned - check Vercel environment variables');
      }
    } else {
      console.error('❌ API returned an error:', result.error || 'Unknown error');
    }
    
    console.log('\n📋 NEXT STEPS:');
    console.log('1. Make sure cron-job.org is set up to hit this URL every 2 minutes');
    console.log('2. Verify your Vercel environment variables (see deployment-checklist.js)');
    console.log('3. Create a tournament that starts in 23 minutes to test the full flow');
    console.log('4. The notification should be sent automatically when the tournament is 19-21 minutes away');
    
  } catch (error) {
    console.error('❌ Error accessing the API endpoint:', error.message);
    console.log('\n⚠️ The API endpoint might be down or inaccessible');
    console.log('Check your Vercel deployment status and logs');
  }
}

testEndpoint();
