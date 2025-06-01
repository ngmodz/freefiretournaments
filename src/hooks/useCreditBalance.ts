import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface CreditBalance {
  hostCredits: number;
  tournamentCredits: number;
  earnings: number;
  totalPurchasedTournamentCredits: number;
  totalPurchasedHostCredits: number;
  firstPurchaseCompleted: boolean;
}

export const useCreditBalance = (userId: string | undefined) => {
  const [credits, setCredits] = useState<CreditBalance>({
    hostCredits: 0,
    tournamentCredits: 0,
    earnings: 0,
    totalPurchasedTournamentCredits: 0,
    totalPurchasedHostCredits: 0,
    firstPurchaseCompleted: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const userRef = doc(db, 'users', userId);

    const unsubscribe = onSnapshot(
      userRef,
      (doc) => {
        if (doc.exists()) {
          const userData = doc.data();
          const wallet = userData.wallet || {};

          setCredits({
            hostCredits: wallet.hostCredits || 0,
            tournamentCredits: wallet.tournamentCredits || 0,
            earnings: wallet.earnings || 0,
            totalPurchasedTournamentCredits: wallet.totalPurchasedTournamentCredits || 0,
            totalPurchasedHostCredits: wallet.totalPurchasedHostCredits || 0,
            firstPurchaseCompleted: wallet.firstPurchaseCompleted || false
          });
        }
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching credit balance:', err);
        setError('Failed to load credit balance');
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  return {
    ...credits,
    isLoading,
    error
  };
}; 