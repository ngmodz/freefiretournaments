import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.DEV_API_PORT || 3001;

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
    const { default: handler } = await import('./api/create-payment-order.js');
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

app.get('/api/health-check', async (req, res) => {
  try {
    const { default: handler } = await import('./api/health-check.js');
    await handler(req, res);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message, success: false });
  }
});

app.get('/api/tournament-notifications', async (req, res) => {
  try {
    const { default: handler } = await import('./api/tournament-notifications.js');
    await handler(req, res);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: error.message, success: false });
  }
});

app.get('/api/check-tournament', async (req, res) => {
  try {
    const { default: handler } = await import('./api/check-tournament.js');
    await handler(req, res);
  } catch (error) {
    console.error('API Error:', error);
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
  console.log(`  - GET  http://localhost:${PORT}/api/health-check`);
  console.log(`  - POST http://localhost:${PORT}/api/create-payment-order`);
  console.log(`  - POST http://localhost:${PORT}/api/mock-create-payment-order`);
  console.log(`  - POST http://localhost:${PORT}/api/payment-webhook`);
  console.log(`  - POST http://localhost:${PORT}/api/verify-payment`);
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
