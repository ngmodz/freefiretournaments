import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Send, MessageSquare } from "lucide-react";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";

// Define form schema with Zod for feedback form
const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters",
  }),
  email: z.string().email({
    message: "Please enter a valid email address",
  }),
  category: z.string().min(1, {
    message: "Please select a category",
  }),
  feedback: z.string().min(10, {
    message: "Feedback must be at least 10 characters",
  }),
});

type FormValues = z.infer<typeof formSchema>;

interface FeedbackFormProps {
  onClose: () => void;
}

const FeedbackForm = ({ onClose }: FeedbackFormProps) => {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const isMobile = useIsMobile();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: currentUser?.displayName || "",
      email: currentUser?.email || "",
      category: "",
      feedback: "",
    },
  });

  const { formState: { isSubmitting } } = form;

  const onSubmit = async (data: FormValues) => {
    try {
      const response = await fetch('/api/email-service', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'feedback',
          ...data,
          uid: currentUser?.uid,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Something went wrong');
      }

      toast({
        title: "Feedback submitted successfully",
        description: "Thank you for your feedback. We appreciate your input!",
      });
      
      onClose();
    } catch (error) {
      console.error("Failed to submit feedback:", error);
      toast({
        title: "Failed to submit feedback",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <MessageSquare className="h-6 w-6 text-green-500" />
        <div>
          <h2 className="text-xl font-bold text-white">Give Feedback</h2>
          <p className="text-sm text-gaming-muted">Share your thoughts and help us improve</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Your Name</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter your name" 
                    className="bg-gaming-bg border-gaming-border text-white placeholder:text-gray-500" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage className="text-red-500" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Email Address</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter your email" 
                    className="bg-gaming-bg border-gaming-border text-white placeholder:text-gray-500" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage className="text-red-500" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Feedback Category</FormLabel>
                <FormControl>
                  <select
                    className="w-full h-10 rounded-md bg-gaming-bg border border-gaming-border text-white px-3 py-2"
                    {...field}
                  >
                    <option value="" disabled>Select a category</option>
                    <option value="ui">User Interface</option>
                    <option value="tournaments">Tournaments</option>
                    <option value="payments">Payments & Withdrawals</option>
                    <option value="bugs">Bug Reports</option>
                    <option value="features">Feature Requests</option>
                    <option value="other">Other</option>
                  </select>
                </FormControl>
                <FormMessage className="text-red-500" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="feedback"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Your Feedback</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Share your thoughts, suggestions, or report issues..." 
                    className="bg-gaming-bg border-gaming-border text-white placeholder:text-gray-500 min-h-[120px]" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage className="text-red-500" />
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="border-gaming-border text-white hover:bg-gaming-bg/50"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Send size={16} className="mr-2" />
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default FeedbackForm; 