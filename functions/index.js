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

// Cloud Function to automatically set TTL for tournaments when they reach scheduled start time
exports.setTournamentTTLAtScheduledTime = onSchedule("every 5 minutes", async (context) => {
  try {
    logger.info("Checking for tournaments that have reached their scheduled start time");
    
    const now = new Date();
    const nowTimestamp = new Date(now.getTime());
    
    // Query for active tournaments that have reached their scheduled start time but don't have TTL set yet
    const tournamentsQuery = db.collection('tournaments')
      .where('status', '==', 'active')
      .where('start_date', '<=', nowTimestamp)
      .where('ttl', '==', null) // Only tournaments without TTL
      .limit(100); // Process in batches
    
    const tournaments = await tournamentsQuery.get();
    
    if (tournaments.empty) {
      logger.info("No tournaments found that need TTL set");
      return;
    }
    
    logger.info(`Found ${tournaments.size} tournaments that need TTL set`);
    
    // Set TTL for tournaments in batches
    const batch = db.batch();
    let updatedCount = 0;
    
    tournaments.forEach((doc) => {
      const tournamentData = doc.data();
      const scheduledStartTime = new Date(tournamentData.start_date);
      
      // Calculate TTL (2 hours after scheduled start time)
      const ttlDate = new Date(scheduledStartTime.getTime() + 2 * 60 * 60 * 1000); // Add 2 hours
      const ttlTimestamp = new Date(ttlDate.getTime());
      
      logger.info(`Setting TTL for tournament: ${doc.id} - ${tournamentData.name} to ${ttlDate.toISOString()}`);
      
      batch.update(doc.ref, {
        ttl: ttlTimestamp
      });
      updatedCount++;
    });
    
    // Commit the batch update
    await batch.commit();
    
    logger.info(`Successfully set TTL for ${updatedCount} tournaments`);
    
    return {
      success: true,
      updatedCount,
      message: `Set TTL for ${updatedCount} tournaments`
    };
    
  } catch (error) {
    logger.error("Error setting tournament TTLs:", error);
    throw error;
  }
});


// =================================================================================================
// AUTOMATED TOURNAMENT MODERATOR
// This function runs every minute to enforce rules on unstarted tournaments.
// =================================================================================================

/**
 * Helper to create a credit transaction record in Firestore.
 * This is used for logging all credit changes for audit purposes.
 */
const createCreditTransaction = (txData) => {
  const transactionData = {
    ...txData,
    createdAt: new Date(),
  };
  // Note: This returns a promise
  return db.collection("creditTransactions").add(transactionData);
};

/**
 * Penalizes a host by deducting credits and logging the transaction.
 * Runs within a Firestore transaction to ensure atomicity.
 */
const penalizeHost = (hostId, tournament) => {
  const penaltyAmount = 10;
  const userRef = db.collection("users").doc(hostId);

  return db.runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userRef);
    if (!userDoc.exists) {
      logger.error(`[Moderator] Host user ${hostId} not found for penalty.`);
      throw new Error(`Host user ${hostId} not found`);
    }

    const wallet = userDoc.data().wallet || {};
    // FIX: Use tournamentCredits instead of hostCredits for penalty
    // If tournament credits are less than 10, allow negative balance
    const currentTournamentCredits = wallet.tournamentCredits || 0;
    const newTournamentCredits = currentTournamentCredits - penaltyAmount;

    // Update the user's wallet
    transaction.update(userRef, { "wallet.tournamentCredits": newTournamentCredits });

    // Return the promise to create the transaction log
    return createCreditTransaction({
      userId: hostId,
      type: "host_penalty",
      amount: -penaltyAmount,
      balanceBefore: currentTournamentCredits,
      balanceAfter: newTournamentCredits,
      walletType: "tournamentCredits",
      description: `Penalty for not starting tournament: ${tournament.name}`,
      transactionDetails: {
        tournamentId: tournament.id,
        tournamentName: tournament.name,
      },
    });
  });
};

/**
 * Refunds the entry fee to a single participant.
 * Runs within a Firestore transaction to ensure atomicity.
 */
const refundEntryFee = (participant, tournament) => {
  // The participant object now contains authUid, ign, and customUid
  const { authUid } = participant;
  if (!authUid) {
    logger.warn(`[Moderator] Participant object is missing authUid, cannot refund.`, { participant });
    return Promise.resolve(); // Resolve promise to not break Promise.all
  }

  const entryFee = tournament.entry_fee || 0;
  if (entryFee <= 0) {
    return Promise.resolve(); // No fee to refund
  }

  const userRef = db.collection("users").doc(authUid);
  return db.runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userRef);
    if (!userDoc.exists) {
      logger.error(`[Moderator] Participant user ${authUid} not found for refund.`);
      throw new Error(`Participant user ${authUid} not found`);
    }

    const wallet = userDoc.data().wallet || {};
    const currentCredits = wallet.tournamentCredits || 0;
    const newCredits = currentCredits + entryFee;

    transaction.update(userRef, { "wallet.tournamentCredits": newCredits });

    return createCreditTransaction({
      userId: authUid,
      type: "tournament_refund",
      amount: entryFee,
      balanceBefore: currentCredits,
      balanceAfter: newCredits,
      walletType: "tournamentCredits",
      description: `Refund for cancelled tournament: ${tournament.name}`,
      transactionDetails: {
        tournamentId: tournament.id,
        tournamentName: tournament.name,
      },
    });
  });
};

