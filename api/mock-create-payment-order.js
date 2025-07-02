// Simple development mock for CashFree API
// This provides a working endpoint while you set up the full API

export default function mockPaymentEndpoint(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, userId, userName, userEmail, packageId, packageName, packageType } = req.body;

    // Validate required fields
    if (!amount || !userId || !userName || !userEmail) {
      return res.status(400).json({
        error: 'Missing required fields: amount, userId, userName, userEmail',
        success: false
      });
    }

    // Generate mock response (for development only)
    const orderId = `dev_${packageType || 'credits'}_${userId}_${Date.now()}`;
    const mockPaymentSessionId = `mock_session_${Date.now()}`;

    console.log(`📝 Mock order created: ${orderId} for ₹${amount}`);

    // Return mock success response
    return res.status(200).json({
      success: true,
      data: {
        cfOrderId: `cf_${Date.now()}`,
        orderId: orderId,
        paymentSessionId: mockPaymentSessionId,
        orderStatus: 'ACTIVE',
        orderAmount: amount,
        orderCurrency: 'INR',
        orderExpiryTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        orderMeta: {
          returnUrl: `${process.env.VITE_APP_URL || 'http://localhost:8083'}/payment-status?orderId=${orderId}`
        }
      }
    });

  } catch (error) {
    console.error('Mock API Error:', error);
    return res.status(500).json({
      error: error.message || 'Internal server error',
      success: false
    });
  }
}
