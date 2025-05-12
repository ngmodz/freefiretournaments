import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface TransactionSuccessDialogProps {
  isOpen: boolean;
  onClose: () => void;
  transactionType: 'deposit' | 'withdrawal';
  amount: number;
  transactionId?: string;
}

const TransactionSuccessDialog = ({
  isOpen,
  onClose,
  transactionType,
  amount,
  transactionId
}: TransactionSuccessDialogProps) => {
  // Auto-close after 5 seconds
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="fixed inset-0 flex items-center justify-center z-50 overflow-y-auto max-w-md mx-auto sm:max-w-md p-0 border-0">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="w-full bg-gradient-to-b from-gaming-card to-gaming-bg text-gaming-text rounded-lg shadow-lg border border-gaming-primary/20 backdrop-blur-sm overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 -mr-10 -mt-10 rounded-full bg-gaming-primary/5 blur-xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 -ml-8 -mb-8 rounded-full bg-gaming-accent/5 blur-lg"></div>
          
          <div className="relative p-6 text-center">
            <DialogHeader className="py-4 space-y-5">
              <div className="flex justify-center">
                <motion.div
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
                  className="rounded-full bg-gaming-accent/10 p-4"
                >
                  {transactionType === 'deposit' ? (
                    <ArrowDownCircle className="h-10 w-10 text-emerald-500" />
                  ) : (
                    <ArrowUpCircle className="h-10 w-10 text-amber-500" />
                  )}
                </motion.div>
              </div>
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <DialogTitle className="text-xl text-gaming-accent font-bold">
                  Transaction Successful!
                </DialogTitle>
                <DialogDescription className="text-gaming-muted mt-2">
                  Your {transactionType === 'deposit' ? 'deposit' : 'withdrawal'} has been processed successfully.
                </DialogDescription>
              </motion.div>
            </DialogHeader>
            
            <div className="my-6 p-4 bg-gaming-card/40 border border-gaming-border/30 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gaming-muted">Amount:</span>
                <span className={`text-xl font-bold ${transactionType === 'deposit' ? 'text-emerald-500' : 'text-amber-500'}`}>
                  {transactionType === 'deposit' ? '+' : '-'}₹{amount.toFixed(2)}
                </span>
              </div>
              {transactionId && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gaming-muted">Transaction ID:</span>
                  <span className="text-gaming-muted font-mono">{transactionId}</span>
                </div>
              )}
            </div>
            
            <DialogFooter className="flex justify-center">
              <Button 
                className="bg-[#9b87f5] hover:bg-[#8a75eb] text-white w-full"
                onClick={onClose}
              >
                OK
              </Button>
            </DialogFooter>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionSuccessDialog; 