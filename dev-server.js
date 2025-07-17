import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.DEV_API_PORT || 8084;

// Middleware
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl || req.url}`);
  next();
});

// API Routes with direct imports
app.post('/api/create-payment-order', async (req, res) => {
  try {
    // Route to new unified payment service
    req.body.action = 'create-payment-order';
    const { default: handler } = await import('./api/payment-service.js');
    await handler(req, res);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message, success: false });
  }
});

app.post('/api/create-order', async (req, res) => {
  try {
    // Route to new unified payment service
    req.body.action = 'create-order';
    const { default: handler } = await import('./api/payment-service.js');
    await handler(req, res);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message, success: false });
  }
});

app.post('/api/mock-create-payment-order', async (req, res) => {
  try {
    const { default: handler } = await import('./api/mock-create-payment-order.js');
    await handler(req, res);
  } catch (error) {
    console.error('Mock API Error:', error);
    res.status(500).json({ error: error.message, success: false });
  }
});

app.post('/api/payment-webhook', async (req, res) => {
  try {
    const { default: handler } = await import('./api/payment-webhook.js');
    await handler(req, res);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message, success: false });
  }
});

app.post('/api/verify-payment', async (req, res) => {
  try {
    const { default: handler } = await import('./api/verify-payment.js');
    await handler(req, res);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message, success: false });
  }
});

app.all('/api/health-check', async (req, res) => {
  try {
    // Bust the cache to always get the latest version in dev
    const { default: handler } = await import(`./api/health-check.js?v=${Date.now()}`);
    await handler(req, res);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message, success: false });
  }
});

app.post('/api/withdrawal-notification', async (req, res) => {
  try {
    // Route to new unified email service
    req.body.action = 'withdrawal-notification';
    const { default: handler } = await import(`./api/email-service.js?v=${Date.now()}`);
    await handler(req, res);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message, success: false });
  }
});

// Tournament management endpoints - Combined into single endpoint
app.post('/api/tournament-management', async (req, res) => {
  try {
    const { default: handler } = await import('./api/tournament-management.js');
    await handler(req, res);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message, success: false });
  }
});

// Legacy endpoints for backward compatibility - route to combined endpoint
app.get('/api/check-tournament', async (req, res) => {
  try {
    req.body = { action: 'check-notifications', ...req.body };
    req.method = 'POST'; // Convert GET to POST for combined endpoint
    const { default: handler } = await import('./api/tournament-management.js');
    await handler(req, res);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message, success: false });
  }
});

app.post('/api/cancel-tournament', async (req, res) => {
  try {
    req.body.action = 'cancel-tournament';
    const { default: handler } = await import('./api/tournament-management.js');
    await handler(req, res);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message, success: false });
  }
});

app.post('/api/check-minimum-participants', async (req, res) => {
  try {
    req.body.action = 'check-minimum-participants';
    const { default: handler } = await import('./api/tournament-management.js');
    await handler(req, res);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message, success: false });
  }
});

app.get('/api/tournament-notifications', async (req, res) => {
  try {
    req.body = { action: 'check-notifications', ...req.body };
    req.method = 'POST'; // Convert GET to POST for combined endpoint
    const { default: handler } = await import('./api/tournament-management.js');
    await handler(req, res);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message, success: false });
  }
});

app.all('/api/contact', async (req, res) => {
  try {
    // Route to new unified email service
    if (req.method === 'POST') {
      req.body.action = 'contact';
    }
    const { default: handler } = await import(`./api/email-service.js?v=${Date.now()}`);
    await handler(req, res);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message, success: false });
  }
});

app.all('/api/email-service', async (req, res) => {
  try {
    const { default: handler } = await import(`./api/email-service.js?v=${Date.now()}`);
    await handler(req, res);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message, success: false });
  }
});

app.post('/api/send-email', async (req, res) => {
  try {
    // Route to new unified email service
    req.body.action = 'general-email';
    const { default: handler } = await import(`./api/email-service.js?v=${Date.now()}`);
    await handler(req, res);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message, success: false });
  }
});

app.post('/api/start-tournament-notification', async (req, res) => {
  try {
    // Route to new unified email service
    req.body.action = 'tournament-notification';
    const { default: handler } = await import(`./api/email-service.js?v=${Date.now()}`);
    await handler(req, res);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message, success: false });
  }
});

app.get('/api/test-application-email', async (req, res) => {
  console.log('--- Running Email Test ---');
  try {
    const { default: handler } = await import(`./api/send-application-confirmation.js?v=${Date.now()}`);
    
    // Mock the request and response objects for the handler
    const mockReq = {
      method: 'POST',
      body: {
        email: 'microft1007@gmail.com',
        name: 'Email Test User'
      }
    };
    const mockRes = {
      status: (code) => {
        console.log(`Test response status: ${code}`);
        return {
          json: (data) => {
            console.log('Test response data:', data);
            // Send the final response to the browser
            res.status(code).json(data);
          }
        };
      }
    };

    await handler(mockReq, mockRes);
    
  } catch (error) {
    console.error('API Test Error:', error);
    res.status(500).json({ error: error.message, success: false });
  }
});

app.options('/api/*', (req, res) => {
  res.status(200).end();
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    success: false 
  });
});

// 404 handler for API routes only
app.use('/api/*', (req, res) => {
  console.log('404 API Not Found:', req.originalUrl || req.url);
  res.status(404).json({ 
    error: `API route ${req.originalUrl || req.url} not found`,
    success: false 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Development API server running on http://localhost:${PORT}`);
  console.log('📡 Available endpoints:');
  console.log(`  - POST http://localhost:${PORT}/api/check-tournament`);
  console.log(`  - POST http://localhost:${PORT}/api/cancel-tournament`);
  console.log(`  - ALL  http://localhost:${PORT}/api/contact`);
  console.log(`  - POST http://localhost:${PORT}/api/create-payment-order`);
  console.log(`  - POST http://localhost:${PORT}/api/health-check`);
  console.log(`  - POST http://localhost:${PORT}/api/mock-create-payment-order`);
  console.log(`  - POST http://localhost:${PORT}/api/payment-webhook`);
  console.log(`  - POST http://localhost:${PORT}/api/send-email`);
  console.log(`  - POST http://localhost:${PORT}/api/start-tournament-notification`);
  console.log(`  - GET  http://localhost:${PORT}/api/test-application-email`);
  console.log(`  - GET  http://localhost:${PORT}/api/tournament-notifications`);
  console.log(`  - POST http://localhost:${PORT}/api/verify-payment`);
  console.log(`  - POST http://localhost:${PORT}/api/withdrawal-notification`);
  console.log('');
  console.log('💡 Start your frontend with: npm run dev');
  console.log('🔄 Or run both together with: npm run dev:full');
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Please try a different port.`);
    console.error(`💡 Set DEV_API_PORT environment variable to use a different port.`);
    process.exit(1);
  } else {
    console.error('❌ Server error:', err);
    process.exit(1);
  }
});

export default app;
