import crypto from 'crypto';

// CashFree API configuration
const getCashFreeConfig = () => {
  const environment = process.env.VITE_CASHFREE_ENVIRONMENT || 'SANDBOX';
  return {
    appId: process.env.VITE_CASHFREE_APP_ID,
    secretKey: process.env.CASHFREE_SECRET_KEY,
    environment: environment,
    baseUrl: environment === 'PRODUCTION' 
      ? 'https://api.cashfree.com/pg' 
      : 'https://sandbox.cashfree.com/pg'
  };
};

// Generate CashFree headers
const generateCashFreeHeaders = (config) => {
  return {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'x-api-version': '2023-08-01',
    'x-client-id': config.appId,
    'x-client-secret': config.secretKey
  };
};

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const config = getCashFreeConfig();
    
    if (!config.appId || !config.secretKey) {
      throw new Error('CashFree credentials not configured');
    }

    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        error: 'Order ID is required',
        success: false
      });
    }

    console.log('Verifying payment for order:', orderId);

    // Call CashFree API to get order details
    const response = await fetch(`${config.baseUrl}/orders/${orderId}`, {
      method: 'GET',
      headers: generateCashFreeHeaders(config)
    });

    const orderData = await response.json();

    if (!response.ok) {
      console.error('CashFree API error:', orderData);
      throw new Error(orderData.message || 'Failed to verify payment');
    }

    console.log('Payment verification result:', orderData.order_status);

    // Get payment details if order is paid
    let paymentDetails = null;
    if (orderData.order_status === 'PAID') {
      try {
        const paymentsResponse = await fetch(`${config.baseUrl}/orders/${orderId}/payments`, {
          method: 'GET',
          headers: generateCashFreeHeaders(config)
        });

        if (paymentsResponse.ok) {
          const paymentsData = await paymentsResponse.json();
          paymentDetails = paymentsData;
        }
      } catch (error) {
        console.warn('Could not fetch payment details:', error.message);
      }
    }

    // Return verification result
    res.status(200).json({
      success: true,
      verified: orderData.order_status === 'PAID',
      orderId: orderData.order_id,
      orderStatus: orderData.order_status,
      orderAmount: orderData.order_amount,
      orderCurrency: orderData.order_currency,
      paymentDetails: paymentDetails,
      message: orderData.order_status === 'PAID' ? 'Payment verified successfully' : 'Payment not completed'
    });

  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({
      error: error.message || 'Internal server error',
      success: false,
      verified: false
    });
  }
}
