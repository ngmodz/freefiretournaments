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
  Timestamp,
  addDoc,
  serverTimestamp
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

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

// Interface for credit transaction data
export interface CreditTransaction {
  id?: string;
  userId: string;
  type: 'host_credit_purchase' | 'tournament_credit_purchase' | 'tournament_join' | 'tournament_win' | 'referral_bonus' | 'host_credit_use' | 'host_penalty' | 'tournament_refund' | 'fund_prize_pool';
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
 * @param limitCount Maximum number of transactions to fetch
 * @returns Promise with an array of transactions
 */
export const getRecentTransactions = async (
  userId: string, 
  limitCount: number = 10
): Promise<Transaction[]> => {
  try {
    const transactionsRef = collection(db, 'transactions');
    const q = query(
      transactionsRef,
      where('userId', '==', userId),
      orderBy('date', 'desc'),
      limit(limitCount)
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

/**
 * Add a credit transaction
 * @param transaction Credit transaction object
 * @returns Promise with the result of the operation
 */
export const addCreditTransaction = async (transaction: CreditTransaction) => {
  try {
    // Add the transaction to the creditTransactions collection
    const transactionRef = collection(db, 'creditTransactions');
    await addDoc(transactionRef, {
      ...transaction,
      createdAt: serverTimestamp()
    });
    
    // Update the user's wallet based on the wallet type
    const userRef = doc(db, 'users', transaction.userId);
    
    // Update the appropriate balance field
    if (transaction.walletType === 'tournamentCredits') {
      await updateDoc(userRef, {
        'wallet.tournamentCredits': transaction.balanceAfter,
        'wallet.lastUpdated': serverTimestamp()
      });
    } else if (transaction.walletType === 'hostCredits') {
      await updateDoc(userRef, {
        'wallet.hostCredits': transaction.balanceAfter,
        'wallet.lastUpdated': serverTimestamp()
      });
    } else if (transaction.walletType === 'earnings') {
      await updateDoc(userRef, {
        'wallet.earnings': transaction.balanceAfter,
        'wallet.lastUpdated': serverTimestamp()
      });
    }
    
    return { success: true, newBalance: transaction.balanceAfter };
  } catch (error) {
    console.error('Error adding credit transaction:', error);
    return { success: false, error };
  }
};

/**
 * Subscribe to credit transactions for a user
 * @param userId Firebase Auth UID of the user
 * @param callback Function to call when transactions are received
 * @param limitCount Maximum number of transactions to fetch
 * @returns Unsubscribe function
 */
export const subscribeToCreditTransactions = (
  userId: string, 
  callback: (transactions: CreditTransaction[]) => void,
  limitCount: number = 10
) => {
  const transactionsRef = collection(db, 'creditTransactions');
  
  // Create a query for the user's transactions
  const q = query(
    transactionsRef,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  
  // Set up the real-time listener
  return onSnapshot(q, (querySnapshot) => {
    const transactions: CreditTransaction[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Convert the Firestore Timestamp to Date
      const transactionDate = data.createdAt ? 
        (typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate() : new Date(data.createdAt)) 
        : new Date();
      
      transactions.push({
        id: doc.id,
        userId: data.userId,
        type: data.type,
        amount: parseFloat(data.amount) || 0,
        value: data.value,
        balanceBefore: data.balanceBefore,
        balanceAfter: data.balanceAfter,
        walletType: data.walletType,
        description: data.description,
        transactionDetails: data.transactionDetails || {},
        createdAt: transactionDate
      });
    });
    
    callback(transactions);
  });
};

/**
 * Purchase tournament credits
 * @param userId Firebase Auth UID of the user
 * @param packageId ID of the package being purchased
 * @param packageName Name of the package being purchased
 * @param credits Number of credits to purchase
 * @param price Price of the package
 * @param paymentId ID of the payment
 * @param orderId ID of the order
 * @returns Promise with the result of the operation
 */
export const purchaseTournamentCredits = async (
  userId: string, 
  packageId: string,
  packageName: string,
  credits: number,
  price: number,
  paymentId: string,
  orderId: string
) => {
  try {
    // Get the user's current credit balance
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return { success: false, error: 'User not found' };
    }
    
    const userData = userDoc.data();
    const currentCredits = userData.wallet?.tournamentCredits || 0;
    const newCredits = currentCredits + credits;
    
    // Create a credit transaction
    const transaction: CreditTransaction = {
      userId,
      type: 'tournament_credit_purchase',
      amount: credits,
      value: price,
      balanceBefore: currentCredits,
      balanceAfter: newCredits,
      walletType: 'tournamentCredits',
      description: `Purchased ${credits} tournament credits`,
      transactionDetails: {
        packageId,
        packageName,
        paymentId,
        orderId
      },
      createdAt: new Date()
    };
    
    // Add the transaction
    const result = await addCreditTransaction(transaction);
    
    // Update total purchased credits
    await updateDoc(userRef, {
      'wallet.totalPurchasedTournamentCredits': increment(credits),
      'wallet.firstPurchaseCompleted': true
    });
    
    return result;
  } catch (error) {
    console.error('Error purchasing tournament credits:', error);
    return { success: false, error };
  }
};

/**
 * Purchase host credits
 * @param userId Firebase Auth UID of the user
 * @param packageId ID of the package being purchased
 * @param packageName Name of the package being purchased
 * @param credits Number of credits to purchase
 * @param price Price of the package
 * @param paymentId ID of the payment
 * @param orderId ID of the order
 * @returns Promise with the result of the operation
 */
export const purchaseHostCredits = async (
  userId: string, 
  packageId: string,
  packageName: string,
  credits: number,
  price: number,
  paymentId: string,
  orderId: string
) => {
  try {
    // Get the user's current credit balance
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return { success: false, error: 'User not found' };
    }
    
    const userData = userDoc.data();
    const currentCredits = userData.wallet?.hostCredits || 0;
    const newCredits = currentCredits + credits;
    
    // Create a credit transaction
    const transaction: CreditTransaction = {
      userId,
      type: 'host_credit_purchase',
      amount: credits,
      value: price,
      balanceBefore: currentCredits,
      balanceAfter: newCredits,
      walletType: 'hostCredits',
      description: `Purchased ${credits} host credits`,
      transactionDetails: {
        packageId,
        packageName,
        paymentId,
        orderId
      },
      createdAt: new Date()
    };
    
    // Add the transaction
    const result = await addCreditTransaction(transaction);
    
    // Update total purchased credits
    await updateDoc(userRef, {
      'wallet.totalPurchasedHostCredits': increment(credits),
      'wallet.firstPurchaseCompleted': true
    });
    
    return result;
  } catch (error) {
    console.error('Error purchasing host credits:', error);
    return { success: false, error };
  }
};

/**
 * Use tournament credits (for joining a tournament)
 * @param userId Firebase Auth UID of the user
 * @param tournamentId ID of the tournament being joined
 * @param tournamentName Name of the tournament being joined
 * @param credits Number of credits to use
 * @returns Promise with the result of the operation
 */
export const useTournamentCredits = async (
  userId: string,
  tournamentId: string,
  tournamentName: string,
  credits: number
) => {
  try {
    // Get the user's current credit balance
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return { success: false, error: 'User not found' };
    }
    
    const userData = userDoc.data();
    const currentCredits = userData.wallet?.tournamentCredits || 0;
    
    // Check if user has enough credits
    if (currentCredits < credits) {
      return { success: false, error: 'Insufficient tournament credits' };
    }
    
    const newCredits = currentCredits - credits;
    
    // Create a credit transaction
    const transaction: CreditTransaction = {
      userId,
      type: 'tournament_join',
      amount: -credits,
      balanceBefore: currentCredits,
      balanceAfter: newCredits,
      walletType: 'tournamentCredits',
      description: `Joined tournament: ${tournamentName}`,
      transactionDetails: {
        tournamentId,
        tournamentName
      },
      createdAt: new Date()
    };
    
    // Add the transaction
    const result = await addCreditTransaction(transaction);
    
    return result;
  } catch (error) {
    console.error('Error using tournament credits:', error);
    return { success: false, error };
  }
};

/**
 * Add tournament winnings
 * @param userId Firebase Auth UID of the user
 * @param tournamentId ID of the tournament being won
 * @param tournamentName Name of the tournament being won
 * @param credits Number of credits to add
 * @returns Promise with the result of the operation
 */
export const addTournamentWinnings = async (
  userId: string,
  tournamentId: string,
  tournamentName: string,
  credits: number
) => {
  try {
    // Get the user's current credit balance
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return { success: false, error: 'User not found' };
    }
    
    const userData = userDoc.data();
    const currentCredits = userData.wallet?.tournamentCredits || 0;
    const newCredits = currentCredits + credits;
    
    // Create a credit transaction
    const transaction: CreditTransaction = {
      userId,
      type: 'tournament_win',
      amount: credits,
      balanceBefore: currentCredits,
      balanceAfter: newCredits,
      walletType: 'tournamentCredits',
      description: `Won tournament: ${tournamentName}`,
      transactionDetails: {
        tournamentId,
        tournamentName
      },
      createdAt: new Date()
    };
    
    // Add the transaction
    const result = await addCreditTransaction(transaction);
    
    // Remove redundant update - addCreditTransaction already updates the wallet
    
    return result;
  } catch (error) {
    console.error('Error adding tournament winnings:', error);
    return { success: false, error };
  }
};

