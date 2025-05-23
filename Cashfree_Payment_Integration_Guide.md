# Cashfree One-Time Payment Integration for Credit Purchases

## 1. Overview

This document outlines the step-by-step process for integrating Cashfree's one-time payment gateway into the web application. The goal is to allow users to purchase "Host Credits" (for creating tournaments) and "Tournament Credits" (for joining tournaments) via one-time payments. Upon successful payment, the respective credits will be added to the user's account. Users can top-up their credits by making subsequent purchases when their balance is low.

This integration will primarily leverage Cashfree's Custom Web Checkout (using their JavaScript SDK) for a seamless user experience, with backend logic handled by Netlify Functions (or your chosen serverless environment) and data stored in Firestore.

**Reference Document:** The implementation details for data models and backend logic for credit handling are heavily based on the `Payment_Credits.md` file found in the codebase.

## 2. System Architecture

The payment flow involves several components:

1. **Frontend (Your Web App):** User selects a credit package and initiates payment. The frontend communicates with your backend to start the process and then uses Cashfree's JS SDK to handle the payment form and interaction.
2. **Your Backend (e.g., Netlify Functions):**
   * An API endpoint to receive requests from the frontend, create an order with Cashfree, and return a `payment_session_id`.
   * A webhook handler endpoint to receive payment status notifications from Cashfree.
3. **Cashfree:** Processes the payment and sends webhook notifications.
4. **Firestore:** Stores user data, including wallet balances (Host Credits, Tournament Credits) and transaction logs.

```
User Action (FE) --> Your Backend API (Create Order) --> Cashfree API (Create Order)
|
v
+--(Receives payment_session_id, Initializes JS SDK for payment)-- Cashfree Payment Page (Embedded/Modal)
| (User Pays)
v
Your Backend Webhook <-- Cashfree Webhook Notification (Payment Status) <-- Cashfree
|
v
Firestore (Update Wallet, Log Transaction) --> User Account Reflects Credits (FE)
```

## 3. Prerequisites

* **Cashfree Merchant Account:** Active account with API keys (Test and Production).
* **Cashfree API Keys:** Client ID and Client Secret.
* **Frontend Framework:** Your existing web application setup (e.g., React, Vue, Angular with Vite).
* **Backend Environment:** Serverless functions (e.g., Netlify Functions) or a traditional backend server.
* **Firebase Project:** Firestore database set up for user data and transactions.
* **Cashfree JavaScript SDK:** To be integrated into your frontend.

## 4. Data Models

Ensure your Firestore data models align with `Payment_Credits.md`:

* **`users/{userId}` document:**
  * Should contain a `wallet` object:
    ```typescript
    interface Wallet {
      tournamentCredits: number;
      hostCredits: number;
      earnings: number;
      totalPurchasedTournamentCredits: number;
      totalPurchasedHostCredits: number;
      firstPurchaseCompleted?: boolean;
    }
    ```
* **`creditTransactions/{transactionId}` collection:**
  * To log all credit additions, deductions, and purchases with details like `type`, `amount`, `value`, `paymentId`, `orderId`, etc.

## 5. Backend Implementation

### 5.1. Secure API Key Management

Store your Cashfree `Client ID` and `Client Secret` as environment variables in your Netlify (or backend) deployment settings. **Do not hardcode them in your codebase.**

Example for Netlify: Set them in `Site settings > Build & deploy > Environment`.

### 5.2. Cashfree Service

Create a service to encapsulate interactions with the Cashfree API:

```typescript
// src/lib/cashfree-service.ts
import axios from 'axios';

const CASHFREE_API_URL_V3 = 'https://api.cashfree.com/pg'; // Or sandbox URL for testing
const CASHFREE_CLIENT_ID = process.env.CASHFREE_CLIENT_ID;
const CASHFREE_CLIENT_SECRET = process.env.CASHFREE_CLIENT_SECRET;
const CASHFREE_API_VERSION = '2023-08-01';

interface CustomerInfo {
  customer_id: string;
  customer_email: string;
  customer_phone: string;
  customer_name?: string;
}

interface OrderMeta {
  return_url?: string;
  notify_url?: string;
  type: 'hostCreditPurchase' | 'tournamentCreditPurchase';
  userId: string;
  packageId: string;
  packageName: string;
  credits: number;
  price: number;
}

// Additional interfaces and methods for creating orders
// See full implementation in the source document
```

### 5.3. API Endpoint for Creating Payment Session

