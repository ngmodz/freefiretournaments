import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Coins, 
  Trophy, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight, 
  CreditCard
} from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  Timestamp,
  onSnapshot,
  startAfter,
  DocumentData,
  QueryDocumentSnapshot
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

// Interface for Credit Transaction data
interface CreditTransaction {
  id: string;
  userId: string;
  type: 'host_credit_purchase' | 'tournament_credit_purchase' | 'tournament_join' | 'tournament_win' | 'referral_bonus';
  amount: number;
  value?: number;
  balanceBefore: number;
  balanceAfter: number;
  walletType: 'tournamentCredits' | 'hostCredits' | 'earnings';
  description: string;
  transactionDetails?: {
    packageId?: string;
    packageName?: string;
    paymentId?: string;
    orderId?: string;
    tournamentId?: string;
    tournamentName?: string;
  };
  createdAt: Date;
}

interface CreditTransactionHistoryProps {
  userId: string;
  refreshTrigger?: number;
}

const TRANSACTIONS_PER_PAGE = 10;

const CreditTransactionHistory = ({ userId, refreshTrigger = 0 }: CreditTransactionHistoryProps) => {
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreTransactions, setHasMoreTransactions] = useState(false);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [firstLoad, setFirstLoad] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  // Array to store document cursors for each page to enable back navigation
  const [pageCursors, setPageCursors] = useState<QueryDocumentSnapshot<DocumentData>[]>([]);

  // Function to manually refresh the transaction list
  const refreshTransactions = () => {
    setCurrentPage(1);
    setLastVisible(null);
    setFirstLoad(true);
    setPageCursors([]);
    setRefreshKey(prev => prev + 1);
  };

  // Refresh when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger > 0) {
      refreshTransactions();
    }
  }, [refreshTrigger]);

  // Set up real-time listener for transaction updates
  useEffect(() => {
    if (!userId) {
      console.log("No userId provided to CreditTransactionHistory");
      setError("User ID is required");
      setIsLoading(false);
      return;
    }

    console.log(`Setting up real-time listener for credit transactions: ${userId}`);
    setIsLoading(true);
    setError(null);
    
    // Create the transactions collection reference
    const transactionsRef = collection(db, 'creditTransactions');
    
    // Create the query for real-time updates - limited to recent transactions
    const q = query(
      transactionsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(TRANSACTIONS_PER_PAGE)
    );
    
    // Set up the real-time listener
    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        console.log(`Real-time update: Query returned ${querySnapshot.size} credit transactions`);
        
        const fetchedTransactions: CreditTransaction[] = [];
        
        // Process each document
        querySnapshot.forEach((doc) => {
          try {
            const data = doc.data();
            
            // Convert the Firestore Timestamp to Date
            let transactionDate: Date;
            if (data.createdAt instanceof Timestamp) {
              transactionDate = data.createdAt.toDate();
            } else if (data.createdAt && typeof data.createdAt.toDate === 'function') {
              transactionDate = data.createdAt.toDate();
            } else if (data.createdAt) {
              // Fallback for string or number timestamps
              transactionDate = new Date(data.createdAt);
            } else {
              console.error(`Transaction ${doc.id} has invalid date:`, data.createdAt);
              transactionDate = new Date(); // Default to current date
            }
            
            fetchedTransactions.push({
              id: doc.id,
              userId: data.userId,
              type: data.type,
              amount: Number(data.amount),
              value: data.value,
              balanceBefore: data.balanceBefore,
              balanceAfter: data.balanceAfter,
              walletType: data.walletType,
              description: data.description,
              transactionDetails: data.transactionDetails || {},
              createdAt: transactionDate
            });
          } catch (err) {
            console.error(`Error processing credit transaction ${doc.id}:`, err);
          }
        });
        
        // Save the last visible document for pagination
        const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
        setLastVisible(lastDoc || null);
        
        // Reset pagination state when real-time updates occur
        if (firstLoad) {
          setPageCursors([]);
          setCurrentPage(1);
        }
        
        // Check if there are more transactions
        setHasMoreTransactions(querySnapshot.size >= TRANSACTIONS_PER_PAGE);
        
        console.log("Real-time update: Processed credit transactions:", fetchedTransactions);
        setTransactions(fetchedTransactions);
        setIsLoading(false);
        setFirstLoad(false);
        setError(null);
      },
      (err) => {
        console.error("Error in real-time credit transaction listener:", err);
        const errMessage = err instanceof Error ? err.message : String(err);
        
        // Check if this is an index-related error
        if (errMessage.includes("requires an index")) {
          setError("The credit transaction history is being prepared. Please try again in a few minutes.");
        } else {
          setError(`Failed to load credit transaction history: ${errMessage}`);
        }
        
        setIsLoading(false);
      }
    );
    
    // Clean up the listener when component unmounts or userId changes
    return () => {
      console.log("Cleaning up real-time credit transaction listener");
      unsubscribe();
    };
  }, [userId, refreshKey]);

  // Function to load more transactions
  const loadMoreTransactions = async () => {
    if (!lastVisible || loadingMore || !hasMoreTransactions) return;
    setLoadingMore(true);
    try {
      // Store the current cursor for back navigation
      setPageCursors(prev => [...prev, lastVisible]);
      const transactionsRef = collection(db, 'creditTransactions');
      const q = query(
        transactionsRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        startAfter(lastVisible),
        limit(TRANSACTIONS_PER_PAGE)
      );
      const querySnapshot = await getDocs(q);
      const newTransactions: CreditTransaction[] = [];
      querySnapshot.forEach((doc) => {
        try {
          const data = doc.data();
          let transactionDate: Date;
          if (data.createdAt instanceof Timestamp) {
            transactionDate = data.createdAt.toDate();
          } else if (data.createdAt && typeof data.createdAt.toDate === 'function') {
            transactionDate = data.createdAt.toDate();
          } else if (data.createdAt) {
            transactionDate = new Date(data.createdAt);
          } else {
            transactionDate = new Date();
          }
          newTransactions.push({
            id: doc.id,
            userId: data.userId,
            type: data.type,
            amount: Number(data.amount),
            value: data.value,
            balanceBefore: data.balanceBefore,
            balanceAfter: data.balanceAfter,
            walletType: data.walletType,
            description: data.description,
            transactionDetails: data.transactionDetails || {},
            createdAt: transactionDate
          });
        } catch (err) {
          console.error(`Error processing credit transaction ${doc.id}:`, err);
        }
      });
      const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
      setLastVisible(lastDoc || null);
      setHasMoreTransactions(querySnapshot.size >= TRANSACTIONS_PER_PAGE);
      // Replace the transactions list with the new page
      setTransactions(newTransactions);
      setCurrentPage(prev => prev + 1);
    } catch (err) {
      console.error("Error loading more credit transactions:", err);
      setError(`Failed to load more transactions: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoadingMore(false);
    }
  };

  // Function to go back to the previous page
  const loadPreviousPage = async () => {
    if (currentPage <= 1 || pageCursors.length === 0) return;
    
    setLoadingMore(true);
    
    try {
      // Get the cursor for the previous page
      const newCursors = [...pageCursors];
      const previousCursor = newCursors.pop();
      setPageCursors(newCursors);
      
      // If we're going back to the first page
      if (newCursors.length === 0) {
        const transactionsRef = collection(db, 'creditTransactions');
        const q = query(
          transactionsRef,
          where('userId', '==', userId),
          orderBy('createdAt', 'desc'),
          limit(TRANSACTIONS_PER_PAGE)
        );
        
        const querySnapshot = await getDocs(q);
        const newTransactions: CreditTransaction[] = [];
        
        querySnapshot.forEach((doc) => {
          try {
            const data = doc.data();
            
            // Convert the Firestore Timestamp to Date
            let transactionDate: Date;
            if (data.createdAt instanceof Timestamp) {
              transactionDate = data.createdAt.toDate();
            } else if (data.createdAt && typeof data.createdAt.toDate === 'function') {
              transactionDate = data.createdAt.toDate();
            } else if (data.createdAt) {
              transactionDate = new Date(data.createdAt);
            } else {
              transactionDate = new Date();
            }
            
            newTransactions.push({
              id: doc.id,
              userId: data.userId,
              type: data.type,
              amount: Number(data.amount),
              value: data.value,
              balanceBefore: data.balanceBefore,
              balanceAfter: data.balanceAfter,
              walletType: data.walletType,
              description: data.description,
              transactionDetails: data.transactionDetails || {},
              createdAt: transactionDate
            });
          } catch (err) {
            console.error(`Error processing credit transaction ${doc.id}:`, err);
          }
        });
        
        // Update the last visible document
        const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
        setLastVisible(lastDoc || null);
        
        // Check if there are more transactions
        setHasMoreTransactions(querySnapshot.size >= TRANSACTIONS_PER_PAGE);
        
        // Update the transactions list
        setTransactions(newTransactions);
      } else {
        // Otherwise, load from the previous cursor
        const transactionsRef = collection(db, 'creditTransactions');
        const q = query(
          transactionsRef,
          where('userId', '==', userId),
          orderBy('createdAt', 'desc'),
          startAfter(previousCursor),
          limit(TRANSACTIONS_PER_PAGE)
        );
        
        const querySnapshot = await getDocs(q);
        const newTransactions: CreditTransaction[] = [];
        
        querySnapshot.forEach((doc) => {
          try {
            const data = doc.data();
            
            // Convert the Firestore Timestamp to Date
            let transactionDate: Date;
            if (data.createdAt instanceof Timestamp) {
              transactionDate = data.createdAt.toDate();
            } else if (data.createdAt && typeof data.createdAt.toDate === 'function') {
              transactionDate = data.createdAt.toDate();
            } else if (data.createdAt) {
              transactionDate = new Date(data.createdAt);
            } else {
              transactionDate = new Date();
            }
            
            newTransactions.push({
              id: doc.id,
              userId: data.userId,
              type: data.type,
              amount: Number(data.amount),
              value: data.value,
              balanceBefore: data.balanceBefore,
              balanceAfter: data.balanceAfter,
              walletType: data.walletType,
              description: data.description,
              transactionDetails: data.transactionDetails || {},
              createdAt: transactionDate
            });
          } catch (err) {
            console.error(`Error processing credit transaction ${doc.id}:`, err);
          }
        });
        
        // Update the last visible document
        const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
        setLastVisible(lastDoc || null);
        
        // Check if there are more transactions
        setHasMoreTransactions(querySnapshot.size >= TRANSACTIONS_PER_PAGE);
        
        // Update the transactions list
        setTransactions(newTransactions);
      }
      
      setCurrentPage(prev => prev - 1);
      
    } catch (err) {
      console.error("Error loading previous credit transactions page:", err);
      setError(`Failed to load previous page: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoadingMore(false);
    }
  };

  // Helper function to get transaction icon based on type and wallet type
  const getTransactionIcon = (transaction: CreditTransaction) => {
    const { type, walletType, amount } = transaction;
    
    if (type === 'tournament_credit_purchase' || type === 'host_credit_purchase') {
      return <ArrowDownCircle className="h-5 w-5 text-green-500" />;
    }
    
    if (type === 'tournament_join') {
      return <ArrowUpCircle className="h-5 w-5 text-red-500" />;
    }
    
    if (type === 'tournament_win') {
      return <Trophy className="h-5 w-5 text-yellow-500" />;
    }
    
    if (type === 'referral_bonus') {
      return <Coins className="h-5 w-5 text-purple-500" />;
    }
    
    // Fallback based on amount and wallet type
    if (amount > 0) {
      if (walletType === 'tournamentCredits') {
        return <Coins className="h-5 w-5 text-gaming-accent" />;
      } else if (walletType === 'hostCredits') {
        return <CreditCard className="h-5 w-5 text-gaming-primary" />;
      } else {
        return <ArrowDownCircle className="h-5 w-5 text-green-500" />;
      }
    } else {
      return <ArrowUpCircle className="h-5 w-5 text-red-500" />;
    }
  };

  // Helper function to get transaction color based on type and wallet type
  const getTransactionColor = (transaction: CreditTransaction) => {
    const { type, walletType, amount } = transaction;
    
    if (type === 'tournament_credit_purchase' || type === 'host_credit_purchase') {
      return 'text-green-500';
    }
    
    if (type === 'tournament_join') {
      return 'text-red-500';
    }
    
    if (type === 'tournament_win') {
      return 'text-yellow-500';
    }
    
    if (type === 'referral_bonus') {
      return 'text-purple-500';
    }
    
    // Fallback based on amount and wallet type
    if (amount > 0) {
      if (walletType === 'tournamentCredits') {
        return 'text-gaming-accent';
      } else if (walletType === 'hostCredits') {
        return 'text-gaming-primary';
      } else {
        return 'text-green-500';
      }
    } else {
      return 'text-red-500';
    }
  };

  // Helper function to get transaction badge based on wallet type
  const getTransactionBadge = (transaction: CreditTransaction) => {
    const { type, walletType } = transaction;

    if (type === 'tournament_join') {
      return (
        <Badge className="bg-gaming-accent/20 text-gaming-accent text-xs">
          Tournament
        </Badge>
      );
    }
    
    if (walletType === 'tournamentCredits') {
      return (
        <Badge className="bg-gaming-accent/20 text-gaming-accent text-xs">
          Tournament
        </Badge>
      );
    } else if (walletType === 'hostCredits') {
      return (
        <Badge className="bg-gaming-primary/20 text-gaming-primary text-xs">
          Host
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-green-500/20 text-green-500 text-xs">
          Earnings
        </Badge>
      );
    }
  };

  // Loading state
  if (isLoading && firstLoad) {
    return (
      <Card className="bg-gaming-card border-gaming-border relative overflow-hidden">
        {/* Gradient/blur background */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gaming-primary/10 rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none select-none"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gaming-accent/10 rounded-full -ml-12 -mb-12 blur-xl pointer-events-none select-none"></div>
        <div className="p-4 relative z-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gaming-text">Transaction History</h3>
            <Button size="sm" variant="ghost" disabled>
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </div>
          
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 border-b border-gaming-border/30">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-5 w-16" />
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  // Error state
  if (error) {
    const isIndexError = error.includes("being prepared");
    
    return (
      <Card className="bg-gaming-card border-gaming-border relative overflow-hidden">
        {/* Gradient/blur background */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gaming-primary/10 rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none select-none"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gaming-accent/10 rounded-full -ml-12 -mb-12 blur-xl pointer-events-none select-none"></div>
        <div className="p-4 relative z-10">
          <div className="text-center py-8">
            {isIndexError ? (
              <>
                <p className="text-amber-400 mb-2">Credit History</p>
                <p className="text-gaming-muted mb-4">{error}</p>
                <p className="text-xs text-gaming-muted mb-4">This is a one-time setup and should be ready soon.</p>
              </>
            ) : (
              <p className="text-red-400">{error}</p>
            )}
            <Button 
              onClick={refreshTransactions}
              variant="outline" 
              className="mt-4"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  // Empty state
  if (transactions.length === 0) {
    return (
      <Card className="bg-gaming-card border-gaming-border relative overflow-hidden">
        {/* Gradient/blur background */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gaming-primary/10 rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none select-none"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gaming-accent/10 rounded-full -ml-12 -mb-12 blur-xl pointer-events-none select-none"></div>
        <div className="p-4 relative z-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gaming-text">Transaction History</h3>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={refreshTransactions}
              className="text-gaming-muted hover:text-gaming-text"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </div>
          
          <div className="text-center py-8 text-gaming-muted">
            <Coins className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No transactions yet. Your transaction history will appear here.</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-gaming-card border-gaming-border relative overflow-hidden">
      {/* Gradient/blur background */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gaming-primary/10 rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none select-none"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gaming-accent/10 rounded-full -ml-12 -mb-12 blur-xl pointer-events-none select-none"></div>
      <div className="p-4 relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gaming-text">Transaction History</h3>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={refreshTransactions}
            className="text-gaming-muted hover:text-gaming-text"
            disabled={isLoading}
          >
            {isLoading ? <LoadingSpinner size="xs" /> : <RefreshCw className="h-4 w-4 mr-1" />}
            Refresh
          </Button>
        </div>
        
        <div className="space-y-1">
          <AnimatePresence mode="popLayout">
            {transactions.map((transaction) => (
              <motion.div
                key={transaction.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-between p-3 border-b border-gaming-border/30 hover:bg-gaming-bg/30 rounded-md transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gaming-bg rounded-full">
                    {getTransactionIcon(transaction)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gaming-text">{transaction.description}</p>
                      {getTransactionBadge(transaction)}
                    </div>
                    <p className="text-xs text-gaming-muted">
                      {format(transaction.createdAt, 'MMM d, yyyy • h:mm a')}
                    </p>
                  </div>
                </div>
                <p className={`font-semibold ${getTransactionColor(transaction)}`}>
                  {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        
        {/* Pagination controls */}
        {(hasMoreTransactions || currentPage > 1) && (
          <div className="flex items-center justify-between mt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={loadPreviousPage}
              disabled={currentPage <= 1 || loadingMore}
              className={currentPage <= 1 ? 'invisible' : ''}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            
            <span className="text-xs text-gaming-muted">Page {currentPage}</span>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={loadMoreTransactions}
              disabled={!hasMoreTransactions || loadingMore}
              className={!hasMoreTransactions ? 'invisible' : ''}
            >
              {loadingMore ? (
                <>
                  <LoadingSpinner size="xs" className="mr-1" />
                  Loading
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default CreditTransactionHistory; 