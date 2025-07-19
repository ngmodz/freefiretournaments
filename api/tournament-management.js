import { db, auth } from './firebase-admin-helper.js';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import nodemailer from 'nodemailer';
import { getEmailConfig, getFirebaseConfig } from './firebase-config-helper.js';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { sendTournamentWinningsEmail } from './notification-service.js';

// --- Firebase initialization for notification checking ---
const firebaseConfig = getFirebaseConfig();
const app = initializeApp(firebaseConfig);
const notificationDb = getFirestore(app);
// ---

// Email configuration
const emailConfig = getEmailConfig();
const emailUser = emailConfig.user;
const emailPass = emailConfig.pass;

const createTransporter = () => {
  if (!emailUser || !emailPass) {
    console.error('Email configuration missing. Cannot create transporter.');
    return null;
  }
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: { user: emailUser, pass: emailPass },
    tls: { rejectUnauthorized: false }
  });
};

// Authentication helper
async function getAuthenticatedUser(req) {
  const { authorization } = req.headers;
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return null;
  }
  const token = authorization.split('Bearer ')[1];
  try {
    return await auth.verifyIdToken(token);
  } catch (error) {
    console.error('Error verifying auth token:', error);
    return null;
  }
}

// Helper function to send emails
async function sendEmail(mailOptions) {
  const transporter = createTransporter();
  if (!transporter) throw new Error('Failed to create email transporter.');
  
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`❌ Error sending email:`, error);
    throw error;
  }
}

// ==================== CANCEL TOURNAMENT FUNCTIONALITY ====================
async function cancelTournament(req, res) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const { tournamentId } = req.body;
  if (!tournamentId) {
    return res.status(400).json({ success: false, error: 'Tournament ID is required' });
  }

  try {
    console.log(`🚫 Attempting to cancel tournament: ${tournamentId} by user: ${user.uid}`);
    
    const tournamentRef = db.collection('tournaments').doc(tournamentId);

    const result = await db.runTransaction(async (transaction) => {
      const tournamentDoc = await transaction.get(tournamentRef);
      if (!tournamentDoc.exists) {
        throw new Error('Tournament not found');
      }

      const tournament = tournamentDoc.data();
      
      console.log(`📊 Tournament status: ${tournament.status}, host: ${tournament.host_id}`);

      if (tournament.host_id !== user.uid) {
        throw new Error('Only the tournament host can cancel the tournament');
      }

      // Allow cancellation for upcoming, active, and ongoing tournaments
      if (!['upcoming', 'active', 'ongoing'].includes(tournament.status)) {
        throw new Error(`Tournament cannot be cancelled. Current status: ${tournament.status}`);
      }
      
      if (tournament.entry_fee <= 0) {
        // No entry fee, so no refunds needed. Just cancel the tournament.
        const cancellationTime = Timestamp.now();
        const ttl = new Timestamp(cancellationTime.seconds + 15 * 60, cancellationTime.nanoseconds); // 15 minutes from now

        console.log(`⏰ Setting TTL for cancelled tournament (no entry fee) to: ${new Date(ttl.seconds * 1000).toISOString()}`);

        transaction.update(tournamentRef, { 
          status: 'cancelled',
          cancelled_at: cancellationTime,
          ttl: ttl,
        });
        return { success: true, message: 'Tournament cancelled successfully. No refunds were needed.' };
      }

      const participants = tournament.participants || [];
      if (participants.length === 0) {
        // No participants, just cancel.
        const cancellationTime = Timestamp.now();
        const ttl = new Timestamp(cancellationTime.seconds + 15 * 60, cancellationTime.nanoseconds); // 15 minutes from now

        console.log(`⏰ Setting TTL for cancelled tournament (no participants) to: ${new Date(ttl.seconds * 1000).toISOString()}`);

        transaction.update(tournamentRef, { 
          status: 'cancelled',
          cancelled_at: cancellationTime,
          ttl: ttl,
        });
        return { success: true, message: 'Tournament cancelled successfully. No participants to refund.' };
      }

      const entryFee = tournament.entry_fee;

      for (const participant of participants) {
        const participantId = typeof participant === 'string' ? participant : participant.authUid;
        if (!participantId) continue;
        
        const userRef = db.collection('users').doc(participantId);
        const userDoc = await transaction.get(userRef);
        
        if (!userDoc.exists) {
          console.warn(`User ${participantId} not found, cannot refund.`);
          continue;
        }

        const userData = userDoc.data();
        const currentCredits = userData.credits || 0;

        console.log(`💰 Refunding ${entryFee} credits to user ${participantId} (current: ${currentCredits})`);
        
        // Update user's credits
        transaction.update(userRef, {
          credits: currentCredits + entryFee
        });

        // Add transaction record
        transaction.create(db.collection('transactions').doc(), {
          uid: participantId,
          amount: entryFee,
          type: 'refund',
          description: `Refund for cancelled tournament: ${tournament.name}`,
          status: 'completed',
          metadata: {
            tournamentId: tournamentId,
            tournamentName: tournament.name
          },
          createdAt: FieldValue.serverTimestamp()
        });
      }

      const cancellationTime = Timestamp.now();
      const ttl = new Timestamp(cancellationTime.seconds + 15 * 60, cancellationTime.nanoseconds); // 15 minutes from now

      console.log(`⏰ Setting TTL for cancelled tournament to: ${new Date(ttl.seconds * 1000).toISOString()}`);

      transaction.update(tournamentRef, { 
        status: 'cancelled',
        cancelled_at: cancellationTime,
        ttl: ttl,
      });
      
      return { success: true, message: `Tournament cancelled and ${participants.length} participants refunded. It will be deleted in 15 minutes.` };
    });

    console.log(`✅ Tournament cancellation successful:`, result);
    return res.status(200).json(result);

  } catch (error) {
    console.error('❌ Error cancelling tournament:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to cancel tournament' 
    });
  }
}