/**
 * Fetches the email address for a given user ID.
 */
const getUserEmail = async (userId) => {
  try {
    const userDoc = await db.collection("users").doc(userId).get();
    if (userDoc.exists) {
      return userDoc.data().email || null;
    }
    return null;
  } catch (error) {
    logger.error(`[Moderator] Failed to get email for user ${userId}:`, error);
    return null;
  }
};

/**
 * Sends a penalty notification email to the host.
 */
const sendHostPenaltyEmail = (hostEmail, tournamentName) => {
  const mailOptions = {
    from: `"Freefire Tournaments" <${emailConfig.user}>`,
    to: hostEmail,
    subject: `Penalty Applied for Tournament: "${tournamentName}"`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h3 style="color: #d9534f;">Penalty Notice</h3>
        <p>Hello,</p>
        <p>This is to inform you that a penalty of <b>10 credits</b> has been applied to your account.</p>
        <p><b>Reason:</b> Your tournament, "<b>${tournamentName}</b>," was not started within 10 minutes of its scheduled time.</p>
        <p>Please ensure that you start your tournaments on time to avoid further penalties or automatic cancellation.</p>
        <p>The tournament will be automatically cancelled if it is not started within 20 minutes of the scheduled time.</p>
        <br/>
        <p>Regards,<br/>The Freefire Tournaments Team</p>
      </div>
    `,
  };
  return emailTransporter.sendMail(mailOptions);
};

/**
 * Sends a cancellation notification email to the host.
 */
const sendCancellationEmailToHost = (hostEmail, tournamentName) => {
  const mailOptions = {
    from: `"Freefire Tournaments" <${emailConfig.user}>`,
    to: hostEmail,
    subject: `Tournament Cancelled: "${tournamentName}"`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h3 style="color: #d9534f;">Tournament Automatically Cancelled</h3>
        <p>Hello,</p>
        <p>Your tournament, "<b>${tournamentName}</b>," has been automatically cancelled because it was not started within 20 minutes of its scheduled time.</p>
        <p>All entry fees have been refunded to the participants.</p>
        <p>Please make sure to start future tournaments promptly to ensure a good experience for all users.</p>
        <br/>
        <p>Regards,<br/>The Freefire Tournaments Team</p>
      </div>
    `,
  };
  return emailTransporter.sendMail(mailOptions);
};

/**
 * Sends a cancellation notification email to a participant.
 */
const sendCancellationEmailToParticipant = (participantEmail, tournamentName, entryFee) => {
  const mailOptions = {
    from: `"Freefire Tournaments" <${emailConfig.user}>`,
    to: participantEmail,
    subject: `Tournament Cancelled & Refunded: "${tournamentName}"`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h3 style="color: #5bc0de;">Tournament Cancelled</h3>
        <p>Hello,</p>
        <p>The tournament you joined, "<b>${tournamentName}</b>," has been cancelled because the host did not start it on time.</p>
        <p>We have processed a full refund of your entry fee. <b>${entryFee} credits</b> have been returned to your tournament wallet.</p>
        <p>We apologize for any inconvenience this may have caused.</p>
        <br/>
        <p>Regards,<br/>The Freefire Tournaments Team</p>
      </div>
    `,
  };
  return emailTransporter.sendMail(mailOptions);
};


// Cloud Function to automatically delete expired tournaments from Firestore
exports.cleanupExpiredTournaments = onSchedule("every 15 minutes", async (context) => {
  try {
    const now = new Date();
    logger.info(`Running tournament cleanup job at ${now.toISOString()}`);

    const expiredTournamentsQuery = db.collection('tournaments')
      .where('ttl', '<=', now)
      .limit(50); // Process in batches to avoid large memory usage

    const snapshot = await expiredTournamentsQuery.get();

    if (snapshot.empty) {
      logger.info("No expired tournaments to delete.");
      return { success: true, deletedCount: 0 };
    }

    logger.info(`Found ${snapshot.size} expired tournaments to delete.`);

    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      logger.info(`Deleting tournament ${doc.id} (TTL: ${doc.data().ttl.toDate().toISOString()})`);
      batch.delete(doc.ref);
    });

    await batch.commit();

    logger.info(`Successfully deleted ${snapshot.size} expired tournaments.`);
    
    return { success: true, deletedCount: snapshot.size };

  } catch (error) {
    logger.error("Error deleting expired tournaments:", error);
    throw error;
  }
});

// TODO: DEPLOYMENT CHECKLIST
// 1. New node version is 22 in package.json. If your firebase-tools is not updated, it will fail.
// firebase-tools should be on the latest version.
// 2. Set environment variables for the new function
// firebase functions:config:set host_approval_email.user="your-email@gmail.com" host_approval_email.password="your-app-password"
// 3. Deploy functions
// firebase deploy --only functions