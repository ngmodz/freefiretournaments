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
      <TabsList className="bg-gradient-to-b from-gaming-card to-gaming-bg rounded-full flex justify-center items-center px-1 py-1 shadow-md border border-gaming-primary/20 overflow-hidden backdrop-blur-sm relative">
        <div className="absolute top-0 right-0 w-32 h-32 -mr-10 -mt-10 rounded-full bg-gaming-primary/5 blur-xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 -ml-8 -mb-8 rounded-full bg-gaming-accent/5 blur-lg"></div>
        <div className="relative z-10 flex w-full justify-center">
          <TabsTrigger value="info" className="transition-all duration-200 rounded-full px-3 py-1 text-sm sm:px-5 sm:py-2 sm:text-base font-semibold data-[state=active]:bg-gaming-primary data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:ring-2 data-[state=active]:ring-gaming-primary/60 data-[state=active]:ring-offset-2 data-[state=inactive]:text-[#A0A0A0] focus:outline-none">
            Information
          </TabsTrigger>
          <TabsTrigger value="rules" className="transition-all duration-200 rounded-full px-3 py-1 text-sm sm:px-5 sm:py-2 sm:text-base font-semibold data-[state=active]:bg-gaming-primary data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:ring-2 data-[state=active]:ring-gaming-primary/60 data-[state=active]:ring-offset-2 data-[state=inactive]:text-[#A0A0A0] focus:outline-none">
            Rules
          </TabsTrigger>
          <TabsTrigger value="prizes" className="transition-all duration-200 rounded-full px-3 py-1 text-sm sm:px-5 sm:py-2 sm:text-base font-semibold data-[state=active]:bg-gaming-primary data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:ring-2 data-[state=active]:ring-gaming-primary/60 data-[state=active]:ring-offset-2 data-[state=inactive]:text-[#A0A0A0] focus:outline-none">
            Prizes
          </TabsTrigger>
          {(tournament.status === 'active' || tournament.status === 'ongoing') && (
            <TabsTrigger value="room" className="transition-all duration-200 rounded-full px-3 py-1 text-sm sm:px-5 sm:py-2 sm:text-base font-semibold data-[state=active]:bg-gaming-primary data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:ring-2 data-[state=active]:ring-gaming-primary/60 data-[state=active]:ring-offset-2 data-[state=inactive]:text-[#A0A0A0] focus:outline-none">
              Room Details
            </TabsTrigger>
          )}
          {tournament.status === 'completed' && (
            <TabsTrigger value="results" className="transition-all duration-200 rounded-full px-3 py-1 text-sm sm:px-5 sm:py-2 sm:text-base font-semibold data-[state=active]:bg-gaming-primary data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:ring-2 data-[state=active]:ring-gaming-primary/60 data-[state=active]:ring-offset-2 data-[state=inactive]:text-[#A0A0A0] focus:outline-none">
              Results
            </TabsTrigger>
          )}
        </div>
      </TabsList>
      
      <TabsContent value="info" className="bg-gradient-to-b from-gaming-card to-gaming-bg text-gaming-text rounded-lg shadow-lg border border-gaming-primary/20 overflow-hidden backdrop-blur-sm p-4 mt-4 relative">
        <div className="absolute top-0 right-0 w-32 h-32 -mr-10 -mt-10 rounded-full bg-gaming-primary/5 blur-xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 -ml-8 -mb-8 rounded-full bg-gaming-accent/5 blur-lg"></div>
        <div className="relative z-10">
          <InfoTab tournament={tournament} />
        </div>
      </TabsContent>
      
      <TabsContent value="rules" className="bg-gradient-to-b from-gaming-card to-gaming-bg text-gaming-text rounded-lg shadow-lg border border-gaming-primary/20 overflow-hidden backdrop-blur-sm p-4 mt-4 relative">
        <div className="absolute top-0 right-0 w-32 h-32 -mr-10 -mt-10 rounded-full bg-gaming-primary/5 blur-xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 -ml-8 -mb-8 rounded-full bg-gaming-accent/5 blur-lg"></div>
        <div className="relative z-10">
          <RulesTab tournament={tournament} />
        </div>
      </TabsContent>
      
      <TabsContent value="prizes" className="bg-gradient-to-b from-gaming-card to-gaming-bg text-gaming-text rounded-lg shadow-lg border border-gaming-primary/20 overflow-hidden backdrop-blur-sm p-4 mt-4 relative">
        <div className="absolute top-0 right-0 w-32 h-32 -mr-10 -mt-10 rounded-full bg-gaming-primary/5 blur-xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 -ml-8 -mb-8 rounded-full bg-gaming-accent/5 blur-lg"></div>
        <div className="relative z-10">
          <PrizesTab tournament={tournament} />
        </div>
      </TabsContent>
      
      {(tournament.status === 'active' || tournament.status === 'ongoing') && (
        <TabsContent value="room" className="bg-gradient-to-b from-gaming-card to-gaming-bg text-gaming-text rounded-lg shadow-lg border border-gaming-primary/20 overflow-hidden backdrop-blur-sm p-4 mt-4 relative">
          <div className="absolute top-0 right-0 w-32 h-32 -mr-10 -mt-10 rounded-full bg-gaming-primary/5 blur-xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 -ml-8 -mb-8 rounded-full bg-gaming-accent/5 blur-lg"></div>
          <div className="relative z-10">
            <RoomDetailsTab 
              tournament={tournament}
              isHost={isHost}
              onSetRoomDetails={onSetRoomDetails}
              onCopy={onCopy}
            />
          </div>
        </TabsContent>
      )}
      
      {tournament.status === 'completed' && (
        <TabsContent value="results" className="bg-gradient-to-b from-gaming-card to-gaming-bg text-gaming-text rounded-lg shadow-lg border border-gaming-primary/20 overflow-hidden backdrop-blur-sm p-4 mt-4 relative">
          <div className="absolute top-0 right-0 w-32 h-32 -mr-10 -mt-10 rounded-full bg-gaming-primary/5 blur-xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 -ml-8 -mb-8 rounded-full bg-gaming-accent/5 blur-lg"></div>
          <div className="relative z-10">
            <ResultsTab tournament={tournament} />
          </div>
        </TabsContent>
      )}
    </Tabs>
  );
};

export default TournamentTabs; 