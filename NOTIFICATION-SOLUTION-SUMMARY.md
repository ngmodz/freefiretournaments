# Tournament Notification System: Issue & Solution

## The Issue

The tournament notification system was not sending emails to tournament hosts 20 minutes before their tournaments were scheduled to start. After investigating, we found two key issues:

1. **Vercel Cron Job Configuration**: The cron job in `vercel.json` was set to run only once per day at midnight UTC (`0 0 * * *`), which meant it would only catch tournaments that happened to be starting 20 minutes after midnight.

2. **Firebase Plan Limitation**: The Firebase Cloud Function that was supposed to handle notifications every 5 minutes couldn't be deployed because the project is on the free Spark plan, which doesn't support Cloud Functions.

## The Solution

We implemented a solution that works with the free plans of both Vercel and Firebase:

1. **Enhanced API Endpoint**: Modified `api/check-tournament.js` to include a new function `checkAllTournaments()` that can check all active tournaments and send notifications for those starting in 19-21 minutes.

2. **External Cron Service**: Instead of relying on Vercel's limited cron jobs or Firebase Cloud Functions, we're using cron-job.org (a free external service) to call our endpoint every 5 minutes.

3. **Testing Tools**: Created scripts to test the notification system:
   - `test-notification-endpoint.js`: Tests if the endpoint is working correctly
   - `scripts/create-test-notification-tournament.js`: Creates a test tournament scheduled to start in exactly 20 minutes

## Implementation Details

1. **Notification Window**: Notifications are sent to tournament hosts when their tournament is 19-21 minutes away from starting.

2. **Duplicate Protection**: The system tracks which tournaments have already received notifications using the `notificationSent` and `notificationSentAt` fields.

3. **Logging**: Extensive logging has been added to help troubleshoot any issues.

## Next Steps

1. **Deploy to Vercel**: Deploy the updated code to your Vercel project.

2. **Set Up cron-job.org**: Follow the instructions in `NOTIFICATION-SETUP-INSTRUCTIONS.md` to set up the external cron job.

3. **Test the System**: Use the provided testing scripts to verify that notifications are being sent correctly.

4. **Monitor**: Regularly check the logs in your Vercel dashboard and cron-job.org to ensure everything is working as expected.

## Future Improvements

If you decide to upgrade to paid plans in the future:

1. **Firebase Blaze Plan**: Would allow you to use the Cloud Functions approach, which is more reliable and secure.

2. **Vercel Pro Plan**: Would give you more frequent cron job executions without needing an external service.

3. **Consolidated System**: Consider consolidating the notification logic into a single implementation to avoid confusion. 