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
          <FormField
            control={form.control}
            name="rules"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tournament Rules</FormLabel>
                <FormDescription>
                  Add specific rules for your tournament (e.g., no emulators, no teaming)
                </FormDescription>
                <FormControl>
                  <Textarea 
                    placeholder="Enter tournament rules..." 
                    className="bg-gaming-card text-white placeholder:text-gray-400 min-h-32" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
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

export default RulesAndMediaForm; 