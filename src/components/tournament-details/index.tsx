import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, AlertCircle, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { updateTournamentRoomDetails, joinTournament } from "@/lib/tournamentService";
import { TournamentProps } from "./types";
import TournamentHeader from "./TournamentHeader";
import TournamentTabs from "./TournamentTabs";
import TournamentSidebar from "./TournamentSidebar";
import RoomDetailsDialog from "./RoomDetailsDialog";
import PrizeDistributionDialog from "./PrizeDistributionDialog";
import JoinTournamentDialog from "./JoinTournamentDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import JoinedUsersList from "./JoinedUsersList";

// Extend the Tournament type to include prizePool
declare module "@/lib/tournamentService" {
  interface Tournament {
    prizePool?: {
      totalPrizeCredits: number;
      prizeDistribution: { first: number; second: number; third: number };
      isDistributed: boolean;
      distributedAt?: any;
      distributedBy?: string;
      winners?: {
        first?: { uid: string; username: string; prizeCredits: number };
        second?: { uid: string; username: string; prizeCredits: number };
        third?: { uid: string; username: string; prizeCredits: number };
      };
    };
  }
}

// Robust clipboard copy utility for all browsers and iOS
function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    // Modern API
    return navigator.clipboard.writeText(text);
  } else {
    // Fallback for iOS/Safari/older browsers
    return new Promise((resolve, reject) => {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        // Prevent scrolling to bottom
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.setAttribute('readonly', '');
        document.body.appendChild(textarea);
        textarea.select();
        textarea.setSelectionRange(0, textarea.value.length);
        const successful = document.execCommand('copy');
        document.body.removeChild(textarea);
        if (successful) {
          resolve();
        } else {
          reject(new Error('Fallback: Copy command was unsuccessful'));
        }
      } catch (err) {
        reject(err);
      }
    });
  }
}

