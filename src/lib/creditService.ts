import { 
  doc, 
  getDoc, 
  updateDoc, 
  collection, 
  addDoc, 
  Timestamp, 
  runTransaction,
  increment
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface CreditTransaction {
  id?: string;
  userId: string;
  type: 'host_credit_purchase' | 'tournament_credit_purchase' | 'tournament_join' | 'tournament_win' | 'referral_bonus' | 'tournament_credit_conversion' | 'withdrawal';
  amount: number;
  value?: number;
  balanceBefore: number;
  balanceAfter: number;
  walletType: 'tournamentCredits' | 'hostCredits' | 'earnings';
  description: string;
  transactionDetails?: {
    packageId?: string;
    packageName?: string;
    paymentId?: string;
    orderId?: string;
    tournamentId?: string;
    tournamentName?: string;
    conversionRate?: number;
    earningsAmount?: number;
    creditsAmount?: number;
    withdrawalId?: string;
    upiId?: string;
    status?: string;
  };
  createdAt: Timestamp;
}

export class CreditService {
  /**
   * Initialize user wallet with default values
   */
  static async initializeUserWallet(userId: string): Promise<void> {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    const userData = userDoc.data();
    if (!userData.wallet) {
      await updateDoc(userRef, {
        wallet: {
          tournamentCredits: 0,
          hostCredits: 0,
          earnings: 0,
          totalPurchasedTournamentCredits: 0,
          totalPurchasedHostCredits: 0,
          firstPurchaseCompleted: false
        }
      });
    }
  }

  /**
   * Convert tournament credits to withdrawable earnings
   */
  static async convertCreditsToEarnings(
    userId: string,
    creditsAmount: number
  ): Promise<boolean> {
    const userRef = doc(db, 'users', userId);

    try {
      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);

        if (!userDoc.exists()) {
          throw new Error('User not found');
        }

        const userData = userDoc.data();
        const wallet = userData.wallet || {};
        const currentTournamentCredits = wallet.tournamentCredits || 0;
        const currentEarnings = wallet.earnings || 0;

        // Check if user has enough tournament credits
        if (currentTournamentCredits < creditsAmount) {
          throw new Error('Insufficient tournament credits');
        }

        // Convert at 1:1 ratio - 1 tournament credit = ₹1 in earnings
        const newTournamentCredits = currentTournamentCredits - creditsAmount;
        const newEarnings = currentEarnings + creditsAmount;

        // Update user wallet
        transaction.update(userRef, {
          'wallet.tournamentCredits': newTournamentCredits,
          'wallet.earnings': newEarnings
        });

        // Create transaction records
        // 1. Deduct tournament credits
        const deductTransactionData = {
          userId,
          type: 'tournament_credit_conversion',
          amount: -creditsAmount,
          balanceBefore: currentTournamentCredits,
          balanceAfter: newTournamentCredits,
          walletType: 'tournamentCredits',
          description: `Converted ${creditsAmount} tournament credits to earnings`,
          transactionDetails: {
            conversionRate: 1, // 1:1 ratio
            earningsAmount: creditsAmount
          },
          createdAt: Timestamp.now()
        };

        const deductTransactionRef = doc(collection(db, 'creditTransactions'));
        transaction.set(deductTransactionRef, deductTransactionData);

        // 2. Add to earnings
        const addEarningsTransactionData = {
          userId,
          type: 'tournament_credit_conversion',
          amount: creditsAmount,
          balanceBefore: currentEarnings,
          balanceAfter: newEarnings,
          walletType: 'earnings',
          description: `Received ₹${creditsAmount} from tournament credit conversion`,
          transactionDetails: {
            conversionRate: 1, // 1:1 ratio
            creditsAmount: creditsAmount
          },
          createdAt: Timestamp.now()
        };

        const addEarningsTransactionRef = doc(collection(db, 'creditTransactions'));
        transaction.set(addEarningsTransactionRef, addEarningsTransactionData);
      });

      return true;
    } catch (error) {
      console.error('Error converting tournament credits to earnings:', error);
      return false;
    }
  }

  /**
   * Request withdrawal of earnings to UPI
   */
  static async requestWithdrawal(
    userId: string,
    amount: number,
    upiId: string,
    originalAmount?: number
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    const userRef = doc(db, 'users', userId);

    try {
      let transactionId: string | undefined;
      let userEmail: string | undefined;
      let userName: string | undefined;

      // First, get the user's email and name.
      const userDocForEmail = await getDoc(userRef);
      if (userDocForEmail.exists()) {
        const userData = userDocForEmail.data();
        userEmail = userData?.email;
        userName = userData?.displayName || userData?.name || userEmail?.split('@')[0] || 'User';
      }

      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);

        if (!userDoc.exists()) {
          throw new Error('User not found');
        }

        const userData = userDoc.data();
        const wallet = userData.wallet || {};
        const currentEarnings = wallet.earnings || 0;

        // Check if user has enough earnings
        if (currentEarnings < amount) {
          throw new Error('Insufficient earnings');
        }

        // Create withdrawal request record
        const withdrawalData = {
          userId,
          amount,
          upiId,
          status: 'pending',
          requestedAt: Timestamp.now(),
          processedAt: null,
          userEmail: userEmail || 'Unknown',
          notes: 'Withdrawal request pending. Funds will be transferred in 2-3 business days.'
        };

        const withdrawalRef = doc(collection(db, 'withdrawalRequests'));
        transaction.set(withdrawalRef, withdrawalData);
        transactionId = withdrawalRef.id;

        // Deduct from earnings
        const newEarnings = currentEarnings - amount;
        transaction.update(userRef, {
          'wallet.earnings': newEarnings
        });

        // Record transaction
        const transactionData = {
          userId,
          type: 'withdrawal',
          amount: -amount,
          balanceBefore: currentEarnings,
          balanceAfter: newEarnings,
          walletType: 'earnings',
          description: `Withdrawal of ₹${amount} to UPI: ${upiId}`,
          transactionDetails: {
            withdrawalId: withdrawalRef.id,
            upiId,
            status: 'pending'
          },
          createdAt: Timestamp.now()
        };

        const transactionRef = doc(collection(db, 'creditTransactions'));
        transaction.set(transactionRef, transactionData);
      });

      // Send immediate notification email to user
      if (userEmail && transactionId) {
        try {
          // Use relative URL for frontend/browser compatibility
          const response = await fetch('/api/send-withdrawal-request-notification', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId,
              userEmail,
              userName,
              amount, // final amount after deduction
              upiId,
              transactionId,
              originalAmount: originalAmount ?? amount
            }),
          });

          if (!response.ok) {
            console.warn('Failed to send withdrawal request notification email:', await response.text());
          } else {
            console.log('Withdrawal request notification email sent successfully');
          }
        } catch (emailError) {
          console.warn('Error sending withdrawal request notification email:', emailError);
          // Don't fail the withdrawal request if email fails
        }
      }

      return { success: true, transactionId };
    } catch (error) {
      console.error('Error requesting withdrawal:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user's current credit balance
   */
  static async getCreditBalance(userId: string): Promise<{
    tournamentCredits: number;
    hostCredits: number;
    earnings: number;
  }> {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    const userData = userDoc.data();
    const wallet = userData.wallet || {};

    return {
      tournamentCredits: wallet.tournamentCredits || 0,
      hostCredits: wallet.hostCredits || 0,
      earnings: wallet.earnings || 0
    };
  }
} 