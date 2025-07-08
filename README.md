# FreeFire Tournaments Platform

A gaming tournament platform for FreeFire with integrated credit system and payment processing.

## Features

- 🎮 Create and join FreeFire tournaments
- 💳 Credit system for tournament entry and hosting
- 💰 Payment integration with UPI withdrawals
- 📱 PWA with responsive design
- 🔄 Real-time updates and notifications

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