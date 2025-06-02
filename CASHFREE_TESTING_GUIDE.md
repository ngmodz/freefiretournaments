# 🧪 Cashfree Integration Testing Guide

## 📋 **Pre-Testing Checklist**

### ✅ Environment Setup
- [ ] Cashfree account created
- [ ] Test API credentials obtained
- [ ] Environment variables configured
- [ ] Webhook URL accessible

### ✅ Code Updates (Already Done)
- [x] Updated to API version 2025-01-01
- [x] Implemented payment_session_id support
- [x] Enhanced checkout flow
- [x] Backward compatibility maintained

## 🔧 **Test Credentials Setup**

### 1. Cashfree Test Environment
```env
# Add these to your .env file
VITE_CASHFREE_APP_ID=TEST_your_app_id_here
VITE_CASHFREE_SECRET_KEY=your_test_secret_key_here
VITE_CASHFREE_WEBHOOK_SECRET=your_webhook_secret_here
```

### 2. Test Cards (From Cashfree Documentation)
```
✅ Successful Payment:
Card Number: 4111 1111 1111 1111
CVV: 123
Expiry: Any future date

❌ Failed Payment:
Card Number: 4111 1111 1111 1112
CVV: 123
Expiry: Any future date

⏳ Pending Payment:
Card Number: 4111 1111 1111 1113
CVV: 123
Expiry: Any future date
```

### 3. Test UPI IDs
```
✅ Success: success@upi
❌ Failure: failure@upi
⏳ Pending: pending@upi
```

## 🚀 **Testing Steps**

### Step 1: Basic Integration Test
```bash
# Run the integration test script
npm run test:cashfree

# Expected output:
# ✅ Environment variables configured
# ✅ Payment order creation working
# ✅ Webhook endpoint accessible
# ✅ Credit allocation logic ready
```

### Step 2: Manual Payment Flow Test
1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Navigate to Credits Page**
   - Go to `http://localhost:5173/credits`
   - Verify credit packages are displayed
   - Check current balance display

3. **Test Credit Purchase**
   - Select a credit package (start with "Starter Pack")
   - Click "Buy Now"
   - Verify payment order creation
   - Complete payment with test card

4. **Verify Credit Addition**
   - Check wallet balance updates
   - Verify transaction history
   - Confirm webhook processing

### Step 3: Payment Status Testing
1. **Successful Payment**
   - Use test card: 4111 1111 1111 1111
   - Complete payment flow
   - Verify redirect to success page
   - Check credits added to wallet

2. **Failed Payment**
   - Use test card: 4111 1111 1111 1112
   - Attempt payment
   - Verify failure handling
   - Check no credits added

3. **Webhook Testing**
   - Monitor Netlify function logs
   - Verify webhook signature validation
   - Check credit allocation process

## 🔍 **Debugging Guide**

### Common Issues & Solutions

#### 1. Payment Order Creation Fails
```javascript
// Check console for errors
// Verify environment variables
console.log('App ID:', process.env.VITE_CASHFREE_APP_ID?.substring(0, 8));
console.log('Has Secret:', !!process.env.VITE_CASHFREE_SECRET_KEY);
```

#### 2. Checkout Not Opening
```javascript
// Check Cashfree SDK loading
console.log('Cashfree SDK loaded:', !!window.Cashfree);
// Verify payment session ID
console.log('Payment Session ID:', paymentSessionId);
```

#### 3. Webhook Not Receiving
- Check webhook URL accessibility
- Verify signature validation
- Monitor Netlify function logs

#### 4. Credits Not Added
- Check webhook processing logs
- Verify user ID matching
- Check Firestore transaction logs

## 📊 **Test Scenarios**

### Scenario 1: First-Time User
1. New user registration
2. Navigate to credits page
3. Purchase starter pack
4. Verify wallet initialization
5. Check transaction history

### Scenario 2: Existing User
1. User with existing credits
2. Purchase additional credits
3. Verify balance updates
4. Check transaction accumulation

### Scenario 3: Multiple Packages
1. Purchase tournament credits
2. Purchase host credits
3. Verify separate balances
4. Test different package sizes

### Scenario 4: Error Handling
1. Network interruption during payment
2. Invalid payment details
3. Webhook delivery failure
4. Duplicate order handling

## 🎯 **Success Criteria**

### ✅ Payment Flow
- [ ] Order creation successful
- [ ] Checkout opens correctly
- [ ] Payment processes smoothly
- [ ] Redirects work properly

### ✅ Credit Management
- [ ] Credits added to correct wallet
- [ ] Balance updates in real-time
- [ ] Transaction history accurate
- [ ] No duplicate credits

### ✅ Error Handling
- [ ] Failed payments handled gracefully
- [ ] User feedback provided
- [ ] No credits added on failure
- [ ] Retry mechanisms work

### ✅ Security
- [ ] Webhook signatures validated
- [ ] API keys secure
- [ ] User data protected
- [ ] Transaction integrity maintained

## 🚨 **Production Readiness**

Before going live:
1. **Switch to Production Credentials**
2. **Update Webhook URLs**
3. **Test with Real Bank Account**
4. **Monitor Error Rates**
5. **Set Up Alerts**

## 📞 **Support Resources**

- **Cashfree Documentation**: https://docs.cashfree.com/
- **Test Data**: https://docs.cashfree.com/docs/test-data
- **API Reference**: https://docs.cashfree.com/reference
- **Webhook Guide**: https://docs.cashfree.com/docs/webhooks
