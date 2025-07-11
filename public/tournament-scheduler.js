// Simple frontend scheduler that runs in the browser
// This bypasses Vercel authentication because it's a same-origin request

let notificationInterval;

function startTournamentNotificationScheduler() {
  console.log('🎯 Starting tournament notification scheduler...');
  
  async function checkTournaments() {
    try {
      console.log('⏰ Checking tournaments at:', new Date().toISOString());
      
      // This call works because it's from the same domain (no authentication needed)
      const response = await fetch('/api/check-tournament?all=true', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Tournament check result:', result);
        
        if (result.notifications > 0) {
          console.log(`📧 Sent ${result.notifications} notifications!`);
        }
      } else {
        console.log('❌ Tournament check failed:', response.status);
      }
    } catch (error) {
      console.error('❌ Error checking tournaments:', error);
    }
  }
  
  // Check immediately
  checkTournaments();
  
  // Check every 2 minutes
  notificationInterval = setInterval(checkTournaments, 2 * 60 * 1000);
  
  console.log('🚀 Tournament notification scheduler started! Checking every 2 minutes.');
}

function stopTournamentNotificationScheduler() {
  if (notificationInterval) {
    clearInterval(notificationInterval);
    notificationInterval = null;
    console.log('🛑 Tournament notification scheduler stopped.');
  }
}

// Auto-start when page loads
if (typeof window !== 'undefined') {
  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startTournamentNotificationScheduler);
  } else {
    startTournamentNotificationScheduler();
  }
  
  // Clean up when page unloads
  window.addEventListener('beforeunload', stopTournamentNotificationScheduler);
}

// Export for manual control
window.tournamentScheduler = {
  start: startTournamentNotificationScheduler,
  stop: stopTournamentNotificationScheduler
};
