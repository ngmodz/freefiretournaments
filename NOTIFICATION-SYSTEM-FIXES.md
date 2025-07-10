# Tournament Email Notifications - Issue Analysis & Fixes

## Issues Found and Fixed:

### 1. ❌ **Firestore Index Missing** (CRITICAL)
**Problem:** The notification system fails because the required Firestore composite index is missing.

**Solution:** Create the Firestore index:
1. Go to: https://console.firebase.google.com/project/freefire-tournaments-ba2a6/firestore/indexes
2. Click "Add Index"
3. Collection ID: `tournaments`
4. Add fields:
   - `status` (Ascending)
   - `start_date` (Ascending)
5. Click "Create" and wait 5-10 minutes for it to build

**Direct Link:** https://console.firebase.google.com/v1/r/project/freefire-tournaments-ba2a6/firestore/indexes?create_composite=Cl5wcm9qZWN0cy9mcmVlZmlyZS10b3VybmFtZW50cy1iYTJhNi9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvdG91cm5hbWVudHMvaW5kZXhlcy9fEAEaCgoGc3RhdHVzEAEaDgoKc3RhcnRfZGF0ZRABGgwKCF9fbmFtZV9fEAE

### 2. ✅ **Cron Schedule** (KEPT AS IS)
**Note:** Vercel free plan only allows 2 cron jobs per day, so keeping it at midnight for cleanup tasks.
**External cron-job.org** should be used for the 2-minute frequency notifications.

**Vercel cron:** `"schedule": "0 0 * * *"` (daily cleanup)
**External cron:** Every 2 minutes → Your deployed API endpoint

### 3. ❌ **Wrong Environment Variables** (FIXED)
**Problem:** API files were looking for `FIREBASE_API_KEY` but `.env` has `VITE_FIREBASE_API_KEY`.

**Files Fixed:**
- `api/tournament-notifications.js`
- `api/check-tournament.js`

### 4. ❌ **Missing API Routes in Dev Server** (FIXED)
**Problem:** Tournament notification endpoints weren't available in local development.

**Files Fixed:**
- `dev-server.js` - Added tournament-notifications and check-tournament endpoints

## Current Status:

✅ **Email System:** Working correctly (tested with test-notification.js)
✅ **API Endpoints:** Now available in development server
✅ **Cron Schedule:** Vercel for daily cleanup, external cron for notifications
✅ **Environment Variables:** Fixed Firebase config mapping
❌ **Firestore Index:** Needs to be created manually (see instructions above)

## Cron Job Setup Strategy:

### For Production (Recommended):
1. **External Cron Service** (cron-job.org): Every 2 minutes
   - URL: `https://your-app.vercel.app/api/tournament-notifications`
   - Frequency: Every 2 minutes
   - Purpose: Check and send tournament notifications

2. **Vercel Cron** (Free plan limitation): Once daily
   - Purpose: Cleanup expired tournaments and maintenance tasks
   - Frequency: Once daily at midnight

### For Development/Testing:
```bash
# Test locally every 2 minutes (for testing)
node scripts/send-tournament-notifications.js
```

## External Cron-Job.org Configuration:

1. **URL to call:** `https://your-deployed-app.vercel.app/api/tournament-notifications`
2. **Method:** GET
3. **Frequency:** Every 2 minutes (`*/2 * * * *`)
4. **Expected Response:** `{"success":true,"notifications":X,"errors":[],"checked":Y}`

## How the System Works:

1. **External Cron:** Calls your API every 2 minutes
2. **API Endpoint:** `/api/tournament-notifications` processes the request
3. **Tournament Check:** Queries Firestore for tournaments where:
   - `status = 'active'`
   - `start_date` is 19-21 minutes from now (20 minutes ± 1 minute buffer)
   - `notificationSent != true`
4. **Email Process:**
   - Fetches host email from users collection
   - Sends formatted HTML email notification
   - Updates tournament document with `notificationSent: true`

## Testing the System:

### 1. Test Email Function:
```bash
node scripts/test-notification.js freefiretournaments03@gmail.com
```

### 2. Test API Endpoint Locally:
```bash
# Start API server
npm run dev:api

# Test endpoint
curl http://localhost:3001/api/tournament-notifications
```

### 3. Test with Real Tournament:
Create a tournament with `start_date` set to 20 minutes from now and ensure it has `status: 'active'`.

## Next Steps:

1. **URGENT:** Create the Firestore index using the link above
2. Wait 5-10 minutes for the index to build
3. Deploy your latest changes to Vercel
4. Update cron-job.org to point to your deployed API endpoint
5. Test the system with a real tournament
6. Monitor the external cron job logs

## Cron-Job.org Setup Checklist:

- [ ] URL: `https://your-app.vercel.app/api/tournament-notifications`
- [ ] Method: GET
- [ ] Frequency: `*/2 * * * *` (every 2 minutes)
- [ ] Timeout: 30 seconds
- [ ] Enabled: Yes
- [ ] Monitor response codes (should be 200)

## Troubleshooting:

- **"Missing Firestore index" error:** Complete step 1 above
- **No tournaments found:** Check if tournaments have correct `status` and `start_date`
- **Email not sending:** Verify EMAIL_USER and EMAIL_PASSWORD in `.env`
- **External cron failing:** Check if the deployed URL is accessible and returns proper response
- **Vercel function timeout:** External cron is hitting a cold function, which is normal

## Files Modified:
- `vercel.json` - Kept daily schedule for Vercel free plan limits
- `api/tournament-notifications.js` - Fixed Firebase environment variables
- `api/check-tournament.js` - Fixed Firebase environment variables  
- `dev-server.js` - Added missing API routes
- `scripts/setup-firestore-index.js` - Created index setup helper
