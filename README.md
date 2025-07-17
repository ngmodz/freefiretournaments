# FreeFire Tournaments Platform

A gaming tournament platform for FreeFire with integrated credit system and payment processing.

## Features

- **Tournament Management**: Create, browse, and join tournaments with customizable rules, schedules, and prize distributions.
- **User Authentication**: Secure user registration and login system powered by Firebase Authentication.
- **User Profiles**: Personalized user profiles displaying tournament history, achievements, and statistics.
- **Virtual Wallet & Credits**: Integrated wallet system with a virtual currency for entry fees, prize payouts, and in-app transactions.
- **Payment Gateway**: Seamlessly purchase credits through the integrated Cashfree payment gateway.
- **Real-time Updates**: Live updates on tournament status, participant count, and prize pools using Firebase Realtime Database.
- **Host Application System**: A dedicated application process for users who want to become tournament hosts.
- **Admin Panel**: A comprehensive admin dashboard to manage users, tournaments, withdrawal requests, and host applications.
- **Automated Notifications**: Automatic email reminders for upcoming tournaments and other important events.
- **Progressive Web App (PWA)**: Installable as a PWA for a native app-like experience on mobile devices.
- **Responsive Design**: A mobile-first, fully responsive UI built with Tailwind CSS and Radix UI.
- **Security**: Follows security best practices, including the secure management of API keys and user data.

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