import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Loader2, ArrowDownCircle, ArrowUpCircle, DollarSign, Trophy, RefreshCw, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
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
  QueryDocumentSnapshot,
  Query,
  deleteDoc,
  doc,
  writeBatch,
  setDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogOverlay,
  DialogPortal
} from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";

// Interface for Transaction data
interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: 'deposit' | 'withdrawal' | 'entry_fee' | 'prize';
  date: Date;
  status: 'pending' | 'completed' | 'failed';
  details?: {
    transactionId?: string;
    tournamentId?: string;
    tournamentName?: string;
    paymentMethod?: string;
  };
}

interface TransactionHistoryProps {
  userId: string;
  refreshTrigger?: number;
}

const TRANSACTIONS_PER_PAGE = 10;

const TransactionHistory = ({ userId, refreshTrigger = 0 }: TransactionHistoryProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
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
  
  // Clear history states
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [clearingHistory, setClearingHistory] = useState(false);

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
      console.log("No userId provided to TransactionHistory");
      setError("User ID is required");
      setIsLoading(false);
      return;
    }

    console.log(`Setting up real-time listener for user: ${userId}`);
    setIsLoading(true);
    setError(null);
    
    // Create the transactions collection reference
    const transactionsRef = collection(db, 'transactions');
    
    // Create the query for real-time updates - limited to recent transactions
    const q = query(
      transactionsRef,
      where('userId', '==', userId),
      orderBy('date', 'desc'),
      limit(TRANSACTIONS_PER_PAGE)
    );
    
    // Set up the real-time listener
    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        console.log(`Real-time update: Query returned ${querySnapshot.size} transactions`);
        
        const fetchedTransactions: Transaction[] = [];
        
        // Process each document
        querySnapshot.forEach((doc) => {
          try {
            const data = doc.data();
            
            // Convert the Firestore Timestamp to Date
            let transactionDate: Date;
            if (data.date instanceof Timestamp) {
              transactionDate = data.date.toDate();
            } else if (data.date && typeof data.date.toDate === 'function') {
              transactionDate = data.date.toDate();
            } else if (data.date) {
              // Fallback for string or number timestamps
              transactionDate = new Date(data.date);
            } else {
              console.error(`Transaction ${doc.id} has invalid date:`, data.date);
              transactionDate = new Date(); // Default to current date
            }
            
            fetchedTransactions.push({
              id: doc.id,
              userId: data.userId,
              amount: Number(data.amount),
              type: data.type,
              date: transactionDate,
              status: data.status || 'completed',
              details: data.details || {}
            });
          } catch (err) {
            console.error(`Error processing transaction ${doc.id}:`, err);
          }
        });
        
        // Save the last visible document for pagination
        const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
        setLastVisible(lastDoc || null);
        
        // Reset pagination state when real-time updates occur
        setPageCursors([]);
        setCurrentPage(1);
        
        // Check if there are more transactions
        setHasMoreTransactions(querySnapshot.size >= TRANSACTIONS_PER_PAGE);
        
        console.log("Real-time update: Processed transactions:", fetchedTransactions);
        setTransactions(fetchedTransactions);
        setIsLoading(false);
        setFirstLoad(false);
        setError(null);
      },
      (err) => {
        console.error("Error in real-time transaction listener:", err);
        setError(`Failed to listen for transaction updates: ${err instanceof Error ? err.message : String(err)}`);
        setIsLoading(false);
      }
    );
    
    // Clean up the listener when component unmounts or userId changes
    return () => {
      console.log("Cleaning up real-time listener");
      unsubscribe();
    };
  }, [userId, refreshKey]);

  // Function to clear all transaction history
  const clearTransactionHistory = async () => {
    if (!userId || clearingHistory) return;
    
    setClearingHistory(true);
    setError(null);
    
    try {
      // Query all transactions for this user
      const transactionsRef = collection(db, 'transactions');
      const q = query(
        transactionsRef,
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.log("No transactions to delete");
        setClearDialogOpen(false);
        setClearingHistory(false);
        return;
      }
      
      console.log(`Found ${querySnapshot.size} transactions to delete`);
      
      // First, clear the UI for immediate feedback
      setTransactions([]);
      setCurrentPage(1);
      setLastVisible(null);
      setHasMoreTransactions(false);
      setPageCursors([]);
      
      // Close the dialog
      setClearDialogOpen(false);
      
      // Try to delete transactions in small chunks to avoid timeouts
      let successCount = 0;
      let failCount = 0;
      
      // Process in chunks of 10 for better performance
      const CHUNK_SIZE = 10;
      const chunks = [];
      
      // Split the documents into chunks
      for (let i = 0; i < querySnapshot.docs.length; i += CHUNK_SIZE) {
        chunks.push(querySnapshot.docs.slice(i, i + CHUNK_SIZE));
      }
      
      // Process each chunk sequentially to avoid overwhelming the client
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const chunkPromises = chunk.map(async (document) => {
          try {
            await deleteDoc(doc(db, 'transactions', document.id));
            return { success: true, id: document.id };
          } catch (err) {
            console.error(`Failed to delete transaction ${document.id}:`, err);
            return { success: false, id: document.id, error: err };
          }
        });
        
        // Wait for the current chunk to complete
        const results = await Promise.all(chunkPromises);
        
        // Count successes and failures
        results.forEach(result => {
          if (result.success) {
            successCount++;
          } else {
            failCount++;
          }
        });
        
        // Add a small delay between chunks to reduce load
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
      
      // Final report
      console.log(`Transaction deletion complete. Successful: ${successCount}, Failed: ${failCount}`);
      
      if (failCount > 0) {
        if (successCount > 0) {
          setError(`Partially deleted transaction history. ${successCount} deleted, ${failCount} failed due to permission issues.`);
        } else {
          setError(`Could not delete transactions. Please check your permissions or contact support.`);
        }
      } else {
        // All successful - just leave the UI clear with no error message
      }
      
      // Refresh to verify (helps avoid stale UI state)
      setTimeout(() => {
        refreshTransactions();
      }, 1000);
      
    } catch (err) {
      console.error("Error clearing transaction history:", err);
      setError(`Failed to clear transaction history: ${err instanceof Error ? err.message : String(err)}`);
      
      // Try to refresh the UI to keep it in sync with the database
      setTimeout(() => {
        refreshTransactions();
      }, 1000);
    } finally {
      setClearingHistory(false);
    }
  };

  // Function to load more transactions (next page)
  const loadMoreTransactions = async () => {
    if (!userId || !lastVisible || loadingMore) return;
    
    setLoadingMore(true);
    console.log(`Loading more transactions for user: ${userId}`);
    
    try {
      // Create the transactions collection reference
      const transactionsRef = collection(db, 'transactions');
      
      // Before loading next page, store the current cursor in pageCursors
      if (lastVisible) {
        setPageCursors(prev => [...prev, lastVisible]);
      }
      
      // Create the query for the next page
      const q = query(
        transactionsRef,
        where('userId', '==', userId),
        orderBy('date', 'desc'),
        startAfter(lastVisible),
        limit(TRANSACTIONS_PER_PAGE)
      );
      
      // Fetch transactions
      const querySnapshot = await getDocs(q);
      console.log(`Next page load: Query returned ${querySnapshot.size} transactions`);
      
      if (querySnapshot.empty) {
        // No more transactions
        setHasMoreTransactions(false);
        setLoadingMore(false);
        return;
      }
      
      const fetchedTransactions: Transaction[] = [];
      
      // Process each document
      querySnapshot.forEach((doc) => {
        try {
          const data = doc.data();
          
          // Convert the Firestore Timestamp to Date
          let transactionDate: Date;
          if (data.date instanceof Timestamp) {
            transactionDate = data.date.toDate();
          } else if (data.date && typeof data.date.toDate === 'function') {
            transactionDate = data.date.toDate();
          } else if (data.date) {
            // Fallback for string or number timestamps
            transactionDate = new Date(data.date);
          } else {
            console.error(`Transaction ${doc.id} has invalid date:`, data.date);
            transactionDate = new Date(); // Default to current date
          }
          
          fetchedTransactions.push({
            id: doc.id,
            userId: data.userId,
            amount: Number(data.amount),
            type: data.type,
            date: transactionDate,
            status: data.status || 'completed',
            details: data.details || {}
          });
        } catch (err) {
          console.error(`Error processing transaction ${doc.id}:`, err);
        }
      });
      
      if (fetchedTransactions.length === 0) {
        setHasMoreTransactions(false);
        setLoadingMore(false);
        return;
      }
      
      // Save the last visible document for pagination
      const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
      if (lastDoc) {
        setLastVisible(lastDoc);
        // Check if there are more transactions
        setHasMoreTransactions(querySnapshot.size >= TRANSACTIONS_PER_PAGE);
      } else {
        setHasMoreTransactions(false);
      }
      
      // Replace the existing transactions with the new page data
      setTransactions(fetchedTransactions);
      setCurrentPage(prev => prev + 1);
      
    } catch (err) {
      console.error("Error loading more transactions:", err);
      setError(`Failed to load more transactions: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoadingMore(false);
    }
  };

  // Function to load previous page of transactions
  const loadPreviousPage = async () => {
    if (currentPage <= 1 || loadingMore) return;
    
    setLoadingMore(true);
    
    try {
      let targetPage = currentPage - 1;
      
      if (targetPage === 1) {
        // For first page, reset and load initial data
        setPageCursors([]);
        setCurrentPage(1);
        setLastVisible(null);
        setFirstLoad(true);
        setLoadingMore(false);
        return;
      }
      
      // For pages > 1, we need the cursor from pageCursors to go back 
      const previousPageIndex = targetPage - 2; // Adjust index for zero-based array
      
      if (previousPageIndex >= 0 && previousPageIndex < pageCursors.length) {
        const previousCursor = pageCursors[previousPageIndex];
        
        // Create the transactions collection reference
        const transactionsRef = collection(db, 'transactions');
        
        // Create the query using the cursor for the previous page
        const q = query(
          transactionsRef,
          where('userId', '==', userId),
          orderBy('date', 'desc'),
          startAfter(previousCursor),
          limit(TRANSACTIONS_PER_PAGE)
        );
        
        // Fetch transactions
        const querySnapshot = await getDocs(q);
        console.log(`Previous page load: Query returned ${querySnapshot.size} transactions`);
        
        if (querySnapshot.empty) {
          // Handle empty result
          setLoadingMore(false);
          return;
        }
        
        const fetchedTransactions: Transaction[] = [];
        
        // Process each document
        querySnapshot.forEach((doc) => {
          try {
            const data = doc.data();
            
            // Convert the Firestore Timestamp to Date
            let transactionDate: Date;
            if (data.date instanceof Timestamp) {
              transactionDate = data.date.toDate();
            } else if (data.date && typeof data.date.toDate === 'function') {
              transactionDate = data.date.toDate();
            } else if (data.date) {
              // Fallback for string or number timestamps
              transactionDate = new Date(data.date);
            } else {
              console.error(`Transaction ${doc.id} has invalid date:`, data.date);
              transactionDate = new Date(); // Default to current date
            }
            
            fetchedTransactions.push({
              id: doc.id,
              userId: data.userId,
              amount: Number(data.amount),
              type: data.type,
              date: transactionDate,
              status: data.status || 'completed',
              details: data.details || {}
            });
          } catch (err) {
            console.error(`Error processing transaction ${doc.id}:`, err);
          }
        });
        
        // Update UI with fetched transactions
        setTransactions(fetchedTransactions);
        
        // Update pagination state
        setCurrentPage(targetPage);
        
        // Save the last visible document for potential next page fetch
        const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
        setLastVisible(lastDoc || null);
        
        // Remove the cursor we just used from the page cursors array
        setPageCursors(prev => prev.slice(0, previousPageIndex + 1));
        
        // Always assume there are more transactions if we're navigating backward
        setHasMoreTransactions(true);
      } else {
        // If we don't have the cursor for some reason, reset to first page
        console.error("Could not find cursor for previous page, resetting to first page");
        setCurrentPage(1);
        setLastVisible(null);
        setFirstLoad(true);
        setPageCursors([]);
      }
    } catch (err) {
      console.error("Error loading previous page of transactions:", err);
      setError(`Failed to load previous page: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoadingMore(false);
    }
  };

  // Function to get icon and styling for different transaction types
  const getTransactionDisplay = (transaction: Transaction) => {
    switch (transaction.type) {
      case "deposit":
        return {
          icon: <ArrowDownCircle className="h-5 w-5 text-emerald-500" />,
          label: "Deposit",
          amountClass: "text-emerald-500",
          sign: "+",
          bgClass: "from-emerald-500/10 to-emerald-500/5"
        };
      case "withdrawal":
        return {
          icon: <ArrowUpCircle className="h-5 w-5 text-rose-500" />,
          label: "Withdrawal",
          amountClass: "text-rose-500",
          sign: "-",
          bgClass: "from-rose-500/10 to-rose-500/5"
        };
      case "entry_fee":
        return {
          icon: <span className="h-5 w-5 text-rose-500 font-bold">₹</span>,
          label: "Tournament Entry",
          amountClass: "text-rose-500",
          sign: "-",
          bgClass: "from-rose-500/10 to-rose-500/5"
        };
      case "prize":
        return {
          icon: <Trophy className="h-5 w-5 text-amber-500" />,
          label: "Tournament Prize",
          amountClass: "text-amber-500",
          sign: "+",
          bgClass: "from-amber-500/10 to-amber-500/5"
        };
      default:
        return {
          icon: <span className="h-5 w-5 text-white font-bold">₹</span>,
          label: "Transaction",
          amountClass: "text-white",
          sign: "",
          bgClass: "from-gray-700/20 to-gray-700/10"
        };
    }
  };

  return (
    <div className="space-y-4">
      {/* Loading state */}
      {isLoading && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center p-6"
        >
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-[#9b87f5]" />
            <p className="text-gaming-muted text-sm">Loading transactions...</p>
          </div>
        </motion.div>
      )}
      
      {/* Error state */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-gaming-card border-rose-500/30 p-4 rounded-xl mb-4">
            <p className="text-rose-500 text-sm">{error}</p>
          </Card>
        </motion.div>
      )}

      {/* Empty state */}
      {!isLoading && !error && transactions.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="bg-gaming-card border border-gaming-border/50 p-6 rounded-xl">
            <div className="flex flex-col items-center justify-center py-4">
              <span className="h-12 w-12 text-gaming-muted opacity-30 mb-3 font-bold text-3xl">₹</span>
              <p className="text-gaming-muted text-center">
                No transactions yet. Your transaction history will appear here.
              </p>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Transaction list */}
      <div className="space-y-3">
        <AnimatePresence>
          {transactions.map((transaction, index) => {
            const { icon, label, amountClass, sign, bgClass } = getTransactionDisplay(transaction);
            
            return (
              <motion.div
                key={transaction.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
              >
                <Card 
                  className={`bg-gradient-to-r ${bgClass} border border-gaming-border/30 p-4 rounded-xl backdrop-blur-sm`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="mr-3 p-2 bg-gaming-card rounded-full">
                        {icon}
                      </div>
                      <div>
                        <p className="font-medium text-gaming-text">{label}</p>
                        <p className="text-xs text-gaming-muted/80">
                          {format(transaction.date, "dd MMM yyyy, HH:mm")}
                        </p>
                        {transaction.details?.tournamentName && (
                          <p className="text-xs text-[#9b87f5] mt-1">
                            {transaction.details.tournamentName}
                          </p>
                        )}
                        {transaction.details?.paymentMethod && (
                          <p className="text-xs text-gaming-muted/80">
                            Method: {transaction.details.paymentMethod}
                          </p>
                        )}
                        <p className="text-[10px] text-gaming-muted/60 mt-1">
                          ID: {transaction.id}
                        </p>
                      </div>
                    </div>
                    <div className={`text-right ${amountClass} font-semibold`}>
                      {sign}₹{transaction.amount.toFixed(2)}
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Pagination controls */}
      {!isLoading && !error && transactions.length > 0 && (hasMoreTransactions || currentPage > 1) && (
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-gaming-border/30">
          <Button
            variant="ghost"
            size="sm"
            onClick={loadPreviousPage}
            disabled={currentPage <= 1 || loadingMore}
            className="text-gaming-muted hover:text-white disabled:opacity-30"
          >
            {loadingMore && currentPage > 1 ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                Loading
              </>
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </>
            )}
          </Button>
          <span className="text-sm text-gaming-muted">Page {currentPage}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadMoreTransactions}
            disabled={!hasMoreTransactions || loadingMore}
            className="text-gaming-muted hover:text-white disabled:opacity-30"
          >
            {loadingMore && !(currentPage > 1) ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
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

      {/* Action buttons */}
      <div className="mt-4 flex justify-center gap-3">
        <Button
          variant="ghost" 
          size="sm"
          className="text-gaming-muted hover:text-white"
          onClick={refreshTransactions}
          disabled={isLoading || loadingMore}
        >
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
        
        {!isLoading && !loadingMore && (
          <Button
            variant="ghost" 
            size="sm"
            className="text-rose-500 hover:text-rose-400 hover:bg-rose-500/10"
            onClick={() => setClearDialogOpen(true)}
            disabled={clearingHistory || transactions.length === 0}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Clear History
          </Button>
        )}
      </div>
      
      {/* Confirmation Dialog */}
      <Dialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <DialogPortal>
          <DialogOverlay className="bg-black/50 backdrop-blur-sm" />
          <DialogPrimitive.Content className="fixed inset-0 flex items-center justify-center z-50 overflow-y-auto max-w-md mx-auto sm:max-w-md p-0 border-0">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="w-full bg-gradient-to-b from-gaming-card to-gaming-bg text-gaming-text rounded-lg shadow-lg border border-gaming-primary/20 backdrop-blur-sm overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 -mr-10 -mt-10 rounded-full bg-gaming-primary/5 blur-xl"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 -ml-8 -mb-8 rounded-full bg-gaming-accent/5 blur-lg"></div>
              
              <div className="relative p-6">
                <DialogHeader className="mb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Trash2 className="h-5 w-5 text-rose-500" />
                    <DialogTitle className="text-gaming-text text-xl font-bold">Clear Transaction History</DialogTitle>
                  </div>
                  <DialogDescription className="text-gaming-muted">
                    This action cannot be undone. This will permanently delete all your transaction records from the database.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="py-4">
                  <p className="text-sm text-gaming-muted">
                    Are you sure you want to clear your entire transaction history?
                  </p>
                </div>

                <DialogFooter className="mt-6 flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setClearDialogOpen(false)}
                    className="bg-transparent border-gaming-border/50 text-gaming-text hover:bg-gaming-bg/80 hover:text-gaming-text/80 transition-all duration-200 w-full sm:w-auto order-2 sm:order-2"
                    disabled={clearingHistory}
                  >
                    Cancel
                  </Button>
                  <motion.div 
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="w-full sm:w-auto order-1 sm:order-1"
                  >
                    <Button
                      variant="destructive"
                      onClick={clearTransactionHistory}
                      className="bg-rose-500 hover:bg-rose-600 hover:shadow-[0_0_15px_rgba(244,63,94,0.3)] text-white font-medium transition-all duration-300 w-full"
                      disabled={clearingHistory}
                    >
                      {clearingHistory ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Clearing...
                        </>
                      ) : (
                        "Clear All Transactions"
                      )}
                    </Button>
                  </motion.div>
                </DialogFooter>
              </div>
            </motion.div>
          </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>
    </div>
  );
};

export default TransactionHistory; 