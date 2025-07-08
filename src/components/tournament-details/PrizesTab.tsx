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
    // Pre-fill with existing winners if present
    return tournament.winners || {};
  });
  const [saving, setSaving] = useState<{ [position: string]: boolean }>({});
  const [error, setError] = useState<string | null>(null);

  // Sort prizes by position
  const sortedPrizes = Object.entries(tournament.prize_distribution || {})
    .filter(([_, percentage]) => percentage > 0)
    .sort(([posA], [posB]) => sortPositions(posA, posB));

  const handleInputChange = (position: string, field: "uid" | "ign", value: string) => {
    setInputs((prev) => ({
      ...prev,
      [position]: {
        ...prev[position],
        [field]: value,
      },
    }));
  };

  const handleSave = async (position: string) => {
    setSaving((prev) => ({ ...prev, [position]: true }));
    setError(null);
    try {
      const winners = { ...(tournament.winners || {}), [position]: inputs[position] };
      await updateDoc(doc(db, "tournaments", tournament.id), { winners });
      setSaving((prev) => ({ ...prev, [position]: false }));
    } catch (e) {
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
          const winner = (tournament.winners && tournament.winners[position]) || inputs[position];
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
                winner && winner.uid && winner.ign ? (
                  <div className="mt-2 md:mt-0 flex items-center gap-2">
                    <CheckCircle2 className="text-green-500 w-5 h-5" />
                    <div className="text-sm">UID: <span className="font-mono font-semibold">{winner.uid}</span></div>
                    <div className="text-sm">IGN: <span className="font-mono font-semibold">{winner.ign}</span></div>
                  </div>
                ) : (
                  <div className="flex flex-col md:flex-row gap-2 mt-2 md:mt-0 w-full md:w-auto">
                    <div className="relative w-32">
                      <User className="absolute left-2 top-2.5 w-4 h-4 text-gaming-muted" />
                      <Input
                        placeholder="UID"
                        value={inputs[position]?.uid || ""}
                        onChange={(e) => handleInputChange(position, "uid", e.target.value)}
                        className="pl-8 w-full"
                      />
                    </div>
                    <div className="relative w-32">
                      <Gamepad2 className="absolute left-2 top-2.5 w-4 h-4 text-gaming-muted" />
                      <Input
                        placeholder="IGN"
                        value={inputs[position]?.ign || ""}
                        onChange={(e) => handleInputChange(position, "ign", e.target.value)}
                        className="pl-8 w-full"
                      />
                    </div>
                    <Button
                      onClick={() => handleSave(position)}
                      disabled={saving[position] || !inputs[position]?.uid || !inputs[position]?.ign}
                      size="sm"
                      className="font-semibold"
                    >
                      {saving[position] ? "Sending..." : `Send ${credits} Credits`}
                    </Button>
                  </div>
                )
              ) : winner && winner.uid && winner.ign ? (
                <div className="mt-2 md:mt-0 flex items-center gap-2">
                  <CheckCircle2 className="text-green-500 w-5 h-5" />
                  <div className="text-sm">UID: <span className="font-mono font-semibold">{winner.uid}</span></div>
                  <div className="text-sm">IGN: <span className="font-mono font-semibold">{winner.ign}</span></div>
                </div>
              ) : null}
            </div>
          );
        })}
        {Object.keys(tournament.prize_distribution || {}).length === 0 && (
          <p className="text-gaming-muted">Prize distribution details not available.</p>
        )}
        {error && (
          <div className="flex items-center gap-2 text-red-500 mt-2">
            <XCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrizesTab; 