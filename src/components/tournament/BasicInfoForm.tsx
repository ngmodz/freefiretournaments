import { useState, useEffect } from "react";
import { 
  Form,
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { ChevronRight } from "lucide-react";
import { TournamentFormData } from "@/pages/TournamentCreate";

// Validation schema
const formSchema = z.object({
  name: z.string()
    .min(3, "Tournament name must be at least 3 characters")
    .max(50, "Tournament name cannot exceed 50 characters")
    .regex(/^[a-zA-Z0-9 ]+$/, "Only alphanumeric characters and spaces are allowed"),
  description: z.string()
    .min(10, "Description must be at least 10 characters")
    .max(500, "Description cannot exceed 500 characters"),
  mode: z.enum(["Solo", "Duo", "Squad"]),
  max_players: z.number()
    .int("Must be a whole number")
    .positive("Must be a positive number"),
  start_date: z.string()
    .refine(date => new Date(date) > new Date(), {
      message: "Tournament must start in the future"
    }),
});

interface BasicInfoFormProps {
  formData: TournamentFormData;
  updateFormData: (data: Partial<TournamentFormData>) => void;
  nextStep: () => void;
}

const BasicInfoForm = ({ formData, updateFormData, nextStep }: BasicInfoFormProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: formData.name,
      description: formData.description,
      mode: formData.mode,
      max_players: formData.max_players,
      start_date: formData.start_date,
    },
  });

  // Update max_players based on selected mode
  useEffect(() => {
    const mode = form.watch("mode");
    let defaultMaxPlayers = 12; // Default for Solo
    
    if (mode === "Duo") {
      defaultMaxPlayers = 24; // 12 teams of 2
    } else if (mode === "Squad") {
      defaultMaxPlayers = 48; // 12 teams of 4
    }
    
    form.setValue("max_players", defaultMaxPlayers);
  }, [form.watch("mode")]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    updateFormData(values);
    nextStep();
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Basic Tournament Information</h2>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tournament Name</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter tournament name" 
                    className="bg-gaming-card text-white placeholder:text-gray-400" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Describe your tournament" 
                    className="bg-gaming-card text-white placeholder:text-gray-400 min-h-24" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField
              control={form.control}
              name="mode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Game Mode</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-gaming-card text-white">
                        <SelectValue placeholder="Select mode" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-gaming-card text-white">
                      <SelectItem value="Solo">Solo</SelectItem>
                      <SelectItem value="Duo">Duo</SelectItem>
                      <SelectItem value="Squad">Squad</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="max_players"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max Players</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      className="bg-gaming-card text-white" 
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))} 
                      value={field.value}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="start_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date & Time</FormLabel>
                  <FormControl>
                    <Input 
                      type="datetime-local" 
                      className="bg-gaming-card text-white" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="flex justify-end mt-8">
            <Button 
              type="submit" 
              className="bg-gaming-primary hover:bg-gaming-primary-dark w-full sm:w-auto py-6 sm:py-2 rounded-xl sm:rounded-md text-base font-medium"
            >
              Next <ChevronRight size={18} className="ml-2" />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default BasicInfoForm; 