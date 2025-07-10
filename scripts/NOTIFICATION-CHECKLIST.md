# Tournament Notification System Checklist

## Notification System Architecture

```
┌────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                │     │                 │     │                 │
│  cron-job.org  │────▶│  Vercel API     │────▶│   Notification  │
│  (every 2min)  │     │  Endpoint       │     │   Email         │
│                │     │                 │     │                 │
└────────────────┘     └─────────────────┘     └─────────────────┘
```

## Checklist for Fully Automated Notifications

### 1. Vercel Environment Variables

✅ Ensure these environment variables are set in Vercel:
- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APP_ID`
- `EMAIL_USER` (freefiretournaments03@gmail.com)
- `EMAIL_PASSWORD` (the app password for Gmail)

### 2. External Cron Job (cron-job.org)

✅ Verify your cron-job.org setup:
- URL: `https://freefiretournaments.vercel.app/api/tournament-notifications`
- Schedule: Every 2 minutes
- Request type: GET
- Monitoring: Enable monitoring to be notified of failures

### 3. Firestore Database

✅ Make sure you have the required Firestore index:
- Collection: `tournaments`
- Fields: `status` (Ascending) and `start_date` (Ascending)

### 4. Tournament Requirements

✅ Tournaments must have:
- `status` field set to `active`
- `start_date` field with a valid timestamp
- `host_id` field with a valid user ID
- The host user must have an `email` field
- `notificationSent` should be `false` or undefined

### 5. Notification Window

✅ Notifications are sent when:
- Tournament is 19-21 minutes away from start time
- Tournament has not been notified before (`notificationSent` is not true)

## Testing the System

### Create Test Tournament

Run this command to create a test tournament that will enter the notification window soon:
```bash
node scripts/create-automation-test-tournament.js
```

### Verify API Endpoint

Test that the API endpoint is working:
```bash
node scripts/verify-cron-job-setup.js
```

### Check Specific Tournament

To check a specific tournament's notification status:
```bash
node scripts/check-tournament-notification-status.js YOUR_TOURNAMENT_ID
```

### Comprehensive Troubleshooting

Run this script to check all aspects of the notification system:
```bash
node scripts/troubleshoot-notification-system.js
```

## Common Issues and Solutions

1. **No notifications are being sent**
   - Verify cron-job.org is hitting your API endpoint every 2 minutes
   - Check that Vercel environment variables are set correctly
   - Ensure tournaments meet all the requirements (active, proper start_time, etc.)
   - Confirm the Firestore index is created and active

2. **Vercel cron job is not enough**
   - Vercel free tier only allows crons to run twice per day
   - You must use cron-job.org for the 2-minute interval checks

3. **Wrong timezone calculations**
   - All timestamp calculations use IST (Asia/Kolkata) timezone
   - Make sure tournament start times are correct for your timezone

4. **Email sending issues**
   - Verify Gmail app password is correct
   - Check for Gmail sending limits or restrictions

## Last Resort: Manual Notification

If automated notifications are not working, you can force-send a notification:
```bash
node scripts/force-send-notification.js YOUR_TOURNAMENT_ID
```
