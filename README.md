# FreeFire Tournaments Platform

A gaming tournament platform for FreeFire with integrated credit system and payment processing.

## Features

- **User Authentication**: Secure login and registration system using Firebase Authentication
- **Tournament Management**: Create, browse, join, and manage tournaments
- **Virtual Currency**: In-app credits for tournament entry and prizes
- **Real-time Updates**: Live tournament data with Firebase Realtime Database
- **Responsive Design**: Mobile-first interface with Tailwind CSS
- **Tournament Notifications**: Automated email reminders sent to hosts 20 minutes before tournament start
- **Admin Panel**: Comprehensive withdrawal request management with email notifications
- **Security**: Secure handling of credentials and sensitive information

## Security Notice

This repository follows secure practices for handling sensitive information:
- All service account credentials must be stored in external files referenced by environment variables
- Never commit sensitive information directly to the repository
- See `GIT-HISTORY-REWRITE.md` for important information about the repository's security history

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
- **CreditService**: Credit balance management
- **PaymentService**: Payment processing
- **WalletService**: Wallet operations
- **AdminService**: Admin panel functionality and withdrawal management

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

## Admin Panel

The platform includes a comprehensive admin panel for managing withdrawal requests:

- **Access**: Navigate to `/admin` (admin access required)
- **Features**: Dashboard, withdrawal management, email notifications
- **Setup**: See `ADMIN_PANEL_README.md` for detailed setup instructions

### Quick Setup
```bash
# Set up admin user
node scripts/setup-admin-user.js USER_ID

# List all users
node scripts/setup-admin-user.js --list
```

## Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Open Pull Request