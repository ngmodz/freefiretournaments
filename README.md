# FreeFire Tournaments Platform

A gaming tournament platform for FreeFire with integrated credit system and payment processing.

## Features

- **User Authentication**: Secure login and registration system using Firebase Authentication
- **Tournament Management**: Create, browse, join, and manage tournaments
- **Virtual Currency**: In-app credits for tournament entry and prizes
- **Real-time Updates**: Live tournament data with Firebase Realtime Database
- **Responsive Design**: Mobile-first interface with Tailwind CSS
- **Tournament Notifications**: Automated email reminders sent to hosts 20 minutes before tournament start

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Firebase (Auth, Firestore), Vercel Functions
- **Payments**: CashFree integration
- **UI**: Radix UI, Framer Motion



## Project Structure

```
src/
├── components/     # UI components
├── contexts/       # React contexts
├── hooks/          # Custom hooks
├── lib/            # Services & utilities
├── pages/          # Page components
└── utils/          # Helper functions

api/                # Vercel serverless functions
```

## Core Services

- **TournamentService**: Tournament creation and management
- **CreditService**: Credit balance and conversion
- **PaymentService**: Payment processing
- **WalletService**: Wallet operations

## Firebase Cloud Functions

The project uses Firebase Cloud Functions for background processing and automation:

1. **Email Notifications**: Sends reminders to tournament hosts 20 minutes before their tournament starts
2. **Tournament Cleanup**: Automatically removes expired tournaments 
3. **Payment Processing**: Handles payment webhooks from Cashfree payment gateway

See the `functions/README.md` file for detailed instructions on setting up email notifications.

## Scripts

```bash
npm run dev      # Development server
npm run build    # Production build
npm run preview  # Preview build
npm run lint     # Lint code
```

## Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Open Pull Request 