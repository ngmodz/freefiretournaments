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

// Define form schema with Zod for contact developer form
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

interface ContactDeveloperFormProps {
  onClose: () => void;
}

const ContactDeveloperForm = ({ onClose }: ContactDeveloperFormProps) => {
  const { toast } = useToast();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  const onSubmit = (data: FormValues) => {
    console.log("Form submitted:", data);
    // Here you would typically send the data to your backend
    // For now, we'll just show a success toast

    toast({
      title: "Message sent successfully",
      description: "Thank you for your message. We'll respond soon!",
    });
    
    onClose();
  };

  return (
    <>
      <div className="mb-6 p-4 bg-gaming-bg/40 rounded-lg border border-gaming-border">
        <div className="flex items-center gap-3 mb-3">
          <User className="text-gray-400" size={20} />
          <span className="text-white text-base">Nishant Grewal</span>
        </div>
        <div className="flex items-center gap-3">
          <Mail className="text-gray-400" size={20} />
          <a href="mailto:ngmodz05@gmail.com" className="text-blue-400 hover:underline">
            ngmodz05@gmail.com
          </a>
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

          <div className="flex gap-3 justify-end pt-4">
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
              className="bg-gaming-primary hover:bg-gaming-primary/90 text-white"
            >
              <Send size={16} className="mr-2" />
              Send Message
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
};

export default ContactDeveloperForm;
