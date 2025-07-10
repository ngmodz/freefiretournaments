const { onRequest } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const logger = require("firebase-functions/logger");
const nodemailer = require('nodemailer');
const functions = require('firebase-functions');

// Initialize Firebase Admin SDK
initializeApp();
const db = getFirestore();

// Function to get email config or use fallback
const getEmailConfig = () => {
  try {
    // Try to get email config from Firebase Functions config
    const config = functions.config();
    return {
      user: config.email?.user,
      pass: config.email?.password
    };
  } catch (error) {
    logger.warn('Error getting email config from functions.config():', error);
    // Fall back to process.env
    return {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    };
  }
};

// Configure email transporter
const emailConfig = getEmailConfig();
const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: emailConfig.user,
    pass: emailConfig.pass
  }
});

// Log email configuration status (without exposing sensitive data)
logger.info(`Email configuration: ${emailConfig.user ? 'Found email user' : 'Missing email user'}, ${emailConfig.pass ? 'Found password' : 'Missing password'}`);

// Cloud Function to send email notifications for upcoming tournaments (20 minutes before start time)
exports.sendUpcomingTournamentNotifications = onSchedule("every 5 minutes", async (context) => {
  try {
    logger.info("Checking for upcoming tournaments to send notifications");
    
    const now = new Date();
    
    // Calculate the time 20 minutes from now
    const twentyMinutesFromNow = new Date(now.getTime() + 20 * 60 * 1000);
    // Add a small buffer (30 seconds) to avoid missing tournaments
    const twentyMinutesPlusBuffer = new Date(now.getTime() + 20 * 60 * 1000 + 30 * 1000);
    
    logger.info(`Looking for tournaments starting between ${twentyMinutesFromNow.toISOString()} and ${twentyMinutesPlusBuffer.toISOString()}`);
    
    // Query for tournaments that are starting in approximately 20 minutes
    const tournamentsQuery = db.collection('tournaments')
      .where('status', '==', 'active') // Only active tournaments
      .where('start_date', '>=', twentyMinutesFromNow)
      .where('start_date', '<=', twentyMinutesPlusBuffer)
      .limit(50); // Process in batches
    
    const upcomingTournaments = await tournamentsQuery.get();
    
    if (upcomingTournaments.empty) {
      logger.info("No upcoming tournaments found for notification");
      return;
    }
    
    logger.info(`Found ${upcomingTournaments.size} upcoming tournaments for notification`);
    
    // Process each upcoming tournament
    const promises = [];
    
    for (const tournamentDoc of upcomingTournaments.docs) {
      const tournament = tournamentDoc.data();
      const tournamentId = tournamentDoc.id;
      const hostId = tournament.host_id;
      
      // Skip if no host ID
      if (!hostId) {
        logger.warn(`Tournament ${tournamentId} has no host_id, skipping notification`);
        continue;
      }
      
      // Get host user document to get email
      const hostDoc = await db.collection('users').doc(hostId).get();
      if (!hostDoc.exists) {
        logger.warn(`Host user ${hostId} for tournament ${tournamentId} not found, skipping notification`);
        continue;
      }
      
      const hostData = hostDoc.data();
      const hostEmail = hostData.email;
      
      if (!hostEmail) {
        logger.warn(`Host user ${hostId} has no email, skipping notification`);
        continue;
      }
      
      logger.info(`Sending notification for tournament ${tournamentId} to host ${hostEmail}`);
      
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
        from: `"Freefire Tournaments" <${emailConfig.user}>`,
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
      
      // Send the email and track the promise
      promises.push(emailTransporter.sendMail(mailOptions)
        .then(() => {
          logger.info(`Successfully sent email notification to ${hostEmail} for tournament ${tournamentId}`);
          
          // Update the tournament document to mark notification as sent
          return tournamentDoc.ref.update({
            notificationSent: true
          });
        })
        .catch((error) => {
          logger.error(`Error sending email to ${hostEmail}:`, error);
          return null; // Don't fail the entire batch if one email fails
        }));
    }
    
    // Wait for all email promises to complete
    await Promise.all(promises);
    
    logger.info(`Email notification process completed for ${promises.length} tournaments`);
    
    return {
      success: true,
      notificationsSent: promises.length
    };
    
  } catch (error) {
    logger.error("Error sending tournament notifications:", error);
    throw error;
  }
});

