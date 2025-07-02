// Netlify function to create CashFree payment orders
const axios = require('axios');

// CashFree Configuration
const CASHFREE_CONFIG = {
  appId: process.env.VITE_CASHFREE_APP_ID,
  secretKey: process.env.CASHFREE_SECRET_KEY,
  environment: process.env.VITE_CASHFREE_ENVIRONMENT || 'SANDBOX',
  apiVersion: process.env.VITE_CASHFREE_API_VERSION || '2025-01-01',
  baseUrl: process.env.VITE_CASHFREE_ENVIRONMENT === 'PRODUCTION' 
    ? 'https://api.cashfree.com/pg'
    : 'https://sandbox.cashfree.com/pg'
};

/**
 * Create CashFree payment order
 */
async function createCashFreeOrder(orderData) {
  try {
    console.log('Creating CashFree order:', orderData);

    const orderPayload = {
      order_id: orderData.orderId,
      order_amount: orderData.amount,
      order_currency: orderData.currency || 'INR',
      customer_details: {
        customer_id: orderData.customerDetails.customerId,
        customer_name: orderData.customerDetails.customerName,
        customer_email: orderData.customerDetails.customerEmail,
        customer_phone: orderData.customerDetails.customerPhone
      },
      order_meta: {
        return_url: orderData.orderMeta.returnUrl,
        notify_url: orderData.orderMeta.notifyUrl
      },
      order_note: orderData.orderNote || '',
      order_tags: orderData.orderTags || {}
    };

    const response = await axios.post(
      `${CASHFREE_CONFIG.baseUrl}/orders`,
      orderPayload,
      {
        headers: {
          'x-client-id': CASHFREE_CONFIG.appId,
          'x-client-secret': CASHFREE_CONFIG.secretKey,
          'x-api-version': CASHFREE_CONFIG.apiVersion,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 10000
      }
    );

    console.log('CashFree order created:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating CashFree order:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Netlify function handler
 */
exports.handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    // Parse request body
    const orderData = JSON.parse(event.body);
    
    // Validate required fields
    const requiredFields = ['orderId', 'amount', 'customerDetails'];
    for (const field of requiredFields) {
      if (!orderData[field]) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            error: `Missing required field: ${field}` 
          })
        };
      }
    }

    // Validate amount
    const amount = parseFloat(orderData.amount);
    if (isNaN(amount) || amount < 1 || amount > 500000) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Amount must be between ₹1 and ₹5,00,000' 
        })
      };
    }

    // Validate customer details
    const { customerDetails } = orderData;
    if (!customerDetails.customerId || !customerDetails.customerName || 
        !customerDetails.customerEmail || !customerDetails.customerPhone) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Complete customer details are required' 
        })
      };
    }

    // Validate CashFree configuration
    if (!CASHFREE_CONFIG.appId || !CASHFREE_CONFIG.secretKey) {
      console.error('CashFree configuration missing');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Payment gateway configuration error' 
        })
      };
    }

    // Create CashFree order
    const cashfreeResponse = await createCashFreeOrder(orderData);

    // Return success response with payment session ID
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        orderId: orderData.orderId,
        cfOrderId: cashfreeResponse.cf_order_id,
        paymentSessionId: cashfreeResponse.payment_session_id,
        orderStatus: cashfreeResponse.order_status,
        orderAmount: cashfreeResponse.order_amount,
        orderCurrency: cashfreeResponse.order_currency,
        orderExpiryTime: cashfreeResponse.order_expiry_time,
        createdAt: cashfreeResponse.created_at,
        orderMeta: {
          returnUrl: orderData.orderMeta.returnUrl,
          notifyUrl: orderData.orderMeta.notifyUrl
        }
      })
    };

  } catch (error) {
    console.error('Error creating payment order:', error);
    
    // Determine appropriate error message
    let errorMessage = 'Failed to create payment order';
    let statusCode = 500;

    if (error.response?.status === 400) {
      errorMessage = error.response.data?.message || 'Invalid request data';
      statusCode = 400;
    } else if (error.response?.status === 401) {
      errorMessage = 'Payment gateway authentication failed';
      statusCode = 500; // Don't expose auth errors to client
    } else if (error.response?.status === 422) {
      errorMessage = 'Invalid payment details';
      statusCode = 400;
    } else if (error.code === 'ECONNABORTED' || error.code === 'ENOTFOUND') {
      errorMessage = 'Payment gateway temporarily unavailable';
      statusCode = 503;
    }

    return {
      statusCode,
      headers,
      body: JSON.stringify({
        success: false,
        error: errorMessage,
        ...(process.env.NODE_ENV !== 'production' && { 
          details: error.response?.data || error.message 
        })
      })
    };
  }
};
