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
 * Check a specific tournament and send notification if needed
 */
async function checkSpecificTournament(tournamentId) {
  // Initialize Firebase for this request
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const results = { success: true, notification: false, error: null };
  
  try {
    // Log environment info
    console.log('Environment details:', debugEnvironment());
    console.log('Firebase config:', {
      projectId: firebaseConfig.projectId,
      configValid: !!(firebaseConfig.apiKey && firebaseConfig.projectId)
    });
    
    const now = new Date();
    const istNow = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    
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
    
    const minutesToStart = (startDate.getTime() - istNow.getTime()) / (1000 * 60);
    
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
      from: `"Freefire Tournaments" <${emailUser}>`,
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

/**
 * Check all active tournaments and send notifications for those starting soon
 */
async function checkAllTournaments() {
  // Initialize Firebase for this request
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const results = { success: true, notifications: 0, errors: [], checked: 0 };
  
  try {
    // Log environment info
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
    
    // Get current time in IST
    const now = new Date();
    const istNow = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    
    console.log(`Current IST time: ${istNow.toLocaleString()}`);
    
    // Check Firebase connectivity
    try {
      // Query active tournaments
      const tournamentsQuery = query(
        collection(db, 'tournaments'),
        where('status', '==', 'active')
      );
      
      const tournamentDocs = await getDocs(tournamentsQuery);
      results.checked = tournamentDocs.size;
      
      console.log(`Found ${results.checked} active tournaments`);
      
      // Create email transporter
      const emailTransporter = createTransporter();
      
      // Process each tournament
      for (const tournamentDoc of tournamentDocs.docs) {
        const tournament = tournamentDoc.data();
        const tournamentId = tournamentDoc.id;
        
        console.log(`Processing tournament: ${tournamentId} - "${tournament.name}"`);
        
        if (!tournament.host_id) {
          results.errors.push(`Tournament ${tournamentId} has no host_id`);
          continue;
        }
        
        // Skip if notification already sent
        if (tournament.notificationSent) {
          console.log(`Notification already sent for tournament ${tournamentId}`);
          continue;
        }
        
        // Additional duplicate check
        if (tournament.notificationSentAt) {
          const notificationTime = tournament.notificationSentAt.toDate ? 
            tournament.notificationSentAt.toDate() : 
            new Date(tournament.notificationSentAt);
          const timeSinceNotification = (istNow.getTime() - notificationTime.getTime()) / (1000 * 60);
          
          if (timeSinceNotification < 30) {
            console.log(`Notification sent ${timeSinceNotification.toFixed(1)} minutes ago for tournament ${tournamentId}`);
            continue;
          }
        }
        
        // Calculate notification timing
        const startDate = tournament.start_date instanceof Date ? tournament.start_date : 
                        (tournament.start_date.toDate ? tournament.start_date.toDate() : new Date(tournament.start_date));
        
        const minutesToStart = (startDate.getTime() - istNow.getTime()) / (1000 * 60);
        
        console.log(`Tournament ${tournamentId} starts in ${minutesToStart.toFixed(1)} minutes`);
        
        // Check if tournament is in the notification window (19-21 minutes before start)
        if (minutesToStart < 19 || minutesToStart > 21) {
          console.log(`Tournament ${tournamentId} outside notification window (19-21 minutes)`);
          continue;
        }
        
        // Get host user document to get email
        const hostDocRef = doc(db, 'users', tournament.host_id);
        const hostDocSnapshot = await getDoc(hostDocRef);
        
        if (!hostDocSnapshot.exists()) {
          results.errors.push(`Host user ${tournament.host_id} not found`);
          continue;
        }
        
        const hostData = hostDocSnapshot.data();
        const hostEmail = hostData.email;
        
        if (!hostEmail) {
          results.errors.push(`Host user ${tournament.host_id} has no email`);
          continue;
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
        
        // Prepare email content
        const mailOptions = {
          from: `"Freefire Tournaments" <${emailUser}>`,
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
          console.log(`Attempting to send email to ${hostEmail} for tournament ${tournamentId}`);
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
          console.error(`Failed to send email to ${hostEmail}:`, error);
          results.errors.push(`Failed to send email to ${hostEmail}: ${error.message}`);
        }
      }
      
      if (results.notifications === 0 && results.errors.length === 0) {
        results.message = `Checked ${results.checked} tournaments, none in notification window`;
      }
      
    } catch (firebaseError) {
      console.error('Firebase connectivity error:', firebaseError);
      results.success = false;
      results.errors.push(`Firebase connection error: ${firebaseError.message}`);
    }
    
  } catch (error) {
    console.error('Error in notification process:', error);
    results.success = false;
    results.errors.push(`Error: ${error.message}`);
  }
  
  return results;
}

// Export the serverless function for Vercel
export default async function handler(req, res) {
  try {
    // Check if we should check all tournaments or a specific one
    const { id, force, all } = req.query;
    
    // If 'all' parameter is provided, check all tournaments
    if (all === 'true') {
      console.log('Checking all tournaments for notifications');
      const results = await checkAllTournaments();
      return res.status(200).json(results);
    }
    
    // Otherwise, check a specific tournament
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Missing tournament ID. Please provide ?id=your_tournament_id or ?all=true'
      });
    }
    
    // Process the request for a specific tournament
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