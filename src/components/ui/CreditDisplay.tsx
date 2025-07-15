import React from 'react';
import { Coins, CreditCard, ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import { useUserProfile } from "@/hooks/use-user-profile";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface CreditDisplayProps {
  showBuyLink?: boolean;
  variant?: 'horizontal' | 'vertical' | 'compact';
  className?: string;
}

const CreditDisplay = ({
  showBuyLink = true,
  variant = 'horizontal',
  className
}: CreditDisplayProps) => {
  const { currentUser } = useAuth();
  const { user } = useUserProfile();
  const { hostCredits, tournamentCredits, isLoading } = useCreditBalance(currentUser?.uid);

  const isHost = user?.isHost || false;

  // Compact variant (for headers, etc.)
  if (variant === 'compact') {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <div className="flex items-center gap-1">
          <Coins size={14} className="text-gaming-accent" />
          <span className="text-xs font-medium text-gaming-text">
            {isLoading ? "..." : tournamentCredits}
          </span>
        </div>
        {isHost && (
          <div className="flex items-center gap-1">
            <CreditCard size={14} className="text-gaming-primary" />
            <span className="text-xs font-medium text-gaming-text">
              {isLoading ? "..." : hostCredits}
            </span>
          </div>
        )}
        {showBuyLink && (
          <Link
            to="/credits"
            className="text-xs text-gaming-accent hover:text-gaming-accent/80 font-medium"
          >
            +
          </Link>
        )}
      </div>
    );
  }

  // Vertical layout
  if (variant === 'vertical') {
    return (
      <div className={cn("space-y-2", className)}>
        {/* Tournament Credits Row with its own gradient */}
        <div className="relative overflow-hidden rounded-lg">
          <div className="absolute top-0 right-0 w-16 h-16 bg-gaming-accent/10 rounded-full -mr-6 -mt-6 blur-lg pointer-events-none select-none"></div>
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: 0.1 }}
            className="flex items-center justify-between bg-gaming-bg/50 rounded-lg p-2 relative z-10"
          >
            <div className="flex items-center gap-2">
              <Coins size={16} className="text-gaming-accent" />
              <span className="text-sm text-gaming-text">Tournament</span>
            </div>
            <span className="text-sm font-bold text-gaming-accent">
              {isLoading ? "..." : tournamentCredits}
            </span>
          </motion.div>
        </div>
        {/* Host Credits Row with its own gradient */}
        {isHost && (
          <div className="relative overflow-hidden rounded-lg">
            <div className="absolute top-0 left-0 w-16 h-16 bg-gaming-primary/10 rounded-full -ml-6 -mt-6 blur-lg pointer-events-none select-none"></div>
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: 0.15 }}
              className="flex items-center justify-between bg-gaming-bg/50 rounded-lg p-2 relative z-10"
            >
              <div className="flex items-center gap-2">
                <CreditCard size={16} className="text-gaming-primary" />
                <span className="text-sm text-gaming-text">Host</span>
              </div>
              <span className="text-sm font-bold text-gaming-primary">
                {isLoading ? "..." : hostCredits}
              </span>
            </motion.div>
          </div>
        )}
        {/* Buy Credits Button (no gradient) */}
        {showBuyLink && (
          <Link
            to="/credits"
            className="flex items-center gap-2 w-full bg-gaming-accent/20 hover:bg-gaming-accent/30 rounded-lg p-2 transition-colors"
          >
            <ShoppingCart size={16} className="text-gaming-accent" />
            <span className="text-sm font-medium text-gaming-accent">Buy Credits</span>
          </Link>
        )}
      </div>
    );
  }

  // Default horizontal layout
  return (
    <div className={cn("flex items-center", className)}>
      <div className="flex-1 flex items-center gap-3">
        <div className="flex items-center gap-1 bg-gaming-card/50 px-2 py-1 rounded-md">
          <Coins size={14} className="text-gaming-accent" />
          <span className="text-xs font-medium text-gaming-text">
            {isLoading ? "..." : tournamentCredits}
          </span>
          <span className="text-xs text-gaming-muted">Tournament</span>
        </div>
        {isHost && (
          <div className="flex items-center gap-1 bg-gaming-card/50 px-2 py-1 rounded-md">
            <CreditCard size={14} className="text-gaming-primary" />
            <span className="text-xs font-medium text-gaming-text">
              {isLoading ? "..." : hostCredits}
            </span>
            <span className="text-xs text-gaming-muted">Host</span>
          </div>
        )}
      </div>
      {showBuyLink && (
        <Link
          to="/credits"
          className="text-xs text-gaming-accent hover:text-gaming-accent/80 font-medium"
        >
          Buy Credits
        </Link>
      )}
    </div>
  );
};

export default CreditDisplay; 