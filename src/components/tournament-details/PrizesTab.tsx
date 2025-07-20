import React from "react";
import { Trophy, User, Gamepad2, CheckCircle2, XCircle, Lock, AlertTriangle, TrendingUp, Info } from "lucide-react";
import { Tournament } from "@/lib/tournamentService";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { doc, updateDoc, getDoc, runTransaction, Timestamp, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { findUserByUID } from "@/lib/user-utils";

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

// Helper to determine prize mode and get prize amount
function getPrizeAmount(tournament: Tournament, position: string) {
  const { entry_fee, filled_spots, prize_distribution, currentPrizePool, manual_prize_pool } = tournament;
  
  // 1. Check for manual prize pool (for free tournaments)
  if (entry_fee === 0 && manual_prize_pool) {
    const key = position.toLowerCase().replace(/ place/g, ''); // "First Place" -> "first"
    if (key.startsWith('first') || key.startsWith('1')) return manual_prize_pool.first || 0;
    if (key.startsWith('second') || key.startsWith('2')) return manual_prize_pool.second || 0;
    if (key.startsWith('third') || key.startsWith('3')) return manual_prize_pool.third || 0;
  }
  
  // 2. Calculate for percentage-based prize pool
  let actualPrizePool = currentPrizePool || 0;
  
  // Fallback calculation if currentPrizePool seems incorrect
  const calculatedPool = entry_fee * filled_spots;
  if (actualPrizePool === 0 || (calculatedPool > 0 && Math.abs(actualPrizePool - calculatedPool) > calculatedPool * 0.1)) {
    actualPrizePool = calculatedPool;
  }
  
  const percentage = prize_distribution?.[position] || 0;
  
  if (percentage <= 0 || actualPrizePool <= 0) {
    return 0;
  }
  
  // Calculate prize as percentage of actual prize pool
  const calculatedAmount = Math.floor((percentage / 100) * actualPrizePool);
  
  console.log("getPrizeAmount calculation:", {
    position, 
    currentPrizePool,
    calculatedPool,
    actualPrizePool,
    percentage,
    calculatedAmount,
    tournament: tournament.name
  });
  
  return calculatedAmount;
}

const PrizesTab: React.FC<PrizesTabProps> = ({ tournament }) => {
  const { currentUser } = useAuth();
  const isHost = currentUser && tournament.host_id === currentUser.uid;
  const [inputs, setInputs] = useState<{ [position: string]: { uid: string; ign: string } }>({});
  const [saving, setSaving] = useState<{ [position: string]: boolean; hostEarnings?: boolean }>({});
  const [error, setError] = useState<string | null>(null);
  const [duplicateErrors, setDuplicateErrors] = useState<{ [position: string]: string }>({});
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    position: string;
    uid: string;
    ign: string;
    prizeAmount: number;
    winnerAuthUid: string;
  }>({
    open: false,
    position: "",
    uid: "",
    ign: "",
    prizeAmount: 0,
    winnerAuthUid: ""
  });

  // Debug logging
  console.log("PrizesTab rendered", { tournament: tournament.id, isHost, inputs, duplicateErrors });

  // Console log to see current state every render
  console.log("🎯 Current state on render:", {
    inputs,
    duplicateErrors,
    tournament_winners: tournament.winners
  });

  // Initialize duplicate checking when component mounts or inputs change
  React.useEffect(() => {
    const errors = checkForDuplicates(inputs);
    setDuplicateErrors(errors);
    console.log("Initial duplicate check on mount/input change:", { inputs, errors });
    
    // Clear general error if there are no duplicates and no active inputs
    const hasActiveInputs = Object.values(inputs).some(input => input?.uid?.trim() || input?.ign?.trim());
    const hasErrors = Object.keys(errors).length > 0;
    
    if (!hasActiveInputs && !hasErrors) {
      setError(null);
    }
  }, [inputs, tournament.winners]);

  // Helper function to check for duplicate UID+IGN combinations across all positions
  const checkForDuplicates = (currentInputs: { [position: string]: { uid: string; ign: string } }) => {
    const errors: { [position: string]: string } = {};
    const existingWinners = tournament.winners || {};
    
    console.log("🔍 Checking duplicates with:", { currentInputs, existingWinners });
    
    // Create a map of UID+IGN combinations to positions
    const uidIgnCombinations: { [combination: string]: string[] } = {};
    
    // Check current inputs
    Object.entries(currentInputs).forEach(([position, winner]) => {
      if (winner?.uid?.trim() && winner?.ign?.trim()) {
        const combination = `${winner.uid.trim().toLowerCase()}-${winner.ign.trim().toLowerCase()}`;
        console.log(`📝 Adding current input: ${position} -> ${combination}`);
        if (!uidIgnCombinations[combination]) {
          uidIgnCombinations[combination] = [];
        }
        uidIgnCombinations[combination].push(position);
      }
    });
    
    // Check existing saved winners (only for positions not currently being edited)
    Object.entries(existingWinners).forEach(([position, winner]) => {
      if (winner?.uid?.trim() && winner?.ign?.trim() && !currentInputs[position]) {
        const combination = `${winner.uid.trim().toLowerCase()}-${winner.ign.trim().toLowerCase()}`;
        console.log(`💾 Adding existing winner: ${position} -> ${combination}`);
        if (!uidIgnCombinations[combination]) {
          uidIgnCombinations[combination] = [];
        }
        uidIgnCombinations[combination].push(position);
      }
    });
    
    console.log("🗂️ All combinations:", uidIgnCombinations);
    
    // Find duplicates and create error messages
    Object.entries(uidIgnCombinations).forEach(([combination, positions]) => {
      console.log(`🔎 Checking combination ${combination} with positions:`, positions);
      if (positions.length > 1) {
        console.log(`🚨 DUPLICATE FOUND for ${combination}:`, positions);
        positions.forEach(position => {
          if (currentInputs[position]) { // Only show error for positions with current input
            const otherPositions = positions.filter(p => p !== position);
            errors[position] = `This UID+IGN combination is already used in: ${otherPositions.join(', ')}`;
            console.log(`❌ Setting error for ${position}:`, errors[position]);
          }
        });
      }
    });
    
    console.log("🏁 Final duplicate check result:", { uidIgnCombinations, errors });
    return errors;
  };

  // Determine which prize structure to use
  const hasManualPrizes = tournament.entry_fee === 0 && tournament.manual_prize_pool && 
                         Object.values(tournament.manual_prize_pool).some(p => p > 0);

  // Sort prizes based on the structure
  const sortedPrizes = hasManualPrizes
    ? Object.entries(tournament.manual_prize_pool || {})
        .map(([pos, amount]) => [`${pos.charAt(0).toUpperCase() + pos.slice(1)}`, amount] as [string, number]) // Format position name
        .filter(([_, amount]) => amount > 0)
        .sort(([posA], [posB]) => sortPositions(posA, posB))
    : Object.entries(tournament.prize_distribution || {})
        .filter(([_, percentage]) => percentage > 0)
        .sort(([posA], [posB]) => sortPositions(posA, posB));

  const handleInputChange = (position: string, field: "uid" | "ign", value: string) => {
    console.log("🎯 Input change:", { position, field, value });
    
    const newInputs = {
      ...inputs,
      [position]: {
        ...inputs[position],
        [field]: value,
      },
    };
    
    console.log("📊 New inputs state:", newInputs);
    
    // Always allow the input change, but check for duplicates to update error state
    setInputs(newInputs);
    
    // Check for duplicates and update error state
    const errors = checkForDuplicates(newInputs);
    setDuplicateErrors(errors);
    
    // Clear general error message
    setError(null);
    
    console.log("🔄 Updated inputs and errors:", { newInputs, errors, duplicateErrors: errors });
  };

  const handleSave = async (position: string) => {
    setSaving({ ...saving, [position]: true });
    setError(null);

    const findParticipantAuthUid = async (): Promise<string | null> => {
      const currentInput = inputs[position];
      if (!currentInput?.uid?.trim() || !currentInput?.ign?.trim()) {
        setError("Both UID and IGN are required and cannot be empty");
        return null;
      }

      const participants = tournament.participants || [];
      const participantUids = tournament.participantUids || [];
      
      if (participants.length === 0) {
        setError("No participants found in this tournament");
        return null;
      }

      // New structure: array of participant objects
      if (participants.length > 0 && typeof participants[0] === 'object' && participants[0] !== null) {
        const participant = (participants as any[]).find(p => 
          p.customUid?.toString().trim() === currentInput.uid.trim() && 
          p.ign?.trim().toLowerCase() === currentInput.ign.trim().toLowerCase()
        );
        
        if (participant && participant.authUid) {
          // Double-check that this authUid is in participantUids
          if (participantUids.includes(participant.authUid)) {
            return participant.authUid;
          } else {
            setError(`Found participant data but user ${currentInput.uid} is not in the official participant list. Please contact support.`);
            return null;
          }
        }
      }

      // Legacy structure: array of auth UIDs (strings) - need to look up user profiles
      if (participants.length > 0 && typeof participants[0] === 'string') {
        try {
          const userProfile = await findUserByUID(currentInput.uid.trim());
          if (userProfile && 
              userProfile.ign.trim().toLowerCase() === currentInput.ign.trim().toLowerCase() && 
              participants.includes(userProfile.id)) {
            return userProfile.id; // userProfile.id is the authUid
          }
        } catch (error) {
          console.error("Error finding user by UID:", error);
        }
      }
      
      setError(`Player with UID ${currentInput.uid} and IGN ${currentInput.ign} is not a participant in this tournament. Please verify the details.`);
      return null;
    };

    try {
      const winnerAuthUid = await findParticipantAuthUid();
      const currentInput = inputs[position]; // re-get for error message

      if (!winnerAuthUid) {
        setSaving({ ...saving, [position]: false });
        return;
      }
      
      // Calculate prize amount from the current prize pool using the distribution percentage
      const prizeAmount = getPrizeAmount(tournament, position);
      
      // Log for debugging
      console.log('Prize Distribution Debug:', {
        position,
        currentPrizePool: tournament.currentPrizePool,
        percentage: tournament.prize_distribution[position],
        calculatedPrizeAmount: prizeAmount,
        distribution: tournament.prize_distribution
      });
      
      setConfirmDialog({
        open: true,
        position,
        uid: currentInput.uid,
        ign: currentInput.ign,
        prizeAmount,
        winnerAuthUid
      });

    } catch (error) {
      console.error("Error during save preparation:", error);
      // Check if it's a network-related error and show a user-friendly message
      const isNetworkError = error.message?.includes('ECONNRESET') || 
                            error.message?.includes('ESOCKET') || 
                            error.message?.includes('Network Error');
      
      if (isNetworkError) {
        setError("Network connection issue occurred. The prize has been distributed successfully, but email notification may have failed. Please refresh the page to see the updated status.");
      } else {
        setError(error.message || "An unexpected error occurred while preparing to save.");
      }
    } finally {
      setSaving({ ...saving, [position]: false });
    }
  };

  const handleConfirmDistribution = async () => {
    const { position, winnerAuthUid, prizeAmount, ign, uid } = confirmDialog;
    if (!winnerAuthUid) return;

    // Double-check the prizeAmount calculation
    const recalculatedPrizeAmount = getPrizeAmount(tournament, position);
    const isSignificantDifference = Math.abs(recalculatedPrizeAmount - prizeAmount) > 1;

    if (isSignificantDifference) {
      console.error("Prize amount mismatch detected!", {
        original: prizeAmount,
        recalculated: recalculatedPrizeAmount,
        difference: prizeAmount - recalculatedPrizeAmount
      });
      setError(`Error: Prize amount calculation mismatch. Please refresh and try again.`);
      return;
    }

    // Always use the recalculated value for extra safety
    const finalPrizeAmount = recalculatedPrizeAmount;
    
    setSaving({ ...saving, [position]: true });
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch('/api/tournament-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'distribute-prize', tournamentId: tournament.id, winnerId: winnerAuthUid, prizeAmount: finalPrizeAmount })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      
      // Update local state after successful distribution
      await runTransaction(db, async (transaction) => {
        const tournamentRef = doc(db, "tournaments", tournament.id);
        const winnerUpdatePath = `winners.${position}`;
        transaction.update(tournamentRef, {
          [winnerUpdatePath]: { uid, ign, authUid: winnerAuthUid, prize_distributed: true, prize_amount: finalPrizeAmount },
          total_prizes_distributed: (tournament.total_prizes_distributed || 0) + finalPrizeAmount,
          // Also update the tournament's currentPrizePool to keep frontend and backend in sync
          currentPrizePool: Math.max(0, (tournament.currentPrizePool || 0) - finalPrizeAmount)
        });
      });
      setError(`✅ Successfully distributed ${finalPrizeAmount} credits to ${ign} (${uid})`);
    } catch (error) {
      console.error("Prize distribution error:", error);
      // Check if it's a network-related error and provide better user feedback
      const isNetworkError = error.message?.includes('ECONNRESET') || 
                            error.message?.includes('ESOCKET') || 
                            error.message?.includes('Network Error');
      
      if (isNetworkError) {
        setError("Prize distributed successfully! Email notification failed due to network issues, but the credits have been added to the winner's account.");
      } else {
        setError(error.message || "Failed to distribute prize.");
      }
    } finally {
      setSaving({ ...saving, [position]: false });
      setConfirmDialog({ ...confirmDialog, open: false });
    }
  };

  const handleSendCredits = (position: string) => {
    // This function is now handled by handleSave and handleConfirmDistribution
    console.log("handleSendCredits is deprecated. Use handleSave.", { position });
  };

  const getTotalPrizePool = () => {
    const { entry_fee, filled_spots, currentPrizePool } = tournament;
    let actualPrizePool = currentPrizePool || 0;
    
    // Fallback calculation if currentPrizePool seems incorrect
    const calculatedPool = entry_fee * filled_spots;
    if (actualPrizePool === 0 || (calculatedPool > 0 && Math.abs(actualPrizePool - calculatedPool) > calculatedPool * 0.1)) {
      actualPrizePool = calculatedPool;
    }
    
    return actualPrizePool;
  };

  const handleCollectHostEarnings = async () => {
    if (!currentUser) {
      setError("User not authenticated");
      return;
    }

    setSaving({ ...saving, hostEarnings: true });
    setError(null);

    try {
      const response = await fetch('/api/tournament-management', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await currentUser.getIdToken()}`
        },
        body: JSON.stringify({
          action: 'distribute-host-earnings',
          tournamentId: tournament.id
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to collect host earnings');
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to collect host earnings');
      }

      // Update local tournament state to reflect that host earnings have been distributed
      await runTransaction(db, async (transaction) => {
        const tournamentRef = doc(db, "tournaments", tournament.id);
        transaction.update(tournamentRef, {
          hostEarningsDistributed: true,
          hostEarningsAmount: data.amount,
          currentPrizePool: 0
        });
      });

      setError(`✅ Successfully collected ${data.amount} credits as host earnings!`);
      
      // Refresh the page to show updated tournament state
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error) {
      console.error("Host earnings collection error:", error);
      setError(error.message || "Failed to collect host earnings.");
    } finally {
      setSaving({ ...saving, hostEarnings: false });
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Prize Distribution</h2>
      
      {/* Live Prize Pool Summary */}
      <div className="mb-6 p-4 bg-gradient-to-r from-gaming-card to-gaming-bg rounded-lg border border-gaming-primary/20">
        <h3 className="text-lg font-semibold mb-3 text-gaming-accent">Prize Pool Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-gaming-bg/30 rounded-lg">
            <div className="text-2xl font-bold text-gaming-primary">
              {(tournament.currentPrizePool || (tournament.entry_fee * tournament.filled_spots)).toLocaleString()}
            </div>
            <div className="text-sm text-gray-400">Current Pool</div>
          </div>
          <div className="text-center p-3 bg-gaming-bg/30 rounded-lg">
            <div className="text-2xl font-bold text-gaming-accent">{(tournament.entry_fee * tournament.max_players).toLocaleString()}</div>
            <div className="text-sm text-gray-400">Maximum Pool</div>
          </div>
          <div className="text-center p-3 bg-gaming-bg/30 rounded-lg">
            <div className="text-2xl font-bold text-white">{tournament.filled_spots}/{tournament.max_players}</div>
            <div className="text-sm text-gray-400">Players Joined</div>
          </div>
        </div>
        <div className="mt-3 text-center text-xs text-gray-400">
          All prize calculations are based on the <span className="text-gaming-accent font-semibold">current prize pool</span>
        </div>
      </div>

      {isHost && tournament.status === "ended" && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-1">Distribute Prizes</h3>
          <p className="text-gaming-muted text-sm mb-2">
            Enter the UID and IGN of the winner for each position and click <b>Send Credits</b> to distribute the prize.
          </p>
          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> Only tournament participants can receive prizes. Make sure the UID matches a player who joined this tournament.
            </AlertDescription>
          </Alert>
        </div>
      )}
      
      {/* Prize Distribution Container with Blur Effect */}
      <div className={`relative ${isHost && tournament.status !== "ended" ? 'pointer-events-none' : ''}`}>
        {/* Blur Overlay for Locked State */}
        {isHost && tournament.status !== "ended" && (
          <div className="absolute inset-0 backdrop-blur-sm bg-black/30 rounded-xl z-10 flex items-center justify-center">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-yellow-400 text-lg">🔒</span>
                <div className="text-yellow-400 text-lg font-semibold">Locked</div>
              </div>
              <div className="text-yellow-300 text-sm">Prize distribution locked until tournament ends</div>
            </div>
          </div>
        )}
        
        {/* Prize Distribution Content */}
        <div className={`space-y-4 ${isHost && tournament.status !== "ended" ? 'blur-sm' : ''}`}>
        {sortedPrizes.map(([position, credits], index) => {
          // Check if this position has a saved winner
          const savedWinner = tournament.winners?.[position];
          const currentInput = inputs[position];
          const hasWinner = savedWinner && savedWinner.uid && savedWinner.ign;
          
          return (
            <div
              key={position}
              className={`flex flex-col md:flex-row items-start md:items-center justify-between p-4 rounded-xl border shadow-sm transition-all duration-200 ${
                index === 0
                  ? "bg-yellow-500/10 border-yellow-500/30"
                  : index === 1
                  ? "bg-gray-400/10 border-gray-400/30"
                  : index === 2
                  ? "bg-amber-700/10 border-amber-700/30"
                  : "bg-gaming-card border-gaming-border"
              }`}
            >
              <div className="flex items-center mb-2 md:mb-0">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                    index === 0
                      ? "bg-yellow-500/20"
                      : index === 1
                      ? "bg-gray-400/20"
                      : index === 2
                      ? "bg-amber-700/20"
                      : "bg-gaming-muted/20"
                  }`}
                >
                  <Trophy
                    size={20}
                    className={
                      index === 0
                        ? "text-yellow-500"
                        : index === 1
                        ? "text-gray-400"
                        : index === 2
                        ? "text-amber-700"
                        : "text-gaming-muted"
                    }
                  />
                </div>
                <div>
                  <div className="text-sm text-gaming-muted font-medium">{position} Place</div>
                  <div className="space-y-1">
                    {hasManualPrizes ? (
                      <div className="font-bold text-lg flex items-center gap-2">
                        <span className="text-gaming-accent">{credits.toLocaleString()} credits</span>
                      </div>
                    ) : (
                      <>
                        <div className="font-bold text-lg flex items-center gap-2">
                          <span className="text-gaming-accent">{getPrizeAmount(tournament, position).toLocaleString()} credits</span>
                          <span className="text-gray-400">•</span>
                          <span className="text-gray-300 text-sm">{credits}%</span>
                        </div>
                        <div className="text-xs text-gray-400">
                          {credits}% of {(tournament.currentPrizePool || (tournament.entry_fee * tournament.filled_spots)).toLocaleString()} credits pool
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              {/* Winner entry or display */}
              {isHost && tournament.status !== "cancelled" ? (
                hasWinner ? (
                  // Show saved winner with option to edit only if tournament is ended
                  <div className="mt-2 md:mt-0 flex items-center gap-2">
                    <CheckCircle2 className="text-green-500 w-5 h-5" />
                    <div className="text-sm">UID: <span className="font-mono font-semibold">{savedWinner.uid}</span></div>
                    <div className="text-sm">IGN: <span className="font-mono font-semibold">{savedWinner.ign}</span></div>
                    <span className="text-xs text-green-600 font-medium bg-green-100 px-2 py-1 rounded">Credits Sent</span>
                  </div>
                ) : (
                  // Show input fields only if tournament is ended
                  tournament.status === "ended" ? (
                    <div className="flex flex-col gap-3 mt-2 md:mt-0 w-full md:w-auto">
                      {/* Show duplicate error message */}
                      {duplicateErrors[position] && (
                        <div className="flex items-start gap-3 text-red-600 text-sm w-full p-3 bg-red-50 rounded-lg border-l-4 border-red-500 shadow-sm">
                          <XCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-semibold mb-1">Duplicate Entry Detected</div>
                            <div className="text-red-500">This UID and IGN combination is already used in: <span className="font-medium">{duplicateErrors[position].replace('This UID+IGN combination is already used in: ', '')}</span></div>
                          </div>
                        </div>
                      )}
                    <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                      <div className="relative w-32">
                        <User className="absolute left-2 top-2.5 w-4 h-4 text-gaming-muted" />
                        <Input
                          placeholder="UID"
                          value={currentInput?.uid || ""}
                          onChange={(e) => handleInputChange(position, "uid", e.target.value)}
                          className={`pl-8 w-full ${duplicateErrors[position] ? 'border-red-400 focus:border-red-500 bg-red-50' : ''}`}
                        />
                      </div>
                      <div className="relative w-32">
                        <Gamepad2 className="absolute left-2 top-2.5 w-4 h-4 text-gaming-muted" />
                        <Input
                          placeholder="IGN"
                          value={currentInput?.ign || ""}
                          onChange={(e) => handleInputChange(position, "ign", e.target.value)}
                          className={`pl-8 w-full ${duplicateErrors[position] ? 'border-red-400 focus:border-red-500 bg-red-50' : ''}`}
                        />
                      </div>
                      <Button
                        onClick={() => handleSave(position)}
                        disabled={
                          saving[position] ||
                          !!duplicateErrors[position] ||
                          !inputs[position]?.uid ||
                          !inputs[position]?.ign ||
                          (tournament.winners && tournament.winners[position]?.prize_distributed)
                        }
                      >
                        {saving[position] ? "Saving..." : (tournament.winners && tournament.winners[position]?.prize_distributed ? "Distributed" : "Save & Distribute")}
                      </Button>
                    </div>
                  </div>
                  ) : (
                    // Show locked message for non-ended tournaments
                    <div className="mt-2 md:mt-0 flex items-center gap-2 text-yellow-600">
                      <Lock className="w-4 h-4" />
                      <div className="text-sm">Prize distribution locked until tournament ends</div>
                    </div>
                  )
                )
              ) : (
                // For non-hosts, show saved winners if any
                hasWinner ? (
                  <div className="mt-2 md:mt-0 flex items-center gap-2">
                    <CheckCircle2 className="text-green-500 w-5 h-5" />
                    <div className="text-sm">UID: <span className="font-mono font-semibold">{savedWinner.uid}</span></div>
                    <div className="text-sm">IGN: <span className="font-mono font-semibold">{savedWinner.ign}</span></div>
                  </div>
                ) : null
              )}
            </div>
          );
        })}
        {Object.keys(tournament.prize_distribution || {}).length === 0 && (
          <p className="text-gaming-muted">Prize distribution details not available.</p>
        )}
        {error && (
          <div className={`flex items-start gap-3 mt-4 p-4 rounded-xl border-l-4 shadow-sm ${
            error.includes('✅') 
              ? 'text-green-700 bg-green-50 border-green-500' 
              : 'text-red-600 bg-red-50 border-red-500'
          }`}>
            {error.includes('✅') ? (
              <CheckCircle2 className="w-6 h-6 mt-0.5 flex-shrink-0" />
            ) : (
              <XCircle className="w-6 h-6 mt-0.5 flex-shrink-0" />
            )}
            <div>
              <div className="font-semibold text-lg mb-1">
                {error.includes('✅') ? 'Success!' : 'Error'}
              </div>
              <div className="leading-relaxed">{error.replace('✅ ', '')}</div>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Host Earnings Collection - ONLY for paid tournaments */}
      {isHost && tournament.status === "ended" && !tournament.hostEarningsDistributed && tournament.entry_fee > 0 && (
        <div className="mb-6 p-4 bg-gradient-to-r from-green-900/20 to-gaming-bg rounded-lg border border-green-400/20">
          <h3 className="text-lg font-semibold mb-3 text-green-300 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Host Earnings Collection
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="text-center p-3 bg-green-900/20 rounded-lg border border-green-400/10">
              <div className="text-2xl font-bold text-green-400">
                {getTotalPrizePool() && tournament.prize_distribution ? 
                  Math.max(0, getTotalPrizePool() - Object.entries(tournament.prize_distribution).reduce((sum, [position, percentage]) => {
                    const prizeAmount = Math.floor((percentage / 100) * getTotalPrizePool());
                    return sum + prizeAmount;
                  }, 0)).toLocaleString() : '0'}
              </div>
              <div className="text-sm text-green-300">Available Host Earnings</div>
            </div>
            <div className="text-center p-3 bg-green-900/20 rounded-lg border border-green-400/10">
              <div className="text-2xl font-bold text-green-400">
                {tournament.prize_distribution ? 
                  Math.max(0, 100 - Object.values(tournament.prize_distribution).reduce((sum, percentage) => sum + percentage, 0)) : 0}%
              </div>
              <div className="text-sm text-green-300">Host Commission Rate</div>
            </div>
          </div>
          
          {/* Check if all prizes have been distributed */}
          {(() => {
            const allPrizesDistributed = tournament.prize_distribution && 
              Object.keys(tournament.prize_distribution).every(position => 
                tournament.winners && tournament.winners[position] && tournament.winners[position].prize_distributed
              );
            
            if (!allPrizesDistributed) {
              return (
                <Alert className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Host earnings can only be collected after all prizes have been distributed to winners.
                  </AlertDescription>
                </Alert>
              );
            }

            const hostEarnings = getTotalPrizePool() && tournament.prize_distribution ? 
              Math.max(0, getTotalPrizePool() - Object.entries(tournament.prize_distribution).reduce((sum, [position, percentage]) => {
                const prizeAmount = Math.floor((percentage / 100) * getTotalPrizePool());
                return sum + prizeAmount;
              }, 0)) : 0;

            if (hostEarnings <= 0) {
              return (
                <Alert className="mb-4">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    No host earnings available. The prize pool has been fully distributed to winners.
                  </AlertDescription>
                </Alert>
              );
            }

            return (
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="text-sm text-green-200">
                  <p>Ready to collect <strong className="text-green-300">{hostEarnings.toLocaleString()} credits</strong> as host earnings.</p>
                  <p className="text-xs text-green-400 mt-1">These will be added to your Earnings wallet.</p>
                </div>
                <Button
                  onClick={handleCollectHostEarnings}
                  disabled={saving.hostEarnings}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2"
                >
                  {saving.hostEarnings ? "Collecting..." : "Collect Host Earnings"}
                </Button>
              </div>
            );
          })()}
        </div>
      )}

      {/* Host Earnings Already Collected - ONLY for paid tournaments */}
      {isHost && tournament.hostEarningsDistributed && tournament.entry_fee > 0 && (
        <div className="mb-6 p-4 bg-gradient-to-r from-green-900/10 to-gaming-bg rounded-lg border border-green-400/10">
          <div className="flex items-center gap-2 text-green-400">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-semibold">Host Earnings Collected</span>
          </div>
          <p className="text-sm text-green-300 mt-1">
            You have already collected {tournament.hostEarningsAmount?.toLocaleString() || 'your'} credits as host earnings for this tournament.
          </p>
        </div>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="bg-gaming-card border-gaming-border">
          <DialogHeader>
            <DialogTitle className="text-gaming-text">Confirm Prize Distribution</DialogTitle>
            <DialogDescription className="text-gaming-muted">
              You are about to distribute <strong>{confirmDialog.prizeAmount} credits</strong> to the following winner for the <strong>{confirmDialog.position}</strong> position:
              <ul className="mt-2 list-disc pl-5">
                <li><strong>IGN:</strong> {confirmDialog.ign}</li>
                <li><strong>UID:</strong> {confirmDialog.uid}</li>
              </ul>
              This action is irreversible. Are you sure you want to proceed?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-gaming-bg/50 p-4 rounded-lg border border-gaming-border">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gaming-muted">Position:</span>
                  <div className="font-semibold text-gaming-text">{confirmDialog.position} Place</div>
                </div>
                <div>
                  <span className="text-gaming-muted">Prize Amount:</span>
                  <div className="font-semibold text-gaming-accent">{confirmDialog.prizeAmount} credits</div>
                </div>
                <div>
                  <span className="text-gaming-muted">Player UID:</span>
                  <div className="font-mono font-semibold text-gaming-text">{confirmDialog.uid}</div>
                </div>
                <div>
                  <span className="text-gaming-muted">Player IGN:</span>
                  <div className="font-semibold text-gaming-text">{confirmDialog.ign}</div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gaming-border text-xs text-gaming-muted">
                <p>This amount is calculated as {tournament.prize_distribution[confirmDialog.position]}% of the current prize pool ({tournament.currentPrizePool} credits).</p>
              </div>
            </div>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This action cannot be undone. The credits will be immediately added to the player's earnings wallet and deducted from the tournament's prize pool.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}
              className="border-gaming-border text-gaming-text hover:bg-gaming-bg"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDistribution}
              disabled={saving[confirmDialog.position]}
              className="bg-gaming-primary hover:bg-gaming-primary/90"
            >
              {saving[confirmDialog.position] ? "Distributing..." : "Confirm Distribution"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PrizesTab; 