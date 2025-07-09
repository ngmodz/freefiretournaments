# Tournament Email Notifications

This Cloud Function sends email notifications to tournament hosts 20 minutes before their tournaments are scheduled to start.

## Setup

### Environment Variables

You need to set up the following environment variables for email functionality to work:

1. `EMAIL_USER`: The email address to send notifications from (e.g., your-email@gmail.com)
2. `EMAIL_PASSWORD`: The password for the email account

For Gmail, you need to use an App Password, not your regular password:

1. Enable 2-step verification on your Google account
2. Go to https://myaccount.google.com/apppasswords
3. Create a new app password for "Firebase Functions"
4. Use that password as the `EMAIL_PASSWORD` value

### Setting Environment Variables

To set these environment variables in Firebase Functions:

```bash
firebase functions:config:set email.user="your-email@gmail.com" email.password="your-app-password"
```

Then deploy your functions:

```bash
firebase deploy --only functions
```

### Testing Email Functionality

You can test the email notification functionality by calling the `testTournamentNotification` endpoint:

```
https://[your-project-id].web.app/testTournamentNotification?email=recipient@example.com
```

Optionally, you can include a tournament ID to use real tournament data:

```
https://[your-project-id].web.app/testTournamentNotification?email=recipient@example.com&tournamentId=abc123
```

## Functions

### `sendUpcomingTournamentNotifications`

Runs every 5 minutes to check for tournaments scheduled to start in approximately 20 minutes. Sends email notifications to tournament hosts.

### `testTournamentNotification`

HTTP endpoint for testing the email notification functionality.

### `deleteExpiredTournaments`

Runs every 5 minutes to clean up expired tournaments.

### `triggerTournamentCleanup`

HTTP endpoint to manually trigger tournament cleanup.

### `healthCheck`

HTTP endpoint to check if the functions are running. 