import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { updateTournamentRoomDetails, joinTournament } from "@/lib/tournamentService";
import { TournamentProps } from "./types";
import TournamentHeader from "./TournamentHeader";
import TournamentTabs from "./TournamentTabs";
import TournamentSidebar from "./TournamentSidebar";
import RoomDetailsDialog from "./RoomDetailsDialog";

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
  const [roomIdInput, setRoomIdInput] = useState(tournament?.room_id || "");
  const [roomPasswordInput, setRoomPasswordInput] = useState(tournament?.room_password || "");
  const [isSavingRoomDetails, setIsSavingRoomDetails] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleJoinTournament = async () => {
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
    if (participants.includes(currentUser.uid)) {
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
    
    console.log("Attempting to join tournament", { 
      tournamentId: id, 
      userId: currentUser.uid,
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
    
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: "Copied!", description: `${text} copied to clipboard.` });
    }).catch(err => {
      console.error("Failed to copy:", err);
      toast({ title: "Error", description: "Failed to copy.", variant: "destructive" });
    });
  };

  const handleGoHome = () => {
    navigate('/tournaments');
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
      <>
        <Link to="/tournaments" className="inline-flex items-center text-gaming-muted hover:text-gaming-text mb-4">
          <ArrowLeft size={18} className="mr-1" /> Back to tournaments
        </Link>
        
        <TournamentHeader 
          tournament={tournament} 
          isHost={isHost} 
          onSetRoomDetails={() => setShowSetRoomModal(true)} 
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TournamentTabs 
              tournament={tournament}
              isHost={isHost}
              onSetRoomDetails={() => setShowSetRoomModal(true)}
              onCopy={handleCopy}
            />
          </div>
          
          <TournamentSidebar 
            tournament={tournament} 
            progressPercentage={progressPercentage}
            spotsLeft={spotsLeft}
            onJoin={handleJoinTournament}
          />
        </div>

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
      </>
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