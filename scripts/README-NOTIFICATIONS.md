# Tournament Email Notifications

This notification system sends email reminders to tournament hosts 20 minutes before their tournaments are scheduled to start.

## Local Setup (No Firebase Functions/Blaze Plan Required)

### Prerequisites
1. Node.js installed on your computer or server
2. Gmail account for sending emails
3. Google App Password (not your regular password)

### Email Configuration

Create a `.env` file in the root directory of the project with the following content:
```
EMAIL_USER=freefiretournaments03@gmail.com
EMAIL_PASSWORD=your-app-password
```

Replace `your-app-password` with your Gmail App Password. If you haven't created one:
1. Enable 2-step verification on your Google account
2. Go to https://myaccount.google.com/apppasswords
3. Create a new app password for "Tournament Notifications"

### Installation

Run the following command to install required dependencies:
```bash
npm install nodemailer dotenv
```

### Required Firestore Index

For the notification system to query tournaments by status and start time, you need to create a Firestore composite index:

1. Go to Firebase Console: https://console.firebase.google.com/project/freefire-tournaments-ba2a6/firestore/indexes
2. Click "Add Index"
3. Set Collection ID to "tournaments"
4. Add field paths: 
   - "status" (Ascending)
   - "start_date" (Ascending)
5. Click "Create"

The first time you run the script, it will provide a direct link to create the index if it's missing.

### Testing the Email Functionality

To test if the email setup works correctly:
```bash
node scripts/test-notification.js your-email@example.com
```

Replace `your-email@example.com` with your email address to receive a test notification.

### Running the Notification System Manually

To run the notification system once manually:
```bash
node scripts/send-tournament-notifications.js
```

This will check for tournaments scheduled to start in approximately 20 minutes and send notifications to hosts.

### Scheduling the Notifications

#### Windows

1. Run PowerShell as Administrator
2. Navigate to your project directory
3. Execute:
```
.\setup-scheduled-task.ps1
```
4. Follow the prompts to set up the scheduled task

You can also run the `run-notifications.bat` file manually or set up a Windows scheduled task to execute it every 5 minutes.

#### Linux/Mac

Add a cron job to run the script every 5 minutes:
```bash
crontab -e
```

Then add the line:
```
*/5 * * * * cd /path/to/your/project && node scripts/send-tournament-notifications.js >> logs/notifications.log 2>&1
```

Replace `/path/to/your/project` with the actual path to your project directory.

### How It Works

1. The script runs every 5 minutes
2. It checks the Firestore database for tournaments starting in approximately 20 minutes
3. For each qualifying tournament:
   - Fetches the host's email address
   - Sends a formatted email notification
   - Updates the tournament document to mark notification as sent (prevents duplicate notifications)

### Troubleshooting

If emails are not being sent:
1. Check that your app password is correct
2. Ensure the Gmail account allows "less secure apps" if using an older email client
3. Review any error logs from the script execution
4. Verify that your tournament data has valid `start_date` and `status` fields
5. Ensure the required Firestore index has been created and is active

### File Descriptions

- `send-tournament-notifications.js`: Main script that checks for and sends notifications
- `test-notification.js`: Script to test email functionality
- `run-notifications.bat`: Batch file for Windows scheduled tasks
- `setup-scheduled-task.ps1`: PowerShell script to set up Windows scheduling 