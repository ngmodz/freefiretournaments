# Cashfree Payment Gateway Complete Implementation Guide
## Freefire Tournaments Credit-Based Payment System

> **⚠️ IMPORTANT SECURITY NOTE**: This guide contains placeholder values for API keys and secrets. Replace all instances of `your_test_app_id_here`, `your_production_app_id_here`, `your_test_secret_key_here`, `your_production_secret_key_here`, and `your_webhook_secret_key_here` with your actual Cashfree credentials before implementation.

### Table of Contents
1. [Human Developer Setup Guide](#human-developer-setup-guide)
   - [Account Creation and Verification](#1-cashfree-account-creation-and-verification)
   - [API Keys Configuration](#2-api-keys-configuration)
   - [Dashboard Configuration](#3-dashboard-configuration)
   - [Webhook Setup Guide](#4-webhook-setup-guide)
   - [Security Best Practices](#5-security-best-practices)
   - [Testing Environment Setup](#6-testing-environment-setup)
2. [Payment Flow Architecture and Mechanics](#payment-flow-architecture-and-mechanics)
   - [Complete Payment Flow Overview](#1-complete-payment-flow-overview)
   - [Detailed Step-by-Step Payment Process](#2-detailed-step-by-step-payment-process)
   - [Testing Environment Setup and Procedures](#3-testing-environment-setup-and-procedures)
   - [Error Handling and Edge Cases](#4-error-handling-and-edge-cases)
3. [Technical Implementation Guide](#technical-implementation-guide)
   - [System Architecture Overview](#1-system-architecture-overview)
   - [API Endpoints and Versions](#2-api-endpoints-and-versions)
   - [Core Integration Components](#3-core-integration-components)
   - [Database Schema Updates](#4-database-schema-updates)
   - [Credit Package Definitions](#5-credit-package-definitions)
4. [Code Examples and Integration](#code-examples-and-integration)
   - [Cashfree Service Implementation](#1-cashfree-service-implementation)
   - [Enhanced Add Funds Dialog Integration](#2-enhanced-add-funds-dialog-integration)
   - [Payment Component Implementation](#3-payment-component-implementation)
   - [Netlify Functions Implementation](#4-netlify-functions-implementation)
5. [Complete Testing Procedures and Webhook Mechanics](#complete-testing-procedures-and-webhook-mechanics)
   - [Webhook Processing Deep Dive](#webhook-processing-deep-dive)
   - [Comprehensive Testing Checklist](#comprehensive-testing-checklist)
   - [Local Development Testing Setup](#local-development-testing-setup)
   - [Automated Testing Scripts](#automated-testing-scripts)
   - [Manual Testing Procedures](#manual-testing-procedures)
6. [Testing and Deployment](#testing-and-deployment)
   - [Environment Setup](#1-environment-setup)
   - [Testing Strategy](#2-testing-strategy)
   - [Production Deployment Checklist](#4-production-deployment-checklist)
   - [Troubleshooting Guide](#5-troubleshooting-guide)
   - [Security Considerations](#6-security-considerations)
7. [Implementation Timeline](#implementation-timeline)
8. [Support and Maintenance](#support-and-maintenance)

---

## Human Developer Setup Guide

### 1. Cashfree Account Creation and Verification

#### Step 1: Account Registration
1. **Visit**: [https://merchant.cashfree.com/merchants/signup](https://merchant.cashfree.com/merchants/signup)
2. **Required Information**:
   - Business email address
   - Mobile number
   - Business name
   - Business type (Private Limited/Partnership/Proprietorship)
   - Business PAN
   - Business address

#### Step 2: KYC Documentation
**Required Documents**:
- **Business Registration**: Certificate of Incorporation/Partnership Deed/Shop & Establishment License
- **PAN Card**: Business PAN card
- **Bank Account**: Cancelled cheque or bank statement
- **Address Proof**: Utility bill/Rent agreement
- **Director/Partner KYC**: Aadhaar, PAN, and address proof of all directors/partners
- **GST Certificate**: If applicable (recommended for faster approval)

#### Step 3: Account Verification Process
- **Timeline**: 2-5 business days for document verification
- **Status Tracking**: Available in merchant dashboard
- **Approval Notification**: Email and SMS confirmation

### 2. API Keys Configuration

#### Sandbox Environment Setup
1. **Login**: [https://merchant.cashfree.com/merchants/login](https://merchant.cashfree.com/merchants/login)
2. **Navigate**: Developers → API Keys → Test Environment
3. **Generate Keys**:
   - **App ID**: Starts with `TEST` (e.g., `your_test_app_id_here`)
   - **Secret Key**: Used for API authentication and webhook verification

#### Production Environment Setup
1. **Navigate**: Developers → API Keys → Production Environment
2. **Generate Keys**: Available only after account verification
3. **Key Format**:
   - **App ID**: Starts with merchant ID (e.g., `your_production_app_id_here`)
   - **Secret Key**: Production secret for live transactions

### 3. Dashboard Configuration

#### Basic Dashboard Setup
1. **Login**: [https://merchant.cashfree.com/merchants/login](https://merchant.cashfree.com/merchants/login)
2. **Complete Profile**: Ensure all business details are filled
3. **Bank Account**: Add and verify your settlement bank account
4. **Business Documents**: Upload all required KYC documents

#### Payment Methods Configuration
1. **Navigate**: Settings → Payment Methods
2. **Enable Required Methods**:
   - **UPI**: Enable for instant payments (most popular in India)
   - **Credit/Debit Cards**: Enable Visa, Mastercard, RuPay
   - **Net Banking**: Enable major banks (SBI, HDFC, ICICI, etc.)
   - **Wallets**: Enable popular wallets (Paytm, PhonePe, etc.)
3. **Set Minimum/Maximum Limits**: Configure as per your business needs
4. **Transaction Fees**: Review and accept the fee structure

#### Return URL Configuration
1. **Navigate**: Settings → Return URLs
2. **Success URL**: `https://yourdomain.com/payment-status?status=success&order_id={order_id}&order_token={order_token}`
3. **Failure URL**: `https://yourdomain.com/payment-status?status=failed&order_id={order_id}&order_token={order_token}`
4. **Cancel URL**: `https://yourdomain.com/payment-status?status=cancelled&order_id={order_id}`

### 4. Webhook Setup Guide

#### Step 1: Understanding Webhooks
**What are Webhooks?**
- HTTP callbacks sent by Cashfree when payment events occur
- Ensure your application is notified of payment status changes
- Critical for automatic credit allocation in your system

**Why Webhooks are Essential:**
- **Real-time Updates**: Instant notification when payments succeed/fail
- **Reliability**: Backup mechanism if user doesn't return to your site
- **Automation**: Automatic credit allocation without manual intervention
- **Security**: Server-to-server communication with signature verification

#### Step 2: Webhook URL Requirements
**Technical Requirements:**
- **HTTPS Only**: Webhook URL must use HTTPS (not HTTP)
- **Public Access**: URL must be publicly accessible (not localhost)
- **Response Time**: Must respond within 30 seconds
- **Status Code**: Must return HTTP 200 for successful processing

**URL Format Examples:**
```bash
# Production
https://freefiretournaments.netlify.app/.netlify/functions/cashfree-webhook

# Staging
https://staging-freefiretournaments.netlify.app/.netlify/functions/cashfree-webhook

# Development (using ngrok)
https://abc123.ngrok.io/.netlify/functions/cashfree-webhook
```

#### Step 3: Configure Webhooks in Cashfree Dashboard
1. **Navigate**: Developers → Webhooks
2. **Click**: "Add Webhook"
3. **Webhook URL**: Enter your webhook endpoint URL
4. **Select Events** (Choose all relevant events):
   ```
   ✅ PAYMENT_SUCCESS_WEBHOOK
   ✅ PAYMENT_FAILED_WEBHOOK
   ✅ PAYMENT_USER_DROPPED_WEBHOOK
   ✅ PAYMENT_PENDING_WEBHOOK (optional)
   ✅ ORDER_PAID_WEBHOOK (optional)
   ```
5. **API Version**: Select `2025-01-01` (latest)
6. **Retry Policy**:
   - **Retry Attempts**: 3 (recommended)
   - **Retry Intervals**: 2 minutes, 10 minutes, 30 minutes
7. **Test Webhook**: Use the test feature to verify connectivity

#### Step 4: Webhook Security Configuration
**Secret Key Management:**
1. **Generate Secret**: Cashfree provides a webhook secret key
2. **Store Securely**: Add to environment variables
3. **Never Expose**: Keep secret key private (server-side only)

**Environment Variable Setup:**
```bash
# Add to your .env file
CASHFREE_WEBHOOK_SECRET=your_webhook_secret_key_here
```

#### Step 5: Webhook Testing and Validation
**Test Webhook Connectivity:**
1. **Dashboard Test**: Use Cashfree's webhook test feature
2. **Manual Test**: Send test payload using curl/Postman
3. **Live Test**: Complete a small test transaction

**Webhook Test Payload Example:**
```json
{
  "type": "PAYMENT_SUCCESS_WEBHOOK",
  "data": {
    "order": {
      "order_id": "test_order_123",
      "order_amount": 1.00,
      "order_currency": "INR",
      "order_status": "PAID"
    },
    "payment": {
      "payment_id": "test_payment_123",
      "payment_status": "SUCCESS",
      "payment_amount": 1.00,
      "payment_method": "upi"
    }
  }
}
```

#### Step 6: Webhook Monitoring and Logs
**Enable Webhook Logs:**
1. **Dashboard**: Navigate to Developers → Webhook Logs
2. **Monitor**: Check webhook delivery status
3. **Debug**: View failed webhook attempts and reasons
4. **Retry**: Manually retry failed webhooks if needed

**Log Monitoring Checklist:**
- [ ] Webhook delivery success rate > 95%
- [ ] Response time < 10 seconds
- [ ] No signature verification failures
- [ ] All payment events properly processed

#### Step 7: Webhook Failure Handling
**Common Webhook Failures:**
1. **Timeout**: Webhook endpoint takes too long to respond
2. **HTTP Errors**: 4xx/5xx status codes returned
3. **Network Issues**: DNS resolution or connectivity problems
4. **Signature Mismatch**: Invalid webhook signature

**Failure Resolution:**
```javascript
// Implement idempotency to handle duplicate webhooks
const processWebhook = async (payload) => {
  const orderId = payload.data.order.order_id;

  // Check if already processed
  const existingTransaction = await db.collection('creditTransactions')
    .where('transactionDetails.orderId', '==', orderId)
    .get();

  if (!existingTransaction.empty) {
    console.log(`Order ${orderId} already processed`);
    return { success: true, message: 'Already processed' };
  }

  // Process the webhook
  return await processPayment(payload);
};
```

#### Step 8: Production Webhook Checklist
**Before Going Live:**
- [ ] **HTTPS Certificate**: Valid SSL certificate installed
- [ ] **Webhook URL**: Production URL configured in dashboard
- [ ] **Secret Key**: Production webhook secret configured
- [ ] **Event Selection**: All required events enabled
- [ ] **Testing**: End-to-end webhook testing completed
- [ ] **Monitoring**: Webhook monitoring and alerting setup
- [ ] **Error Handling**: Proper error handling and logging implemented
- [ ] **Idempotency**: Duplicate webhook handling implemented

### 5. Security Best Practices

#### Environment Variables Management
```bash
# Sandbox Environment
VITE_CASHFREE_APP_ID=your_test_app_id_here
CASHFREE_APP_ID=your_test_app_id_here
CASHFREE_SECRET_KEY=your_test_secret_key_here

# Production Environment
VITE_CASHFREE_APP_ID=your_production_app_id_here
CASHFREE_APP_ID=your_production_app_id_here
CASHFREE_SECRET_KEY=your_production_secret_key_here

# Common
NEXT_PUBLIC_APP_URL=https://freefiretournaments.netlify.app
```

#### Key Security Measures
- **Never expose secret keys** in frontend code
- **Use HTTPS** for all webhook endpoints
- **Implement signature verification** for all webhooks
- **Store keys securely** in environment variables
- **Rotate keys periodically** (every 6 months)

### 6. Testing Environment Setup

#### Prerequisites and System Requirements
**Development Environment Requirements:**
- **Node.js**: Version 16+ (for Netlify Functions)
- **npm/yarn**: Latest version for package management
- **Git**: For version control
- **Code Editor**: VS Code recommended with extensions:
  - TypeScript and JavaScript Language Features
  - Netlify Functions extension
  - Firebase extension

**Required Accounts and Services:**
- **Cashfree Merchant Account**: Verified business account
- **Firebase Project**: For Firestore database
- **Netlify Account**: For hosting and serverless functions
- **Domain**: For production webhook URLs (can use Netlify subdomain)

#### Sandbox Testing Environment
1. **Base URL**: `https://sandbox.cashfree.com/pg`
2. **Test Cards**: Use provided test card numbers (see testing section)
3. **Test UPI**: `testsuccess@gocash` for success, `testfailure@gocash` for failure
4. **Test Amount**: Any amount (minimum ₹1, maximum ₹100,000)

#### Development Tools Setup
**Essential Tools:**
- **ngrok**: For local webhook testing
  ```bash
  npm install -g ngrok
  # or download from https://ngrok.com/download
  ```
- **Postman**: For API testing
  - Import Cashfree API collection
  - Set up environment variables for testing
- **Firebase CLI**: For local development
  ```bash
  npm install -g firebase-tools
  firebase login
  ```

**Optional but Recommended:**
- **webhook.site**: For webhook payload inspection
- **Netlify CLI**: For local function testing
  ```bash
  npm install -g netlify-cli
  netlify login
  ```

#### Local Development Setup
**Step 1: Clone and Setup Project**
```bash
# Clone your project
git clone https://github.com/yourusername/freefire-tournaments.git
cd freefire-tournaments

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your sandbox credentials
```

**Step 2: Configure Environment Variables**
```bash
# .env.local for development
VITE_CASHFREE_APP_ID=your_test_app_id_here
CASHFREE_APP_ID=your_test_app_id_here
CASHFREE_SECRET_KEY=your_test_secret_key_here
CASHFREE_WEBHOOK_SECRET=your_webhook_secret_key_here
NEXT_PUBLIC_APP_URL=http://localhost:8080
FIREBASE_PROJECT_ID=your-project-id
SERVICE_ACCOUNT_KEY_PATH=./firebase-service-account.json
```

**Step 3: Setup Firebase Service Account**
1. Go to Firebase Console → Project Settings → Service Accounts
2. Generate new private key
3. Download JSON file and save as `firebase-service-account.json`
4. Add file path to environment variables

**Step 4: Start Development Server**
```bash
# Start Vite development server
npm run dev

# In another terminal, start Netlify functions locally
netlify dev
```

**Step 5: Setup ngrok for Webhook Testing**
```bash
# In another terminal, expose local server
ngrok http 8080

# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
# Update webhook URL in Cashfree dashboard
```

#### Testing Tools and Resources
**API Testing with Postman:**
1. **Import Collection**: Download Cashfree Postman collection
2. **Setup Environment**: Create environment with your API keys
3. **Test Endpoints**: Test order creation and payment status APIs

**Webhook Testing Tools:**
- **webhook.site**: Inspect webhook payloads
- **ngrok**: Local webhook testing
- **Postman**: Send test webhook requests
- **curl**: Command-line webhook testing

**Browser Developer Tools:**
- **Network Tab**: Monitor API requests and responses
- **Console**: Check for JavaScript errors
- **Application Tab**: Inspect local storage and session data

#### Common Development Issues and Solutions
**Issue 1: CORS Errors**
```javascript
// Add to netlify.toml
[[headers]]
  for = "/.netlify/functions/*"
  [headers.values]
    Access-Control-Allow-Origin = "*"
    Access-Control-Allow-Headers = "Content-Type"
    Access-Control-Allow-Methods = "GET, POST, OPTIONS"
```

**Issue 2: Environment Variables Not Loading**
```javascript
// Check if variables are properly loaded
console.log('Environment check:', {
  hasAppId: !!process.env.CASHFREE_APP_ID,
  hasSecretKey: !!process.env.CASHFREE_SECRET_KEY,
  nodeEnv: process.env.NODE_ENV
});
```

**Issue 3: Firebase Admin SDK Initialization**
```javascript
// Proper Firebase Admin initialization
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(require('./firebase-service-account.json')),
    projectId: process.env.FIREBASE_PROJECT_ID
  });
}
```

#### Testing Checklist Before Implementation
**Environment Setup:**
- [ ] Node.js and npm installed and updated
- [ ] Firebase project created and configured
- [ ] Netlify account setup and connected to repository
- [ ] Cashfree sandbox account created and verified
- [ ] All environment variables configured correctly
- [ ] ngrok installed and working
- [ ] Development server running without errors

**API Connectivity:**
- [ ] Cashfree API endpoints accessible
- [ ] Firebase Firestore read/write permissions working
- [ ] Netlify Functions deploying and executing
- [ ] Webhook URL accessible via ngrok
- [ ] CORS configuration working for API calls

**Security Setup:**
- [ ] API keys stored securely in environment variables
- [ ] Webhook signature verification implemented
- [ ] HTTPS enforced for all webhook URLs
- [ ] Firebase security rules configured
- [ ] No sensitive data exposed in client-side code

---

## Technical Implementation Guide

### 1. System Architecture Overview

```
Frontend (React/Vite) → Netlify Functions → Cashfree API
                     ↓
Firebase Firestore ← Webhook Handler ← Cashfree Webhook
```

### 2. API Endpoints and Versions

#### Latest API Version: 2025-01-01
- **Base URL (Sandbox)**: `https://sandbox.cashfree.com/pg`
- **Base URL (Production)**: `https://api.cashfree.com/pg`
- **JavaScript SDK**: `https://sdk.cashfree.com/js/v3/cashfree.js`

### 3. Core Integration Components

#### Required Files Structure
```
src/
├── lib/
│   └── cashfree-service.ts          # Main service class
├── components/
│   └── payment/
│       └── CashfreeCheckout.tsx     # Payment component
└── pages/
    └── PaymentStatusPage.tsx        # Payment result page

netlify/functions/
├── create-payment-order.js          # Order creation endpoint
├── cashfree-webhook.js              # Webhook handler
└── check-payment-status.js          # Payment verification
```

### 4. Database Schema Updates

#### Firestore Collections
```typescript
// users/{userId}
interface User {
  uid: string;
  email: string;
  name: string;
  wallet: {
    tournamentCredits: number;      // For joining tournaments
    hostCredits: number;            // For creating tournaments
    earnings: number;               // Won from tournaments
    totalPurchasedTournamentCredits: number;
    totalPurchasedHostCredits: number;
    firstPurchaseCompleted: boolean;
  };
  referralCode?: string;
  referredBy?: string;
}

// creditTransactions/{transactionId}
interface CreditTransaction {
  id: string;
  userId: string;
  type: 'host_credit_purchase' | 'tournament_credit_purchase' | 'tournament_join' | 'tournament_win' | 'referral_bonus';
  amount: number;                   // Number of credits
  value?: number;                   // Monetary value (₹)
  balanceBefore: number;
  balanceAfter: number;
  walletType: 'tournamentCredits' | 'hostCredits' | 'earnings';
  description: string;
  transactionDetails?: {
    packageId?: string;
    packageName?: string;
    paymentId?: string;             // Cashfree payment ID
    orderId?: string;               // Cashfree order ID
    tournamentId?: string;
  };
  createdAt: Timestamp;
}

// creditPackages/{packageId} - For Tournament Credits
interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  discountPercentage: number;
  isSpecialOffer: boolean;
  offerType?: 'welcome' | 'weekend' | 'season' | 'referral';
  offerEndsAt?: Timestamp;
  isActive: boolean;
}
```

### 5. Credit Package Definitions

#### Host Credits (Fixed Package)
```typescript
const HOST_CREDIT_PACKAGE = {
  id: 'basic_host_pack_5',
  name: 'Basic Host Pack',
  credits: 5,
  price: 49,
  description: 'Create up to 5 tournaments'
};
```

#### Tournament Credit Packages
```typescript
const TOURNAMENT_CREDIT_PACKAGES = [
  {
    id: 'starter_pack',
    name: 'Starter Pack',
    credits: 30,
    price: 30,
    discountPercentage: 0,
    isSpecialOffer: false
  },
  {
    id: 'popular_pack',
    name: 'Popular Pack',
    credits: 100,
    price: 95,
    discountPercentage: 5,
    isSpecialOffer: false
  },
  {
    id: 'pro_pack',
    name: 'Pro Pack',
    credits: 300,
    price: 275,
    discountPercentage: 8,
    isSpecialOffer: false
  }
];
```

This completes the comprehensive Cashfree payment integration guide with all sensitive credentials replaced with placeholder values.
