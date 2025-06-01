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
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CreditCard, Wallet, ShoppingCart, Coins, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Wallet as WalletType } from "@/lib/walletService";
import { motion, AnimatePresence } from "framer-motion";
import React from "react";
import TransactionSuccessDialog from "./TransactionSuccessDialog";
import { CashfreeCheckout } from "@/components/payment/CashfreeCheckout";
import { CashfreeService, PaymentOrderResponse } from "@/lib/cashfree-service";
import { useNavigate } from "react-router-dom";

// Minimum amount that can be added
const MIN_AMOUNT = 100;

interface AddFundsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Define a type for the extended User with wallet
interface ExtendedUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  phoneNumber: string | null;
  wallet?: {
    balance: number;
    lastUpdated?: Date;
  };
}

const AddFundsDialog = ({ open, onOpenChange }: AddFundsDialogProps) => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "card">("upi");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [transactionId, setTransactionId] = useState<string | undefined>(undefined);
  const [confirmedAmount, setConfirmedAmount] = useState(0);

  // Cast currentUser to ExtendedUser type
  const extendedUser = currentUser as ExtendedUser | null;

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setAmount("");
      setError(null);
      setIsLoading(false);
    }
  }, [open]);

  // Handle amount change
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers
    if (/^\d*$/.test(value)) {
      setAmount(value);
      setError(null);
    }
  };

  // Handle add funds submission
  const handleSubmit = async () => {
    // Validate amount
    const numAmount = Number(amount);
    
    if (!amount || isNaN(numAmount)) {
      setError("Please enter a valid amount.");
      return;
    }
    
    if (numAmount < MIN_AMOUNT) {
      setError(`Minimum amount to add is ₹${MIN_AMOUNT}.`);
      return;
    }

    if (!currentUser) {
      setError("You must be logged in to add funds.");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log(`Initiating Cashfree payment: ₹${numAmount} for user ${currentUser.uid}`);
      
      // Get user display name or email as a fallback
      const customerName = currentUser.displayName || currentUser.email?.split('@')[0] || 'User';
      const customerEmail = currentUser.email || '';
      const customerPhone = currentUser.phoneNumber || '';
      
      // Create payment order parameters
      const paymentParams = {
        orderAmount: numAmount,
        customerName: customerName,
        customerEmail: customerEmail || 'user@example.com', // Cashfree requires an email
        customerPhone: customerPhone || '9999999999', // Cashfree requires a phone number
        orderNote: `Wallet funds - ${new Date().toISOString()}`,
        userId: currentUser.uid
      };
      
      console.log("Creating Cashfree payment order:", paymentParams);
      
      // Get Cashfree service instance
      const cashfreeService = CashfreeService.getInstance();
      
      // Create payment order
      const response = await cashfreeService.createPaymentOrder(paymentParams);
      
      // DEVELOPMENT FALLBACK: If we don't have order_token due to missing API keys, use a mock token
      if (!response.success || !response.order_token) {
        console.warn("Payment order creation failed or missing token:", response);
        
        // For development/testing only - create a mock transaction record
        if (import.meta.env.DEV || import.meta.env.MODE === 'development') {
          console.log("DEV MODE: Using mock payment flow");
          
          // Close dialog
          setIsLoading(false);
          onOpenChange(false);
          
          // Show success dialog with mock transaction
          setTransactionId(`mock_${Date.now()}`);
          setConfirmedAmount(numAmount);
          setShowSuccessDialog(true);
          
          return;
        }
        
        // Show specific error from API if available
        if (response.details?.error) {
          throw new Error(`Payment error: ${response.details.error}`);
        } else if (response.error) {
          throw new Error(response.error);
        } else {
          throw new Error('Failed to create payment order or missing order_token');
        }
      }
      
      // Success - close dialog before launching Cashfree
      setIsLoading(false);
      onOpenChange(false);
      
      console.log("Payment order created successfully:", response);
      console.log("Initializing Cashfree Drop-in with order_token:", response.order_token);
      
      // Initialize Cashfree Drop-in checkout
      await cashfreeService.initializeDropIn(response.order_token, {
        // You can add more options here if needed, e.g., for styling or specific payment modes
        // Example: components: ["upi", "card"]
      });
      
    } catch (error) {
      console.error("Payment initiation error:", error);
      
      // Format error message for display
      let errorMessage = "An error occurred while initiating payment. Please try again.";
      
      if (error.message) {
        if (error.message.includes('Network Error')) {
          errorMessage = "Network error. Please check your internet connection and try again.";
        } else if (error.message.includes('timeout')) {
          errorMessage = "Request timed out. Please try again.";
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  const handleBuyCredits = () => {
    onOpenChange(false); // Close dialog
    navigate('/credits'); // Redirect to subscription/packages page with all credit packages
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogPortal>
          <DialogOverlay className="bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <DialogPrimitive.Content
            className={cn(
              "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-gaming-border/30 bg-gradient-to-b from-gaming-card to-gaming-bg p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg md:w-full",
              "overflow-y-auto max-h-[90vh]"
            )}
          >
            <div className="absolute top-0 right-0 w-32 h-32 -mr-10 -mt-10 rounded-full bg-gaming-primary/5 blur-xl"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 -ml-8 -mb-8 rounded-full bg-gaming-accent/5 blur-lg"></div>
            
            <div className="relative">
              <DialogHeader className="mb-2">
                <div className="flex items-center gap-2 mb-1">
                  <ShoppingCart className="h-5 w-5 text-gaming-accent" />
                  <DialogTitle className="text-gaming-text text-xl font-bold">Buy Credits</DialogTitle>
                </div>
                <DialogDescription className="text-gaming-muted">
                  Choose from our credit packages to join tournaments or create your own
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
                    <span className="text-gaming-muted">Current Balance:</span>
                    <span className="text-gaming-accent font-semibold">
                      ₹{extendedUser?.wallet?.balance?.toFixed(2) || "0.00"}
                    </span>
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.15 }}
                  className="space-y-2"
                >
                  <Label className="text-gaming-text text-sm">Payment Method</Label>
                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={(value) => setPaymentMethod(value as "upi" | "card")}
                    className="flex space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem 
                        value="upi" 
                        id="upi" 
                        className="border-gaming-primary text-gaming-primary focus:ring-offset-gaming-bg"
                      />
                      <Label htmlFor="upi" className="text-gaming-text cursor-pointer">UPI</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem 
                        value="card" 
                        id="card" 
                        className="border-gaming-primary text-gaming-primary focus:ring-offset-gaming-bg" 
                      />
                      <Label htmlFor="card" className="text-gaming-text cursor-pointer">Credit/Debit Card</Label>
                    </div>
                  </RadioGroup>
                </motion.div>

                {paymentMethod === "card" && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="bg-gaming-bg/80 p-4 rounded-lg border border-gaming-primary/10 text-center"
                  >
                    <p className="text-gaming-muted">Credit/Debit card payment is currently under development.</p>
                    <p className="text-gaming-muted text-sm">Please use UPI for now.</p>
                  </motion.div>
                )}

                <motion.div 
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-2"
                >
                  <Label htmlFor="amount" className="text-gaming-text text-sm">Amount (₹)</Label>
                  <Input
                    id="amount"
                    type="text"
                    placeholder="Enter amount to add"
                    value={amount}
                    onChange={handleAmountChange}
                    className="bg-gaming-bg/70 text-gaming-text border-gaming-border/50 focus:border-gaming-primary focus:ring-gaming-primary/20"
                  />
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
              </div>

              <DialogFooter className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-between">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => onOpenChange(false)}
                  className="border-gaming-border text-gaming-text hover:bg-gaming-bg/50 hover:text-gaming-text"
                >
                  Cancel
                </Button>
                <Button 
                  type="button" 
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="bg-gaming-primary hover:bg-gaming-primary/90 text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Add Funds'
                  )}
                </Button>
              </DialogFooter>
            </div>
          </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>
      
      <TransactionSuccessDialog
        isOpen={showSuccessDialog}
        onClose={() => setShowSuccessDialog(false)}
        transactionType="deposit"
        amount={confirmedAmount}
        transactionId={transactionId}
      />
    </>
  );
};

export default AddFundsDialog; 