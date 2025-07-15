import crypto from 'crypto';

// CashFree API configuration
const getCashFreeConfig = () => {
  // Use dedicated serverside environment variables
  // IMPORTANT: These need to be defined in your deployment environment
  const environment = process.env.CASHFREE_ENVIRONMENT || 'SANDBOX';
  return {
    appId: process.env.VITE_CASHFREE_APP_ID || process.env.CASHFREE_APP_ID,
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

// Create payment order handler
const handleCreateOrder = async (req, res) => {
  console.log('🔥 Creating payment order');
  console.log('🔥 METHOD:', req.method);
  console.log('🔥 HEADERS:', JSON.stringify(req.headers, null, 2));
  
  try {
    const config = getCashFreeConfig();
    
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
      packageId,
      packageName,
      packageType,
      creditsAmount,
      orderType = 'standard' // New parameter to differentiate order types
    } = req.body;

    // Validate required fields
    if (!amount || !userId || !userName || !userEmail) {
      return res.status(400).json({
        error: 'Missing required fields: amount, userId, userName, userEmail'
      });
    }

    // Generate shorter order ID to meet CashFree's 50 character limit
    const shortUserId = userId.substring(0, 8); // First 8 chars of userId
    const timestamp = Date.now().toString().slice(-8); // Last 8 digits of timestamp
    const orderId = `${(packageType || 'credits').substring(0, 4)}_${shortUserId}_${timestamp}`;

    // Get application URLs with proper fallback for production
    const appUrl = (process.env.VITE_APP_URL || process.env.APP_URL || 'https://freefiretournaments.vercel.app').trim();
    const webhookUrl = appUrl; // Use the same URL for webhook as the return URL to ensure consistency

    console.log('Using application URLs:', { appUrl, webhookUrl });
    
    // Log the exact webhook URL being sent to Cashfree
    const exactWebhookUrl = `${webhookUrl}/api/payment-webhook`;
    console.log('🔗 EXACT WEBHOOK URL being sent to Cashfree:', exactWebhookUrl);

    // Prepare return URL based on order type
    let returnUrl;
    if (orderType === 'enhanced') {
      returnUrl = `${appUrl}/payment-status?orderId=${orderId}&packageType=${packageType || 'tournament'}&amount=${amount}`;
    } else {
      returnUrl = `${appUrl}/payment-status?orderId=${orderId}`;
    }

    // Prepare CashFree order data
    const orderData = {
      order_id: orderId,
      order_amount: amount,
      order_currency: 'INR',
      customer_details: {
        customer_id: userId,
        customer_name: userName,
        customer_email: userEmail,
        customer_phone: userPhone || '9999999999'
      },
      order_meta: {
        return_url: returnUrl,
        notify_url: exactWebhookUrl
      },
      order_note: `Credit purchase: ${packageName || 'Credits'}`,
      order_tags: {
        packageId: packageId || '',
        packageName: packageName || '',
        packageType: packageType || 'tournament',
        userId: userId,
        creditsAmount: creditsAmount ? creditsAmount.toString() : '',
        orderType: orderType
      }
    };

    console.log('Creating CashFree order with config:', {
      environment: config.environment,
      baseUrl: config.baseUrl,
      appId: config.appId ? config.appId.substring(0, 4) + '...' : 'missing',
      orderId: orderId,
      returnUrl: returnUrl,
      notifyUrl: exactWebhookUrl
    });
    
    console.log('📋 Full order data:', JSON.stringify(orderData, null, 2));

    // Call CashFree API
    const response = await fetch(`${config.baseUrl}/orders`, {
      method: 'POST',
      headers: generateCashFreeHeaders(config),
      body: JSON.stringify(orderData)
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('CashFree API error:', responseData);
      throw new Error(responseData.message || `Failed to create order: ${response.status} ${response.statusText}`);
    }

    console.log('CashFree API raw response:', JSON.stringify(responseData));
    
    // Validate payment session ID
    if (!responseData.payment_session_id) {
      console.error('Missing payment_session_id in CashFree response:', responseData);
      throw new Error('Missing payment session ID from CashFree API');
    }

    console.log('CashFree order created successfully:', responseData.order_id, 'with session ID:', responseData.payment_session_id);

    // Return success response
    res.status(200).json({
      success: true,
      data: {
        cfOrderId: responseData.cf_order_id,
        orderId: responseData.order_id,
        paymentSessionId: responseData.payment_session_id,
        orderStatus: responseData.order_status,
        orderAmount: responseData.order_amount,
        orderCurrency: responseData.order_currency,
        orderExpiryTime: responseData.order_expiry_time,
        createdAt: responseData.created_at,
        orderMeta: responseData.order_meta
      }
    });

  } catch (error) {
    console.error('Error creating payment order:', error);
    res.status(500).json({
      error: error.message || 'Internal server error',
      success: false
    });
  }
};

// Handler for legacy create-order functionality (simple version)
const handleCreateOrderLegacy = async (req, res) => {
  // Add orderType: 'standard' to maintain backward compatibility
  req.body.orderType = 'standard';
  return await handleCreateOrder(req, res);
};

// Handler for enhanced create-payment-order functionality
const handleCreatePaymentOrder = async (req, res) => {
  // Add orderType: 'enhanced' for enhanced functionality
  req.body.orderType = 'enhanced';
  return await handleCreateOrder(req, res);
};

// Main handler function
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
    const { action } = req.body;

    switch (action) {
      case 'create-order':
      case 'legacy':
        return await handleCreateOrderLegacy(req, res);
      case 'create-payment-order':
      case 'enhanced':
        return await handleCreatePaymentOrder(req, res);
      default:
        // Default behavior - enhanced order creation
        return await handleCreatePaymentOrder(req, res);
    }
  } catch (error) {
    console.error('Error in payment service:', error);
    res.status(500).json({ error: `Payment service error: ${error.message}` });
  }
}
