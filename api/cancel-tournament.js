import { db, auth } from './firebase-admin-helper.js';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

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
        const currentCredits = userData.wallet?.tournamentCredits || 0;
        const newCredits = currentCredits + entryFee;

        transaction.update(userRef, { 'wallet.tournamentCredits': newCredits });

        const transactionRef = db.collection('creditTransactions').doc();
        transaction.set(transactionRef, {
          userId: participantId,
          type: 'tournament_cancellation_refund',
          amount: entryFee,
          balanceBefore: currentCredits,
          balanceAfter: newCredits,
          walletType: 'tournamentCredits',
          description: `Refund for cancelled tournament: ${tournament.name}`,
          transactionDetails: {
            tournamentId: tournamentDoc.id,
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
    console.error('Error stack:', error.stack);
    
    // Ensure we always return valid JSON
    const errorMessage = error.message || 'An unexpected error occurred';
    return res.status(500).json({ 
      success: false, 
      error: errorMessage,
      details: error.toString()
    });
  }
} 