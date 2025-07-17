import { db } from './firebase-admin-helper.js';
import { 
  getUserEmail, 
  sendHostPenaltyEmail, 
  sendCancellationEmailToHost, 
  sendCancellationEmailToParticipant 
} from './notification-service.js';
import { _penalizeHostInTransaction, _refundEntryFeeInTransaction } from './credit-management.js';

// Automated moderator logic
const runModerator = async () => {
  console.log("Running Automated Tournament Moderator...");
  
  const now = new Date();
  const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

  const overdueTournamentsQuery = db.collection('tournaments')
    .where('status', '==', 'active')
    .where('start_date', '<=', tenMinutesAgo);

  const snapshot = await overdueTournamentsQuery.get();
  if (snapshot.empty) {
    return { flaggedForPenalty: 0, flaggedForCancellation: 0, message: "No overdue tournaments found." };
  }

  let flaggedForPenalty = 0;
  let flaggedForCancellation = 0;

  for (const doc of snapshot.docs) {
    const tournamentRef = doc.ref;
    
    try {
      await db.runTransaction(async (transaction) => {
        const freshDoc = await transaction.get(tournamentRef);
        if (!freshDoc.exists || freshDoc.data().status !== 'active') {
          return; 
        }

        const tournament = { id: freshDoc.id, ...freshDoc.data() };
        const startDate = tournament.start_date.toDate();
        const minutesPastStart = (now.getTime() - startDate.getTime()) / (1000 * 60);
        
        const hasMinParticipants = tournament.filled_spots >= (tournament.min_participants || 1);
        if (!hasMinParticipants) {
          return;
        }

        // Flag for cancellation
        if (minutesPastStart > 20 && !tournament.moderator_processed) {
          transaction.update(tournamentRef, { 
            status: 'pending_cancellation',
            moderator_processed: true,
            moderator_processed_at: now
          });
          flaggedForCancellation++;
        
        // Flag for penalty
        } else if (minutesPastStart > 10 && !tournament.host_penalized && !tournament.moderator_processed) {
          transaction.update(tournamentRef, { 
            status: 'pending_penalty',
            moderator_processed: true,
            moderator_processed_at: now
          });
          flaggedForPenalty++;
        }
      });
    } catch (error) {
      console.error(`[Moderator] Failed to flag tournament ${doc.id}:`, error.message);
    }
  }

  const message = `Moderator ran. Flagged for Cancellation: ${flaggedForCancellation}. Flagged for Penalty: ${flaggedForPenalty}.`;
  console.log(`[Moderator] ${message}`);
  return { flaggedForPenalty, flaggedForCancellation, message };
};

// Process notifications logic
const processNotifications = async () => {
  console.log("Running Notification Processor...");
  
  let processedPenalties = 0;
  let processedCancellations = 0;

  // --- Process Penalties ---
  const penaltyQuery = db.collection('tournaments').where('status', '==', 'pending_penalty');
  const penaltySnapshot = await penaltyQuery.get();
  
  for (const doc of penaltySnapshot.docs) {
    const tournament = { id: doc.id, ...doc.data() };
    
    // Skip if penalty notification already sent
    if (tournament.penalty_notification_sent) {
      console.log(`Penalty notification already sent for ${tournament.id}, skipping`);
      continue;
    }
    
    console.log(`Processing penalty for tournament: ${tournament.id}`);
    
    try {
      await db.runTransaction(async (transaction) => {
        await _penalizeHostInTransaction(transaction, tournament.host_id, tournament);
        transaction.update(doc.ref, { 
          status: 'penalty_applied',
          penalty_notification_sent: true,
          penalty_notification_sent_at: new Date()
        });
      });
      
      const hostEmail = await getUserEmail(tournament.host_id);
      if (hostEmail) {
        await sendHostPenaltyEmail(hostEmail, tournament.name);
        console.log(`✅ Penalty notification sent to host: ${hostEmail}`);
      }
      processedPenalties++;
    } catch (error) {
      console.error(`Failed to process penalty for ${tournament.id}:`, error.message);
    }
  }

  // --- Process Cancellations ---
  const cancelQuery = db.collection('tournaments').where('status', '==', 'pending_cancellation');
  const cancelSnapshot = await cancelQuery.get();

  for (const doc of cancelSnapshot.docs) {
    const tournament = { id: doc.id, ...doc.data() };
    
    // Skip if cancellation notification already sent
    if (tournament.cancellation_notification_sent) {
      console.log(`Cancellation notification already sent for ${tournament.id}, skipping`);
      continue;
    }
    
    console.log(`Processing cancellation for tournament: ${tournament.id}`);

    try {
      await db.runTransaction(async (transaction) => {
        for (const p of (tournament.participants || [])) {
          await _refundEntryFeeInTransaction(transaction, p, tournament);
        }
        transaction.update(doc.ref, { 
          status: 'cancelled', 
          cancellation_reason: 'Host did not start the tournament on time.',
          cancellation_notification_sent: true,
          cancellation_notification_sent_at: new Date()
        });
      });

      const hostEmail = await getUserEmail(tournament.host_id);
      if (hostEmail) {
        await sendCancellationEmailToHost(hostEmail, tournament.name);
        console.log(`✅ Cancellation notification sent to host: ${hostEmail}`);
      }

      for (const p of (tournament.participants || [])) {
        const pEmail = await getUserEmail(p.authUid);
        if (pEmail) {
          await sendCancellationEmailToParticipant(pEmail, tournament.name, tournament.entry_fee);
          console.log(`✅ Cancellation notification sent to participant: ${pEmail}`);
        }
      }
      processedCancellations++;
    } catch (error) {
      console.error(`Failed to process cancellation for ${tournament.id}:`, error.message);
    }
  }

  const message = `Notification processor ran. Penalties Sent: ${processedPenalties}. Cancellations Sent: ${processedCancellations}.`;
  console.log(message);
  return { processedPenalties, processedCancellations, message };
};

// Combined handler
export default async function handler(req, res) {
  // Allow both GET and POST methods for cron job compatibility
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  // Get parameters
  const secret = req.method === 'GET' ? req.query.secret : req.body.secret;
  const action = req.method === 'GET' ? req.query.action : req.body.action;
  
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  try {
    // Route based on action parameter
    if (action === 'moderate' || (!action && req.url.includes('moderate'))) {
      // Run moderator only
      const result = await runModerator();
      return res.status(200).json({ success: true, ...result });
      
    } else if (action === 'notify' || (!action && req.url.includes('notify'))) {
      // Run notification processor only
      const result = await processNotifications();
      return res.status(200).json({ success: true, ...result });
      
    } else {
      // Run both by default (for backwards compatibility)
      console.log("Running combined moderation and notification processing...");
      
      const moderatorResult = await runModerator();
      console.log("Moderator completed, now processing notifications...");
      
      const notificationResult = await processNotifications();
      
      const combinedMessage = `${moderatorResult.message} ${notificationResult.message}`;
      
      return res.status(200).json({ 
        success: true, 
        message: combinedMessage,
        moderator: moderatorResult,
        notifications: notificationResult
      });
    }

  } catch (error) {
    console.error("A critical error occurred:", error);
    return res.status(500).json({ success: false, error: 'An internal server error occurred.' });
  }
}