const TournamentDetailsContent: React.FC<TournamentProps> = ({
  id,
  tournament,
  isHost,
  loading,
  currentUser,
  onRefresh
}) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showSetRoomModal, setShowSetRoomModal] = useState(false);
  const [showPrizeDistributionModal, setShowPrizeDistributionModal] = useState(false);
  const [roomIdInput, setRoomIdInput] = useState(tournament?.room_id || "");
  const [roomPasswordInput, setRoomPasswordInput] = useState(tournament?.room_password || "");
  const [isSavingRoomDetails, setIsSavingRoomDetails] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showJoinDialog, setShowJoinDialog] = useState(false);

  // Update room input fields when tournament changes
  useEffect(() => {
    if (tournament) {
      setRoomIdInput(tournament.room_id || "");
      setRoomPasswordInput(tournament.room_password || "");
    }
  }, [tournament]);

  // Calculate derived values safely
  const progressPercentage = tournament && tournament.max_players > 0 
    ? (tournament.filled_spots / tournament.max_players) * 100 
    : 0;
  const spotsLeft = tournament ? tournament.max_players - tournament.filled_spots : 0;

  const handleJoinTournament = () => {
    console.log("Join tournament button clicked");
    setError(null);
    
    if (!id || !tournament) {
      console.error("Missing tournament ID or tournament data", { id, tournament });
      toast({
        title: "Error",
        description: "Tournament information is missing. Please try refreshing the page.",
        variant: "destructive",
      });
      return;
    }
    
    if (!currentUser) {
      console.error("No authenticated user found");
      toast({
        title: "Authentication Required",
        description: "You must be logged in to join this tournament.",
        variant: "destructive",
      });
      return;
    }
    
    // Check if user is the tournament host
    if (tournament.host_id === currentUser.uid) {
      console.error("User is the host of this tournament");
      toast({
        title: "Cannot Join",
        description: "You cannot join your own tournament as you are the host.",
        variant: "destructive",
      });
      return;
    }
    
    // Check if user is already a participant
    const participants = tournament.participants || [];
    const isAlreadyParticipant = participants.some(p => {
      if (typeof p === 'object' && p !== null && 'authUid' in p) {
        return p.authUid === currentUser.uid;
      }
      return p === currentUser.uid;
    });
    
    if (isAlreadyParticipant) {
      console.error("User is already a participant in this tournament");
      toast({
        title: "Already Joined",
        description: "You have already joined this tournament.",
        variant: "destructive",
      });
      return;
    }

    // Check if tournament is full
    if (tournament.filled_spots >= tournament.max_players) {
      console.error("Tournament is full");
      toast({
        title: "Tournament Full",
        description: "This tournament has reached its maximum number of participants.",
        variant: "destructive",
      });
      return;
    }
    
    // Show the join dialog
    setShowJoinDialog(true);
  };

  const handleConfirmJoin = async () => {
    console.log("Confirming join tournament", { 
      tournamentId: id, 
      userId: currentUser?.uid,
      isJoining
    });
    
    if (isJoining) return;
    
    setIsJoining(true);
    try {
      console.log("Calling joinTournament function");
      const result = await joinTournament(id);
      console.log("Join tournament result", result);
      
      toast({
        title: "Success",
        description: result.message || "You have successfully joined the tournament!",
      });
      
      // Close the dialog
      setShowJoinDialog(false);
      
      // Refresh tournament data
      if (onRefresh) {
        await onRefresh();
      }
    } catch (error) {
      console.error("Failed to join tournament:", error);
      let errorMessage = "Failed to join the tournament.";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  };

  const handleSetRoomDetails = async () => {
    if (!id || !tournament) return;
    if (!roomIdInput.trim() || !roomPasswordInput.trim()) {
      toast({
        title: "Validation Error",
        description: "Room ID and Password cannot be empty.",
        variant: "destructive",
      });
      return;
    }
    setIsSavingRoomDetails(true);
    try {
      const result = await updateTournamentRoomDetails(id, roomIdInput, roomPasswordInput);
      if (result.success) {
        toast({
          title: "Success",
          description: "Room details updated successfully.",
        });
        setShowSetRoomModal(false);
        if (onRefresh) {
          await onRefresh();
        }
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error("Failed to update room details:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update room details.",
        variant: "destructive",
      });
    } finally {
      setIsSavingRoomDetails(false);
    }
  };

  const handleCopy = (text: string) => {
    if (!text) {
      toast({ 
        title: "Error", 
        description: "Nothing to copy", 
        variant: "destructive" 
      });
      return;
    }
    copyToClipboard(text)
      .then(() => {
        toast({ title: "Copied!", description: `${text} copied to clipboard.` });
      })
      .catch(err => {
        console.error("Failed to copy:", err);
        toast({ title: "Error", description: "Failed to copy.", variant: "destructive" });
      });
  };

  const handleGoHome = () => {
    navigate('/tournaments');
  };

  // Check if tournament is completed and has prize pool
  const canDistributePrizes = () => {
    return (
      isHost && 
      tournament?.status === 'completed' && 
      tournament?.prizePool && 
      !tournament?.prizePool?.isDistributed
    );
  };

  // Check if tournament has a prize pool
  const hasPrizePool = () => {
    return (
      tournament?.prizePool && 
      tournament?.prizePool?.totalPrizeCredits > 0
    );
  };

  try {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-12 w-12 animate-spin text-gaming-primary" />
          <p className="ml-4 text-lg">Loading tournament details...</p>
        </div>
      );
    }

    if (!tournament) {
      return (
        <div className="flex flex-col items-center justify-center h-96">
          <AlertCircle size={48} className="text-red-500 mb-4" />
          <p className="text-xl font-semibold">Tournament not found</p>
          <button 
            onClick={handleGoHome}
            className="mt-4 bg-gaming-primary text-white px-4 py-2 rounded"
          >
            Go back to tournaments
          </button>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-96">
          <AlertCircle size={48} className="text-red-500 mb-4" />
          <p className="text-xl font-semibold">Error</p>
          <p className="mb-4 text-gaming-muted">{error}</p>
          <button 
            onClick={handleGoHome}
            className="mt-4 bg-gaming-primary text-white px-4 py-2 rounded"
          >
            Go back to tournaments
          </button>
          <button 
            onClick={() => onRefresh && onRefresh()}
            className="mt-2 border border-gaming-primary text-gaming-primary px-4 py-2 rounded"
          >
            Try again
          </button>
        </div>
      );
    }

    return (
      <div className="container mx-auto py-6 px-4 max-w-7xl">
        {/* Back button */}
        <Link to="/tournaments" className="inline-flex items-center text-gaming-muted hover:text-gaming-text mb-4">
          <ArrowLeft size={18} className="mr-1" /> Back to tournaments
        </Link>

        {/* Tournament Header */}
        <TournamentHeader 
          tournament={tournament} 
          isHost={isHost}
          onSetRoomDetails={() => setShowSetRoomModal(true)}
          onRefresh={onRefresh}
        />

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Left sidebar */}
          <div className="lg:col-span-1">
            <TournamentSidebar 
              tournament={tournament} 
              progressPercentage={progressPercentage}
              spotsLeft={spotsLeft}
              onJoin={handleJoinTournament}
              isHost={isHost}
            />

            {/* Prize Pool Card - Show if tournament has prize pool */}
            {hasPrizePool() && (
              <Card className="bg-gradient-to-b from-gaming-card to-gaming-bg text-gaming-text rounded-lg shadow-lg border border-gaming-primary/20 overflow-hidden backdrop-blur-sm mt-6 relative">
                <div className="absolute top-0 right-0 w-32 h-32 -mr-10 -mt-10 rounded-full bg-gaming-primary/5 blur-xl"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 -ml-8 -mb-8 rounded-full bg-gaming-accent/5 blur-lg"></div>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    Prize Pool
                  </CardTitle>
                  <CardDescription>
                    Tournament credit prizes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-gaming-bg/50 p-3 rounded-md backdrop-blur-sm border border-white/5">
                      <h4 className="font-medium mb-2">Total: {tournament?.prizePool?.totalPrizeCredits} Credits</h4>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="flex items-center gap-1">
                          <Trophy className="h-4 w-4 text-yellow-500" />
                          <span>1st: {tournament?.prizePool?.prizeDistribution?.first}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Trophy className="h-4 w-4 text-gray-300" />
                          <span>2nd: {tournament?.prizePool?.prizeDistribution?.second}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Trophy className="h-4 w-4 text-amber-700" />
                          <span>3rd: {tournament?.prizePool?.prizeDistribution?.third}</span>
                        </div>
                      </div>
                    </div>

                    {/* Show prize distribution button for host if tournament is completed */}
                    {canDistributePrizes() && (
                      <Button
                        onClick={() => setShowPrizeDistributionModal(true)}
                        className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-medium"
                      >
                        <Trophy className="h-4 w-4 mr-2" />
                        Distribute Prizes
                      </Button>
                    )}

                    {/* Show if prizes have been distributed */}
                    {tournament?.prizePool?.isDistributed && (
                      <div className="flex items-center gap-2 text-green-500 text-sm">
                        <Trophy className="h-4 w-4" />
                        <span>Prizes have been distributed</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main content area */}
          <div className="lg:col-span-2">
            <TournamentTabs 
              tournament={tournament} 
              isHost={isHost} 
              onSetRoomDetails={() => setShowSetRoomModal(true)}
              onCopy={handleCopy}
            />
            {/* Joined Users List (Host Only, below details) */}
            {isHost && (
              <JoinedUsersList participantUids={tournament.participants || []} />
            )}
          </div>
        </div>

        {/* Room Details Dialog */}
        <RoomDetailsDialog
          isOpen={showSetRoomModal}
          setIsOpen={setShowSetRoomModal}
          roomId={roomIdInput}
          setRoomId={setRoomIdInput}
          roomPassword={roomPasswordInput}
          setRoomPassword={setRoomPasswordInput}
          onSave={handleSetRoomDetails}
          isSaving={isSavingRoomDetails}
        />

        {/* Prize Distribution Dialog */}
        {tournament && tournament.prizePool && (
          <PrizeDistributionDialog
            open={showPrizeDistributionModal}
            onOpenChange={setShowPrizeDistributionModal}
            tournament={{
              id: id,
              name: tournament.name,
              prizePool: tournament.prizePool,
              participants: tournament.participants
            }}
            hostUid={currentUser?.uid || ''}
            onSuccess={onRefresh}
          />
        )}

        {/* Join Tournament Dialog */}
        <JoinTournamentDialog
          open={showJoinDialog}
          onOpenChange={setShowJoinDialog}
          tournament={tournament}
          onConfirm={handleConfirmJoin}
          isJoining={isJoining}
        />
      </div>
    );
  } catch (error) {
    console.error("Unexpected error in TournamentDetailsContent:", error);
    
    // Return a fallback UI
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <p className="text-xl font-semibold">Something went wrong</p>
        <p className="mb-4 text-gaming-muted">An unexpected error occurred.</p>
        <button 
          onClick={handleGoHome}
          className="mt-4 bg-gaming-primary text-white px-4 py-2 rounded"
        >
          Go back to tournaments
        </button>
      </div>
    );
  }
};

export default TournamentDetailsContent; 