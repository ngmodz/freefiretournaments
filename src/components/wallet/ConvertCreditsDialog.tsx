import { useState, useEffect } from "react";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogPortal,
  DialogOverlay,
} from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Coins, ArrowRightLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { CreditService } from "@/lib/creditService";
import { toast } from "@/components/ui/use-toast";
import { useCreditBalance } from "@/hooks/useCreditBalance";

interface ConvertCreditsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const ConvertCreditsDialog = ({
  isOpen,
  onOpenChange,
}: ConvertCreditsDialogProps) => {
  const [amount, setAmount] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();
  const { tournamentCredits, isLoading: isBalanceLoading } = useCreditBalance(currentUser?.uid);

  useEffect(() => {
    if (!isOpen) {
      setAmount("");
      setError(null);
      setIsLoading(false);
    }
  }, [isOpen]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*$/.test(value)) {
      setAmount(value);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    const creditsAmount = Number(amount);

    if (!amount || isNaN(creditsAmount)) {
      setError("Please enter a valid amount.");
      return;
    }

    if (creditsAmount <= 0) {
      setError("Amount must be greater than 0.");
      return;
    }

    if (creditsAmount > tournamentCredits) {
      setError("Insufficient tournament credits.");
      return;
    }

    if (!currentUser) {
      setError("You must be logged in to convert credits.");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log(`Converting ${creditsAmount} tournament credits to earnings for user ${currentUser.uid}`);
      
      const success = await CreditService.convertCreditsToEarnings(
        currentUser.uid,
        creditsAmount
      );
      
      if (success) {
        setIsLoading(false);
        onOpenChange(false);
        
        toast({
          title: "Credits Converted Successfully!",
          description: `${creditsAmount} tournament credits have been converted to ₹${creditsAmount} earnings.`,
        });
      } else {
        throw new Error("Failed to convert credits");
      }
    } catch (err) {
      console.error("Credit conversion error:", err);
      setError("Failed to convert credits. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-black/50 backdrop-blur-sm" />
        <DialogPrimitive.Content
          className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%]"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-full bg-gradient-to-b from-gaming-card to-gaming-bg text-gaming-text rounded-lg shadow-lg border border-gaming-primary/20 overflow-hidden backdrop-blur-sm max-w-md max-h-[90vh]"
          >
            <div className="absolute top-0 right-0 w-32 h-32 -mr-10 -mt-10 rounded-full bg-gaming-primary/5 blur-xl"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 -ml-8 -mb-8 rounded-full bg-gaming-accent/5 blur-lg"></div>
            
            <div className="p-6 relative">
              <DialogHeader className="mb-2">
                <div className="flex items-center gap-2 mb-1">
                  <ArrowRightLeft className="h-5 w-5 text-gaming-accent" />
                  <DialogTitle className="text-gaming-text text-xl font-bold">Convert Credits</DialogTitle>
                </div>
                <DialogDescription className="text-gaming-muted">
                  Convert your tournament credits to withdrawable earnings.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 py-4">
                <motion.div 
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="bg-gaming-bg/50 p-4 rounded-lg border border-gaming-border/30 shadow-sm"
                >
                  <div className="flex justify-between">
                    <span className="text-gaming-muted">Available Credits:</span>
                    <span className="text-gaming-accent font-semibold">
                      {isBalanceLoading ? "..." : tournamentCredits} Credits
                    </span>
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-2"
                >
                  <Label htmlFor="amount" className="text-gaming-text text-sm">Amount (Credits)</Label>
                  <Input
                    id="amount"
                    type="text"
                    placeholder="Enter credits to convert"
                    value={amount}
                    onChange={handleAmountChange}
                    className="bg-gaming-bg/70 text-gaming-text border-gaming-border/50 focus:border-gaming-primary focus:ring-gaming-primary/20"
                  />
                  <div className="text-sm text-gaming-muted">
                    Conversion rate: 1 Credit = ₹1 Earnings
                  </div>
                  {amount && !isNaN(Number(amount)) && Number(amount) > 0 && (
                    <div className="p-2 bg-gaming-accent/10 rounded border border-gaming-accent/20 text-sm">
                      You will receive: <span className="font-semibold text-gaming-accent">₹{Number(amount)}</span> in earnings
                    </div>
                  )}
                  <AnimatePresence>
                    {error && (
                      <motion.p 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-destructive text-sm mt-1"
                      >
                        {error}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-sm text-amber-200"
                >
                  <p className="font-medium mb-1">Important:</p>
                  <p>Converting credits to earnings is irreversible. Earnings can be withdrawn to your UPI account.</p>
                </motion.div>

                <DialogFooter className="mt-6 flex flex-col sm:flex-row gap-3">
                  <motion.div 
                    whileHover={{ scale: isLoading ? 1 : 1.03 }}
                    whileTap={{ scale: isLoading ? 1 : 0.97 }}
                    className="w-full sm:w-auto order-1 sm:order-1"
                  >
                    <Button
                      onClick={handleSubmit}
                      className={`transition-all duration-300 w-full ${
                        isLoading ? 
                        "bg-gray-700 text-gray-300" : 
                        "bg-gradient-to-r from-gaming-accent to-[#ff7e33] hover:from-gaming-accent/90 hover:to-[#ff7e33]/90 hover:shadow-[0_0_15px_rgba(249,115,22,0.3)] text-white font-medium"
                      }`}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        "Convert Credits"
                      )}
                    </Button>
                  </motion.div>
                  
                  <Button
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    className="bg-transparent border-gaming-border/50 text-gaming-text hover:bg-gaming-bg/80 hover:text-gaming-text/80 transition-all duration-200 w-full sm:w-auto order-2 sm:order-2"
                  >
                    Cancel
                  </Button>
                </DialogFooter>
              </div>
            </div>
          </motion.div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
};

export default ConvertCreditsDialog; 