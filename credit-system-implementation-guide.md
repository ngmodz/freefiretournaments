# Credit-Based System Implementation Guide for Freefire Tournaments

## Overview

This guide outlines the implementation of a credit-based system to replace real money transactions in the Freefire Tournaments app. The system includes host subscriptions, participant credits, prize distribution, wallet management, and a simplified withdrawal process.

## 1. Host Subscription System

### Host Subscription Tiers

| Tier | Monthly Price | Annual Price | Credits/Month | Platform Fee | Additional Benefits |
|------|---------------|--------------|---------------|--------------|---------------------|
| Basic Host | ₹49 | ₹529 (10% off) | 10 | 10% | Standard features |
| Pro Host | ₹149 | ₹1,516 (15% off) | 35 | 5% | Priority support, Custom room cards |
| Elite Host | ₹299 | ₹2,870 (20% off) | 80 | 2% | Custom tournament branding, Analytics dashboard, VIP support |

#### Subscription Policies

- **Auto-renewal**: All subscriptions auto-renew by default
- **Cancellation**: Users can cancel 7 days before the renewal date
- **Refunds**: No refunds for partial subscription periods
- **Credit Rollover**: Unused credits expire at the end of the subscription period
- **Tier Changes**: Users can upgrade tiers anytime; downgrades take effect at renewal

### Data Model Updates

```typescript
// Add to src/types/user.ts
enum SubscriptionTier {
  BASIC = 'basic',
  PRO = 'pro',
  ELITE = 'elite'
}

enum SubscriptionPeriod {
  MONTHLY = 'monthly',
  ANNUAL = 'annual'
}

interface HostSubscription {
  isActive: boolean;
  tier: SubscriptionTier;
  period: SubscriptionPeriod;
  startDate: Timestamp;
  endDate: Timestamp;
  remainingCredits: number;
  autoRenew: boolean;
  platformFeePercentage: number;
  cancellationRequested: boolean;
}

// Update User interface
interface User {
  // existing fields...
  hostSubscription?: HostSubscription;
}
```

### Firestore Collection Structure

```
users/{userId} {
  // existing user fields
  hostSubscription: {
    isActive: boolean,
    tier: string,
    period: string,
    startDate: timestamp,
    endDate: timestamp,
    remainingCredits: number,
    autoRenew: boolean,
    platformFeePercentage: number,
    cancellationRequested: boolean
  }
}

subscriptionTransactions/{transactionId} {
  userId: string,
  tier: string,
  period: string,
  amount: number,
  paymentId: string,
  startDate: timestamp,
  endDate: timestamp,
  createdAt: timestamp,
  status: string
}
```

### Implementation Steps

1. **Create Subscription Purchase Flow**
   - Add a "Become Host" section in the user profile with tier selection
   - Implement tabbed interface for Monthly/Annual options
   - Create subscription comparison table with features and benefits
   - Implement Cashfree payment for selected subscription tier
   - On successful payment, create subscription record with appropriate credits

2. **Credit Management**
   - Display remaining host credits in dashboard with visual indicator
   - Show subscription tier badge on profile and tournament listings
   - Automatically deduct 1 credit when tournament is created
   - Implement subscription renewal reminder (7 days before expiry)
   - Add subscription management page for cancellation/changes

3. **Tournament Creation Integration**
   - Add credit check before tournament creation
   - Show error if insufficient credits
   - Update remaining credits after successful tournament creation
   - Apply appropriate platform fee based on subscription tier

4. **Subscription Management UI Components**
   - `SubscriptionTierSelector`: Radio button group with tier details
   - `SubscriptionPeriodToggle`: Toggle between Monthly/Annual billing
   - `SubscriptionBenefitsTable`: Comparison table of features
   - `SubscriptionManagementCard`: Card showing current subscription status
   - `RenewalSettings`: Toggle and date display for auto-renewal

5. **Cashfree Service Modifications**

