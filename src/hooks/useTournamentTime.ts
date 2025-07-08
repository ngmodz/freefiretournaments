import { useState, useEffect, useCallback } from 'react';
import { Tournament } from '@/lib/tournamentService';
import TournamentCleanupService from '@/lib/tournamentCleanupService';

interface TournamentTimeInfo {
  timeRemaining: number;
  hasExpired: boolean;
  formattedTime: string;
  warning: string | null;
}

/**
 * Custom hook for managing tournament time and cleanup
 * @param tournament Tournament object
 * @returns Object with time info and cleanup functions
 */
export const useTournamentTime = (tournament?: Tournament) => {
  const [timeInfo, setTimeInfo] = useState<TournamentTimeInfo>({
    timeRemaining: 0,
    hasExpired: false,
    formattedTime: "",
    warning: null
  });

  const calculateTimeInfo = useCallback((): TournamentTimeInfo => {
    if (!tournament?.ttl) {
      return {
        timeRemaining: 0,
        hasExpired: false,
        formattedTime: "No expiration set",
        warning: null
      };
    }

    const now = new Date();
    const ttlDate = tournament.ttl.toDate();
    const timeRemaining = ttlDate.getTime() - now.getTime();

    const hasExpired = timeRemaining <= 0;

    if (hasExpired) {
      return {
        timeRemaining: 0,
        hasExpired: true,
        formattedTime: "Expired",
        warning: "⚠️ This tournament has expired and will be automatically deleted soon."
      };
    }

    // Format time remaining
    const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
    const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

    let formattedTime = "";
    if (hours > 0) {
      formattedTime += `${hours}h `;
    }
    if (minutes > 0) {
      formattedTime += `${minutes}m `;
    }
    if (seconds > 0 || (hours === 0 && minutes === 0)) {
      formattedTime += `${seconds}s`;
    }

    // Show warning when less than 30 minutes remaining
    const warning = timeRemaining < 30 * 60 * 1000 
      ? `⚠️ This tournament will be automatically deleted in ${formattedTime.trim()}.`
      : null;

    return {
      timeRemaining,
      hasExpired,
      formattedTime: formattedTime.trim(),
      warning
    };
  }, [tournament]);

  // Update time info every second
  useEffect(() => {
    if (!tournament?.ttl) return;

    const updateTimeInfo = () => {
      setTimeInfo(calculateTimeInfo());
    };

    // Initial update
    updateTimeInfo();

    // Update every second
    const interval = setInterval(updateTimeInfo, 1000);

    return () => clearInterval(interval);
  }, [tournament, calculateTimeInfo]);

  return timeInfo;
};

/**
 * Custom hook for managing tournament cleanup
 * @returns Object with cleanup functions and state
 */
export const useTournamentCleanup = () => {
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [lastCleanupResult, setLastCleanupResult] = useState<{
    success: boolean;
    deletedCount: number;
    message: string;
  } | null>(null);

  const cleanupExpiredTournaments = useCallback(async () => {
    setIsCleaningUp(true);
    try {
      const result = await TournamentCleanupService.deleteExpiredTournaments();
      const formattedResult = {
        success: result.success,
        deletedCount: result.deletedCount,
        message: result.message || result.error || 'Unknown result'
      };
      setLastCleanupResult(formattedResult);
      return result;
    } catch (error) {
      const errorResult = {
        success: false,
        deletedCount: 0,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
      setLastCleanupResult(errorResult);
      return errorResult;
    } finally {
      setIsCleaningUp(false);
    }
  }, []);

  const checkForExpiredTournaments = useCallback(async () => {
    return await TournamentCleanupService.checkForExpiredTournaments();
  }, []);

  return {
    isCleaningUp,
    lastCleanupResult,
    cleanupExpiredTournaments,
    checkForExpiredTournaments
  };
};

/**
 * Custom hook for automatically running cleanup on component mount
 * @param enabled Whether to enable automatic cleanup
 */
export const useAutomaticCleanup = (enabled: boolean = true) => {
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    if (!enabled || hasInitialized) return;

    const initializeCleanup = async () => {
      try {
        await TournamentCleanupService.initializeCleanup();
        setHasInitialized(true);
      } catch (error) {
        console.error('Failed to initialize automatic cleanup:', error);
      }
    };

    initializeCleanup();
  }, [enabled, hasInitialized]);

  return { hasInitialized };
};
