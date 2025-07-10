import admin from 'firebase-admin';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Initialize Firebase Admin SDK
let serviceAccount;
try {
  // Try to read from environment variable first
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } 
  // Fallback to service account file if environment variable fails
  else if (process.env.SERVICE_ACCOUNT_KEY_PATH && fs.existsSync(process.env.SERVICE_ACCOUNT_KEY_PATH)) {
    const serviceAccountFile = fs.readFileSync(process.env.SERVICE_ACCOUNT_KEY_PATH, 'utf8');
    serviceAccount = JSON.parse(serviceAccountFile);
  }
  // Manual fallback for this project - load from service account file or exit
  else {
    console.error('No Firebase service account found. Please set SERVICE_ACCOUNT_KEY_PATH in your .env file');
    process.exit(1);
  }

  if (!serviceAccount.project_id) {
    throw new Error('Invalid service account configuration');
  }
} catch (error) {
  console.error('❌ Error parsing Firebase service account:', error);
  console.log('💡 Make sure Firebase credentials are properly configured');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function createFullyAutomaticTournament() {
  try {
    console.log('🤖 Creating tournament for FULLY AUTOMATIC notification system...');
    console.log('📡 This will be triggered AUTOMATICALLY by cron-job.org');
    console.log('🚫 NO manual scripts will be run - 100% automatic!');
    console.log('');
    
    // Create tournament that starts exactly 23 minutes from now in IST
    const now = new Date();
    const istNow = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    const startTime = new Date(istNow.getTime() + 23 * 60 * 1000); // 23 minutes from now
    
    console.log(`⏰ Current IST time: ${istNow.toLocaleString()}`);
    console.log(`🎯 Tournament starts (IST): ${startTime.toLocaleString()}`);
    
    // Calculate when the automatic notification should be sent
    const notificationWindow = {
      start: new Date(istNow.getTime() + 2 * 60 * 1000), // 2 minutes from now
      end: new Date(istNow.getTime() + 4 * 60 * 1000)    // 4 minutes from now
    };
    
    console.log('');
    console.log('📬 AUTOMATIC notification will be sent between:');
    console.log(`   ⏰ ${notificationWindow.start.toLocaleString()} IST`);
    console.log(`   ⏰ ${notificationWindow.end.toLocaleString()} IST`);
    console.log(`   📡 When your cron-job.org calls the API every 2 minutes`);
    console.log('');
    
    // Use the same test host user
    const testHostId = 'notification-test-host';
    console.log('📧 Host email: microft1007@gmail.com');
    
    // Create tournament with unique details
    const tournamentData = {
      name: 'AUTOMATIC SYSTEM TEST: Pro League Championship',
      status: 'active',
      mode: 'Solo',
      map: 'Nextera',
      room_type: 'Custom',
      max_players: 32,
      filled_spots: 28,
      entry_fee: 100,
      prize_pool: 3200,
      start_date: admin.firestore.Timestamp.fromDate(startTime),
      host_id: testHostId,
      notificationSent: false,
      created_at: admin.firestore.Timestamp.now(),
      description: 'Elite tournament for professional players',
      custom_settings: {
        auto_aim: false,
        character_skill: true,
        pet_enabled: false,
        advance_settings: true,
        loadout_locked: true,
        zone_speed: 'fast'
      }
    };
    
    const docRef = await db.collection('tournaments').add(tournamentData);
    console.log('✅ FULLY AUTOMATIC Tournament created!');
    console.log('');
    console.log('🏆 Tournament Details:');
    console.log(`   📋 ID: ${docRef.id}`);
    console.log(`   🎮 Name: "${tournamentData.name}"`);
    console.log(`   🎯 Mode: ${tournamentData.mode} | Map: ${tournamentData.map}`);
    console.log(`   💰 Entry: ₹${tournamentData.entry_fee} | Prize: ₹${tournamentData.prize_pool}`);
    console.log(`   👥 Players: ${tournamentData.filled_spots}/${tournamentData.max_players}`);
    console.log('');
    console.log('🤖 AUTOMATIC SYSTEM STATUS:');
    console.log('   ✅ Tournament created in database');
    console.log('   ✅ Cron-job.org is calling your API every 2 minutes');
    console.log('   ✅ API URL: https://freefiretournaments.vercel.app/api/tournament-notifications');
    console.log('   ✅ Email will be sent AUTOMATICALLY when tournament is 19-21 minutes away');
    console.log('');
    console.log('⏳ TIMELINE:');
    console.log('   🔄 In 2-4 minutes: Cron job will detect tournament');
    console.log('   📧 Email will be sent automatically to microft1007@gmail.com');
    console.log('   🚫 NO manual intervention required!');
    console.log('');
    console.log('✨ Just wait and check your email in 2-4 minutes!');
    
  } catch (error) {
    console.error('❌ Error creating tournament:', error);
  } finally {
    process.exit(0);
  }
}

createFullyAutomaticTournament();
