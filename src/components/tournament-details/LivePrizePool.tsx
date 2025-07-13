import React from "react";
import { Tournament } from "@/lib/tournamentService";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins, Users, Trophy, TrendingUp } from "lucide-react";

interface LivePrizePoolProps {
  tournament: Tournament;
}

const LivePrizePool: React.FC<LivePrizePoolProps> = ({ tournament }) => {
  const {
    entry_fee,
    max_players,
    filled_spots,
    currentPrizePool,
    prize_distribution
  } = tournament;

  // Calculate pools
  const expectedPrizePool = entry_fee * max_players;
  const actualPrizePool = currentPrizePool || 0;
  const collectionPercentage = expectedPrizePool > 0 ? (actualPrizePool / expectedPrizePool) * 100 : 0;

  // Calculate percentage-based prizes from actual pool
  const prizeEntries = Object.entries(prize_distribution || {});
  const totalPrizePercentage = prizeEntries.reduce((sum, [_, percentage]) => sum + percentage, 0);
  const hostEarningsPercentage = Math.max(0, 100 - totalPrizePercentage);

  // Calculate actual credit amounts
  const prizeCalculations = prizeEntries.map(([position, percentage]) => ({
    position,
    percentage,
    credits: Math.floor((percentage / 100) * actualPrizePool)
  }));

  const totalDistributedToWinners = prizeCalculations.reduce((sum, p) => sum + p.credits, 0);
  const hostEarningsCredits = actualPrizePool - totalDistributedToWinners;

  return (
    <Card className="bg-gradient-to-br from-gaming-card to-gaming-bg border-gaming-primary/20 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-gaming-accent">
          <Coins className="h-5 w-5" />
          Live Prize Pool
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Prize Pool Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Prize Pool Collection</span>
            <span className="text-white font-medium">
              {actualPrizePool} / {expectedPrizePool} credits
            </span>
          </div>
          <Progress 
            value={collectionPercentage} 
            className="h-3 bg-gaming-bg"
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {filled_spots}/{max_players} players
            </span>
            <span>{Math.round(collectionPercentage)}% collected</span>
          </div>
        </div>

        {/* Prize Distribution */}
        <div className="space-y-3 pt-2">
          <h4 className="text-sm font-semibold text-gaming-accent flex items-center gap-1">
            <Trophy className="h-4 w-4" />
            Prize Distribution
          </h4>
          
          {prizeCalculations.map(({ position, percentage, credits }) => (
            <div key={position} className="flex justify-between items-center p-2 bg-gaming-bg/30 rounded-lg border border-gaming-primary/10">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white">{position}</span>
                <span className="text-xs text-gaming-accent font-semibold">{percentage}%</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-gaming-primary">{credits} credits</div>
                <div className="text-xs text-gray-400">
                  {percentage}% of {actualPrizePool}
                </div>
              </div>
            </div>
          ))}

          {/* Host Earnings */}
          {hostEarningsPercentage > 0 && (
            <div className="flex justify-between items-center p-2 bg-green-900/20 rounded-lg border border-green-400/20">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-green-300">Host Earnings</span>
                <span className="text-xs text-green-400 font-semibold">{hostEarningsPercentage}%</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-green-400">{hostEarningsCredits} credits</div>
                <div className="text-xs text-gray-400">
                  Remaining pool balance
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Live Updates Indicator */}
        <div className="flex items-center justify-center gap-2 pt-2 text-xs text-gray-400 border-t border-gaming-primary/10">
          <TrendingUp className="h-3 w-3 text-gaming-accent" />
          <span>Updates live as players join</span>
        </div>

        {/* Full Tournament Potential */}
        {collectionPercentage < 100 && (
          <div className="mt-3 p-3 bg-gaming-accent/10 rounded-lg border border-gaming-accent/20">
            <h5 className="text-xs font-semibold text-gaming-accent mb-2">With Full Tournament:</h5>
            <div className="space-y-1 text-xs">
              {prizeCalculations.map(({ position, percentage }) => (
                <div key={position} className="flex justify-between">
                  <span className="text-gray-400">{position}: {percentage}%</span>
                  <span className="text-gaming-accent font-medium">
                    {Math.floor((percentage / 100) * expectedPrizePool)} credits
                  </span>
                </div>
              ))}
              {hostEarningsPercentage > 0 && (
                <div className="flex justify-between border-t border-gaming-accent/20 pt-1">
                  <span className="text-gray-400">Host: {hostEarningsPercentage}%</span>
                  <span className="text-green-400 font-medium">
                    {Math.floor((hostEarningsPercentage / 100) * expectedPrizePool)} credits
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LivePrizePool;