// Cloud Function to automatically delete expired tournaments
exports.deleteExpiredTournaments = onSchedule("every 5 minutes", async (context) => {
  try {
    logger.info("Starting cleanup of expired tournaments");
    
    const now = new Date();
    const nowTimestamp = new Date(now.getTime());
    
    // Query for tournaments that have expired (ttl is in the past)
    const expiredTournamentsQuery = db.collection('tournaments')
      .where('ttl', '<=', nowTimestamp)
      .limit(100); // Process in batches
    
    const expiredTournaments = await expiredTournamentsQuery.get();
    
    if (expiredTournaments.empty) {
      logger.info("No expired tournaments found");
      return;
    }
    
    logger.info(`Found ${expiredTournaments.size} expired tournaments to delete`);
    
    // Delete expired tournaments in batches
    const batch = db.batch();
    let deletedCount = 0;
    
    expiredTournaments.forEach((doc) => {
      const tournamentData = doc.data();
      logger.info(`Deleting expired tournament: ${doc.id} - ${tournamentData.name}`);
      batch.delete(doc.ref);
      deletedCount++;
    });
    
    // Commit the batch deletion
    await batch.commit();
    
    logger.info(`Successfully deleted ${deletedCount} expired tournaments`);
    
    return {
      success: true,
      deletedCount,
      message: `Deleted ${deletedCount} expired tournaments`
    };
    
  } catch (error) {
    logger.error("Error deleting expired tournaments:", error);
    throw error;
  }
});

// Manual trigger for testing (HTTP endpoint)
exports.triggerTournamentCleanup = onRequest(async (req, res) => {
  try {
    logger.info("Manual tournament cleanup triggered");
    
    const now = new Date();
    const nowTimestamp = new Date(now.getTime());
    
    // Query for tournaments that have expired
    const expiredTournamentsQuery = db.collection('tournaments')
      .where('ttl', '<=', nowTimestamp)
      .limit(100);
    
    const expiredTournaments = await expiredTournamentsQuery.get();
    
    if (expiredTournaments.empty) {
      res.json({
        success: true,
        deletedCount: 0,
        message: "No expired tournaments found"
      });
      return;
    }
    
    // Delete expired tournaments
    const batch = db.batch();
    let deletedCount = 0;
    
    expiredTournaments.forEach((doc) => {
      const tournamentData = doc.data();
      logger.info(`Deleting expired tournament: ${doc.id} - ${tournamentData.name}`);
      batch.delete(doc.ref);
      deletedCount++;
    });
    
    await batch.commit();
    
    res.json({
      success: true,
      deletedCount,
      message: `Deleted ${deletedCount} expired tournaments`
    });
    
  } catch (error) {
    logger.error("Error in manual tournament cleanup:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test endpoint for sending notification email
exports.testTournamentNotification = onRequest(async (req, res) => {
  try {
    const { email, tournamentId } = req.query;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email parameter is required"
      });
    }
    
    let tournamentData;
    if (tournamentId) {
      // Fetch actual tournament data if ID provided
      const tournamentDoc = await db.collection('tournaments').doc(tournamentId).get();
      if (!tournamentDoc.exists) {
        return res.status(404).json({
          success: false,
          error: "Tournament not found"
        });
      }
      tournamentData = tournamentDoc.data();
    } else {
      // Use sample data if no ID provided
      tournamentData = {
        name: "Test Tournament",
        mode: "Solo",
        map: "Bermuda",
        room_type: "Classic",
        max_players: 12,
        filled_spots: 8,
        start_date: new Date(Date.now() + 20 * 60 * 1000)
      };
    }
    
    // Format tournament start time
    const startDate = tournamentData.start_date instanceof Date ? tournamentData.start_date : 
                      (tournamentData.start_date.toDate ? tournamentData.start_date.toDate() : new Date(tournamentData.start_date));
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
      from: `"Freefire Tournaments" <${emailConfig.user}>`,
      to: email,
      subject: `🏆 Reminder: Your Tournament "${tournamentData.name}" Starts Soon!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #6200EA;">Tournament Starting Soon!</h1>
          </div>
          
          <p>Hello Tournament Host,</p>
          
          <p>Your hosted tournament <strong>${tournamentData.name}</strong> is scheduled to start in about <strong>20 minutes</strong>!</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h2 style="color: #6200EA; margin-top: 0;">${tournamentData.name}</h2>
            <p><strong>Start Time:</strong> ${formattedTime} on ${formattedDate}</p>
            <p><strong>Mode:</strong> ${tournamentData.mode}</p>
            <p><strong>Map:</strong> ${tournamentData.map}</p>
            <p><strong>Room Type:</strong> ${tournamentData.room_type}</p>
            <p><strong>Participants:</strong> ${tournamentData.filled_spots || 0}/${tournamentData.max_players}</p>
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
    
    // Send the test email
    await emailTransporter.sendMail(mailOptions);
    
    res.json({
      success: true,
      message: `Test notification email sent to ${email}`
    });
    
  } catch (error) {
    logger.error("Error sending test notification:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check endpoint
exports.healthCheck = onRequest((req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    message: "Tournament cleanup service is running"
  });
});