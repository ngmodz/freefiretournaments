import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, getDoc, updateDoc } from 'firebase/firestore';
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

/**
 * Force send a notification for a specific tournament, regardless of timing
 */
async function forceSendNotification(tournamentId) {
  try {
    console.log(`Forcing notification for tournament ID: ${tournamentId}`);
    
    // Get tournament data
    const tournamentRef = doc(db, 'tournaments', tournamentId);
    const tournamentSnap = await getDoc(tournamentRef);
    
    if (!tournamentSnap.exists()) {
      console.error(`Tournament ${tournamentId} not found`);
      return;
    }
    
    const tournament = tournamentSnap.data();
    console.log(`Found tournament: ${tournament.name}`);
    
    // Check if it's an active tournament
    if (tournament.status !== 'active') {
      console.warn(`Tournament status is ${tournament.status}, not active. Proceeding anyway...`);
    }
    
    const hostId = tournament.host_id;
    if (!hostId) {
      console.error(`Tournament ${tournamentId} has no host_id`);
      return;
    }
    
    // Get host user document to get email
    const hostDocRef = doc(db, 'users', hostId);
    const hostDocSnapshot = await getDoc(hostDocRef);
    
    if (!hostDocSnapshot.exists()) {
      console.error(`Host user ${hostId} for tournament ${tournamentId} not found`);
      return;
    }
    
    const hostData = hostDocSnapshot.data();
    const hostEmail = hostData.email;
    
    if (!hostEmail) {
      console.error(`Host user ${hostId} has no email`);
      return;
    }
    
    console.log(`Found host: ${hostData.name || hostId} with email ${hostEmail}`);
    
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
    
    // Format tournament start time
    const startDate = tournament.start_date instanceof Date ? tournament.start_date : 
                    (tournament.start_date.toDate ? tournament.start_date.toDate() : new Date(tournament.start_date));
    const formattedTime = startDate.toLocaleString('en-US', {
      hour: 'numeric', 
      minute: 'numeric',
      hour12: true
    });
    const formattedDate = startDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
    
    // Prepare email content
    const mailOptions = {
      from: `"Tournament Host" <${process.env.EMAIL_USER || 'freefiretournaments03@gmail.com'}>`,
      to: hostEmail,
      subject: `🏆 MANUAL TEST: Tournament "${tournament.name}" Starts Soon!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #6200EA;">Tournament Starting Soon!</h1>
          </div>
          
          <p>Hello Tournament Host,</p>
          
          <p><strong>MANUAL TEST:</strong> This email was triggered manually to diagnose notification issues.</p>
          
          <p>Your hosted tournament <strong>${tournament.name}</strong> is scheduled to start soon!</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h2 style="color: #6200EA; margin-top: 0;">${tournament.name}</h2>
            <p><strong>Start Time:</strong> ${formattedTime} on ${formattedDate}</p>
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
            <p style="font-size: 12px; color: #666;">This is a manual test email. Debugging notification system.</p>
          </div>
        </div>
      `
    };
    
    // Send the email
    console.log(`Sending email to ${hostEmail}...`);
    const info = await emailTransporter.sendMail(mailOptions);
    console.log('Manual test email sent successfully!');
    console.log('Message ID:', info.messageId);
    
    // Optionally update the tournament document
    console.log('Updating tournament notification status...');
    await updateDoc(tournamentRef, {
      notificationSent: true
    });
    console.log(`Tournament ${tournamentId} updated successfully`);
    
  } catch (error) {
    console.error('Error forcing notification:', error);
  }
}

// Check if tournament ID was provided as command line argument
const tournamentId = process.argv[2];

if (!tournamentId) {
  console.error('Please provide a tournament ID as argument');
  console.error('Usage: node force-send-notification.js <tournamentId>');
  process.exit(1);
}

// Run the function
forceSendNotification(tournamentId)
  .then(() => {
    console.log('Manual notification process completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error in manual notification process:', error);
    process.exit(1);
  });
