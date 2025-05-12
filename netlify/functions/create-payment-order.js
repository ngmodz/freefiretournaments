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

  try {
    // Parse the incoming request body
    const requestData = JSON.parse(event.body);
    const { 
      orderId, 
      orderAmount, 
      orderCurrency = 'INR',
      customerName,
      customerEmail,
      customerPhone,
      orderNote = 'Tournament Registration'
    } = requestData;
    
    // Validate required fields - orderId can be generated if not provided
    if (!orderAmount || !customerName || !customerEmail || !customerPhone) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Missing required fields. Required: orderAmount, customerName, customerEmail, customerPhone' 
        })
      };
    }
    
    // Generate a unique order ID if not provided
    const finalOrderId = orderId || `order_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;


    // Get Cashfree credentials from environment variables
    const appId = process.env.CASHFREE_APP_ID;
    const secretKey = process.env.CASHFREE_SECRET_KEY;
    
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
      notifyUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:8080'}/.netlify/functions/payment-webhook`
    });
    
    // Prepare request data
    const requestBody = {
      order_id: finalOrderId,
      order_amount: orderAmount,
      order_currency: orderCurrency,
      order_note: orderNote,
      customer_details: {
        customer_id: customerEmail, // Using email as customer ID
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone
      },
      order_meta: {
        return_url: returnUrl,
        notify_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:8080'}/.netlify/functions/payment-webhook`
      }
    };
    
    // Prepare headers
    const headers = {
      'x-api-version': '2022-09-01',
      'x-client-id': appId,
      'x-client-secret': secretKey,
      'Content-Type': 'application/json'
    };
    
    // Create the order with Cashfree
    const response = await axios.post(baseUrl, requestBody, { headers });
    
    // Log successful response (for debugging)
    console.log('Cashfree API response:', {
      status: response.status,
      orderId: response.data?.order_id,
      orderStatus: response.data?.order_status
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
    console.error('Environment check:', {
      hasAppId: !!process.env.CASHFREE_APP_ID,
      appIdPrefix: process.env.CASHFREE_APP_ID ? process.env.CASHFREE_APP_ID.substring(0, 4) : null,
      hasSecretKey: !!process.env.CASHFREE_SECRET_KEY,
      baseUrl,
      appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:8080'
    });
    // Also log request data (with sensitive information redacted)
    console.error('Request data:', {
      order_id: orderId,
      order_amount: orderAmount,
      order_currency: orderCurrency,
      customer_details: {
        customer_id: customerEmail,
        customer_name: customerName,
        // Redact full email and phone
        customer_email: customerEmail ? `${customerEmail.substring(0, 3)}...` : null,
        customer_phone: customerPhone ? `${customerPhone.substring(0, 3)}...` : null
      }
    });
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to create payment order',
        details: error.response?.data || error.message,
        errorStack: error.stack
      })
    };
  }
};
