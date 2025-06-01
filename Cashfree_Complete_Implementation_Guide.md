# Cashfree Payment Gateway Complete Implementation Guide
## Freefire Tournaments Credit-Based Payment System

> **⚠️ IMPORTANT SECURITY NOTE**: This guide contains placeholder values for API keys and secrets. Replace all instances of `your_test_app_id_here`, `your_production_app_id_here`, `your_test_secret_key_here`, `your_production_secret_key_here`, and `your_webhook_secret_key_here` with your actual Cashfree credentials before implementation.

### Table of Contents
1. [Complete Package Structure and Pricing](#complete-package-structure-and-pricing)
   - [Tournament Credit Packages](#tournament-credit-packages-5-packages)
   - [Host Credit Packages](#host-credit-packages-5-packages)
   - [Credit System Economics](#credit-system-economics)
   - [Package Recommendations](#package-recommendations)
   - [Pricing Strategy Benefits](#pricing-strategy-benefits)
2. [Database Schema and Credit System Setup](#database-schema-and-credit-system-setup)
   - [Database Schema Updates](#database-schema-updates)
   - [Credit Package Definitions](#credit-package-definitions)
   - [User Wallet Structure](#user-wallet-structure)
   - [Transaction History Schema](#transaction-history-schema)
3. [Credit Service Implementation](#credit-service-implementation)
   - [Enhanced Credit Service Implementation](#enhanced-credit-service-implementation)
   - [Credit Balance Hook](#credit-balance-hook)
   - [Credit Transaction Management](#credit-transaction-management)
   - [Credit Validation Logic](#credit-validation-logic)
4. [Prize Distribution System](#prize-distribution-system)
   - [Prize Distribution Flow](#prize-distribution-flow)
   - [Database Schema Updates](#database-schema-updates-1)
   - [Prize Distribution Service](#prize-distribution-service)
   - [Tournament Creation with Prize Pool](#tournament-creation-with-prize-pool)
   - [Prize Distribution Interface](#prize-distribution-interface)
   - [Prize Display Components](#prize-display-components)
5. [UI Components and Credit Display](#ui-components-and-credit-display)
   - [Navigation and Credit Display Integration](#navigation-and-credit-display-integration)
   - [Credit Display Components](#credit-display-components)
   - [User Experience Enhancements](#user-experience-enhancements)
   - [Low Credit Alerts and Notifications](#low-credit-alerts-and-notifications)
6. [Subscription/Packages Page Implementation](#subscriptionpackages-page-implementation)
   - [Credits Page Implementation](#credits-page-implementation)
   - [Credit Package Components](#credit-package-components)
   - [Package Selection and Display](#package-selection-and-display)
   - [Responsive Design Implementation](#responsive-design-implementation)
7. [Converting Existing Rupees System to Credits](#converting-existing-rupees-system-to-credits)
   - [Database Migration Strategy](#database-migration-strategy)
   - [Wallet Page Updates](#wallet-page-updates)
   - [Add Funds Dialog Modifications](#add-funds-dialog-modifications)
   - [Tournament Logic Updates](#tournament-logic-updates)
   - [Migration Implementation Steps](#migration-implementation-steps)
8. [Human Developer Setup Guide](#human-developer-setup-guide)
   - [Account Creation and Verification](#cashfree-account-creation-and-verification)
   - [API Keys Configuration](#api-keys-configuration)
   - [Dashboard Configuration](#dashboard-configuration)
   - [Webhook Setup Guide](#webhook-setup-guide)
   - [Security Best Practices](#security-best-practices)
   - [Testing Environment Setup](#testing-environment-setup)
9. [Payment Flow Integration](#payment-flow-integration)
   - [Enhanced Cashfree Service Updates](#enhanced-cashfree-service-updates)
   - [Payment Component Implementation](#payment-component-implementation)
   - [Payment Status Handler](#payment-status-handler)
   - [Success/Failure Flow Management](#successfailure-flow-management)
10. [Backend Integration and Webhooks](#backend-integration-and-webhooks)
    - [Netlify Functions Implementation](#netlify-functions-implementation)
    - [Webhook Processing Deep Dive](#webhook-processing-deep-dive)
    - [Credit Allocation After Payment](#credit-allocation-after-payment)
    - [Error Handling and Retry Logic](#error-handling-and-retry-logic)
11. [Testing Procedures and Validation](#testing-procedures-and-validation)
    - [Local Development Testing Setup](#local-development-testing-setup)
    - [Comprehensive Testing Checklist](#comprehensive-testing-checklist)
    - [Automated Testing Scripts](#automated-testing-scripts)
    - [Manual Testing Procedures](#manual-testing-procedures)
12. [Production Deployment](#production-deployment)
    - [Environment Setup](#environment-setup)
    - [Production Deployment Checklist](#production-deployment-checklist)
    - [Security Considerations](#security-considerations)
    - [Monitoring and Troubleshooting](#monitoring-and-troubleshooting)
13. [Step-by-Step Implementation Timeline](#step-by-step-implementation-timeline)
14. [Support and Maintenance](#support-and-maintenance)

---

## Complete Package Structure and Pricing

### Tournament Credit Packages (5 Packages)

| Package | Credits | Price (₹) | Features |
|---------|---------|-----------|----------|
| **Starter Pack** | 50 | ₹50 | Entry fee up to ₹50, Perfect for beginners |
| **Popular Pack** | 150 | ₹150 | Entry fee up to ₹150, Most chosen package |
| **Pro Pack** | 300 | ₹300 | Entry fee up to ₹300, For serious gamers |
| **Elite Pack** | 500 | ₹500 | Entry fee up to ₹500, Elite gaming level |
| **Champion Pack** | 900 | ₹900 | Entry fee up to ₹900, Maximum value |

### Host Credit Packages (5 Packages)

| Package | Credits | Price (₹) | Features |
|---------|---------|-----------|----------|
| **Basic Host Pack** | 3 | ₹29 | Create 3 tournaments, Basic tools |
| **Standard Host Pack** | 5 | ₹45 | Create 5 tournaments, Enhanced tools |
| **Premium Host Pack** | 10 | ₹85 | Create 10 tournaments, Premium tools |
| **Pro Host Pack** | 20 | ₹159 | Create 20 tournaments, Pro features |
| **Ultimate Host Pack** | 50 | ₹375 | Create 50 tournaments, Ultimate suite |

### Credit System Economics

#### Tournament Credits (1 Credit = ₹1 Entry Fee Value)
- **Usage**: Join tournaments with entry fees
- **Example**: Tournament with ₹50 entry fee requires 50 tournament credits
- **Value**: Direct 1:1 mapping with rupee entry fees
- **Benefit**: Users can join multiple tournaments of varying entry fees

#### Host Credits (1 Credit = Create 1 Tournament)
- **Usage**: Create tournaments (regardless of tournament size or prize pool)
- **Example**: Creating any tournament (₹10 entry or ₹1000 entry) costs 1 host credit
- **Value**: Fixed cost per tournament creation
- **Benefit**: Predictable hosting costs for tournament organizers

### Package Recommendations

#### For Tournament Participants:
- **Casual Players**: Starter Pack (₹49 for 49 credits)
- **Regular Players**: Popular Pack (₹149 for 149 credits) - **Most Popular**
- **Serious Gamers**: Pro Pack (₹299 for 299 credits)
- **Elite Players**: Elite Pack (₹499 for 499 credits)
- **Champions**: Champion Pack (₹899 for 899 credits) - **Best Value**

#### For Tournament Hosts:
- **Occasional Hosts**: Basic Host Pack (₹29 for 3 tournaments)
- **Regular Hosts**: Standard Host Pack (₹45 for 5 tournaments)
- **Active Hosts**: Premium Host Pack (₹85 for 10 tournaments) - **Most Popular**
- **Professional Hosts**: Pro Host Pack (₹159 for 20 tournaments)
- **Tournament Organizers**: Ultimate Host Pack (₹375 for 50 tournaments) - **Best Value**

### Pricing Strategy Benefits

#### For Users:
1. **Clear Value Proposition**: Know exactly what they're getting
2. **Multiple Options**: Various package sizes to suit different needs
3. **Flexible Usage**: Credits don't expire, use when needed
4. **Transparent Pricing**: No hidden fees or complex calculations

#### For Business:
1. **Increased Revenue**: Package deals encourage larger purchases
2. **User Retention**: Credits create commitment to platform
3. **Predictable Income**: Upfront payments improve cash flow
4. **Scalable Model**: Easy to add new packages or adjust pricing

#### Implementation Notes:
- **Payment Currency**: All payments in Indian Rupees (₹)
- **Credit Currency**: All credits awarded as whole numbers
- **Simple Pricing**: Straightforward pricing without complex discount calculations
- **Popular Badges**: Highlight most chosen packages
- **Special Offers**: Optional seasonal promotions for engagement

---

## Database Schema and Credit System Setup

### Database Schema Updates

#### User Wallet Structure
```typescript
// Updated user document structure in Firestore
interface UserDocument {
  // ... existing user fields ...
  wallet: {
    // New credit fields
    tournamentCredits: number;      // For joining tournaments
    hostCredits: number;            // For creating tournaments
    earnings: number;               // Won from tournaments (in rupees)
    totalPurchasedTournamentCredits: number;
    totalPurchasedHostCredits: number;
    firstPurchaseCompleted: boolean;

    // Migration tracking
    migrationCompleted: boolean;
    migrationDate?: Timestamp;
    legacyBalance?: number; // Store original balance for reference

    // Legacy field (keep for migration)
    balance?: number; // Will be converted to credits
  };
}
```

#### Credit Transaction Schema
```typescript
// Credit transactions collection structure
interface CreditTransaction {
  id: string;
  userId: string;
  type: 'host_credit_purchase' | 'tournament_credit_purchase' | 'tournament_join' | 'tournament_win' | 'referral_bonus';
  amount: number;
  value?: number; // Rupee value for purchases
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
  };
  createdAt: Timestamp;
}
```

### Credit Package Definitions

#### Tournament Credit Package Interface
```typescript
interface TournamentCreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number; // In rupees
  isPopular?: boolean;
  isSpecialOffer?: boolean;
  offerType?: 'welcome' | 'weekend' | 'season' | 'referral';
  features: string[];
  icon: React.ReactNode;
  gradient: string;
}
```

#### Host Credit Package Interface
```typescript
interface HostCreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number; // In rupees
  isPopular?: boolean;
  isSpecialOffer?: boolean;
  features: string[];
  icon: React.ReactNode;
  gradient: string;
}
```

### User Wallet Structure

#### Firestore Security Rules Update
```javascript
// Add to firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User wallet access rules
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      // Wallet field validation
      allow update: if request.auth != null &&
                   request.auth.uid == userId &&
                   validateWalletUpdate(resource.data, request.resource.data);
    }

    // Credit transactions - read only for users, write only for server
    match /creditTransactions/{transactionId} {
      allow read: if request.auth != null &&
                 request.auth.uid == resource.data.userId;
      allow write: if false; // Only server can write transactions
    }
  }
}

function validateWalletUpdate(before, after) {
  // Ensure credits can't be manually increased (only through verified purchases)
  return after.wallet.tournamentCredits >= 0 &&
         after.wallet.hostCredits >= 0 &&
         after.wallet.earnings >= 0;
}
```

### Transaction History Schema

#### Transaction Types and Validation
```typescript
// Transaction type definitions
export enum TransactionType {
  HOST_CREDIT_PURCHASE = 'host_credit_purchase',
  TOURNAMENT_CREDIT_PURCHASE = 'tournament_credit_purchase',
  TOURNAMENT_JOIN = 'tournament_join',
  TOURNAMENT_WIN = 'tournament_win',
  REFERRAL_BONUS = 'referral_bonus'
}

export enum WalletType {
  TOURNAMENT_CREDITS = 'tournamentCredits',
  HOST_CREDITS = 'hostCredits',
  EARNINGS = 'earnings'
}

// Transaction validation schema
export const transactionSchema = {
  userId: { type: 'string', required: true },
  type: { type: 'string', enum: Object.values(TransactionType), required: true },
  amount: { type: 'number', required: true },
  value: { type: 'number', required: false },
  balanceBefore: { type: 'number', required: true },
  balanceAfter: { type: 'number', required: true },
  walletType: { type: 'string', enum: Object.values(WalletType), required: true },
  description: { type: 'string', required: true },
  transactionDetails: { type: 'object', required: false },
  createdAt: { type: 'timestamp', required: true }
};
```

---

## Credit Service Implementation

### Enhanced Credit Service Implementation

#### Credit Balance Hook (src/hooks/useCreditBalance.ts)

```typescript
import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface CreditBalance {
  hostCredits: number;
  tournamentCredits: number;
  earnings: number;
  totalPurchasedTournamentCredits: number;
  totalPurchasedHostCredits: number;
  firstPurchaseCompleted: boolean;
}

export const useCreditBalance = (userId: string | undefined) => {
  const [credits, setCredits] = useState<CreditBalance>({
    hostCredits: 0,
    tournamentCredits: 0,
    earnings: 0,
    totalPurchasedTournamentCredits: 0,
    totalPurchasedHostCredits: 0,
    firstPurchaseCompleted: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const userRef = doc(db, 'users', userId);

    const unsubscribe = onSnapshot(
      userRef,
      (doc) => {
        if (doc.exists()) {
          const userData = doc.data();
          const wallet = userData.wallet || {};

          setCredits({
            hostCredits: wallet.hostCredits || 0,
            tournamentCredits: wallet.tournamentCredits || 0,
            earnings: wallet.earnings || 0,
            totalPurchasedTournamentCredits: wallet.totalPurchasedTournamentCredits || 0,
            totalPurchasedHostCredits: wallet.totalPurchasedHostCredits || 0,
            firstPurchaseCompleted: wallet.firstPurchaseCompleted || false
          });
        }
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching credit balance:', err);
        setError('Failed to load credit balance');
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  return {
    ...credits,
    isLoading,
    error
  };
};
```

---

## Prize Distribution System

### Overview
The prize distribution system allows tournament hosts to set prize pools and distribute winnings to tournament winners. This system integrates with the credit system to provide seamless prize management.

### Prize Distribution Flow
1. **Host Sets Prize Pool**: During tournament creation, host defines total prize credits
2. **Position-Based Prizes**: Host sets prize distribution for 1st, 2nd, 3rd positions
3. **Tournament Completion**: After tournament ends, host gets prize distribution interface
4. **Winner Selection**: Host enters UIDs of winners for each position
5. **Automatic Distribution**: System transfers prize credits to winners' accounts
6. **Transaction Recording**: All prize distributions are logged for transparency

### Database Schema Updates

#### Tournament Prize Structure
```typescript
// Add to tournament document structure
interface TournamentDocument {
  // ... existing tournament fields ...
  prizePool: {
    totalPrizeCredits: number;        // Total credits allocated for prizes
    prizeDistribution: {
      first: number;                  // Credits for 1st position
      second: number;                 // Credits for 2nd position
      third: number;                  // Credits for 3rd position
      // Can extend for more positions
    };
    distributionPercentage: {
      first: number;                  // Percentage for 1st (e.g., 50%)
      second: number;                 // Percentage for 2nd (e.g., 30%)
      third: number;                  // Percentage for 3rd (e.g., 20%)
    };
    isDistributed: boolean;           // Whether prizes have been distributed
    distributedAt?: Timestamp;        // When prizes were distributed
    distributedBy?: string;           // Host UID who distributed prizes
  };
  winners?: {
    first?: {
      uid: string;
      username: string;
      prizeCredits: number;
      distributedAt: Timestamp;
    };
    second?: {
      uid: string;
      username: string;
      prizeCredits: number;
      distributedAt: Timestamp;
    };
    third?: {
      uid: string;
      username: string;
      prizeCredits: number;
      distributedAt: Timestamp;
    };
  };
}
```

#### Prize Transaction Schema
```typescript
// Add new transaction type for prize distribution
interface PrizeTransaction extends CreditTransaction {
  type: 'tournament_win';
  prizeDetails: {
    tournamentId: string;
    tournamentName: string;
    position: 'first' | 'second' | 'third';
    totalParticipants: number;
    hostUid: string;
  };
}
```

### Prize Distribution Service

#### Enhanced Credit Service for Prizes
```typescript
// Add to src/lib/creditService.ts

export class PrizeDistributionService {
  /**
   * Distribute prize to tournament winner
   */
  static async distributePrize(
    winnerUid: string,
    prizeCredits: number,
    position: 'first' | 'second' | 'third',
    tournamentId: string,
    tournamentName: string,
    hostUid: string
  ): Promise<boolean> {
    const winnerRef = doc(db, 'users', winnerUid);
    const tournamentRef = doc(db, 'tournaments', tournamentId);

    try {
      await runTransaction(db, async (transaction) => {
        const winnerDoc = await transaction.get(winnerRef);
        const tournamentDoc = await transaction.get(tournamentRef);

        if (!winnerDoc.exists()) {
          throw new Error('Winner user not found');
        }

        if (!tournamentDoc.exists()) {
          throw new Error('Tournament not found');
        }

        const winnerData = winnerDoc.data();
        const wallet = winnerData.wallet || {};
        const currentEarnings = wallet.earnings || 0;
        const newEarnings = currentEarnings + prizeCredits;

        // Update winner's earnings
        transaction.update(winnerRef, {
          'wallet.earnings': newEarnings
        });

        // Update tournament with winner info
        transaction.update(tournamentRef, {
          [`winners.${position}`]: {
            uid: winnerUid,
            username: winnerData.username || winnerData.displayName || 'Unknown',
            prizeCredits: prizeCredits,
            distributedAt: Timestamp.now()
          }
        });

        // Create prize transaction record
        const transactionData: PrizeTransaction = {
          userId: winnerUid,
          type: 'tournament_win',
          amount: prizeCredits,
          balanceBefore: currentEarnings,
          balanceAfter: newEarnings,
          walletType: 'earnings',
          description: `Won ${position} place in ${tournamentName} - Prize: ${prizeCredits} credits`,
          prizeDetails: {
            tournamentId,
            tournamentName,
            position,
            totalParticipants: tournamentDoc.data()?.participants?.length || 0,
            hostUid
          },
          createdAt: Timestamp.now()
        };

        const transactionRef = doc(collection(db, 'creditTransactions'));
        transaction.set(transactionRef, transactionData);
      });

      return true;
    } catch (error) {
      console.error('Error distributing prize:', error);
      return false;
    }
  }

  /**
   * Distribute all prizes for a tournament
   */
  static async distributeAllPrizes(
    tournamentId: string,
    winners: {
      first?: { uid: string; username: string };
      second?: { uid: string; username: string };
      third?: { uid: string; username: string };
    },
    hostUid: string
  ): Promise<{ success: boolean; errors: string[] }> {
    const tournamentRef = doc(db, 'tournaments', tournamentId);
    const errors: string[] = [];

    try {
      const tournamentDoc = await getDoc(tournamentRef);
      if (!tournamentDoc.exists()) {
        throw new Error('Tournament not found');
      }

      const tournamentData = tournamentDoc.data();
      const prizePool = tournamentData.prizePool;
      const tournamentName = tournamentData.name;

      if (!prizePool || prizePool.isDistributed) {
        throw new Error('Prize pool not configured or already distributed');
      }

      // Distribute prizes for each position
      const positions: Array<'first' | 'second' | 'third'> = ['first', 'second', 'third'];

      for (const position of positions) {
        const winner = winners[position];
        const prizeCredits = prizePool.prizeDistribution[position];

        if (winner && prizeCredits > 0) {
          const success = await this.distributePrize(
            winner.uid,
            prizeCredits,
            position,
            tournamentId,
            tournamentName,
            hostUid
          );

          if (!success) {
            errors.push(`Failed to distribute prize to ${position} place winner`);
          }
        }
      }

      // Mark tournament as prize distributed
      await updateDoc(tournamentRef, {
        'prizePool.isDistributed': true,
        'prizePool.distributedAt': Timestamp.now(),
        'prizePool.distributedBy': hostUid
      });

      return { success: errors.length === 0, errors };

    } catch (error) {
      console.error('Error distributing all prizes:', error);
      return { success: false, errors: [error.message] };
    }
  }

  /**
   * Calculate prize distribution based on total prize pool
   */
  static calculatePrizeDistribution(
    totalPrizeCredits: number,
    distributionPercentage: { first: number; second: number; third: number }
  ): { first: number; second: number; third: number } {
    return {
      first: Math.floor(totalPrizeCredits * (distributionPercentage.first / 100)),
      second: Math.floor(totalPrizeCredits * (distributionPercentage.second / 100)),
      third: Math.floor(totalPrizeCredits * (distributionPercentage.third / 100))
    };
  }

  /**
   * Validate prize distribution
   */
  static validatePrizeDistribution(
    totalPrizeCredits: number,
    distribution: { first: number; second: number; third: number }
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const totalDistribution = distribution.first + distribution.second + distribution.third;

    if (totalDistribution > totalPrizeCredits) {
      errors.push('Total prize distribution exceeds available prize pool');
    }

    if (distribution.first < 0 || distribution.second < 0 || distribution.third < 0) {
      errors.push('Prize amounts cannot be negative');
    }

    if (distribution.first < distribution.second || distribution.second < distribution.third) {
      errors.push('Prize amounts should be in descending order (1st > 2nd > 3rd)');
    }

    return { isValid: errors.length === 0, errors };
  }
}
```

### Tournament Creation with Prize Pool

#### Enhanced Tournament Creation Form
```typescript
// Add to tournament creation form
import { PrizeDistributionService } from '@/lib/creditService';

const TournamentCreateForm = () => {
  const [prizePool, setPrizePool] = useState({
    totalPrizeCredits: 0,
    distributionPercentage: { first: 50, second: 30, third: 20 }
  });

  const calculatePrizeDistribution = () => {
    return PrizeDistributionService.calculatePrizeDistribution(
      prizePool.totalPrizeCredits,
      prizePool.distributionPercentage
    );
  };

  const prizeDistribution = calculatePrizeDistribution();

  return (
    <div className="space-y-6">
      {/* ... existing tournament form fields ... */}

      {/* Prize Pool Section */}
      <Card className="bg-gaming-card border-gaming-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Prize Pool Configuration
          </CardTitle>
          <CardDescription>
            Set the total prize credits and distribution for winners
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Total Prize Credits */}
          <div>
            <Label htmlFor="totalPrizeCredits">Total Prize Credits</Label>
            <Input
              id="totalPrizeCredits"
              type="number"
              min="0"
              value={prizePool.totalPrizeCredits}
              onChange={(e) => setPrizePool(prev => ({
                ...prev,
                totalPrizeCredits: parseInt(e.target.value) || 0
              }))}
              placeholder="Enter total prize credits"
            />
          </div>

          {/* Prize Distribution Percentages */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="firstPercentage">1st Place (%)</Label>
              <Input
                id="firstPercentage"
                type="number"
                min="0"
                max="100"
                value={prizePool.distributionPercentage.first}
                onChange={(e) => setPrizePool(prev => ({
                  ...prev,
                  distributionPercentage: {
                    ...prev.distributionPercentage,
                    first: parseInt(e.target.value) || 0
                  }
                }))}
              />
            </div>
            <div>
              <Label htmlFor="secondPercentage">2nd Place (%)</Label>
              <Input
                id="secondPercentage"
                type="number"
                min="0"
                max="100"
                value={prizePool.distributionPercentage.second}
                onChange={(e) => setPrizePool(prev => ({
                  ...prev,
                  distributionPercentage: {
                    ...prev.distributionPercentage,
                    second: parseInt(e.target.value) || 0
                  }
                }))}
              />
            </div>
            <div>
              <Label htmlFor="thirdPercentage">3rd Place (%)</Label>
              <Input
                id="thirdPercentage"
                type="number"
                min="0"
                max="100"
                value={prizePool.distributionPercentage.third}
                onChange={(e) => setPrizePool(prev => ({
                  ...prev,
                  distributionPercentage: {
                    ...prev.distributionPercentage,
                    third: parseInt(e.target.value) || 0
                  }
                }))}
              />
            </div>
          </div>

          {/* Prize Distribution Preview */}
          <div className="bg-gaming-bg/50 rounded-lg p-4">
            <h4 className="font-semibold mb-3">Prize Distribution Preview</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-yellow-500 font-bold">🥇 1st Place</div>
                <div className="text-lg font-semibold">{prizeDistribution.first} Credits</div>
              </div>
              <div className="text-center">
                <div className="text-gray-400 font-bold">🥈 2nd Place</div>
                <div className="text-lg font-semibold">{prizeDistribution.second} Credits</div>
              </div>
              <div className="text-center">
                <div className="text-orange-500 font-bold">🥉 3rd Place</div>
                <div className="text-lg font-semibold">{prizeDistribution.third} Credits</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
```

### Prize Distribution Interface

#### Prize Distribution Component for Tournament Hosts
```typescript
// src/components/tournaments/PrizeDistributionDialog.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Trophy, User, Check, AlertTriangle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { PrizeDistributionService } from '@/lib/creditService';

interface PrizeDistributionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournament: {
    id: string;
    name: string;
    prizePool: {
      totalPrizeCredits: number;
      prizeDistribution: { first: number; second: number; third: number };
      isDistributed: boolean;
    };
  };
  hostUid: string;
}

const PrizeDistributionDialog = ({
  open,
  onOpenChange,
  tournament,
  hostUid
}: PrizeDistributionDialogProps) => {
  const [winners, setWinners] = useState({
    first: { uid: '', username: '' },
    second: { uid: '', username: '' },
    third: { uid: '', username: '' }
  });
  const [isDistributing, setIsDistributing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const handleWinnerChange = (position: 'first' | 'second' | 'third', field: 'uid' | 'username', value: string) => {
    setWinners(prev => ({
      ...prev,
      [position]: {
        ...prev[position],
        [field]: value
      }
    }));
    setErrors([]); // Clear errors when user makes changes
  };

  const validateWinners = (): boolean => {
    const newErrors: string[] = [];

    // Check for required fields
    if (!winners.first.uid || !winners.first.username) {
      newErrors.push('1st place winner UID and username are required');
    }

    // Check for duplicate UIDs
    const uids = [winners.first.uid, winners.second.uid, winners.third.uid].filter(Boolean);
    if (new Set(uids).size !== uids.length) {
      newErrors.push('Winner UIDs must be unique');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleDistributePrizes = async () => {
    if (!validateWinners()) return;

    setIsDistributing(true);

    try {
      const result = await PrizeDistributionService.distributeAllPrizes(
        tournament.id,
        winners,
        hostUid
      );

      if (result.success) {
        toast({
          title: "Prizes Distributed Successfully!",
          description: "All winners have received their prize credits.",
        });
        onOpenChange(false);
      } else {
        setErrors(result.errors);
        toast({
          title: "Prize Distribution Failed",
          description: "Some prizes could not be distributed. Please check the errors.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error distributing prizes:', error);
      toast({
        title: "Distribution Error",
        description: "An error occurred while distributing prizes.",
        variant: "destructive"
      });
    } finally {
      setIsDistributing(false);
    }
  };

  if (tournament.prizePool.isDistributed) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md bg-gaming-card border-gaming-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              Prizes Already Distributed
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <p className="text-gaming-muted">
              Prizes for this tournament have already been distributed to the winners.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-gaming-card border-gaming-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Distribute Tournament Prizes
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Tournament Info */}
          <Card className="bg-gaming-bg/50 border-gaming-border/50">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">{tournament.name}</h3>
              <p className="text-sm text-gaming-muted">
                Total Prize Pool: {tournament.prizePool.totalPrizeCredits} Credits
              </p>
            </CardContent>
          </Card>

          {/* Error Display */}
          {errors.length > 0 && (
            <Card className="bg-red-500/10 border-red-500/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="font-semibold text-red-500">Validation Errors</span>
                </div>
                <ul className="text-sm text-red-400 space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Winner Input Forms */}
          <div className="space-y-4">
            {/* 1st Place */}
            <Card className="bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 border-yellow-500/30">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  🥇 1st Place Winner
                  <span className="text-yellow-500 font-bold">
                    {tournament.prizePool.prizeDistribution.first} Credits
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label htmlFor="first-uid">Winner UID *</Label>
                  <Input
                    id="first-uid"
                    placeholder="Enter winner's UID"
                    value={winners.first.uid}
                    onChange={(e) => handleWinnerChange('first', 'uid', e.target.value)}
                    className="bg-gaming-bg/50"
                  />
                </div>
                <div>
                  <Label htmlFor="first-username">Winner Username *</Label>
                  <Input
                    id="first-username"
                    placeholder="Enter winner's username"
                    value={winners.first.username}
                    onChange={(e) => handleWinnerChange('first', 'username', e.target.value)}
                    className="bg-gaming-bg/50"
                  />
                </div>
              </CardContent>
            </Card>

            {/* 2nd Place */}
            {tournament.prizePool.prizeDistribution.second > 0 && (
              <Card className="bg-gradient-to-r from-gray-400/10 to-gray-500/10 border-gray-400/30">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    🥈 2nd Place Winner
                    <span className="text-gray-400 font-bold">
                      {tournament.prizePool.prizeDistribution.second} Credits
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label htmlFor="second-uid">Winner UID</Label>
                    <Input
                      id="second-uid"
                      placeholder="Enter winner's UID (optional)"
                      value={winners.second.uid}
                      onChange={(e) => handleWinnerChange('second', 'uid', e.target.value)}
                      className="bg-gaming-bg/50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="second-username">Winner Username</Label>
                    <Input
                      id="second-username"
                      placeholder="Enter winner's username (optional)"
                      value={winners.second.username}
                      onChange={(e) => handleWinnerChange('second', 'username', e.target.value)}
                      className="bg-gaming-bg/50"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 3rd Place */}
            {tournament.prizePool.prizeDistribution.third > 0 && (
              <Card className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 border-orange-500/30">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    🥉 3rd Place Winner
                    <span className="text-orange-500 font-bold">
                      {tournament.prizePool.prizeDistribution.third} Credits
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label htmlFor="third-uid">Winner UID</Label>
                    <Input
                      id="third-uid"
                      placeholder="Enter winner's UID (optional)"
                      value={winners.third.uid}
                      onChange={(e) => handleWinnerChange('third', 'uid', e.target.value)}
                      className="bg-gaming-bg/50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="third-username">Winner Username</Label>
                    <Input
                      id="third-username"
                      placeholder="Enter winner's username (optional)"
                      value={winners.third.username}
                      onChange={(e) => handleWinnerChange('third', 'username', e.target.value)}
                      className="bg-gaming-bg/50"
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isDistributing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDistributePrizes}
              disabled={isDistributing || !winners.first.uid || !winners.first.username}
              className="flex-1 bg-gaming-primary hover:bg-gaming-primary/90"
            >
              {isDistributing ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Distributing...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  Distribute Prizes
                </div>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PrizeDistributionDialog;
```

#### Tournament Management Integration
```typescript
// Add to tournament management page/component
import PrizeDistributionDialog from '@/components/tournaments/PrizeDistributionDialog';

const TournamentManagement = ({ tournament, isHost }) => {
  const [showPrizeDistribution, setShowPrizeDistribution] = useState(false);

  const canDistributePrizes = () => {
    return isHost &&
           tournament.status === 'completed' &&
           tournament.prizePool &&
           !tournament.prizePool.isDistributed;
  };

  return (
    <div className="space-y-6">
      {/* ... existing tournament management content ... */}

      {/* Prize Distribution Section */}
      {canDistributePrizes() && (
        <Card className="bg-gaming-card border-gaming-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Prize Distribution
            </CardTitle>
            <CardDescription>
              Distribute prizes to tournament winners
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Total Prize Pool: {tournament.prizePool.totalPrizeCredits} Credits</p>
                <p className="text-sm text-gaming-muted">
                  1st: {tournament.prizePool.prizeDistribution.first} |
                  2nd: {tournament.prizePool.prizeDistribution.second} |
                  3rd: {tournament.prizePool.prizeDistribution.third}
                </p>
              </div>
              <Button
                onClick={() => setShowPrizeDistribution(true)}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
              >
                <Trophy className="h-4 w-4 mr-2" />
                Distribute Prizes
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prize Distribution Dialog */}
      <PrizeDistributionDialog
        open={showPrizeDistribution}
        onOpenChange={setShowPrizeDistribution}
        tournament={tournament}
        hostUid={currentUser?.uid || ''}
      />
    </div>
  );
};
```

### Prize Display Components

#### Winner Display Component
```typescript
// src/components/tournaments/WinnerDisplay.tsx
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Medal, Award } from 'lucide-react';

interface WinnerDisplayProps {
  winners?: {
    first?: { uid: string; username: string; prizeCredits: number };
    second?: { uid: string; username: string; prizeCredits: number };
    third?: { uid: string; username: string; prizeCredits: number };
  };
  prizePool?: {
    totalPrizeCredits: number;
    isDistributed: boolean;
  };
}

const WinnerDisplay = ({ winners, prizePool }: WinnerDisplayProps) => {
  if (!prizePool?.isDistributed || !winners) {
    return (
      <Card className="bg-gaming-card border-gaming-border">
        <CardContent className="p-6 text-center">
          <Trophy className="h-12 w-12 text-gaming-muted mx-auto mb-3" />
          <p className="text-gaming-muted">
            {prizePool ? 'Prizes not yet distributed' : 'No prize pool configured'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gaming-card border-gaming-border">
      <CardContent className="p-6">
        <h3 className="text-xl font-bold mb-6 text-center flex items-center justify-center gap-2">
          <Trophy className="h-6 w-6 text-yellow-500" />
          Tournament Winners
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1st Place */}
          {winners.first && (
            <div className="text-center p-4 bg-gradient-to-b from-yellow-500/20 to-yellow-600/10 rounded-lg border border-yellow-500/30">
              <Trophy className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-yellow-500 mb-1">🥇</div>
              <p className="font-semibold text-gaming-text">{winners.first.username}</p>
              <p className="text-sm text-gaming-muted mb-2">1st Place</p>
              <p className="text-lg font-bold text-yellow-500">{winners.first.prizeCredits} Credits</p>
            </div>
          )}

          {/* 2nd Place */}
          {winners.second && (
            <div className="text-center p-4 bg-gradient-to-b from-gray-400/20 to-gray-500/10 rounded-lg border border-gray-400/30">
              <Medal className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-400 mb-1">🥈</div>
              <p className="font-semibold text-gaming-text">{winners.second.username}</p>
              <p className="text-sm text-gaming-muted mb-2">2nd Place</p>
              <p className="text-lg font-bold text-gray-400">{winners.second.prizeCredits} Credits</p>
            </div>
          )}

          {/* 3rd Place */}
          {winners.third && (
            <div className="text-center p-4 bg-gradient-to-b from-orange-500/20 to-orange-600/10 rounded-lg border border-orange-500/30">
              <Award className="h-8 w-8 text-orange-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-orange-500 mb-1">🥉</div>
              <p className="font-semibold text-gaming-text">{winners.third.username}</p>
              <p className="text-sm text-gaming-muted mb-2">3rd Place</p>
              <p className="text-lg font-bold text-orange-500">{winners.third.prizeCredits} Credits</p>
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gaming-muted">
            Total Prize Pool: {prizePool.totalPrizeCredits} Credits
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default WinnerDisplay;
```

---

## UI Components and Credit Display

### Navigation and Credit Display Integration

#### Mobile Navigation Updates (MobileNavbar.tsx)

**Step 1: Add Credit Display to Mobile Navigation**
```typescript
// src/components/MobileNavbar.tsx - Add credit display at the top
import { CreditCard, Coins } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCreditBalance } from "@/hooks/useCreditBalance";

const MobileNavbar = ({ currentPath }: MobileNavbarProps) => {
  const { currentUser } = useAuth();
  const { hostCredits, tournamentCredits, isLoading } = useCreditBalance(currentUser?.uid);

  return (
    <motion.div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-gaming-bg/90 border-t border-gaming-border backdrop-blur-lg py-1 pb-safe">
      {/* Credit Display Bar - Add this above navigation */}
      <div className="px-4 py-2 border-b border-gaming-border/50">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-gaming-card/50 px-2 py-1 rounded-md">
              <Coins size={14} className="text-gaming-accent" />
              <span className="text-xs font-medium text-gaming-text">
                {isLoading ? "..." : tournamentCredits}
              </span>
              <span className="text-xs text-gaming-muted">Tournament</span>
            </div>
            <div className="flex items-center gap-1 bg-gaming-card/50 px-2 py-1 rounded-md">
              <CreditCard size={14} className="text-gaming-primary" />
              <span className="text-xs font-medium text-gaming-text">
                {isLoading ? "..." : hostCredits}
              </span>
              <span className="text-xs text-gaming-muted">Host</span>
            </div>
          </div>
          <Link
            to="/credits"
            className="text-xs text-gaming-accent hover:text-gaming-accent/80 font-medium"
          >
            Buy Credits
          </Link>
        </div>
      </div>

      {/* Existing navigation items */}
      <nav className="grid grid-cols-5 max-w-md mx-auto">
        {/* ... existing nav items ... */}
      </nav>
    </motion.div>
  );
};
```

---

## Subscription/Packages Page Implementation

---

## Converting Existing Rupees System to Credits

---

## Human Developer Setup Guide

### 1. Cashfree Account Creation and Verification

#### Step 1: Account Registration
1. **Visit**: [https://merchant.cashfree.com/merchants/signup](https://merchant.cashfree.com/merchants/signup)
2. **Required Information**:
   - Business email address
   - Mobile number
   - Business name
   - Business type (Private Limited/Partnership/Proprietorship)
   - Business PAN
   - Business address

#### Step 2: KYC Documentation
**Required Documents**:
- **Business Registration**: Certificate of Incorporation/Partnership Deed/Shop & Establishment License
- **PAN Card**: Business PAN card
- **Bank Account**: Cancelled cheque or bank statement
- **Address Proof**: Utility bill/Rent agreement
- **Director/Partner KYC**: Aadhaar, PAN, and address proof of all directors/partners
- **GST Certificate**: If applicable (recommended for faster approval)

#### Step 3: Account Verification Process
- **Timeline**: 2-5 business days for document verification
- **Status Tracking**: Available in merchant dashboard
- **Approval Notification**: Email and SMS confirmation

### 2. API Keys Configuration

#### Sandbox Environment Setup
1. **Login**: [https://merchant.cashfree.com/merchants/login](https://merchant.cashfree.com/merchants/login)
2. **Navigate**: Developers → API Keys → Test Environment
3. **Generate Keys**:
   - **App ID**: Starts with `TEST` (e.g., `your_test_app_id_here`)
   - **Secret Key**: Used for API authentication and webhook verification

#### Production Environment Setup
1. **Navigate**: Developers → API Keys → Production Environment
2. **Generate Keys**: Available only after account verification
3. **Key Format**:
   - **App ID**: Starts with merchant ID (e.g., `your_production_app_id_here`)
   - **Secret Key**: Production secret for live transactions

### 3. Dashboard Configuration

#### Basic Dashboard Setup
1. **Login**: [https://merchant.cashfree.com/merchants/login](https://merchant.cashfree.com/merchants/login)
2. **Complete Profile**: Ensure all business details are filled
3. **Bank Account**: Add and verify your settlement bank account
4. **Business Documents**: Upload all required KYC documents

#### Payment Methods Configuration
1. **Navigate**: Settings → Payment Methods
2. **Enable Required Methods**:
   - **UPI**: Enable for instant payments (most popular in India)
   - **Credit/Debit Cards**: Enable Visa, Mastercard, RuPay
   - **Net Banking**: Enable major banks (SBI, HDFC, ICICI, etc.)
   - **Wallets**: Enable popular wallets (Paytm, PhonePe, etc.)
3. **Set Minimum/Maximum Limits**: Configure as per your business needs
4. **Transaction Fees**: Review and accept the fee structure

#### Return URL Configuration
1. **Navigate**: Settings → Return URLs
2. **Success URL**: `https://yourdomain.com/payment-status?status=success&order_id={order_id}&order_token={order_token}`
3. **Failure URL**: `https://yourdomain.com/payment-status?status=failed&order_id={order_id}&order_token={order_token}`
4. **Cancel URL**: `https://yourdomain.com/payment-status?status=cancelled&order_id={order_id}`

### 4. Webhook Setup Guide

#### Step 1: Understanding Webhooks
**What are Webhooks?**
- HTTP callbacks sent by Cashfree when payment events occur
- Ensure your application is notified of payment status changes
- Critical for automatic credit allocation in your system

**Why Webhooks are Essential:**
- **Real-time Updates**: Instant notification when payments succeed/fail
- **Reliability**: Backup mechanism if user doesn't return to your site
- **Automation**: Automatic credit allocation without manual intervention
- **Security**: Server-to-server communication with signature verification

#### Step 2: Webhook URL Requirements
**Technical Requirements:**
- **HTTPS Only**: Webhook URL must use HTTPS (not HTTP)
- **Public Access**: URL must be publicly accessible (not localhost)
- **Response Time**: Must respond within 30 seconds
- **Status Code**: Must return HTTP 200 for successful processing

**URL Format Examples:**
```bash
# Production
https://freefiretournaments.netlify.app/.netlify/functions/cashfree-webhook

# Staging
https://staging-freefiretournaments.netlify.app/.netlify/functions/cashfree-webhook

# Development (using ngrok)
https://abc123.ngrok.io/.netlify/functions/cashfree-webhook
```

#### Step 3: Configure Webhooks in Cashfree Dashboard
1. **Navigate**: Developers → Webhooks
2. **Click**: "Add Webhook"
3. **Webhook URL**: Enter your webhook endpoint URL
4. **Select Events** (Choose all relevant events):
   ```
   ✅ PAYMENT_SUCCESS_WEBHOOK
   ✅ PAYMENT_FAILED_WEBHOOK
   ✅ PAYMENT_USER_DROPPED_WEBHOOK
   ✅ PAYMENT_PENDING_WEBHOOK (optional)
   ✅ ORDER_PAID_WEBHOOK (optional)
   ```
5. **API Version**: Select `2025-01-01` (latest)
6. **Retry Policy**:
   - **Retry Attempts**: 3 (recommended)
   - **Retry Intervals**: 2 minutes, 10 minutes, 30 minutes
7. **Test Webhook**: Use the test feature to verify connectivity

#### Step 4: Webhook Security Configuration
**Secret Key Management:**
1. **Generate Secret**: Cashfree provides a webhook secret key
2. **Store Securely**: Add to environment variables
3. **Never Expose**: Keep secret key private (server-side only)

**Environment Variable Setup:**
```bash
# Add to your .env file
CASHFREE_WEBHOOK_SECRET=your_webhook_secret_key_here
```

#### Step 5: Webhook Testing and Validation
**Test Webhook Connectivity:**
1. **Dashboard Test**: Use Cashfree's webhook test feature
2. **Manual Test**: Send test payload using curl/Postman
3. **Live Test**: Complete a small test transaction

**Webhook Test Payload Example:**
```json
{
  "type": "PAYMENT_SUCCESS_WEBHOOK",
  "data": {
    "order": {
      "order_id": "test_order_123",
      "order_amount": 1.00,
      "order_currency": "INR",
      "order_status": "PAID"
    },
    "payment": {
      "payment_id": "test_payment_123",
      "payment_status": "SUCCESS",
      "payment_amount": 1.00,
      "payment_method": "upi"
    }
  }
}
```

#### Step 6: Webhook Monitoring and Logs
**Enable Webhook Logs:**
1. **Dashboard**: Navigate to Developers → Webhook Logs
2. **Monitor**: Check webhook delivery status
3. **Debug**: View failed webhook attempts and reasons
4. **Retry**: Manually retry failed webhooks if needed

**Log Monitoring Checklist:**
- [ ] Webhook delivery success rate > 95%
- [ ] Response time < 10 seconds
- [ ] No signature verification failures
- [ ] All payment events properly processed

#### Step 7: Webhook Failure Handling
**Common Webhook Failures:**
1. **Timeout**: Webhook endpoint takes too long to respond
2. **HTTP Errors**: 4xx/5xx status codes returned
3. **Network Issues**: DNS resolution or connectivity problems
4. **Signature Mismatch**: Invalid webhook signature

**Failure Resolution:**
```javascript
// Implement idempotency to handle duplicate webhooks
const processWebhook = async (payload) => {
  const orderId = payload.data.order.order_id;

  // Check if already processed
  const existingTransaction = await db.collection('creditTransactions')
    .where('transactionDetails.orderId', '==', orderId)
    .get();

  if (!existingTransaction.empty) {
    console.log(`Order ${orderId} already processed`);
    return { success: true, message: 'Already processed' };
  }

  // Process the webhook
  return await processPayment(payload);
};
```

#### Step 8: Production Webhook Checklist
**Before Going Live:**
- [ ] **HTTPS Certificate**: Valid SSL certificate installed
- [ ] **Webhook URL**: Production URL configured in dashboard
- [ ] **Secret Key**: Production webhook secret configured
- [ ] **Event Selection**: All required events enabled
- [ ] **Testing**: End-to-end webhook testing completed
- [ ] **Monitoring**: Webhook monitoring and alerting setup
- [ ] **Error Handling**: Proper error handling and logging implemented
- [ ] **Idempotency**: Duplicate webhook handling implemented

### 5. Security Best Practices

#### Environment Variables Management
```bash
# Sandbox Environment
VITE_CASHFREE_APP_ID=your_test_app_id_here
CASHFREE_APP_ID=your_test_app_id_here
CASHFREE_SECRET_KEY=your_test_secret_key_here

# Production Environment
VITE_CASHFREE_APP_ID=your_production_app_id_here
CASHFREE_APP_ID=your_production_app_id_here
CASHFREE_SECRET_KEY=your_production_secret_key_here

# Common
NEXT_PUBLIC_APP_URL=https://freefiretournaments.netlify.app
```

#### Key Security Measures
- **Never expose secret keys** in frontend code
- **Use HTTPS** for all webhook endpoints
- **Implement signature verification** for all webhooks
- **Store keys securely** in environment variables
- **Rotate keys periodically** (every 6 months)

### 6. Testing Environment Setup

#### Prerequisites and System Requirements
**Development Environment Requirements:**
- **Node.js**: Version 16+ (for Netlify Functions)
- **npm/yarn**: Latest version for package management
- **Git**: For version control
- **Code Editor**: VS Code recommended with extensions:
  - TypeScript and JavaScript Language Features
  - Netlify Functions extension
  - Firebase extension

**Required Accounts and Services:**
- **Cashfree Merchant Account**: Verified business account
- **Firebase Project**: For Firestore database
- **Netlify Account**: For hosting and serverless functions
- **Domain**: For production webhook URLs (can use Netlify subdomain)

#### Sandbox Testing Environment
1. **Base URL**: `https://sandbox.cashfree.com/pg`
2. **Test Cards**: Use provided test card numbers (see testing section)
3. **Test UPI**: `testsuccess@gocash` for success, `testfailure@gocash` for failure
4. **Test Amount**: Any amount (minimum ₹1, maximum ₹100,000)

#### Development Tools Setup
**Essential Tools:**
- **ngrok**: For local webhook testing
  ```bash
  npm install -g ngrok
  # or download from https://ngrok.com/download
  ```
- **Postman**: For API testing
  - Import Cashfree API collection
  - Set up environment variables for testing
- **Firebase CLI**: For local development
  ```bash
  npm install -g firebase-tools
  firebase login
  ```

**Optional but Recommended:**
- **webhook.site**: For webhook payload inspection
- **Netlify CLI**: For local function testing
  ```bash
  npm install -g netlify-cli
  netlify login
  ```

#### Local Development Setup
**Step 1: Clone and Setup Project**
```bash
# Clone your project
git clone https://github.com/yourusername/freefire-tournaments.git
cd freefire-tournaments

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your sandbox credentials
```

**Step 2: Configure Environment Variables**
```bash
# .env.local for development
VITE_CASHFREE_APP_ID=your_test_app_id_here
CASHFREE_APP_ID=your_test_app_id_here
CASHFREE_SECRET_KEY=your_test_secret_key_here
CASHFREE_WEBHOOK_SECRET=your_webhook_secret_key_here
NEXT_PUBLIC_APP_URL=http://localhost:8080
FIREBASE_PROJECT_ID=your-project-id
SERVICE_ACCOUNT_KEY_PATH=./firebase-service-account.json
```

**Step 3: Setup Firebase Service Account**
1. Go to Firebase Console → Project Settings → Service Accounts
2. Generate new private key
3. Download JSON file and save as `firebase-service-account.json`
4. Add file path to environment variables

**Step 4: Start Development Server**
```bash
# Start Vite development server
npm run dev

# In another terminal, start Netlify functions locally
netlify dev
```

**Step 5: Setup ngrok for Webhook Testing**
```bash
# In another terminal, expose local server
ngrok http 8080

# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
# Update webhook URL in Cashfree dashboard
```

#### Testing Tools and Resources
**API Testing with Postman:**
1. **Import Collection**: Download Cashfree Postman collection
2. **Setup Environment**: Create environment with your API keys
3. **Test Endpoints**: Test order creation and payment status APIs

**Webhook Testing Tools:**
- **webhook.site**: Inspect webhook payloads
- **ngrok**: Local webhook testing
- **Postman**: Send test webhook requests
- **curl**: Command-line webhook testing

**Browser Developer Tools:**
- **Network Tab**: Monitor API requests and responses
- **Console**: Check for JavaScript errors
- **Application Tab**: Inspect local storage and session data

#### Common Development Issues and Solutions
**Issue 1: CORS Errors**
```javascript
// Add to netlify.toml
[[headers]]
  for = "/.netlify/functions/*"
  [headers.values]
    Access-Control-Allow-Origin = "*"
    Access-Control-Allow-Headers = "Content-Type"
    Access-Control-Allow-Methods = "GET, POST, OPTIONS"
```

**Issue 2: Environment Variables Not Loading**
```javascript
// Check if variables are properly loaded
console.log('Environment check:', {
  hasAppId: !!process.env.CASHFREE_APP_ID,
  hasSecretKey: !!process.env.CASHFREE_SECRET_KEY,
  nodeEnv: process.env.NODE_ENV
});
```

**Issue 3: Firebase Admin SDK Initialization**
```javascript
// Proper Firebase Admin initialization
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(require('./firebase-service-account.json')),
    projectId: process.env.FIREBASE_PROJECT_ID
  });
}
```

#### Testing Checklist Before Implementation
**Environment Setup:**
- [ ] Node.js and npm installed and updated
- [ ] Firebase project created and configured
- [ ] Netlify account setup and connected to repository
- [ ] Cashfree sandbox account created and verified
- [ ] All environment variables configured correctly
- [ ] ngrok installed and working
- [ ] Development server running without errors

**API Connectivity:**
- [ ] Cashfree API endpoints accessible
- [ ] Firebase Firestore read/write permissions working
- [ ] Netlify Functions deploying and executing
- [ ] Webhook URL accessible via ngrok
- [ ] CORS configuration working for API calls

**Security Setup:**
- [ ] API keys stored securely in environment variables
- [ ] Webhook signature verification implemented
- [ ] HTTPS enforced for all webhook URLs
- [ ] Firebase security rules configured
- [ ] No sensitive data exposed in client-side code

---

## Technical Implementation Guide

### 1. System Architecture Overview

```
Frontend (React/Vite) → Netlify Functions → Cashfree API
                     ↓
Firebase Firestore ← Webhook Handler ← Cashfree Webhook
```

### 2. API Endpoints and Versions

#### Latest API Version: 2025-01-01
- **Base URL (Sandbox)**: `https://sandbox.cashfree.com/pg`
- **Base URL (Production)**: `https://api.cashfree.com/pg`
- **JavaScript SDK**: `https://sdk.cashfree.com/js/v3/cashfree.js`

### 3. Core Integration Components

#### Required Files Structure
```
src/
├── lib/
│   └── cashfree-service.ts          # Main service class
├── components/
│   └── payment/
│       └── CashfreeCheckout.tsx     # Payment component
└── pages/
    └── PaymentStatusPage.tsx        # Payment result page

netlify/functions/
├── create-payment-order.js          # Order creation endpoint
├── cashfree-webhook.js              # Webhook handler
└── check-payment-status.js          # Payment verification
```

### 4. Database Schema Updates

#### Firestore Collections
```typescript
// users/{userId}
interface User {
  uid: string;
  email: string;
  name: string;
  wallet: {
    tournamentCredits: number;      // For joining tournaments
    hostCredits: number;            // For creating tournaments
    earnings: number;               // Won from tournaments
    totalPurchasedTournamentCredits: number;
    totalPurchasedHostCredits: number;
    firstPurchaseCompleted: boolean;
  };
  referralCode?: string;
  referredBy?: string;
}

// creditTransactions/{transactionId}
interface CreditTransaction {
  id: string;
  userId: string;
  type: 'host_credit_purchase' | 'tournament_credit_purchase' | 'tournament_join' | 'tournament_win' | 'referral_bonus';
  amount: number;                   // Number of credits
  value?: number;                   // Monetary value (₹)
  balanceBefore: number;
  balanceAfter: number;
  walletType: 'tournamentCredits' | 'hostCredits' | 'earnings';
  description: string;
  transactionDetails?: {
    packageId?: string;
    packageName?: string;
    paymentId?: string;             // Cashfree payment ID
    orderId?: string;               // Cashfree order ID
    tournamentId?: string;
  };
  createdAt: Timestamp;
}

// creditPackages/{packageId} - For Tournament Credits
interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  discountPercentage: number;
  isSpecialOffer: boolean;
  offerType?: 'welcome' | 'weekend' | 'season' | 'referral';
  offerEndsAt?: Timestamp;
  isActive: boolean;
}
```

### 5. Credit Package Definitions

#### Host Credits (Fixed Package)
```typescript
const HOST_CREDIT_PACKAGE = {
  id: 'basic_host_pack_5',
  name: 'Basic Host Pack',
  credits: 5,
  price: 49,
  description: 'Create up to 5 tournaments'
};
```

#### Tournament Credit Packages
```typescript
const TOURNAMENT_CREDIT_PACKAGES = [
  {
    id: 'starter_pack',
    name: 'Starter Pack',
    credits: 30,
    price: 30,
    discountPercentage: 0,
    isSpecialOffer: false
  },
  {
    id: 'popular_pack',
    name: 'Popular Pack',
    credits: 100,
    price: 95,
    discountPercentage: 5,
    isSpecialOffer: false
  },
  {
    id: 'pro_pack',
    name: 'Pro Pack',
    credits: 300,
    price: 275,
    discountPercentage: 8,
    isSpecialOffer: false
  }
];
```

---

## App Integration and UI Implementation

> **🎯 Core Concept**: This implementation creates a dedicated **Subscription/Packages Page** (`/credits`, `/packages`, `/subscription`) where users can view and purchase all available credit packages. When users click "Add Funds" anywhere in the app, they are redirected to this comprehensive packages page instead of a simple payment dialog.

### Key Features of the Subscription/Packages Page:
- **📦 All Packages in One Place**: Tournament Credits (5 packages) + Host Credits (5 packages)
- **💰 Package Pricing**: Payment in Rupees (₹), Credits awarded in Credits
- **🎯 Credit Usage**: 1 Host Credit = Create 1 Tournament, Tournament Credits = Entry Fee Value
- **🎨 Beautiful UI**: Card-based layout with gradients and animations
- **📱 Responsive Design**: Perfect for both mobile and desktop
- **⚡ One-Click Purchase**: Direct integration with Cashfree payment gateway
- **📊 Current Balance Display**: Shows user's current credits at the top
- **🏷️ Package Recommendations**: Highlights popular and limited-time offers

### Credit System Economics:
- **Host Credits**: 1 Credit = Create 1 Tournament (regardless of tournament size/prize)
- **Tournament Credits**: 1 Credit = ₹1 Entry Fee Value (if tournament entry fee is ₹50, user needs 50 tournament credits)
- **Payment**: All purchases made in Indian Rupees (₹)
- **Credits Awarded**: Based on package selected

### User Journey:
1. **User clicks "Add Funds"** (from wallet page, low credit alert, etc.)
2. **Redirected to Packages Page** (`/credits`)
3. **Views all available packages** (Tournament + Host credits)
4. **Selects desired package**
5. **Clicks "Buy for ₹X"**
6. **Redirected to Cashfree payment gateway**
7. **Completes payment**
8. **Returns to app with success message**
9. **Credits automatically added to account**

### 1. Navigation and Credit Display Integration

#### Mobile Navigation Updates (MobileNavbar.tsx)

**Step 1: Add Credit Display to Mobile Navigation**
```typescript
// src/components/MobileNavbar.tsx - Add credit display at the top
import { CreditCard, Coins } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCreditBalance } from "@/hooks/useCreditBalance";

const MobileNavbar = ({ currentPath }: MobileNavbarProps) => {
  const { currentUser } = useAuth();
  const { hostCredits, tournamentCredits, isLoading } = useCreditBalance(currentUser?.uid);

  return (
    <motion.div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-gaming-bg/90 border-t border-gaming-border backdrop-blur-lg py-1 pb-safe">
      {/* Credit Display Bar - Add this above navigation */}
      <div className="px-4 py-2 border-b border-gaming-border/50">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-gaming-card/50 px-2 py-1 rounded-md">
              <Coins size={14} className="text-gaming-accent" />
              <span className="text-xs font-medium text-gaming-text">
                {isLoading ? "..." : tournamentCredits}
              </span>
              <span className="text-xs text-gaming-muted">Tournament</span>
            </div>
            <div className="flex items-center gap-1 bg-gaming-card/50 px-2 py-1 rounded-md">
              <CreditCard size={14} className="text-gaming-primary" />
              <span className="text-xs font-medium text-gaming-text">
                {isLoading ? "..." : hostCredits}
              </span>
              <span className="text-xs text-gaming-muted">Host</span>
            </div>
          </div>
          <Link
            to="/credits"
            className="text-xs text-gaming-accent hover:text-gaming-accent/80 font-medium"
          >
            Buy Credits
          </Link>
        </div>
      </div>

      {/* Existing navigation items */}
      <nav className="grid grid-cols-5 max-w-md mx-auto">
        {/* ... existing nav items ... */}
      </nav>
    </motion.div>
  );
};
```

#### Desktop Sidebar Updates (DesktopSidebar.tsx)

**Step 2: Add Credit Display to Desktop Sidebar**
```typescript
// src/components/DesktopSidebar.tsx - Add credit section
import { Coins, CreditCard, ShoppingCart } from "lucide-react";
import { useCreditBalance } from "@/hooks/useCreditBalance";

const DesktopSidebar = ({ currentPath, onHoverChange }: DesktopSidebarProps) => {
  const { currentUser } = useAuth();
  const { hostCredits, tournamentCredits, isLoading } = useCreditBalance(currentUser?.uid);

  return (
    <motion.div className="hidden lg:flex flex-col fixed left-0 top-0 h-full bg-gaming-card border-r border-gaming-border z-40 shadow-lg">
      {/* ... existing brand section ... */}

      {/* Credit Display Section - Add after brand, before navigation */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-3 py-4 border-b border-gaming-border/50"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between bg-gaming-bg/50 rounded-lg p-2">
                <div className="flex items-center gap-2">
                  <Coins size={16} className="text-gaming-accent" />
                  <span className="text-sm text-gaming-text">Tournament</span>
                </div>
                <span className="text-sm font-bold text-gaming-accent">
                  {isLoading ? "..." : tournamentCredits}
                </span>
              </div>
              <div className="flex items-center justify-between bg-gaming-bg/50 rounded-lg p-2">
                <div className="flex items-center gap-2">
                  <CreditCard size={16} className="text-gaming-primary" />
                  <span className="text-sm text-gaming-text">Host</span>
                </div>
                <span className="text-sm font-bold text-gaming-primary">
                  {isLoading ? "..." : hostCredits}
                </span>
              </div>
              <Link
                to="/credits"
                className="flex items-center gap-2 w-full bg-gaming-accent/20 hover:bg-gaming-accent/30 rounded-lg p-2 transition-colors"
              >
                <ShoppingCart size={16} className="text-gaming-accent" />
                <span className="text-sm font-medium text-gaming-accent">Buy Credits</span>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ... existing navigation section ... */}
    </motion.div>
  );
};
```

#### Navigation Route Updates

**Step 3: Add Credits/Packages Routes to App.tsx**
```typescript
// src/App.tsx - Add credits and packages routes
import Credits from "./pages/Credits";
// Alternative: import Packages from "./pages/Packages"; (same component, different name)

function App() {
  const { currentUser } = useAuth();

  return (
    <PWALayoutWrapper>
      <TournamentProvider>
        <Routes>
          {/* ... existing routes ... */}

          <Route element={<Layout />}>
            {/* ... existing protected routes ... */}

            {/* Credits/Packages Page - Multiple routes for same component */}
            <Route path="/credits" element={
              currentUser ? <Credits /> : <Navigate to="/auth" replace />
            } />
            <Route path="/packages" element={
              currentUser ? <Credits /> : <Navigate to="/auth" replace />
            } />
            <Route path="/subscription" element={
              currentUser ? <Credits /> : <Navigate to="/auth" replace />
            } />
            <Route path="/buy-credits" element={
              currentUser ? <Credits /> : <Navigate to="/auth" replace />
            } />
          </Route>
        </Routes>
      </TournamentProvider>
    </PWALayoutWrapper>
  );
}
```

### 2. Credits/Packages/Subscription Page Implementation

> **📋 Important Note**: This is a dedicated **Subscription/Packages Page** where users can view and purchase all available credit packages. The page displays both Tournament Credit packages and Host Credit packages in an organized, user-friendly layout.

#### Page Purpose and Features:
- **Centralized Package Display**: Shows all available credit packages in one place
- **Package Comparison**: Users can easily compare different credit packages
- **Dual Credit Types**: Displays both Tournament Credits and Host Credits packages
- **Real-time Balance**: Shows current credit balances at the top
- **Direct Purchase**: One-click purchase with Cashfree integration
- **Responsive Design**: Works perfectly on mobile and desktop
- **Package Recommendations**: Highlights popular and special offer packages

#### Main Credits/Packages Page Component

**Step 4: Create Credits/Packages Page (src/pages/Credits.tsx)**
> **Alternative Names**: You can also name this file `Packages.tsx`, `Subscription.tsx`, or `BuyCredits.tsx` - they all serve the same purpose
```typescript
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import NotchHeader from "@/components/NotchHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import {
  Coins,
  CreditCard,
  Star,
  Zap,
  Gift,
  ShoppingCart,
  TrendingUp,
  Crown
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { CashfreeService } from "@/lib/cashfree-service";

// Credit package interfaces
interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  originalPrice?: number;
  discountPercentage?: number;
  isPopular?: boolean;
  isSpecialOffer?: boolean;
  offerType?: 'welcome' | 'weekend' | 'season' | 'referral';
  features: string[];
  icon: React.ReactNode;
  gradient: string;
}

const Credits = () => {
  const { currentUser } = useAuth();
  const { hostCredits, tournamentCredits, isLoading: creditsLoading } = useCreditBalance(currentUser?.uid);
  const [isProcessingPayment, setIsProcessingPayment] = useState<string | null>(null);

  // Tournament Credit Packages (5 packages)
  const tournamentPackages: CreditPackage[] = [
    {
      id: 'starter_pack',
      name: 'Starter Pack',
      credits: 50,
      price: 49,
      features: ['50 Tournament Credits', 'Entry fee up to ₹50', 'Perfect for beginners', 'Join multiple tournaments'],
      icon: <Coins size={24} />,
      gradient: 'from-blue-500/20 to-cyan-500/20'
    },
    {
      id: 'popular_pack',
      name: 'Popular Pack',
      credits: 150,
      price: 149,
      isPopular: true,
      features: ['150 Tournament Credits', 'Entry fee up to ₹150', 'Most chosen package', 'Great value'],
      icon: <Star size={24} />,
      gradient: 'from-gaming-accent/20 to-orange-500/20'
    },
    {
      id: 'pro_pack',
      name: 'Pro Pack',
      credits: 300,
      price: 299,
      features: ['300 Tournament Credits', 'Entry fee up to ₹300', 'For serious gamers', 'Great value package'],
      icon: <Crown size={24} />,
      gradient: 'from-purple-500/20 to-pink-500/20'
    },
    {
      id: 'elite_pack',
      name: 'Elite Pack',
      credits: 500,
      price: 499,
      features: ['500 Tournament Credits', 'Entry fee up to ₹500', 'Elite gaming level', 'Premium tournaments'],
      icon: <Zap size={24} />,
      gradient: 'from-green-500/20 to-emerald-500/20'
    },
    {
      id: 'champion_pack',
      name: 'Champion Pack',
      credits: 900,
      price: 899,
      isSpecialOffer: true,
      offerType: 'season',
      features: ['900 Tournament Credits', 'Entry fee up to ₹900', 'Champion level access', 'Maximum value'],
      icon: <Crown size={24} />,
      gradient: 'from-yellow-500/20 to-orange-600/20'
    }
  ];

  // Host Credit Packages (5 packages)
  const hostPackages: CreditPackage[] = [
    {
      id: 'basic_host_pack',
      name: 'Basic Host Pack',
      credits: 3,
      price: 29,
      features: ['Create 3 tournaments', 'Basic host tools', 'Standard support', 'Tournament management'],
      icon: <CreditCard size={24} />,
      gradient: 'from-gaming-primary/20 to-blue-600/20'
    },
    {
      id: 'standard_host_pack',
      name: 'Standard Host Pack',
      credits: 5,
      price: 45,
      features: ['Create 5 tournaments', 'Enhanced host tools', 'Priority support', 'Great for regular hosts'],
      icon: <CreditCard size={24} />,
      gradient: 'from-blue-500/20 to-indigo-600/20'
    },
    {
      id: 'premium_host_pack',
      name: 'Premium Host Pack',
      credits: 10,
      price: 85,
      isPopular: true,
      features: ['Create 10 tournaments', 'Premium host tools', 'Advanced analytics', 'Most chosen package'],
      icon: <Star size={24} />,
      gradient: 'from-purple-500/20 to-pink-600/20'
    },
    {
      id: 'pro_host_pack',
      name: 'Pro Host Pack',
      credits: 20,
      price: 159,
      features: ['Create 20 tournaments', 'Pro host features', 'Detailed analytics', 'Professional hosting'],
      icon: <Crown size={24} />,
      gradient: 'from-green-500/20 to-emerald-600/20'
    },
    {
      id: 'ultimate_host_pack',
      name: 'Ultimate Host Pack',
      credits: 50,
      price: 375,
      isSpecialOffer: true,
      offerType: 'season',
      features: ['Create 50 tournaments', 'Ultimate host suite', 'Premium analytics', 'Best value package'],
      icon: <Zap size={24} />,
      gradient: 'from-yellow-500/20 to-orange-600/20'
    }
  ];

  const handlePurchase = async (packageData: CreditPackage, packageType: 'tournament' | 'host') => {
    if (!currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please log in to purchase credits.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessingPayment(packageData.id);

    try {
      const cashfreeService = CashfreeService.getInstance();

      // Prepare payment parameters
      const paymentParams = {
        orderAmount: packageData.price,
        customerName: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
        customerEmail: currentUser.email || 'user@example.com',
        customerPhone: currentUser.phoneNumber || '9999999999',
        orderNote: `${packageType === 'host' ? 'Host' : 'Tournament'} Credits - ${packageData.name}`,
        userId: currentUser.uid,
        packageId: packageData.id,
        packageType: packageType,
        creditsAmount: packageData.credits
      };

      console.log(`Initiating payment for ${packageData.name}:`, paymentParams);

      // Create payment order
      const response = await cashfreeService.createPaymentOrder(paymentParams);

      if (!response.success || !response.order_token) {
        throw new Error(response.error || 'Failed to create payment order');
      }

      // Initialize Cashfree checkout
      await cashfreeService.initializeDropIn(response.order_token, {
        onSuccess: (data: any) => {
          console.log('Payment successful:', data);
          toast({
            title: "Payment Successful!",
            description: `${packageData.credits} ${packageType} credits will be added to your account shortly.`,
          });
        },
        onFailure: (data: any) => {
          console.log('Payment failed:', data);
          toast({
            title: "Payment Failed",
            description: "Your payment could not be processed. Please try again.",
            variant: "destructive"
          });
        }
      });

    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Error",
        description: error.message || "An error occurred while processing your payment.",
        variant: "destructive"
      });
    } finally {
      setIsProcessingPayment(null);
    }
  };

  return (
    <div className="min-h-screen bg-gaming-bg text-gaming-text">
      <NotchHeader />

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <ShoppingCart className="h-8 w-8 text-gaming-accent" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gaming-accent to-orange-500 bg-clip-text text-transparent">
              Buy Credits
            </h1>
          </div>
          <p className="text-gaming-muted text-lg">
            Purchase credits to join tournaments or host your own gaming events
          </p>
        </motion.div>

        {/* Current Balance Display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8"
        >
          <Card className="bg-gradient-to-r from-gaming-accent/10 to-orange-500/10 border-gaming-accent/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Coins className="h-8 w-8 text-gaming-accent" />
                  <div>
                    <h3 className="font-semibold text-gaming-text">Tournament Credits</h3>
                    <p className="text-sm text-gaming-muted">For joining tournaments</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gaming-accent">
                    {creditsLoading ? "..." : tournamentCredits}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-gaming-primary/10 to-blue-600/10 border-gaming-primary/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-8 w-8 text-gaming-primary" />
                  <div>
                    <h3 className="font-semibold text-gaming-text">Host Credits</h3>
                    <p className="text-sm text-gaming-muted">For creating tournaments</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gaming-primary">
                    {creditsLoading ? "..." : hostCredits}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tournament Credits Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-6">
            <Coins className="h-6 w-6 text-gaming-accent" />
            <h2 className="text-2xl font-bold text-gaming-text">Tournament Credits</h2>
            <Badge variant="secondary" className="bg-gaming-accent/20 text-gaming-accent">
              Join Tournaments
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {tournamentPackages.map((pkg, index) => (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                className="relative"
              >
                <Card className={`h-full bg-gradient-to-br ${pkg.gradient} border-gaming-border hover:border-gaming-accent/50 transition-all duration-300 hover:scale-105`}>
                  {pkg.isPopular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-gaming-accent text-white px-3 py-1">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  {pkg.isSpecialOffer && (
                    <div className="absolute -top-3 right-4">
                      <Badge className="bg-green-500 text-white px-3 py-1">
                        Limited Offer
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="text-center pb-4">
                    <div className="flex justify-center mb-3">
                      <div className="p-3 bg-gaming-card rounded-full">
                        {pkg.icon}
                      </div>
                    </div>
                    <CardTitle className="text-xl text-gaming-text">{pkg.name}</CardTitle>
                    <div className="space-y-1">
                      <p className="text-3xl font-bold text-gaming-accent">₹{pkg.price}</p>
                      <p className="text-lg font-semibold text-gaming-text">{pkg.credits} Credits</p>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <ul className="space-y-2 mb-6">
                      {pkg.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-gaming-muted">
                          <div className="w-1.5 h-1.5 bg-gaming-accent rounded-full"></div>
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <Button
                      onClick={() => handlePurchase(pkg, 'tournament')}
                      disabled={isProcessingPayment === pkg.id}
                      className="w-full bg-gaming-accent hover:bg-gaming-accent/90 text-white font-semibold"
                    >
                      {isProcessingPayment === pkg.id ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Processing...
                        </div>
                      ) : (
                        `Buy for ₹${pkg.price}`
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Host Credits Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <CreditCard className="h-6 w-6 text-gaming-primary" />
            <h2 className="text-2xl font-bold text-gaming-text">Host Credits</h2>
            <Badge variant="secondary" className="bg-gaming-primary/20 text-gaming-primary">
              Create Tournaments
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {hostPackages.map((pkg, index) => (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 + index * 0.1 }}
                className="relative"
              >
                <Card className={`h-full bg-gradient-to-br ${pkg.gradient} border-gaming-border hover:border-gaming-primary/50 transition-all duration-300 hover:scale-105`}>
                  {pkg.isPopular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-gaming-primary text-white px-3 py-1">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  {pkg.isSpecialOffer && (
                    <div className="absolute -top-3 right-4">
                      <Badge className="bg-green-500 text-white px-3 py-1">
                        Limited Offer
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="text-center pb-4">
                    <div className="flex justify-center mb-3">
                      <div className="p-3 bg-gaming-card rounded-full">
                        {pkg.icon}
                      </div>
                    </div>
                    <CardTitle className="text-xl text-gaming-text">{pkg.name}</CardTitle>
                    <div className="space-y-1">
                      <p className="text-3xl font-bold text-gaming-primary">₹{pkg.price}</p>
                      <p className="text-lg font-semibold text-gaming-text">{pkg.credits} Credits</p>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <ul className="space-y-2 mb-6">
                      {pkg.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2 text-sm text-gaming-muted">
                          <div className="w-1.5 h-1.5 bg-gaming-primary rounded-full"></div>
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <Button
                      onClick={() => handlePurchase(pkg, 'host')}
                      disabled={isProcessingPayment === pkg.id}
                      className="w-full bg-gaming-primary hover:bg-gaming-primary/90 text-white font-semibold"
                    >
                      {isProcessingPayment === pkg.id ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Processing...
                        </div>
                      ) : (
                        `Buy for ₹${pkg.price}`
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Credits;
```

### 3. Credit Package Components

#### Credit Balance Hook (src/hooks/useCreditBalance.ts)

**Step 5: Create Credit Balance Hook**
```typescript
import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface CreditBalance {
  hostCredits: number;
  tournamentCredits: number;
  earnings: number;
  totalPurchasedTournamentCredits: number;
  totalPurchasedHostCredits: number;
  firstPurchaseCompleted: boolean;
}

export const useCreditBalance = (userId: string | undefined) => {
  const [credits, setCredits] = useState<CreditBalance>({
    hostCredits: 0,
    tournamentCredits: 0,
    earnings: 0,
    totalPurchasedTournamentCredits: 0,
    totalPurchasedHostCredits: 0,
    firstPurchaseCompleted: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const userRef = doc(db, 'users', userId);

    const unsubscribe = onSnapshot(
      userRef,
      (doc) => {
        if (doc.exists()) {
          const userData = doc.data();
          const wallet = userData.wallet || {};

          setCredits({
            hostCredits: wallet.hostCredits || 0,
            tournamentCredits: wallet.tournamentCredits || 0,
            earnings: wallet.earnings || 0,
            totalPurchasedTournamentCredits: wallet.totalPurchasedTournamentCredits || 0,
            totalPurchasedHostCredits: wallet.totalPurchasedHostCredits || 0,
            firstPurchaseCompleted: wallet.firstPurchaseCompleted || false
          });
        }
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching credit balance:', err);
        setError('Failed to load credit balance');
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  return {
    ...credits,
    isLoading,
    error
  };
};
```

#### Enhanced Credit Service (src/lib/creditService.ts)

**Step 6: Create Credit Service**
```typescript
import { db } from '@/lib/firebase';
import {
  doc,
  getDoc,
  updateDoc,
  setDoc,
  collection,
  addDoc,
  increment,
  Timestamp,
  runTransaction
} from 'firebase/firestore';

export interface CreditTransaction {
  id?: string;
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
  };
  createdAt: Timestamp;
}

export class CreditService {
  /**
   * Initialize user wallet with default values
   */
  static async initializeUserWallet(userId: string): Promise<void> {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    const userData = userDoc.data();
    if (!userData.wallet) {
      await updateDoc(userRef, {
        wallet: {
          tournamentCredits: 0,
          hostCredits: 0,
          earnings: 0,
          totalPurchasedTournamentCredits: 0,
          totalPurchasedHostCredits: 0,
          firstPurchaseCompleted: false
        }
      });
    }
  }

  /**
   * Add credits to user account after successful payment
   */
  static async addCreditsAfterPayment(
    userId: string,
    creditsAmount: number,
    creditType: 'tournament' | 'host',
    paymentDetails: {
      packageId: string;
      packageName: string;
      paymentId: string;
      orderId: string;
      amount: number;
    }
  ): Promise<void> {
    const userRef = doc(db, 'users', userId);

    await runTransaction(db, async (transaction) => {
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const userData = userDoc.data();
      const wallet = userData.wallet || {};

      const walletField = creditType === 'tournament' ? 'tournamentCredits' : 'hostCredits';
      const totalField = creditType === 'tournament' ? 'totalPurchasedTournamentCredits' : 'totalPurchasedHostCredits';

      const currentBalance = wallet[walletField] || 0;
      const newBalance = currentBalance + creditsAmount;

      // Update user wallet
      transaction.update(userRef, {
        [`wallet.${walletField}`]: newBalance,
        [`wallet.${totalField}`]: increment(creditsAmount),
        'wallet.firstPurchaseCompleted': true
      });

      // Create transaction record
      const transactionData: CreditTransaction = {
        userId,
        type: creditType === 'tournament' ? 'tournament_credit_purchase' : 'host_credit_purchase',
        amount: creditsAmount,
        value: paymentDetails.amount,
        balanceBefore: currentBalance,
        balanceAfter: newBalance,
        walletType: walletField as 'tournamentCredits' | 'hostCredits',
        description: `Purchased ${creditsAmount} ${creditType} credits - ${paymentDetails.packageName}`,
        transactionDetails: {
          packageId: paymentDetails.packageId,
          packageName: paymentDetails.packageName,
          paymentId: paymentDetails.paymentId,
          orderId: paymentDetails.orderId
        },
        createdAt: Timestamp.now()
      };

      const transactionRef = doc(collection(db, 'creditTransactions'));
      transaction.set(transactionRef, transactionData);
    });
  }

  /**
   * Deduct tournament credits when joining a tournament
   */
  static async deductTournamentCredits(
    userId: string,
    creditsAmount: number,
    tournamentId: string,
    tournamentName: string
  ): Promise<boolean> {
    const userRef = doc(db, 'users', userId);

    try {
      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);

        if (!userDoc.exists()) {
          throw new Error('User not found');
        }

        const userData = userDoc.data();
        const wallet = userData.wallet || {};
        const currentCredits = wallet.tournamentCredits || 0;

        if (currentCredits < creditsAmount) {
          throw new Error('Insufficient tournament credits');
        }

        const newBalance = currentCredits - creditsAmount;

        // Update user wallet
        transaction.update(userRef, {
          'wallet.tournamentCredits': newBalance
        });

        // Create transaction record
        const transactionData: CreditTransaction = {
          userId,
          type: 'tournament_join',
          amount: -creditsAmount,
          balanceBefore: currentCredits,
          balanceAfter: newBalance,
          walletType: 'tournamentCredits',
          description: `Joined tournament: ${tournamentName}`,
          transactionDetails: {
            tournamentId
          },
          createdAt: Timestamp.now()
        };

        const transactionRef = doc(collection(db, 'creditTransactions'));
        transaction.set(transactionRef, transactionData);
      });

      return true;
    } catch (error) {
      console.error('Error deducting tournament credits:', error);
      return false;
    }
  }

  /**
   * Deduct host credits when creating a tournament
   */
  static async deductHostCredits(
    userId: string,
    creditsAmount: number,
    tournamentId: string,
    tournamentName: string
  ): Promise<boolean> {
    const userRef = doc(db, 'users', userId);

    try {
      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);

        if (!userDoc.exists()) {
          throw new Error('User not found');
        }

        const userData = userDoc.data();
        const wallet = userData.wallet || {};
        const currentCredits = wallet.hostCredits || 0;

        if (currentCredits < creditsAmount) {
          throw new Error('Insufficient host credits');
        }

        const newBalance = currentCredits - creditsAmount;

        // Update user wallet
        transaction.update(userRef, {
          'wallet.hostCredits': newBalance
        });

        // Create transaction record
        const transactionData: CreditTransaction = {
          userId,
          type: 'tournament_join', // This represents using credits
          amount: -creditsAmount,
          balanceBefore: currentCredits,
          balanceAfter: newBalance,
          walletType: 'hostCredits',
          description: `Created tournament: ${tournamentName}`,
          transactionDetails: {
            tournamentId
          },
          createdAt: Timestamp.now()
        };

        const transactionRef = doc(collection(db, 'creditTransactions'));
        transaction.set(transactionRef, transactionData);
      });

      return true;
    } catch (error) {
      console.error('Error deducting host credits:', error);
      return false;
    }
  }

  /**
   * Add earnings when winning a tournament
   */
  static async addTournamentEarnings(
    userId: string,
    earningsAmount: number,
    tournamentId: string,
    tournamentName: string
  ): Promise<void> {
    const userRef = doc(db, 'users', userId);

    await runTransaction(db, async (transaction) => {
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists()) {
        throw new Error('User not found');
      }

      const userData = userDoc.data();
      const wallet = userData.wallet || {};
      const currentEarnings = wallet.earnings || 0;
      const newEarnings = currentEarnings + earningsAmount;

      // Update user wallet
      transaction.update(userRef, {
        'wallet.earnings': newEarnings
      });

      // Create transaction record
      const transactionData: CreditTransaction = {
        userId,
        type: 'tournament_win',
        amount: earningsAmount,
        balanceBefore: currentEarnings,
        balanceAfter: newEarnings,
        walletType: 'earnings',
        description: `Won tournament: ${tournamentName}`,
        transactionDetails: {
          tournamentId
        },
        createdAt: Timestamp.now()
      };

      const transactionRef = doc(collection(db, 'creditTransactions'));
      transaction.set(transactionRef, transactionData);
    });
  }

  /**
   * Get user's current credit balance
   */
  static async getCreditBalance(userId: string): Promise<{
    tournamentCredits: number;
    hostCredits: number;
    earnings: number;
  }> {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    const userData = userDoc.data();
    const wallet = userData.wallet || {};

    return {
      tournamentCredits: wallet.tournamentCredits || 0,
      hostCredits: wallet.hostCredits || 0,
      earnings: wallet.earnings || 0
    };
  }
}
```

### 4. Payment Flow Integration

#### Enhanced Cashfree Service Updates

**Step 7: Update Cashfree Service for Credit Purchases**
```typescript
// src/lib/cashfree-service.ts - Add credit-specific parameters
export interface CreditPaymentOrderParams extends PaymentOrderParams {
  packageId?: string;
  packageType?: 'tournament' | 'host';
  creditsAmount?: number;
}

export class CashfreeService {
  // ... existing methods ...

  /**
   * Create a payment order for credit purchases
   */
  public async createCreditPaymentOrder(params: CreditPaymentOrderParams): Promise<PaymentOrderResponse> {
    try {
      const orderId = params.orderId || `credits_${Date.now()}_${uuidv4().substring(0, 8)}`;

      console.log('Creating credit payment order:', {
        ...params,
        orderId,
        packageType: params.packageType,
        creditsAmount: params.creditsAmount
      });

      // Call the enhanced Netlify function for credit purchases
      const response = await axios.post('/.netlify/functions/create-credit-payment-order', {
        ...params,
        orderId,
      });

      return response.data;
    } catch (error) {
      console.error('Error creating credit payment order:', error);
      return {
        success: false,
        error: 'Failed to create credit payment order',
        details: error.response?.data || error.message
      };
    }
  }
}
```

#### Payment Status Page Updates

**Step 8: Create Payment Status Handler (src/pages/PaymentStatus.tsx)**
```typescript
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Clock, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import NotchHeader from '@/components/NotchHeader';

const PaymentStatus = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  const status = searchParams.get('status');
  const orderId = searchParams.get('order_id');
  const orderToken = searchParams.get('order_token');

  useEffect(() => {
    const handlePaymentStatus = async () => {
      if (status === 'success') {
        toast({
          title: "Payment Successful!",
          description: "Your credits have been added to your account.",
        });
      } else if (status === 'failed') {
        toast({
          title: "Payment Failed",
          description: "Your payment could not be processed. Please try again.",
          variant: "destructive"
        });
      } else if (status === 'cancelled') {
        toast({
          title: "Payment Cancelled",
          description: "You cancelled the payment process.",
          variant: "destructive"
        });
      }

      setIsLoading(false);

      // Redirect to home after 3 seconds
      setTimeout(() => {
        navigate('/home');
      }, 3000);
    };

    handlePaymentStatus();
  }, [status, orderId, orderToken, navigate]);

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-16 w-16 text-green-500" />;
      case 'failed':
        return <XCircle className="h-16 w-16 text-red-500" />;
      case 'cancelled':
        return <XCircle className="h-16 w-16 text-yellow-500" />;
      default:
        return <Clock className="h-16 w-16 text-gaming-muted" />;
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'success':
        return {
          title: 'Payment Successful!',
          description: 'Your credits have been added to your account and are ready to use.',
          color: 'text-green-500'
        };
      case 'failed':
        return {
          title: 'Payment Failed',
          description: 'There was an issue processing your payment. Please try again.',
          color: 'text-red-500'
        };
      case 'cancelled':
        return {
          title: 'Payment Cancelled',
          description: 'You cancelled the payment process. No charges were made.',
          color: 'text-yellow-500'
        };
      default:
        return {
          title: 'Processing Payment',
          description: 'Please wait while we process your payment...',
          color: 'text-gaming-muted'
        };
    }
  };

  const statusInfo = getStatusMessage();

  return (
    <div className="min-h-screen bg-gaming-bg text-gaming-text">
      <NotchHeader />

      <div className="container mx-auto px-4 py-12 max-w-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="bg-gaming-card border-gaming-border">
            <CardContent className="p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="flex justify-center mb-6"
              >
                {getStatusIcon()}
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className={`text-2xl font-bold mb-4 ${statusInfo.color}`}
              >
                {statusInfo.title}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-gaming-muted mb-6"
              >
                {statusInfo.description}
              </motion.p>

              {orderId && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-sm text-gaming-muted mb-6"
                >
                  Order ID: {orderId}
                </motion.p>
              )}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Button
                  onClick={() => navigate('/home')}
                  className="bg-gaming-primary hover:bg-gaming-primary/90 text-white"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Go to Home
                </Button>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="text-xs text-gaming-muted mt-4"
              >
                Redirecting automatically in 3 seconds...
              </motion.p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default PaymentStatus;
```

### 5. User Experience Enhancements

#### Credit Alerts and Notifications

**Step 9: Low Credit Alert Component (src/components/credits/LowCreditAlert.tsx)**
```typescript
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import { useAuth } from "@/contexts/AuthContext";

export const LowCreditAlert = () => {
  const { currentUser } = useAuth();
  const { hostCredits, tournamentCredits } = useCreditBalance(currentUser?.uid);

  const showTournamentAlert = tournamentCredits < 5;
  const showHostAlert = hostCredits < 1;

  if (!showTournamentAlert && !showHostAlert) return null;

  return (
    <div className="space-y-3">
      {showTournamentAlert && (
        <Alert className="bg-yellow-500/10 border-yellow-500/30 text-yellow-200">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>Low tournament credits! You have {tournamentCredits} credits remaining.</span>
            <Button asChild size="sm" className="bg-gaming-accent hover:bg-gaming-accent/90">
              <Link to="/credits">
                <ShoppingCart className="h-3 w-3 mr-1" />
                Buy Credits
              </Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {showHostAlert && (
        <Alert className="bg-red-500/10 border-red-500/30 text-red-200">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>No host credits! You need credits to create tournaments.</span>
            <Button asChild size="sm" className="bg-gaming-primary hover:bg-gaming-primary/90">
              <Link to="/credits">
                <ShoppingCart className="h-3 w-3 mr-1" />
                Buy Credits
              </Link>
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
```

#### Credit Display Widget

**Step 10: Credit Display Widget (src/components/credits/CreditDisplayWidget.tsx)**
```typescript
import { Card, CardContent } from "@/components/ui/card";
import { Coins, CreditCard, TrendingUp } from "lucide-react";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";

export const CreditDisplayWidget = () => {
  const { currentUser } = useAuth();
  const { hostCredits, tournamentCredits, earnings, isLoading } = useCreditBalance(currentUser?.uid);

  if (isLoading) {
    return (
      <Card className="bg-gaming-card/50 border-gaming-border">
        <CardContent className="p-4">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gaming-muted/20 rounded"></div>
            <div className="h-6 bg-gaming-muted/20 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="bg-gradient-to-r from-gaming-accent/10 to-orange-500/10 border-gaming-accent/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Coins className="h-6 w-6 text-gaming-accent" />
              <div>
                <p className="text-sm text-gaming-muted">Tournament Credits</p>
                <p className="text-xl font-bold text-gaming-accent">{tournamentCredits}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card className="bg-gradient-to-r from-gaming-primary/10 to-blue-600/10 border-gaming-primary/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CreditCard className="h-6 w-6 text-gaming-primary" />
              <div>
                <p className="text-sm text-gaming-muted">Host Credits</p>
                <p className="text-xl font-bold text-gaming-primary">{hostCredits}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-6 w-6 text-green-500" />
              <div>
                <p className="text-sm text-gaming-muted">Earnings</p>
                <p className="text-xl font-bold text-green-500">₹{earnings}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
```

---

## Step-by-Step Implementation Timeline

### Phase 1: Foundation Setup (Days 1-2)
**Human Developer Tasks:**
1. **Day 1: Cashfree Account Setup**
   - [ ] Create Cashfree merchant account
   - [ ] Complete KYC verification process
   - [ ] Generate sandbox API keys
   - [ ] Configure webhook URLs in dashboard
   - [ ] Test webhook connectivity

2. **Day 2: Environment Configuration**
   - [ ] Add Cashfree credentials to environment variables
   - [ ] Update Firebase security rules for credit collections
   - [ ] Install required dependencies (if any new ones needed)
   - [ ] Set up local development environment with ngrok

**AI Agent Tasks:**
1. **Database Schema Updates**
   - [ ] Update user document structure to include wallet fields
   - [ ] Create creditTransactions collection structure
   - [ ] Initialize existing users with default wallet values

### Phase 2: Core Credit System (Days 3-5)
**AI Agent Tasks:**
1. **Day 3: Credit Service Implementation**
   - [ ] Create `src/lib/creditService.ts` with all credit management functions
   - [ ] Create `src/hooks/useCreditBalance.ts` for real-time credit tracking
   - [ ] Update user registration to initialize wallet

2. **Day 4: Enhanced Cashfree Integration**
   - [ ] Update `src/lib/cashfree-service.ts` with credit-specific methods
   - [ ] Create enhanced payment order creation for credits
   - [ ] Add credit package definitions and validation

3. **Day 5: Payment Flow Integration**
   - [ ] Create `src/pages/PaymentStatus.tsx` for payment result handling
   - [ ] Update App.tsx with new routes
   - [ ] Implement payment success/failure handling

### Phase 3: UI Implementation (Days 6-8)
**AI Agent Tasks:**
1. **Day 6: Credits Page Development**
   - [ ] Create `src/pages/Credits.tsx` with full package display
   - [ ] Implement credit package components
   - [ ] Add payment initiation logic
   - [ ] Create responsive design for mobile and desktop

2. **Day 7: Navigation Integration**
   - [ ] Update `src/components/MobileNavbar.tsx` with credit display
   - [ ] Update `src/components/DesktopSidebar.tsx` with credit section
   - [ ] Add credit display widgets and alerts
   - [ ] Implement low credit notifications

3. **Day 8: Credit Display Components**
   - [ ] Create `src/components/credits/LowCreditAlert.tsx`
   - [ ] Create `src/components/credits/CreditDisplayWidget.tsx`
   - [ ] Update existing pages to show credit information
   - [ ] Add credit validation to tournament join/create flows

### Phase 4: Backend Integration (Days 9-10)
**Human Developer Tasks:**
1. **Day 9: Netlify Functions**
   - [ ] Create `netlify/functions/create-credit-payment-order.js`
   - [ ] Update `netlify/functions/cashfree-webhook.js` for credit processing
   - [ ] Implement webhook signature verification
   - [ ] Add credit allocation logic after successful payment

2. **Day 10: Webhook Processing**
   - [ ] Test webhook delivery and processing
   - [ ] Implement idempotency for duplicate webhooks
   - [ ] Add comprehensive error handling
   - [ ] Set up webhook monitoring and logging

### Phase 5: Testing and Validation (Days 11-12)
**Both Human Developer and AI Agent:**
1. **Day 11: Integration Testing**
   - [ ] Test complete payment flow from credit purchase to allocation
   - [ ] Verify webhook processing and credit addition
   - [ ] Test tournament join/create with credit deduction
   - [ ] Validate real-time credit balance updates

2. **Day 12: User Experience Testing**
   - [ ] Test mobile and desktop navigation with credits
   - [ ] Verify low credit alerts and notifications
   - [ ] Test payment success/failure scenarios
   - [ ] Validate credit display across all pages

### Phase 6: Production Deployment (Days 13-14)
**Human Developer Tasks:**
1. **Day 13: Production Setup**
   - [ ] Generate production Cashfree API keys
   - [ ] Update environment variables for production
   - [ ] Configure production webhook URLs
   - [ ] Deploy to production environment

2. **Day 14: Final Testing and Launch**
   - [ ] Conduct end-to-end testing in production
   - [ ] Test with small real transactions
   - [ ] Monitor webhook delivery and processing
   - [ ] Launch credit system to users

### Phase 7: Monitoring and Optimization (Ongoing)
**Human Developer Tasks:**
1. **Week 1 Post-Launch:**
   - [ ] Monitor payment success rates
   - [ ] Track webhook delivery performance
   - [ ] Analyze user credit purchase patterns
   - [ ] Gather user feedback and optimize UX

2. **Week 2-4 Post-Launch:**
   - [ ] Implement additional credit packages based on usage
   - [ ] Add promotional offers and discounts
   - [ ] Optimize payment flow based on user behavior
   - [ ] Scale infrastructure if needed

### Critical Success Factors

#### For Human Developer:
1. **Security First**: Ensure all API keys are properly secured
2. **Webhook Reliability**: Implement robust webhook processing with proper error handling
3. **Testing Thoroughness**: Test all payment scenarios including failures
4. **Monitoring Setup**: Implement comprehensive logging and monitoring

#### For AI Agent:
1. **Code Quality**: Write clean, well-documented, and maintainable code
2. **Error Handling**: Implement comprehensive error handling for all credit operations
3. **User Experience**: Ensure smooth and intuitive credit system integration
4. **Performance**: Optimize real-time credit balance updates and UI responsiveness

#### Collaboration Points:
1. **Daily Standups**: Review progress and address any blockers
2. **Code Reviews**: Human developer reviews AI-generated code for security and best practices
3. **Testing Coordination**: Coordinate testing efforts between frontend and backend
4. **Deployment Planning**: Plan deployment strategy and rollback procedures

### Risk Mitigation:
1. **Payment Failures**: Implement comprehensive error handling and user communication
2. **Webhook Issues**: Set up monitoring and manual retry mechanisms
3. **Credit Discrepancies**: Implement audit trails and reconciliation processes
4. **User Experience**: Conduct user testing and gather feedback early

This timeline ensures a systematic approach to implementing the credit system while maintaining code quality, security, and user experience standards.

---

## Converting Existing Rupees System to Credits System

### 1. Database Migration Strategy

#### Step 1: Update User Wallet Structure
```typescript
// BEFORE: Current wallet structure in users/{userId}
interface OldWallet {
  balance: number; // In rupees
  lastUpdated: Date;
}

// AFTER: New credit-based wallet structure
interface NewWallet {
  // Legacy field (keep for migration)
  balance?: number; // Will be converted to credits

  // New credit fields
  tournamentCredits: number;      // For joining tournaments
  hostCredits: number;            // For creating tournaments
  earnings: number;               // Won from tournaments (in rupees)
  totalPurchasedTournamentCredits: number;
  totalPurchasedHostCredits: number;
  firstPurchaseCompleted: boolean;

  // Migration tracking
  migrationCompleted: boolean;
  migrationDate?: Timestamp;
  legacyBalance?: number; // Store original balance for reference
}
```

#### Step 2: Migration Script for Existing Users
```typescript
// src/lib/migration/walletMigration.ts
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, updateDoc, writeBatch } from 'firebase/firestore';

export class WalletMigrationService {
  /**
   * Convert existing rupee balances to tournament credits
   * Conversion rate: ₹1 = 1 Tournament Credit
   */
  static async migrateAllUsers(): Promise<void> {
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    const batch = writeBatch(db);

    let migratedCount = 0;

    usersSnapshot.forEach((userDoc) => {
      const userData = userDoc.data();
      const currentWallet = userData.wallet;

      // Skip if already migrated
      if (currentWallet?.migrationCompleted) {
        return;
      }

      const legacyBalance = currentWallet?.balance || 0;

      // Convert rupees to tournament credits (1:1 ratio)
      const tournamentCredits = Math.floor(legacyBalance);

      const newWallet = {
        // New credit system
        tournamentCredits: tournamentCredits,
        hostCredits: 0, // Start with 0 host credits
        earnings: 0,
        totalPurchasedTournamentCredits: tournamentCredits, // Count migrated credits as purchased
        totalPurchasedHostCredits: 0,
        firstPurchaseCompleted: tournamentCredits > 0,

        // Migration tracking
        migrationCompleted: true,
        migrationDate: new Date(),
        legacyBalance: legacyBalance,

        // Keep legacy balance for reference (optional)
        balance: legacyBalance
      };

      const userRef = doc(db, 'users', userDoc.id);
      batch.update(userRef, { wallet: newWallet });
      migratedCount++;
    });

    await batch.commit();
    console.log(`Successfully migrated ${migratedCount} user wallets`);
  }

  /**
   * Migrate individual user wallet
   */
  static async migrateUserWallet(userId: string): Promise<void> {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    const userData = userDoc.data();
    const currentWallet = userData.wallet;

    if (currentWallet?.migrationCompleted) {
      console.log('User wallet already migrated');
      return;
    }

    const legacyBalance = currentWallet?.balance || 0;
    const tournamentCredits = Math.floor(legacyBalance);

    const newWallet = {
      tournamentCredits: tournamentCredits,
      hostCredits: 0,
      earnings: 0,
      totalPurchasedTournamentCredits: tournamentCredits,
      totalPurchasedHostCredits: 0,
      firstPurchaseCompleted: tournamentCredits > 0,
      migrationCompleted: true,
      migrationDate: new Date(),
      legacyBalance: legacyBalance,
      balance: legacyBalance
    };

    await updateDoc(userRef, { wallet: newWallet });
    console.log(`Migrated wallet for user ${userId}: ₹${legacyBalance} → ${tournamentCredits} credits`);
  }
}
```

### 2. Update Existing Wallet Page

#### Step 1: Modify Wallet Page to Show Credits Instead of Rupees
```typescript
// src/pages/Wallet.tsx - Updated to show credits
import { useEffect, useState } from "react";
import NotchHeader from "@/components/NotchHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, CreditCard, Wallet as WalletIcon, Coins, TrendingUp } from "lucide-react";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LowCreditAlert } from "@/components/credits/LowCreditAlert";
import TransactionHistory from "@/components/wallet/TransactionHistory";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const Wallet = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const {
    hostCredits,
    tournamentCredits,
    earnings,
    isLoading: creditsLoading,
    error
  } = useCreditBalance(currentUser?.uid);

  // Redirect to credits/packages page when add funds is clicked
  const handleAddFunds = () => {
    navigate('/credits'); // This takes user to the subscription/packages page
  };

  if (creditsLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gaming-bg">
        <Loader2 className="h-8 w-8 animate-spin text-gaming-primary" />
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

        {/* Low Credit Alerts */}
        <div className="mb-6">
          <LowCreditAlert />
        </div>

        {/* Credit Balance Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Tournament Credits Card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <motion.div
              whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
              className="relative"
            >
              <Card className="p-6 bg-gradient-to-br from-gaming-accent/20 to-orange-500/30 border border-gaming-accent/30 rounded-xl shadow-lg backdrop-blur-sm overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 -mr-4 -mt-4 rounded-full bg-gaming-accent/10 blur-xl"></div>

                <Coins className="h-8 w-8 text-gaming-accent mb-4" />
                <h2 className="text-lg text-gaming-accent/90 font-medium mb-2">
                  Tournament Credits
                </h2>
                <p className="text-3xl font-bold text-gaming-text drop-shadow-md mb-2">
                  {tournamentCredits}
                </p>
                <p className="text-sm text-gaming-muted">
                  Use to join tournaments
                </p>
              </Card>
            </motion.div>
          </motion.div>

          {/* Host Credits Card */}
          <motion.div
            initial={{ opacity: 0, x: 0 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <motion.div
              whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
              className="relative"
            >
              <Card className="p-6 bg-gradient-to-br from-gaming-primary/20 to-blue-600/30 border border-gaming-primary/30 rounded-xl shadow-lg backdrop-blur-sm overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 -mr-4 -mt-4 rounded-full bg-gaming-primary/10 blur-xl"></div>

                <CreditCard className="h-8 w-8 text-gaming-primary mb-4" />
                <h2 className="text-lg text-gaming-primary/90 font-medium mb-2">
                  Host Credits
                </h2>
                <p className="text-3xl font-bold text-gaming-text drop-shadow-md mb-2">
                  {hostCredits}
                </p>
                <p className="text-sm text-gaming-muted">
                  Use to create tournaments
                </p>
              </Card>
            </motion.div>
          </motion.div>

          {/* Earnings Card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <motion.div
              whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
              className="relative"
            >
              <Card className="p-6 bg-gradient-to-br from-green-500/20 to-emerald-500/30 border border-green-500/30 rounded-xl shadow-lg backdrop-blur-sm overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 -mr-4 -mt-4 rounded-full bg-green-500/10 blur-xl"></div>

                <TrendingUp className="h-8 w-8 text-green-500 mb-4" />
                <h2 className="text-lg text-green-500/90 font-medium mb-2">
                  Earnings
                </h2>
                <p className="text-3xl font-bold text-gaming-text drop-shadow-md mb-2">
                  <span className="text-green-500">₹</span>{earnings.toFixed(2)}
                </p>
                <p className="text-sm text-gaming-muted">
                  Tournament winnings
                </p>
              </Card>
            </motion.div>
          </motion.div>
        </div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 mb-8"
        >
          <Button
            onClick={handleAddFunds}
            className="flex-1 bg-gaming-accent hover:bg-gaming-accent/90 text-white font-semibold py-3 text-lg"
            size="lg"
          >
            <CreditCard className="h-5 w-5 mr-2" />
            Buy Credits
          </Button>

          {/* Future: Add withdraw earnings button when implemented */}
          {earnings > 0 && (
            <Button
              variant="outline"
              className="flex-1 border-green-500/30 text-green-500 hover:bg-green-500/10 font-semibold py-3 text-lg"
              size="lg"
              disabled // Will be enabled when withdrawal is implemented
            >
              <TrendingUp className="h-5 w-5 mr-2" />
              Withdraw Earnings (Coming Soon)
            </Button>
          )}
        </motion.div>

        {/* Transaction History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <TransactionHistory />
        </motion.div>
      </div>
    </div>
  );
};

export default Wallet;
```

### 3. Update Add Funds Dialog to Redirect to Credits Page

#### Step 1: Modify AddFundsDialog Component
```typescript
// src/components/wallet/AddFundsDialog.tsx - Updated to redirect to credits page
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, Coins, CreditCard, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

interface AddFundsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddFundsDialog = ({ open, onOpenChange }: AddFundsDialogProps) => {
  const navigate = useNavigate();

  const handleBuyCredits = () => {
    onOpenChange(false); // Close dialog
    navigate('/credits'); // Redirect to subscription/packages page with all credit packages
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-gaming-card border-gaming-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gaming-text flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-gaming-accent" />
            Buy Credits
          </DialogTitle>
          <DialogDescription className="text-gaming-muted">
            Choose from our credit packages to join tournaments or create your own
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Tournament Credits Option */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-4 bg-gradient-to-r from-gaming-accent/10 to-orange-500/10 border border-gaming-accent/30 rounded-lg cursor-pointer"
            onClick={handleBuyCredits}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Coins className="h-8 w-8 text-gaming-accent" />
                <div>
                  <h3 className="font-semibold text-gaming-text">Tournament Credits</h3>
                  <p className="text-sm text-gaming-muted">Join tournaments and compete</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-gaming-accent" />
            </div>
          </motion.div>

          {/* Host Credits Option */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-4 bg-gradient-to-r from-gaming-primary/10 to-blue-600/10 border border-gaming-primary/30 rounded-lg cursor-pointer"
            onClick={handleBuyCredits}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CreditCard className="h-8 w-8 text-gaming-primary" />
                <div>
                  <h3 className="font-semibold text-gaming-text">Host Credits</h3>
                  <p className="text-sm text-gaming-muted">Create and manage tournaments</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-gaming-primary" />
            </div>
          </motion.div>
        </div>

        <div className="flex justify-center pt-4">
          <Button
            onClick={handleBuyCredits}
            className="w-full bg-gaming-accent hover:bg-gaming-accent/90 text-white font-semibold"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            View All Credit Packages
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddFundsDialog;
```

### 4. Update Tournament Join/Create Logic

#### Step 1: Update Tournament Join Logic to Use Credits
```typescript
// src/components/tournaments/TournamentJoinButton.tsx - Updated for credits
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import { CreditService } from "@/lib/creditService";
import { toast } from "@/components/ui/use-toast";
import { Coins, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

interface TournamentJoinButtonProps {
  tournamentId: string;
  tournamentName: string;
  entryFee: number; // Entry fee in rupees (₹) - user needs equivalent credits
  isJoined: boolean;
  onJoinSuccess: () => void;
}

const TournamentJoinButton = ({
  tournamentId,
  tournamentName,
  entryFee,
  isJoined,
  onJoinSuccess
}: TournamentJoinButtonProps) => {
  const { currentUser } = useAuth();
  const { tournamentCredits } = useCreditBalance(currentUser?.uid);
  const [isJoining, setIsJoining] = useState(false);

  const handleJoinTournament = async () => {
    if (!currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please log in to join tournaments.",
        variant: "destructive"
      });
      return;
    }

    if (tournamentCredits < entryFee) {
      toast({
        title: "Insufficient Credits",
        description: (
          <div className="flex flex-col gap-2">
            <span>You need {entryFee} tournament credits to join this tournament (Entry Fee: ₹{entryFee}).</span>
            <span>You currently have {tournamentCredits} credits.</span>
            <Link to="/credits" className="text-gaming-accent hover:underline">
              Buy more credits →
            </Link>
          </div>
        ),
        variant: "destructive"
      });
      return;
    }

    setIsJoining(true);

    try {
      const success = await CreditService.deductTournamentCredits(
        currentUser.uid,
        entryFee,
        tournamentId,
        tournamentName
      );

      if (success) {
        // Add user to tournament participants
        // ... existing tournament join logic ...

        onJoinSuccess();
        toast({
          title: "Successfully Joined!",
          description: `${entryFee} tournament credits deducted. Good luck!`,
        });
      } else {
        throw new Error('Failed to deduct credits');
      }
    } catch (error) {
      console.error('Error joining tournament:', error);
      toast({
        title: "Join Failed",
        description: "Failed to join tournament. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsJoining(false);
    }
  };

  if (isJoined) {
    return (
      <Button disabled className="w-full bg-green-600 text-white">
        ✓ Joined
      </Button>
    );
  }

  const hasInsufficientCredits = tournamentCredits < entryFee;

  return (
    <div className="space-y-2">
      <Button
        onClick={handleJoinTournament}
        disabled={isJoining || hasInsufficientCredits}
        className={`w-full ${
          hasInsufficientCredits
            ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
            : 'bg-gaming-accent hover:bg-gaming-accent/90 text-white'
        }`}
      >
        {isJoining ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            Joining...
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4" />
            Join ({entryFee} Credits = ₹{entryFee})
          </div>
        )}
      </Button>

      {hasInsufficientCredits && (
        <div className="flex items-center gap-2 text-sm text-yellow-400">
          <AlertTriangle className="h-4 w-4" />
          <span>Need {entryFee - tournamentCredits} more credits</span>
          <Link to="/credits" className="text-gaming-accent hover:underline ml-1">
            Buy Credits
          </Link>
        </div>
      )}
    </div>
  );
};

export default TournamentJoinButton;
```

#### Step 2: Update Tournament Creation Logic
```typescript
// src/components/tournaments/TournamentCreateForm.tsx - Updated for host credits
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useCreditBalance } from "@/hooks/useCreditBalance";
import { CreditService } from "@/lib/creditService";
import { toast } from "@/components/ui/use-toast";
import { CreditCard, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

const TournamentCreateForm = () => {
  const { currentUser } = useAuth();
  const { hostCredits } = useCreditBalance(currentUser?.uid);
  const [isCreating, setIsCreating] = useState(false);

  const HOST_CREDIT_COST = 1; // Cost to create one tournament

  const handleCreateTournament = async (tournamentData: any) => {
    if (!currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please log in to create tournaments.",
        variant: "destructive"
      });
      return;
    }

    if (hostCredits < HOST_CREDIT_COST) {
      toast({
        title: "Insufficient Host Credits",
        description: (
          <div className="flex flex-col gap-2">
            <span>You need {HOST_CREDIT_COST} host credit to create a tournament.</span>
            <span>You currently have {hostCredits} host credits.</span>
            <Link to="/credits" className="text-gaming-accent hover:underline">
              Buy host credits →
            </Link>
          </div>
        ),
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);

    try {
      // Create tournament first
      const tournamentId = await createTournament(tournamentData);

      // Deduct host credits
      const success = await CreditService.deductHostCredits(
        currentUser.uid,
        HOST_CREDIT_COST,
        tournamentId,
        tournamentData.name
      );

      if (success) {
        toast({
          title: "Tournament Created!",
          description: `${HOST_CREDIT_COST} host credit deducted. Your tournament is now live!`,
        });
        // Redirect to tournament page or tournaments list
      } else {
        throw new Error('Failed to deduct host credits');
      }
    } catch (error) {
      console.error('Error creating tournament:', error);
      toast({
        title: "Creation Failed",
        description: "Failed to create tournament. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const hasInsufficientCredits = hostCredits < HOST_CREDIT_COST;

  return (
    <div className="space-y-4">
      {/* Tournament form fields... */}

      {/* Host Credit Warning */}
      {hasInsufficientCredits && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <div className="flex items-center gap-2 text-red-400 mb-2">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-semibold">Insufficient Host Credits</span>
          </div>
          <p className="text-sm text-red-300 mb-3">
            You need {HOST_CREDIT_COST} host credit to create a tournament.
            You currently have {hostCredits} host credits.
          </p>
          <Button asChild size="sm" className="bg-gaming-primary hover:bg-gaming-primary/90">
            <Link to="/credits">
              <CreditCard className="h-4 w-4 mr-2" />
              Buy Host Credits
            </Link>
          </Button>
        </div>
      )}

      <Button
        onClick={handleCreateTournament}
        disabled={isCreating || hasInsufficientCredits}
        className={`w-full ${
          hasInsufficientCredits
            ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
            : 'bg-gaming-primary hover:bg-gaming-primary/90 text-white'
        }`}
      >
        {isCreating ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            Creating Tournament...
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Create Tournament ({HOST_CREDIT_COST} Host Credit)
          </div>
        )}
      </Button>
    </div>
  );
};

export default TournamentCreateForm;
```

### 5. Migration Implementation Steps

#### Phase 1: Pre-Migration (Day 1)
**Human Developer Tasks:**
1. **Backup Current Database**
   - [ ] Export all user wallet data
   - [ ] Create backup of transactions collection
   - [ ] Document current wallet balances

2. **Deploy Migration Script**
   - [ ] Add migration functions to codebase
   - [ ] Test migration script on development environment
   - [ ] Prepare rollback procedures

#### Phase 2: Migration Execution (Day 2)
**AI Agent Tasks:**
1. **Run Migration Script**
   - [ ] Execute `WalletMigrationService.migrateAllUsers()`
   - [ ] Verify migration results
   - [ ] Generate migration report

2. **Update UI Components**
   - [ ] Deploy updated Wallet page
   - [ ] Update AddFundsDialog component
   - [ ] Update tournament join/create components

#### Phase 3: Post-Migration Validation (Day 3)
**Both Human Developer and AI Agent:**
1. **Validation Testing**
   - [ ] Verify all users have correct credit balances
   - [ ] Test credit purchase flow
   - [ ] Test tournament join/create with credits
   - [ ] Validate transaction history

2. **User Communication**
   - [ ] Send notification about new credit system
   - [ ] Update help documentation
   - [ ] Monitor user feedback and support requests

This migration strategy ensures a smooth transition from the rupees system to the credits system while maintaining all user balances and providing a better user experience with the new credit packages.

---

## Complete Package Structure and Pricing

### Tournament Credit Packages (5 Packages)

| Package | Credits | Price (₹) | Features |
|---------|---------|-----------|----------|
| **Starter Pack** | 50 | ₹50 | Entry fee up to ₹50, Perfect for beginners |
| **Popular Pack** | 150 | ₹150 | Entry fee up to ₹150, Most chosen package |
| **Pro Pack** | 300 | ₹300 | Entry fee up to ₹300, For serious gamers |
| **Elite Pack** | 500 | ₹500 | Entry fee up to ₹500, Elite gaming level |
| **Champion Pack** | 900 | ₹900 | Entry fee up to ₹900, Maximum value |

### Host Credit Packages (5 Packages)

| Package | Credits | Price (₹) | Features |
|---------|---------|-----------|----------|
| **Basic Host Pack** | 3 | ₹29 | Create 3 tournaments, Basic tools |
| **Standard Host Pack** | 5 | ₹45 | Create 5 tournaments, Enhanced tools |
| **Premium Host Pack** | 10 | ₹85 | Create 10 tournaments, Premium tools |
| **Pro Host Pack** | 20 | ₹159 | Create 20 tournaments, Pro features |
| **Ultimate Host Pack** | 50 | ₹375 | Create 50 tournaments, Ultimate suite |

### Credit System Economics

#### Tournament Credits (1 Credit = ₹1 Entry Fee Value)
- **Usage**: Join tournaments with entry fees
- **Example**: Tournament with ₹50 entry fee requires 50 tournament credits
- **Value**: Direct 1:1 mapping with rupee entry fees
- **Benefit**: Users can join multiple tournaments of varying entry fees

#### Host Credits (1 Credit = Create 1 Tournament)
- **Usage**: Create tournaments (regardless of tournament size or prize pool)
- **Example**: Creating any tournament (₹10 entry or ₹1000 entry) costs 1 host credit
- **Value**: Fixed cost per tournament creation
- **Benefit**: Predictable hosting costs for tournament organizers

### Package Recommendations

#### For Tournament Participants:
- **Casual Players**: Starter Pack (₹49 for 49 credits)
- **Regular Players**: Popular Pack (₹149 for 149 credits) - **Most Popular**
- **Serious Gamers**: Pro Pack (₹299 for 299 credits)
- **Elite Players**: Elite Pack (₹499 for 499 credits)
- **Champions**: Champion Pack (₹899 for 899 credits) - **Best Value**

#### For Tournament Hosts:
- **Occasional Hosts**: Basic Host Pack (₹29 for 3 tournaments)
- **Regular Hosts**: Standard Host Pack (₹45 for 5 tournaments)
- **Active Hosts**: Premium Host Pack (₹85 for 10 tournaments) - **Most Popular**
- **Professional Hosts**: Pro Host Pack (₹159 for 20 tournaments)
- **Tournament Organizers**: Ultimate Host Pack (₹375 for 50 tournaments) - **Best Value**

### Pricing Strategy Benefits

#### For Users:
1. **Clear Value Proposition**: Know exactly what they're getting
2. **Multiple Options**: Various package sizes to suit different needs
3. **Flexible Usage**: Credits don't expire, use when needed
4. **Transparent Pricing**: No hidden fees or complex calculations

#### For Business:
1. **Increased Revenue**: Package deals encourage larger purchases
2. **User Retention**: Credits create commitment to platform
3. **Predictable Income**: Upfront payments improve cash flow
4. **Scalable Model**: Easy to add new packages or adjust pricing

#### Implementation Notes:
- **Payment Currency**: All payments in Indian Rupees (₹)
- **Credit Currency**: All credits awarded as whole numbers
- **Simple Pricing**: Straightforward pricing without complex discount calculations
- **Popular Badges**: Highlight most chosen packages
- **Special Offers**: Optional seasonal promotions for engagement
