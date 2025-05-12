import { useEffect, useState } from "react";
import NotchHeader from "@/components/NotchHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, CreditCard, Wallet as WalletIcon } from "lucide-react";
import { 
  subscribeToWallet, 
  Wallet as WalletType, 
  addTransaction, 
  debugMonitorTransactions 
} from "@/lib/walletService";
import { Alert, AlertDescription } from "@/components/ui/alert";
import AddFundsDialog from "@/components/wallet/AddFundsDialog";
import WithdrawDialog from "@/components/wallet/WithdrawDialog";
import TransactionHistory from "@/components/wallet/TransactionHistory";
import { collection, getDocs, query, where, limit, Timestamp, doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";

const Wallet = () => {
  const { currentUser } = useAuth();
  const [wallet, setWallet] = useState<WalletType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Dialog open states
  const [isAddFundsOpen, setIsAddFundsOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    
    if (currentUser) {
      try {
        console.log("Subscribing to wallet updates for user:", currentUser.uid);
        // Subscribe to real-time wallet updates
        unsubscribe = subscribeToWallet(currentUser.uid, (updatedWallet) => {
          console.log("Received wallet update:", updatedWallet);
          setWallet(updatedWallet);
          setIsLoading(false);
        });
      } catch (err) {
        console.error("Error fetching wallet: ", err);
        setError("Failed to load wallet data. Please try again later.");
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
      setError("You need to be logged in to view your wallet.");
    }

    // Clean up subscription when component unmounts
    return () => {
      if (unsubscribe) {
        console.log("Unsubscribing from wallet updates");
        unsubscribe();
      }
    };
  }, [currentUser]);

  // Debug monitor for transactions
  useEffect(() => {
    let unsubscribeTransactionMonitor: (() => void) | null = null;
    
    if (currentUser) {
      try {
        console.log("Setting up transaction monitor for debugging");
        unsubscribeTransactionMonitor = debugMonitorTransactions(currentUser.uid);
      } catch (err) {
        console.error("Error setting up transaction monitor:", err);
      }
    }
    
    return () => {
      if (unsubscribeTransactionMonitor) {
        console.log("Unsubscribing from transaction monitor");
        unsubscribeTransactionMonitor();
      }
    };
  }, [currentUser]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gaming-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-gaming-primary" />
          <p className="text-gaming-primary animate-pulse">Loading wallet data...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gaming-bg p-4">
        <NotchHeader />
        <div className="max-w-4xl mx-auto mt-12">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Alert className="bg-destructive/10 text-white border border-destructive/30 mb-4">
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gaming-bg text-gaming-text">
      <NotchHeader />
      
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 flex items-center gap-3"
        >
          <WalletIcon className="h-7 w-7 text-gaming-accent" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gaming-accent to-[#ff7e33] bg-clip-text text-transparent">
            Wallet
          </h1>
        </motion.div>
        
        {/* Error state */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {/* Desktop Two-Column Layout, Mobile Single Column */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Balance and Actions */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-6"
          >
            {/* Balance Card */}
            <motion.div
              whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
              className="relative"
            >
              <Card className="p-8 bg-gradient-to-br from-gaming-primary/20 to-gaming-secondary/30 border border-gaming-primary/30 rounded-xl shadow-lg backdrop-blur-sm overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 -mr-6 -mt-6 rounded-full bg-gaming-primary/10 blur-xl"></div>
                <div className="absolute bottom-0 left-0 w-16 h-16 -ml-4 -mb-4 rounded-full bg-gaming-accent/10 blur-lg"></div>
                
                <CreditCard className="h-8 w-8 text-gaming-primary mb-4" />
                <h2 className="text-lg text-gaming-primary/90 font-medium mb-2">
                  Current Balance
                </h2>
                <p className="text-4xl font-bold text-gaming-text drop-shadow-md">
                  <span className="text-gaming-accent">₹</span>{wallet?.balance.toFixed(2) || "0.00"}
                </p>
                {wallet?.lastUpdated && (
                  <p className="text-xs text-gaming-text/60 mt-3">
                    Last updated: {wallet.lastUpdated.toLocaleString()}
                  </p>
                )}
              </Card>
            </motion.div>

            {/* Low Balance Alert */}
            {wallet && wallet.balance < 50 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.4 }}
              >
                <Alert className="bg-destructive/20 border border-destructive/30 text-white">
                  <AlertDescription className="flex items-center justify-between">
                    <span>Low Balance: Add funds to join tournaments</span>
                    <Button 
                      onClick={() => setIsAddFundsOpen(true)}
                      className="bg-gaming-accent hover:bg-gaming-accent/90 text-white text-xs py-1 px-3 font-medium transition-all duration-200"
                      size="sm"
                    >
                      Add Funds
                    </Button>
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1"
              >
                <Button 
                  className="bg-[#9b87f5] hover:bg-[#8975e6] hover:shadow-[0_0_15px_rgba(155,135,245,0.4)] text-white px-8 py-7 text-lg w-full rounded-xl transition-all duration-300"
                  onClick={() => setIsAddFundsOpen(true)}
                >
                  Add Funds
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: wallet && wallet.balance > 0 ? 1.03 : 1 }}
                whileTap={{ scale: wallet && wallet.balance > 0 ? 0.98 : 1 }}
                className="flex-1"
              >
                <Button 
                  className={`px-8 py-7 text-lg w-full rounded-xl transition-all duration-300 ${
                    wallet && wallet.balance > 0 
                      ? "bg-[#9b87f5] hover:bg-[#8975e6] hover:shadow-[0_0_15px_rgba(155,135,245,0.4)] text-white" 
                      : "bg-gray-800/50 text-gray-500 cursor-not-allowed border-gray-700/30"
                  }`}
                  onClick={() => setIsWithdrawOpen(true)}
                  disabled={!wallet || wallet.balance <= 0}
                >
                  Withdraw
                </Button>
              </motion.div>
            </div>
          </motion.div>

          {/* Right Column: Transaction History */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-4"
          >
            <h2 className="text-xl font-semibold mb-4 text-gaming-primary">Transaction History</h2>
            {currentUser && (
              <TransactionHistory userId={currentUser.uid} />
            )}
          </motion.div>
        </div>
      </div>

      {/* Dialogs */}
      <AddFundsDialog 
        isOpen={isAddFundsOpen} 
        onOpenChange={setIsAddFundsOpen} 
        wallet={wallet}
      />
      
      <WithdrawDialog 
        isOpen={isWithdrawOpen} 
        onOpenChange={setIsWithdrawOpen}
        wallet={wallet}
      />
    </div>
  );
};

export default Wallet; 