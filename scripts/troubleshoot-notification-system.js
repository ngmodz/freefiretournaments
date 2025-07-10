import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, updateDoc, doc, getDoc } from 'firebase/firestore';
import { firebaseConfig } from './firebase-config-es.js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * This script is a comprehensive troubleshooter for the tournament notification system
 * It checks all aspects of the system and provides detailed diagnostics
 */
async function troubleshootNotificationSystem() {
  console.log('🔧 TOURNAMENT NOTIFICATION SYSTEM TROUBLESHOOTER 🔧');
  console.log('=================================================');
  console.log('');
  
  // STEP 1: Check environment variables
  console.log('📋 STEP 1: Checking environment variables...');
  
  // Check Firebase config
  console.log('\n🔥 Firebase Configuration:');
  const fbConfigValid = firebaseConfig.apiKey && firebaseConfig.projectId;
  console.log(`API Key: ${firebaseConfig.apiKey ? '✅ Present' : '❌ Missing'}`);
  console.log(`Project ID: ${firebaseConfig.projectId ? '✅ Present' : '❌ Missing'}`);
  console.log(`Auth Domain: ${firebaseConfig.authDomain ? '✅ Present' : '❌ Missing'}`);
  console.log(`Storage Bucket: ${firebaseConfig.storageBucket ? '✅ Present' : '❌ Missing'}`);
  console.log(`Overall Firebase Config: ${fbConfigValid ? '✅ Valid' : '❌ Invalid'}`);
  
  // Check Email config
  console.log('\n📧 Email Configuration:');
  const emailUser = process.env.EMAIL_USER || 'freefiretournaments03@gmail.com';
  const emailPass = process.env.EMAIL_PASSWORD || 'eyym uhok glkx gony';
  console.log(`Email User: ${emailUser ? '✅ Present' : '❌ Missing'} (${emailUser})`);
  console.log(`Email Password: ${emailPass ? '✅ Present' : '❌ Missing'}`);
  
  // STEP 2: Check database connection
  console.log('\n📋 STEP 2: Testing database connection...');
  try {
    const testQuery = query(collection(db, 'tournaments'), where('status', '==', 'active'), limit(1));
    const testSnapshot = await getDocs(testQuery);
    console.log(`Database Connection: ✅ Working (found ${testSnapshot.size} active tournaments)`);
  } catch (error) {
    console.error(`Database Connection: ❌ Error: ${error.message}`);
  }
  
  // STEP 3: Check for tournaments in notification window
  console.log('\n📋 STEP 3: Checking for tournaments in notification window...');
  
  // Use IST timezone consistently
  const now = new Date();
  const istNow = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
  
  // Calculate the notification window: tournaments that start in 19-21 minutes from now in IST
  const nineteenMinutesFromNow = new Date(istNow.getTime() + 19 * 60 * 1000);
  const twentyOneMinutesFromNow = new Date(istNow.getTime() + 21 * 60 * 1000);
  
  console.log(`Current IST time: ${istNow.toLocaleString()}`);
  console.log(`Notification window: ${nineteenMinutesFromNow.toLocaleString()} to ${twentyOneMinutesFromNow.toLocaleString()} IST`);
  
  try {
    // Query for tournaments that are starting in the notification window (19-21 minutes)
    const tournamentsQuery = query(
      collection(db, 'tournaments'),
      where('status', '==', 'active')
    );
    
    const upcomingTournamentsSnapshot = await getDocs(tournamentsQuery);
    
    if (upcomingTournamentsSnapshot.empty) {
      console.log('No active tournaments found in database');
    } else {
      console.log(`Found ${upcomingTournamentsSnapshot.size} active tournaments, checking each for notification window...`);
      
      let inWindowCount = 0;
      let notifiedCount = 0;
      let upcomingCount = 0;
      let pastWindowCount = 0;
      
      // Process each tournament
      upcomingTournamentsSnapshot.forEach((tournamentDoc) => {
        const tournament = tournamentDoc.data();
        const tournamentId = tournamentDoc.id;
        
        // Calculate time to start
        const startDate = tournament.start_date instanceof Date ? tournament.start_date : 
                        (tournament.start_date.toDate ? tournament.start_date.toDate() : new Date(tournament.start_date));
        
        const minutesToStart = (startDate.getTime() - istNow.getTime()) / (1000 * 60);
        
        console.log(`Tournament ${tournamentId} - "${tournament.name}"`);
        console.log(`  Start time: ${startDate.toLocaleString()}`);
        console.log(`  Minutes to start: ${minutesToStart.toFixed(1)}`);
        console.log(`  Notification sent: ${tournament.notificationSent ? 'Yes' : 'No'}`);
        
        if (tournament.notificationSent) {
          console.log(`  Status: ✅ Already notified`);
          notifiedCount++;
        } else if (minutesToStart >= 19 && minutesToStart <= 21) {
          console.log(`  Status: 🔔 IN NOTIFICATION WINDOW NOW - should be notified on next API call`);
          inWindowCount++;
        } else if (minutesToStart > 21) {
          console.log(`  Status: ⏳ Not yet in notification window (${(minutesToStart - 21).toFixed(1)} minutes until window)`);
          upcomingCount++;
        } else if (minutesToStart < 19 && minutesToStart > 0) {
          console.log(`  Status: ⏰ Past notification window but still upcoming`);
          pastWindowCount++;
        } else {
          console.log(`  Status: ⌛ Tournament already started or invalid time`);
        }
        
        console.log('');
      });
      
      console.log(`Summary: ${notifiedCount} already notified, ${inWindowCount} in window now, ${upcomingCount} upcoming, ${pastWindowCount} past window`);
    }
  } catch (error) {
    console.error(`Error checking tournaments: ${error.message}`);
    
    if (error.code === 'failed-precondition' && error.toString().includes('requires an index')) {
      console.error('⚠️ Missing Firestore index detected');
      console.error('Please create a composite index for collection: tournaments, Fields: status (Ascending), start_date (Ascending)');
      
      // Get the index creation URL from the error message if available
      const urlMatch = error.toString().match(/(https:\/\/console\.firebase\.google\.com\/[^\s]+)/);
      if (urlMatch && urlMatch[1]) {
        console.error(`Index creation URL: ${urlMatch[1]}`);
      }
    }
  }
  
  // STEP 4: Test email functionality
  console.log('\n📋 STEP 4: Testing email functionality...');
  
  // Configure email transporter
  const emailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPass
    },
    tls: {
      rejectUnauthorized: false // Ignore certificate issues - USE ONLY FOR TESTING
    }
  });
  
  try {
    console.log(`Attempting to verify email connection...`);
    await emailTransporter.verify();
    console.log(`Email Configuration: ✅ Valid and working`);
  } catch (error) {
    console.error(`Email Configuration: ❌ Error: ${error.message}`);
  }
  
  // STEP 5: Test API endpoint
  console.log('\n📋 STEP 5: Testing API endpoint...');
  
  const API_URL = 'https://freefiretournaments.vercel.app/api/tournament-notifications';
  console.log(`API URL: ${API_URL}`);
  
  try {
    console.log('Sending test request to API endpoint...');
    const response = await fetch(API_URL);
    
    if (!response.ok) {
      console.error(`API Endpoint: ❌ Error: Status ${response.status}`);
      const errorText = await response.text();
      console.error(`Error details: ${errorText}`);
    } else {
      console.log(`API Endpoint: ✅ Accessible and responding`);
      const result = await response.json();
      console.log(`Response: ${JSON.stringify(result, null, 2)}`);
    }
  } catch (error) {
    console.error(`API Endpoint: ❌ Error: ${error.message}`);
  }
  
  // STEP 6: Check cron-job.org configuration
  console.log('\n📋 STEP 6: Verifying cron-job.org setup...');
  console.log('⚠️ Manual verification required');
  console.log('Please ensure your cron-job.org is configured with:');
  console.log('1. URL: https://freefiretournaments.vercel.app/api/tournament-notifications');
  console.log('2. Schedule: Every 2 minutes');
  console.log('3. Request type: GET');
  
  // STEP 7: Check Vercel configuration
  console.log('\n📋 STEP 7: Verifying Vercel configuration...');
  console.log('⚠️ Manual verification required');
  console.log('Please ensure your Vercel environment has these variables set:');
  console.log('- FIREBASE_API_KEY');
  console.log('- FIREBASE_AUTH_DOMAIN');
  console.log('- FIREBASE_PROJECT_ID');
  console.log('- FIREBASE_STORAGE_BUCKET');
  console.log('- FIREBASE_MESSAGING_SENDER_ID');
  console.log('- FIREBASE_APP_ID');
  console.log('- EMAIL_USER');
  console.log('- EMAIL_PASSWORD');
  
  // Summary and recommendations
  console.log('\n📋 TROUBLESHOOTING SUMMARY');
  console.log('=========================');
  console.log('1. Check if any tournaments are currently in the notification window');
  console.log('2. Verify cron-job.org is hitting your API endpoint every 2 minutes');
  console.log('3. Ensure Vercel environment variables are set correctly');
  console.log('4. Create a test tournament that will enter the window soon:');
  console.log('   node scripts/create-automation-test-tournament.js');
  console.log('5. Monitor your email for notifications');
  console.log('');
  console.log('If you need to force-send notifications for testing:');
  console.log('node scripts/force-send-notification.js TOURNAMENT_ID');
}

// Execute the troubleshooter
troubleshootNotificationSystem()
  .then(() => {
    console.log('\nTroubleshooting completed.');
  })
  .catch((error) => {
    console.error(`\nError during troubleshooting: ${error.message}`);
  });
