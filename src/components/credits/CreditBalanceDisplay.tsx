import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Coins, CreditCard } from "lucide-react";
import { motion } from "framer-motion";

interface CreditBalanceDisplayProps {
  tournamentCredits: number;
  hostCredits: number;
  isLoading: boolean;
  showHostCredits?: boolean;
}

const CreditBalanceDisplay: React.FC<CreditBalanceDisplayProps> = ({
  tournamentCredits,
  hostCredits,
  isLoading,
  showHostCredits = true,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className={`grid gap-4 mb-8 ${showHostCredits ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 max-w-md mx-auto'}`}
    >
      {/* Tournament Credits Card */}
      <Card className="bg-gradient-to-r from-gaming-accent/10 to-orange-500/10 border-gaming-accent/30">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-gaming-accent/10">
                <Coins className="h-6 w-6 sm:h-8 sm:w-8 text-gaming-accent" />
              </div>
              <div>
                <p className="text-sm text-gaming-muted">Tournament Credits</p>
                <p className="text-xl sm:text-2xl font-bold">
                  {isLoading ? (
                    <span className="inline-block w-12 h-6 bg-gaming-muted/20 animate-pulse rounded"></span>
                  ) : (
                    tournamentCredits
                  )}
                </p>
              </div>
            </div>
            <div className="text-xs sm:text-sm text-gaming-muted hidden sm:block">
              For joining tournaments
            </div>
          </div>
          <div className="mt-2 text-xs text-gaming-muted sm:hidden">
            For joining tournaments
          </div>
        </CardContent>
      </Card>

      {/* Host Credits Card - Only for verified hosts */}
      {showHostCredits && (
        <Card className="bg-gradient-to-r from-gaming-primary/10 to-blue-600/10 border-gaming-primary/30">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-gaming-primary/10">
                  <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 text-gaming-primary" />
                </div>
                <div>
                  <p className="text-sm text-gaming-muted">Host Credits</p>
                  <p className="text-xl sm:text-2xl font-bold">
                    {isLoading ? (
                      <span className="inline-block w-12 h-6 bg-gaming-muted/20 animate-pulse rounded"></span>
                    ) : (
                      hostCredits
                    )}
                  </p>
                </div>
              </div>
              <div className="text-xs sm:text-sm text-gaming-muted hidden sm:block">
                For creating tournaments
              </div>
            </div>
            <div className="mt-2 text-xs text-gaming-muted sm:hidden">
              For creating tournaments
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
};

export default CreditBalanceDisplay; 