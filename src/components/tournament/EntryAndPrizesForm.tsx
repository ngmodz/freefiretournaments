import { useState, useEffect } from "react";
import { 
  Form,
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { ChevronRight, ChevronLeft, AlertCircle } from "lucide-react";
import { TournamentFormData } from "@/pages/TournamentCreate";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Validation schema
const formSchema = z.object({
  entry_fee: z.number()
    .int("Entry fee must be a whole number")
    .min(10, "Minimum entry fee is ₹10")
    .max(1000, "Maximum entry fee is ₹1000"),
  prize_distribution: z.object({
    "1st": z.number().min(0).max(100),
    "2nd": z.number().min(0).max(100),
    "3rd": z.number().min(0).max(100),
    "4th": z.number().min(0).max(100).optional(),
    "5th": z.number().min(0).max(100).optional(),
  }).refine(data => {
    const total = Object.values(data).reduce((sum, value) => sum + (value || 0), 0);
    return total === 100;
  }, {
    message: "Prize distribution must total exactly 100%",
    path: [],
  }),
});

interface EntryAndPrizesFormProps {
  formData: TournamentFormData;
  updateFormData: (data: Partial<TournamentFormData>) => void;
  nextStep: () => void;
  prevStep: () => void;
}

const EntryAndPrizesForm = ({ formData, updateFormData, nextStep, prevStep }: EntryAndPrizesFormProps) => {
  const [prizeDistTotal, setPrizeDistTotal] = useState(100);
  
  // Extract prize distribution with default values
  const defaultPrizeDistribution = {
    "1st": formData.prize_distribution["1st"] || 70,
    "2nd": formData.prize_distribution["2nd"] || 20,
    "3rd": formData.prize_distribution["3rd"] || 10,
    "4th": formData.prize_distribution["4th"] || 0,
    "5th": formData.prize_distribution["5th"] || 0,
  };
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      entry_fee: formData.entry_fee,
      prize_distribution: defaultPrizeDistribution,
    },
  });

  // Calculate total prize pool
  const totalPrizePool = form.watch("entry_fee") * (formData.max_players || 12);
  
  // Calculate individual prize amounts
  const getPrizeAmount = (percentage: number) => {
    return Math.round((percentage / 100) * totalPrizePool);
  };
  
  // Recalculate total percentage whenever prize distribution changes
  useEffect(() => {
    const prizeDistribution = form.watch("prize_distribution");
    const total = Object.values(prizeDistribution).reduce((sum, value) => sum + (value || 0), 0);
    setPrizeDistTotal(total);
  }, [form.watch("prize_distribution")]);
  
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    updateFormData(values);
    nextStep();
  };

  // Helper to update the other prizes when one prize changes
  const adjustOtherPrizes = (changedField: string, newValue: number) => {
    const currentValues = form.watch("prize_distribution");
    const currentTotal = Object.entries(currentValues).reduce(
      (sum, [key, value]) => sum + (key === changedField ? newValue : (value || 0)), 
      0
    );
    
    // Calculate how much we need to adjust
    const adjustment = 100 - currentTotal;
    if (adjustment === 0) return; // Nothing to adjust
    
    // Get fields that can be adjusted (fields other than the changed one)
    const adjustableFields = Object.entries(currentValues)
      .filter(([key, value]) => key !== changedField && (value || 0) > 0)
      .map(([key]) => key);
    
    if (adjustableFields.length === 0) return;
    
    // Distribute the adjustment proportionally
    const currentAdjustableTotal = adjustableFields.reduce(
      (sum, key) => sum + (currentValues[key] || 0), 
      0
    );
    
    const updatedValues = { ...currentValues, [changedField]: newValue };
    
    adjustableFields.forEach((key, index) => {
      const isLast = index === adjustableFields.length - 1;
      const proportion = (currentValues[key] || 0) / currentAdjustableTotal;
      
      if (isLast) {
        // Ensure the last field makes the total exactly 100%
        const currentTotalExceptLast = Object.entries(updatedValues)
          .filter(([k]) => k !== key)
          .reduce((sum, [, value]) => sum + (value || 0), 0);
        
        updatedValues[key] = Math.max(0, 100 - currentTotalExceptLast);
      } else {
        // Adjust proportionally
        const newFieldValue = Math.max(0, (currentValues[key] || 0) + (adjustment * proportion));
        updatedValues[key] = Math.round(newFieldValue);
      }
    });
    
    form.setValue("prize_distribution", updatedValues as any);
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Entry Fee & Prize Distribution</h2>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="entry_fee"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Entry Fee (₹)</FormLabel>
                <FormControl>
                  <div className="flex items-center space-x-2">
                    <span className="text-gaming-muted">₹</span>
                    <Input 
                      type="number" 
                      className="bg-gaming-card text-white" 
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))} 
                      value={field.value}
                    />
                  </div>
                </FormControl>
                <FormDescription>
                  Total expected prize pool: ₹{totalPrizePool}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="bg-gaming-card p-4 rounded-md space-y-4">
            <h3 className="font-semibold">Prize Distribution</h3>
            <FormDescription>
              Distribute the prize pool among winners (must total 100%)
            </FormDescription>
            
            {prizeDistTotal !== 100 && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Prize distribution currently adds up to {prizeDistTotal}% (should be 100%)
                </AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-6">
              {["1st", "2nd", "3rd", "4th", "5th"].map((position) => {
                const prizeDistribution = form.watch("prize_distribution");
                const fieldValue = prizeDistribution[position as keyof typeof prizeDistribution];
                if (fieldValue === 0) return null;
                return (
                  <FormField
                    key={position}
                    control={form.control}
                    name={`prize_distribution.${position}` as any}
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex justify-between items-center mb-2">
                          <FormLabel className="text-base font-medium">{position} Place</FormLabel>
                          <div className="flex items-center space-x-2">
                            <span className="text-gaming-accent font-semibold">{field.value}%</span>
                            <span className="text-gaming-muted text-sm">
                              ₹{getPrizeAmount(field.value)}
                            </span>
                          </div>
                        </div>
                        <FormControl>
                          <div className="flex items-center space-x-2">
                            <Slider
                              defaultValue={[field.value]}
                              max={100}
                              step={1}
                              className="flex-1 accent-gaming-primary"
                              onValueChange={(vals) => {
                                const newValue = vals[0];
                                field.onChange(newValue);
                                adjustOtherPrizes(`${position}`, newValue);
                              }}
                            />
                            <Input 
                              type="number" 
                              className="bg-gaming-card text-white w-16" 
                              min={0}
                              max={100}
                              value={field.value}
                              onChange={(e) => {
                                const newValue = Number(e.target.value);
                                field.onChange(newValue);
                                adjustOtherPrizes(`${position}`, newValue);
                              }}
                            />
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                );
              })}
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
              disabled={prizeDistTotal !== 100}
              className="bg-gaming-primary hover:bg-gaming-primary-dark w-full sm:w-auto order-1 sm:order-2 py-6 sm:py-2 rounded-xl sm:rounded-md text-base font-medium"
            >
              Next <ChevronRight size={18} className="ml-2" />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default EntryAndPrizesForm; 