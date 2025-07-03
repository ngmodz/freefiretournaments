# FreeFire Tournaments Platform

A comprehensive gaming tournament platform built with React, Firebase, and integrated payment processing. This platform enables users to create, join, and manage FreeFire gaming tournaments with an integrated credit system and real-time payments.

## Features

### 🎮 Tournament Management
- Create and host custom FreeFire tournaments
- Join tournaments with entry fees using credits
- Real-time tournament status updates
- Automated prize distribution system
- Room ID and password sharing for tournament rooms

### 💳 Integrated Wallet & Credit System
- **Tournament Credits**: For joining tournaments and entry fees
- **Host Credits**: For creating and hosting tournaments  
- **Earnings**: Withdrawable funds from tournament winnings
- Real-time credit balance tracking
- Credit purchase with multiple packages
- 1:1 credit to earnings conversion system

### 💰 Payment Integration
- Secure payment processing and webhooks
- Multiple credit packages (Starter, Popular, Pro, Elite, Champion)
- UPI withdrawal support for earnings
- Transaction history and real-time notifications

### 📱 Modern UI/UX
- Progressive Web App (PWA) with offline support
- Responsive design for mobile and desktop
- Real-time notifications and alerts
- Smooth animations with Framer Motion
- Gaming-themed dark UI with custom styling

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** with custom gaming theme
- **Framer Motion** for animations
- **React Router** for navigation
- **React Hook Form** with Zod validation
- **Radix UI** components for accessible UI

### Backend & Services
- **Firebase** (Authentication, Firestore, Storage)
- **Vercel** for hosting, with serverless functions for backend logic
- **Netlify Functions** for serverless backend
- **Payment Gateway Integration** for payment processing
- **Real-time database** with Firestore listeners

### Key Libraries
- **Lucide React** for icons
- **React Query** for data fetching
- **Sonner** for toast notifications
- **PWA** features with service worker

## Quick Start

### Prerequisites
- Node.js 18+ and npm/yarn/bun
- Firebase project with Firestore enabled
- Payment gateway account for processing payments
- Vercel account for deployment
- CashFree merchant account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd freefire-tournaments
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   bun install
   ```

3. **Environment Setup**
   Create a `.env` file with the following variables:
   ```env
   # Firebase Configuration
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id

   # Payment Configuration
   VITE_PAYMENT_FORM_URL=your_payment_form_url
   VITE_PAYMENT_FORM_WEBHOOK_SECRET=your_webhook_secret

   # API Configuration
   VITE_API_URL=/api

   # CashFree Configuration
   VITE_CASHFREE_APP_ID=your_cashfree_app_id
   CASHFREE_SECRET_KEY=your_cashfree_secret_key

   # Firebase Service Account
   FIREBASE_SERVICE_ACCOUNT=your_firebase_service_account_json
   ```

4. **Firebase Setup**
   - Create a Firebase project
   - Enable Authentication (Email/Password)
   - Enable Firestore Database
   - Set up security rules for Firestore
   - Configure Firebase Storage

5. **Start Development Server**
   ```bash
   npm run dev
   # or
   bun dev
   ```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── auth/           # Authentication components
│   ├── credits/        # Credit system components
│   ├── payment/        # Payment integration components
│   ├── tournament/     # Tournament-related components
│   ├── wallet/         # Wallet and transaction components
│   └── ui/             # Base UI components (shadcn/ui)
├── contexts/           # React contexts for state management
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries and services
│   ├── firebase/       # Firebase configuration and services
│   ├── creditService.ts    # Credit management service
│   ├── paymentService.ts   # Payment processing service
│   ├── tournamentService.ts # Tournament management service
│   └── walletService.ts    # Wallet operations service
├── pages/              # Page components
└── utils/              # Utility functions

netlify/
└── functions/          # Serverless functions
    ├── payment-webhook.js     # Payment webhook handler
    ├── verify-payment.js      # Payment verification
    ├── add-funds.js          # Add funds to wallet
    └── withdraw-funds.js     # Withdrawal processing
```

