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
 * Send notifications for tournaments starting soon (20 minutes from now)
 */
async function sendTournamentNotifications() {
  try {
    console.log('Checking for upcoming tournaments to send notifications...');
    
    // Use IST timezone consistently
    const now = new Date();
    const istNow = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    
    // Calculate the notification window: tournaments that start in 19-21 minutes from now in IST
    const nineteenMinutesFromNow = new Date(istNow.getTime() + 19 * 60 * 1000);
    const twentyOneMinutesFromNow = new Date(istNow.getTime() + 21 * 60 * 1000);
    
    console.log(`Current IST time: ${istNow.toLocaleString()}`);
    console.log(`Looking for tournaments that will start in 19-21 minutes from now (window: ${nineteenMinutesFromNow.toLocaleString()} to ${twentyOneMinutesFromNow.toLocaleString()} IST)`);
    
    try {
      // Query for tournaments that are starting in the notification window (19-21 minutes)
      const tournamentsQuery = query(
        collection(db, 'tournaments'),
        where('status', '==', 'active'),
        where('start_date', '>=', nineteenMinutesFromNow),
        where('start_date', '<=', twentyOneMinutesFromNow)
      );
      
      const upcomingTournamentsSnapshot = await getDocs(tournamentsQuery);
      
      if (upcomingTournamentsSnapshot.empty) {
        console.log('No upcoming tournaments found for notification');
        return;
      }
      
      console.log(`Found ${upcomingTournamentsSnapshot.size} upcoming tournaments for notification`);
      
      // Process each upcoming tournament
      const promises = [];
      
      upcomingTournamentsSnapshot.forEach(async (tournamentDoc) => {
        const tournament = tournamentDoc.data();
        const tournamentId = tournamentDoc.id;
        const hostId = tournament.host_id;
        
        // Skip if no host ID
        if (!hostId) {
          console.warn(`Tournament ${tournamentId} has no host_id, skipping notification`);
          return;
        }
        
        // Skip if notification already sent
        if (tournament.notificationSent) {
          console.log(`Notification already sent for tournament ${tournamentId}, skipping`);
          return;
        }
        
        // Get host user document to get email
        const hostDocRef = doc(db, 'users', hostId);
        const hostDocSnapshot = await getDoc(hostDocRef);
        
        if (!hostDocSnapshot.exists()) {
          console.warn(`Host user ${hostId} for tournament ${tournamentId} not found, skipping notification`);
          return;
        }
        
        const hostData = hostDocSnapshot.data();
        const hostEmail = hostData.email;
        
        if (!hostEmail) {
          console.warn(`Host user ${hostId} has no email, skipping notification`);
          return;
        }
        
        console.log(`Sending notification for tournament ${tournamentId} to host ${hostEmail}`);
        
        // Format tournament start time (FIX: Always use IST)
        const startDate = tournament.start_date instanceof Date ? tournament.start_date : 
                        (tournament.start_date.toDate ? tournament.start_date.toDate() : new Date(tournament.start_date));
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
          from: `"Freefire Tournaments" <${process.env.EMAIL_USER || 'freefiretournaments03@gmail.com'}>`,
          to: hostEmail,
          subject: `🏆 Reminder: Your Tournament "${tournament.name}" Starts Soon!`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
              <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #6200EA;">Tournament Starting Soon!</h1>
              </div>
              
              <p>Hello Tournament Host,</p>
              
              <p>Your hosted tournament <strong>${tournament.name}</strong> is scheduled to start in about <strong>20 minutes</strong>!</p>
              
              <div style="background-color: #f1f1f1; padding: 12px; border-radius: 5px; margin: 20px 0;">
                <h2 style="color: #6200EA; margin-top: 0;">${tournament.name}</h2>
                <p style="margin-bottom: 10px;"><strong>Description:</strong> ${tournament.description || 'No description provided.'}</p>
                <p><strong>Start Time:</strong> ${formattedTime} on ${formattedDate}</p>
                <h3 style="margin: 12px 0 6px 0; color: #333;">Tournament Details</h3>
                <ul style="padding-left: 18px; margin: 0;">
                  <li><strong>Mode:</strong> ${tournament.mode}</li>
                  <li><strong>Map:</strong> ${tournament.map}</li>
                  <li><strong>Room Type:</strong> ${tournament.room_type}</li>
                  <li><strong>Max Players:</strong> ${tournament.max_players}</li>
                  <li><strong>Participants:</strong> ${tournament.filled_spots || 0}/${tournament.max_players}</li>
                </ul>
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
          await emailTransporter.sendMail(mailOptions);
          console.log(`Successfully sent email notification to ${hostEmail} for tournament ${tournamentId}`);
          
          // Update the tournament document to mark notification as sent
          await updateDoc(doc(db, 'tournaments', tournamentId), {
            notificationSent: true
          });
          
          console.log(`Marked tournament ${tournamentId} as notified`);
        } catch (error) {
          console.error(`Error sending email to ${hostEmail}:`, error);
        }
      });
      
      console.log('Email notification process completed');
    } catch (error) {
      if (error.code === 'failed-precondition' && error.toString().includes('requires an index')) {
        console.error('Error: Missing Firestore index. You need to create a composite index for this query.');
        console.error('Please create an index for:');
        console.error('Collection: tournaments');
        console.error('Fields: status (Ascending), start_date (Ascending)');
        console.error('');
        console.error('To create this index:');
        console.error('1. Go to Firebase Console: https://console.firebase.google.com/project/freefire-tournaments-ba2a6/firestore/indexes');
        console.error('2. Click "Add Index"');
        console.error('3. Set Collection ID to "tournaments"');
        console.error('4. Add field paths: "status" (Ascending) and "start_date" (Ascending)');
        console.error('5. Click "Create"');
        
        // Get the index creation URL from the error message if available
        const urlMatch = error.toString().match(/(https:\/\/console\.firebase\.google\.com\/[^\s]+)/);
        if (urlMatch && urlMatch[1]) {
          console.error('');
          console.error('Or use this direct link to create the index:');
          console.error(urlMatch[1]);
        }
        
        // For demonstration, let's send a test notification instead
        console.log('\nSending a test notification email instead...');
        await sendTestNotification('freefiretournaments03@gmail.com');
      } else {
        throw error;
      }
    }
    
  } catch (error) {
    console.error('Error sending tournament notifications:', error);
    throw error;
  }
}

