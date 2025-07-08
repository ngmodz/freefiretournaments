import React from "react";
import { Trophy, User, Gamepad2, CheckCircle2, XCircle } from "lucide-react";
import { Tournament } from "@/lib/tournamentService";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useState } from "react";

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
    
    try {
      // Get the current input for this position
      const currentInput = inputs[position];
      if (!currentInput?.uid || !currentInput?.ign) {
        setError("Both UID and IGN are required");
        setSaving((prev) => ({ ...prev, [position]: false }));
        return;
      }

      // Check for duplicate errors
      if (duplicateErrors[position]) {
        setError(duplicateErrors[position]);
        setSaving((prev) => ({ ...prev, [position]: false }));
        return;
      }

      // Additional check for duplicates (server-side safety)
      const existingWinners = tournament.winners || {};
      const currentCombination = `${currentInput.uid.trim()}-${currentInput.ign.trim()}`;
      
      const duplicatePosition = Object.entries(existingWinners).find(([pos, winner]) => {
        if (pos === position) return false; // Skip current position
        if (!winner?.uid || !winner?.ign) return false;
        return `${winner.uid.trim()}-${winner.ign.trim()}` === currentCombination;
      });

      if (duplicatePosition) {
        setError(`This UID and IGN combination is already used for ${duplicatePosition[0]} position. Each player can only win one position.`);
        setSaving((prev) => ({ ...prev, [position]: false }));
        return;
      }

      // Save the winner credentials to the database
      const winners = { ...existingWinners, [position]: currentInput };
      await updateDoc(doc(db, "tournaments", tournament.id), { winners });
      
      console.log(`✅ Successfully saved winner for ${position}:`, currentInput);
      
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
      setError(`✅ Credits sent successfully to ${currentInput.ign} (UID: ${currentInput.uid}) for ${position} place!`);
      // Clear success message after 3 seconds
      setTimeout(() => setError(null), 3000);
      
    } catch (e) {
      console.error("Error saving winner:", e);
      setError("Failed to save winner. Please try again.");
      setSaving((prev) => ({ ...prev, [position]: false }));
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Prize Distribution</h2>
      {isHost && tournament.status !== "cancelled" && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-1">Distribute Prizes</h3>
          <p className="text-gaming-muted text-sm mb-2">
            Enter the UID and IGN of the winner for each position and click <b>Send Credits</b> to distribute the prize.
          </p>
        </div>
      )}
      <div className="space-y-4">
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
                  // Show saved winner with option to edit
                  <div className="mt-2 md:mt-0 flex items-center gap-2">
                    <CheckCircle2 className="text-green-500 w-5 h-5" />
                    <div className="text-sm">UID: <span className="font-mono font-semibold">{savedWinner.uid}</span></div>
                    <div className="text-sm">IGN: <span className="font-mono font-semibold">{savedWinner.ign}</span></div>
                    <span className="text-xs text-green-600 font-medium bg-green-100 px-2 py-1 rounded">Credits Sent</span>
                  </div>
                ) : (
                  // Show input fields for entering new winner
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
                        disabled={saving[position] || !currentInput?.uid || !currentInput?.ign || !!duplicateErrors[position]}
                        size="sm"
                        className="font-semibold"
                      >
                        {saving[position] ? "Sending..." : `Send ${credits} Credits`}
                      </Button>
                    </div>
                  </div>
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
  );
};

export default PrizesTab; 