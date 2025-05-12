import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import TournamentFilters from "@/components/home/TournamentFilters";
import TournamentList from "@/components/home/TournamentList";
import { TournamentType } from "@/components/home/types";
import { getTournaments } from "@/lib/tournamentService";

const Index = () => {
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("none");
  const [tournaments, setTournaments] = useState<TournamentType[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Fetch tournaments from Firebase
  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        setLoading(true);
        const fetchedTournaments = await getTournaments();
        
        // Convert Firebase tournament data to the format expected by the UI components
        const formattedTournaments: TournamentType[] = fetchedTournaments.map(tournament => ({
          id: tournament.id,
          title: tournament.name,
          mode: tournament.mode,
          entryFee: tournament.entry_fee,
          prizeMoney: tournament.entry_fee * tournament.max_players,
          date: tournament.start_date,
          time: new Date(tournament.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          totalSpots: tournament.max_players,
          filledSpots: tournament.filled_spots || 0,
          status: tournament.status === 'active' ? 'active' : 
                  tournament.status === 'ongoing' ? 'ongoing' : 
                  tournament.status === 'completed' ? 'completed' : 'active',
          isPremium: tournament.entry_fee > 100 // Just an example condition for premium
        }));
        
        setTournaments(formattedTournaments);
      } catch (error) {
        console.error("Error fetching tournaments:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTournaments();
  }, []);
  
  // Apply filters and sorting
  let displayedTournaments = filter === "all" ? tournaments : tournaments.filter(tournament => {
    if (filter === "active") return tournament.status === 'active';
    if (filter === "ongoing") return tournament.status === 'ongoing';
    if (filter === "completed") return tournament.status === 'completed';
    return true;
  });
  
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
      />
      
      {/* Tournament List */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">All Tournaments</h2>
        </div>
        
        {loading ? (
          <div className="text-center py-10">
            <p className="text-[#A0A0A0]">Loading tournaments...</p>
          </div>
        ) : (
          <TournamentList tournaments={displayedTournaments} />
        )}
      </div>
    </div>
  );
};

export default Index;
