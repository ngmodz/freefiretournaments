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
import { Loader2, ArrowUpCircle, WalletCards } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Wallet as WalletType, updateWalletBalance, addTransaction } from "@/lib/walletService";
import { motion, AnimatePresence } from "framer-motion";
import React from "react";
import TransactionSuccessDialog from "./TransactionSuccessDialog";

interface WithdrawDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  wallet: WalletType | null;
}

const WithdrawDialog = ({
  isOpen,
  onOpenChange,
  wallet,
}: WithdrawDialogProps) => {
  const [amount, setAmount] = useState<string>("");
  const [withdrawalMethod, setWithdrawalMethod] = useState<"upi" | "bank">("upi");
  const [upiId, setUpiId] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [transactionId, setTransactionId] = useState<string | undefined>(undefined);
  const [confirmedAmount, setConfirmedAmount] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setAmount("");
      setUpiId("");
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

  const handleUpiIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUpiId(e.target.value);
    setError(null);
  };

  const handleSubmit = async () => {
    const numAmount = Number(amount);

    if (!amount || isNaN(numAmount)) {
      setError("Please enter a valid amount.");
      return;
    }

    if (!wallet) {
      setError("Unable to retrieve wallet information.");
      return;
    }

    if (numAmount <= 0) {
      setError("Amount must be greater than 0.");
      return;
    }

    if (numAmount > wallet.balance) {
      setError("Insufficient balance in your wallet.");
      return;
    }

    if (withdrawalMethod === "upi" && !upiId) {
      setError("Please enter a valid UPI ID.");
      return;
    }

    if (!currentUser) {
      setError("You must be logged in to withdraw funds.");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log(`Withdrawing: ₹${numAmount} to ${upiId} via ${withdrawalMethod} for user ${currentUser.uid}`);
      
      // First record the transaction
      const transactionData = {
        userId: currentUser.uid,
        amount: numAmount,
        type: 'withdrawal' as const,
        date: new Date(),
        status: 'completed' as const,
        details: {
          paymentMethod: withdrawalMethod,
          transactionId: upiId
        }
      };
      
      console.log("Creating withdrawal transaction record:", transactionData);
      
      // Make sure we only proceed if transaction is successful
      try {
        const newTransactionId = await addTransaction(transactionData);
        console.log("Withdrawal transaction created with ID:", newTransactionId);
        
        if (!newTransactionId) {
          throw new Error("Failed to create transaction record");
        }
        
        // Then update wallet balance
        await updateWalletBalance(currentUser.uid, -numAmount);
        console.log("Wallet balance updated for withdrawal");
        
        setIsLoading(false);
        onOpenChange(false);
        
        // Show success dialog
        setTransactionId(newTransactionId);
        setConfirmedAmount(numAmount);
        setShowSuccessDialog(true);
      } catch (transactionError) {
        console.error("Transaction creation failed:", transactionError);
        setError("Failed to record transaction. Please try again.");
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Withdrawal error:", err);
      setError("Failed to process withdrawal. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <>
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
              
              <div className="relative p-6">
                <DialogHeader className="mb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <WalletCards className="h-5 w-5 text-gaming-primary" />
                    <DialogTitle className="text-gaming-text text-xl font-bold">Withdraw Funds</DialogTitle>
                  </div>
                  <DialogDescription className="text-gaming-muted">
                    Withdraw funds from your wallet to your UPI ID.
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
                      <span className="text-gaming-muted">Available Balance:</span>
                      <span className="text-gaming-accent font-semibold">
                        ₹{wallet?.balance.toFixed(2) || "0.00"}
                      </span>
                    </div>
                  </motion.div>

                  <motion.div 
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.15 }}
                    className="space-y-2"
                  >
                    <Label className="text-gaming-text text-sm">Withdrawal Method</Label>
                    <RadioGroup
                      value={withdrawalMethod}
                      onValueChange={(value) => setWithdrawalMethod(value as "upi" | "bank")}
                      className="flex space-x-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem 
                          value="upi" 
                          id="upi-withdraw" 
                          className="border-gaming-primary text-gaming-primary focus:ring-offset-gaming-bg"
                        />
                        <Label htmlFor="upi-withdraw" className="text-gaming-text cursor-pointer">UPI</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem 
                          value="bank" 
                          id="bank-withdraw" 
                          className="border-gaming-primary text-gaming-primary focus:ring-offset-gaming-bg" 
                        />
                        <Label htmlFor="bank-withdraw" className="text-gaming-text cursor-pointer">Bank Transfer</Label>
                      </div>
                    </RadioGroup>
                  </motion.div>

                  {withdrawalMethod === "upi" && (
                    <motion.div 
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-2"
                    >
                      <Label htmlFor="upiId" className="text-gaming-text text-sm">UPI ID</Label>
                      <Input
                        id="upiId"
                        type="text"
                        placeholder="e.g., yourname@upi"
                        value={upiId}
                        onChange={handleUpiIdChange}
                        className="bg-gaming-bg/70 text-gaming-text border-gaming-border/50 focus:border-gaming-primary focus:ring-gaming-primary/20"
                      />
                    </motion.div>
                  )}

                  {withdrawalMethod === "bank" && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                      className="bg-gaming-bg/80 p-4 rounded-lg border border-gaming-primary/10 text-center"
                    >
                      <p className="text-gaming-muted">Bank withdrawal is currently under development.</p>
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
                      placeholder="Enter amount to withdraw"
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

                  <motion.div 
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.25 }}
                    className="bg-gaming-bg/50 p-4 rounded-lg border border-gaming-border/30 mt-2"
                  >
                    <div className="flex justify-between text-sm">
                      <span className="text-gaming-muted">Amount:</span>
                      <span className="text-gaming-text">₹{amount || "0"}</span>
                    </div>
                    <div className="border-t border-gaming-border/30 my-2"></div>
                    <div className="flex justify-between text-sm font-semibold">
                      <span className="text-gaming-muted">To be received:</span>
                      <span className="text-gaming-accent">₹{amount || "0"}</span>
                    </div>
                  </motion.div>
                </div>

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
                        "Withdraw"
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
            </motion.div>
          </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>
      
      <TransactionSuccessDialog
        isOpen={showSuccessDialog}
        onClose={() => setShowSuccessDialog(false)}
        transactionType="withdrawal"
        amount={confirmedAmount}
        transactionId={transactionId}
      />
    </>
  );
};

export default WithdrawDialog;
