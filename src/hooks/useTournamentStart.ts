import { useState, useEffect } from 'react';
import { Tournament } from '@/lib/tournamentService';
import { getTournamentStartInfo } from '@/lib/tournamentStartUtils';
import { Timestamp } from 'firebase/firestore';

/**
 * Hook to monitor tournament start availability
 * Updates every minute to check if tournament can be started
 * Also checks if notification needs to be sent when approaching start time
 */
export const useTournamentStart = (tournament: Tournament, currentUserId?: string) => {
  const [startInfo, setStartInfo] = useState(() => 
    getTournamentStartInfo(tournament, currentUserId)
  );
  const [notificationSent, setNotificationSent] = useState(
    tournament?.notificationSent === true
  );

  useEffect(() => {
    const updateStartInfo = () => {
      const info = getTournamentStartInfo(tournament, currentUserId);
      setStartInfo(info);
      
      // Note: Notification logic removed to prevent duplicate emails
      // Only cron-job.org should send notifications via /api/tournament-notifications
    };

    // Update immediately
    updateStartInfo();

    // Update every minute
    const interval = setInterval(updateStartInfo, 60 * 1000);

    return () => clearInterval(interval);
  }, [tournament, currentUserId, notificationSent]);

  return startInfo;
};

export default useTournamentStart;