```typescript
// Add to src/lib/cashfree-service.ts
interface SubscriptionPaymentOptions {
  tier: SubscriptionTier;
  period: SubscriptionPeriod;
  userId: string;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
}

// Add new method to CashfreeService class
public async createSubscriptionOrder(options: SubscriptionPaymentOptions): Promise<string> {
  const { tier, period, userId, customerInfo } = options;
  
  // Determine price based on tier and period
  const prices = {
    [SubscriptionTier.BASIC]: {
      [SubscriptionPeriod.MONTHLY]: 49,
      [SubscriptionPeriod.ANNUAL]: 529
    },
    [SubscriptionTier.PRO]: {
      [SubscriptionPeriod.MONTHLY]: 149,
      [SubscriptionPeriod.ANNUAL]: 1516
    },
    [SubscriptionTier.ELITE]: {
      [SubscriptionPeriod.MONTHLY]: 299,
      [SubscriptionPeriod.ANNUAL]: 2870
    }
  };
  
  const amount = prices[tier][period];
  const orderId = `sub_${tier}_${period}_${userId}_${Date.now()}`;
  
  // Create order using existing createOrder method
  return this.createOrder({
    orderId,
    amount,
    orderNote: `${tier} Host Subscription (${period})`,
    customerInfo,
    orderMeta: {
      type: 'subscription',
      tier,
      period,
      userId
    }
  });
}
```

6. **Webhook Handler Modifications**

```typescript
// Add to netlify/functions/cashfree-webhook.js
async function handleSubscriptionPayment(orderData) {
  const { userId, tier, period } = orderData.orderMeta;
  
  // Determine subscription details
  const tierDetails = {
    'basic': {
      credits: 10,
      platformFee: 10,
      period: period === 'monthly' ? 1 : 12
    },
    'pro': {
      credits: 35,
      platformFee: 5,
      period: period === 'monthly' ? 1 : 12
    },
    'elite': {
      credits: 80,
      platformFee: 2,
      period: period === 'monthly' ? 1 : 12
    }
  };
  
  const details = tierDetails[tier];
  const startDate = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + details.period);
  
  // Create or update subscription in Firestore
  const userRef = admin.firestore().collection('users').doc(userId);
  
  await admin.firestore().runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userRef);
    
    if (!userDoc.exists) {
      throw new Error('User not found');
    }
    
    // Create subscription object
    const subscription = {
      isActive: true,
      tier: tier,
      period: period,
      startDate: admin.firestore.Timestamp.fromDate(startDate),
      endDate: admin.firestore.Timestamp.fromDate(endDate),
      remainingCredits: details.credits,
      autoRenew: true,
      platformFeePercentage: details.platformFee,
      cancellationRequested: false
    };
    
    // Update user document
    transaction.update(userRef, {
      hostSubscription: subscription
    });
    
    // Log subscription transaction
    const transactionRef = admin.firestore().collection('subscriptionTransactions').doc();
    transaction.set(transactionRef, {
      userId,
      tier,
      period,
      amount: orderData.orderAmount,
      paymentId: orderData.paymentId,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: 'completed'
    });
  });
  
  // Return success
  return {
    success: true,
    message: 'Subscription activated successfully'
  };
}
```

## 2. Participant Credit System

### Tournament Credit Packages

| Package | Name | Credits | Price (₹) | Savings |
|---------|------|---------|-----------|---------|
| Starter | "Rookie Pack" | 30 | ₹30 | - |
| Popular | "Warrior Pack" | 100 | ₹95 | 5% |
| Pro | "Legend Pack" | 300 | ₹275 | 8% |
| Premium | "Champion Pack" | 500 | ₹450 | 10% |
| Ultimate | "Immortal Pack" | 1000 | ₹850 | 15% |

#### Special Offers

1. **Welcome Pack**
   - First-time users only
   - 50 Tournament Credits for ₹40 (20% off)
   - One-time purchase per account

2. **Weekend Special**
   - Available Friday to Sunday
   - Buy any pack and get 20% extra credits
   - Limited to one purchase per weekend

