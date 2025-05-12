import React from "react";
import { Trophy } from "lucide-react";
import { Tournament } from "@/lib/tournamentService";

interface PrizesTabProps {
  tournament: Tournament;
}

// Helper function to sort positions
const sortPositions = (a: string, b: string): number => {
  // Convert ordinal positions to numbers for sorting
  const positionToNumber = (pos: string): number => {
    if (pos.match(/^1st|First$/i)) return 1;
    if (pos.match(/^2nd|Second$/i)) return 2;
    if (pos.match(/^3rd|Third$/i)) return 3;
    
    // Extract numbers from strings like '4th', '5th', etc.
    const match = pos.match(/^(\d+)/);
    if (match) {
      return parseInt(match[1], 10);
    }
    
    // Default case: use lexicographical ordering
    return Number.MAX_SAFE_INTEGER;
  };
  
  return positionToNumber(a) - positionToNumber(b);
};

const PrizesTab: React.FC<PrizesTabProps> = ({ tournament }) => {
  // Sort prizes by position
  const sortedPrizes = Object.entries(tournament.prize_distribution || {})
    .filter(([_, percentage]) => percentage > 0) // Only include positions with prize > 0
    .sort(([posA], [posB]) => sortPositions(posA, posB));
    
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Prize Distribution</h2>
      <div className="space-y-4">
        {sortedPrizes.map(([position, percentage], index) => {
          const prizeAmount = (tournament.entry_fee * tournament.max_players * (percentage / 100)).toFixed(2);
          return (
            <div 
              key={position} 
              className={`flex items-center justify-between p-4 rounded-md border ${
                index === 0 
                  ? "bg-yellow-500/10 border-yellow-500/30" 
                  : index === 1 
                    ? "bg-gray-400/10 border-gray-400/30" 
                    : index === 2 
                      ? "bg-amber-700/10 border-amber-700/30" 
                      : "bg-gaming-card border-gaming-border"
              }`}
            >
              <div className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                  index === 0 ? "bg-yellow-500/20" : index === 1 ? "bg-gray-400/20" : index === 2 ? "bg-amber-700/20" : "bg-gaming-muted/20"
                }`}>
                  <Trophy size={20} className={
                    index === 0 ? "text-yellow-500" : index === 1 ? "text-gray-400" : index === 2 ? "text-amber-700" : "text-gaming-muted"
                  } />
                </div>
                <div>
                  <div className="text-sm text-gaming-muted">
                    {position} Place ({percentage}%)
                  </div>
                  <div className="font-bold text-lg">
                    ₹{prizeAmount}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {Object.keys(tournament.prize_distribution || {}).length === 0 && (
          <p className="text-gaming-muted">Prize distribution details not available.</p>
        )}
      </div>
    </div>
  );
};

export default PrizesTab; 