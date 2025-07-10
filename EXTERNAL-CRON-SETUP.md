# External Cron Job Setup Guide (cron-job.org)

## Why External Cron is Needed:
- **Vercel Free Plan Limitation:** Only 2 cron executions per day
- **Tournament Notifications:** Need to run every 2 minutes to catch the 20-minute window
- **Solution:** Use external cron service (cron-job.org) for frequent checks

## Cron-Job.org Configuration:

### 1. Basic Settings:
- **Title:** Tournament Notifications
- **URL:** `https://your-app-name.vercel.app/api/tournament-notifications`
- **HTTP Method:** GET
- **Schedule:** `*/2 * * * *` (every 2 minutes)

### 2. Advanced Settings:
- **Timeout:** 30 seconds
- **Request Headers:** 
  ```
  Content-Type: application/json
  ```
- **Expected Response Code:** 200
- **Response Body Contains:** `"success":true`

### 3. Authentication (Optional but Recommended):
Add this to your `.env` for additional security:
```env
API_KEY=your-secret-api-key-here
```

Then update cron-job.org with:
- **Request Headers:**
  ```
  Content-Type: application/json
  X-API-Key: your-secret-api-key-here
  ```

## Getting Your Vercel Deployment URL:

1. Deploy your app to Vercel:
   ```bash
   npm run deploy
   ```

2. Find your deployment URL in Vercel dashboard
3. The API endpoint will be: `https://your-app.vercel.app/api/tournament-notifications`

## Testing the External Cron Setup:

### 1. Test the API endpoint directly:
```bash
curl -X GET "https://your-app.vercel.app/api/tournament-notifications"
```

Expected response:
```json
{
  "success": true,
  "notifications": 0,
  "errors": [],
  "checked": 0,
  "message": "No upcoming tournaments found"
}
```

### 2. Test with cron-job.org:
1. Set up the cron job with a 1-minute interval initially
2. Check the execution logs
3. Verify you get 200 status codes
4. Once confirmed working, change to 2-minute interval

## Monitoring & Troubleshooting:

### Expected Responses:

**No tournaments found:**
```json
{
  "success": true,
  "notifications": 0,
  "errors": [],
  "checked": 0,
  "message": "No upcoming tournaments found"
}
```

**Notifications sent:**
```json
{
  "success": true,
  "notifications": 2,
  "errors": [],
  "checked": 5,
  "message": "Sent 2 notifications out of 5 tournaments checked"
}
```

**Firestore index missing:**
```json
{
  "success": false,
  "notifications": 0,
  "errors": ["Missing Firestore index..."],
  "checked": 0,
  "indexUrl": "https://console.firebase.google.com/..."
}
```

### Common Issues:

1. **500 Error:** 
   - Check Vercel function logs
   - Verify environment variables are set
   - Ensure Firestore index exists

2. **Function Timeout:**
   - Normal for cold starts
   - Increase timeout in cron-job.org to 60 seconds

3. **404 Error:**
   - Verify the API endpoint URL
   - Check if deployment was successful

4. **403/401 Error:**
   - Check API key configuration
   - Verify environment variables

## Vercel Environment Variables Setup:

Make sure these are set in your Vercel project settings:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
EMAIL_USER=freefiretournaments03@gmail.com
EMAIL_PASSWORD=your_app_password
API_KEY=your_secret_key (optional)
```

## Final Checklist:

- [ ] Firestore index created and active
- [ ] Code deployed to Vercel with latest fixes
- [ ] Environment variables set in Vercel
- [ ] API endpoint tested and returning 200
- [ ] Cron-job.org configured with correct URL
- [ ] Cron job enabled and running every 2 minutes
- [ ] Monitor first few executions for success
- [ ] Test with actual tournament data

## Expected Timeline:
1. **Create Firestore index:** 5-10 minutes to build
2. **Deploy to Vercel:** 2-3 minutes
3. **Set up cron-job.org:** 5 minutes
4. **Total setup time:** ~15-20 minutes

Once set up, the system will automatically check every 2 minutes for tournaments starting in 20 minutes and send email notifications to hosts.
