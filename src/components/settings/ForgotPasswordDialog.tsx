import React, { useState } from "react";
import { Mail, ArrowLeft, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ForgotPasswordDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialEmail?: string;
}

const ForgotPasswordDialog = ({ trigger, open, onOpenChange, initialEmail }: ForgotPasswordDialogProps) => {
  const { toast } = useToast();
  const { sendPasswordReset, currentUser } = useAuth();
  const [email, setEmail] = useState(initialEmail ?? currentUser?.email ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [internalOpen, setInternalOpen] = useState(false);

  // Use external open state if provided, otherwise use internal state
  const isOpen = open !== undefined ? open : internalOpen;
  const setIsOpen = onOpenChange || setInternalOpen;

  // If initialEmail changes while dialog is closed, update email state
  React.useEffect(() => {
    if (!(open ?? false)) {
      setEmail(initialEmail ?? currentUser?.email ?? "");
    }
  }, [initialEmail, currentUser?.email, open]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setEmailError("Email is required");
      return;
    }

    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);
    setEmailError("");

    try {
      await sendPasswordReset(email);
      setEmailSent(true);
      
      toast({
        title: "Password Reset Email Sent",
        description: `We've sent password reset instructions to ${email}`,
      });
    } catch (error: any) {
      console.error('Error sending password reset email:', error);
      
      let errorMessage = "Failed to send password reset email. Please try again.";
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = "No account found with this email address.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Please enter a valid email address.";
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Too many attempts. Please try again later.";
      }
      
      setEmailError(errorMessage);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setEmail(currentUser?.email || "");
    setEmailSent(false);
    setEmailError("");
    setIsSubmitting(false);
    setIsOpen(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      handleClose();
    } else {
      setIsOpen(newOpen);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {trigger && (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      )}
      <DialogContent className="bg-[#1F2937] border-none text-white">
        <DialogHeader className="space-y-2">
          <DialogTitle className="flex items-center gap-2 text-white text-lg font-semibold">
            <Mail size={18} className="text-[#22C55E]" />
            {emailSent ? "Check Your Email" : "Reset Password"}
          </DialogTitle>
          <DialogDescription className="text-[#A0AEC0] text-sm">
            {emailSent 
              ? "We've sent password reset instructions to your email address."
              : "Enter your email address to receive password reset instructions."
            }
          </DialogDescription>
        </DialogHeader>
        
        {!emailSent ? (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="resetEmail" className="text-[#A0AEC0]">
                Email Address
              </Label>
              <Input
                id="resetEmail"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError("");
                }}
                className={`bg-[#101010] border-[#2D3748] text-white ${
                  emailError ? "border-[#EF4444] focus-visible:ring-[#EF4444]" : "focus-visible:ring-[#1E3A8A]"
                }`}
                placeholder="Enter your email address"
                autoComplete="email"
                disabled={isSubmitting}
              />
              {emailError && (
                <p className="text-[#EF4444] text-xs">
                  {emailError}
                </p>
              )}
            </div>
            
            <p className="text-[#A0AEC0] text-sm">
              We'll send you an email with instructions to reset your password.
            </p>

            <div className="flex gap-2 justify-end mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="bg-transparent border-[#2D3748] text-[#A0AEC0] hover:bg-[#2D3748] hover:text-white"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#22C55E] hover:bg-[#22C55E]/90 text-white"
                disabled={isSubmitting || !email.trim()}
              >
                {isSubmitting ? "Sending..." : "Send Reset Email"}
              </Button>
            </div>
          </form>
        ) : (
          <div className="mt-4 text-center">
            <div className="mx-auto w-16 h-16 bg-[#22C55E]/20 rounded-full flex items-center justify-center mb-4">
              <Check size={32} className="text-[#22C55E]" />
            </div>
            <p className="text-[#A0AEC0] mb-6">
              We've sent password reset instructions to <strong className="text-white">{email}</strong>.
              Please check your email and follow the instructions to reset your password.
            </p>
            <p className="text-[#A0AEC0] text-sm mb-6">
              Don't see the email? Check your spam folder or try again.
            </p>
            <div className="flex gap-2 justify-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEmailSent(false);
                  setEmail(currentUser?.email || "");
                }}
                className="bg-transparent border-[#2D3748] text-[#A0AEC0] hover:bg-[#2D3748] hover:text-white"
              >
                <ArrowLeft size={16} className="mr-2" />
                Send Again
              </Button>
              <Button
                type="button"
                onClick={handleClose}
                className="bg-[#22C55E] hover:bg-[#22C55E]/90 text-white"
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ForgotPasswordDialog;
