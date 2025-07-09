import React from 'react';
import { motion } from 'framer-motion';

interface TournamentStatusBadgeProps {
  status: "active" | "ongoing" | "ended" | "completed" | "cancelled";
  className?: string;
}

const TournamentStatusBadge: React.FC<TournamentStatusBadgeProps> = ({ 
  status, 
  className = "" 
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case "active":
        return {
          text: "UPCOMING",
          bgColor: "bg-gradient-to-r from-blue-500/80 to-blue-700/80",
          textColor: "text-white",
          borderColor: "border-blue-500 border",
          shouldBlink: false,
          shadow: "shadow-md shadow-blue-500/20"
        };
      case "ongoing":
        return {
          text: "LIVE",
          bgColor: "bg-gradient-to-r from-red-500/80 to-red-700/80",
          textColor: "text-white",
          borderColor: "border-red-500 border",
          shouldBlink: true,
          shadow: "shadow-md shadow-red-500/30"
        };
      case "ended":
        return {
          text: "ENDED",
          bgColor: "bg-red-600",
          textColor: "text-white",
          borderColor: "border-red-700 border-2",
          shouldBlink: false
        };
      case "completed":
        return {
          text: "COMPLETED",
          bgColor: "bg-green-500/20",
          textColor: "text-green-400",
          borderColor: "border-green-500/40",
          shouldBlink: false
        };
      case "cancelled":
        return {
          text: "CANCELLED",
          bgColor: "bg-gray-500/20",
          textColor: "text-gray-400",
          borderColor: "border-gray-500/40",
          shouldBlink: false
        };
      default:
        return {
          text: "UNKNOWN",
          bgColor: "bg-gray-500/20",
          textColor: "text-gray-400",
          borderColor: "border-gray-500/40",
          shouldBlink: false
        };
    }
  };

  const config = getStatusConfig();

  const BlinkingBadge = () => (
    <motion.div
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold border ${config.bgColor} ${config.textColor} ${config.borderColor} ${config.shadow || ""} ${className}`}
      animate={config.shouldBlink ? {
        opacity: [1, 0.3, 1],
        scale: [1, 1.05, 1],
      } : {}}
      transition={config.shouldBlink ? {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      } : {}}
    >
      {config.shouldBlink && (
        <div className="w-2 h-2 bg-white/80 rounded-full mr-1.5 animate-pulse shadow shadow-red-500/40" />
      )}
      {config.text}
    </motion.div>
  );

  const StaticBadge = () => (
    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold border ${config.bgColor} ${config.textColor} ${config.borderColor} ${className}`}>
      {config.text}
    </div>
  );

  return config.shouldBlink ? <BlinkingBadge /> : <StaticBadge />;
};

export default TournamentStatusBadge;
