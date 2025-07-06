import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { TournamentFormData } from "@/pages/TournamentCreate";

interface EntryAndPrizesFormProps {
  formData: TournamentFormData;
  updateFormData: (data: Partial<TournamentFormData>) => void;
  nextStep: () => void;
  prevStep: () => void;
}

const EntryAndPrizesForm = ({ formData, updateFormData, nextStep, prevStep }: EntryAndPrizesFormProps) => {
  const [entryFee, setEntryFee] = useState(formData.entry_fee);
  const [totalPrizeCredits, setTotalPrizeCredits] = useState(formData.prizePool?.totalPrizeCredits || 500);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    updateFormData({
      entry_fee: entryFee,
      prizePool: {
        enablePrizePool: true,
        totalPrizeCredits: totalPrizeCredits,
        prizeDistribution: {
          first: Math.floor(totalPrizeCredits * 0.5),
          second: Math.floor(totalPrizeCredits * 0.3),
          third: Math.floor(totalPrizeCredits * 0.2)
        },
        distributionPercentage: {
          first: 50,
          second: 30,
          third: 20
        },
        isDistributed: false
      }
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
            value={entryFee}
            onChange={(e) => setEntryFee(Number(e.target.value))}
            className="bg-gaming-card border-2 border-gray-600 text-white focus:border-gaming-primary" 
            min="10"
            max="1000"
          />
          <p className="text-xs text-gray-400">
            Total expected prize pool: {entryFee * (formData.max_players || 12)} credits
          </p>
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium">Total Prize Credits</label>
          <Input 
            type="number" 
            value={totalPrizeCredits}
            onChange={(e) => setTotalPrizeCredits(Number(e.target.value))}
            className="bg-gaming-card border-2 border-gray-600 text-white focus:border-gaming-primary" 
            min="0"
          />
          <p className="text-xs text-gray-400">
            Credits to be distributed: 1st: {Math.floor(totalPrizeCredits * 0.5)}, 2nd: {Math.floor(totalPrizeCredits * 0.3)}, 3rd: {Math.floor(totalPrizeCredits * 0.2)}
          </p>
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