// ==================== CHECK MINIMUM PARTICIPANTS FUNCTIONALITY ====================
async function checkMinimumParticipants(req, res) {
  try {
    console.log('🔍 Checking tournaments for minimum participants...');
    
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    
    // Query for tournaments that are scheduled to start within the last 5 minutes
    // and are still active (not started yet)
    const tournamentsSnapshot = await db.collection('tournaments')
      .where('status', '==', 'active')
      .where('start_date', '>=', fiveMinutesAgo)
      .where('start_date', '<=', now)
      .get();

    if (tournamentsSnapshot.empty) {
      console.log('No tournaments found that need minimum participant check');
      return res.status(200).json({ 
        success: true, 
        message: 'No tournaments to check',
        checkedCount: 0 
      });
    }

    let cancelledCount = 0;
    let checkedCount = 0;

    for (const tournamentDoc of tournamentsSnapshot.docs) {
      const tournament = tournamentDoc.data();
      const tournamentId = tournamentDoc.id;
      checkedCount++;

      console.log(`\n📊 Checking tournament: ${tournament.name} (${tournamentId})`);
      console.log(`Participants: ${tournament.filled_spots || 0}/${tournament.min_participants} (min required)`);
      console.log(`Max players: ${tournament.max_players}`);

      // Check if tournament has enough participants
      if ((tournament.filled_spots || 0) >= tournament.min_participants) {
        console.log(`✅ Tournament has sufficient participants (${tournament.filled_spots}/${tournament.min_participants})`);
        continue;
      }

      console.log(`❌ Tournament does not have minimum participants. Cancelling and refunding...`);

      // Cancel tournament and refund participants
      try {
        await db.runTransaction(async (transaction) => {
          const tournamentRef = db.collection('tournaments').doc(tournamentId);
          const tournamentDoc = await transaction.get(tournamentRef);
          
          if (!tournamentDoc.exists) {
            console.log(`Tournament ${tournamentId} no longer exists`);
            return;
          }

          const tournamentData = tournamentDoc.data();
          const participants = tournamentData.participants || [];
          
          // Refund all participants
          for (const participant of participants) {
            const participantId = typeof participant === 'string' ? participant : participant.authUid;
            if (!participantId) continue;
            
            const userRef = db.collection('users').doc(participantId);
            const userDoc = await transaction.get(userRef);
            
            if (!userDoc.exists) {
              console.warn(`User ${participantId} not found, cannot refund.`);
              continue;
            }

            const userData = userDoc.data();
            const currentCredits = userData.credits || 0;
            const refundAmount = tournamentData.entry_fee || 0;

            if (refundAmount > 0) {
              console.log(`💰 Refunding ${refundAmount} credits to user ${participantId}`);
              
              // Update user's credits
              transaction.update(userRef, {
                credits: currentCredits + refundAmount
              });

              // Add transaction record
              transaction.create(db.collection('transactions').doc(), {
                uid: participantId,
                amount: refundAmount,
                type: 'refund',
                description: `Refund for cancelled tournament: ${tournamentData.name} (insufficient participants)`,
                status: 'completed',
                metadata: {
                  tournamentId: tournamentId,
                  tournamentName: tournamentData.name,
                  reason: 'insufficient_participants'
                },
                createdAt: FieldValue.serverTimestamp()
              });
            }
          }

          // Update tournament status to cancelled with TTL
          const cancellationTime = Timestamp.now();
          const ttl = new Timestamp(cancellationTime.seconds + 15 * 60, cancellationTime.nanoseconds); // 15 minutes from now

          transaction.update(tournamentRef, {
            status: 'cancelled',
            cancelled_at: cancellationTime,
            cancellation_reason: 'insufficient_participants',
            ttl: ttl,
          });

          console.log(`🚫 Tournament ${tournamentId} cancelled due to insufficient participants`);
        });

        // Send notification emails to host and participants
        await sendCancellationNotifications(tournament, tournamentId);
        
        cancelledCount++;

      } catch (error) {
        console.error(`❌ Error cancelling tournament ${tournamentId}:`, error);
      }
    }

    console.log(`\n✅ Minimum participants check completed. Checked: ${checkedCount}, Cancelled: ${cancelledCount}`);
    
    return res.status(200).json({
      success: true,
      message: `Checked ${checkedCount} tournaments, cancelled ${cancelledCount} due to insufficient participants`,
      checkedCount,
      cancelledCount
    });

  } catch (error) {
    console.error('❌ Error checking minimum participants:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      details: error.message 
    });
  }
}

