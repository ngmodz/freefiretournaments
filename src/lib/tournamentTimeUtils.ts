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
 * @param startDate Tournament start date string
 * @returns Date object representing when the tournament will be deleted
 */
export const calculateTournamentDeletionTime = (startDate: string): Date => {
  const start = new Date(startDate);
  return new Date(start.getTime() + 2 * 60 * 1000); // Add 2 minutes for testing
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
  
  // Check if tournament has started
  const now = new Date();
  const tournamentStartTime = new Date(tournament.start_date);
  const hasStarted = now.getTime() >= tournamentStartTime.getTime();
  
  if (hasExpired) {
    return "⚠️ This tournament has expired and will be automatically deleted soon.";
  }

  // Only show warning if tournament has started and less than 1 minute remaining (for testing)
  if (hasStarted && timeRemaining < 1 * 60 * 1000) {
    return `⚠️ This tournament will be automatically deleted in ${formattedTime}.`;
  }

  return null;
};
