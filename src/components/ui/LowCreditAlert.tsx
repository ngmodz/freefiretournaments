import React, { useState, useEffect } from 'react';
import { AlertCircle, Coins, CreditCard, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

interface LowCreditAlertProps {
  threshold?: {
    tournament: number;
    host: number;
  };
  className?: string;
}

const LowCreditAlert = ({
  threshold = { tournament: 50, host: 2 },
  className
}: LowCreditAlertProps) => {
  const { currentUser } = useAuth();
  const { hostCredits, tournamentCredits, isLoading } = useCreditBalance(currentUser?.uid);
  const [show, setShow] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  const isMobile = useIsMobile();

  useEffect(() => {
    // Only show alert if not loading, not on mobile, and credits are below threshold
    if (!isLoading && !isMobile) {
      const lowTournamentCredits = tournamentCredits < threshold.tournament;
      const lowHostCredits = hostCredits < threshold.host;
      
      // Create unique IDs for each alert type to track dismissals
      const tournamentAlertId = `tournament-${threshold.tournament}`;
      const hostAlertId = `host-${threshold.host}`;
      
      // Check if either credit type is low and not dismissed
      const shouldShowAlert = 
        (lowTournamentCredits && !dismissedAlerts.includes(tournamentAlertId)) || 
        (lowHostCredits && !dismissedAlerts.includes(hostAlertId));
      
      setShow(shouldShowAlert);
    } else if (isMobile) {
      // Always hide on mobile
      setShow(false);
    }
  }, [tournamentCredits, hostCredits, isLoading, threshold, dismissedAlerts, isMobile]);

  // Close the entire alert popup
  const handleCloseAlert = () => {
    setShow(false);
    
    // Dismiss all current alerts
    const alertIds = [];
    if (tournamentCredits < threshold.tournament) {
      alertIds.push(`tournament-${threshold.tournament}`);
    }
    if (hostCredits < threshold.host) {
      alertIds.push(`host-${threshold.host}`);
    }
    
    setDismissedAlerts(prev => [...prev, ...alertIds]);
    
    // Store in localStorage
    try {
      const stored = localStorage.getItem('dismissedCreditAlerts');
      const storedAlerts = stored ? JSON.parse(stored) : [];
      localStorage.setItem('dismissedCreditAlerts', 
        JSON.stringify([...storedAlerts, ...alertIds])
      );
    } catch (e) {
      console.error('Error storing dismissed alerts:', e);
    }
  };

  // Don't render if not showing, still loading, or on mobile
  if (!show || isLoading || isMobile) return null;

  const lowTournamentCredits = tournamentCredits < threshold.tournament;
  const lowHostCredits = hostCredits < threshold.host;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 right-4 z-50 w-80"
        >
          <div className="bg-gaming-card border border-gaming-border rounded-lg shadow-lg p-4">
            {/* Close button at the top */}
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gaming-text flex items-center">
                <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
                Low Credits Alert
              </h3>
              <button 
                onClick={handleCloseAlert}
                className="text-gaming-muted hover:text-gaming-text focus:outline-none"
                aria-label="Close alert"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mt-2 space-y-2 text-sm text-gaming-muted">
              {lowTournamentCredits && (
                <div className="flex items-center">
                  <Coins className="h-4 w-4 text-gaming-accent mr-1" />
                  <p>You're running low on Tournament Credits ({tournamentCredits})</p>
                </div>
              )}
              
              {lowHostCredits && (
                <div className="flex items-center">
                  <CreditCard className="h-4 w-4 text-gaming-primary mr-1" />
                  <p>You're running low on Host Credits ({hostCredits})</p>
                </div>
              )}
            </div>
            
            <div className="mt-4">
              <Link to="/credits">
                <Button 
                  size="sm" 
                  className="w-full bg-gaming-accent hover:bg-gaming-accent/90"
                >
                  Buy Credits
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LowCreditAlert; 