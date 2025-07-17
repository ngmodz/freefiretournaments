import crypto from 'crypto';

// CashFree API configuration
const getCashFreeConfig = () => {
  const environment = (process.env.CASHFREE_ENVIRONMENT || 'SANDBOX').trim();
  const appId = (process.env.VITE_CASHFREE_APP_ID || process.env.CASHFREE_APP_ID || '').trim();
  const secretKey = (process.env.CASHFREE_SECRET_KEY || '').trim();
  
  return {
    appId: appId,
    secretKey: secretKey,
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

// Create payment order handler
const handleCreateOrder = async (req, res) => {
  console.log('🔥 Creating payment order');
  
  try {
    const config = getCashFreeConfig();
    
    if (!config.appId || !config.secretKey) {
      console.error('Missing Cashfree credentials:', {
        appId: config.appId ? 'present' : 'missing',
        secretKey: config.secretKey ? 'present' : 'missing',
        environment: config.environment
      });
      throw new Error('CashFree credentials not configured. Please set CASHFREE_APP_ID and CASHFREE_SECRET_KEY environment variables.');
    }

    const {
      amount,
      userId,
      userName,
      userEmail,
      userPhone,
      packageType = 'tournament',
      packageDetails = 'Credit purchase'
    } = req.body;

    // Validation
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Generate unique order ID
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const paymentData = {
      order_id: orderId,
      order_amount: parseFloat(amount),
      order_currency: 'INR',
      customer_details: {
        customer_id: userId,
        customer_name: userName || 'User',
        customer_email: userEmail || 'user@example.com',
        customer_phone: userPhone || '9999999999',
      },
      order_meta: {
        return_url: `${process.env.VITE_APP_URL || 'http://localhost:3000'}/payment/success?order_id={order_id}`,
        notify_url: `${process.env.VITE_APP_URL || 'http://localhost:3000'}/api/payment-webhook`,
        payment_methods: 'cc,dc,nb,upi,wallet'
      },
      order_note: `${packageType} package: ${packageDetails}`
    };

    console.log('Payment data:', JSON.stringify(paymentData, null, 2));

    const response = await fetch(`${config.baseUrl}/orders`, {
      method: 'POST',
      headers: generateCashFreeHeaders(config),
      body: JSON.stringify(paymentData)
    });

    const responseData = await response.json();
    console.log('CashFree response:', JSON.stringify(responseData, null, 2));

    if (!response.ok) {
      throw new Error(`CashFree API error: ${JSON.stringify(responseData)}`);
    }

    // Return payment session data
    res.status(200).json({
      success: true,
      order_id: responseData.order_id,
      payment_session_id: responseData.payment_session_id,
      order_status: responseData.order_status,
      payment_link: responseData.payment_link
    });

  } catch (error) {
    console.error('Payment order creation error:', error);
    res.status(500).json({ 
      error: 'Failed to create payment order',
      details: error.message 
    });
  }
};

// Get payment status handler
const handlePaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.query;
    
    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    const config = getCashFreeConfig();
    
    if (!config.appId || !config.secretKey) {
      throw new Error('CashFree credentials not configured');
    }

    console.log(`Fetching payment status for order: ${orderId}`);

    const response = await fetch(`${config.baseUrl}/orders/${orderId}`, {
      method: 'GET',
      headers: generateCashFreeHeaders(config)
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch payment status: ${response.statusText}`);
    }

    const paymentData = await response.json();
    console.log('Payment status response:', JSON.stringify(paymentData, null, 2));

    res.status(200).json({
      success: true,
      orderId: paymentData.order_id,
      orderStatus: paymentData.order_status,
      paymentStatus: paymentData.payment_status || 'PENDING',
      orderAmount: paymentData.order_amount,
      orderCurrency: paymentData.order_currency
    });

  } catch (error) {
    console.error('Payment status error:', error);
    res.status(500).json({ 
      error: 'Failed to get payment status',
      details: error.message 
    });
  }
};

// Main combined handler
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Route based on method and path
    if (req.method === 'POST') {
      // Create payment order
      await handleCreateOrder(req, res);
    } else if (req.method === 'GET') {
      // Get payment status
      await handlePaymentStatus(req, res);
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Payment handler error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