3. **Season Launch**
   - Available first week of each game season
   - 30% discount on all credit packages
   - No purchase limit during the offer period

4. **Referral Bonus**
   - Refer a friend who purchases any credit pack
   - Both users receive 20 bonus credits
   - No limit on number of referrals

### Data Model Updates

```typescript
// Add to src/types/user.ts
interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  discountPercentage: number;
  isSpecialOffer: boolean;
  offerType?: 'welcome' | 'weekend' | 'season' | 'referral';
  offerEndsAt?: Timestamp;
}

interface Wallet {
  tournamentCredits: number;  // For joining tournaments (previously purchasedCredits)
  hostCredits: number;        // For creating tournaments
  earnings: number;           // Won from tournaments
  totalPurchased: number;     // Lifetime purchase tracking
  firstPurchaseCompleted: boolean; // For welcome offer eligibility
}

interface CreditTransaction {
  id: string;
  userId: string;
  type: 'purchase' | 'tournament_join' | 'tournament_win' | 'host_commission' | 'referral_bonus';
  amount: number;
  balance: number;
  walletType: 'tournamentCredits' | 'hostCredits' | 'earnings';
  description: string;
  tournamentId?: string;
  packageId?: string;
  createdAt: Timestamp;
}

// Update User interface
interface User {
  // existing fields...
  wallet: Wallet;
  referralCode?: string;
  referredBy?: string;
}
```

### Firestore Collection Structure

```
users/{userId} {
  // existing user fields
  wallet: {
    tournamentCredits: number,
    hostCredits: number,
    earnings: number,
    totalPurchased: number,
    firstPurchaseCompleted: boolean
  },
  referralCode: string,
  referredBy: string
}

creditPackages/{packageId} {
  name: string,
  credits: number,
  price: number,
  discountPercentage: number,
  isSpecialOffer: boolean,
  offerType: string,
  offerEndsAt: timestamp,
  isActive: boolean
}

creditTransactions/{transactionId} {
  userId: string,
  type: string,
  amount: number,
  balance: number,
  walletType: string,
  description: string,
  tournamentId: string,
  packageId: string,
  createdAt: timestamp
}
```

### Implementation Steps

1. **Credit Purchase UI**
   - Create "Buy Tournament Credits" page with package options
   - Implement special offer banners with countdown timers
   - Display savings amount and percentage for each package
   - Show user's current Tournament Credits balance
   - Implement Cashfree checkout for credit purchases
   - Display purchase history with transaction details

2. **Credit Purchase Components**
   - `CreditPackageCard`: Display package details with price and savings
   - `SpecialOfferBanner`: Highlight limited-time offers
   - `CreditBalanceDisplay`: Show current balance with visual indicator
   - `PurchaseHistoryTable`: List previous credit purchases
   - `ReferralSection`: Display referral code and sharing options

3. **Cashfree Service Modifications**

```typescript
// Add to src/lib/cashfree-service.ts
interface CreditPurchaseOptions {
  packageId: string;
  userId: string;
  customerInfo: {
    name: string;
    email: string;
    phone: string;
  };
}

// Add new method to CashfreeService class
public async createCreditPurchaseOrder(options: CreditPurchaseOptions): Promise<string> {
  const { packageId, userId, customerInfo } = options;
  
  // Get package details from Firestore
  const packageDoc = await firebase.firestore()
    .collection('creditPackages')
    .doc(packageId)
    .get();
    
  if (!packageDoc.exists) {
    throw new Error('Credit package not found');
  }
  
  const packageData = packageDoc.data() as CreditPackage;
  const orderId = `credits_${packageId}_${userId}_${Date.now()}`;
  
  // Create order using existing createOrder method
  return this.createOrder({
    orderId,
    amount: packageData.price,
    orderNote: `${packageData.name} (${packageData.credits} Tournament Credits)`,
    customerInfo,
    orderMeta: {
      type: 'creditPurchase',
      packageId,
      userId,
      credits: packageData.credits
    }
  });
}
```

4. **Webhook Handler Modifications**

