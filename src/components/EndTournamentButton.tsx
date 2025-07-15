import React, { useState } from 'react';
import { Square, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { endTournament, canEndTournament, Tournament } from '@/lib/tournamentService';
import { useAuth } from '@/contexts/AuthContext';
import { useTournament } from '@/contexts/TournamentContext';

interface EndTournamentButtonProps {
  tournament: Tournament;
  onTournamentEnded?: (tournament: Tournament) => void;
  className?: string;
}

const EndTournamentButton: React.FC<EndTournamentButtonProps> = ({
  tournament,
  onTournamentEnded,
  className = ""
}) => {
  const [isEnding, setIsEnding] = useState(false);
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const { refreshHostedTournaments } = useTournament();

  const handleEndTournament = async () => {
    if (!tournament.id) return;

    setIsEnding(true);
    try {
      const result = await endTournament(tournament.id);
      
      if (result.success) {
        toast({
          title: "Tournament Ended!",
          description: "The tournament has been ended. You can now enter the prize distribution.",
        });
        
        // Refresh tournament data
        await refreshHostedTournaments();
        
        if (onTournamentEnded) {
          onTournamentEnded(result.tournament);
        }
      }
    } catch (error) {
      console.error('Error ending tournament:', error);
      toast({
        title: "Failed to End Tournament",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsEnding(false);
    }
  };

  // Check if tournament can be ended
  const endCheck = canEndTournament(tournament, currentUser?.uid);

  // Don't show button if user is not the host
  if (!currentUser || tournament.host_id !== currentUser.uid) {
    return null;
  }

  // Don't show button if tournament is not ongoing
  if (tournament.status !== "ongoing") {
    return null;
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <Button
        onClick={handleEndTournament}
        disabled={!endCheck.canEnd || isEnding}
        className={`
          flex items-center gap-2 px-4 py-2 font-semibold rounded-lg transition-all duration-200
          ${endCheck.canEnd 
            ? 'bg-rose-600/90 hover:bg-rose-700 text-white shadow-md hover:shadow-lg border border-rose-500/50' 
            : 'bg-gray-700/80 text-gray-300 border border-gray-600/50 cursor-not-allowed'
          }
        `}
      >
        {isEnding ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Ending...
          </>
        ) : (
          <>
            <Square size={16} className="text-rose-300" />
            End Tournament
          </>
        )}
      </Button>
      
      {/* Show reason if tournament cannot be ended */}
      {!endCheck.canEnd && (
        <div className="flex items-start gap-2 p-2 bg-red-500/10 border border-red-500/20 rounded-md">
          <AlertCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-red-400">
            {endCheck.reason}
          </p>
        </div>
      )}
    </div>
  );
};

export default EndTournamentButton;
