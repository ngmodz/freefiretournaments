import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Send, User, Mail } from "lucide-react";
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

// Define form schema with Zod for contact support form
const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters",
  }),
  email: z.string().email({
    message: "Please enter a valid email address",
  }),
  subject: z.string().min(5, {
    message: "Subject must be at least 5 characters",
  }),
  message: z.string().min(10, {
    message: "Message must be at least 10 characters",
  }),
});

type FormValues = z.infer<typeof formSchema>;

interface ContactSupportFormProps {
  onClose: () => void;
}

const ContactSupportForm = ({ onClose }: ContactSupportFormProps) => {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const isMobile = useIsMobile();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: currentUser?.displayName || "",
      email: currentUser?.email || "",
      subject: "",
      message: "",
    },
  });

  const { formState: { isSubmitting } } = form;

  const onSubmit = async (data: FormValues) => {
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'contact',
          ...data,
          uid: currentUser?.uid,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Something went wrong');
      }

      toast({
        title: "Message sent successfully",
        description: "Thank you for your message. We'll respond soon!",
      });
      
      onClose();
    } catch (error) {
      console.error("Failed to send message:", error);
      toast({
        title: "Failed to send message",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="relative overflow-hidden rounded-lg p-4 bg-gaming-card border-gaming-border">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gaming-primary/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gaming-accent/10 rounded-full -ml-12 -mb-12 blur-xl"></div>
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-3">
          <User className="text-gray-400" size={20} />
          <span className="text-white text-base">NG MODZ</span>
        </div>
        <div className="flex items-center gap-3">
          <Mail className="text-gray-400" size={20} />
          <a href="mailto:freefiretournaments03@gmail.com" className="text-blue-400 hover:underline">
            freefiretournaments03@gmail.com
          </a>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-6">
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
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Subject</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="What's this about?" 
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
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Message</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="How can we help you?" 
                      className="bg-gaming-bg border-gaming-border text-white placeholder:text-gray-500 min-h-[120px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />

            <div className={`flex gap-3 justify-end pt-4 ${isMobile ? 'pb-4' : ''}`}>
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
                className="bg-gaming-primary hover:bg-gaming-primary/90 text-white"
              >
                <Send size={16} className="mr-2" />
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default ContactSupportForm; 