## Core Features Guide

### 🎯 Tournament System

#### Creating Tournaments
```typescript
// Tournament creation with prize pool
const tournamentData = {
  name: "FreeFire Pro Tournament",
  description: "Competitive FreeFire tournament",
  mode: "Solo",
  max_players: 12,
  entry_fee: 50,
  prizePool: {
    enablePrizePool: true,
    totalPrizeCredits: 500,
    prizeDistribution: {
      first: 250,   // 50%
      second: 150,  // 30%
      third: 100    // 20%
    }
  }
};
```

#### Joining Tournaments
```typescript
// Join tournament using credits
await TournamentService.joinTournament(tournamentId, {
  userId: currentUser.uid,
  entryFee: 50
});
```

### 💳 Credit System

#### Credit Types
- **Tournament Credits**: Used for joining tournaments (₹1 = 1 credit)
- **Host Credits**: Used for creating tournaments
- **Earnings**: Withdrawable funds from winnings

#### Purchasing Credits
```typescript
// Purchase credit packages
const paymentParams = {
  amount: 150,
  userId: currentUser.uid,
  paymentType: 'credit_purchase',
  packageId: 'popular_pack',
  packageType: 'tournament',
  creditsAmount: 150
};

PaymentService.getInstance().redirectToPaymentForm(paymentParams);
```

#### Converting Credits to Earnings
```typescript
// Convert tournament credits to withdrawable earnings (1:1 ratio)
await CreditService.convertCreditsToEarnings(userId, creditsAmount);
```

### 💰 Wallet Operations

#### Real-time Balance Tracking
```typescript
// Subscribe to wallet updates
const { tournamentCredits, hostCredits, earnings } = useCreditBalance(userId);
```

#### Transaction History
```typescript
// Get user transaction history
const transactions = await subscribeToCreditTransactions(
  userId, 
  (transactions) => {
    // Handle real-time transaction updates
  }
);
```

### 🚀 Payment Integration

#### Payment Flow
1. User selects a credit package
2. Redirected to Payment Form
3. Payment processed securely
4. Webhook updates user credits automatically
5. User redirected back with payment status

#### Available Credit Packages

| Package | Tournament Credits | Host Credits | Price |
|---------|-------------------|--------------|-------|
| Starter Pack | 50 | 25 | ₹50 |
| Popular Pack | 150 | 75 | ₹150 |
| Pro Pack | 300 | 150 | ₹300 |
| Elite Pack | 500 | 250 | ₹500 |
| Champion Pack | 900 | 450 | ₹900 |

## Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Testing

#### Payment Testing
```bash
# Test payment integration
npm run dev
```

#### Local Development
- The app includes mock payment flows for development
- Use test payment forms for staging
- Real payments only in production mode

### Database Structure

#### Users Collection
```typescript
{
  uid: string,
  email: string,
  displayName: string,
  wallet: {
    tournamentCredits: number,
    hostCredits: number,
    earnings: number,
    totalPurchasedTournamentCredits: number,
    totalPurchasedHostCredits: number,
    firstPurchaseCompleted: boolean
  }
}
```

#### Tournaments Collection
```typescript
{
  id: string,
  name: string,
  description: string,
  hostId: string,
  mode: "Solo" | "Duo" | "Squad",
  max_players: number,
  entry_fee: number,
  status: "upcoming" | "active" | "completed",
  prizePool?: {
    totalPrizeCredits: number,
    isDistributed: boolean,
    winners?: {
      first?: { uid: string, username: string, prizeCredits: number },
      second?: { uid: string, username: string, prizeCredits: number },
      third?: { uid: string, username: string, prizeCredits: number }
    }
  }
}
```

