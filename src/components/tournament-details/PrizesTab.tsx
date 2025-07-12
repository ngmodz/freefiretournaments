import React from "react";
import { Trophy, User, Gamepad2, CheckCircle2, XCircle, Lock, AlertTriangle } from "lucide-react";
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
  const { entry_fee, filled_spots, prize_distribution } = tournament;
  const totalPrizePool = entry_fee * filled_spots;
  const values = Object.values(prize_distribution || {});
  const sum = values.reduce((a, b) => a + b, 0);
  // If sum is 100, treat as percentage mode
  if (sum === 100) {
    const percentage = prize_distribution[position] || 0;
    return Math.floor((percentage / 100) * totalPrizePool);
  }
  // If sum <= totalPrizePool, treat as fixed mode
  if (sum <= totalPrizePool) {
    return prize_distribution[position] || 0;
  }
  // Fallback: treat as fixed
  return prize_distribution[position] || 0;
}

const PrizesTab: React.FC<PrizesTabProps> = ({ tournament }) => {
  const { currentUser } = useAuth();
  const isHost = currentUser && tournament.host_id === currentUser.uid;
  const [inputs, setInputs] = useState<{ [position: string]: { uid: string; ign: string } }>(() => {
    // Start with empty inputs instead of pre-filling from tournament.winners
    return {};
  });
  const [saving, setSaving] = useState<{ [position: string]: boolean }>({});
  const [error, setError] = useState<string | null>(null);
  const [duplicateErrors, setDuplicateErrors] = useState<{ [position: string]: string }>({});
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    position: string;
    uid: string;
    ign: string;
    prizeAmount: number;
  }>({
    open: false,
    position: "",
    uid: "",
    ign: "",
    prizeAmount: 0
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
  }, [inputs, tournament.winners]);

  // Helper function to check for duplicate UID+IGN combinations across all positions
  const checkForDuplicates = (currentInputs: { [position: string]: { uid: string; ign: string } }) => {
    const errors: { [position: string]: string } = {};
    const existingWinners = tournament.winners || {};
    
    console.log("🔍 Checking duplicates with:", { currentInputs, existingWinners });
    
    // Create a map of UID+IGN combinations to positions for current inputs
    const uidIgnCombinations: { [combination: string]: string[] } = {};
    
    // Check current inputs
    Object.entries(currentInputs).forEach(([position, winner]) => {
      if (winner?.uid && winner?.ign) {
        const combination = `${winner.uid.trim()}-${winner.ign.trim()}`;
        console.log(`📝 Adding current input: ${position} -> ${combination}`);
        if (!uidIgnCombinations[combination]) {
          uidIgnCombinations[combination] = [];
        }
        uidIgnCombinations[combination].push(position);
      }
    });
    
    // Check existing saved winners (only for positions not currently being edited)
    Object.entries(existingWinners).forEach(([position, winner]) => {
      if (winner?.uid && winner?.ign && !currentInputs[position]) {
        const combination = `${winner.uid.trim()}-${winner.ign.trim()}`;
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

  // Sort prizes by position
  const sortedPrizes = Object.entries(tournament.prize_distribution || {})
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
    setSaving((prev) => ({ ...prev, [position]: true }));
    setError(null);

    const findParticipantAuthUid = async (): Promise<string | null> => {
      const currentInput = inputs[position];
      if (!currentInput?.uid || !currentInput?.ign) {
        setError("Both UID and IGN are required");
        return null;
      }

      const participants = tournament.participants || [];
      if (participants.length === 0) return null;

      // New structure: array of objects
      if (typeof participants[0] === 'object' && participants[0] !== null) {
        const participant = (participants as any[]).find(p => p.customUid === currentInput.uid && p.ign === currentInput.ign);
        return participant ? participant.authUid : null;
      }

      // Legacy structure: array of auth UIDs (strings)
      if (typeof participants[0] === 'string') {
        const userProfile = await findUserByUID(currentInput.uid);
        // Ensure the found user's IGN matches and their auth UID is in the participants list
        if (userProfile && userProfile.ign.toLowerCase() === currentInput.ign.toLowerCase() && participants.includes(userProfile.id)) {
          return userProfile.id; // userProfile.id is the authUid
        }
      }
      return null;
    };

    try {
      const winnerAuthUid = await findParticipantAuthUid();
      const currentInput = inputs[position]; // re-get for error message

      if (!winnerAuthUid) {
        setError(`UID ${currentInput.uid} with IGN ${currentInput.ign} is not a participant in this tournament. Please check the details and try again.`);
        setSaving((prev) => ({ ...prev, [position]: false }));
        return;
      }
      
      // Use helper for prize amount
      const prizeAmount = getPrizeAmount(tournament, position);
      const totalPrizePool = tournament.entry_fee * tournament.filled_spots;

      // Use transaction to ensure data consistency
      await runTransaction(db, async (transaction) => {
        // Get current tournament data
        const tournamentRef = doc(db, "tournaments", tournament.id);
        const tournamentDoc = await transaction.get(tournamentRef);
        
        if (!tournamentDoc.exists()) {
          throw new Error("Tournament not found");
        }

        const tournamentData = tournamentDoc.data();
        
        // Check if tournament is in correct status
        if (tournamentData.status !== "ended") {
          throw new Error("Prizes can only be distributed for ended tournaments");
        }

        // Check if prizes have already been distributed for this position
        const existingWinners = tournamentData.winners || {};
        if (existingWinners[position] && existingWinners[position].uid) {
          throw new Error(`Prizes for ${position} place have already been distributed`);
        }

        // Check if user exists
        const userRef = doc(db, "users", winnerAuthUid);
        const userDoc = await transaction.get(userRef);
        
        if (!userDoc.exists()) {
          throw new Error(`User with UID ${winnerAuthUid} not found in the system`);
        }

        const userData = userDoc.data();
        const wallet = userData.wallet || {
          tournamentCredits: 0,
          hostCredits: 0,
          earnings: 0,
          totalPurchasedTournamentCredits: 0,
          totalPurchasedHostCredits: 0,
          firstPurchaseCompleted: false
        };

        // Calculate new earnings balance for winner
        const currentEarnings = wallet.earnings || 0;
        const newEarnings = currentEarnings + prizeAmount;

        // Update winner's wallet
        transaction.update(userRef, {
          'wallet.earnings': newEarnings
        });

        // Create transaction record for winner
        const winnerTransactionRef = doc(collection(db, "creditTransactions"));
        const winnerTransactionData = {
          userId: winnerAuthUid,
          type: 'tournament_win',
          amount: prizeAmount,
          balanceBefore: currentEarnings,
          balanceAfter: newEarnings,
          walletType: 'earnings',
          description: `Won ${prizeAmount} credits - ${position} place in ${tournament.name}`,
          transactionDetails: {
            tournamentId: tournament.id,
            tournamentName: tournament.name,
            position,
            hostUid: tournament.host_id
          },
          createdAt: Timestamp.now()
        };
        transaction.set(winnerTransactionRef, winnerTransactionData);

        // Update tournament with winner information
        const existingWinnersUpdate = tournamentData.winners || {};
        const updatedWinners = { ...existingWinnersUpdate, [position]: { uid: currentInput.uid, ign: currentInput.ign } };
        transaction.update(tournamentRef, { 
          winners: updatedWinners
        });

        // Check if this is the last prize to be distributed
        const allPositions = Object.keys(tournament.prize_distribution || {});
        const distributedPositions = Object.keys(updatedWinners);
        
        // If all prizes are distributed, calculate and distribute host earnings
        if (distributedPositions.length === allPositions.length) {
          // Calculate total distributed prizes
          const totalDistributedPrizes = allPositions.reduce((total, pos) => {
            const posAmount = getPrizeAmount(tournament, pos);
            return total + posAmount;
          }, 0);

          // Calculate host earnings (remaining credits)
          const hostEarnings = totalPrizePool - totalDistributedPrizes;

          if (hostEarnings > 0) {
            // Get host user document
            const hostRef = doc(db, "users", tournament.host_id);
            const hostDoc = await transaction.get(hostRef);
            
            if (hostDoc.exists()) {
              const hostData = hostDoc.data();
              const hostWallet = hostData.wallet || {
                tournamentCredits: 0,
                hostCredits: 0,
                earnings: 0,
                totalPurchasedTournamentCredits: 0,
                totalPurchasedHostCredits: 0,
                firstPurchaseCompleted: false
              };

              const currentHostEarnings = hostWallet.earnings || 0;
              const newHostEarnings = currentHostEarnings + hostEarnings;

              // Update host's wallet
              transaction.update(hostRef, {
                'wallet.earnings': newHostEarnings
              });

              // Create transaction record for host
              const hostTransactionRef = doc(collection(db, "creditTransactions"));
              const hostTransactionData = {
                userId: tournament.host_id,
                type: 'tournament_host_earnings',
                amount: hostEarnings,
                balanceBefore: currentHostEarnings,
                balanceAfter: newHostEarnings,
                walletType: 'earnings',
                description: `Host earnings from ${tournament.name} - ${hostEarnings} credits`,
                transactionDetails: {
                  tournamentId: tournament.id,
                  tournamentName: tournament.name,
                  totalPrizePool,
                  totalDistributedPrizes,
                  hostEarnings
                },
                createdAt: Timestamp.now()
              };
              transaction.set(hostTransactionRef, hostTransactionData);
            }
          }

          // Mark tournament as completed
          transaction.update(tournamentRef, {
            status: "completed",
            completed_at: Timestamp.now(),
            total_prizes_distributed: totalDistributedPrizes,
            host_earnings_distributed: hostEarnings
          });
        }
      });
      
      console.log(`✅ Successfully distributed ${prizeAmount} credits to ${currentInput.uid} for ${position} place`);
      
      // Clear the input fields for this position after successful save
      setInputs(prev => {
        const newInputs = { ...prev };
        delete newInputs[position];
        return newInputs;
      });
      
      // Clear duplicate errors for this position after successful save
      setDuplicateErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[position];
        return newErrors;
      });
      
      setSaving((prev) => ({ ...prev, [position]: false }));
      
      // Show success message
      setError(`✅ ${prizeAmount} credits sent successfully to ${currentInput.ign} (UID: ${currentInput.uid}) for ${position} place!`);
      // Clear success message after 3 seconds
      setTimeout(() => setError(null), 3000);
      
    } catch (e) {
      console.error("Error distributing prize:", e);
      setError(e instanceof Error ? e.message : "Failed to distribute prize. Please try again.");
      setSaving((prev) => ({ ...prev, [position]: false }));
    }
  };

  const handleConfirmDistribution = async () => {
    await handleSave(confirmDialog.position);
    setConfirmDialog({ open: false, position: "", uid: "", ign: "", prizeAmount: 0 });
  };

  const handleSendCredits = (position: string) => {
    const currentInput = inputs[position];
    if (!currentInput?.uid || !currentInput?.ign) {
      setError("Both UID and IGN are required");
      return;
    }

    // Use helper for prize amount
    const calculatedPrizeAmount = getPrizeAmount(tournament, position);

    setConfirmDialog({
      open: true,
      position,
      uid: currentInput.uid,
      ign: currentInput.ign,
      prizeAmount: calculatedPrizeAmount
    });
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Prize Distribution</h2>
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
                  <div className="font-bold text-lg">{credits} credits</div>
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
                        onClick={() => handleSendCredits(position)}
                        disabled={saving[position] || !currentInput?.uid || !currentInput?.ign || !!duplicateErrors[position]}
                        size="sm"
                        className="font-semibold"
                      >
                        {saving[position] ? "Sending..." : `Send ${credits} Credits`}
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

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="bg-gaming-card border-gaming-border">
          <DialogHeader>
            <DialogTitle className="text-gaming-text">Confirm Prize Distribution</DialogTitle>
            <DialogDescription className="text-gaming-muted">
              Are you sure you want to distribute {confirmDialog.prizeAmount} credits to this player?
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
            </div>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This action cannot be undone. The credits will be immediately added to the player's earnings wallet.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
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