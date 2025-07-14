import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import TournamentList from "@/components/home/TournamentList";
import { TournamentType } from "@/components/home/types";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useTournament } from "@/contexts/TournamentContext";
import TournamentCleanupService from "@/lib/tournamentCleanupService";
import { useUserProfile } from "@/hooks/use-user-profile";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const HostedTournaments = () => {
  const [tournaments, setTournaments] = useState<TournamentType[]>([]);
  const [localLoading, setLocalLoading] = useState(false);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { hostedTournaments, isLoadingHostedTournaments, refreshHostedTournaments } = useTournament();
  const loadingTimeoutRef = useRef<number | null>(null);
  const [showHostApplyDialog, setShowHostApplyDialog] = useState(false);
  const { user } = useUserProfile();

  const handleCreateTournamentClick = () => {
    if (user?.isHost) {
      navigate('/tournament/create');
    } else {
      setShowHostApplyDialog(true);
    }
  };
  
  // Manual cleanup function
  const handleManualCleanup = async () => {
    setCleanupLoading(true);
    try {
      // First, do immediate cleanup
      console.log('🚀 Starting immediate cleanup...');
      const result = await TournamentCleanupService.deleteExpiredTournaments();
      
      // Wait a bit and try again to catch any that might have just expired
      setTimeout(async () => {
        try {
          console.log('🔄 Second cleanup pass...');
          await TournamentCleanupService.deleteExpiredTournaments();
        } catch (error) {
          console.error('Second cleanup pass failed:', error);
        }
      }, 1000);
      
      if (result.success) {
        toast({
          title: "Fast Cleanup Complete",
          description: `${result.message} (Running aggressive cleanup mode)`,
        });
        
        // Refresh tournaments after cleanup
        if (refreshHostedTournaments) {
          await refreshHostedTournaments();
        }
      } else {
        toast({
          title: "Cleanup Failed",
          description: result.error || "Failed to clean up tournaments",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred during cleanup",
        variant: "destructive",
      });
    } finally {
      setCleanupLoading(false);
    }
  };
  
  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);
  
  // Verify authentication on component mount
  useEffect(() => {
    if (!currentUser) {
      console.error("No authenticated user found. Redirecting to auth page.");
      toast({
        title: "Authentication required",
        description: "Please log in to view your hosted tournaments.",
        variant: "destructive"
      });
      navigate("/auth");
      return;
    }
    
    // Set local loading state
    setLocalLoading(true);
    
    // Set a safety timeout to exit loading state
    loadingTimeoutRef.current = window.setTimeout(() => {
      console.log("Safety timeout triggered - forcing loading state to false");
      setLocalLoading(false);
    }, 8000) as unknown as number; // 8 second timeout
    
    // Refresh tournaments when component mounts and user is authenticated
    if (currentUser && refreshHostedTournaments) {
      refreshHostedTournaments()
        .catch(error => {
          console.error("Failed to refresh tournaments:", error);
        })
        .finally(() => {
          // Clear the timeout since we finished refreshing
          if (loadingTimeoutRef.current) {
            clearTimeout(loadingTimeoutRef.current);
            loadingTimeoutRef.current = null;
          }
          setLocalLoading(false);
        });
    }
  }, [currentUser, navigate, toast, refreshHostedTournaments]);
  
  // Format tournaments for the TournamentList component
  useEffect(() => {
    try {
      if (Array.isArray(hostedTournaments)) {
        if (hostedTournaments.length > 0) {
          const formattedTournaments: TournamentType[] = hostedTournaments.map(tournament => {
            // Safely calculate prize total, handling potential undefined values
            const prizeTotal = tournament.prize_distribution ? 
              Object.values(tournament.prize_distribution).reduce((total, amount) => total + amount, 0) : 0;
            
            // Convert Firestore timestamp to proper date string
            let startDate: Date;
            if (typeof tournament.start_date === 'string') {
              startDate = new Date(tournament.start_date);
            } else if (tournament.start_date && typeof tournament.start_date === 'object' && 'toDate' in tournament.start_date) {
              // Handle Firestore Timestamp
              startDate = (tournament.start_date as any).toDate();
            } else {
              startDate = new Date(); // Fallback
            }
              
            return {
              id: tournament.id || "",
              title: tournament.name || "Unnamed Tournament",
              mode: tournament.mode || "Unknown",
              map: tournament.map || "",
              entryFee: tournament.entry_fee || 0,
              prizeMoney: (tournament.entry_fee || 0) * (tournament.max_players || 0),
              date: startDate.toISOString(),
              time: startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              totalSpots: tournament.max_players || 0,
              filledSpots: tournament.filled_spots || 0,
              status: tournament.status === 'active' ? 'active' : 
                      tournament.status === 'ongoing' ? 'ongoing' : 
                      tournament.status === 'completed' ? 'completed' : 'active',
              isPremium: (tournament.entry_fee || 0) > 100, // Just an example condition for premium
              ttl: tournament.ttl?.toDate().toISOString()
            };
          });
          
          setTournaments(formattedTournaments);
        } else {
          // Empty array of tournaments - set tournaments to empty array
          setTournaments([]);
        }
      } else {
        // hostedTournaments is not an array - set tournaments to empty array
        setTournaments([]);
      }
      
      // Once we have processed the tournaments, we can clear the local loading state
      setLocalLoading(false);
    } catch (error) {
      console.error("Error formatting tournaments:", error);
      setTournaments([]);
      setLocalLoading(false);
    }
  }, [hostedTournaments]);
  
  // Determine if we're in a loading state (either local or from context)
  const isLoading = localLoading || isLoadingHostedTournaments;
  
  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-6">
      {/* Header with back button */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/home" className="mr-2">
            <Button variant="ghost" size="icon" className="rounded-full bg-gaming-card hover:bg-gaming-card/80">
              <ArrowLeft size={18} />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              My Hosted Tournaments
            </h1>
            <p className="text-[#A0A0A0] text-sm">Tournaments you've created and manage</p>
          </div>
        </div>
        
        {/* Cleanup Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleManualCleanup}
          disabled={cleanupLoading}
          className="bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20"
        >
          <Trash2 size={16} className="mr-2" />
          {cleanupLoading ? "Cleaning..." : "Clean Expired"}
        </Button>
      </div>
      
      {/* Tournament List */}
      <div className="mb-6">
        {isLoading ? (
          <div className="text-center py-10">
            <p className="text-[#A0A0A0]">Loading your tournaments...</p>
          </div>
        ) : tournaments.length > 0 ? (
          <>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-white">All Hosted Tournaments ({tournaments.length})</h2>
            </div>
            <TournamentList tournaments={tournaments} />
          </>
        ) : (
          <div className="text-center py-10 bg-gaming-card rounded-lg p-6">
            <h3 className="text-lg font-medium text-white mb-2">No tournaments hosted yet</h3>
            <p className="text-[#A0A0A0] mb-4">Start creating tournaments and manage them here</p>
            <Button className="bg-gaming-primary hover:bg-gaming-primary/90" onClick={handleCreateTournamentClick}>
              Create Tournament
            </Button>
          </div>
        )}
      </div>
      <AlertDialog open={showHostApplyDialog} onOpenChange={setShowHostApplyDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Want to host your own tournament?</AlertDialogTitle>
            <AlertDialogDescription>
              To create a tournament, you need to be a host. Apply to become a host and start creating your own tournaments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              navigate('/apply-host');
              setShowHostApplyDialog(false);
            }}>
              Apply as Host
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default HostedTournaments;
