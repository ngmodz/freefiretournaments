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
      
      // Check if we need to send a notification (if tournament is starting in ~20 minutes)
      if (tournament && 
          tournament.host_id === currentUserId && 
          !notificationSent && 
          tournament.notificationSent !== true) {
        
        const now = new Date();
        
        // Parse the start_date string to a Date object
        let startDate: Date;
        try {
          // Tournament start_date is a string in the interface
          startDate = new Date(tournament.start_date);
        } catch (error) {
          console.error("Error parsing tournament start date:", error);
          return; // Exit if date parsing fails
        }
        
        const minutesToStart = (startDate.getTime() - now.getTime()) / (1000 * 60);
        
        // If tournament is starting in 19-21 minutes, trigger notification
        if (minutesToStart >= 19 && minutesToStart <= 21) {
          console.log(`Tournament starting in ${minutesToStart.toFixed(1)} minutes, checking notification`);
          
          // Call the check-tournament API to send notification
          if (tournament.id) {
            fetch(`/api/check-tournament?id=${tournament.id}`)
              .then(response => response.json())
              .then(data => {
                if (data.notification) {
                  console.log('Notification sent successfully');
                  setNotificationSent(true);
                } else {
                  console.log('Notification not sent:', data.error);
                }
              })
              .catch(error => {
                console.error('Error checking notification:', error);
              });
          }
        }
      }
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