```typescript
// Add to netlify/functions/cashfree-webhook.js
async function handleCreditPurchase(orderData) {
  const { userId, packageId, credits } = orderData.orderMeta;
  
  // Get user document
  const userRef = admin.firestore().collection('users').doc(userId);
  
  await admin.firestore().runTransaction(async (transaction) => {
    const userDoc = await transaction.get(userRef);
    
    if (!userDoc.exists) {
      throw new Error('User not found');
    }
    
    const userData = userDoc.data();
    const currentWallet = userData.wallet || { 
      tournamentCredits: 0, 
      hostCredits: 0, 
      earnings: 0,
      totalPurchased: 0,
      firstPurchaseCompleted: false
    };
    
    // Check for first purchase to handle welcome offer
    const isFirstPurchase = !currentWallet.firstPurchaseCompleted;
    
    // Check for referral to handle referral bonus
    const wasReferred = userData.referredBy && isFirstPurchase;
    
    // Update wallet
    const newWallet = {
      ...currentWallet,
      tournamentCredits: currentWallet.tournamentCredits + credits,
      totalPurchased: currentWallet.totalPurchased + credits,
      firstPurchaseCompleted: true
    };
    
    // Update user document
    transaction.update(userRef, {
      wallet: newWallet
    });
    
    // Log credit transaction
    const transactionRef = admin.firestore().collection('creditTransactions').doc();
    transaction.set(transactionRef, {
      userId,
      type: 'purchase',
      amount: credits,
      balance: newWallet.tournamentCredits,
      walletType: 'tournamentCredits',
      description: `Purchased ${credits} Tournament Credits`,
      packageId,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Handle referral bonus if applicable
    if (wasReferred) {
      const referrerRef = admin.firestore().collection('users').doc(userData.referredBy);
      const referrerDoc = await transaction.get(referrerRef);
      
      if (referrerDoc.exists) {
        const referrerData = referrerDoc.data();
        const referrerWallet = referrerData.wallet || { 
          tournamentCredits: 0, 
          hostCredits: 0, 
          earnings: 0,
          totalPurchased: 0,
          firstPurchaseCompleted: false
        };
        
        // Add referral bonus (20 credits)
        const bonusAmount = 20;
        const updatedReferrerWallet = {
          ...referrerWallet,
          tournamentCredits: referrerWallet.tournamentCredits + bonusAmount
        };
        
        // Update referrer wallet
        transaction.update(referrerRef, {
          wallet: updatedReferrerWallet
        });
        
        // Log referral bonus transaction for referrer
        const referrerTransactionRef = admin.firestore().collection('creditTransactions').doc();
        transaction.set(referrerTransactionRef, {
          userId: userData.referredBy,
          type: 'referral_bonus',
          amount: bonusAmount,
          balance: updatedReferrerWallet.tournamentCredits,
          walletType: 'tournamentCredits',
          description: `Referral bonus for user ${userId}`,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Add bonus for new user too
        transaction.update(userRef, {
          'wallet.tournamentCredits': newWallet.tournamentCredits + bonusAmount
        });
        
        // Log referral bonus transaction for new user
        const userBonusTransactionRef = admin.firestore().collection('creditTransactions').doc();
        transaction.set(userBonusTransactionRef, {
          userId,
          type: 'referral_bonus',
          amount: bonusAmount,
          balance: newWallet.tournamentCredits + bonusAmount,
          walletType: 'tournamentCredits',
          description: `Welcome referral bonus`,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    }
  });
  
  // Return success
  return {
    success: true,
    message: 'Credits added successfully'
  };
}
```

5. **Tournament Entry Integration**
   - Modify tournament join flow to use Tournament Credits instead of money
   - Check if user has sufficient Tournament Credits
   - Deduct credits equal to entry fee when joining
   - Update transaction history with tournament join details

## 3. Tournament Prize Distribution

### Data Model Updates

