import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import TournamentFilters from "@/components/home/TournamentFilters";
import TournamentList from "@/components/home/TournamentList";
import { TournamentType } from "@/components/home/types";
import { getTournaments } from "@/lib/tournamentService";
import { Trophy } from "lucide-react";
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

const Index = () => {
  const navigate = useNavigate();
  const { user } = useUserProfile();
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("none");
  const [searchQuery, setSearchQuery] = useState("");
  const [tournaments, setTournaments] = useState<TournamentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHostApplyDialog, setShowHostApplyDialog] = useState(false);

  const handleCreateTournamentClick = () => {
    if (user?.isHost) {
      navigate('/tournament/create');
    } else {
      setShowHostApplyDialog(true);
    }
  };
  
  // Fetch tournaments from Firebase
  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        setLoading(true);
        const fetchedTournaments = await getTournaments();
        
        // Convert Firebase tournament data to the format expected by the UI components
        const formattedTournaments: TournamentType[] = fetchedTournaments.map(tournament => {
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
            id: tournament.id,
            title: tournament.name,
            mode: tournament.mode,
            map: tournament.map || "",
            entryFee: tournament.entry_fee,
            prizeMoney: tournament.entry_fee * tournament.max_players,
            date: startDate.toISOString(),
            time: startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            totalSpots: tournament.max_players,
            filledSpots: tournament.filled_spots || 0,
            status: tournament.status === 'active' ? 'active' : 
                    tournament.status === 'ongoing' ? 'ongoing' : 
                    tournament.status === 'ended' ? 'ended' :
                    tournament.status === 'completed' ? 'completed' :
                    tournament.status === 'cancelled' ? 'cancelled' : 'active'
          };
        });
        
        setTournaments(formattedTournaments);
      } catch (error) {
        console.error("Error fetching tournaments:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTournaments();
  }, []);
  
  // Apply search filter
  const applySearchFilter = (tournaments: TournamentType[]) => {
    if (!searchQuery.trim()) return tournaments;
    
    const query = searchQuery.toLowerCase().trim();
    return tournaments.filter(tournament => 
      tournament.title.toLowerCase().includes(query) ||
      tournament.mode.toLowerCase().includes(query) ||
      tournament.map.toLowerCase().includes(query)
    );
  };
  
  // Apply status filter
  const applyStatusFilter = (tournaments: TournamentType[]) => {
    if (filter === "all") return tournaments;
    
    return tournaments.filter(tournament => {
      if (filter === "active") return tournament.status === 'active';
      if (filter === "ongoing") return tournament.status === 'ongoing';
      if (filter === "completed") return tournament.status === 'completed';
      return true;
    });
  };
  
  // Apply filters
  let displayedTournaments = applySearchFilter(applyStatusFilter(tournaments));
  
  // Apply sorting
  if (sortBy !== "none") {
    displayedTournaments = [...displayedTournaments].sort((a, b) => {
      switch (sortBy) {
        case "date-asc":
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case "date-desc":
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case "price-asc":
          return a.entryFee - b.entryFee;
        case "price-desc":
          return b.entryFee - a.entryFee;
        case "prize-asc":
          return a.prizeMoney - b.prizeMoney;
        case "prize-desc":
          return b.prizeMoney - a.prizeMoney;
        default:
          return 0;
      }
    });
  }
  
  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 pb-6">
      {/* Header Section */}
      <div className="mb-6 text-center sm:text-left sm:flex sm:justify-between sm:items-center pt-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-white">
            <span className="text-gaming-primary">Freefire</span> Tournaments
          </h1>
          <p className="text-[#A0A0A0] text-sm">Join competitive tournaments and win real rewards</p>
        </div>
      </div>
      
      {/* Search and Filters */}
      <TournamentFilters
        filter={filter}
        setFilter={setFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />
      
      {/* Tournament List */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">
            {searchQuery ? `Search Results (${displayedTournaments.length})` : 'All Tournaments'}
          </h2>
        </div>
        
        {loading ? (
          <div className="text-center py-10">
            <p className="text-[#A0A0A0]">Loading tournaments...</p>
          </div>
        ) : displayedTournaments.length > 0 ? (
          <TournamentList tournaments={displayedTournaments} />
        ) : searchQuery ? (
          <div className="text-center py-16 bg-gaming-card border border-gaming-border rounded-lg p-6 relative overflow-hidden w-full">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gaming-primary/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gaming-accent/10 rounded-full -ml-12 -mb-12 blur-xl"></div>
            <div className="relative z-10 flex flex-col items-center">
              <Trophy className="h-16 w-16 text-gaming-muted/50 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No Matches Found</h3>
              <p className="text-gaming-muted mb-6">Your search for "{searchQuery}" didn't return any results.</p>
              <Button onClick={() => setSearchQuery("")} className="bg-gaming-primary hover:bg-gaming-primary/90 text-white shadow-lg">
                Clear Search
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-16 bg-gaming-card border border-gaming-border rounded-lg p-6 relative overflow-hidden w-full">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gaming-primary/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gaming-accent/10 rounded-full -ml-12 -mb-12 blur-xl"></div>
            <div className="relative z-10 flex flex-col items-center">
              <Trophy className="h-16 w-16 text-gaming-muted/50 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No Tournaments Available</h3>
              <p className="text-gaming-muted mb-6">There are no active tournaments right now. Check back soon!</p>
              <Button onClick={handleCreateTournamentClick} className="bg-gaming-accent hover:bg-gaming-accent/90 text-white shadow-lg">
                Create a Tournament
              </Button>
            </div>
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
            <AlertDialogAction onClick={() => navigate('/apply-host')}>
              Apply as Host
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Index;
