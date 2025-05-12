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
    
    // Validate required fields
    if (!orderId || !orderAmount || !customerName || !customerEmail || !customerPhone) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Missing required fields. Required: orderId, orderAmount, customerName, customerEmail, customerPhone' 
        })
      };
    }

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
    
    // Create the order with Cashfree
    const response = await axios.post(
      baseUrl,
      {
        order_id: orderId,
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
          notify_url: `${process.env.NEXT_PUBLIC_APP_URL}/.netlify/functions/payment-webhook`
        }
      },
      {
        headers: {
          'x-api-version': '2022-09-01',
          'x-client-id': appId,
          'x-client-secret': secretKey,
          'Content-Type': 'application/json'
        }
      }
    );

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
    console.error('Error creating payment order:', error.response?.data || error.message);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to create payment order',
        details: error.response?.data || error.message
      })
    };
  }
};
