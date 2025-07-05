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
import { ChevronRight, ChevronLeft, AlertCircle, Trophy } from "lucide-react";
import { TournamentFormData } from "@/pages/TournamentCreate";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PrizeDistributionService } from "@/lib/prizeDistributionService";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// Validation schema
const formSchema = z.object({
  entry_fee: z.number()
    .int("Entry fee must be a whole number")
    .min(10, "Minimum entry fee is 10 credits")
    .max(1000, "Maximum entry fee is 1000 credits"),
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
  // Add new prize pool fields
  enablePrizePool: z.boolean().default(true),
  totalPrizeCredits: z.number()
    .int("Prize credits must be a whole number")
    .min(0, "Prize credits cannot be negative"),
  prizeDistributionPercentage: z.object({
    first: z.number().min(0).max(100),
    second: z.number().min(0).max(100),
    third: z.number().min(0).max(100),
  }).refine(data => {
    const total = data.first + data.second + data.third;
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
  const [prizeCreditDistTotal, setPrizeCreditDistTotal] = useState(100);
  
  // Extract prize distribution with default values
  const defaultPrizeDistribution = {
    "1st": formData.prize_distribution["1st"] || 70,
    "2nd": formData.prize_distribution["2nd"] || 20,
    "3rd": formData.prize_distribution["3rd"] || 10,
    "4th": formData.prize_distribution["4th"] || 0,
    "5th": formData.prize_distribution["5th"] || 0,
  };

  // Default prize pool values
  const defaultPrizePool = formData.prizePool || {
    enablePrizePool: true,
    totalPrizeCredits: formData.entry_fee * 10, // Default to 10x entry fee
    prizeDistributionPercentage: {
      first: 50,
      second: 30,
      third: 20
    }
  };
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      entry_fee: formData.entry_fee,
      prize_distribution: defaultPrizeDistribution,
      // Prize pool fields
      enablePrizePool: defaultPrizePool.enablePrizePool,
      totalPrizeCredits: defaultPrizePool.totalPrizeCredits,
      prizeDistributionPercentage: defaultPrizePool.prizeDistributionPercentage
    },
  });

  // Calculate total prize pool
  const totalPrizePool = form.watch("entry_fee") * (formData.max_players || 12);
  
  // Calculate individual prize amounts
  const getPrizeAmount = (percentage: number) => {
    return Math.round((percentage / 100) * totalPrizePool);
  };

  // Calculate prize credit distribution
  const totalPrizeCredits = form.watch("totalPrizeCredits");
  const prizeDistributionPercentage = form.watch("prizeDistributionPercentage");
  const enablePrizePool = form.watch("enablePrizePool");
  
  const prizeDistribution = PrizeDistributionService.calculatePrizeDistribution(
    totalPrizeCredits,
    prizeDistributionPercentage
  );
  
  // Recalculate total percentage whenever prize distribution changes
  useEffect(() => {
    const prizeDistribution = form.watch("prize_distribution");
    const total = Object.values(prizeDistribution).reduce((sum, value) => sum + (value || 0), 0);
    setPrizeDistTotal(total);
    
    // Also calculate prize credit distribution total
    const prizeCreditDist = form.watch("prizeDistributionPercentage");
    const creditTotal = prizeCreditDist.first + prizeCreditDist.second + prizeCreditDist.third;
    setPrizeCreditDistTotal(creditTotal);
  }, [form.watch("prize_distribution"), form.watch("prizeDistributionPercentage")]);
  
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    // Calculate actual prize distribution amounts
    const calculatedPrizeDistribution = PrizeDistributionService.calculatePrizeDistribution(
      values.totalPrizeCredits,
      values.prizeDistributionPercentage
    );
    
    // Update form data with prize pool information
    updateFormData({
      entry_fee: values.entry_fee,
      prize_distribution: values.prize_distribution,
      prizePool: {
        enablePrizePool: values.enablePrizePool,
        totalPrizeCredits: values.totalPrizeCredits,
        prizeDistribution: calculatedPrizeDistribution,
        distributionPercentage: values.prizeDistributionPercentage,
        isDistributed: false
      }
    });
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

  // Helper to adjust prize credit distribution percentages
  const adjustPrizeCreditDistribution = (position: 'first' | 'second' | 'third', newValue: number) => {
    const currentValues = { ...form.watch("prizeDistributionPercentage") };
    const otherPositions = ['first', 'second', 'third'].filter(pos => pos !== position) as Array<'first' | 'second' | 'third'>;
    
    // Set the new value for the changed position
    currentValues[position] = newValue;
    
    // Calculate the total and needed adjustment
    const currentTotal = currentValues.first + currentValues.second + currentValues.third;
    const adjustment = 100 - currentTotal;
    
    if (adjustment === 0) {
      // No adjustment needed
      form.setValue("prizeDistributionPercentage", currentValues);
      return;
    }
    
    // Get adjustable positions (positions with non-zero values)
    const adjustablePositions = otherPositions.filter(pos => currentValues[pos] > 0);
    
    if (adjustablePositions.length === 0) {
      // No positions to adjust
      return;
    }
    
    // Calculate current total of adjustable positions
    const adjustableTotal = adjustablePositions.reduce((sum, pos) => sum + currentValues[pos], 0);
    
    // Distribute adjustment proportionally
    adjustablePositions.forEach((pos, index) => {
      const isLast = index === adjustablePositions.length - 1;
      const proportion = currentValues[pos] / adjustableTotal;
      
      if (isLast) {
        // Make sure the last position makes the total exactly 100%
        const totalExceptLast = ['first', 'second', 'third']
          .filter(p => p !== pos)
          .reduce((sum, p) => sum + currentValues[p as 'first' | 'second' | 'third'], 0);
        
        currentValues[pos] = Math.max(0, 100 - totalExceptLast);
      } else {
        // Adjust proportionally
        currentValues[pos] = Math.max(0, Math.round(currentValues[pos] + (adjustment * proportion)));
      }
    });
    
    form.setValue("prizeDistributionPercentage", currentValues);
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
                <FormLabel>Entry Fee (Credits)</FormLabel>
                <FormControl>
                  <div className="flex items-center space-x-2">
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
                  Total expected prize pool: {totalPrizePool} credits
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

          {/* Prize Pool Section */}
          <Card className="bg-gaming-card border-gaming-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Prize Pool Configuration
              </CardTitle>
              <FormDescription>
                Set up tournament credit prizes for winners
              </FormDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="enablePrizePool"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Enable Prize Pool</FormLabel>
                      <FormDescription>
                        Award tournament credits to winners
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {enablePrizePool && (
                <>
                  <FormField
                    control={form.control}
                    name="totalPrizeCredits"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Prize Credits</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            className="bg-gaming-card text-white"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            value={field.value}
                          />
                        </FormControl>
                        <FormDescription>
                          Total credits to be distributed among winners
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Credit Prize Distribution</h4>
                      <span className={prizeCreditDistTotal === 100 ? "text-green-500" : "text-red-500"}>
                        Total: {prizeCreditDistTotal}%
                      </span>
                    </div>

                    {prizeCreditDistTotal !== 100 && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Prize distribution must total exactly 100%
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* First Place */}
                    <FormField
                      control={form.control}
                      name="prizeDistributionPercentage.first"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex justify-between items-center mb-2">
                            <FormLabel className="text-base font-medium">1st Place</FormLabel>
                            <div className="flex items-center space-x-2">
                              <span className="text-gaming-accent font-semibold">{field.value}%</span>
                              <span className="text-gaming-muted text-sm">
                                {prizeDistribution.first} credits
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
                                  adjustPrizeCreditDistribution('first', newValue);
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
                                  adjustPrizeCreditDistribution('first', newValue);
                                }}
                              />
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {/* Second Place */}
                    <FormField
                      control={form.control}
                      name="prizeDistributionPercentage.second"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex justify-between items-center mb-2">
                            <FormLabel className="text-base font-medium">2nd Place</FormLabel>
                            <div className="flex items-center space-x-2">
                              <span className="text-gaming-accent font-semibold">{field.value}%</span>
                              <span className="text-gaming-muted text-sm">
                                {prizeDistribution.second} credits
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
                                  adjustPrizeCreditDistribution('second', newValue);
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
                                  adjustPrizeCreditDistribution('second', newValue);
                                }}
                              />
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {/* Third Place */}
                    <FormField
                      control={form.control}
                      name="prizeDistributionPercentage.third"
                      render={({ field }) => (
                        <FormItem>
                          <div className="flex justify-between items-center mb-2">
                            <FormLabel className="text-base font-medium">3rd Place</FormLabel>
                            <div className="flex items-center space-x-2">
                              <span className="text-gaming-accent font-semibold">{field.value}%</span>
                              <span className="text-gaming-muted text-sm">
                                {prizeDistribution.third} credits
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
                                  adjustPrizeCreditDistribution('third', newValue);
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
                                  adjustPrizeCreditDistribution('third', newValue);
                                }}
                              />
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          
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
      </Form>
    </div>
  );
};

export default EntryAndPrizesForm; 