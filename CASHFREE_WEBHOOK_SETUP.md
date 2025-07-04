# CashFree Webhook Setup Guide

## Introduction

This guide will help you configure CashFree webhooks to enable real-time payment notifications for your application. Webhooks allow CashFree to send automated notifications to your application whenever payment events occur, ensuring that your user accounts are updated immediately when payments are processed.

## Prerequisites

1. A CashFree merchant account
2. Access to your application's deployment platform (e.g., Vercel)
3. Your application already deployed with the CashFree payment integration

## Step 1: Deploy Your Application

Ensure your application is deployed to a public URL that CashFree servers can access. If you're using Vercel, deploy your application using:

```bash
vercel --prod
```

## Step 2: Configure Webhook URL in CashFree Dashboard

1. **Login to CashFree Dashboard**:
   - Visit [merchant.cashfree.com](https://merchant.cashfree.com)
   - Login with your merchant credentials

2. **Navigate to Webhooks Section**:
   - Go to Settings → Webhooks
   - Click on "Add New Webhook"

3. **Configure Webhook Settings**:
   - **Name**: `Payment Notifications` (or any descriptive name)
   - **URL**: `https://your-domain.com/api/payment-webhook` (replace with your actual domain)
   - **Events to subscribe**:
     - `ORDER.PAID`
     - `PAYMENT.SUCCESS`
     - `PAYMENT.FAILED`
   - **Set Secret Key**: Generate a strong secret key (this will be used to validate webhook requests)
   - Click "Save"

## Step 3: Update Environment Variables

Add the webhook secret to your application's environment variables:

1. **For Vercel**:
   ```bash
   vercel env add CASHFREE_WEBHOOK_SECRET
   ```

2. **Enter the secret key** you generated in the CashFree dashboard
   
3. **Deploy the changes**:
   ```bash
   vercel --prod
   ```

## Step 4: Test Webhook Configuration

1. **Make a Test Payment**:
   - Use the Sandbox environment in CashFree
   - Make a test purchase with one of your credit packages
   - Use the test cards provided by CashFree:
     - Success: `4111 1111 1111 1111`
     - Failure: `4111 1111 1111 1112`
     - CVV: Any 3 digits
     - Expiry: Any future date

2. **Check Webhook Logs**:
   - In your Vercel dashboard, check the function logs for `api/payment-webhook`
   - Verify that the webhook is receiving data and processing it correctly
   - Check your database to ensure credits are being added to the user account

## Step 5: Verify Security

The webhook implementation includes several security measures:

1. **Signature Verification**:
   - Each webhook request from CashFree includes a signature in the `x-webhook-signature` header
   - Our code verifies this signature using the secret key to ensure the request is authentic

2. **Idempotency**:
   - We store all webhook events in the database to prevent duplicate processing
   - Our code checks if an order has already been marked as paid before updating user credits

3. **Error Handling**:
   - The webhook handler returns a 200 status even when errors occur to prevent CashFree from retrying
   - All errors are logged for later investigation

## Step 6: Switching to Production

When ready to go live with real payments:

1. **Update Environment Variables**:
   ```
   CASHFREE_ENVIRONMENT=PRODUCTION
   VITE_CASHFREE_ENVIRONMENT=PRODUCTION
   VITE_CASHFREE_APP_ID=your_production_app_id
   CASHFREE_SECRET_KEY=your_production_secret_key
   ```

2. **Configure Production Webhook**:
   - Follow the same steps as above, but in the production environment of CashFree
   - Use your production webhook secret

## Webhook Data Structure

For reference, here's the structure of the webhook data sent by CashFree:

```json
{
  "data": {
    "order": {
      "order_id": "order_123456789",
      "order_amount": 100,
      "order_currency": "INR",
      "order_tags": {
        "userId": "user_123",
        "packageType": "tournament",
        "packageId": "starter_package",
        "creditsAmount": "100"
      }
    },
    "payment": {
      "cf_payment_id": "123456",
      "payment_status": "SUCCESS",
      "payment_amount": 100,
      "payment_currency": "INR",
      "payment_message": "Transaction successful",
      "payment_time": "2023-06-15T10:11:12Z",
      "payment_method": {
        "card": {
          "channel": "link",
          "card_number": "xxxx-xxxx-xxxx-1111",
          "card_type": "credit_card",
          "card_network": "visa"
        }
      }
    }
  },
  "event_time": "2023-06-15T10:11:13Z",
  "type": "PAYMENT_SUCCESS_WEBHOOK"
}
```

## Troubleshooting

### Webhook Not Receiving Data

1. **Check URL**: Verify the webhook URL is correct and publicly accessible
2. **Check Events**: Ensure you've subscribed to the correct events in CashFree
3. **Check Logs**: Review your application logs for any errors

### Payment Successful but Credits Not Added

1. **Check Signature Verification**: Ensure your webhook secret is correctly set
2. **Check User ID**: Verify that the order_tags contain the correct userId
3. **Check Database Access**: Ensure your Firebase credentials are valid

### Multiple Credits Added for Single Payment

1. **Check Idempotency**: Ensure your code checks for existing orders in the database
2. **Check Webhook Retries**: CashFree may retry webhooks if they don't receive a 200 response

## Monitoring and Maintenance

1. **Monitor Webhook Events**:
   - Implement logging for all webhook events
   - Set up alerts for failed webhook processing

2. **Regular Testing**:
   - Periodically test the webhook flow to ensure it continues to function correctly
   - Test with both successful and failed payments

3. **Update Webhook URLs When Changing Domains**:
   - If you change your application's domain, remember to update the webhook URL in CashFree

## Contact Support

If you encounter any issues with CashFree webhooks:

1. **CashFree Support**: [support@cashfree.com](mailto:support@cashfree.com)
2. **CashFree Documentation**: [docs.cashfree.com/docs/webhooks](https://docs.cashfree.com/docs/webhooks) 