# Cashfree Payment Forms Integration

This project demonstrates how to integrate Cashfree Payment Forms into a React application. The integration allows you to accept payments without needing a business account, using Cashfree's payment form feature.

## Features

- Redirect to Cashfree Payment Forms for processing payments
- Handle payment callbacks and webhooks
- Process wallet top-ups and credit purchases
- Verify payment status

## Setup

1. Follow the detailed setup instructions in [CASHFREE_PAYMENT_SETUP.md](./CASHFREE_PAYMENT_SETUP.md)
2. Configure environment variables as specified
3. Set up the webhook URL in your Cashfree dashboard

## Usage

### Basic Payment Flow

1. Import the PaymentService:
```typescript
import { PaymentService } from '@/lib/paymentService';
```

2. Create payment parameters:
```typescript
const paymentParams = {
  amount: 100, // Amount in INR
  userId: 'user123',
  userName: 'John Doe',
  userEmail: 'john@example.com',
  paymentType: 'wallet_topup', // or 'credit_purchase'
  // Optional parameters for credit purchases
  packageId: 'premium_pack',
  packageName: 'Premium Pack',
  packageType: 'tournament', // or 'host'
  creditsAmount: 500
};
```

3. Redirect to payment form:
```typescript
const paymentService = PaymentService.getInstance();
paymentService.redirectToPaymentForm(paymentParams);
```

### Example Components

- `BuyCreditsButton`: A simple button component that redirects to the credits page
- `AddFundsDialog`: A dialog for adding funds to wallet
- `BuyCreditsExample`: An example component showing a complete payment flow

### Payment Status Page

The `PaymentStatusPage` component handles the redirect from Cashfree Payment Forms and displays the payment status to the user.

## Testing

For testing in development mode, the payment service includes a mock payment flow that simulates a successful payment without actually redirecting to Cashfree.

## Webhook Handling

The `payment-webhook.js` Netlify function handles webhook notifications from Cashfree and updates the user's wallet or credits based on the payment type.

## Folder Structure

```
├── netlify/
│   └── functions/
│       ├── payment-webhook.js     # Webhook handler
│       └── verify-payment.js      # Payment verification endpoint
├── src/
│   ├── components/
│   │   ├── payment/
│   │   │   ├── BuyCreditsButton.tsx  # Button component
│   │   │   └── index.ts              # Export components
│   │   └── wallet/
│   │       └── AddFundsDialog.tsx    # Dialog for adding funds
│   ├── lib/
│   │   └── paymentService.ts      # Payment service implementation
│   └── pages/
│       └── PaymentStatusPage.tsx  # Payment status display
└── CASHFREE_PAYMENT_SETUP.md      # Setup instructions
```

## Environment Variables

```
VITE_PAYMENT_FORM_URL=your_cashfree_payment_form_url
VITE_PAYMENT_FORM_WEBHOOK_SECRET=your_cashfree_webhook_secret
```

## Credits

- [Cashfree Payments](https://www.cashfree.com/)
- [React](https://reactjs.org/)
- [Netlify Functions](https://www.netlify.com/products/functions/)

## License

MIT 