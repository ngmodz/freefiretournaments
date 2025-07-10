import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

/**
 * This script checks if any tournaments will be notified soon
 * It's useful for debugging if the notification system is working
 */
async function checkTournamentsForNotification() {
  console.log('🔔 CHECKING FOR TOURNAMENTS TO BE NOTIFIED 🔔');
  console.log('===========================================');
  
  try {
    // Endpoint URL
    const apiUrl = process.env.NOTIFICATION_API_URL || 'https://freefiretournaments.vercel.app/api/tournament-notifications';
    
    console.log(`Checking API endpoint: ${apiUrl}`);
    console.log('');
    
    // Call the API
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API returned status ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    
    console.log('✅ API Response:');
    console.log(JSON.stringify(result, null, 2));
    
    // Simulate what would happen in the next few minutes
    const now = new Date();
    
    console.log('\n⏰ NOTIFICATION PREDICTIONS:');
    console.log(`Current time: ${now.toLocaleString()}`);
    
    // Check for next 30 minutes in 2-minute intervals
    for (let i = 2; i <= 30; i += 2) {
      const futureTime = new Date(now.getTime() + (i * 60 * 1000));
      console.log(`\n🔮 ${i} minutes from now (${futureTime.toLocaleString()}):`);
      
      // For each active tournament, calculate if it will be in the window
      if (result.tournaments && result.tournaments.length > 0) {
        result.tournaments.forEach(tournament => {
          const startDate = new Date(tournament.start_date);
          const minutesToStart = (startDate.getTime() - futureTime.getTime()) / (1000 * 60);
          
          if (minutesToStart >= 19 && minutesToStart <= 21) {
            console.log(`✅ Tournament "${tournament.name}" (${tournament.id}) will be in notification window`);
            console.log(`   Start time: ${startDate.toLocaleString()}`);
            console.log(`   Minutes to start: ${minutesToStart.toFixed(1)}`);
            console.log(`   Notification will be sent automatically by cron-job.org`);
          } else if (minutesToStart > 0 && minutesToStart < 30) {
            console.log(`⏳ Tournament "${tournament.name}" will be ${minutesToStart.toFixed(1)} minutes from starting`);
            if (minutesToStart > 21) {
              console.log(`   Will enter notification window in ${(minutesToStart - 21).toFixed(1)} minutes`);
            } else if (minutesToStart < 19) {
              console.log(`   Already passed notification window by ${(19 - minutesToStart).toFixed(1)} minutes`);
            }
          }
        });
      } else {
        console.log('No active tournaments found to predict notifications for');
      }
    }
    
    console.log('\n📋 MONITORING OPTIONS:');
    console.log('1. Keep calling this script to check for updates');
    console.log('2. Use the real-time monitor: node scripts/monitor-notification-system.js');
    console.log('3. Verify cron-job.org is hitting the API every 2 minutes');
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    console.log('\n💡 Troubleshooting:');
    console.log('1. Verify the API endpoint is accessible');
    console.log('2. Check that your Vercel deployment is working');
    console.log('3. Run: node scripts/troubleshoot-notification-system.js');
  }
}

// Run the function
checkTournamentsForNotification();
