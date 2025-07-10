import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, updateDoc, doc, getDoc } from 'firebase/firestore';
import nodemailer from 'nodemailer';

// Initialize Firebase
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
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
 * Send notifications for tournaments that will start in the next 24 hours
 * and need a notification (20 minutes before start time)
 */
async function sendTournamentNotifications() {
  // Initialize Firebase for this request
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const results = { success: true, notifications: 0, errors: [], checked: 0 };
  
  try {
    // Use IST timezone consistently
    const now = new Date();
    const istNow = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    
    // Get tournaments starting in the next 24 hours (IST)
    const twentyFourHoursFromNow = new Date(istNow.getTime() + 24 * 60 * 60 * 1000);
    
    console.log(`Looking for tournaments starting between ${istNow.toLocaleString()} and ${twentyFourHoursFromNow.toLocaleString()} IST`);
    console.log(`Current IST time: ${istNow.toLocaleString()}, Email credentials available: ${!!emailUser && !!emailPass}`);
    
    try {
      // Query for active tournaments in the next 24 hours (using IST)
      const tournamentsQuery = query(
        collection(db, 'tournaments'),
        where('status', '==', 'active'),
        where('start_date', '>=', istNow),
        where('start_date', '<=', twentyFourHoursFromNow)
      );
      
      const upcomingTournamentsSnapshot = await getDocs(tournamentsQuery);
      
      if (upcomingTournamentsSnapshot.empty) {
        console.log('No upcoming tournaments found in the next 24 hours');
        results.message = 'No upcoming tournaments found';
        return results;
      }
      
      console.log(`Found ${upcomingTournamentsSnapshot.size} upcoming tournaments in the next 24 hours`);
      results.checked = upcomingTournamentsSnapshot.size;
      
      // Log all tournaments found
      upcomingTournamentsSnapshot.docs.forEach(doc => {
        const t = doc.data();
        const startDate = t.start_date instanceof Date ? t.start_date : 
                        (t.start_date.toDate ? t.start_date.toDate() : new Date(t.start_date));
        console.log(`Tournament ${doc.id}: ${t.name}, Start: ${startDate}, Host: ${t.host_id}, Notification sent: ${t.notificationSent}`);
      });
      
      // Create email transporter
      const emailTransporter = createTransporter();
      
      // Process each upcoming tournament
      for (const tournamentDoc of upcomingTournamentsSnapshot.docs) {
        const tournament = tournamentDoc.data();
        const tournamentId = tournamentDoc.id;
        const hostId = tournament.host_id;
        
        // Skip if no host ID
        if (!hostId) {
          results.errors.push(`Tournament ${tournamentId} has no host_id, skipping notification`);
          continue;
        }
        
        // Skip if notification already sent
        if (tournament.notificationSent) {
          console.log(`Notification already sent for tournament ${tournamentId}, skipping`);
          continue;
        }
        
        // Calculate if it's time to send notification (between 19-21 minutes before start)
        const startDate = tournament.start_date instanceof Date ? tournament.start_date : 
                        (tournament.start_date.toDate ? tournament.start_date.toDate() : new Date(tournament.start_date));
        
        const minutesToStart = (startDate.getTime() - istNow.getTime()) / (1000 * 60);
        
        console.log(`Tournament ${tournamentId} - Minutes to start: ${minutesToStart.toFixed(1)}, Start time: ${startDate.toLocaleString()}`);
        
        // Only send notification if tournament starts in 19-21 minutes (20 minutes ± 1 minute buffer)
        if (minutesToStart < 19 || minutesToStart > 21) {
          console.log(`Tournament ${tournamentId} starts in ${minutesToStart.toFixed(1)} minutes, outside notification window (19-21 minutes), skipping`);
          continue;
        }
        
        console.log(`Tournament ${tournamentId} starts in ${minutesToStart.toFixed(1)} minutes, sending notification`);
        
        // Get host user document to get email
        const hostDocRef = doc(db, 'users', hostId);
        const hostDocSnapshot = await getDoc(hostDocRef);
        
        if (!hostDocSnapshot.exists()) {
          results.errors.push(`Host user ${hostId} for tournament ${tournamentId} not found, skipping notification`);
          continue;
        }
        
        const hostData = hostDocSnapshot.data();
        const hostEmail = hostData.email;
        
        console.log(`Host data for ${hostId}: Email=${hostEmail}, Name=${hostData.name || 'N/A'}`);
        
        if (!hostEmail) {
          results.errors.push(`Host user ${hostId} has no email, skipping notification`);
          continue;
        }
        
        console.log(`Sending notification for tournament ${tournamentId} to host ${hostEmail}`);
        
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
        try {
          console.log(`Attempting to send email from ${emailUser} to ${hostEmail} for tournament ${tournamentId}`);
          await emailTransporter.sendMail(mailOptions);
          console.log(`Successfully sent email notification to ${hostEmail} for tournament ${tournamentId}`);
          
          // Update the tournament document to mark notification as sent
          await updateDoc(doc(db, 'tournaments', tournamentId), {
            notificationSent: true
          });
          
          console.log(`Marked tournament ${tournamentId} as notified`);
          results.notifications++;
        } catch (error) {
          results.errors.push(`Error sending email to ${hostEmail}: ${error.message}`);
        }
      }
      
      console.log('Email notification process completed');
      
      if (results.notifications === 0 && results.errors.length === 0) {
        results.message = `Checked ${results.checked} tournaments, but none needed notifications at this time`;
      }
      
    } catch (error) {
      if (error.code === 'failed-precondition' && error.toString().includes('requires an index')) {
        results.success = false;
        results.errors.push('Missing Firestore index. Please create a composite index for collection: tournaments, Fields: status (Ascending), start_date (Ascending)');
        
        // Get the index creation URL from the error message if available
        const urlMatch = error.toString().match(/(https:\/\/console\.firebase\.google\.com\/[^\s]+)/);
        if (urlMatch && urlMatch[1]) {
          results.indexUrl = urlMatch[1];
        }
      } else {
        throw error;
      }
    }
    
  } catch (error) {
    results.success = false;
    results.errors.push(`Error: ${error.message}`);
  }
  
  return results;
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
    
    // Process the request
    const results = await sendTournamentNotifications();
    
    // Return the results
    return res.status(200).json(results);
  } catch (error) {
    console.error('Error in notification endpoint:', error);
    return res.status(500).json({ 
      success: false,
      error: error.message || 'Internal server error'
    });
  }
} 