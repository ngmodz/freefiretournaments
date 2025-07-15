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
    const updateCountdown = () => {
      const now = new Date();
      
      // If no TTL is set, show info about automatic cleanup
      if (!ttl) {
        setTimeRemaining("");
        setIsExpired(false);
        setIsWarning(false);
        setTournamentStarted(false);
        return;
      }
      
      // Handle both ISO string and Firestore Timestamp object for ttl
      const deletionTime = ttl.toDate ? ttl.toDate() : new Date(ttl);
      
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
      // Always show the countdown if TTL exists, regardless of start status
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

    // Update every second only if TTL is set
    const interval = ttl ? setInterval(updateCountdown, 1000) : null;

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [ttl, startDate]);

  if (!ttl && !showWarning) return null; // Only hide if TTL is missing and warnings are disabled

  const getTextColor = () => {
    if (isExpired) return "text-red-500";
    if (isWarning) return "text-yellow-500";
    if (!ttl) return "text-blue-400"; // Blue for informational message when TTL is not set
    if (!tournamentStarted) return "text-blue-400";
    return "text-gray-400";
  };

  const getIcon = () => {
    if (isExpired && showWarning) return <AlertTriangle size={14} className="mr-1" />;
    if (showIcon) return <Clock size={14} className="mr-1" />;
    return null;
  };

  const getDisplayText = () => {
    if (!ttl) {
      return "Auto-deletion timer will be set when tournament reaches scheduled start time";
    }
    if (isExpired) return "Expired - being deleted";
    if (tournamentStarted) return `Auto-delete in ${timeRemaining}`;
    return `Auto-delete in ${timeRemaining}`;
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
