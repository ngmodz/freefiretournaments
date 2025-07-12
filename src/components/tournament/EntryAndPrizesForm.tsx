import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, Plus, Trash2 } from "lucide-react";
import { TournamentFormData } from "@/pages/TournamentCreate";
import { Slider } from "@/components/ui/slider";

interface PrizePosition {
  position: string;
  credits: number;
}

interface EntryAndPrizesFormProps {
  formData: TournamentFormData;
  updateFormData: (data: Partial<TournamentFormData>) => void;
  nextStep: () => void;
  prevStep: () => void;
}

const DEFAULT_PERCENTAGES = [50, 30, 10];
const DEFAULT_POSITIONS = ["1st", "2nd", "3rd"];

const EntryAndPrizesForm = ({ formData, updateFormData, nextStep, prevStep }: EntryAndPrizesFormProps) => {
  const maxPlayers = formData.max_players || 12;
  const [entryFeeState, setEntryFee] = useState(formData.entry_fee || 0);
  const totalExpectedPrizePool = entryFeeState * maxPlayers || 0; // fallback to 0 to avoid division by zero

  // Default prizes for percent mode
  const getDefaultPrizes = () =>
    DEFAULT_POSITIONS.map((position, idx) => ({
      position,
      credits: totalExpectedPrizePool === 0 ? 0 : Math.round((DEFAULT_PERCENTAGES[idx] / 100) * totalExpectedPrizePool),
    }));

  const [distributionMode, setDistributionMode] = useState<'credits' | 'percent'>('credits');
  const [percentages, setPercentages] = useState<number[]>(
    formData.prize_distribution && Object.keys(formData.prize_distribution).length === 3
      ? DEFAULT_PERCENTAGES
      : DEFAULT_PERCENTAGES
  );
  const [prizes, setPrizes] = useState<PrizePosition[]>(
    formData.prize_distribution && Object.keys(formData.prize_distribution).length === 3
      ? getDefaultPrizes()
      : getDefaultPrizes()
  );
  const [error, setError] = useState<string | null>(null);
  const [manualCreditEdit, setManualCreditEdit] = useState(false);

  // Entry fee input logic for better UX
  const [entryFeeInput, setEntryFeeInput] = useState(entryFeeState === 0 ? "" : String(entryFeeState));

  // Sync entryFeeState with entryFeeInput
  React.useEffect(() => {
    const parsed = parseInt(entryFeeInput, 10);
    setEntryFee(isNaN(parsed) ? 0 : parsed);
  }, [entryFeeInput]);

  // When entryFeeState changes (from input or programmatically), update entryFeeInput if needed
  React.useEffect(() => {
    if (entryFeeState === 0 && entryFeeInput !== "") {
      setEntryFeeInput("");
    } else if (entryFeeState !== 0 && entryFeeInput !== String(entryFeeState)) {
      setEntryFeeInput(String(entryFeeState));
    }
  }, [entryFeeState]);

  // When entryFeeState or maxPlayers changes, update credits in percent mode or update credits live if not manually edited
  React.useEffect(() => {
    if (distributionMode === 'percent') {
      setPrizes((prev) => prev.map((prize, idx) => ({
        ...prize,
        credits: totalExpectedPrizePool === 0 ? 0 : Math.round(((percentages[idx] || 0) / 100) * totalExpectedPrizePool),
      })));
    } else {
      if (!manualCreditEdit) {
        setPrizes((prev) => {
          if (prev.length === 0) {
            // Only reset to default if there are no prizes
            return DEFAULT_POSITIONS.map((position, idx) => ({
              position,
              credits: totalExpectedPrizePool === 0 ? 0 : Math.round((DEFAULT_PERCENTAGES[idx] / 100) * totalExpectedPrizePool),
            }));
          } else {
            // Only update credits for existing positions
            return prev.map((prize) => ({
              ...prize,
              credits: Math.min(prize.credits, totalExpectedPrizePool),
            }));
          }
        });
      } else {
        setPrizes((prev) => prev.map((prize) => ({
          ...prize,
          credits: Math.min(prize.credits, totalExpectedPrizePool),
        })));
      }
    }
  }, [entryFeeState, maxPlayers, distributionMode, percentages, manualCreditEdit]);

  // When switching to percent mode, reset to default percentages and credits
  const handleModeSwitch = (mode: 'credits' | 'percent') => {
    setDistributionMode(mode);
    if (mode === 'percent') {
      setPercentages(DEFAULT_PERCENTAGES);
      setPrizes(getDefaultPrizes());
      setManualCreditEdit(false);
    }
    if (mode === 'credits') {
      setManualCreditEdit(false);
    }
  };

  const totalPrizeCredits = prizes.reduce((sum, p) => sum + Number(p.credits), 0);

  const handlePrizeChange = (index: number, field: "position" | "credits", value: string) => {
    setPrizes((prev) => {
      const updated = [...prev];
      if (field === "credits") {
        updated[index][field] = Number(value);
        setManualCreditEdit(true);
      } else {
        updated[index][field] = value;
      }
      return updated;
    });
    setError(null);
  };

  const handlePercentChange = (index: number, value: string) => {
    const percent = Math.max(0, Math.min(100, Number(value)));
    setPercentages(prev => {
      const updated = [...prev];
      updated[index] = percent;
      return updated;
    });
    setPrizes(prev => {
      const updated = [...prev];
      updated[index].credits = totalExpectedPrizePool === 0 ? 0 : Math.round((percent / 100) * totalExpectedPrizePool);
      return updated;
    });
    setError(null);
  };

  const addPrizePosition = () => {
    setPrizes((prev) => [
      ...prev,
      { position: `${prev.length + 1}th`, credits: 0 },
    ]);
    setPercentages((prev) => [...prev, 0]);
  };

  const removePrizePosition = (index: number) => {
    setPrizes((prev) => prev.filter((_, i) => i !== index));
    setPercentages((prev) => prev.filter((_, i) => i !== index));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const prize_distribution = prizes.reduce((acc, curr) => {
      acc[curr.position] = curr.credits;
      return acc;
    }, {} as { [key: string]: number });
    if (totalPrizeCredits > totalExpectedPrizePool) {
      setError("Total prize credits cannot exceed the total expected prize pool.");
      return;
    }
    if (distributionMode === 'percent') {
      const percentSum = percentages.reduce((a, b) => a + b, 0);
      if (percentSum > 100) {
        setError("Total percentage cannot exceed 100%.");
        return;
      }
    }
    updateFormData({
      entry_fee: entryFeeState,
      prize_distribution,
    });
    nextStep();
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Entry Fee & Prize Distribution</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
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
            min="0"
            max="1000"
          />
          <p className="text-xs text-gray-400">
            <span className="font-semibold text-blue-400">Entry Fee:</span> <span className="font-semibold text-blue-300">{entryFeeState}</span> credits &nbsp; | &nbsp;
            <span className="font-semibold text-blue-400">Number of Players:</span> <span className="font-semibold text-blue-300">{maxPlayers}</span>
          </p>
          <p className="text-xs text-gray-400">
            <span className="font-semibold text-blue-400">Total expected prize pool:</span> <span className="font-semibold text-blue-300">{entryFeeState * maxPlayers}</span> credits
          </p>
        </div>
        <div className="bg-gradient-to-b from-gaming-card to-gaming-bg text-gaming-text rounded-lg shadow-lg border border-gaming-primary/20 overflow-hidden backdrop-blur-sm p-6 relative">
          <div className="absolute top-0 right-0 w-32 h-32 -mr-10 -mt-10 rounded-full bg-gaming-primary/5 blur-xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 -ml-8 -mb-8 rounded-full bg-gaming-accent/5 blur-lg"></div>
          <div className="relative z-10 space-y-4">
            <label className="block text-sm font-medium">Prize Distribution</label>
            {error && (
              <div className="text-red-400 text-xs mb-2">{error}</div>
            )}
            <div className="flex gap-2 mb-2">
              <Button type="button" variant={distributionMode === 'credits' ? 'default' : 'outline'} size="sm" onClick={() => setDistributionMode('credits')}>Credits</Button>
              <Button type="button" variant={distributionMode === 'percent' ? 'default' : 'outline'} size="sm" onClick={() => handleModeSwitch('percent')}>Percent (%)</Button>
            </div>
            <div className="space-y-2">
              {prizes.map((prize, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Input
                    type="text"
                    value={prize.position}
                    onChange={(e) => handlePrizeChange(idx, "position", e.target.value)}
                    className="w-20 bg-gaming-card border-2 border-gray-600 text-white focus:border-gaming-primary"
                    placeholder="Position"
                  />
                  <div className="flex-1 flex items-center gap-2">
                    {distributionMode === 'credits' ? (
                      <>
                        <Slider
                          min={0}
                          max={totalExpectedPrizePool}
                          step={1}
                          value={[prize.credits]}
                          onValueChange={([val]) => handlePrizeChange(idx, "credits", String(val))}
                          className="w-full max-w-xs"
                        />
                        <Input
                          type="number"
                          min={0}
                          max={totalExpectedPrizePool}
                          value={prize.credits}
                          onChange={e => handlePrizeChange(idx, "credits", e.target.value)}
                          className="w-24 bg-gaming-card border-2 border-gray-600 text-white focus:border-gaming-primary text-right text-lg px-3 py-1 align-middle"
                        />
                      </>
                    ) : (
                      <>
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
                          className="w-20 bg-gaming-card border-2 border-gray-600 text-white focus:border-gaming-primary text-right text-lg px-3 py-1 align-middle"
                        />
                        <span className="text-sm text-white ml-1">%</span>
                        <span className="text-xs text-gray-400 ml-2">({Math.round(((percentages[idx] || 0) / 100) * totalExpectedPrizePool)} credits)</span>
                      </>
                    )}
                  </div>
                  {prizes.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removePrizePosition(idx)}
                      className="ml-2 min-w-[40px] min-h-[40px] flex-shrink-0"
                    >
                      <Trash2 size={18} className="text-red-400" />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" className="mt-2" onClick={addPrizePosition}>
                <Plus size={16} className="mr-1" /> Add Position
              </Button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              <span className="font-semibold text-purple-400">Total prize credits:</span> <span className={totalPrizeCredits > totalExpectedPrizePool ? 'text-red-400 font-semibold' : 'text-purple-300 font-semibold'}>{totalPrizeCredits}</span>
            </p>
            <p className="text-sm font-semibold mt-1 text-green-400">
              Host Earnings: {Math.max(0, totalExpectedPrizePool - totalPrizeCredits)} credits
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:justify-between mt-8">
          <Button 
            type="button" 
            variant="outline" 
            onClick={prevStep}
            className="border-gaming-primary text-gaming-primary w-full sm:w-auto order-2 sm:order-1 py-6 sm:py-2 rounded-xl sm:rounded-md text-base"
          >
            <ChevronLeft size={18} className="mr-2" /> Previous
          </Button>
          <Button 
            type="submit" 
            className="bg-gaming-primary hover:bg-gaming-primary/90 w-full sm:w-auto order-1 sm:order-2 py-6 sm:py-2 rounded-xl sm:rounded-md text-base"
          >
            Next <ChevronRight size={18} className="ml-2" />
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EntryAndPrizesForm;