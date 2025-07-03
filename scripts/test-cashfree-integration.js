// CashFree Integration Test Script
// Run this in browser console to test the integration

console.log('🧪 Testing CashFree Integration...');

// Check if environment variables are loaded
const config = {
  appId: import.meta.env.VITE_CASHFREE_APP_ID,
  environment: import.meta.env.VITE_CASHFREE_ENVIRONMENT,
  apiVersion: import.meta.env.VITE_CASHFREE_API_VERSION,
  returnUrl: import.meta.env.VITE_RETURN_URL
};

console.log('📋 Configuration:', config);

// Validate configuration
const validationResults = {
  hasAppId: !!config.appId && config.appId !== 'YOUR_CASHFREE_APP_ID',
  hasEnvironment: !!config.environment,
  hasReturnUrl: !!config.returnUrl,
  isValidEnvironment: ['SANDBOX', 'PRODUCTION'].includes(config.environment)
};

console.log('✅ Validation Results:', validationResults);

// Test CashFree service availability
import('./src/lib/cashfreeService.ts').then(module => {
  console.log('📦 CashFree Service loaded:', !!module.CashFreeService);
  console.log('🔧 Available methods:', Object.getOwnPropertyNames(module.CashFreeService));
}).catch(error => {
  console.error('❌ Failed to load CashFree Service:', error);
});

// Test payment service availability
import('./src/lib/paymentService.ts').then(module => {
  console.log('💳 Payment Service loaded:', !!module.PaymentService);
  const instance = module.PaymentService.getInstance();
  console.log('🏭 Payment Service instance:', !!instance);
}).catch(error => {
  console.error('❌ Failed to load Payment Service:', error);
});

// Check if all required environment variables are set
const requiredEnvVars = [
  'VITE_CASHFREE_APP_ID',
  'VITE_CASHFREE_ENVIRONMENT',
  'VITE_RETURN_URL'
];

const missingEnvVars = requiredEnvVars.filter(varName => 
  !import.meta.env[varName] || import.meta.env[varName].startsWith('YOUR_')
);

if (missingEnvVars.length > 0) {
  console.warn('⚠️ Missing environment variables:', missingEnvVars);
  console.log('📝 Please update your .env file with actual CashFree credentials');
} else {
  console.log('✅ All required environment variables are set');
}

// Test Vercel API availability
fetch('/api/health-check')
  .then(res => res.json())
  .then(data => console.log('🏥 Vercel API health:', data))
  .catch(error => console.warn('⚠️ Vercel API not available:', error.message));

console.log('🎯 Integration test completed. Check results above.');
