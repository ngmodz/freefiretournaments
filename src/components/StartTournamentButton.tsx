import React, { useState } from 'react';
import { Play, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { startTournament, canStartTournament, Tournament } from '@/lib/tournamentService';
import { useAuth } from '@/contexts/AuthContext';
import { useTournament } from '@/contexts/TournamentContext';
import { useTournamentStart } from '@/hooks/useTournamentStart';
import { formatTimeUntilStart } from '@/lib/tournamentStartUtils';

interface StartTournamentButtonProps {
  tournament: Tournament;
  onTournamentStarted?: (tournament: Tournament) => void;
  className?: string;
}

const StartTournamentButton: React.FC<StartTournamentButtonProps> = ({
  tournament,
  onTournamentStarted,
  className = ""
}) => {
  const [isStarting, setIsStarting] = useState(false);
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const { refreshHostedTournaments } = useTournament();
  const startInfo = useTournamentStart(tournament, currentUser?.uid);

  const handleStartTournament = async () => {
    if (!tournament.id) return;

    setIsStarting(true);
    try {
      const result = await startTournament(tournament.id);
      
      if (result.success) {
        toast({
          title: "Tournament Started!",
          description: "The tournament is now live and participants can join the room.",
        });
        
        // Refresh tournament data
        await refreshHostedTournaments();
        
        if (onTournamentStarted) {
          onTournamentStarted(result.tournament);
        }
      }
    } catch (error) {
      console.error('Error starting tournament:', error);
      toast({
        title: "Failed to Start Tournament",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsStarting(false);
    }
  };

  // Don't show button if user is not the host
  if (!startInfo.isHost) {
    return null;
  }

  // Don't show button if tournament is already ongoing, completed, or cancelled
  if (!startInfo.isActiveStatus) {
    return null;
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <Button
        onClick={handleStartTournament}
        disabled={!startInfo.canStart || isStarting}
        className={`
          flex items-center gap-2 px-6 py-3 font-semibold rounded-full transition-all duration-200
          ${startInfo.canStart 
            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg' 
            : 'bg-gray-700/80 text-gray-300 cursor-not-allowed'
          }
        `}
      >
        {isStarting ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Starting...
          </>
        ) : startInfo.canStart ? (
          <>
            <Play size={16} />
            Start Tournament
          </>
        ) : (
          <>
            <Clock size={16} />
            Cannot Start Yet
          </>
        )}
      </Button>
      
      {/* Show reason if tournament cannot be started */}
      {!startInfo.canStart && (
        <div className="flex items-start gap-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
          <AlertCircle size={16} className="text-yellow-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-yellow-400">
            {startInfo.minutesUntilStart > 0 
              ? `Tournament can be started in ${formatTimeUntilStart(startInfo.minutesUntilStart)}`
              : "Tournament can only be started 20 minutes before scheduled time"
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default StartTournamentButton;
