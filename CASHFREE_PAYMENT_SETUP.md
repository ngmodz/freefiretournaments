# Cashfree Payment Forms Setup Guide

This guide explains how to set up and configure Cashfree Payment Forms for your application.

## Prerequisites

1. Cashfree Individual Account
2. Firebase account and project
3. Netlify account (for hosting and serverless functions)

## Step 1: Set Up Cashfree Payment Form

1. Log in to your [Cashfree Merchant Dashboard](https://merchant.cashfree.com/merchant/login)
2. Navigate to **Payment Gateway** > **Payment Forms**
3. Click on **Create New Form**
4. Set up your payment form with the following details:
   - **Form Name**: Your application name (e.g., "Gaming Credits")
   - **Description**: Brief description of what customers are paying for
   - **Amount Type**: Variable (allows dynamic amounts)
   - **Currency**: INR
   - **Theme**: Choose a theme that matches your application
   - **Redirect URL**: `https://your-domain.com/payment-status` (replace with your actual domain)
   - **Webhook URL**: `https://your-domain.com/.netlify/functions/payment-webhook` (replace with your actual domain)

5. Under **Advanced Settings**:
   - Enable **Pass Custom Parameters**
   - Add the following custom parameters:
     - `user_id` (Required)
     - `payment_type` (Required)
     - `package_id` (Optional)
     - `package_name` (Optional)
     - `package_type` (Optional)
     - `credits_amount` (Optional)

6. Click **Create Form** and note down the **Payment Form URL**

## Step 2: Configure Environment Variables

Create a `.env` file in your project root with the following variables:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
VITE_FIREBASE_APP_ID=your_firebase_app_id

# Payment Form Configuration
VITE_PAYMENT_FORM_URL=your_cashfree_payment_form_url
VITE_PAYMENT_FORM_WEBHOOK_SECRET=your_cashfree_webhook_secret

# API URLs
VITE_API_URL=http://localhost:8888/.netlify/functions
```

For Netlify deployment, add these environment variables in the Netlify dashboard under **Site settings** > **Environment variables**.

## Step 3: Set Up Webhook Security

1. In your Cashfree dashboard, go to **Developers** > **API Keys**
2. Copy your **Secret Key**
3. Set this as `VITE_PAYMENT_FORM_WEBHOOK_SECRET` in your environment variables

## Step 4: Test the Integration

1. Run your application in development mode:
   ```
   npm run dev
   ```

2. Try to purchase credits or add funds to your wallet
3. You should be redirected to the Cashfree Payment Form
4. Complete a test payment using Cashfree's test cards:
   - Card Number: 4111 1111 1111 1111
   - Expiry: Any future date
   - CVV: Any 3 digits

5. After payment, you should be redirected back to your application's payment status page

## Step 5: Go Live

1. Once testing is complete, update your Cashfree Payment Form to production mode
2. Update your environment variables to use production URLs
3. Deploy your application to Netlify

## Troubleshooting

### Webhook Not Receiving Events
- Verify your webhook URL is publicly accessible
- Check that your webhook secret is correctly set
- Ensure your Netlify function has the necessary permissions

### Payment Status Not Updating
- Check Netlify function logs for errors
- Verify Firebase database connection
- Ensure webhook is properly configured

### Test Payments Not Working
- Make sure you're using Cashfree's test card details
- Check that your payment form is in test mode
- Verify redirect URLs are correctly set

## Additional Resources

- [Cashfree Payment Forms Documentation](https://docs.cashfree.com/docs/payment-forms)
- [Cashfree Webhook Documentation](https://docs.cashfree.com/docs/webhooks)
- [Netlify Functions Documentation](https://docs.netlify.com/functions/overview/) 