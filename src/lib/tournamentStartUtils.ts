import { Tournament } from '@/lib/tournamentService';

/**
 * Calculate time remaining until tournament can be started
 * @param tournament Tournament object
 * @returns Time information for start availability
 */
export const getTournamentStartInfo = (tournament: Tournament, currentUserId?: string) => {
  const now = new Date();
  const scheduledStartTime = new Date(tournament.start_date);
  const twentyMinutesBeforeStart = new Date(scheduledStartTime.getTime() - 20 * 60 * 1000);
  
  const isHost = currentUserId === tournament.host_id;
  const isActiveStatus = tournament.status === 'active';
  const canStartByTime = now.getTime() >= twentyMinutesBeforeStart.getTime();
  
  const timeUntilStartWindow = twentyMinutesBeforeStart.getTime() - now.getTime();
  const minutesUntilStart = Math.ceil(timeUntilStartWindow / (1000 * 60));
  
  return {
    isHost,
    isActiveStatus,
    canStartByTime,
    minutesUntilStart: minutesUntilStart > 0 ? minutesUntilStart : 0,
    canStart: isHost && isActiveStatus && canStartByTime,
    scheduledStartTime,
    twentyMinutesBeforeStart
  };
};

/**
 * Format time remaining until tournament can be started
 * @param minutes Minutes until start window
 * @returns Formatted time string
 */
export const formatTimeUntilStart = (minutes: number): string => {
  if (minutes <= 0) return "Can start now";
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${remainingMinutes}m`;
  }
  
  return `${remainingMinutes}m`;
};

/**
 * Get tournament status display info
 * @param tournament Tournament object
 * @returns Status display configuration
 */
export const getTournamentStatusDisplay = (tournament: Tournament) => {
  switch (tournament.status) {
    case 'active':
      return {
        label: 'UPCOMING',
        color: 'blue',
        shouldBlink: false
      };
    case 'ongoing':
      return {
        label: 'LIVE',
        color: 'red',
        shouldBlink: true
      };
    case 'ended':
      return {
        label: 'ENDED',
        color: 'red',
        shouldBlink: false
      };
    case 'completed':
      return {
        label: 'COMPLETED',
        color: 'green',
        shouldBlink: false
      };
    case 'cancelled':
      return {
        label: 'CANCELLED',
        color: 'gray',
        shouldBlink: false
      };
    default:
      return {
        label: 'UNKNOWN',
        color: 'gray',
        shouldBlink: false
      };
  }
};
