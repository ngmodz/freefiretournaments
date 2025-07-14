import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import NotchHeader from "@/components/NotchHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, CreditCard, Wallet as WalletIcon, ShoppingCart, Coins, TrendingUp, ArrowRightLeft } from "lucide-react";
import { 
  subscribeToWallet, 
  Wallet as WalletType, 
  addTransaction, 
  debugMonitorTransactions 
} from "@/lib/walletService";
import { Alert, AlertDescription } from "@/components/ui/alert";
import WithdrawDialog from "@/components/wallet/WithdrawDialog";
import AddFundsDialog from "@/components/wallet/AddFundsDialog";
import CreditTransactionHistory from "@/components/wallet/CreditTransactionHistory";
import { collection, getDocs, query, where, limit, Timestamp, doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import { useUserProfile } from "@/hooks/use-user-profile";

const Wallet = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [wallet, setWallet] = useState<WalletType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddFundsOpen, setIsAddFundsOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isConvertCreditsOpen, setIsConvertCreditsOpen] = useState(false);
  const { tournamentCredits, hostCredits, earnings, isLoading: isCreditsLoading } = useCreditBalance(currentUser?.uid);
  const { user } = useUserProfile();
  
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

  // Handle "Add Funds" button click - redirect to Credits page
  const handleAddFunds = () => {
    // Either show the dialog or directly navigate
    // setIsAddFundsOpen(true);
    navigate('/credits');
  };

  // Show loading state
  if (isLoading || isCreditsLoading) {
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
            My Credits
          </h1>
        </motion.div>
        
        {/* Error state */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {/* Desktop Two-Column Layout, Mobile Single Column */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Balance and Actions */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-6"
          >
            {/* Wallet Card */}
            <Card className="bg-gaming-card border-gaming-border overflow-hidden">
              <div className="p-6 relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gaming-primary/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gaming-accent/10 rounded-full -ml-12 -mb-12 blur-xl"></div>
                
                <h3 className="text-lg font-medium text-gaming-muted mb-2">Your Credits</h3>
                
                {isCreditsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-gaming-primary" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Tournament Credits */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gaming-accent/20 rounded-full">
                          <Coins className="h-5 w-5 text-gaming-accent" />
                        </div>
                        <div>
                          <p className="text-sm text-gaming-muted">Tournament Credits</p>
                          <p className="text-2xl font-bold text-gaming-text">{tournamentCredits}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Host Credits - Only for verified hosts */}
                    {user?.isHost && (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-gaming-primary/20 rounded-full">
                            <CreditCard className="h-5 w-5 text-gaming-primary" />
                          </div>
                          <div>
                            <p className="text-sm text-gaming-muted">Host Credits</p>
                            <p className="text-2xl font-bold text-gaming-text">{hostCredits}</p>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => navigate('/credits')}
                          className="bg-gaming-primary/20 hover:bg-gaming-primary/30 text-gaming-primary"
                        >
                          <ShoppingCart className="h-4 w-4 mr-1" />
                          Buy
                        </Button>
                      </div>
                    )}
                    
                    {/* Earnings */}
                    <div className="flex items-center justify-between pt-4 border-t border-gaming-border/30">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-500/20 rounded-full">
                          <TrendingUp className="h-5 w-5 text-green-500" />
                        </div>
                        <div>
                          <p className="text-sm text-gaming-muted">Earnings</p>
                          <p className="text-2xl font-bold text-gaming-text">₹{Number(earnings).toFixed(2)}</p>
                        </div>
                      </div>
                      <Button 
                        size="sm"
                        onClick={() => setIsWithdrawOpen(true)}
                        disabled={!earnings || earnings <= 0}
                        className="bg-green-500/20 hover:bg-green-500/30 text-green-500 disabled:opacity-50"
                      >
                        Withdraw
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Low Credits Alert */}
            {tournamentCredits < 50 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.4 }}
              >
                <Alert className="bg-destructive/20 border border-destructive/30 text-white">
                  <AlertDescription className="flex items-center justify-between">
                    <span>Low Tournament Credits: Add credits to join tournaments</span>
                    <Button 
                      onClick={handleAddFunds}
                      className="bg-gaming-accent hover:bg-gaming-accent/90 text-white text-xs py-1 px-3 font-medium transition-all duration-200"
                      size="sm"
                    >
                      Buy Credits
                    </Button>
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}

            {/* Low Host Credits Alert - Only for verified hosts */}
            {user?.isHost && hostCredits < 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.5 }}
              >
                <Alert className="bg-blue-900/20 border border-blue-500/30 text-white">
                  <AlertDescription className="flex items-center justify-between">
                    <span>No Host Credits: Add credits to create tournaments</span>
                    <Button 
                      onClick={handleAddFunds}
                      className="bg-gaming-primary hover:bg-gaming-primary/90 text-white text-xs py-1 px-3 font-medium transition-all duration-200"
                      size="sm"
                    >
                      Buy Credits
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
                  className="bg-gaming-accent hover:bg-gaming-accent/90 hover:shadow-[0_0_15px_rgba(155,135,245,0.4)] text-white px-8 py-7 text-lg w-full rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
                  onClick={() => navigate('/credits')}
                >
                  <ShoppingCart className="h-5 w-5" />
                  Buy Credits
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: earnings > 0 ? 1.03 : 1 }}
                whileTap={{ scale: earnings > 0 ? 0.98 : 1 }}
                className="flex-1"
              >
                <Button 
                  className={`px-8 py-7 text-lg w-full rounded-xl transition-all duration-300 ${
                    earnings > 0 
                      ? "bg-[#9b87f5] hover:bg-[#8975e6] hover:shadow-[0_0_15px_rgba(155,135,245,0.4)] text-white" 
                      : "bg-gray-800/50 text-gray-500 cursor-not-allowed border-gray-700/30"
                  }`}
                  onClick={() => setIsWithdrawOpen(true)}
                  disabled={earnings <= 0}
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
            <h2 className="text-xl font-semibold mb-4 text-gaming-primary">Credit History</h2>
            {currentUser && (
              <CreditTransactionHistory userId={currentUser.uid} />
            )}
          </motion.div>
        </div>
      </div>
      
      {/* Dialogs */}
      <AddFundsDialog 
        open={isAddFundsOpen} 
        onOpenChange={setIsAddFundsOpen} 
      />
      
      <WithdrawDialog 
        isOpen={isWithdrawOpen} 
        onOpenChange={setIsWithdrawOpen} 
        wallet={{
          balance: earnings || 0,
          lastUpdated: new Date()
        }}
      />

    </div>
  );
}

export default Wallet; 