async function sendCancellationNotifications(tournament, tournamentId) {
  try {
    // Get host email
    const hostDoc = await db.collection('users').doc(tournament.host_id).get();
    const hostData = hostDoc.data();
    const hostEmail = hostData?.email;

    // Get participant emails
    const participantEmails = [];
    for (const participant of tournament.participants || []) {
      const participantId = typeof participant === 'string' ? participant : participant.authUid;
      if (!participantId) continue;
      
      try {
        const userDoc = await db.collection('users').doc(participantId).get();
        const userData = userDoc.data();
        if (userData?.email) {
          participantEmails.push(userData.email);
        }
      } catch (error) {
        console.error(`Error getting participant ${participantId} email:`, error);
      }
    }

    // Send email to host
    if (hostEmail) {
      const hostMailOptions = {
        from: `"Freefire Tournaments" <${emailUser}>`,
        to: hostEmail,
        subject: `Tournament Cancelled: ${tournament.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2 style="color: #dc3545;">Tournament Cancelled Due to Insufficient Participants</h2>
            
            <p>Dear Tournament Host,</p>
            
            <p>Your tournament <strong>"${tournament.name}"</strong> has been automatically cancelled because it did not reach the minimum number of participants required to start.</p>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #dc3545;">Tournament Details:</h3>
              <ul>
                <li><strong>Tournament:</strong> ${tournament.name}</li>
                <li><strong>Minimum Required:</strong> ${tournament.min_participants} participants</li>
                <li><strong>Actual Participants:</strong> ${tournament.filled_spots || 0}</li>
                <li><strong>Scheduled Start:</strong> ${new Date(tournament.start_date).toLocaleString()}</li>
              </ul>
            </div>
            
            <p>All participants have been automatically refunded their entry fees.</p>
            
            <p>You can create a new tournament anytime from your dashboard.</p>
            
            <p>Best regards,<br>Freefire Tournaments Team</p>
          </div>
        `
      };

      await sendEmail(hostMailOptions);
      console.log(`📧 Cancellation notification sent to host: ${hostEmail}`);
    }

    // Send email to participants
    if (participantEmails.length > 0) {
      const participantMailOptions = {
        from: `"Freefire Tournaments" <${emailUser}>`,
        to: emailUser,
        bcc: participantEmails,
        subject: `Tournament Cancelled: ${tournament.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2 style="color: #dc3545;">Tournament Cancelled</h2>
            
            <p>Dear Participant,</p>
            
            <p>The tournament <strong>"${tournament.name}"</strong> you joined has been cancelled because it did not reach the minimum number of participants required to start.</p>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #dc3545;">Tournament Details:</h3>
              <ul>
                <li><strong>Tournament:</strong> ${tournament.name}</li>
                <li><strong>Minimum Required:</strong> ${tournament.min_participants} participants</li>
                <li><strong>Actual Participants:</strong> ${tournament.filled_spots || 0}</li>
                <li><strong>Your Entry Fee:</strong> ${tournament.entry_fee || 0} credits</li>
              </ul>
            </div>
            
            <p><strong>Good news!</strong> Your entry fee of ${tournament.entry_fee || 0} credits has been automatically refunded to your account.</p>
            
            <p>You can check your updated balance and join other tournaments from your dashboard.</p>
            
            <p>Best regards,<br>Freefire Tournaments Team</p>
          </div>
        `
      };

      await sendEmail(participantMailOptions);
      console.log(`📧 Cancellation notification sent to ${participantEmails.length} participants`);
    }

  } catch (error) {
    console.error('❌ Error sending cancellation notifications:', error);
  }
}

