import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import TournamentActivityList from "@/components/profile/TournamentActivityList";
import { 
  getTournaments, 
  Tournament 
} from "@/lib/tournamentService";
import { auth } from "@/lib/firebase";

interface ProfileTabsProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeFilter: string | null;
  handleFilterChange: (filter: string | null) => void;
  getFilteredTournaments: (tournaments: any[]) => any[];
}

const ProfileTabs = ({
  searchQuery,
  setSearchQuery,
  activeFilter,
  handleFilterChange,
  getFilteredTournaments
}: ProfileTabsProps) => {
  const [joinedTournaments, setJoinedTournaments] = useState<Tournament[]>([]);
  const [hostedTournaments, setHostedTournaments] = useState<Tournament[]>([]);
  const [winnings, setWinnings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTournaments = async () => {
      try {
        setLoading(true);
        const allTournaments = await getTournaments();
        const currentUser = auth.currentUser;
        
        if (currentUser) {
          // Filter joined tournaments (where user is a participant)
          const joined = allTournaments.filter(tournament => 
            tournament.participants && tournament.participants.includes(currentUser.uid)
          );
          
          // Transform joined tournaments to include the correct prize money calculation
          const joinedTransformed = joined.map(tournament => ({
            ...tournament,
            prizeMoney: tournament.entry_fee * tournament.max_players
          }));
          setJoinedTournaments(joinedTransformed);
          
          // Filter hosted tournaments (where user is the host)
          const hosted = allTournaments.filter(tournament => 
            tournament.host_id === currentUser.uid
          );
          
          // Transform hosted tournaments to include the correct prize money calculation
          const hostedTransformed = hosted.map(tournament => ({
            ...tournament,
            prizeMoney: tournament.entry_fee * tournament.max_players
          }));
          setHostedTournaments(hostedTransformed);
          
          // Filter winnings (tournaments where user participated and has a position)
          // Note: This is a simplified version, as we don't have a dedicated winnings collection yet
          const userWinnings = joined
            .filter(tournament => tournament.status === "completed")
            .map(tournament => ({
              id: tournament.id,
              title: tournament.name,
              date: tournament.start_date,
              prize: (tournament.entry_fee * tournament.max_players) * 
                (tournament.prize_distribution ? 
                 Object.values(tournament.prize_distribution)[0] / 100 : 0),
              position: 1 // Placeholder - in a real app, would come from a results collection
            }));
          setWinnings(userWinnings);
        }
      } catch (error) {
        console.error("Error fetching tournaments:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTournaments();
  }, []);

  return (
    <Tabs defaultValue="joined" className="w-full">
      <div className="flex flex-col gap-4">
        {/* TabsList - Modified to fit in one frame without scrolling */}
        <TabsList className="bg-[#111827] w-full grid grid-cols-3 p-1">
          <TabsTrigger 
            value="joined" 
            className="data-[state=active]:bg-[#1E3A8A] data-[state=active]:text-white text-[#A0AEC0] text-xs sm:text-sm"
          >
            Joined
          </TabsTrigger>
          <TabsTrigger 
            value="hosted" 
            className="data-[state=active]:bg-[#1E3A8A] data-[state=active]:text-white text-[#A0AEC0] text-xs sm:text-sm"
          >
            Hosted
          </TabsTrigger>
          <TabsTrigger 
            value="winnings" 
            className="data-[state=active]:bg-[#1E3A8A] data-[state=active]:text-white text-[#A0AEC0] text-xs sm:text-sm"
          >
            Winnings
          </TabsTrigger>
        </TabsList>
        
        {/* Search and filter section */}
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[#A0AEC0]" />
          <Input
            placeholder="Search tournaments..."
            className="pl-9 bg-[#111827] border-gaming-border text-white w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 mb-2 flex-wrap">
          <Badge 
            onClick={() => handleFilterChange('active')}
            className={`cursor-pointer ${activeFilter === 'active' 
              ? 'bg-blue-600 hover:bg-blue-700' 
              : 'bg-[#111827] hover:bg-[#374151] text-[#A0AEC0]'}`}
          >
            Active
          </Badge>
          <Badge 
            onClick={() => handleFilterChange('ongoing')}
            className={`cursor-pointer ${activeFilter === 'ongoing' 
              ? 'bg-gaming-accent hover:bg-gaming-accent/90' 
              : 'bg-[#111827] hover:bg-[#374151] text-[#A0AEC0]'}`}
          >
            Ongoing
          </Badge>
          <Badge 
            onClick={() => handleFilterChange('completed')}
            className={`cursor-pointer ${activeFilter === 'completed' 
              ? 'bg-gray-600 hover:bg-gray-700' 
              : 'bg-[#111827] hover:bg-[#374151] text-[#A0AEC0]'}`}
          >
            Completed
          </Badge>
          {activeFilter && (
            <Badge 
              onClick={() => handleFilterChange(null)}
              variant="destructive"
              className="cursor-pointer"
            >
              Clear Filter
            </Badge>
          )}
        </div>
      </div>

      <TabsContent value="joined" className="mt-4">
        {loading ? (
          <div className="text-center text-white py-4">Loading tournaments...</div>
        ) : (
          <TournamentActivityList 
            tournaments={getFilteredTournaments(joinedTournaments)} 
            type="joined"
          />
        )}
      </TabsContent>
      
      <TabsContent value="hosted" className="mt-4">
        {loading ? (
          <div className="text-center text-white py-4">Loading tournaments...</div>
        ) : (
          <TournamentActivityList 
            tournaments={getFilteredTournaments(hostedTournaments)} 
            type="hosted"
          />
        )}
      </TabsContent>
      
      <TabsContent value="winnings" className="mt-4">
        {loading ? (
          <div className="text-center text-white py-4">Loading tournaments...</div>
        ) : (
          <TournamentActivityList 
            tournaments={getFilteredTournaments(winnings)} 
            type="winnings"
          />
        )}
      </TabsContent>
    </Tabs>
  );
};

export default ProfileTabs;
