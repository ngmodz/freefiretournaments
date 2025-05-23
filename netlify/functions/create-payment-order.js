const axios = require('axios');

/**
 * Netlify function to create a Cashfree payment order
 * This keeps your API keys secure on the server side
 */
exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  // Define variables in a wider scope for error logging
  let finalOrderId;
  let userId;
  let orderAmount;
  let orderCurrency;
  let customerName;
  let customerEmail;
  let customerPhone;

  try {
    // Parse the incoming request body
    const requestData = JSON.parse(event.body);
    
    // Destructure with defaults
    ({ 
      orderId, 
      orderAmount, 
      orderCurrency = 'INR',
      customerName,
      customerEmail,
      customerPhone,
      orderNote = 'Wallet Top-up',
      userId
    } = requestData);
    
    // Validate required fields - orderId can be generated if not provided
    if (!orderAmount || !customerName || !customerEmail || !customerPhone || !userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Missing required fields. Required: userId, orderAmount, customerName, customerEmail, customerPhone',
          receivedFields: {
            hasOrderAmount: !!orderAmount,
            hasCustomerName: !!customerName,
            hasCustomerEmail: !!customerEmail,
            hasCustomerPhone: !!customerPhone,
            hasUserId: !!userId
          }
        })
      };
    }
    
    // Generate a unique order ID if not provided
    finalOrderId = orderId || `order_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

    // Get Cashfree credentials from environment variables
    const appId = process.env.CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY;
    
    // Validate credentials
    if (!appId || !secretKey) {
      console.error('Missing Cashfree credentials:', { 
        hasAppId: !!appId, 
        hasSecretKey: !!secretKey 
      });
      
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'Missing Cashfree API credentials. Please check your environment variables.',
          details: {
            hasAppId: !!appId,
            hasSecretKey: !!secretKey
          }
        })
      };
    }
    
    // Determine API endpoint (sandbox or production)
    const baseUrl = appId.startsWith('TEST') ? 
      'https://sandbox.cashfree.com/pg/orders' : 
      'https://api.cashfree.com/pg/orders';
    
    // Construct the return URL (your frontend route that handles post-payment)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:8080';
    const returnUrl = `${appUrl}/payment-status?order_id={order_id}`;
    
    // Log request details for debugging (excluding sensitive info)
    console.log('Payment API request details:', {
      url: baseUrl,
      orderId: finalOrderId,
      returnUrl,
      notifyUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:8080'}/.netlify/functions/payment-webhook`,
      appIdPrefix: appId ? appId.substring(0, 8) : 'missing'
    });
    
    // Prepare request data
    const requestBody = {
      order_id: finalOrderId,
      order_amount: orderAmount,
      order_currency: orderCurrency,
      order_note: orderNote,
      customer_details: {
        customer_id: userId,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone
      },
      order_meta: {
        return_url: returnUrl,
        notify_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:8080'}/.netlify/functions/cashfree-webhook`,
        userId: userId,
        amount: orderAmount,
        purchaseType: 'walletTopUp'
      }
    };
    
    // Prepare headers
    const headers = {
      'x-api-version': '2022-09-01',
      'x-client-id': appId,
      'x-client-secret': secretKey,
      'Content-Type': 'application/json'
    };
    
    console.log('Sending request to Cashfree API...');
    
    // Create the order with Cashfree
    const response = await axios.post(baseUrl, requestBody, { headers });
    
    // Log successful response (for debugging)
    console.log('Cashfree API response:', {
      status: response.status,
      orderId: response.data?.order_id,
      orderStatus: response.data?.order_status,
      hasOrderToken: !!response.data?.order_token,
      hasPaymentLink: !!response.data?.payment_link
    });

    // Return the successful order creation response
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        order_token: response.data.order_token,
        order_id: response.data.order_id,
        order_status: response.data.order_status,
        payment_link: response.data.payment_link
      })
    };
  } catch (error) {
    console.error('Error creating payment order:', error);
    
    // More detailed logging of environment variables (excluding secrets)
    const appId = process.env.CASHFREE_APP_ID;
    const baseUrl = appId?.startsWith('TEST') ? 
      'https://sandbox.cashfree.com/pg/orders' : 
      'https://api.cashfree.com/pg/orders';
    
    console.error('Environment check:', {
      hasAppId: !!process.env.CASHFREE_APP_ID,
      appIdPrefix: process.env.CASHFREE_APP_ID ? process.env.CASHFREE_APP_ID.substring(0, 8) : null,
      hasSecretKey: !!process.env.CASHFREE_SECRET_KEY,
      baseUrl,
      appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:8080'
    });
    
    // Also log request data (with sensitive information redacted)
    console.error('Request data:', {
      order_id: finalOrderId,
      userId: userId,
      order_amount: orderAmount,
      order_currency: orderCurrency,
      customer_details: {
        customer_id: userId,
        customer_name: customerName,
        // Redact full email and phone
        customer_email: customerEmail ? `${customerEmail.substring(0, 3)}...` : null,
        customer_phone: customerPhone ? `${customerPhone.substring(0, 3)}...` : null
      }
    });
    
    // Log API response error if available
    if (error.response) {
      console.error('Cashfree API error response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    }
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: 'Failed to create payment order',
        details: error.response?.data || error.message,
        errorStack: error.stack
      })
    };
  }
};
