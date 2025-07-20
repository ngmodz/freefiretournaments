import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, Plus, Trash2 } from "lucide-react";
import { TournamentFormData } from "@/pages/TournamentCreate";
import { Slider } from "@/components/ui/slider";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EntryAndPrizesFormProps {
  formData: TournamentFormData;
  updateFormData: (data: Partial<TournamentFormData>) => void;
  nextStep: () => void;
  prevStep: () => void;
}

const DEFAULT_PERCENTAGES = [60, 25, 15];
const DEFAULT_POSITIONS = ["1st", "2nd", "3rd"];

const EntryAndPrizesForm = ({ formData, updateFormData, nextStep, prevStep }: EntryAndPrizesFormProps) => {
  const isMobile = useIsMobile();
  const maxPlayers = formData.max_players || 12;
  const [entryFeeState, setEntryFee] = useState(formData.entry_fee || 0);
  const totalExpectedPrizePool = entryFeeState * maxPlayers || 0;

  // Add custom CSS to override the white background
  useEffect(() => {
    // Create a style element
    const style = document.createElement('style');
    
    // Add CSS rules to fix the white background issue - focusing on desktop view
    style.innerHTML = `
      /* Force dark background on the entire table and container */
      .prize-distribution-table {
        background-color: #151926 !important;
        border-collapse: collapse !important;
        width: 100% !important;
      }
      
      /* Target the white header row */
      .prize-distribution-table thead,
      .prize-distribution-table thead tr,
      .prize-distribution-table thead th {
        background-color: #151926 !important;
        border-color: #2A2A2A !important;
        color: #888888 !important;
      }
      
      /* Target all table cells and rows */
      .prize-distribution-table td,
      .prize-distribution-table tr {
        background-color: #151926 !important;
        border-color: #2A2A2A !important;
      }
      
      /* Target the container */
      .prize-distribution-container {
        background-color: #151926 !important;
        border-color: #2A2A2A !important;
      }
      
      /* CRITICAL: Target the horizontal divider lines specifically */
      .prize-distribution-table tbody tr {
        border-top-color: #2A2A2A !important;
        border-bottom-color: #2A2A2A !important;
      }
      
      /* Target any dividers in the container */
      .prize-distribution-container hr {
        border-color: #2A2A2A !important;
        background-color: #2A2A2A !important;
        height: 1px !important;
      }
      
      /* Extremely specific selector for the horizontal lines */
      .prize-distribution-container > div > div > table > tbody > tr {
        border-top: 1px solid #2A2A2A !important;
        border-bottom: 1px solid #2A2A2A !important;
      }
      
      /* Target the POSITION and PERCENTAGE headers */
      .prize-distribution-container [class*="uppercase"] {
        background-color: #151926 !important;
        color: #888888 !important;
      }
      
      /* Override any divide utilities */
      .prize-distribution-container .divide-y > * {
        border-top-color: #2A2A2A !important;
      }
      
      /* Target the specific white lines in the screenshot */
      .prize-distribution-container > div > div > div {
        border-color: #2A2A2A !important;
      }
      
      /* Desktop-only layout adjustments */
      @media (min-width: 768px) {
        /* Make the percentage column take less space */
        .prize-distribution-table th:nth-child(2),
        .prize-distribution-table td:nth-child(2) {
          width: 60% !important;
        }
        
        /* Make the delete button column more compact */
        .prize-distribution-table th:nth-child(3),
        .prize-distribution-table td:nth-child(3) {
          width: 5% !important;
          padding-right: 0.5rem !important;
        }
        
        /* Adjust position column width */
        .prize-distribution-table th:nth-child(1),
        .prize-distribution-table td:nth-child(1) {
          width: 35% !important;
        }
        
        /* Make the delete button closer to the percentage */
        .prize-distribution-table td:nth-child(3) {
          text-align: right !important;
          padding-left: 0 !important;
        }
      }
    `;
    
    // Append the style element to the document head
    document.head.appendChild(style);
    
    // Clean up function to remove the style element when the component unmounts
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const [prizePoolType, setPrizePoolType] = useState<"percentage" | "manual">(
    formData.entry_fee === 0 ? "manual" : "percentage"
  );

  // Helper to get initial manual prize positions from formData
  function getInitialManualPrizePositions() {
    const positions = [];
    if (formData.manual_prize_pool?.first !== undefined) positions.push({ label: '1st', value: formData.manual_prize_pool.first?.toString() ?? '' });
    if (formData.manual_prize_pool?.second !== undefined) positions.push({ label: '2nd', value: formData.manual_prize_pool.second?.toString() ?? '' });
    if (formData.manual_prize_pool?.third !== undefined) positions.push({ label: '3rd', value: formData.manual_prize_pool.third?.toString() ?? '' });
    if (positions.length === 0) positions.push({ label: '1st', value: '' });
    return positions;
  }

  // Manual prize pool state as an array for flexibility
  const [manualPrizePositions, setManualPrizePositions] = useState(getInitialManualPrizePositions());

  // Add position (up to 3, no duplicates)
  const addManualPrizePosition = () => {
    if (manualPrizePositions.length < 3) {
      const allLabels = ['1st', '2nd', '3rd'];
      const nextLabel = allLabels.find(l => !manualPrizePositions.some(p => p.label === l));
      if (nextLabel) setManualPrizePositions([...manualPrizePositions, { label: nextLabel, value: '' }]);
    }
  };

  // Remove position (down to 1)
  const removeManualPrizePosition = (idx: number) => {
    if (manualPrizePositions.length > 1) {
      setManualPrizePositions(manualPrizePositions.filter((_, i) => i !== idx));
    }
  };

  // Handle value change
  const handleManualPrizeValueChange = (idx: number, value: string) => {
    setManualPrizePositions(manualPrizePositions.map((pos, i) => i === idx ? { ...pos, value } : pos));
  };

  // When submitting, map array to manual_prize_pool object
  const manualPrizePoolObj = manualPrizePositions.reduce((acc, pos) => {
    if (pos.label === '1st') acc.first = Number(pos.value) || 0;
    if (pos.label === '2nd') acc.second = Number(pos.value) || 0;
    if (pos.label === '3rd') acc.third = Number(pos.value) || 0;
    return acc;
  }, { first: 0, second: 0, third: 0 } as { first: number; second: number; third: number });

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
      if (newValue === 0) {
        setPrizePoolType("manual");
      } else {
        setPrizePoolType("percentage");
      }
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

  const handleManualPrizeChange = (field: "first" | "second" | "third", value: string) => {
    const amount = parseInt(value, 10);
    // setManualPrizes(prev => ({ ...prev, [field]: isNaN(amount) ? undefined : amount })); // This line was removed
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (prizePoolType === 'percentage') {
      if (totalPercentage > 100) {
        setError("Total percentage cannot exceed 100%.");
        return;
      }

      if (totalPercentage === 0) {
        setError("You must set at least one prize percentage.");
        return;
      }
      
      const prize_distribution = prizePositions.reduce((acc, position, index) => {
        acc[position] = percentages[index] || 0;
        return acc;
      }, {} as { [key: string]: number });
      
      updateFormData({
        entry_fee: entryFeeState,
        prize_distribution,
        manual_prize_pool: {} // Clear manual prizes
      });

    } else { // Manual prize pool
      updateFormData({
        entry_fee: 0,
        prize_distribution: {}, // Clear percentage prizes
        manual_prize_pool: manualPrizePoolObj
      });
    }

    nextStep();
  };

  const hostEarningsPercentage = Math.max(0, 100 - totalPercentage);
  const hostEarningsCredits = Math.round((hostEarningsPercentage / 100) * totalExpectedPrizePool);

  const totalManualPrize = manualPrizePositions.reduce((sum, pos) => sum + (Number(pos.value) || 0), 0);

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
          {entryFeeState > 0 && (
            <p className="text-xs text-gray-400">
              <span className="font-semibold text-purple-400">Total prize pool:</span> <span className="text-purple-300 font-semibold">{totalExpectedPrizePool.toLocaleString()}</span> credits ({maxPlayers} players × {entryFeeState} credits)
            </p>
          )}
        </div>

        {/* Prize Distribution Section */}
        <div className="bg-gradient-to-b from-gaming-card to-gaming-bg text-gaming-text rounded-lg shadow-lg border border-gaming-primary/20 overflow-hidden backdrop-blur-sm p-6 relative">
          <div className="absolute top-0 right-0 w-32 h-32 -mr-10 -mt-10 rounded-full bg-gaming-primary/5 blur-xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 -ml-8 -mb-8 rounded-full bg-gaming-accent/5 blur-lg"></div>
          <div className="relative z-10 space-y-4">
            <label className="block text-sm font-medium">Prize Distribution</label>
            
            {entryFeeState > 0 ? (
                <p className="text-xs text-gray-400">For paid tournaments, the prize pool is funded by player entry fees. Distribute prizes as a percentage of the total pool.</p>
            ) : (
              <p className="text-xs text-gray-400">For free tournaments, you set a fixed prize pool that you fund yourself. This amount will be deducted from your <span className="font-semibold text-purple-400">Tournament Credits</span>.</p>
            )}

            {error && (
              <div className="text-red-400 text-xs mb-2">{error}</div>
            )}
            
            {prizePoolType === 'percentage' ? (
              <>
                {/* Prize Positions */}
                {isMobile ? (
                  <div className="space-y-4">
                    {prizePositions.map((position, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-gaming-card rounded-lg border border-gaming-border prize-distribution-container">
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                          <Input
                            type="text"
                            value={position}
                            onChange={(e) => handlePositionChange(idx, e.target.value)}
                            className="w-20 bg-gaming-card border-2 border-gray-600 text-white focus:border-gaming-primary"
                            placeholder="Position"
                          />
                          <div className="flex-1 sm:hidden"></div> {/* Spacer for mobile */}
                          {prizePositions.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removePrizePosition(idx)}
                              className="ml-auto sm:ml-2 min-w-[32px] min-h-[32px] flex-shrink-0 text-red-400 hover:text-red-300"
                            >
                              <Trash2 size={16} />
                            </Button>
                          )}
                        </div>
                        
                        <div className="w-full sm:flex-1">
                          <div className="flex items-center gap-3">
                            <Slider
                              min={0}
                              max={100}
                              step={1}
                              value={[percentages[idx] || 0]}
                              onValueChange={([val]) => handlePercentChange(idx, String(val))}
                              className="w-full"
                            />
                            <Input 
                              type="number" 
                              min={0}
                              max={100}
                              value={percentages[idx] || 0}
                              onChange={e => handlePercentChange(idx, e.target.value)}
                              className="w-20 bg-gaming-card border-2 border-gray-600 text-white focus:border-gaming-primary text-right text-sm px-2 py-1"
                            />
                          </div>
                          <div className="text-right text-xs mt-1 text-purple-400">
                            {Math.round((percentages[idx] / 100) * totalExpectedPrizePool)} credits
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg overflow-hidden border border-gaming-border prize-distribution-container">
                    <table className="w-full text-left bg-gaming-card prize-distribution-table">
                      <thead className="bg-black/30">
                        <tr>
                          <th className="p-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-1/3">Position</th>
                          <th className="p-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-2/3">Percentage</th>
                          <th className="p-3"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gaming-border">
                        {prizePositions.map((position, idx) => (
                          <tr key={idx} className="hover:bg-black/20">
                            <td className="p-3 align-middle">
                              <Input
                                type="text"
                                value={position}
                                onChange={(e) => handlePositionChange(idx, e.target.value)}
                                className="bg-gaming-card border-2 border-gray-600 text-white focus:border-gaming-primary"
                                placeholder="e.g., 1st"
                              />
                            </td>
                            <td className="p-3 align-middle">
                              <div className="flex items-center gap-3">
                                <Slider
                                  min={0}
                                  max={100}
                                  step={1}
                                  value={[percentages[idx] || 0]}
                                  onValueChange={([val]) => handlePercentChange(idx, String(val))}
                                />
                                <Input 
                                  type="number" 
                                  min={0}
                                  max={100}
                                  value={percentages[idx] || 0}
                                  onChange={e => handlePercentChange(idx, e.target.value)}
                                  className="w-24 bg-gaming-card border-2 border-gray-600 text-white focus:border-gaming-primary text-right"
                                />
                                <span className="text-gray-400">%</span>
                              </div>
                              <div className="text-right text-xs mt-1 text-purple-400">
                                ~{Math.round((percentages[idx] / 100) * totalExpectedPrizePool)} credits
                              </div>
                            </td>
                            <td className="p-3 align-middle text-right">
                              {prizePositions.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removePrizePosition(idx)}
                                  className="text-red-400 hover:text-red-300"
                                >
                                  <Trash2 size={16} />
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <Button type="button" variant="outline" onClick={addPrizePosition} className="flex items-center gap-2">
                  <Plus size={16} /> Add Position
                </Button>
                
                {/* Total and Host Earnings */}
                <div className="pt-4 border-t border-gray-700 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Prize Percentage:</span>
                    <span className={`font-semibold ${totalPercentage > 100 ? 'text-red-400' : ''}`}>{totalPercentage}%</span>
                  </div>
                  <div className="flex justify-between items-center text-green-400">
                    <span className="text-sm font-medium">Host's Earnings:</span>
                    <span className="font-semibold">{hostEarningsPercentage}% (~{hostEarningsCredits} credits)</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                {manualPrizePositions.map((pos, idx) => (
                  <div key={pos.label}>
                    <label className="block text-sm font-medium">{pos.label} Place Prize (Credits)</label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={pos.value}
                        onChange={e => handleManualPrizeValueChange(idx, e.target.value)}
                        className="bg-gaming-card border-2 border-gray-600 text-white focus:border-gaming-primary"
                        placeholder={`e.g., ${idx === 0 ? '500' : idx === 1 ? '250' : '100'} Credits`}
                      />
                      {manualPrizePositions.length > 1 && (
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeManualPrizePosition(idx)} className="text-red-400 hover:text-red-300">
                          <Trash2 size={16} />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {manualPrizePositions.length < 3 && (
                  <Button type="button" variant="outline" onClick={addManualPrizePosition} className="flex items-center gap-2">
                    <Plus size={16} /> Add Position
                  </Button>
                )}

                  <div className="pt-4 border-t border-gray-700">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium text-purple-400">Total Prize Pool to be Deducted:</span>
                      <span className="font-semibold text-white">{totalManualPrize.toLocaleString()} Credits</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">This amount will be deducted from your tournament credits upon publishing. Your balance can go negative.</p>
                  </div>
              </div>
            )}
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
