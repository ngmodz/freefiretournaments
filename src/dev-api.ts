import { ViteDevServer } from 'vite';

// Development API middleware for Vite
export function setupDevAPI(server: ViteDevServer) {
  server.middlewares.use('/api/mock-create-payment-order', async (req, res, next) => {
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.statusCode = 200;
      res.end();
      return;
    }

    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Method not allowed' }));
      return;
    }

    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const { amount, userId, packageType } = data;

        console.log('🧪 Mock API: Creating order for', { amount, userId, packageType });

        const orderId = `dev_${packageType}_${userId}_${Date.now()}`;
        const mockResponse = {
          success: true,
          data: {
            cfOrderId: `cf_mock_${Date.now()}`,
            orderId: orderId,
            paymentSessionId: `mock_session_${Date.now()}`,
            orderStatus: 'ACTIVE',
            orderAmount: amount,
            orderCurrency: 'INR',
            orderExpiryTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
            createdAt: new Date().toISOString(),
            orderMeta: {
              returnUrl: `http://localhost:8083/payment-status?orderId=${orderId}`
            }
          }
        };

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.statusCode = 200;
        res.end(JSON.stringify(mockResponse));
      } catch (error) {
        console.error('Mock API Error:', error);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Internal server error' }));
      }
    });
  });

  // Also handle the regular create-payment-order endpoint
  server.middlewares.use('/api/create-payment-order', async (req, res, next) => {
    // Redirect to mock endpoint in development
    req.url = '/api/mock-create-payment-order';
    next();
  });
}
