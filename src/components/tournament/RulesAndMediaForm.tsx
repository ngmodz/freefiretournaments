import { useState } from "react";
import { 
  Form,
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { TournamentFormData } from "@/pages/TournamentCreate";

// Validation schema
const formSchema = z.object({
  rules: z.string()
    .min(10, "Rules must be at least 10 characters")
    .max(1000, "Rules cannot exceed 1000 characters"),
});

interface RulesAndMediaFormProps {
  formData: TournamentFormData;
  updateFormData: (data: Partial<TournamentFormData>) => void;
  nextStep: () => void;
  prevStep: () => void;
}

const RulesAndMediaForm = ({ formData, updateFormData, nextStep, prevStep }: RulesAndMediaFormProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      rules: formData.rules,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    updateFormData(values);
    nextStep();
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Tournament Rules</h2>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-gradient-to-b from-gaming-card to-gaming-bg text-gaming-text rounded-lg shadow-lg border border-gaming-primary/20 overflow-hidden backdrop-blur-sm p-6 relative">
            <div className="absolute top-0 right-0 w-32 h-32 -mr-10 -mt-10 rounded-full bg-gaming-primary/5 blur-xl"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 -ml-8 -mb-8 rounded-full bg-gaming-accent/5 blur-lg"></div>
            <div className="relative z-10">
              <FormField
                control={form.control}
                name="rules"
                render={({ field }) => (
                  <FormItem>
                    <FormDescription>
                      Default rules are provided below. You can edit, add, or remove rules as needed for your tournament (e.g., no emulators, no teaming).
                    </FormDescription>
                    <FormControl>
                      <Textarea 
                        placeholder={`1. Don't change your slot in the custom room as it will make it difficult for the host to verify participants.\n2. No use of unauthorized third-party apps or mods.\n3. No teaming with other squads during matches.\n4. Intentionally disconnecting to avoid elimination is prohibited.\n5. Any form of harassment or toxic behavior will not be tolerated.`}
                        className="bg-gaming-card text-white placeholder:text-gray-400 min-h-32" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-end mt-6">
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
              className="bg-gaming-primary hover:bg-gaming-primary/90 w-full sm:w-auto order-1 sm:order-2 py-6 sm:py-2 rounded-xl sm:rounded-md text-base font-medium"
            >
              Next <ChevronRight size={18} className="ml-2" />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default RulesAndMediaForm; 