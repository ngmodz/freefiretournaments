import { 
  doc, 
  getDoc, 
  updateDoc, 
  Timestamp, 
  runTransaction, 
  arrayUnion 
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Service for handling tournament prize distribution
 */
export class PrizeDistributionService {
  /**
   * Distribute prize to tournament winner
   */
  static async distributePrize(
    winnerUid: string,
    prizeCredits: number,
    position: 'first' | 'second' | 'third',
    tournamentId: string,
    tournamentName: string,
    hostUid: string
  ): Promise<boolean> {
    const winnerRef = doc(db, 'users', winnerUid);
    const tournamentRef = doc(db, 'tournaments', tournamentId);
    const transactionRef = doc(db, 'creditTransactions', `prize_${tournamentId}_${position}`);

    try {
      // Run as a transaction to ensure data consistency
      await runTransaction(db, async (transaction) => {
        // Get current user data
        const winnerDoc = await transaction.get(winnerRef);
        if (!winnerDoc.exists()) {
          throw new Error(`User ${winnerUid} not found`);
        }

        // Get tournament data
        const tournamentDoc = await transaction.get(tournamentRef);
        if (!tournamentDoc.exists()) {
          throw new Error(`Tournament ${tournamentId} not found`);
        }

        const userData = winnerDoc.data();
        const tournamentData = tournamentDoc.data();

        // CRITICAL: Check if tournament has sufficient currentPrizePool
        const currentPrizePool = tournamentData.currentPrizePool || 0;
        if (currentPrizePool < prizeCredits) {
          throw new Error(`Insufficient prize pool. Available: ${currentPrizePool}, Required: ${prizeCredits}`);
        }

        // Get current wallet or initialize if not exists
        const wallet = userData.wallet || {
          tournamentCredits: 0,
          hostCredits: 0,
          earnings: 0,
          totalPurchasedTournamentCredits: 0,
          totalPurchasedHostCredits: 0,
          firstPurchaseCompleted: false
        };

        // Calculate new earnings balance
        const currentEarnings = wallet.earnings || 0;
        const newEarnings = currentEarnings + prizeCredits;

        // Calculate new currentPrizePool after deducting prize
        const newCurrentPrizePool = currentPrizePool - prizeCredits;

        // Create transaction record
        const transactionData = {
          userId: winnerUid,
          type: 'tournament_win',
          amount: prizeCredits,
          balanceBefore: currentEarnings,
          balanceAfter: newEarnings,
          walletType: 'earnings',
          description: `Won ${prizeCredits} credits - ${position} place in ${tournamentName}`,
          transactionDetails: {
            tournamentId,
            tournamentName,
            position,
            hostUid,
            prizePoolBefore: currentPrizePool,
            prizePoolAfter: newCurrentPrizePool
          },
          createdAt: Timestamp.now()
        };

        // Update user wallet
        transaction.update(winnerRef, {
          'wallet.earnings': newEarnings
        });

        // Record the transaction
        transaction.set(transactionRef, transactionData);

        // Update tournament winners AND deduct from currentPrizePool
        const winnerData = {
          uid: winnerUid,
          prizeCredits,
          distributedAt: Timestamp.now()
        };

        // CRITICAL: Update tournament with winner information AND deduct from currentPrizePool
        transaction.update(tournamentRef, {
          [`winners.${position}`]: winnerData,
          [`prizePool.winners.${position}`]: winnerData,
          currentPrizePool: newCurrentPrizePool // Deduct prize from pool
        });
      });

      console.log(`Successfully distributed ${prizeCredits} credits to ${position} place winner ${winnerUid}`);
      return true;
    } catch (error) {
      console.error('Error distributing prize:', error);
      return false;
    }
  }

  /**
   * Distribute all prizes for a tournament
   */
  static async distributeAllPrizes(
    tournamentId: string,
    winners: {
      first?: { uid: string; username: string };
      second?: { uid: string; username: string };
      third?: { uid: string; username: string };
    },
    hostUid: string
  ): Promise<{ success: boolean; errors: string[] }> {
    const tournamentRef = doc(db, 'tournaments', tournamentId);
    const errors: string[] = [];

    try {
      const tournamentDoc = await getDoc(tournamentRef);
      if (!tournamentDoc.exists()) {
        throw new Error('Tournament not found');
      }

      const tournamentData = tournamentDoc.data();
      const prizePool = tournamentData.prizePool;
      const tournamentName = tournamentData.name;

      if (!prizePool || prizePool.isDistributed) {
        throw new Error('Prize pool not configured or already distributed');
      }

      // Validate no duplicate UID+username combinations to prevent abuse
      const winnerEntries = Object.entries(winners).filter(([_, winner]) => winner);
      const winnerCombinations = winnerEntries.map(([_, winner]) => `${winner!.uid}-${winner!.username}`);
      
      if (winnerCombinations.length !== new Set(winnerCombinations).size) {
        throw new Error('The same UID and username combination cannot be used for multiple positions');
      }

      // Validate no duplicate UIDs 
      const winnerUids = winnerEntries.map(([_, winner]) => winner!.uid);
      if (winnerUids.length !== new Set(winnerUids).size) {
        throw new Error('A player cannot win multiple positions');
      }

      // Distribute prizes for each position
      const positions: Array<'first' | 'second' | 'third'> = ['first', 'second', 'third'];

      for (const position of positions) {
        const winner = winners[position];
        const prizeCredits = prizePool.prizeDistribution[position];

        if (winner && prizeCredits > 0) {
          const success = await this.distributePrize(
            winner.uid,
            prizeCredits,
            position,
            tournamentId,
            tournamentName,
            hostUid
          );

          if (!success) {
            errors.push(`Failed to distribute prize to ${position} place winner`);
          }
        }
      }

      // Mark tournament as prize distributed
      await updateDoc(tournamentRef, {
        'prizePool.isDistributed': true,
        'prizePool.distributedAt': Timestamp.now(),
        'prizePool.distributedBy': hostUid
      });

      return { success: errors.length === 0, errors };
    } catch (error) {
      console.error('Error distributing all prizes:', error);
      return { success: false, errors: [error instanceof Error ? error.message : 'Unknown error'] };
    }
  }

  /**
   * Calculate prize distribution based on total prize pool
   */
  static calculatePrizeDistribution(
    totalPrizeCredits: number,
    distributionPercentage: { first: number; second: number; third: number }
  ): { first: number; second: number; third: number } {
    return {
      first: Math.floor(totalPrizeCredits * (distributionPercentage.first / 100)),
      second: Math.floor(totalPrizeCredits * (distributionPercentage.second / 100)),
      third: Math.floor(totalPrizeCredits * (distributionPercentage.third / 100))
    };
  }

  /**
   * Validate prize distribution
   */
  static validatePrizeDistribution(
    totalPrizeCredits: number,
    distribution: { first: number; second: number; third: number }
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const totalDistribution = distribution.first + distribution.second + distribution.third;

    if (totalDistribution > totalPrizeCredits) {
      errors.push('Total prize distribution exceeds available prize pool');
    }

    if (distribution.first < 0 || distribution.second < 0 || distribution.third < 0) {
      errors.push('Prize amounts cannot be negative');
    }

    if (distribution.first < distribution.second || distribution.second < distribution.third) {
      errors.push('Prize amounts should be in descending order (1st > 2nd > 3rd)');
    }

    return { isValid: errors.length === 0, errors };
  }
} 