/**
 * Use host credits (for hosting a tournament)
 * @param userId Firebase Auth UID of the user
 * @param tournamentId ID of the tournament being hosted
 * @param tournamentName Name of the tournament being hosted
 * @returns Promise with the result of the operation
 */
export const useHostCredit = async (
  userId: string,
  tournamentId: string,
  tournamentName: string
) => {
  try {
    // Get the user's current host credit balance
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      return { success: false, error: 'User not found' };
    }
    const userData = userDoc.data();
    const currentCredits = userData.wallet?.hostCredits || 0;
    // Check if user has at least 1 host credit
    if (currentCredits < 1) {
      return { success: false, error: 'Insufficient host credits' };
    }
    const newCredits = currentCredits - 1;
    // Create a credit transaction
    const transaction: CreditTransaction = {
      userId,
      type: 'host_credit_use',
      amount: -1,
      balanceBefore: currentCredits,
      balanceAfter: newCredits,
      walletType: 'hostCredits',
      description: `Hosted tournament: ${tournamentName}`,
      transactionDetails: {
        tournamentId,
        tournamentName
      },
      createdAt: new Date()
    };
    // Add the transaction
    const result = await addCreditTransaction(transaction);
    // Remove the redundant update - addCreditTransaction already updates the wallet
    return result;
  } catch (error) {
    console.error('Error using host credit:', error);
    return { success: false, error };
  }
};

