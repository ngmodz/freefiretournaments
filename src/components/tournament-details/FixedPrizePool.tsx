import React from "react";
import { Card } from "@/components/ui/card";
import { Tournament } from "@/lib/tournamentService";
import { Trophy } from "lucide-react";

interface FixedPrizePoolProps {
  tournament: Tournament;
}

const FixedPrizePool: React.FC<FixedPrizePoolProps> = ({ tournament }) => {
  const totalPrize = (tournament.manual_prize_pool?.first || 0) + 
                     (tournament.manual_prize_pool?.second || 0) + 
                     (tournament.manual_prize_pool?.third || 0);

  return (
    <Card className="bg-gradient-to-b from-gaming-card to-gaming-bg text-gaming-text rounded-lg shadow-lg border border-gaming-primary/20 overflow-hidden backdrop-blur-sm relative">
      <div className="absolute top-0 right-0 w-32 h-32 -mr-10 -mt-10 rounded-full bg-gaming-primary/5 blur-xl"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 -ml-8 -mb-8 rounded-full bg-gaming-accent/5 blur-lg"></div>
      <div className="p-4 relative z-10">
        <h3 className="font-semibold mb-3 flex items-center"><Trophy size={18} className="mr-2 text-gaming-accent"/> Fixed Prize Pool</h3>
        <div className="space-y-2 mt-4 text-sm">
          {tournament.manual_prize_pool?.first > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-gray-400">1st Place</span>
              <span className="font-bold text-white">{tournament.manual_prize_pool.first.toLocaleString()} credits</span>
            </div>
          )}
          {tournament.manual_prize_pool?.second > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-gray-400">2nd Place</span>
              <span className="font-bold text-white">{tournament.manual_prize_pool.second.toLocaleString()} credits</span>
            </div>
          )}
          {tournament.manual_prize_pool?.third > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-gray-400">3rd Place</span>
              <span className="font-bold text-white">{tournament.manual_prize_pool.third.toLocaleString()} credits</span>
            </div>
          )}
        </div>
        <p className="text-xs text-gaming-muted mt-4 text-center">This prize pool is funded by the host.</p>
      </div>
    </Card>
  );
};

export default FixedPrizePool; 