import { useState, useEffect } from 'react';
import { Tournament } from '@/lib/tournamentService';
import { getTournamentStartInfo } from '@/lib/tournamentStartUtils';
import { Timestamp } from 'firebase/firestore';

/**
 * Hook to monitor tournament start availability
 * Updates every minute to check if tournament can be started
 */
export const useTournamentStart = (tournament: Tournament, currentUserId?: string) => {
  const [startInfo, setStartInfo] = useState(() => 
    getTournamentStartInfo(tournament, currentUserId)
  );
  // Keep tracking notificationSent but we won't trigger notifications from client-side anymore
  const [notificationSent, setNotificationSent] = useState(
    tournament?.notificationSent === true
  );

  useEffect(() => {
    const updateStartInfo = () => {
      const info = getTournamentStartInfo(tournament, currentUserId);
      setStartInfo(info);
      
      // Update the notificationSent state if the tournament was notified
      if (tournament?.notificationSent === true && !notificationSent) {
        setNotificationSent(true);
      }
      
      // NOTIFICATION LOGIC REMOVED:
      // We removed the client-side notification trigger here since
      // notifications are now handled exclusively by the server-side cron job
      // This prevents duplicate notifications being sent to tournament hosts
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