```typescript
// Update Tournament interface in src/lib/tournamentService.ts
interface Tournament {
  // existing fields...
  totalCreditsCollected: number;
  platformFeePercentage: number;
  winners: {
    position: string;
    uid: string;
    userId: string;
    prizeAmount: number;
    isPaid: boolean;
  }[];
}
```

### Implementation Steps

1. **Track Entry Credits**
   - Calculate totalCreditsCollected based on entry_fee × participants.length
   - Store this value in the tournament document
   - Apply platform fee based on host's subscription tier

2. **Winner Management UI**
   - Create interface for hosts to enter winners' UIDs
   - Implement UID validation
   - Match UIDs with registered participants
   - Display prize distribution in Tournament Credits

3. **Prize Distribution**
   - Calculate prize amounts based on prize_distribution percentages
   - When host confirms winners, transfer credits to winners' wallets
   - Add host commission to host's earnings
   - Create transaction records for all transfers

4. **Prize Distribution Flow**
   - Host enters winners' UIDs
   - System validates UIDs against participants
   - System calculates prize amounts
   - Host confirms distribution
   - Credits are automatically transferred to winners' wallets

## 4. Wallet Management

### UI Components

1. **Wallet Dashboard**
   - Create tabbed interface with three sections:
     - Tournament Credits (for joining tournaments)
     - Host Credits (for creating tournaments)
     - Earnings (won from tournaments)
   - Display transaction history for each section

2. **Transaction History**
   - Track all credit transactions with:
     - Transaction type (purchase, tournament join, prize win, etc.)
     - Amount
     - Date/time
     - Related tournament (if applicable)

### Implementation Steps

1. **Wallet Service**
   - Create functions for credit operations:
     - addPurchasedCredits(userId, amount)
     - deductPurchasedCredits(userId, amount)
     - addHostCredits(userId, amount)
     - deductHostCredits(userId, amount)
     - addEarnings(userId, amount)

2. **Transaction Logging**
   - Log every credit transaction in a transactions collection
   - Display transaction history in wallet UI

## 5. Withdrawal Process

### Data Model Updates

```typescript
// Add to src/types/transaction.ts
interface WithdrawalRequest {
  id: string;
  userId: string;
  amount: number;
  upiId: string;
  status: 'pending' | 'completed' | 'rejected';
  requestDate: Timestamp;
  processedDate?: Timestamp;
}
```

### Implementation Steps

1. **Withdrawal UI**
   - Create "Withdraw Earnings" form in wallet
   - Include UPI ID input field
   - Display minimum withdrawal amount (₹50)
   - Show estimated processing time (2-3 business days)

2. **Withdrawal Request Processing**
   - Validate withdrawal amount against available earnings
   - Create withdrawal request in database
   - Send email notification to admin
   - Update user's earnings balance
   - Display confirmation message to user

3. **Admin Notification**
   - Send email with withdrawal details:
     - User ID and email
     - Amount
     - UPI ID
     - Request date

## Implementation Timeline

1. **Week 1**: Data model updates and backend services
2. **Week 2**: Host subscription system and wallet management
3. **Week 3**: Participant credit system and tournament integration
4. **Week 4**: Prize distribution and withdrawal process
5. **Week 5**: Testing and refinement

## Technical Considerations

1. **Firebase Security Rules**
   - Update rules to protect wallet operations
   - Ensure only authorized users can modify credit balances

2. **Transaction Consistency**
   - Use Firebase transactions for critical credit operations
   - Implement proper error handling and rollback mechanisms

3. **Cashfree Integration**
   - Use existing Cashfree integration for credit purchases
   - No need for payout API as withdrawals will be manual

## Migration Plan

1. **Database Migration**
   - Add wallet fields to existing user documents
   - Initialize all users with zero credits
   - Convert any existing balance to earnings

2. **UI Updates**
   - Replace all price displays with credit amounts
   - Update tournament creation and join flows
   - Add new wallet and subscription UI components

3. **User Communication**
   - Prepare announcement about transition to credit system
   - Create help documentation explaining the new system
   - Offer promotional credits to existing users
