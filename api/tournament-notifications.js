import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, updateDoc, doc, getDoc, Timestamp } from 'firebase/firestore';
import nodemailer from 'nodemailer';
import { getFirebaseConfig, getEmailConfig, debugEnvironment } from './firebase-config-helper.js';

// Initialize Firebase
const firebaseConfig = getFirebaseConfig();

// Email configuration
const emailConfig = getEmailConfig();
const emailUser = emailConfig.user;
const emailPass = emailConfig.pass;

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
  // Log environment info to help debug
  console.log('Environment details:', debugEnvironment());
  console.log('Firebase config:', {
    projectId: firebaseConfig.projectId,
    configValid: !!(firebaseConfig.apiKey && firebaseConfig.projectId)
  });
  
  // Log email config (safely)
  console.log('Email config available:', {
    user: !!emailUser,
    pass: !!emailPass
  });
  
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
      // Calculate the notification window bounds in IST
      const notificationWindowStart = new Date(istNow.getTime() + 19 * 60 * 1000); // 19 minutes from now
      const notificationWindowEnd = new Date(istNow.getTime() + 21 * 60 * 1000);   // 21 minutes from now
      
      console.log(`Notification window: ${notificationWindowStart.toLocaleString()} to ${notificationWindowEnd.toLocaleString()} IST`);
      
      // Query for active tournaments that will start in 19-21 minutes
      const tournamentsQuery = query(
        collection(db, 'tournaments'),
        where('status', '==', 'active')
      );
      
      const upcomingTournamentsSnapshot = await getDocs(tournamentsQuery);
      
      if (upcomingTournamentsSnapshot.empty) {
        console.log('No active tournaments found');
        results.message = 'No active tournaments found';
        return results;
      }
      
      console.log(`Found ${upcomingTournamentsSnapshot.size} active tournaments, checking each for notification window`);
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
        
        // Additional check: Skip if notification was sent in the last 30 minutes
        // This prevents duplicate notifications due to race conditions
        if (tournament.notificationSentAt) {
          const notificationTime = tournament.notificationSentAt.toDate ? 
            tournament.notificationSentAt.toDate() : 
            new Date(tournament.notificationSentAt);
          const timeSinceNotification = (istNow.getTime() - notificationTime.getTime()) / (1000 * 60);
          
          if (timeSinceNotification < 30) {
            console.log(`Notification sent ${timeSinceNotification.toFixed(1)} minutes ago for tournament ${tournamentId}, skipping to prevent duplicate`);
            continue;
          }
        }
        
        // Calculate if it's time to send notification (between 19-21 minutes before start)
        const startDate = tournament.start_date instanceof Date ? tournament.start_date : 
                        (tournament.start_date.toDate ? tournament.start_date.toDate() : new Date(tournament.start_date));
        
        const minutesToStart = (startDate.getTime() - istNow.getTime()) / (1000 * 60);
        
        console.log(`Tournament ${tournamentId} - Minutes to start: ${minutesToStart.toFixed(1)}, Start time: ${startDate.toLocaleString()}`);
        
        // This is the key logic: Check if tournament starts in the NEXT 4 HOURS
        // We'll send notifications for ALL tournaments that will start in 19-21 minutes
        // within the next 4 hours (when the next cron job runs)
        
        const hoursToStart = minutesToStart / 60;
        
        console.log(`Tournament ${tournamentId} - Hours to start: ${hoursToStart.toFixed(2)}, Minutes: ${minutesToStart.toFixed(1)}`);
        
        // Send notifications for tournaments starting in the next 4 hours
        // This ensures we don't miss any tournaments between cron runs
        if (hoursToStart > 4) {
          console.log(`Tournament ${tournamentId} starts in ${hoursToStart.toFixed(2)} hours, too far in future, skipping`);
          continue;
        }
        
        // Extended notification window: 10-30 minutes before start
        // This gives more chances for notifications to be sent
        if (minutesToStart < 10) {
          console.log(`Tournament ${tournamentId} starts in ${minutesToStart.toFixed(1)} minutes, too close, skipping`);
          continue;
        }
        
        if (minutesToStart > 30) {
          console.log(`Tournament ${tournamentId} starts in ${minutesToStart.toFixed(1)} minutes, too early, skipping`);
          continue;
        }
        
        console.log(`Tournament ${tournamentId} starts in ${minutesToStart.toFixed(1)} minutes (${hoursToStart.toFixed(2)} hours), scheduling notification`);
        
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
            notificationSent: true,
            notificationSentAt: Timestamp.now()
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
  console.log('API endpoint called:', new Date().toISOString());
  console.log('Query params:', req.query);
  
  try {
    // Check for API key authentication (optional but recommended)
    const apiKey = req.headers['x-api-key'] || req.query.key;
    
    if (process.env.API_KEY && apiKey !== process.env.API_KEY) {
      console.log('API key validation failed');
      return res.status(401).json({ 
        success: false,
        error: 'Unauthorized. Invalid API key.'
      });
    }
    
    // Process the request
    console.log('Starting notification processing');
    const results = await sendTournamentNotifications();
    
    // Return the results
    console.log('Notification processing completed:', results);
    return res.status(200).json(results);
  } catch (error) {
    console.error('Error in notification endpoint:', error);
    // Log the full error object to capture stack traces
    console.error('Error details:', JSON.stringify({
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code
    }, null, 2));
    
    return res.status(500).json({ 
      success: false,
      error: error.message || 'Internal server error'
    });
  }
} 