import { useState, useEffect } from 'react';
import { Tournament } from '@/lib/tournamentService';
import { getTournamentStartInfo } from '@/lib/tournamentStartUtils';

/**
 * Hook to monitor tournament start availability
 * Updates every minute to check if tournament can be started
 */
export const useTournamentStart = (tournament: Tournament, currentUserId?: string) => {
  const [startInfo, setStartInfo] = useState(() => 
    getTournamentStartInfo(tournament, currentUserId)
  );

  useEffect(() => {
    const updateStartInfo = () => {
      setStartInfo(getTournamentStartInfo(tournament, currentUserId));
    };

    // Update immediately
    updateStartInfo();

    // Update every minute
    const interval = setInterval(updateStartInfo, 60 * 1000);

    return () => clearInterval(interval);
  }, [tournament, currentUserId]);

  return startInfo;
};

export default useTournamentStart;