// ==================== TOURNAMENT NOTIFICATION CHECK FUNCTIONALITY ====================
async function checkTournamentNotifications(req, res) {
  try {
    console.log('🔔 Checking for tournaments that need notifications...');
    
    const now = new Date();
    const twentyOneMinutesFromNow = new Date(now.getTime() + 21 * 60 * 1000);
    const nineteenMinutesFromNow = new Date(now.getTime() + 19 * 60 * 1000);

    const startTomorrowQuery = query(
      collection(notificationDb, 'tournaments'),
      where('status', '==', 'active'),
      where('start_date', '>=', nineteenMinutesFromNow),
      where('start_date', '<=', twentyOneMinutesFromNow)
    );

    const upcomingTournamentsSnapshot = await getDocs(startTomorrowQuery);

    if (upcomingTournamentsSnapshot.empty) {
      console.log('No tournaments found that need notifications');
      return res.status(200).json({ 
        success: true, 
        message: 'No tournaments need notifications at this time',
        processed: 0 
      });
    }

    console.log(`Found ${upcomingTournamentsSnapshot.size} tournaments that need notifications`);

    let processedCount = 0;
    let emailsSent = 0;

    for (const tournamentDoc of upcomingTournamentsSnapshot.docs) {
      const tournament = tournamentDoc.data();
      const tournamentId = tournamentDoc.id;

      console.log(`\n📋 Processing tournament: ${tournament.name} (${tournamentId})`);

      processedCount++;

      if (tournament.notificationSent) {
        console.log(`⏭️ Notification already sent for tournament ${tournamentId}, skipping`);
        continue;
      }

      if (!tournament.host_id) {
        console.log(`⚠️ Tournament ${tournamentId} has no host_id, skipping notification`);
        continue;
      }

      try {
        const result = await processTournament(tournamentDoc);
        if (result.success && result.emailSent) {
          emailsSent++;
        }
      } catch (error) {
        console.error(`❌ Error processing tournament ${tournamentId}:`, error);
      }
    }

    console.log(`\n✅ Notification check completed. Processed: ${processedCount}, Emails sent: ${emailsSent}`);

    return res.status(200).json({
      success: true,
      message: `Processed ${processedCount} tournaments, sent ${emailsSent} notifications`,
      processed: processedCount,
      emailsSent: emailsSent
    });

  } catch (error) {
    console.error('❌ Error in tournament notification check:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      details: error.message 
    });
  }
}

