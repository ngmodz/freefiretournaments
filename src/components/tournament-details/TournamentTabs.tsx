import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TournamentTabsProps } from "./types";
import InfoTab from "./InfoTab";
import RulesTab from "./RulesTab";
import PrizesTab from "./PrizesTab";
import RoomDetailsTab from "./RoomDetailsTab";
import ResultsTab from "./ResultsTab";

const TournamentTabs: React.FC<TournamentTabsProps> = ({
  tournament,
  isHost,
  onSetRoomDetails,
  onCopy
}) => {
  return (
    <Tabs defaultValue="info" className="w-full">
      <TabsList className="bg-gaming-card">
        <TabsTrigger value="info">Information</TabsTrigger>
        <TabsTrigger value="rules">Rules</TabsTrigger>
        <TabsTrigger value="prizes">Prizes</TabsTrigger>
        {(tournament.status === 'active' || tournament.status === 'ongoing') && (
          <TabsTrigger value="room">Room Details</TabsTrigger>
        )}
        {tournament.status === 'completed' && (
          <TabsTrigger value="results">Results</TabsTrigger>
        )}
      </TabsList>
      
      <TabsContent value="info" className="bg-gaming-card p-4 rounded-md mt-4">
        <InfoTab tournament={tournament} />
      </TabsContent>
      
      <TabsContent value="rules" className="bg-gaming-card p-4 rounded-md mt-4">
        <RulesTab tournament={tournament} />
      </TabsContent>
      
      <TabsContent value="prizes" className="bg-gaming-card p-4 rounded-md mt-4">
        <PrizesTab tournament={tournament} />
      </TabsContent>
      
      {(tournament.status === 'active' || tournament.status === 'ongoing') && (
        <TabsContent value="room" className="bg-gaming-card p-4 rounded-md mt-4">
          <RoomDetailsTab 
            tournament={tournament}
            isHost={isHost}
            onSetRoomDetails={onSetRoomDetails}
            onCopy={onCopy}
          />
        </TabsContent>
      )}
      
      {tournament.status === 'completed' && (
        <TabsContent value="results" className="bg-gaming-card p-4 rounded-md mt-4">
          <ResultsTab tournament={tournament} />
        </TabsContent>
      )}
    </Tabs>
  );
};

export default TournamentTabs; 