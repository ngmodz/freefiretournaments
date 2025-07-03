# 🚀 Vercel Deployment Guide for CashFree Integration

Your app has been successfully migrated from Netlify to **Vercel**! This guide will help you deploy your CashFree-integrated tournament app to Vercel.

## 📁 What Changed

### ✅ **Migration Complete**
- ✅ Serverless functions are now in the `api/` directory, compatible with Vercel.
- ✅ CashFree service adapted for Vercel endpoints
- ✅ Payment webhook configured for Vercel
- ✅ Package.json scripts updated

### 📂 **New File Structure**
```
api/
├── create-payment-order.js    # Create CashFree payment orders
├── payment-webhook.js         # Handle CashFree webhooks
├── verify-payment.js          # Verify payment status
└── health-check.js            # API health check

vercel.json                    # Vercel configuration
```

## 🚀 **Deployment Steps**

### Step 1: Install Dependencies
```bash
npm install firebase-admin
```

### Step 2: Login to Vercel
```bash
vercel login
```

### Step 3: Configure Your Project
```bash
# Initialize Vercel project
vercel

# Follow the prompts:
# ? Set up and deploy "~/your-project"? [Y/n] y
# ? Which scope do you want to deploy to? [Your Account]
# ? Link to existing project? [y/N] n
# ? What's your project's name? freefire-tournaments
# ? In which directory is your code located? ./
```

### Step 4: Add Environment Variables
Add these in Vercel Dashboard (Settings → Environment Variables):

#### **CashFree Configuration**
```bash
VITE_CASHFREE_APP_ID=TEST_YOUR_CASHFREE_APP_ID_HERE
CASHFREE_SECRET_KEY=cfsk_ma_test_YOUR_SECRET_KEY_HERE
CASHFREE_WEBHOOK_SECRET=cfsk_ma_test_YOUR_WEBHOOK_SECRET_HERE
VITE_CASHFREE_ENVIRONMENT=SANDBOX
VITE_CASHFREE_API_VERSION=2023-08-01
VITE_CASHFREE_SANDBOX_URL=https://sandbox.cashfree.com/pg
VITE_CASHFREE_PRODUCTION_URL=https://api.cashfree.com/pg
```

#### **Firebase Configuration** (Get from Firebase Console)
```bash
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"your-firebase-project-id",...}
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-firebase-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id_here
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id_here
```

#### **Application URLs** (Update after deployment)
```bash
VITE_APP_URL=https://your-app-name.vercel.app
VITE_RETURN_URL=https://your-app-name.vercel.app/payment-status
CASHFREE_WEBHOOK_URL=https://your-app-name.vercel.app/api/payment-webhook
```

### Step 5: Get Firebase Service Account
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `your-firebase-project-id`
3. Go to **Project Settings** → **Service Accounts**
4. Click **"Generate new private key"**
5. Download the JSON file
6. Convert to single line and add to `FIREBASE_SERVICE_ACCOUNT`

### Step 6: Deploy to Vercel
```bash
# Deploy to production
vercel --prod

# Or use the deploy script
npm run deploy
```

### Step 7: Update Your Domain
After deployment, update these in Vercel environment variables:
```bash
VITE_APP_URL=https://your-actual-domain.vercel.app
VITE_RETURN_URL=https://your-actual-domain.vercel.app/payment-status
CASHFREE_WEBHOOK_URL=https://your-actual-domain.vercel.app/api/payment-webhook
```

### Step 8: Configure CashFree Webhook
1. Login to [CashFree Merchant Dashboard](https://merchant.cashfree.com)
2. Go to **Developers** → **Webhooks**
3. Add webhook URL: `https://your-actual-domain.vercel.app/api/payment-webhook`
4. Enable events: `ORDER_PAID`, `PAYMENT_SUCCESS`, `PAYMENT_FAILED`

## 🧪 **Testing**

### Local Development
```bash
# Start Vercel dev server
npm run vercel

# Or use regular dev server
npm run dev
```

### API Endpoints
- Health Check: `https://your-domain.vercel.app/api/health-check`
- Create Order: `https://your-domain.vercel.app/api/create-payment-order`
- Webhook: `https://your-domain.vercel.app/api/payment-webhook`
- Verify Payment: `https://your-domain.vercel.app/api/verify-payment`

### Test Payment Flow
1. Go to Credits page
2. Select a credit package
3. Click Purchase → CashFree popup opens
4. Use test card: `4111 1111 1111 1111`
5. Complete payment → Credits added automatically

## 🔧 **Vercel Configuration**

### vercel.json Features
- **Serverless Functions**: All API routes are serverless
- **Build Optimization**: Optimized build for Vite
- **Environment Variables**: Secure environment handling
- **Routing**: Proper API and static file routing

### Performance Benefits
- ⚡ **Faster Cold Starts**: Vercel's V8 isolates
- 🌍 **Edge Network**: Global CDN distribution
- 📦 **Automatic Optimization**: Built-in performance optimizations
- 🔄 **Instant Rollbacks**: Easy deployment management

## 🎯 **Production Checklist**

- [ ] All environment variables added to Vercel
- [ ] Firebase Service Account configured
- [ ] CashFree webhook URL updated
- [ ] Domain URLs updated in environment
- [ ] Test payment flow working
- [ ] Webhook signature verification working
- [ ] Credits being added successfully

## 🚨 **Troubleshooting**

### Common Issues

**1. API Routes Not Working**
- Check `vercel.json` configuration
- Ensure functions are in `api/` folder
- Verify environment variables in Vercel dashboard

**2. Webhook Not Receiving Data**
- Check webhook URL in CashFree dashboard
- Verify CORS headers in webhook function
- Check Vercel function logs

**3. Firebase Connection Issues**
- Verify `FIREBASE_SERVICE_ACCOUNT` is properly formatted
- Check Firebase project permissions
- Ensure service account has Firestore access

### Debug Logs
- Vercel Function Logs: Vercel Dashboard → Functions → View Logs
- Browser Console: Check for CashFree SDK errors
- CashFree Dashboard: Check webhook delivery status

## 🎉 **Benefits of Vercel Migration**

- ⚡ **Faster Performance**: Edge functions and CDN
- 🔧 **Better DevEx**: Excellent developer experience
- 📈 **Auto Scaling**: Serverless auto-scaling
- 💰 **Cost Effective**: Pay per execution
- 🛠️ **Express.js Ready**: Full Node.js support

Your CashFree integration is now **Vercel-ready** and will be much faster! 🚀
