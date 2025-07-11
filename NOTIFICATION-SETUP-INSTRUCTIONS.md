# Tournament Notification Setup Instructions

This document provides instructions for setting up automatic tournament notifications using cron-job.org.

## Overview

The system is designed to send email notifications to tournament hosts 20 minutes before their tournament starts. To achieve this without using Firebase Cloud Functions (which require a paid plan), we'll use a free external service called cron-job.org to periodically call our notification endpoint.

## Step 1: Deploy Your Vercel Project

Make sure your Vercel project is deployed with the latest changes to the `api/check-tournament.js` file.

## Step 2: Test the Endpoint

Before setting up the cron job, test that your endpoint works correctly:

1. Update the `VERCEL_URL` in the `test-notification-endpoint.js` script with your actual Vercel deployment URL.
2. Run the script:
   ```
   node test-notification-endpoint.js
   ```
3. Verify that the endpoint returns a successful response.

## Step 3: Create an Account on cron-job.org

1. Go to [cron-job.org](https://cron-job.org/)
2. Sign up for a free account
3. Verify your email address

## Step 4: Create a New Cron Job

1. Log in to your cron-job.org account
2. Click on "CREATE CRONJOB" button
3. Fill in the following details:
   - **Title**: Tournament Notifications
   - **URL**: `https://your-vercel-app.vercel.app/api/check-tournament?all=true`
   - **Authentication**: None (or Basic Auth if you've set up API key protection)
   - **Schedule**: Custom schedule
     - Set it to run every 5 minutes
     - Select "Every 5 minutes" in the minutes dropdown
     - Leave the other fields as "Every"
   - **Notifications**: Enable email notifications for failures (recommended)

4. Click "CREATE" to save your cron job

## Step 5: Monitor the Cron Job

1. After creating the cron job, you can monitor its execution history
2. Check the "Last Run" status to ensure it's running successfully
3. If there are any failures, you'll receive email notifications (if enabled)

## Troubleshooting

If notifications are not being sent:

1. **Check Logs**: Look at the Vercel logs for your function to see if there are any errors
2. **Email Configuration**: Verify that your email credentials are correctly set in your environment variables
3. **Cron Job Execution**: Check if the cron job is executing successfully on cron-job.org
4. **Firestore Access**: Ensure your Firestore security rules allow reading tournaments and users collections
5. **Manual Testing**: Try manually calling the endpoint with `?all=true` to see if it works

## Additional Notes

- The notification window is set to 19-21 minutes before tournament start time
- Notifications are only sent once per tournament (tracked by the `notificationSent` field)
- If you need to re-send a notification, you can manually reset the `notificationSent` field in Firestore 