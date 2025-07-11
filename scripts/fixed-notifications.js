import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, updateDoc, doc, getDoc } from 'firebase/firestore';
import { firebaseConfig } from './firebase-config-es.js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Configure email transporter
const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'freefiretournaments03@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'eyym uhok glkx gony'
  },
  tls: {
    rejectUnauthorized: false // Ignore certificate issues - USE ONLY FOR TESTING
  }
});

/**
 * Fixed version of tournament notification sender that properly checks for tournaments
 * starting in 19-21 minutes from now
 */
async function sendFixedNotifications() {
  try {
    // Use IST timezone consistently
    const now = new Date();
    const istNow = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    
    console.log(`Current time: ${now.toLocaleString()} (Local)`);
    console.log(`Current time (IST): ${istNow.toLocaleString()}`);
    
    // Get all active tournaments 
    const tournamentsQuery = query(
      collection(db, 'tournaments'),
      where('status', '==', 'active')
    );
    
    console.log('Querying for all active tournaments...');
    const tournamentsSnapshot = await getDocs(tournamentsQuery);
    
    if (tournamentsSnapshot.empty) {
      console.log('No active tournaments found');
      return;
    }
    
    console.log(`Found ${tournamentsSnapshot.size} active tournaments, checking each...`);
    
    // Check each tournament to see if it falls in the 19-21 minute window
    let notificationCount = 0;
    
    for (const tournamentDoc of tournamentsSnapshot.docs) {
      const tournament = tournamentDoc.data();
      const tournamentId = tournamentDoc.id;
      
      console.log(`\nChecking tournament: ${tournament.name} (${tournamentId})`);
      
      // Skip if notification already sent
      if (tournament.notificationSent) {
        console.log(`Notification already sent, skipping`);
        continue;
      }
      
      // Get the start date
      const startDate = tournament.start_date instanceof Date ? tournament.start_date : 
                      (tournament.start_date.toDate ? tournament.start_date.toDate() : new Date(tournament.start_date));
      
      // Calculate minutes until start
      const minutesToStart = (startDate.getTime() - istNow.getTime()) / (1000 * 60);
      
      console.log(`Start time: ${startDate.toLocaleString()} (${minutesToStart.toFixed(1)} minutes from now)`);
      
      // Check if it's in the 19-21 minute window
      if (minutesToStart < 19 || minutesToStart > 21) {
        console.log(`Outside the 19-21 minute notification window, skipping`);
        continue;
      }
      
      console.log(`IN NOTIFICATION WINDOW - sending notification`);
      
      // Get host information
      const hostId = tournament.host_id;
      if (!hostId) {
        console.log(`No host_id specified, skipping`);
        continue;
      }
      
      const hostDocRef = doc(db, 'users', hostId);
      const hostDocSnapshot = await getDoc(hostDocRef);
      
      if (!hostDocSnapshot.exists()) {
        console.log(`Host user ${hostId} not found, skipping`);
        continue;
      }
      
      const hostData = hostDocSnapshot.data();
      const hostEmail = hostData.email;
      
      if (!hostEmail) {
        console.log(`Host has no email, skipping`);
        continue;
      }
      
      console.log(`Sending notification to host: ${hostEmail}`);
      
      // Format tournament start time
      const formattedTime = startDate.toLocaleString('en-US', {
        hour: 'numeric', 
        minute: 'numeric',
        hour12: true,
        timeZone: 'Asia/Kolkata'
      });
      const formattedDate = startDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        timeZone: 'Asia/Kolkata'
      });
      
      // Prepare email content
      const mailOptions = {
        from: `"Tournament Host" <${process.env.EMAIL_USER || 'freefiretournaments03@gmail.com'}>`,
        to: hostEmail,
        subject: `🏆 Reminder: Your Tournament "${tournament.name}" Starts Soon!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="color: #6200EA;">Tournament Starting Soon!</h1>
            </div>
            
            <p>Hello Tournament Host,</p>
            
            <p>Your hosted tournament <strong>${tournament.name}</strong> is scheduled to start in about <strong>20 minutes</strong>!</p>
            
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h2 style="color: #6200EA; margin-top: 0;">${tournament.name}</h2>
              <p><strong>Start Time:</strong> ${formattedTime} on ${formattedDate} IST</p>
              <p><strong>Mode:</strong> ${tournament.mode}</p>
              <p><strong>Map:</strong> ${tournament.map}</p>
              <p><strong>Room Type:</strong> ${tournament.room_type}</p>
              <p><strong>Participants:</strong> ${tournament.filled_spots || 0}/${tournament.max_players}</p>
            </div>
            
            <p><strong>Don't forget to:</strong></p>
            <ul>
              <li>Create the room a few minutes before the start time</li>
              <li>Share the room ID and password with participants</li>
              <li>Ensure all settings match the tournament requirements</li>
              <li>Keep track of results for prize distribution</li>
            </ul>
            
            <p>Good luck and have fun!</p>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
              <p style="font-size: 12px; color: #666;">This is an automated reminder. Please do not reply to this email.</p>
            </div>
          </div>
        `
      };
      
      // Send the email and update the notification status
      try {
        console.log(`Sending email...`);
        const info = await emailTransporter.sendMail(mailOptions);
        console.log(`Email sent successfully! Message ID: ${info.messageId}`);
        
        // Mark as notified
        console.log(`Marking tournament as notified...`);
        await updateDoc(doc(db, 'tournaments', tournamentId), {
          notificationSent: true
        });
        
        console.log(`Tournament ${tournamentId} marked as notified`);
        notificationCount++;
      } catch (error) {
        console.error(`Error sending email:`, error);
      }
    }
    
    console.log(`\n=== SUMMARY ===`);
    console.log(`Total tournaments checked: ${tournamentsSnapshot.size}`);
    console.log(`Notifications sent: ${notificationCount}`);
  } catch (error) {
    console.error('Error sending notifications:', error);
  }
}

// Run the function
sendFixedNotifications()
  .then(() => {
    console.log('\nNotification process completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error in notification process:', error);
    process.exit(1);
  });
