# Tournament Auto-Deletion Implementation

## Overview
This implementation adds automatic tournament deletion functionality that removes tournaments 1 hour after their scheduled time. The system works both in the UI and database using Firebase Firestore.

## Features Implemented

### 1. TTL (Time To Live) Field
- Added `ttl` field to Tournament interface
- Tournaments are automatically assigned a deletion time of 1 hour after their scheduled start
- TTL is calculated and stored as a Firestore Timestamp during tournament creation

### 2. UI Components

#### TournamentCountdown Component
- Shows real-time countdown to tournament auto-deletion
- **Only starts counting down AFTER the tournament's scheduled start time**
- Shows "Tournament not started" message before the scheduled start time
- Updates every second once the tournament has started
- Displays warnings when tournaments are about to expire (less than 30 minutes remaining)
- Shows "Expired" status for tournaments past their TTL

#### Tournament Display Updates
- Tournament cards now show auto-deletion countdown (only after start time)
- Tournament details header displays deletion warning (only after start time)
- HostedTournaments page includes manual cleanup button

### 3. Backend Services

#### TournamentCleanupService
- Client-side cleanup service that can delete expired tournaments
- Batch deletion for better performance
- **Only deletes tournaments that have passed their TTL AND have started**
- Automatic initialization with periodic cleanup (every 5 minutes)
- Manual cleanup functionality for testing

#### Firebase Functions (Ready for Deployment)
- Scheduled function to automatically delete expired tournaments
- Runs every 5 minutes to check for expired tournaments
- Manual trigger endpoint for testing
- Health check endpoint

### 4. Database Configuration

#### Firestore Security Rules
- Updated to allow system deletion of expired tournaments
- Added rule: `resource.data.ttl != null && resource.data.ttl <= request.time`
- Maintains security for regular users

#### Firestore Indexes
- Single field index for TTL field (automatically created by Firestore)
- Enables efficient querying of expired tournaments

### 5. Custom Hooks

#### useTournamentTime
- React hook for managing tournament countdown logic
- Provides time remaining, expiration status, and warnings
- Automatically updates every second

#### useTournamentCleanup
- Hook for managing cleanup operations
- Provides loading states and results
- Easy integration with UI components

#### useAutomaticCleanup
- Hook for initializing automatic cleanup on app start

## Implementation Files

### Core Services
- `src/lib/tournamentService.ts` - Updated with TTL field
- `src/lib/tournamentCleanupService.ts` - Client-side cleanup service
- `src/lib/tournamentTimeUtils.ts` - Utility functions for time calculations
- `functions/index.js` - Firebase Functions for server-side cleanup

### UI Components
- `src/components/TournamentCountdown.tsx` - Countdown display component
- `src/components/TournamentCard.tsx` - Updated to show countdown
- `src/components/tournament-details/TournamentHeader.tsx` - Updated with countdown
- `src/pages/HostedTournaments.tsx` - Added manual cleanup button

### Hooks and Types
- `src/hooks/useTournamentTime.ts` - Custom hooks for tournament time management
- `src/components/home/types.ts` - Updated TournamentType interface

### Configuration
- `firestore.rules` - Updated security rules
- `firestore.indexes.json` - Updated indexes
- `firebase.json` - Firebase configuration

## How It Works

### Tournament Creation
1. When a tournament is created, the system calculates TTL = start_date + 1 hour
2. TTL is stored as a Firestore Timestamp in the tournament document
3. Tournament is created with auto-deletion time set

### UI Display
1. Tournament cards and details show real-time countdown
2. Countdown updates every second using JavaScript timers
3. Warnings appear when tournaments are close to expiration
4. "Expired" status shown for past-due tournaments

### Automatic Cleanup
1. Client-side service runs every 5 minutes to check for expired tournaments
2. Expired tournaments are deleted in batches using Firestore batch operations
3. Manual cleanup button available for immediate testing
4. Firebase Functions provide server-side backup (requires Blaze plan)

### Security
1. Firestore rules allow deletion only for:
   - Tournament hosts
   - System administrators
   - Expired tournaments (TTL <= current time)
2. Client-side validation ensures only authorized deletions

## Testing the Implementation

### Manual Testing
1. Create a tournament with a start time soon (within 2 hours)
2. Watch the countdown timer in the UI
3. Use the "Clean Expired" button in Hosted Tournaments page
4. Verify expired tournaments are automatically removed

### Automatic Testing
1. The cleanup service initializes automatically on app start
2. Runs periodic checks every 5 minutes
3. Console logs provide visibility into cleanup operations

## Future Enhancements

### Server-Side Functions (Requires Blaze Plan)
- Deploy Firebase Functions for more reliable server-side cleanup
- Functions run independently of client application
- Better for high-traffic applications

### Advanced Features
- Configurable deletion time (not fixed at 1 hour)
- Email notifications before tournament deletion
- Backup/archive system for deleted tournaments
- Analytics on tournament lifecycle

## Environment Requirements

### Development
- Firebase project with Firestore enabled
- No special billing plan required for basic functionality

### Production (Optional)
- Firebase Blaze plan for server-side Functions
- Cloud Functions and Cloud Build APIs enabled

## Deployment Steps

1. Deploy Firestore rules: `firebase deploy --only firestore:rules`
2. Deploy indexes: `firebase deploy --only firestore:indexes`
3. Deploy functions (if Blaze plan): `firebase deploy --only functions`
4. Test with manual cleanup button
5. Monitor console logs for automatic cleanup activity
