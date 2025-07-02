export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.VITE_CASHFREE_ENVIRONMENT || 'SANDBOX',
    version: '1.0.0',
    services: {
      cashfree: {
        configured: !!(process.env.VITE_CASHFREE_APP_ID && process.env.CASHFREE_SECRET_KEY),
        environment: process.env.VITE_CASHFREE_ENVIRONMENT || 'SANDBOX'
      },
      firebase: {
        configured: !!process.env.FIREBASE_SERVICE_ACCOUNT
      }
    }
  };

  res.status(200).json(healthCheck);
}
