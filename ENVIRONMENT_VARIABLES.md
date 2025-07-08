# Environment Variables Setup Guide

## 🚀 **URGENT: Set these in Vercel Dashboard**

### 1. Application URLs
```bash
VITE_APP_URL=https://freefiretournaments.vercel.app
APP_URL=https://freefiretournaments.vercel.app
```

### 2. Cashfree Configuration
```bash
VITE_CASHFREE_APP_ID=your_cashfree_app_id
CASHFREE_APP_ID=your_cashfree_app_id
CASHFREE_SECRET_KEY=your_cashfree_secret_key
CASHFREE_ENVIRONMENT=SANDBOX
CASHFREE_WEBHOOK_SECRET=your_cashfree_webhook_secret
```

### 3. Firebase Configuration
```bash
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"your_project_id",...}
```

## 📋 **Steps to Fix:**

### Step 1: Set Environment Variables in Vercel
1. Go to https://vercel.com/dashboard
2. Select your project: `freefiretournaments`
3. Go to Settings → Environment Variables
4. Add all the variables above with your actual values

### Step 2: Update Cashfree Webhook URL
1. Go to Cashfree Dashboard
2. Update webhook URL to: `https://freefiretournaments.vercel.app/api/payment-webhook`
3. Make sure it matches exactly

### Step 3: Redeploy
1. After setting environment variables, redeploy your project
2. Or make a dummy commit to trigger auto-deployment

## 🔧 **Test the Fix:**

1. Try making a test payment
2. Check the console logs for the webhook URL
3. Verify that credits are added after successful payment

## 📊 **Debugging Commands:**

If you want to manually add credits for successful payments:

```bash
# Check payment status
curl -X POST https://freefiretournaments.vercel.app/api/verify-payment \
  -H "Content-Type: application/json" \
  -d '{"orderId": "YOUR_ORDER_ID"}'
```

## 🎯 **Key Points:**

- The webhook URL MUST match what's configured in Cashfree
- Environment variables are critical for production
- Test payments should now work correctly
- Manual credit verification is available as fallback
