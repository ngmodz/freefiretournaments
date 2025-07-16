import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { TournamentCleanupService } from "@/lib/tournamentCleanupService";
import { setTTLForScheduledTournaments, forceTTLForTournament, Tournament } from "@/lib/tournamentService";
import { AlertCircle, RefreshCw, Clock, Trash2, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface TournamentTimerDebugPanelProps {
  tournament?: Tournament;
}

const TournamentTimerDebugPanel: React.FC<TournamentTimerDebugPanelProps> = ({ tournament }) => {
  const [isCheckingExpired, setIsCheckingExpired] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [isSettingTTL, setIsSettingTTL] = useState(false);
  const [isForcingTTL, setIsForcingTTL] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const { toast } = useToast();

  const checkExpiredTournaments = async () => {
    setIsCheckingExpired(true);
    try {
      const result = await TournamentCleanupService.checkForExpiredTournaments();
      setDebugInfo(result);
      
      if (result.hasExpired) {
        toast({
          title: "Expired Tournaments Found",
          description: `Found ${result.expiredCount} expired tournaments that need cleanup`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "No Issues Found",
          description: "No expired tournaments found",
        });
      }
    } catch (error) {
      console.error('Error checking expired tournaments:', error);
      toast({
        title: "Error",
        description: "Failed to check expired tournaments",
        variant: "destructive"
      });
    } finally {
      setIsCheckingExpired(false);
    }
  };

  const cleanupExpiredTournaments = async () => {
    setIsCleaningUp(true);
    try {
      const result = await TournamentCleanupService.deleteExpiredTournaments();
      
      if (result.success) {
        toast({
          title: "Cleanup Successful",
          description: `Deleted ${result.deletedCount} expired tournaments`,
        });
      } else {
        toast({
          title: "Cleanup Failed",
          description: result.error || "Unknown error occurred",
          variant: "destructive"
        });
      }
      
      // Refresh the check after cleanup
      setTimeout(checkExpiredTournaments, 1000);
    } catch (error) {
      console.error('Error cleaning up tournaments:', error);
      toast({
        title: "Error",
        description: "Failed to cleanup tournaments",
        variant: "destructive"
      });
    } finally {
      setIsCleaningUp(false);
    }
  };

  const setMissingTTLs = async () => {
    setIsSettingTTL(true);
    try {
      const result = await setTTLForScheduledTournaments();
      
      if (result.success) {
        toast({
          title: "TTL Setting Successful",
          description: `Set TTL for ${result.updatedCount} tournaments`,
        });
      } else {
        toast({
          title: "TTL Setting Failed",
          description: result.error || "Unknown error occurred",
          variant: "destructive"
        });
      }
      
      // Refresh the check after setting TTLs
      setTimeout(checkExpiredTournaments, 1000);
    } catch (error) {
      console.error('Error setting TTLs:', error);
      toast({
        title: "Error",
        description: "Failed to set TTLs",
        variant: "destructive"
      });
    } finally {
      setIsSettingTTL(false);
    }
  };

  const forceTTLForCurrentTournament = async () => {
    if (!tournament?.id) {
      toast({
        title: "No Tournament",
        description: "No tournament context available",
        variant: "destructive"
      });
      return;
    }

    setIsForcingTTL(true);
    try {
      const result = await forceTTLForTournament(tournament.id);
      
      if (result.success) {
        toast({
          title: "TTL Force Set",
          description: result.message,
        });
      } else {
        toast({
          title: "TTL Force Failed",
          description: result.error || "Unknown error occurred",
          variant: "destructive"
        });
      }
      
      // Refresh the check after setting TTL
      setTimeout(checkExpiredTournaments, 1000);
    } catch (error) {
      console.error('Error forcing TTL:', error);
      toast({
        title: "Error",
        description: "Failed to force set TTL",
        variant: "destructive"
      });
    } finally {
      setIsForcingTTL(false);
    }
  };

  // Auto-check on component mount
  useEffect(() => {
    checkExpiredTournaments();
  }, []);

  return (
    <div className="p-4 bg-gray-900 border border-gray-700 rounded-lg">
      <div className="flex items-center mb-4">
        <AlertCircle className="w-5 h-5 text-yellow-500 mr-2" />
        <h3 className="text-lg font-semibold text-white">Tournament Timer Debug Panel</h3>
        {tournament && (
          <span className="ml-2 text-sm text-gray-400">({tournament.name})</span>
        )}
      </div>
      
      <div className="space-y-3">
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={checkExpiredTournaments}
            disabled={isCheckingExpired}
            variant="outline"
            size="sm"
          >
            {isCheckingExpired ? (
              <LoadingSpinner size="xs" />
            ) : (
              <AlertCircle className="w-4 h-4 mr-2" />
            )}
            Check Expired
          </Button>
          
          <Button
            onClick={cleanupExpiredTournaments}
            disabled={isCleaningUp}
            variant="destructive"
            size="sm"
          >
            {isCleaningUp ? (
              <LoadingSpinner size="xs" />
            ) : (
              <Trash2 className="w-4 h-4 mr-2" />
            )}
            Cleanup Expired
          </Button>
          
          <Button
            onClick={setMissingTTLs}
            disabled={isSettingTTL}
            variant="secondary"
            size="sm"
          >
            {isSettingTTL ? (
              <LoadingSpinner size="xs" />
            ) : (
              <Clock className="w-4 h-4 mr-2" />
            )}
            Set Missing TTLs (Auto-Start Timers)
          </Button>

          {tournament && (
            <Button
              onClick={forceTTLForCurrentTournament}
              disabled={isForcingTTL}
              variant="default"
              size="sm"
            >
              {isForcingTTL ? (
                <LoadingSpinner size="xs" />
              ) : (
                <Zap className="w-4 h-4 mr-2" />
              )}
              {tournament.status === 'cancelled' ? 'Fix Cancelled TTL (15min)' : 'Force TTL for This Tournament'}
            </Button>
          )}
        </div>
        
        {debugInfo && (
          <div className="p-3 bg-gray-800 rounded text-sm">
            <p className="text-gray-300">
              <strong>Status:</strong> {debugInfo.hasExpired ? '❌ Issues Found' : '✅ All Good'}
            </p>
            <p className="text-gray-300">
              <strong>Expired Count:</strong> {debugInfo.expiredCount}
            </p>
            {debugInfo.message && (
              <p className="text-gray-300">
                <strong>Message:</strong> {debugInfo.message}
              </p>
            )}
            {debugInfo.error && (
              <p className="text-red-400">
                <strong>Error:</strong> {debugInfo.error}
              </p>
            )}
          </div>
        )}
        
        <div className="text-xs text-gray-400">
          <p><strong>Expected Behavior:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>🕐 Auto-TTL starts when tournament reaches scheduled time (every 30s check)</li>
            <li>📋 Manual start keeps existing TTL (2 hours from scheduled time)</li>
            <li>🏁 Manual end sets TTL to 30 minutes after ending</li>
            <li>❌ Manual cancel sets TTL to 15 minutes after cancellation</li>
            <li>🧹 Cleanup runs every 30 seconds in client</li>
          </ul>
          <p className="mt-2 text-yellow-400"><strong>If timer isn't showing:</strong> Click "Set Missing TTLs" button above!</p>
        </div>
      </div>
    </div>
  );
};

export default TournamentTimerDebugPanel;
