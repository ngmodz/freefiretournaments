// This file contains step-by-step instructions for deploying the notification system to Vercel

/**
 * STEP 1: ENSURE ENVIRONMENT VARIABLES ARE PROPERLY CONFIGURED ON VERCEL
 * 
 * Make sure the following environment variables are set in your Vercel project settings:
 * 
 * - FIREBASE_API_KEY (same as VITE_FIREBASE_API_KEY but without the VITE_ prefix)
 * - FIREBASE_AUTH_DOMAIN (same as VITE_FIREBASE_AUTH_DOMAIN but without the VITE_ prefix)
 * - FIREBASE_PROJECT_ID (same as VITE_FIREBASE_PROJECT_ID but without the VITE_ prefix)
 * - FIREBASE_STORAGE_BUCKET (same as VITE_FIREBASE_STORAGE_BUCKET but without the VITE_ prefix)
 * - FIREBASE_MESSAGING_SENDER_ID (same as VITE_FIREBASE_MESSAGING_SENDER_ID but without the VITE_ prefix)
 * - FIREBASE_APP_ID (same as VITE_FIREBASE_APP_ID but without the VITE_ prefix)
 * - EMAIL_USER (your notification email address: freefiretournaments03@gmail.com)
 * - EMAIL_PASSWORD (your notification email password)
 */

/**
 * STEP 2: UPDATE VERCEL.JSON FOR PROPER CRON CONFIGURATION
 * 
 * Your vercel.json file should contain:
 * 
 * {
 *   "version": 2,
 *   "buildCommand": "npm ci && npm run build",
 *   "installCommand": "npm ci",
 *   "rewrites": [
 *     {
 *       "source": "/api/(.*)",
 *       "destination": "/api/$1"
 *     },
 *     {
 *       "source": "/(.*)",
 *       "destination": "/index.html"
 *     }
 *   ],
 *   "crons": [
 *     {
 *       "path": "/api/tournament-notifications",
 *       "schedule": "0 0,12 * * *"
 *     }
 *   ]
 * }
 * 
 * Note: Vercel's free tier only allows cron jobs to run twice per day,
 * which is why we've set it to run at midnight and noon UTC.
 * 
 * For more frequent checks (every 2 minutes), you must use an external
 * cron service like cron-job.org (which you already have).
 */

/**
 * STEP 3: CONFIGURE CRON-JOB.ORG
 * 
 * Make sure your cron-job.org is properly configured:
 * 
 * 1. URL: https://freefiretournaments.vercel.app/api/tournament-notifications
 * 2. Schedule: Every 2 minutes
 * 3. Request Type: GET
 * 4. Authentication: None (or add your API key if you've configured one)
 */

/**
 * STEP 4: VERIFY TOURNAMENT NOTIFICATION SYSTEM
 * 
 * Test the notification system:
 * 
 * 1. Create a test tournament starting in 25 minutes
 * 2. Wait until the tournament enters the 19-21 minute window before start
 * 3. The cron-job.org will automatically hit your API endpoint every 2 minutes
 * 4. When the tournament enters the window, you should receive an email at microft1007@gmail.com
 * 5. Check your email to confirm the notification was sent
 */

/**
 * TROUBLESHOOTING
 * 
 * If notifications aren't working:
 * 
 * 1. Check Vercel logs to see if the API endpoint is being called
 * 2. Verify environment variables are set correctly in Vercel
 * 3. Test the API endpoint directly: https://freefiretournaments.vercel.app/api/tournament-notifications
 * 4. Check that cron-job.org is properly configured and running
 * 5. Create a test tournament and manually run the fixed-notifications.js script
 */
