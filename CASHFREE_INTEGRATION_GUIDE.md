# Cashfree Payment Gateway Integration Guide

## Table of Contents

- [Introduction](#introduction)
- [Prerequisites](#prerequisites)
- [Integration Options](#integration-options)
- [Setup Process](#setup-process)
- [Implementation Steps](#implementation-steps)
  - [Web Integration](#web-integration)
  - [Mobile App Integration](#mobile-app-integration)
  - [Server-side Implementation](#server-side-implementation)
- [Payment Flow](#payment-flow)
- [Handling Callbacks](#handling-callbacks)
- [Testing](#testing)
  - [Test Mode Setup](#test-mode-setup)
  - [Test Cards and Accounts](#test-cards-and-accounts)
  - [Testing Various Scenarios](#testing-various-scenarios)
- [Going Live](#going-live)
- [Security Best Practices](#security-best-practices)
- [Troubleshooting](#troubleshooting)
- [References](#references)

## Introduction

This guide outlines the step-by-step process to integrate Cashfree Payments into your application. Cashfree is a payment gateway that enables businesses to accept payments through various methods including credit/debit cards, UPI, net banking, wallets, and more.

## Prerequisites

1. **Cashfree Account**: Register at [Cashfree Merchant Dashboard](https://merchant.cashfree.com/merchant/login)
2. **Business Documentation**: Keep your business PAN, GST details, and bank account details ready
3. **Technical Requirements**:
   - SSL-enabled website/app
   - Server-side programming capability (Node.js, PHP, Python, Java, etc.)
   - Basic understanding of RESTful APIs

## Integration Options

Cashfree offers multiple integration options based on your requirements:

### Web Integrations

1. **Cashfree Hosted Checkout (Web Checkout)**: 
   - Simple redirect-based flow
   - Fully hosted by Cashfree
   - Minimal development effort

2. **Merchant Hosted Checkout (Web Element)**: 
   - Embeddable payment elements
   - More control over UI/UX
   - Seamless payment experience

### Mobile App Integrations

1. **Android SDK**
2. **iOS SDK**
3. **React Native SDK**
4. **Flutter SDK**

### Alternative Integrations

1. **Plugins**: For platforms like Shopify, WooCommerce, etc.
2. **No-Code Solutions**:
   - Payment Links
   - Payment Forms

## Setup Process

1. **Create Cashfree Account**:
   - Sign up at [Cashfree Merchant Dashboard](https://merchant.cashfree.com/merchant/login)
   - Complete the KYC process
   - Get necessary credentials (App ID and Secret Key)

2. **Environment Setup**:
   - Test Environment: `https://sandbox.cashfree.com`
   - Production Environment: `https://api.cashfree.com`

3. **Dashboard Configuration**:
   - Configure webhook URLs
   - Set up payment methods
   - Define payment expiry times

## Implementation Steps

### Web Integration

#### Option 1: Cashfree Hosted Checkout (Redirect Flow)

1. **Server-side: Create Order**

```javascript
// Node.js example
const axios = require('axios');

async function createOrder(orderData) {
  try {
    const response = await axios.post(
      'https://sandbox.cashfree.com/pg/orders',
      {
        order_id: orderData.orderId,
        order_amount: orderData.amount,
        order_currency: 'INR',
        order_note: 'Payment for order',
        customer_details: {
          customer_id: orderData.customerId,
          customer_name: orderData.customerName,
          customer_email: orderData.customerEmail,
          customer_phone: orderData.customerPhone
        },
        order_meta: {
          return_url: 'https://yourwebsite.com/return?order_id={order_id}'
        }
      },
      {
        headers: {
          'x-api-version': '2022-09-01',
          'x-client-id': 'YOUR_APP_ID',
          'x-client-secret': 'YOUR_SECRET_KEY',
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
}
```

2. **Client-side: Redirect to Payment Page**

```javascript
function redirectToPayment(orderToken) {
  window.location.href = `https://sandbox.cashfree.com/pg/orders/${orderToken}/payments`;
}
```

#### Option 2: Merchant Hosted Checkout (Web Elements)

1. **Include Cashfree.js in your page**

```html
<script src="https://sdk.cashfree.com/js/ui/2.0.0/cashfree.sandbox.js"></script>
```

2. **Initialize Cashfree Elements**

```javascript
const cashfree = new Cashfree({
  mode: "sandbox" // or "production"
});

// Create a card element
const cardElement = cashfree.elements({
  paymentMethod: "card",
  style: {
    // Customize styles
  }
});

// Mount the element
cardElement.mount("#card-element-container");
```

3. **Handle Payment Submission**

```javascript
document.getElementById('payment-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  
  // Order token received from server
  const orderToken = document.getElementById('order-token').value;
  
  try {
    const result = await cashfree.pay(orderToken, cardElement);
    if (result.error) {
      console.error(result.error);
      // Handle error
    } else {
      // Payment successful
      window.location.href = '/payment-success';
    }
  } catch (error) {
    console.error('Payment failed:', error);
    // Handle error
  }
});
```

### Mobile App Integration

#### Android Integration

1. **Add dependencies to build.gradle**

```gradle
dependencies {
    implementation 'com.cashfree.pg:android-sdk:2.0.0'
}
```

2. **Initialize Cashfree SDK**

```java
// Create order on your server and get the order token
String orderToken = "ORDER_TOKEN_FROM_SERVER";

// Initialize payment session
CFPaymentService cfPaymentService = CFPaymentService.getCFPaymentServiceInstance();
cfPaymentService.doPayment(this, orderToken, "YOUR_APP_ID", CFPaymentService.ENVIRONMENT_SANDBOX);
```

3. **Handle payment response**

```java
@Override
protected void onActivityResult(int requestCode, int resultCode, Intent data) {
    super.onActivityResult(requestCode, resultCode, data);
    
    // Check payment result
    if (data != null) {
        Bundle bundle = data.getExtras();
        if (bundle != null) {
            String txStatus = bundle.getString("txStatus");
            if ("SUCCESS".equals(txStatus)) {
                // Payment successful
            } else {
                // Payment failed
                String txMsg = bundle.getString("txMsg");
                // Handle failure
            }
        }
    }
}
```

#### iOS Integration

1. **Add SDK to your project using CocoaPods**

```ruby
pod 'CashfreeSDK'
```

2. **Initialize Cashfree SDK**

```swift
import CashfreeSDK

// Create order on your server and get the order token
let orderToken = "ORDER_TOKEN_FROM_SERVER"

// Initialize payment session
let cashfreeSDK = CFPaymentGatewayService.shared
cashfreeSDK.doPayment(orderToken: orderToken, 
                      appId: "YOUR_APP_ID", 
                      environment: .SANDBOX, 
                      viewController: self)
```

3. **Implement delegate methods**

```swift
extension YourViewController: CFResponseDelegate {
    func onPaymentVerify(orderID: String) {
        // Payment successful
    }
    
    func onPaymentFailure(orderID: String, error: CFErrorResponse) {
        // Payment failed
    }
}
```

### Server-side Implementation

#### Order Creation API

Endpoint: `POST https://api.cashfree.com/pg/orders`

Headers:
```
x-client-id: YOUR_APP_ID
x-client-secret: YOUR_SECRET_KEY
x-api-version: 2022-09-01
Content-Type: application/json
```

Request Body:
```json
{
  "order_id": "unique_order_id",
  "order_amount": 100.00,
  "order_currency": "INR",
  "order_note": "Test Payment",
  "customer_details": {
    "customer_id": "customer123",
    "customer_name": "John Doe",
    "customer_email": "john@example.com",
    "customer_phone": "9999999999"
  },
  "order_meta": {
    "return_url": "https://yourwebsite.com/return?order_id={order_id}",
    "notify_url": "https://yourwebsite.com/webhook"
  }
}
```

#### Order Status Verification

Endpoint: `GET https://api.cashfree.com/pg/orders/{order_id}`

Headers:
```
x-client-id: YOUR_APP_ID
x-client-secret: YOUR_SECRET_KEY
x-api-version: 2022-09-01
```

## Payment Flow

1. **Order Creation**: Create an order on your server using Cashfree's Order API
2. **Payment Initiation**: Present payment options to the customer
3. **Payment Processing**: Customer selects payment method and completes payment
4. **Payment Verification**: Verify payment status using webhook or order status API
5. **Order Fulfillment**: Deliver goods/services after successful payment

## Handling Callbacks

### Webhook Setup

1. **Configure Webhook URL** in Cashfree Dashboard
2. **Implement Webhook Handler**:

```javascript
// Express.js example
app.post('/webhook', (req, res) => {
  const event = req.body;
  const signature = req.headers['x-webhook-signature'];
  
  // Verify signature
  if (verifySignature(event, signature)) {
    // Process webhook event
    const orderId = event.orderId;
    const orderStatus = event.orderStatus;
    
    if (orderStatus === 'PAID') {
      // Update order in your database
      updateOrderStatus(orderId, 'paid');
    }
    
    res.status(200).send('Webhook received');
  } else {
    res.status(400).send('Invalid signature');
  }
});

function verifySignature(payload, signature) {
  // Implement signature verification using Cashfree's guidelines
  // ...
}
```

### Return URL

Implement a handler for the return URL:

```javascript
app.get('/return', async (req, res) => {
  const orderId = req.query.order_id;
  
  // Verify payment status from Cashfree
  const paymentStatus = await verifyPaymentStatus(orderId);
  
  if (paymentStatus === 'PAID') {
    res.redirect('/payment-success');
  } else {
    res.redirect('/payment-failure');
  }
});

async function verifyPaymentStatus(orderId) {
  // Call Cashfree API to verify payment status
  // ...
}
```

## Testing

### Test Mode Setup

Before deploying your integration to a live environment, it's essential to thoroughly test your payment flow using Cashfree's sandbox environment. The sandbox environment simulates real payment scenarios without processing actual transactions.

#### Setting Up Test Mode

1. **Create Sandbox Account**:
   - Sign up for a Cashfree account if you haven't already
   - By default, all new accounts start in Test Mode
   - Access the sandbox dashboard at [Cashfree Sandbox](https://merchant.cashfree.com/merchant/login)

2. **Get Test Credentials**:
   - Note your App ID and Secret Key from the dashboard
   - These credentials will only work in the sandbox environment
   
3. **Environment Configuration**:
   - Sandbox API Base URL: `https://sandbox.cashfree.com`
   - Use the following endpoints for sandbox testing:
     - Orders API: `https://sandbox.cashfree.com/pg/orders`
     - Payments API: `https://sandbox.cashfree.com/pg/orders/{order_id}/payments`

4. **SDK Configuration for Test Mode**:
   - Web SDK: Use `mode: "sandbox"` in configuration
   - Android: Use `CFPaymentService.ENVIRONMENT_SANDBOX`
   - iOS: Use `environment: .SANDBOX`

#### Test Mode vs. Production Mode

| Feature | Test Mode | Production Mode |
|---------|-----------|----------------|
| Real Money | No (simulation only) | Yes (actual transactions) |
| API Base URL | sandbox.cashfree.com | api.cashfree.com |
| Dashboard | Sandbox Dashboard | Production Dashboard |
| KYC Requirements | Minimal | Complete verification required |
| Payment Methods | All available for testing | Based on your KYC status |
| Webhook Testing | Fully supported | Real transactions |

### Test Cards and Accounts

#### Credit/Debit Cards

| Card Type | Card Number | Expiry | CVV | 3D Secure OTP |
|-----------|------------|--------|-----|---------------|
| Visa (Success) | 4111 1111 1111 1111 | Any future date | Any 3 digits | 123456 |
| Mastercard (Success) | 5111 1111 1111 1118 | Any future date | Any 3 digits | 123456 |
| Visa (Failure) | 4111 1111 1111 1115 | Any future date | Any 3 digits | 123456 |
| Rupay (Success) | 6012 0010 0101 1478 | Any future date | Any 3 digits | 123456 |

#### UPI

- Test UPI ID: `success@upi`
- Failure UPI ID: `failure@upi`

#### Netbanking

All banks are available for testing in the sandbox environment. Choose any bank and the payment will be simulated as successful.

#### Wallets

All wallet options are available for testing. Select any wallet and follow the flow to simulate a successful transaction.

### Testing Various Scenarios

#### 1. Successful Payment Flow

- Use success test cards/UPI IDs
- Verify that your success callbacks and webhooks are triggered
- Check if order status updates correctly in your system

#### 2. Failed Payment Flow

- Use failure test cards/UPI IDs
- Ensure your error handling logic works properly
- Verify that failure callbacks and webhooks are triggered
- Test retry mechanisms if implemented

#### 3. Webhook Testing

- Cashfree will send webhook events to your configured URL
- Ensure your webhook handler verifies the signature
- Test various webhook events (payment success, failure, refund)

#### 4. Edge Cases

- Timeout scenarios: Test how your system handles payment timeouts
- Network issues: Simulate network failures during payment
- Browser/app closure: Test user closing browser/app during payment
- Session expiry: Test payment after session expiration

#### 5. Testing Refunds

To test refunds in sandbox mode:

1. Make a successful test payment
2. Use the Cashfree dashboard or Refund API to initiate a refund
3. Verify refund status updates via webhooks or API polling

```javascript
// Example: Check Refund Status (Node.js)
async function checkRefundStatus(orderId, refundId) {
  try {
    const response = await axios.get(
      `https://sandbox.cashfree.com/pg/orders/${orderId}/refunds/${refundId}`,
      {
        headers: {
          'x-api-version': '2022-09-01',
          'x-client-id': 'YOUR_TEST_APP_ID',
          'x-client-secret': 'YOUR_TEST_SECRET_KEY'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error checking refund status:', error);
    throw error;
  }
}
```

### Monitoring Test Transactions

1. **Sandbox Dashboard**:
   - All test transactions are visible in your sandbox dashboard
   - View transaction details, status, and payment method
   - Test reconciliation and reporting features

2. **Transaction Debugging**:
   - Each test transaction has detailed logs for debugging
   - Use these logs to understand payment flows and failures
   - Debug webhooks and callbacks using transaction references

3. **Best Practices for Testing**:
   - Create a comprehensive test suite covering all payment methods
   - Test all possible user journeys and edge cases
   - Document test cases and expected outcomes
   - Maintain a staging environment that mirrors production

Only proceed to production after thoroughly testing all aspects of your integration in the sandbox environment.

## Going Live

1. **Complete KYC**: Ensure all business verification is complete
2. **Switch to Production**:
   - Update API endpoints to production URLs
   - Replace sandbox credentials with production credentials
   - Update webhook URLs if needed

3. **Pre-Production Checklist**:
   - Error handling for all edge cases
   - Proper logging and monitoring
   - Security measures
   - Compliance with regulations

## Security Best Practices

1. **Never expose API Secret Key** on client-side
2. **Always verify payment status** on server-side
3. **Implement webhook signature verification**
4. **Use HTTPS** for all API calls
5. **Store sensitive data securely**
6. **Implement proper error handling**
7. **Perform input validation** for all user inputs

## Troubleshooting

### Common Issues

1. **Payment Failure**:
   - Check error codes in Cashfree documentation
   - Verify payment details are correct
   - Ensure sufficient balance in test accounts

2. **Integration Issues**:
   - Verify API credentials
   - Check API request format
   - Validate webhook URL accessibility

3. **Order Creation Failure**:
   - Ensure unique order IDs
   - Validate customer information
   - Check for missing required fields

### Error Codes

Refer to [Cashfree Documentation](https://www.cashfree.com/docs/payments/overview) for a complete list of error codes and their resolutions.

## References

- [Cashfree API Documentation](https://www.cashfree.com/docs/payments/overview)
- [Web Checkout Integration](https://www.cashfree.com/docs/payments/online/web/redirect)
- [Web Element Integration](https://www.cashfree.com/docs/payments/online/element/overview)
- [Android Integration](https://www.cashfree.com/docs/payments/online/mobile/android)
- [iOS Integration](https://www.cashfree.com/docs/payments/online/mobile/ios)
- [React Native Integration](https://www.cashfree.com/docs/payments/online/mobile/react-native)
- [Flutter Integration](https://www.cashfree.com/docs/payments/online/mobile/flutter)