#### Credit Transactions Collection
```typescript
{
  userId: string,
  type: 'tournament_credit_purchase' | 'host_credit_purchase' | 'tournament_join' | 'tournament_win',
  amount: number,
  balanceBefore: number,
  balanceAfter: number,
  walletType: 'tournamentCredits' | 'hostCredits' | 'earnings',
  description: string,
  transactionDetails: object,
  createdAt: Timestamp
}
```

## Deployment

### Vercel Deployment

1. **Fork and Clone Repository**
2. **Install Dependencies**
    ```
    npm install
    ```
3. **Set Environment Variables**
    - Create a `.env` file in the root directory.
    - Add all the required environment variables from `.env.example`.
    - Set all environment variables in the Vercel project dashboard.
4. **Deploy to Vercel**
    - Connect your repository to Vercel.
    - Configure the build settings (usually auto-detected for Vite).
    - Deploy!
5. **Configure Webhooks**
    - In your CashFree dashboard, go to Webhooks.
    - Configure payment webhook URL: `https://your-app.vercel.app/api/payment-webhook`

### Local Development

- The app includes mock payment flows for development
- Use test payment forms for staging
- Real payments only in production mode

### Troubleshooting

- If you encounter issues, check the following:
  - Browser's developer console for any frontend errors.
  - Vercel function logs for any backend errors.
  - Ensure all environment variables are correctly set in your Vercel project.
- For payment-related issues:
  - Verify that the CashFree API keys are correct.
  - Check the format of the data being sent to the CashFree API.
- For Firebase issues:
  - Ensure your Firebase service account key is correctly configured.
- Check Vercel function logs

## Security Considerations

### Authentication
- Firebase Authentication with email/password
- Protected routes with authentication checks
- User session management

### Payment Security
- Webhook signature verification
- Encrypted payment processing
- Transaction logging and monitoring

### Database Security
- Firestore security rules for user data protection
- Server-side validation for all transactions
- Real-time security monitoring

## API Reference

### Services

#### PaymentService
```typescript
class PaymentService {
  static getInstance(): PaymentService
  redirectToPaymentForm(params: PaymentParams): void
  verifyPayment(paymentId: string): Promise<PaymentStatus>
}
```

#### CreditService
```typescript
class CreditService {
  static convertCreditsToEarnings(userId: string, amount: number): Promise<boolean>
  static getCreditBalance(userId: string): Promise<CreditBalance>
  static initializeUserWallet(userId: string): Promise<void>
}
```

#### TournamentService
```typescript
class TournamentService {
  static createTournament(data: TournamentData): Promise<string>
  static joinTournament(tournamentId: string, userId: string): Promise<boolean>
  static completeTournament(tournamentId: string, results: TournamentResults): Promise<boolean>
}
```

### Hooks

#### useCreditBalance
```typescript
const { 
  tournamentCredits, 
  hostCredits, 
  earnings, 
  isLoading 
} = useCreditBalance(userId);
```

#### useAuthCheck
```typescript
const { isLoading, user } = useAuthCheck({ requireAuth: true });
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use ESLint and Prettier for code formatting
- Write meaningful commit messages
- Add proper error handling
- Include proper TypeScript types

## Troubleshooting

### Common Issues

1. **Payment Webhook Not Working**
   - Check webhook URL configuration in payment provider dashboard
   - Verify webhook secret environment variable
   - Check Vercel function logs

2. **Credits Not Updated After Payment**
   - Verify webhook is receiving payment notifications
   - Check Firestore database permissions
   - Review transaction logs in the database

3. **Tournament Creation Failing**
   - Ensure user has sufficient host credits
   - Check Firestore security rules
   - Verify all required fields are provided

## Support

- **Documentation**: Check the code comments and type definitions
- **Issues**: Open an issue on the repository
- **Discussions**: Use GitHub Discussions for questions

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Firebase](https://firebase.google.com/) for backend services
- [Radix UI](https://www.radix-ui.com/) for accessible components
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [FreeFire](https://ff.garena.com/) gaming community 