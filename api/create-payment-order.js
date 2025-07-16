import crypto from 'crypto';

// CashFree API configuration
const getCashFreeConfig = () => {
  const environment = (process.env.CASHFREE_ENVIRONMENT || 'SANDBOX').trim();
  const appId = (process.env.CASHFREE_APP_ID || '').trim();
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

// Vercel serverless function handler
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

  // Only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  console.log('🔥 Creating payment order');
  console.log('🔥 METHOD:', req.method);
  console.log('🔥 HEADERS:', JSON.stringify(req.headers, null, 2));
  
  try {
    const config = getCashFreeConfig();
    
    // DEBUG: Log environment and config details
    console.log('🔍 Environment Variables Check:', {
      CASHFREE_ENVIRONMENT: process.env.CASHFREE_ENVIRONMENT,
      VITE_CASHFREE_APP_ID: process.env.VITE_CASHFREE_APP_ID,
      CASHFREE_APP_ID: process.env.CASHFREE_APP_ID,
      CASHFREE_SECRET_KEY: process.env.CASHFREE_SECRET_KEY ? 'present' : 'missing'
    });
    
    console.log('🔍 Resolved Config:', {
      appId: config.appId,
      environment: config.environment,
      baseUrl: config.baseUrl,
      secretKey: config.secretKey ? `${config.secretKey.substring(0, 10)}...` : 'missing'
    });
    
    if (!config.appId || !config.secretKey) {
      console.error('Missing Cashfree credentials:', {
        appId: config.appId ? 'present' : 'missing',
        secretKey: config.secretKey ? 'present' : 'missing',
        environment: config.environment
      });
      throw new Error('CashFree credentials not configured. Please set VITE_CASHFREE_APP_ID and CASHFREE_SECRET_KEY environment variables.');
    }

    const {
      amount,
      userId,
      userName,
      userEmail,
      userPhone,
      orderId,
      orderNote,
      returnUrl,
      packageType,
      packageId,
      packageName,
      creditsAmount
    } = req.body;

    console.log('🔍 Request body:', { amount, userId, userName, userEmail, userPhone, orderId, packageType, packageId, packageName, creditsAmount });

    if (!amount || !userId || !userName || !userEmail || !userPhone) {
      throw new Error('Missing required fields');
    }

    // Create order data for CashFree
    const orderData = {
      order_id: orderId || `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      order_amount: parseFloat(amount),
      order_currency: 'INR',
      customer_details: {
        customer_id: userId,
        customer_name: userName,
        customer_email: userEmail,
        customer_phone: userPhone.startsWith('+91') ? userPhone : `+91${userPhone}`
      },
      order_meta: {
        return_url: returnUrl || `${req.headers.origin || 'https://freefiretournaments.vercel.app'}/payment-status`,
        notify_url: `${req.headers.origin || 'https://freefiretournaments.vercel.app'}/api/payment-webhook`
      },
      order_tags: {
        userId: String(userId),
        packageType: String(packageType || 'tournament'),
        packageId: String(packageId || ''),
        packageName: String(packageName || 'Credits'),
        creditsAmount: String(creditsAmount || amount || '1')
      },
      order_note: orderNote || 'FreeFire Tournament Credits Purchase'
    };

    console.log('🚀 Sending request to CashFree:', config.baseUrl + '/orders');
    console.log('📦 Order data:', JSON.stringify(orderData, null, 2));
    
    // DEBUG: Log headers being sent (without revealing secret)
    const headers = generateCashFreeHeaders(config);
    console.log('📡 Request Headers:', {
      'Accept': headers.Accept,
      'Content-Type': headers['Content-Type'],
      'x-api-version': headers['x-api-version'],
      'x-client-id': headers['x-client-id'],
      'x-client-secret': headers['x-client-secret'] ? `${headers['x-client-secret'].substring(0, 10)}...` : 'missing'
    });

    // Make request to CashFree API
    const response = await fetch(`${config.baseUrl}/orders`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(orderData)
    });

    const responseText = await response.text();
    console.log('📡 CashFree response status:', response.status);
    console.log('📡 CashFree response:', responseText);

    if (!response.ok) {
      throw new Error(`CashFree API error: ${response.status} - ${responseText}`);
    }

    const result = JSON.parse(responseText);
    
    console.log('✅ Payment order created successfully:', result);

    // Return the payment session data
    res.status(200).json({
      success: true,
      data: {
        cfOrderId: result.cf_order_id,
        orderId: result.order_id,
        paymentSessionId: result.payment_session_id,
        orderStatus: result.order_status,
        orderAmount: result.order_amount,
        orderCurrency: result.order_currency
      }
    });

  } catch (error) {
    console.error('❌ Error creating payment order:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
