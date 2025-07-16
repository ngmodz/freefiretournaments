import fetch from 'node-fetch';

/**
 * Automated script to check tournaments for minimum participants
 * This script should be called regularly (every 5-10 minutes) via cron job or scheduled task
 */
async function automatedMinimumParticipantsCheck() {
  try {
    console.log(`🤖 [${new Date().toISOString()}] Running automated minimum participants check...`);
    
    const apiUrl = process.env.VERCEL_API_URL || 'https://freefiretournaments.vercel.app';
    const endpoint = `${apiUrl}/api/tournament-management`;
    
    console.log(`📡 Calling API: ${endpoint}`);
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'check-minimum-participants'
      }),
    });
    
    if (!response.ok) {
      console.error(`❌ API call failed: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return;
    }
    
    const result = await response.json();
    
    if (result.success) {
      console.log(`✅ Check completed successfully`);
      console.log(`📊 Tournaments checked: ${result.checkedCount || 0}`);
      console.log(`🚫 Tournaments cancelled: ${result.cancelledCount || 0}`);
      
      if (result.cancelledCount > 0) {
        console.log(`💰 Refunds processed for ${result.cancelledCount} tournament(s)`);
        console.log(`📧 Cancellation emails sent to hosts and participants`);
      }
    } else {
      console.error(`❌ API returned error: ${result.error || result.message}`);
    }
    
  } catch (error) {
    console.error('❌ Error running automated check:', error.message);
  }
}

// Run the check
automatedMinimumParticipantsCheck();

export default automatedMinimumParticipantsCheck;
