import { db } from './firebase-admin-helper.js';
import { penalizeHost, refundEntryFee } from './credit-management.js';
import { 
  getUserEmail, 
  sendHostPenaltyEmail, 
  sendCancellationEmailToHost, 
  sendCancellationEmailToParticipant 
} from './notification-service.js';

const LOCK_ID = 'automated_moderator_lock';
const LOCK_TIMEOUT_MINUTES = 5;

export default async function handler(req, res) {
  // Optional: Add a secret to prevent unauthorized calls
  const { secret } = req.query;
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    console.warn("Unauthorized call to automated moderator API received.");
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const lockRef = db.collection('locks').doc(LOCK_ID);

  try {
    // --- Acquire Lock ---
    await db.runTransaction(async (transaction) => {
      const lockDoc = await transaction.get(lockRef);
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - LOCK_TIMEOUT_MINUTES * 60 * 1000);

      if (lockDoc.exists && lockDoc.data().timestamp.toDate() > fiveMinutesAgo) {
        // Lock is held by another process that started recently.
        throw new Error('Moderator process is already running.');
      }
      
      // Acquire the lock by setting a new timestamp.
      transaction.set(lockRef, { timestamp: now });
    });
  } catch (error) {
    if (error.message === 'Moderator process is already running.') {
      console.log('[Moderator API] Process is already running. Skipping execution.');
      return res.status(200).json({ success: true, message: 'Process already running. Skipped.' });
    }
    // Another error occurred during lock acquisition.
    console.error('[Moderator API] A critical error occurred acquiring the lock:', error);
    return res.status(500).json({ success: false, error: 'Failed to acquire process lock.' });
  }


  try {
    console.log("Running Automated Tournament Moderator via API...");
    const now = new Date();
    
    // We check for tournaments that were scheduled to start more than 10 minutes ago.
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

    const overdueTournamentsQuery = db.collection('tournaments')
      .where('status', '==', 'active')
      .where('start_date', '<=', tenMinutesAgo);

    const snapshot = await overdueTournamentsQuery.get();
    if (snapshot.empty) {
      console.log("[Moderator API] No overdue active tournaments found.");
      return res.status(200).json({ success: true, message: "No overdue tournaments found." });
    }

    console.log(`[Moderator API] Found ${snapshot.size} overdue tournament(s) to process.`);
    let processedCount = 0;
    let cancelledCount = 0;
    let penalizedCount = 0;

    for (const doc of snapshot.docs) {
      const tournament = { id: doc.id, ...doc.data() };
      const startDate = tournament.start_date.toDate();
      const minutesPastStart = (now.getTime() - startDate.getTime()) / (1000 * 60);

      const hasMinParticipants = tournament.filled_spots >= (tournament.min_participants || 1);
      if (!hasMinParticipants) {
        console.log(`[Moderator API] Tournament ${tournament.id} skipped: Not enough participants.`);
        continue;
      }

      processedCount++;

      // Cancellation Logic: Over 20 minutes late
      if (minutesPastStart > 20) {
        console.log(`[Moderator API] Cancelling tournament ${tournament.id} (over 20 mins late).`);
        try {
          const participants = tournament.participants || [];
          if (participants.length > 0) {
            const refundPromises = participants.map(p => refundEntryFee(p, tournament));
            await Promise.all(refundPromises);
            
            for (const p of participants) {
              const pEmail = await getUserEmail(p.authUid);
              if (pEmail) {
                await sendCancellationEmailToParticipant(pEmail, tournament.name, tournament.entry_fee);
              }
            }
          }
          
          const hostEmail = await getUserEmail(tournament.host_id);
          if (hostEmail) {
            await sendCancellationEmailToHost(hostEmail, tournament.name);
          }

          await doc.ref.update({ status: 'cancelled', cancellation_reason: 'Host did not start the tournament on time.' });
          cancelledCount++;
        } catch (error) {
          console.error(`[Moderator API] Failed to cancel tournament ${tournament.id}:`, error);
        }
      
      // Penalty Logic: Over 10 minutes late and not yet penalized
      } else if (minutesPastStart > 10 && !tournament.host_penalized) {
        console.log(`[Moderator API] Penalizing host for tournament ${tournament.id} (over 10 mins late).`);
        try {
          await penalizeHost(tournament.host_id, tournament);
          
          const hostEmail = await getUserEmail(tournament.host_id);
          if (hostEmail) {
            await sendHostPenaltyEmail(hostEmail, tournament.name);
          }
          
          await doc.ref.update({ host_penalized: true });
          penalizedCount++;
        } catch (error) {
          console.error(`[Moderator API] Failed to penalize host for tournament ${tournament.id}:`, error);
        }
      }
    }

    const message = `Processed ${processedCount} tournaments. Cancelled: ${cancelledCount}, Penalized: ${penalizedCount}.`;
    console.log(`[Moderator API] ${message}`);
    return res.status(200).json({ success: true, message });

  } catch (error) {
    console.error("[Moderator API] A critical error occurred:", error);
    return res.status(500).json({ success: false, error: 'An internal server error occurred.' });
  } finally {
    // --- Release Lock ---
    console.log('[Moderator API] Releasing process lock.');
    await lockRef.delete();
  }
} 