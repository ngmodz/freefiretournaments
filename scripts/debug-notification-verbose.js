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

async function sendTournamentNotificationsVerbose() {
  try {
    console.log('🚀 Starting verbose notification check...');
    
    // Calculate IST times
    const now = new Date();
    const istNow = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    
    // Look for tournaments starting between 19-21 minutes from now
    const minStartTime = new Date(istNow.getTime() + 19 * 60 * 1000);
    const maxStartTime = new Date(istNow.getTime() + 21 * 60 * 1000);
    
    console.log(`⏰ Current IST time: ${istNow.toLocaleString()}`);
    console.log(`🔍 Looking for tournaments starting between:`);
    console.log(`   From: ${minStartTime.toLocaleString()} IST`);
    console.log(`   To:   ${maxStartTime.toLocaleString()} IST`);
    
    // Query tournaments
    const tournamentQuery = query(
      collection(db, 'tournaments'),
      where('status', '==', 'active'),
      where('start_date', '>=', minStartTime),
      where('start_date', '<=', maxStartTime)
    );
    
    console.log('🔍 Executing Firestore query...');
    const querySnapshot = await getDocs(tournamentQuery);
    console.log(`📊 Query returned ${querySnapshot.size} tournaments`);
    
    if (querySnapshot.empty) {
      console.log('❌ No tournaments found in the notification window');
      return;
    }
    
    // Process each tournament
    for (const docSnapshot of querySnapshot.docs) {
      const tournamentId = docSnapshot.id;
      const tournament = docSnapshot.data();
      
      console.log(`\\n🏆 Processing tournament: ${tournamentId}`);
      console.log(`   Name: ${tournament.name}`);
      console.log(`   Host ID: ${tournament.host_id}`);
      console.log(`   Status: ${tournament.status}`);
      console.log(`   Notification sent: ${tournament.notificationSent}`);
      console.log(`   Start date: ${tournament.start_date.toDate().toLocaleString()}`);
      
      // Skip if notification already sent
      if (tournament.notificationSent) {
        console.log('   ⏭️  Skipping: Notification already sent');
        continue;
      }
      
      // Get host user
      console.log(`   👤 Fetching host user: ${tournament.host_id}`);
      const hostDocRef = doc(db, 'users', tournament.host_id);
      const hostDocSnapshot = await getDoc(hostDocRef);
      
      if (!hostDocSnapshot.exists()) {
        console.log(`   ❌ Host user not found: ${tournament.host_id}`);
        continue;
      }
      
      const hostData = hostDocSnapshot.data();
      console.log(`   📧 Host email: ${hostData.email}`);
      
      if (!hostData.email) {
        console.log('   ❌ Host has no email address');
        continue;
      }
      
      // Send email
      console.log('   📨 Sending email notification...');
      
      const startDate = tournament.start_date.toDate();
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
      
      const mailOptions = {
        from: `"Freefire Tournaments" <${process.env.EMAIL_USER || 'freefiretournaments03@gmail.com'}>`,
        to: hostData.email,
        subject: `🏆 Tournament "${tournament.name}" Starts Soon!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="color: #6200EA;">Tournament Starting Soon!</h1>
            </div>
            
            <p>Hello Tournament Host,</p>
            
            <p>Your hosted tournament <strong>${tournament.name}</strong> is scheduled to start in about <strong>20 minutes</strong>!</p>
            
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h2 style="color: #6200EA; margin-top: 0;">${tournament.name}</h2>
              <p><strong>Start Time:</strong> ${formattedTime} on ${formattedDate}</p>
              <p><strong>Mode:</strong> ${tournament.mode}</p>
              <p><strong>Map:</strong> ${tournament.map}</p>
              <p><strong>Room Type:</strong> ${tournament.room_type}</p>
              <p><strong>Participants:</strong> ${tournament.filled_spots}/${tournament.max_players}</p>
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
      
      try {
        const info = await emailTransporter.sendMail(mailOptions);
        console.log(`   ✅ Email sent successfully! Message ID: ${info.messageId}`);
        
        // Update notification status
        console.log('   📝 Updating notification status...');
        await updateDoc(docSnapshot.ref, {
          notificationSent: true
        });
        console.log('   ✅ Tournament marked as notified');
        
      } catch (emailError) {
        console.error(`   ❌ Error sending email:`, emailError);
      }
    }
    
    console.log('\\n🎉 Notification process completed');
    
  } catch (error) {
    console.error('❌ Error in notification process:', error);
  }
}

sendTournamentNotificationsVerbose()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
