import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';
import readline from 'readline';

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to create a tournament through the Vercel API
async function createTournamentViaAPI() {
  try {
    console.log('🔧 CREATE TEST TOURNAMENT VIA VERCEL API 🔧');
    console.log('=============================================');
    console.log('This script will create a test tournament using the Vercel API endpoint');
    console.log('This avoids permission issues with the client-side Firebase SDK');
    console.log('');

    // Get tournament details from user
    const tournamentName = await promptUser('Enter tournament name (e.g., "API Test Tournament"): ');
    const hostEmail = await promptUser('Enter host email (e.g., "microft1007@gmail.com"): ');
    const minutesUntilStart = parseInt(await promptUser('Minutes until tournament starts (recommend 23): '), 10);
    
    if (isNaN(minutesUntilStart)) {
      throw new Error('Invalid number of minutes. Please enter a number.');
    }

    // Construct the API URL and payload
    const apiUrl = process.env.VERCEL_API_URL || 'https://freefiretournaments.vercel.app/api/create-test-tournament';
    
    // Calculate start time
    const now = new Date();
    const startTime = new Date(now.getTime() + (minutesUntilStart * 60 * 1000));
    
    // Tournament data
    const tournamentData = {
      name: tournamentName,
      status: 'active',
      mode: 'Solo',
      map: 'Bermuda',
      room_type: 'Classic',
      max_players: 12,
      filled_spots: 8,
      entry_fee: 10,
      prize_pool: 100,
      start_date: startTime.toISOString(),
      host_email: hostEmail,
      notificationSent: false
    };

    console.log('\n📋 Tournament Details:');
    console.log(`Name: ${tournamentData.name}`);
    console.log(`Host Email: ${tournamentData.host_email}`);
    console.log(`Start Time: ${new Date(tournamentData.start_date).toLocaleString()} (${minutesUntilStart} minutes from now)`);
    console.log(`Notification Window: Will enter at ${new Date(startTime.getTime() - (21 * 60 * 1000)).toLocaleString()}`);
    console.log('');
    
    const proceed = await promptUser('Proceed with creating this tournament? (y/n): ');
    if (proceed.toLowerCase() !== 'y' && proceed.toLowerCase() !== 'yes') {
      console.log('Tournament creation cancelled.');
      rl.close();
      return;
    }

    console.log('\n📡 Sending request to Vercel API...');
    
    // Send the request to the API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tournamentData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }

    const result = await response.json();

    console.log('\n✅ Tournament created successfully!');
    console.log(`Tournament ID: ${result.tournamentId}`);
    
    console.log('\n⏱️ Notification Timeline:');
    console.log(`1. Tournament created at: ${new Date().toLocaleString()}`);
    console.log(`2. Tournament starts at: ${new Date(tournamentData.start_date).toLocaleString()}`);
    console.log(`3. Notification window starts at: ${new Date(startTime.getTime() - (21 * 60 * 1000)).toLocaleString()}`);
    console.log(`4. Notification window ends at: ${new Date(startTime.getTime() - (19 * 60 * 1000)).toLocaleString()}`);
    
    console.log('\n📋 Next Steps:');
    console.log('1. Wait for the tournament to enter the 19-21 minute window');
    console.log('2. The cron-job.org service will automatically call the notification API every 2 minutes');
    console.log('3. When the tournament enters the window, a notification email will be sent automatically');
    console.log('4. Check your email for the notification');
    console.log('\n💡 To verify the cron-job setup: node scripts/verify-cron-job-setup.js');

  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    console.log('\n💡 Since the API endpoint might not exist yet, let\'s create it:');
    console.log('1. Create a file at: /api/create-test-tournament.js');
    console.log('2. Run: node scripts/create-tournament-api-endpoint.js');
  } finally {
    rl.close();
  }
}

// Helper function to prompt for user input
function promptUser(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Run the function
createTournamentViaAPI();
