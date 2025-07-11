import { Tournament } from "./tournamentService";

/**
 * Calculate the time remaining before a tournament gets automatically deleted
 * @param tournament Tournament object
 * @returns Object with remaining time information
 */
export const getTournamentTimeRemaining = (tournament: Tournament) => {
  if (!tournament.ttl) {
    return {
      timeRemaining: 0,
      hasExpired: false,
      formattedTime: "No expiration set"
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
      formattedTime: "Expired"
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

  return {
    timeRemaining,
    hasExpired,
    formattedTime: formattedTime.trim()
  };
};

/**
 * Calculate the scheduled deletion time for a tournament
 * @param scheduledStartTime When the tournament is scheduled to start
 * @returns Date object representing when the tournament will be deleted
 */
export const calculateTournamentDeletionTime = (scheduledStartTime: Date): Date => {
  return new Date(scheduledStartTime.getTime() + 2 * 60 * 60 * 1000); // Add 2 hours
};

/**
 * Check if a tournament should be automatically deleted
 * @param tournament Tournament object
 * @returns Boolean indicating if tournament should be deleted
 */
export const shouldTournamentBeDeleted = (tournament: Tournament): boolean => {
  const { hasExpired } = getTournamentTimeRemaining(tournament);
  return hasExpired;
};

/**
 * Get deletion warning message for tournaments
 * @param tournament Tournament object
 * @returns Warning message string
 */
export const getTournamentDeletionWarning = (tournament: Tournament): string | null => {
  const { timeRemaining, hasExpired, formattedTime } = getTournamentTimeRemaining(tournament);
  
  // Only show warnings for tournaments that have TTL set
  if (!tournament.ttl) {
    return null;
  }
  
  if (hasExpired) {
    return "⚠️ This tournament has expired and will be automatically deleted soon.";
  }

  // Show warning when less than 30 minutes remaining
  if (timeRemaining < 30 * 60 * 1000) {
    return `⚠️ This tournament will be automatically deleted in ${formattedTime}.`;
  }

  return null;
};

/**
 * Check if tournament has reached its scheduled start time
 * @param tournament Tournament object
 * @returns Boolean indicating if tournament has reached scheduled start time
 */
export const hasTournamentReachedScheduledTime = (tournament: Tournament): boolean => {
  const now = new Date();
  const scheduledStartTime = new Date(tournament.start_date);
  return now.getTime() >= scheduledStartTime.getTime();
};

/**
 * Get time until scheduled start time
 * @param tournament Tournament object
 * @returns Object with time information until scheduled start
 */
export const getTimeUntilScheduledStart = (tournament: Tournament) => {
  const now = new Date();
  const scheduledStartTime = new Date(tournament.start_date);
  const timeRemaining = scheduledStartTime.getTime() - now.getTime();

  const hasReached = timeRemaining <= 0;

  if (hasReached) {
    return {
      timeRemaining: 0,
      hasReached: true,
      formattedTime: "Started"
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

  return {
    timeRemaining,
    hasReached,
    formattedTime: formattedTime.trim()
  };
};
