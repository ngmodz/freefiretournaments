import { useState, useEffect } from 'react';
import { useRealtime } from '../../hooks/useRealtime';
import { Badge } from './badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';

export function ConnectionStatus() {
  const { isConnected } = useRealtime();
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [nextCheck, setNextCheck] = useState<Date | null>(null);
  
  // Check for tournaments that need notifications
  useEffect(() => {
    // Function to check upcoming tournaments
    const checkUpcomingTournaments = async () => {
      try {
        setIsChecking(true);
        
        // Get tournaments from the last 24 hours
        const response = await fetch('/api/tournament-notifications');
        const data = await response.json();
        
        console.log('Tournament notification check:', data);
        setLastChecked(new Date());
        
        // Schedule next check in 5 minutes
        const next = new Date();
        next.setMinutes(next.getMinutes() + 5);
        setNextCheck(next);
      } catch (error) {
        console.error('Error checking tournaments:', error);
      } finally {
        setIsChecking(false);
      }
    };
    
    // Check on initial load
    checkUpcomingTournaments();
    
    // Set up interval to check every 5 minutes
    const interval = setInterval(checkUpcomingTournaments, 5 * 60 * 1000);
    
    // Clean up interval
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <Badge variant={isConnected ? "outline" : "destructive"} className="text-xs py-0 h-5">
                {isConnected ? 'Online' : 'Offline'}
              </Badge>
              
              {lastChecked && (
                <Badge variant="secondary" className="text-xs py-0 h-5">
                  {isChecking ? 'Checking...' : `Checked ${formatTimeAgo(lastChecked)}`}
                </Badge>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {isConnected 
                ? 'Connected to realtime database' 
                : 'Not connected to realtime database'}
            </p>
            {lastChecked && (
              <p className="text-xs text-muted-foreground mt-1">
                Last notification check: {lastChecked.toLocaleTimeString()}
                {nextCheck && (
                  <>, next check at {nextCheck.toLocaleTimeString()}</>
                )}
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

// Helper function to format time ago
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  
  if (diffMin < 1) {
    return 'just now';
  } else if (diffMin === 1) {
    return '1 min ago';
  } else if (diffMin < 60) {
    return `${diffMin} mins ago`;
  } else {
    const diffHours = Math.round(diffMin / 60);
    if (diffHours === 1) {
      return '1 hour ago';
    } else {
      return `${diffHours} hours ago`;
    }
  }
}
