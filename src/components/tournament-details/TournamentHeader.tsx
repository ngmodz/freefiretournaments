import React, { useEffect, useState } from "react";
import { Calendar, Clock, Trophy, Check, Edit3, Users, Share2, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TournamentHeaderProps } from "./types";
import { cn } from "@/lib/utils";
import { getUserProfile } from "@/lib/firebase/profile";
import TournamentCountdown from "../TournamentCountdown";
import TournamentStatusBadge from "../TournamentStatusBadge";
import StartTournamentButton from "../StartTournamentButton";
import EndTournamentButton from "../EndTournamentButton";
import { useTournament } from "@/contexts/TournamentContext";
import { useToast } from "@/hooks/use-toast";
import { Tournament } from "@/lib/tournamentService";
import { Badge } from "@/components/ui/badge";
import { useTournamentStart } from "@/hooks/useTournamentStart";
import { useAuth } from "@/contexts/AuthContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cancelTournament } from "@/lib/tournamentService";

const TournamentHeader: React.FC<TournamentHeaderProps> = ({
  tournament,
  isHost,
  onSetRoomDetails,
}) => {
  const [hostName, setHostName] = useState<string | null>(null);
  const [hostVerified, setHostVerified] = useState<boolean>(false);
  const [hostIGN, setHostIGN] = useState<string | null>(null);
  const [hostUID, setHostUID] = useState<string | null>(null);
  const { refreshHostedTournaments } = useTournament();
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const startInfo = useTournamentStart(tournament, currentUser?.uid);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    async function fetchHostName() {
      try {
        if (tournament.host_id) {
          const profile = await getUserProfile(tournament.host_id);
          setHostIGN(profile.ign || "Unknown Host");
          setHostUID(profile.uid || "-");
          setHostVerified(!!profile.isHost);
        }
      } catch (e) {
        setHostIGN("Unknown Host");
        setHostUID("-");
      }
    }
    fetchHostName();
  }, [tournament.host_id]);

  // Format date and time
  const startDate = new Date(tournament.start_date);
  const formattedDate = startDate.toLocaleDateString();
  const formattedTime = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Calculate prize pool - use currentPrizePool if available, fallback to calculation
  const prizePool = tournament.currentPrizePool !== undefined 
    ? tournament.currentPrizePool 
    : tournament.entry_fee * tournament.filled_spots;

  // Status color mapping
  const getStatusColor = (status: string) => {
    switch (status) {
      case "ongoing": return "bg-gaming-accent"; // Orange for ongoing/live tournaments
      case "active": return "bg-blue-500"; // Blue for active/upcoming tournaments
      case "cancelled": return "bg-[#505050]"; // Gray for cancelled tournaments
      case "completed": return "bg-[#505050]"; // Gray for completed tournaments
      default: return "bg-[#505050]";
    }
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/tournament/${tournament.id}`;
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        toast({ title: "Link Copied!", description: "Tournament link copied to clipboard." });
      });
    } else {
      // fallback
      const textarea = document.createElement('textarea');
      textarea.value = shareUrl;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      toast({ title: "Link Copied!", description: "Tournament link copied to clipboard." });
    }
  };

  const handleCancelTournament = async () => {
    if (!tournament.id) return;
    setIsCancelling(true);
    try {
      const result = await cancelTournament(tournament.id);
      toast({
        title: "Tournament Cancelled",
        description: result.message,
      });
      // onRefresh is no longer needed due to real-time updates
    } catch (error) {
      toast({
        title: "Cancellation Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="w-full mb-6">
      <div className="bg-gradient-to-b from-gaming-card to-gaming-bg text-gaming-text rounded-lg shadow-lg border border-gaming-primary/20 overflow-hidden backdrop-blur-sm relative">
        <div className="absolute top-0 right-0 w-32 h-32 -mr-10 -mt-10 rounded-full bg-gaming-primary/5 blur-xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 -ml-8 -mb-8 rounded-full bg-gaming-accent/5 blur-lg"></div>
        <div className="p-4 sm:p-6 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4">
            <div className="flex-grow">
              {/* Status badge */}
              <div className="flex items-center mb-3">
                <TournamentStatusBadge status={tournament.status} />
              </div>
              
              {/* Tournament name */}
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-4">{tournament.name}</h1>
            </div>
          
          {/* Action buttons for host */}
          <div className="flex flex-col gap-2">
            <Button 
              onClick={handleShare}
              size="sm"
              variant="outline"
              className="text-white border-gaming-accent hover:bg-gaming-accent/20"
            >
              <Share2 size={16} className="mr-1.5" />
              Share
            </Button>

            {isHost && (tournament.status === 'active' || tournament.status === 'ongoing') && (
              <Button variant="outline" size="sm" onClick={onSetRoomDetails}>
                <Edit3 size={16} className="mr-1.5" />
                Set Room Details
              </Button>
            )}

            {isHost && tournament.status === 'ongoing' && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" disabled={isCancelling}>
                    <Ban size={16} className="mr-1.5" />
                    {isCancelling ? "Cancelling..." : "Cancel"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will cancel the tournament and refund all participants. This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Back</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleCancelTournament}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Yes, Cancel
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            {isHost && tournament.status === 'active' && startInfo.canStart && (
              <StartTournamentButton
                tournament={tournament}
                onTournamentStarted={() => { /* Real-time update handles this */ }}
                className="bg-green-500 hover:bg-green-600"
              />
            )}

            {isHost && tournament.status === 'ongoing' && (
              <EndTournamentButton
                tournament={tournament}
                onTournamentEnded={() => { /* Real-time update handles this */ }}
              />
            )}
          </div>
        </div>
        
        {/* Tournament details grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Prize pool */}
          <div className="bg-[#1A1A1A]/60 backdrop-blur-sm p-3 rounded-md border border-white/5">
            <div className="text-[#A0A0A0] text-xs mb-1">Prize Pool</div>
            <div className="flex items-center">
              <Trophy size={18} className="mr-2 text-gaming-accent" />
              <span className="text-gaming-accent font-bold text-lg">{prizePool} credits</span>
            </div>
          </div>
          
          {/* Entry fee */}
          <div className="bg-[#1A1A1A]/60 backdrop-blur-sm p-3 rounded-md border border-white/5">
            <div className="text-[#A0A0A0] text-xs mb-1">Entry Fee</div>
            <div className="text-[#D0D0D0] font-bold text-lg">{tournament.entry_fee} credits</div>
          </div>
          
          {/* Start date and time */}
          <div className="bg-[#1A1A1A]/60 backdrop-blur-sm p-3 rounded-md border border-white/5">
            <div className="text-[#A0A0A0] text-xs mb-1">Start Date & Time</div>
            <div className="flex items-center">
              <Calendar size={16} className="mr-2 text-[#C0C0C0]" />
              <span className="text-[#E0E0E0]">{formattedDate}</span>
              <Clock size={16} className="ml-3 mr-2 text-[#C0C0C0]" />
              <span className="text-[#E0E0E0]">{formattedTime}</span>
            </div>
          </div>
          
          {/* Mode and max players */}
          <div className="bg-[#1A1A1A]/60 backdrop-blur-sm p-3 rounded-md border border-white/5">
            <div className="text-[#A0A0A0] text-xs mb-1">Mode & Players</div>
            <div className="flex items-center">
              <Users size={16} className="mr-2 text-[#C0C0C0]" />
              <span className="text-[#E0E0E0]">{tournament.mode} | Max: {tournament.max_players}</span>
            </div>
          </div>
        </div>
        
        {/* Tournament Auto-Delete Countdown - Always show for hosts */}
        {isHost && (
          <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
            <TournamentCountdown 
              ttl={tournament.ttl ? tournament.ttl.toDate().toISOString() : null} 
              startDate={tournament.start_date}
              className="text-yellow-400"
              showWarning={true}
            />
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default TournamentHeader; 