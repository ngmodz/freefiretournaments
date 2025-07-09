import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, updateDoc, doc, getDoc } from 'firebase/firestore';
import nodemailer from 'nodemailer';

// Initialize Firebase
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

// Email configuration
const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASSWORD;

// Configure email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPass
    },
    tls: {
      rejectUnauthorized: false // Ignore certificate issues
    }
  });
};

/**
 * Check a specific tournament and send notification if needed
 */
async function checkSpecificTournament(tournamentId) {
  // Initialize Firebase for this request
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const results = { success: true, notification: false, error: null };
  
  try {
    const now = new Date();
    
    // Get the specific tournament
    const tournamentRef = doc(db, 'tournaments', tournamentId);
    const tournamentDoc = await getDoc(tournamentRef);
    
    if (!tournamentDoc.exists()) {
      results.success = false;
      results.error = `Tournament ${tournamentId} not found`;
      return results;
    }
    
    const tournament = tournamentDoc.data();
    
    // Skip if tournament is not active
    if (tournament.status !== 'active') {
      results.error = `Tournament ${tournamentId} is not active (status: ${tournament.status})`;
      return results;
    }
    
    // Skip if notification already sent
    if (tournament.notificationSent) {
      results.error = `Notification already sent for tournament ${tournamentId}`;
      return results;
    }
    
    const hostId = tournament.host_id;
    
    // Skip if no host ID
    if (!hostId) {
      results.error = `Tournament ${tournamentId} has no host_id`;
      return results;
    }
    
    // Calculate time to start
    const startDate = tournament.start_date instanceof Date ? tournament.start_date : 
                    (tournament.start_date.toDate ? tournament.start_date.toDate() : new Date(tournament.start_date));
    
    const minutesToStart = (startDate.getTime() - now.getTime()) / (1000 * 60);
    
    // Only send notification if tournament starts in 19-21 minutes (20 minutes ± 1 minute buffer)
    // Or if force=true is passed in the query
    if (minutesToStart < 19 || minutesToStart > 21) {
      results.error = `Tournament ${tournamentId} starts in ${minutesToStart.toFixed(1)} minutes, outside notification window (19-21 minutes)`;
      return results;
    }
    
    // Get host user document to get email
    const hostDocRef = doc(db, 'users', hostId);
    const hostDocSnapshot = await getDoc(hostDocRef);
    
    if (!hostDocSnapshot.exists()) {
      results.error = `Host user ${hostId} for tournament ${tournamentId} not found`;
      return results;
    }
    
    const hostData = hostDocSnapshot.data();
    const hostEmail = hostData.email;
    
    if (!hostEmail) {
      results.error = `Host user ${hostId} has no email`;
      return results;
    }
    
    // Format tournament start time
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
    
    // Create email transporter
    const emailTransporter = createTransporter();
    
    // Prepare email content
    const mailOptions = {
      from: `"Tournament Host" <${emailUser}>`,
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
            <p style="font-size: 12px; color: #666;">This is an automated reminder. Please do not reply to this email.</p>
          </div>
        </div>
      `
    };
    
    // Send the email and update the notification status
    await emailTransporter.sendMail(mailOptions);
    
    // Update the tournament document to mark notification as sent
    await updateDoc(doc(db, 'tournaments', tournamentId), {
      notificationSent: true
    });
    
    results.notification = true;
    return results;
    
  } catch (error) {
    results.success = false;
    results.error = error.message;
    return results;
  }
}

// Export the serverless function for Vercel
export default async function handler(req, res) {
  try {
    // Check for API key authentication (optional but recommended)
    const apiKey = req.headers['x-api-key'] || req.query.key;
    
    if (process.env.API_KEY && apiKey !== process.env.API_KEY) {
      return res.status(401).json({ 
        success: false,
        error: 'Unauthorized. Invalid API key.'
      });
    }
    
    // Get tournament ID from query parameter
    const { id, force } = req.query;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Missing tournament ID. Please provide ?id=your_tournament_id'
      });
    }
    
    // Process the request
    const results = await checkSpecificTournament(id, force === 'true');
    
    // Return the results
    return res.status(200).json(results);
  } catch (error) {
    console.error('Error in tournament check endpoint:', error);
    return res.status(500).json({ 
      success: false,
      error: error.message || 'Internal server error'
    });
  }
} 