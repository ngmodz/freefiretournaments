import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TournamentList from "@/components/home/TournamentList";
import TournamentFilters from "@/components/home/TournamentFilters";
import { TournamentType, TournamentStatus } from "@/components/home/types";
import { useAuth } from "@/contexts/AuthContext";
import { useTournament } from "@/contexts/TournamentContext";
import { getTournaments } from "@/lib/tournamentService";

const Tournaments = () => {
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("none");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("joined-tournaments");
  const [loading, setLoading] = useState(true);

  const { currentUser } = useAuth();
  const { 
    hostedTournaments, 
    isLoadingHostedTournaments, 
    refreshHostedTournaments,
    joinedTournaments,
    isLoadingJoinedTournaments,
    refreshJoinedTournaments
  } = useTournament();

  // Fetch tournaments on mount
  useEffect(() => {
    setLoading(true);
    
    // Force refresh of the joined and hosted tournaments when this component mounts
    refreshJoinedTournaments();
    refreshHostedTournaments();
    
    setLoading(false);
  }, [refreshJoinedTournaments, refreshHostedTournaments]);
  
  // Format joined tournaments for display
  const formattedJoinedTournaments: TournamentType[] = joinedTournaments.map(tournament => ({
    id: tournament.id,
    title: tournament.name,
    mode: tournament.mode,
    map: tournament.map || "",
    entryFee: tournament.entry_fee,
    prizeMoney: tournament.entry_fee * tournament.max_players,
    date: tournament.start_date,
    time: new Date(tournament.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    totalSpots: tournament.max_players,
    filledSpots: tournament.filled_spots || 0,
    status: tournament.status as TournamentStatus,
    isPremium: tournament.entry_fee > 100
  }));
  
  // Format hosted tournaments for display
  const formattedHostedTournaments: TournamentType[] = hostedTournaments.map(tournament => ({
    id: tournament.id,
    title: tournament.name,
    mode: tournament.mode,
    map: tournament.map || "",
    entryFee: tournament.entry_fee,
    prizeMoney: tournament.entry_fee * tournament.max_players,
    date: tournament.start_date,
    time: new Date(tournament.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    totalSpots: tournament.max_players,
    filledSpots: tournament.filled_spots || 0,
    status: tournament.status as TournamentStatus,
    isPremium: tournament.entry_fee > 100
  }));
  
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
  
  // Apply filters to joined tournaments
  let displayedJoinedTournaments = applySearchFilter(applyStatusFilter(formattedJoinedTournaments));
  
  // Apply filters to hosted tournaments
  let displayedHostedTournaments = applySearchFilter(applyStatusFilter(formattedHostedTournaments));
  
  // Apply sorting
  if (sortBy !== "none") {
    const sortTournaments = (tournaments: TournamentType[]) => {
      return [...tournaments].sort((a, b) => {
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
    };
    
    displayedJoinedTournaments = sortTournaments(displayedJoinedTournaments);
    displayedHostedTournaments = sortTournaments(displayedHostedTournaments);
  }
  
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
              Tournaments
            </h1>
            <p className="text-[#A0A0A0] text-sm">Browse, join, and manage tournaments</p>
          </div>
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
      
      {/* Tabs */}
      <Tabs defaultValue="joined-tournaments" className="mt-6" onValueChange={setActiveTab}>
        <TabsList className="mb-4 bg-gaming-card">
          <TabsTrigger value="joined-tournaments">Joined Tournaments</TabsTrigger>
          <TabsTrigger value="hosted-tournaments">Hosted Tournaments</TabsTrigger>
        </TabsList>
        
        {/* Joined Tournaments Tab */}
        <TabsContent value="joined-tournaments">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">
                Joined Tournaments {displayedJoinedTournaments.length > 0 && `(${displayedJoinedTournaments.length})`}
              </h2>
            </div>
            
            {isLoadingJoinedTournaments ? (
              <div className="text-center py-10">
                <p className="text-[#A0A0A0]">Loading your joined tournaments...</p>
              </div>
            ) : displayedJoinedTournaments.length > 0 ? (
              <TournamentList tournaments={displayedJoinedTournaments} />
            ) : searchQuery ? (
              <div className="text-center py-10 bg-gaming-card rounded-lg p-6">
                <h3 className="text-lg font-medium text-white mb-2">No matches found</h3>
                <p className="text-[#A0A0A0] mb-4">Try a different search term or filter</p>
              </div>
            ) : (
              <div className="text-center py-10 bg-gaming-card rounded-lg p-6">
                <h3 className="text-lg font-medium text-white mb-2">No tournaments joined yet</h3>
                <p className="text-[#A0A0A0] mb-4">Start joining tournaments to see them here</p>
                <Link to="/home">
                  <Button className="bg-gaming-primary hover:bg-gaming-primary/90">
                    Browse Tournaments
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </TabsContent>
        
        {/* Hosted Tournaments Tab */}
        <TabsContent value="hosted-tournaments">
          <div className="mb-6">
            {isLoadingHostedTournaments ? (
              <div className="text-center py-10">
                <p className="text-[#A0A0A0]">Loading your tournaments...</p>
              </div>
            ) : displayedHostedTournaments.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white">
                    Hosted Tournaments ({displayedHostedTournaments.length})
                  </h2>
                </div>
                <TournamentList tournaments={displayedHostedTournaments} />
              </>
            ) : searchQuery ? (
              <div className="text-center py-10 bg-gaming-card rounded-lg p-6">
                <h3 className="text-lg font-medium text-white mb-2">No matches found</h3>
                <p className="text-[#A0A0A0] mb-4">Try a different search term or filter</p>
              </div>
            ) : (
              <div className="text-center py-10 bg-gaming-card rounded-lg p-6">
                <h3 className="text-lg font-medium text-white mb-2">No tournaments hosted yet</h3>
                <p className="text-[#A0A0A0] mb-4">Start creating tournaments and manage them here</p>
                <Link to="/tournament/create">
                  <Button className="bg-gaming-primary hover:bg-gaming-primary/90">
                    Create Tournament
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Tournaments; 