// This function processes a tournament without using transactions
async function processTournament(tournamentDoc) {
  const tournament = tournamentDoc.data();
  const tournamentId = tournamentDoc.id;

  if (global.processedTournaments && global.processedTournaments.includes(tournamentId)) {
    console.log(`[${tournamentId}] Already processed in this run, skipping.`);
    return { success: false, emailSent: false, tournamentId, error: 'Already processed' };
  }

  // FIX: Check if notification was already sent to prevent duplicate emails
  if (tournament.notificationSent) {
    console.log(`[${tournamentId}] Notification already sent, skipping.`);
    return { success: false, emailSent: false, tournamentId, error: 'Notification already sent' };
  }

  if (!global.processedTournaments) {
    global.processedTournaments = [];
  }
  global.processedTournaments.push(tournamentId);

  // Get host email
  const hostDoc = await getDoc(doc(notificationDb, 'users', tournament.host_id));
  const hostEmail = hostDoc.data()?.email;
  const hostData = hostDoc.data();

  if (!hostEmail) {
    console.error(`[${tournamentId}] Host user ${tournament.host_id} email not found.`);
    return { success: false, emailSent: false, tournamentId, error: 'Host email not found' };
  }
  
  // Format time in IST for email
  const startDate = tournament.start_date instanceof Date ? tournament.start_date : tournament.start_date.toDate();
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
    from: `"Freefire Tournaments" <${emailUser}>`,
    to: hostEmail,
    subject: `🏆 Reminder: Your Tournament "${tournament.name}" Starts Soon!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #6200EA;">Tournament Starting Soon!</h1>
        </div>
        
        <p>Hello ${hostData.displayName || 'Tournament Host'},</p>
        
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

  // Send the email and update the notification status
  try {
    console.log(`Sending email...`);
    const info = await sendEmail(mailOptions);
    console.log(`[${tournamentId}] Successfully sent email notification to ${hostEmail}`);
    
    // FIX: Update the tournament document to mark notification as sent with timestamp
    await tournamentDoc.ref.update({
      notificationSent: true,
      notificationSentAt: new Date()
    });
    
    console.log(`[${tournamentId}] Marked tournament as notified`);
    return { success: true, emailSent: true, tournamentId, messageId: info.messageId };
  } catch (error) {
    console.error(`[${tournamentId}] Error sending email to ${hostEmail}:`, error);
    return { success: false, emailSent: false, tournamentId, error: error.message };
  }
}

// ==================== PRIZE DISTRIBUTION FUNCTIONALITY ====================
async function distributePrize(req, res) {
  const hostUser = await getAuthenticatedUser(req);
  if (!hostUser) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const { tournamentId, winnerId, prizeAmount } = req.body;

  if (!tournamentId || !winnerId || !prizeAmount || prizeAmount <= 0) {
    return res.status(400).json({ success: false, error: 'Missing required fields: tournamentId, winnerId, and prizeAmount.' });
  }

  const tournamentRef = db.collection('tournaments').doc(tournamentId);
  const winnerRef = db.collection('users').doc(winnerId);

  try {
    const result = await db.runTransaction(async (transaction) => {
      const tournamentDoc = await transaction.get(tournamentRef);
      const winnerDoc = await transaction.get(winnerRef);

      if (!tournamentDoc.exists) throw new Error('Tournament not found.');
      if (!winnerDoc.exists) throw new Error('Winner not found.');

      const tournament = tournamentDoc.data();
      const winner = winnerDoc.data();

      if (tournament.host_id !== hostUser.uid) {
        throw new Error('Only the tournament host can distribute prizes.');
      }

      // VALIDATION: Check if tournament has sufficient prize pool
      const currentPrizePool = tournament.currentPrizePool || 0;
      if (currentPrizePool < prizeAmount) {
        throw new Error(`Insufficient prize pool. Available: ${currentPrizePool}, Required: ${prizeAmount}`);
      }

      // VALIDATION: Verify prizeAmount matches the expected calculation based on prize distribution
      const position = Object.entries(tournament.winners || {}).find(
        ([_, w]) => w?.authUid === winnerId || w?.uid === winnerId
      )?.[0];
      
      if (position && tournament.prize_distribution) {
        const percentage = tournament.prize_distribution[position] || 0;
        // If prize distribution is percentage-based (sum = 100)
        const values = Object.values(tournament.prize_distribution);
        const sum = values.reduce((a, b) => a + b, 0);
        
        if (sum === 100) {
          const expectedAmount = Math.floor((percentage / 100) * currentPrizePool);
          // Allow small rounding differences (1 credit)
          if (Math.abs(expectedAmount - prizeAmount) > 1) {
            throw new Error(`Invalid prize amount. Expected: ${expectedAmount}, Received: ${prizeAmount}`);
          }
        }
      }

      const winnerCurrentCredits = winner.wallet?.tournamentCredits || 0;
      const winnerNewCredits = winnerCurrentCredits + prizeAmount;
      transaction.update(winnerRef, { 'wallet.tournamentCredits': winnerNewCredits });

      // Update the tournament's currentPrizePool by deducting the prize amount
      transaction.update(tournamentRef, {
        currentPrizePool: currentPrizePool - prizeAmount
      });

      const transactionRef = db.collection('creditTransactions').doc();
      transaction.set(transactionRef, {
        userId: winnerId,
        type: 'tournament_win',
        amount: prizeAmount,
        balanceBefore: winnerCurrentCredits,
        balanceAfter: winnerNewCredits,
        walletType: 'tournamentCredits',
        description: `Prize for winning: ${tournament.name}`,
        transactionDetails: { 
          tournamentId, 
          tournamentName: tournament.name,
          prizePoolBefore: currentPrizePool,
          prizePoolAfter: currentPrizePool - prizeAmount
        },
        createdAt: FieldValue.serverTimestamp(),
      });

      return { tournamentName: tournament.name, winnerEmail: winner.email };
    });

    if (result.winnerEmail) {
      await sendTournamentWinningsEmail(result.winnerEmail, result.tournamentName, prizeAmount);
    }

    return res.status(200).json({ success: true, message: `Successfully distributed ${prizeAmount} credits to the winner.` });
  } catch (error) {
    console.error('Error in prize distribution:', error);
    return res.status(500).json({ success: false, error: error.message || 'An internal server error occurred.' });
  }
}

// ==================== MAIN HANDLER ====================
export default async function handler(req, res) {
  // FIX: Allow both GET and POST methods for cron job compatibility
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Route based on action parameter (support both query and body)
    const action = req.method === 'GET' ? req.query.action : req.body.action;

    switch (action) {
      case 'cancel-tournament':
        return await cancelTournament(req, res);
      
      case 'check-minimum-participants':
        return await checkMinimumParticipants(req, res);
      
      case 'checkNotifications':
      case 'check-notifications':
        return await checkTournamentNotifications(req, res);
      
      case 'distribute-prize':
        return await distributePrize(req, res);
        
      default:
        // Default to notification check for backward compatibility
        return await checkTournamentNotifications(req, res);
    }

  } catch (error) {
    console.error('❌ Error in tournament management handler:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
