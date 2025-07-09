import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
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

// Email credentials
const emailUser = process.env.EMAIL_USER || 'freefiretournaments03@gmail.com';
const emailPass = process.env.EMAIL_PASSWORD || 'eyym uhok glkx gony';

console.log(`Using email: ${emailUser}`);
console.log(`Password provided: ${emailPass ? 'Yes' : 'No'}`);

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

// Sample tournament data for testing
const sampleTournament = {
  name: "Test Tournament",
  mode: "Solo",
  map: "Bermuda",
  room_type: "Classic",
  max_players: 12,
  filled_spots: 8,
  start_date: new Date(Date.now() + 20 * 60 * 1000)
};

// Format tournament start time
const startDate = sampleTournament.start_date;
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

async function sendTestEmail(recipientEmail) {
  if (!recipientEmail) {
    console.error('No recipient email provided. Usage: node test-notification.js recipient@example.com');
    process.exit(1);
  }
  
  console.log(`Sending test email to: ${recipientEmail}`);
  
  // Prepare email content
  const mailOptions = {
    from: `"Tournament Host" <${emailUser}>`,
    to: recipientEmail,
    subject: `🏆 Test: Tournament "${sampleTournament.name}" Starts Soon!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #6200EA;">Tournament Starting Soon!</h1>
        </div>
        
        <p>Hello Tournament Host,</p>
        
        <p>This is a TEST email. Your hosted tournament <strong>${sampleTournament.name}</strong> is scheduled to start in about <strong>20 minutes</strong>!</p>
        
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
  
  try {
    const info = await emailTransporter.sendMail(mailOptions);
    console.log('Email sent successfully!');
    console.log('Message ID:', info.messageId);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

// Get recipient email from command line arguments
const recipientEmail = process.argv[2];
sendTestEmail(recipientEmail)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  }); 