```javascript
// netlify/functions/create-payment-session.mjs
export const handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { purchaseType, userId, customerInfo, packageDetails, returnUrl } = JSON.parse(event.body);
    // Authenticate request and validate inputs
    
    const cashfreeService = new CashfreeService();
    let paymentSessionId;

    if (purchaseType === 'hostCredit') {
      paymentSessionId = await cashfreeService.createHostCreditPurchaseOrder(userId, customerInfo, returnUrl);
    } else if (purchaseType === 'tournamentCredit' && packageDetails) {
      paymentSessionId = await cashfreeService.createTournamentCreditPurchaseOrder(userId, packageDetails, customerInfo, returnUrl);
    } else {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid purchase type or missing package details.' }) };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentSessionId }),
    };
  } catch (error) {
    console.error('Error creating payment session:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to create payment session.' }),
    };
  }
};
```

### 5.4. Webhook Handler

Create a webhook handler to process payment notifications from Cashfree:

```javascript
// netlify/functions/cashfree-webhook.mjs
import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
// Implement functions to handle different credit purchase types
// See full implementation in the source document

export const handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const payload = JSON.parse(event.body);
    // Verify webhook signature (important for security)
    
    const orderMeta = payload.order_meta;
    const orderStatus = payload.order_status;

    if (orderStatus === 'PAID' && payload.payments?.payment_status === 'SUCCESS') {
      if (orderMeta?.type === 'hostCreditPurchase') {
        await handleHostCreditPurchase(payload, db);
      } else if (orderMeta?.type === 'tournamentCreditPurchase') {
        await handleTournamentCreditPurchase(payload, db);
      }
    }

    return { statusCode: 200, body: 'Webhook processed' };
  } catch (error) {
    console.error('Error processing webhook:', error);
    return { statusCode: 500, body: 'Webhook processing failed' };
  }
};
```

## 6. Frontend Implementation

### 6.1. Setup Cashfree JS SDK

Include the Cashfree JS SDK in your application:

```html
<!-- public/index.html -->
<script src="https://sdk.cashfree.com/js/v3/cashfree.js"></script>
```

### 6.2. UI for Credit Packages

Create components to display Host Credit and Tournament Credit packages with "Buy Now" buttons.

### 6.3. Initiating Payment

```javascript
// Example frontend call
async function handlePurchase(purchaseType, packageInfo) {
  try {
    const response = await fetch('/.netlify/functions/create-payment-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        purchaseType,
        userId: currentUser.uid,
        customerInfo: {
          customer_email: currentUser.email,
          customer_phone: currentUser.phoneNumber || '9999999999',
        },
        packageDetails: purchaseType === 'tournamentCredit' ? packageInfo : undefined,
        returnUrl: `${window.location.origin}/payment-complete`
      }),
    });

    const { paymentSessionId } = await response.json();
    initiateCashfreePayment(paymentSessionId);
  } catch (error) {
    console.error('Purchase initiation failed:', error);
  }
}

function initiateCashfreePayment(paymentSessionId) {
  const cashfree = Cashfree({
    mode: "sandbox" // or "production"
  });

  cashfree.checkout({
    paymentSessionId: paymentSessionId,
  }).then(function(data) {
    // Handle payment completion or redirection
    console.log("Payment client-side details:", data);
  }).catch(function(err){
    console.error("Cashfree SDK error:", err);
  });
}
```

## 7. Cashfree Dashboard Configuration

1. **API Keys:** Obtain your Test and Production `Client ID` and `Client Secret`.
2. **Webhook URL:** Configure your webhook endpoint in the Cashfree dashboard.

## 8. Testing

1. Use Cashfree's sandbox environment for testing.
2. Verify the entire payment flow from order creation to credit reflection.
3. Test webhook functionality and error handling.

## 9. Security Considerations

* **API Key Management:** Store secrets securely as environment variables.
* **Webhook Signature Verification:** Verify all incoming webhooks.
* **Input Validation:** Validate all inputs on your backend.
* **Authentication:** Protect your API endpoints.
* **Idempotency:** Design your webhook handler to be idempotent to prevent duplicate credit additions.

## 10. Future: Subscription Services

If implementing subscription services later:
* Use Cashfree's subscription APIs (Plans, Subscriptions).
* Expand your webhook handler to process subscription-related events.
* Refer to the `Subscription.md` document in your codebase.

Always consult the **official Cashfree API and SDK documentation** for the most up-to-date information and implementation details.
