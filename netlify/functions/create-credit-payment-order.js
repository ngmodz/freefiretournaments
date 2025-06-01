const axios = require("axios");
const admin = require("firebase-admin");

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}

const db = admin.firestore();

/**
 * Create payment order in Cashfree
 * @param {Object} params Payment parameters
 * @returns {Promise<Object>} Payment order response
 */
const createCashfreeOrder = async (params) => {
  const {
    orderId,
    orderAmount,
    orderCurrency = "INR",
    customerName,
    customerPhone,
    customerEmail,
    orderNote,
    packageId,
    packageType,
    creditsAmount,
  } = params;

  // API details
  const apiUrl = process.env.NODE_ENV === "production"
    ? "https://api.cashfree.com/pg/orders"
    : "https://sandbox.cashfree.com/pg/orders";
  
  const appId = process.env.NODE_ENV === "production"
    ? process.env.CASHFREE_APP_ID
    : process.env.CASHFREE_APP_ID;
  
  const secretKey = process.env.NODE_ENV === "production"
    ? process.env.CASHFREE_SECRET_KEY
    : process.env.CASHFREE_SECRET_KEY;

  // Application URL
  const appUrl = process.env.APP_URL || "http://localhost:3000";

  try {
    console.log(`Creating Cashfree order with ID: ${orderId}`);
    
    // Create order payload
    const payload = {
      order_id: orderId,
      order_amount: orderAmount,
      order_currency: orderCurrency,
      order_note: orderNote || `Credit purchase: ${packageType} - ${creditsAmount} credits`,
      customer_details: {
        customer_id: params.userId,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
      },
      order_meta: {
        return_url: `${appUrl}/payment-status?order_id={order_id}&order_token={order_token}`,
        notify_url: process.env.WEBHOOK_URL || `${appUrl}/.netlify/functions/cashfree-webhook`,
        payment_methods: null, // Allow all payment methods
      },
    };

    // Add metadata for processing later
    // Store these in order_tags for webhook processing
    payload.order_tags = {
      packageId: packageId || "",
      packageType: packageType || "",
      creditsAmount: creditsAmount || 0,
      userId: params.userId,
    };

    console.log("Order payload:", JSON.stringify(payload, null, 2));

    // Make API request to Cashfree
    const response = await axios.post(apiUrl, payload, {
      headers: {
        "x-api-version": "2022-09-01",
        "Content-Type": "application/json",
        "x-client-id": appId,
        "x-client-secret": secretKey,
      },
    });

    console.log("Cashfree API response:", response.data);
    
    // Store order details in Firestore
    await db.collection("creditOrders").doc(orderId).set({
      orderId: orderId,
      userId: params.userId,
      amount: orderAmount,
      packageId: packageId,
      packageType: packageType,
      creditsAmount: creditsAmount,
      status: "CREATED",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      paymentDetails: response.data,
    });

    return {
      success: true,
      order_token: response.data.order_token,
      order_id: response.data.order_id,
      order_status: response.data.order_status,
    };
  } catch (error) {
    console.error("Error creating Cashfree order:", error);
    
    if (error.response) {
      console.error("Cashfree API error response:", {
        status: error.response.status,
        data: error.response.data,
      });
    }
    
    return {
      success: false,
      error: "Failed to create payment order",
      details: error.response?.data || error.message,
    };
  }
};

/**
 * Netlify serverless function handler
 */
exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    // Parse request body
    const body = JSON.parse(event.body);
    
    console.log("Received credit payment order request:", {
      orderId: body.orderId,
      amount: body.orderAmount,
      packageType: body.packageType,
      creditsAmount: body.creditsAmount,
    });

    // Validate required fields
    const requiredFields = [
      "userId",
      "orderAmount",
      "customerName",
      "customerEmail",
      "customerPhone",
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            success: false,
            error: `Missing required field: ${field}`,
          }),
        };
      }
    }

    // Check specific credit fields
    if (!body.packageType || !body.creditsAmount) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          error: "Missing required credit fields: packageType or creditsAmount",
        }),
      };
    }

    // Create payment order
    const orderResponse = await createCashfreeOrder(body);

    return {
      statusCode: orderResponse.success ? 200 : 400,
      body: JSON.stringify(orderResponse),
    };
  } catch (error) {
    console.error("Error in create-credit-payment-order function:", error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: "Internal server error",
        details: error.message,
      }),
    };
  }
}; 