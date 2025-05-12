import { db } from '@/lib/firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  onSnapshot,
  increment,
  Timestamp
} from 'firebase/firestore';

// Interface for wallet data
export interface Wallet {
  balance: number;
  lastUpdated: Date;
}

// Interface for transaction data
export interface Transaction {
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

/**
 * Initialize a wallet for a new user
 * @param userId Firebase Auth UID of the user
 */
export const initializeWallet = async (userId: string): Promise<void> => {
  const walletRef = doc(db, 'wallets', userId);
  const walletSnapshot = await getDoc(walletRef);

  if (!walletSnapshot.exists()) {
    await setDoc(walletRef, {
      balance: 0,
      lastUpdated: Timestamp.now()
    });
  }
};

/**
 * Get the current wallet balance for a user
 * @param userId Firebase Auth UID of the user
 * @returns Promise with the wallet object
 */
export const getWalletBalance = async (userId: string): Promise<Wallet> => {
  try {
    // First check if the wallet exists, if not initialize it
    await initializeWallet(userId);
    
    // Now get the wallet data
    const walletRef = doc(db, 'wallets', userId);
    const walletSnapshot = await getDoc(walletRef);
    
    if (walletSnapshot.exists()) {
      const data = walletSnapshot.data();
      return {
        balance: data.balance || 0,
        lastUpdated: data.lastUpdated?.toDate() || new Date()
      };
    }
    
    // This should not happen since we initialize the wallet first
    throw new Error('Wallet not found');
  } catch (error) {
    console.error('Error getting wallet balance:', error);
    throw error;
  }
};

/**
 * Set up a real-time listener for a user's wallet
 * @param userId Firebase Auth UID of the user
 * @param callback Function to call when wallet data changes
 * @returns Unsubscribe function
 */
export const subscribeToWallet = (
  userId: string, 
  callback: (wallet: Wallet) => void
): (() => void) => {
  const walletRef = doc(db, 'wallets', userId);
  
  // Initialize wallet if it doesn't exist
  initializeWallet(userId).catch(error => {
    console.error('Error initializing wallet:', error);
  });
  
  // Set up real-time listener
  const unsubscribe = onSnapshot(walletRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data();
      callback({
        balance: data.balance || 0,
        lastUpdated: data.lastUpdated?.toDate() || new Date()
      });
    } else {
      // This should not happen since we initialize the wallet first
      console.error('Wallet not found in real-time listener');
    }
  }, (error) => {
    console.error('Error in wallet listener:', error);
  });
  
  return unsubscribe;
};

/**
 * Get recent transactions for a user
 * @param userId Firebase Auth UID of the user
 * @param limit Maximum number of transactions to fetch
 * @returns Promise with an array of transactions
 */
export const getRecentTransactions = async (
  userId: string, 
  transactionLimit: number = 10
): Promise<Transaction[]> => {
  try {
    const transactionsRef = collection(db, 'transactions');
    const q = query(
      transactionsRef,
      where('userId', '==', userId),
      orderBy('date', 'desc'),
      limit(transactionLimit)
    );
    
    const querySnapshot = await getDocs(q);
    const transactions: Transaction[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      transactions.push({
        id: doc.id,
        userId: data.userId,
        amount: data.amount,
        type: data.type,
        date: data.date.toDate(),
        status: data.status,
        details: data.details
      });
    });
    
    return transactions;
  } catch (error) {
    console.error('Error getting recent transactions:', error);
    throw error;
  }
};

/**
 * Add a new transaction to the user's history
 * @param transaction Transaction object without id
 * @returns Promise with the new transaction ID
 */
export const addTransaction = async (transaction: Omit<Transaction, 'id'>): Promise<string> => {
  try {
    console.log("Adding transaction to Firestore:", transaction);
    const transactionsRef = collection(db, 'transactions');
    
    // Ensure date is a Firebase Timestamp (not a JavaScript Date)
    const transactionData = {
      ...transaction,
      date: transaction.date instanceof Date 
        ? Timestamp.fromDate(transaction.date) 
        : transaction.date
    };
    
    console.log("Prepared transaction data for Firestore:", transactionData);
    
    // Create a new document with auto-generated ID
    const newDocRef = doc(transactionsRef);
    console.log("Created new document reference with ID:", newDocRef.id);
    
    // Add the transaction to Firestore with the generated ID
    await setDoc(newDocRef, transactionData);
    console.log("Transaction successfully written to Firestore");
    
    // Return the new transaction ID
    return newDocRef.id;
  } catch (error) {
    console.error('Error adding transaction:', error);
    throw error;
  }
};

/**
 * Update a user's wallet balance
 * @param userId User ID
 * @param amount Amount to add (positive) or subtract (negative)
 * @returns Promise that resolves when the update is complete
 */
export const updateWalletBalance = async (userId: string, amount: number): Promise<void> => {
  try {
    const walletRef = doc(db, 'wallets', userId);
    
    // Use Firestore's increment function for atomic updates
    await updateDoc(walletRef, {
      balance: increment(amount),
      lastUpdated: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating wallet balance:', error);
    throw error;
  }
};

/**
 * Set up a real-time listener for a user's transactions (for debugging)
 * @param userId Firebase Auth UID of the user
 * @returns Unsubscribe function
 */
export const debugMonitorTransactions = (userId: string): (() => void) => {
  console.log(`Setting up transaction monitor for user ${userId}`);
  
  try {
    const transactionsRef = collection(db, 'transactions');
    const q = query(
      transactionsRef,
      where('userId', '==', userId),
      orderBy('date', 'desc'),
      limit(20)
    );
    
    // Set up real-time listener
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        console.log(`[DEBUG] Transaction monitor: Received ${snapshot.size} transactions`);
        
        // Log each transaction
        snapshot.forEach((doc) => {
          const data = doc.data();
          console.log(`[DEBUG] Transaction ${doc.id}:`, {
            ...data,
            date: data.date?.toDate?.() || data.date,
          });
        });
        
        // Log any changes in this snapshot
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            console.log(`[DEBUG] New transaction added: ${change.doc.id}`);
          } else if (change.type === 'modified') {
            console.log(`[DEBUG] Transaction modified: ${change.doc.id}`);
          } else if (change.type === 'removed') {
            console.log(`[DEBUG] Transaction removed: ${change.doc.id}`);
          }
        });
      },
      (error) => {
        console.error('[DEBUG] Error in transaction monitor:', error);
      }
    );
    
    return unsubscribe;
  } catch (error) {
    console.error('[DEBUG] Error setting up transaction monitor:', error);
    // Return dummy unsubscribe function
    return () => {};
  }
}; 