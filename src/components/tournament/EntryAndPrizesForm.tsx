import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, Plus, Trash2 } from "lucide-react";
import { TournamentFormData } from "@/pages/TournamentCreate";
import { Slider } from "@/components/ui/slider";

interface EntryAndPrizesFormProps {
  formData: TournamentFormData;
  updateFormData: (data: Partial<TournamentFormData>) => void;
  nextStep: () => void;
  prevStep: () => void;
}

const DEFAULT_PERCENTAGES = [60, 25, 15];
const DEFAULT_POSITIONS = ["1st", "2nd", "3rd"];

const EntryAndPrizesForm = ({ formData, updateFormData, nextStep, prevStep }: EntryAndPrizesFormProps) => {
  const maxPlayers = formData.max_players || 12;
  const [entryFeeState, setEntryFee] = useState(formData.entry_fee || 0);
  const totalExpectedPrizePool = entryFeeState * maxPlayers || 0;

  // Percentage-only mode - no more credits mode
  const [percentages, setPercentages] = useState<number[]>(() => {
    // Initialize from formData if available and valid
    if (formData.prize_distribution && Object.keys(formData.prize_distribution).length > 0) {
      const values = Object.values(formData.prize_distribution);
      return values;
    }
    return [...DEFAULT_PERCENTAGES]; // Create a copy to avoid mutations
  });
  const [prizePositions, setPrizePositions] = useState<string[]>(() => {
    // Initialize from formData if available and valid
    if (formData.prize_distribution && Object.keys(formData.prize_distribution).length > 0) {
      const keys = Object.keys(formData.prize_distribution);
      return keys;
    }
    return [...DEFAULT_POSITIONS]; // Create a copy to avoid mutations
  });
  const [error, setError] = useState<string | null>(null);

  // Entry fee input logic for better UX
  const [entryFeeInput, setEntryFeeInput] = useState(entryFeeState === 0 ? "" : String(entryFeeState));

  // Sync entryFeeState with entryFeeInput (only when input changes)
  useEffect(() => {
    const parsed = parseInt(entryFeeInput, 10);
    const newValue = isNaN(parsed) ? 0 : parsed;
    if (newValue !== entryFeeState) {
      setEntryFee(newValue);
    }
  }, [entryFeeInput]); // Remove entryFeeState dependency to prevent loop

  const totalPercentage = percentages.reduce((sum, p) => sum + p, 0);

  const handlePercentChange = (index: number, value: string) => {
    const percent = Math.max(0, Math.min(100, Number(value)));
    setPercentages(prev => {
      const updated = [...prev];
      updated[index] = percent;
      return updated;
    });
    setError(null);
  };

  const handlePositionChange = (index: number, value: string) => {
    setPrizePositions(prev => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
    setError(null);
  };

  const addPrizePosition = () => {
    setPrizePositions(prev => [...prev, `${prev.length + 1}th`]);
    setPercentages(prev => [...prev, 0]);
  };

  const removePrizePosition = (index: number) => {
    if (prizePositions.length > 1) {
      setPrizePositions(prev => prev.filter((_, i) => i !== index));
      setPercentages(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate percentages
    if (totalPercentage > 100) {
      setError("Total percentage cannot exceed 100%.");
      return;
    }

    if (totalPercentage === 0) {
      setError("You must set at least one prize percentage.");
      return;
    }

    // Create prize distribution with percentages
    const prize_distribution = prizePositions.reduce((acc, position, index) => {
      acc[position] = percentages[index] || 0;
      return acc;
    }, {} as { [key: string]: number });

    updateFormData({
      entry_fee: entryFeeState,
      prize_distribution,
    });
    nextStep();
  };

  const hostEarningsPercentage = Math.max(0, 100 - totalPercentage);
  const hostEarningsCredits = Math.round((hostEarningsPercentage / 100) * totalExpectedPrizePool);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Entry Fee & Prize Distribution</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Entry Fee Section */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Entry Fee (Credits)</label>
          <Input 
            type="number"
            value={entryFeeInput}
            onFocus={e => {
              if (entryFeeInput === "0" || entryFeeInput === "") setEntryFeeInput("");
            }}
            onBlur={e => {
              if (e.target.value === "") setEntryFeeInput("0");
            }}
            onChange={e => {
              const val = e.target.value.replace(/^0+(?!$)/, "");
              setEntryFeeInput(val);
            }}
            className="bg-gaming-card border-2 border-gray-600 text-white focus:border-gaming-primary" 
          />
          <p className="text-xs text-gray-400">
            <span className="font-semibold text-purple-400">Expected prize pool:</span> <span className="text-purple-300 font-semibold">{totalExpectedPrizePool}</span> credits ({maxPlayers} players × {entryFeeState} credits)
          </p>
        </div>

        {/* Prize Distribution Section */}
        <div className="bg-gradient-to-b from-gaming-card to-gaming-bg text-gaming-text rounded-lg shadow-lg border border-gaming-primary/20 overflow-hidden backdrop-blur-sm p-6 relative">
          <div className="absolute top-0 right-0 w-32 h-32 -mr-10 -mt-10 rounded-full bg-gaming-primary/5 blur-xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 -ml-8 -mb-8 rounded-full bg-gaming-accent/5 blur-lg"></div>
          <div className="relative z-10 space-y-4">
            <label className="block text-sm font-medium">Prize Distribution (Percentage-Based)</label>
            {error && (
              <div className="text-red-400 text-xs mb-2">{error}</div>
            )}
            
            {/* Prize Positions */}
            <div className="space-y-3">
              {prizePositions.map((position, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <Input
                    type="text"
                    value={position}
                    onChange={(e) => handlePositionChange(idx, e.target.value)}
                    className="w-20 bg-gaming-card border-2 border-gray-600 text-white focus:border-gaming-primary"
                    placeholder="Position"
                  />
                  <div className="flex-1 flex items-center gap-3">
                    <Slider
                      min={0}
                      max={100}
                      step={1}
                      value={[percentages[idx] || 0]}
                      onValueChange={([val]) => handlePercentChange(idx, String(val))}
                      className="w-full max-w-xs"
                    />
                    <Input 
                      type="number" 
                      min={0}
                      max={100}
                      value={percentages[idx] || 0}
                      onChange={e => handlePercentChange(idx, e.target.value)}
                      className="w-16 bg-gaming-card border-2 border-gray-600 text-white focus:border-gaming-primary text-right text-sm px-2 py-1"
                    />
                    <span className="text-sm text-white">%</span>
                    <span className="text-xs text-gray-400 min-w-[80px]">
                      ({Math.round(((percentages[idx] || 0) / 100) * totalExpectedPrizePool)} credits)
                    </span>
                  </div>
                  {prizePositions.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removePrizePosition(idx)}
                      className="ml-2 min-w-[40px] min-h-[40px] flex-shrink-0 text-red-400 hover:text-red-300"
                    >
                      <Trash2 size={16} />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" className="mt-2" onClick={addPrizePosition}>
                <Plus size={16} className="mr-1" /> Add Position
              </Button>
            </div>

            {/* Summary */}
            <div className="mt-4 p-3 bg-gaming-bg/50 rounded-lg border border-gaming-primary/10">
              <p className="text-xs text-gray-400 mb-1">
                <span className="font-semibold text-purple-400">Total distributed to winners:</span> 
                <span className={`ml-1 font-semibold ${totalPercentage > 100 ? 'text-red-400' : 'text-purple-300'}`}>
                  {totalPercentage}%
                </span>
                <span className="text-gray-400"> ({Math.round((totalPercentage / 100) * totalExpectedPrizePool)} credits)</span>
              </p>
              <p className="text-xs text-gray-400">
                <span className="font-semibold text-green-400">Host earnings:</span> 
                <span className="text-green-300 font-semibold ml-1">{hostEarningsPercentage}%</span>
                <span className="text-gray-400"> ({hostEarningsCredits} credits)</span>
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6">
          <Button type="button" variant="outline" onClick={prevStep} className="flex items-center gap-2">
            <ChevronLeft size={16} />
            Previous
          </Button>
          <Button type="submit" className="flex items-center gap-2">
            Next
            <ChevronRight size={16} />
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EntryAndPrizesForm;
