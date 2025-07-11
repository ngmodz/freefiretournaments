import React from "react";
import { Clock, AlertTriangle } from "lucide-react";
import { TournamentCleanupService } from "@/lib/tournamentCleanupService";
import { hasTournamentReachedScheduledTime } from "@/lib/tournamentTimeUtils";

interface TournamentCountdownProps {
  ttl?: any;
  startDate?: string;
  className?: string;
  showIcon?: boolean;
  showWarning?: boolean;
}

const TournamentCountdown: React.FC<TournamentCountdownProps> = ({ 
  ttl, 
  startDate,
  className = "", 
  showIcon = true, 
  showWarning = true 
}) => {
  const [timeRemaining, setTimeRemaining] = React.useState<string>("");
  const [isExpired, setIsExpired] = React.useState(false);
  const [isWarning, setIsWarning] = React.useState(false);
  const [tournamentStarted, setTournamentStarted] = React.useState(false);

  React.useEffect(() => {
    if (!ttl) return;

    const updateCountdown = () => {
      const now = new Date();
      const deletionTime = new Date(ttl);
      
      // TTL can now be set automatically when tournament reaches scheduled start time
      // or when host manually starts the tournament
      
      const timeDiff = deletionTime.getTime() - now.getTime();

      if (timeDiff <= 0) {
        setTimeRemaining("Expired");
        setIsExpired(true);
        setIsWarning(false);
        setTournamentStarted(true);
        
        // Trigger immediate cleanup when tournament expires
        TournamentCleanupService.deleteExpiredTournaments().catch(console.error);
        
        return;
      }

      // Tournament has TTL, so it has either been started by host or reached scheduled time
      setTournamentStarted(true);

      // Calculate time components
      const hours = Math.floor(timeDiff / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

      // Format time string
      let timeString = "";
      if (hours > 0) {
        timeString += `${hours}h `;
      }
      if (minutes > 0) {
        timeString += `${minutes}m `;
      }
      if (seconds > 0 || (hours === 0 && minutes === 0)) {
        timeString += `${seconds}s`;
      }

      setTimeRemaining(timeString.trim());
      setIsExpired(false);

      // Set warning if less than 30 minutes remaining
      setIsWarning(timeDiff < 30 * 60 * 1000);
      
      // Trigger ultra-aggressive cleanup when tournament is about to expire (within 30 seconds)
      if (timeDiff <= 30 * 1000) {
        TournamentCleanupService.startUltraAggressiveCleanup();
      }
      
      // Trigger immediate cleanup when tournament is about to expire (within 10 seconds)
      if (timeDiff <= 10 * 1000) {
        TournamentCleanupService.deleteExpiredTournaments().catch(console.error);
      }
    };

    // Initial update
    updateCountdown();

    // Update every second
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [ttl, startDate]);

  if (!ttl) return null;

  const getTextColor = () => {
    if (isExpired) return "text-red-500";
    if (isWarning) return "text-yellow-500";
    if (!tournamentStarted) return "text-blue-400";
    return "text-gray-400";
  };

  const getIcon = () => {
    if (isExpired && showWarning) return <AlertTriangle size={14} className="mr-1" />;
    if (showIcon) return <Clock size={14} className="mr-1" />;
    return null;
  };

  const getDisplayText = () => {
    if (!ttl) return "No expiration set";
    if (isExpired) return "Expired";
    if (tournamentStarted) return `Auto-delete in ${timeRemaining}`;
    return "Tournament not started by host";
  };

  return (
    <div className={`flex items-center ${getTextColor()} ${className}`}>
      {getIcon()}
      <span className="text-xs">
        {getDisplayText()}
      </span>
    </div>
  );
};

export default TournamentCountdown;