/**
 * Use tournament credits to fund a free-entry tournament's prize pool
 * @param userId Firebase Auth UID of the user
 * @param tournamentId ID of the tournament being hosted
 * @param tournamentName Name of the tournament being hosted
 * @param prizePoolAmount Amount of credits to deduct for the prize pool
 * @returns Promise with the result of the operation
 */
export const useTournamentCreditsForPrizePool = async (
  userId: string,
  tournamentId: string,
  tournamentName: string,
  prizePoolAmount: number
) => {
  try {
    // Get the user's current host credit balance
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return { success: false, error: 'User not found' };
    }
    
    const userData = userDoc.data();
    const currentCredits = userData.wallet?.tournamentCredits || 0;
    
    // Check if user has enough tournament credits for the prize pool
    if (currentCredits < prizePoolAmount) {
      return { 
        success: false, 
        error: `Insufficient tournament credits. You need ${prizePoolAmount} credits to fund this prize pool.` 
      };
    }
    
    const newCredits = currentCredits - prizePoolAmount;
    
    // Create a credit transaction
    const transaction: CreditTransaction = {
      userId,
      type: 'fund_prize_pool',
      amount: -prizePoolAmount,
      balanceBefore: currentCredits,
      balanceAfter: newCredits,
      walletType: 'tournamentCredits',
      description: `Funded prize pool for free-entry tournament: ${tournamentName}`,
      transactionDetails: {
        tournamentId,
        tournamentName
      },
      createdAt: new Date()
    };
    
    // Add the transaction
    const result = await addCreditTransaction(transaction);
    
    // Remove redundant update - addCreditTransaction already updates the wallet
    
    return result;
  } catch (error) {
    console.error('Error using tournament credits for prize pool:', error);
    return { success: false, error };
  }
}; 