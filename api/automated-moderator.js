import { db } from './firebase-admin-helper.js';

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

  console.log("Running Automated Tournament Moderator via API...");
  
  const now = new Date();
  const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

  try {
    const overdueTournamentsQuery = db.collection('tournaments')
      .where('status', '==', 'active')
      .where('start_date', '<=', tenMinutesAgo);

    const snapshot = await overdueTournamentsQuery.get();
    if (snapshot.empty) {
      return res.status(200).json({ success: true, message: "No overdue tournaments found." });
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
            // FIX: Add moderator_processed flag to prevent duplicate processing
            transaction.update(tournamentRef, { 
              status: 'pending_cancellation',
              moderator_processed: true,
              moderator_processed_at: now
            });
            flaggedForCancellation++;
          
          // Flag for penalty
          } else if (minutesPastStart > 10 && !tournament.host_penalized && !tournament.moderator_processed) {
            // FIX: Add moderator_processed flag to prevent duplicate processing
            transaction.update(tournamentRef, { 
              status: 'pending_penalty',
              moderator_processed: true,
              moderator_processed_at: now
            });
            flaggedForPenalty++;
          }
        });
      } catch (error) {
        console.error(`[Moderator API] Failed to flag tournament ${doc.id}:`, error.message);
      }
    }

    const message = `Moderator ran. Flagged for Cancellation: ${flaggedForCancellation}. Flagged for Penalty: ${flaggedForPenalty}.`;
    console.log(`[Moderator API] ${message}`);
    return res.status(200).json({ success: true, message });

  } catch (error) {
    console.error("[Moderator API] A critical error occurred:", error);
    return res.status(500).json({ success: false, error: 'An internal server error occurred.' });
  }
} 