// Function to send a test notification (used when index is missing)
async function sendTestNotification(email) {
  try {
    // Sample tournament data for testing using IST
    const now = new Date();
    const istNow = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    const sampleTournament = {
      name: "Test Tournament",
      mode: "Solo",
      map: "Bermuda",
      room_type: "Classic",
      max_players: 12,
      filled_spots: 8,
      start_date: new Date(istNow.getTime() + 20 * 60 * 1000)
    };
    
    // Format tournament start time in IST
    const startDate = sampleTournament.start_date;
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
      to: email,
      subject: `🏆 Test: Tournament "${sampleTournament.name}" Starts Soon!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #6200EA;">Tournament Starting Soon!</h1>
          </div>
          
          <p>Hello Tournament Host,</p>
          
          <p><strong>IMPORTANT:</strong> This is a TEST notification. The notification system is working, but the Firestore index required for real tournaments is missing.</p>
          
          <p>Your hosted tournament <strong>${sampleTournament.name}</strong> is scheduled to start in about <strong>20 minutes</strong>!</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h2 style="color: #6200EA; margin-top: 0;">${sampleTournament.name}</h2>
            <p><strong>Start Time:</strong> ${formattedTime} on ${formattedDate}</p>
            <p><strong>Mode:</strong> ${sampleTournament.mode}</p>
            <p><strong>Map:</strong> ${sampleTournament.map}</p>
            <p><strong>Room Type:</strong> ${sampleTournament.room_type}</p>
            <p><strong>Participants:</strong> ${sampleTournament.filled_spots}/${sampleTournament.max_players}</p>
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
            <p style="font-size: 12px; color: #666;">This is a test email. No action is required.</p>
          </div>
        </div>
      `
    };
    
    // Send the email
    const info = await emailTransporter.sendMail(mailOptions);
    console.log('Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    
  } catch (error) {
    console.error('Error sending test notification:', error);
  }
}

// Run the function
sendTournamentNotifications()
  .then(() => {
    console.log('Notification check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error in notification process:', error);
    process.exit(1);
  }); 