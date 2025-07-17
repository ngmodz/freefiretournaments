import { db } from './firebase-admin-helper.js';
import { 
  getUserEmail, 
  sendHostPenaltyEmail, 
  sendCancellationEmailToHost, 
  sendCancellationEmailToParticipant 
} from './notification-service.js';
import { _penalizeHostInTransaction, _refundEntryFeeInTransaction } from './credit-management.js';

export default async function handler(req, res) {
  // FIX: Allow both GET and POST methods for cron job compatibility
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  // Get secret from query params (for GET) or body (for POST)
  const secret = req.method === 'GET' ? req.query.secret : req.body.secret;
  
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  console.log("Running Notification Processor via API...");
  
  let processedPenalties = 0;
  let processedCancellations = 0;

  try {
    // --- Process Penalties ---
    const penaltyQuery = db.collection('tournaments').where('status', '==', 'pending_penalty');
    const penaltySnapshot = await penaltyQuery.get();
    
    for (const doc of penaltySnapshot.docs) {
      const tournament = { id: doc.id, ...doc.data() };
      
      // FIX: Skip if penalty notification already sent
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
      
      // FIX: Skip if cancellation notification already sent
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
    return res.status(200).json({ success: true, message });

  } catch (error) {
    console.error("A critical error occurred in the notification processor:", error);
    return res.status(500).json({ success: false, error: 'An internal server error occurred.' });
  }
}