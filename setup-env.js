// Environment Variable Setup Script
// Run this script before starting the development server
// This will create a .env file with the required variables

const fs = require('fs');
const path = require('path');

console.log('Setting up environment variables for development...');

// Define the environment variables
const envVars = {
  // Cashfree Payment Gateway
  VITE_CASHFREE_APP_ID: 'YOUR_CASHFREE_APP_ID', // Replace with your Cashfree App ID
  VITE_CASHFREE_ENVIRONMENT: 'SANDBOX', // 'SANDBOX' or 'PRODUCTION'
  VITE_CASHFREE_API_VERSION: '2023-08-01',

  // Server-side Cashfree variables (used in API routes)
  CASHFREE_APP_ID: 'YOUR_CASHFREE_APP_ID', // Replace with your Cashfree App ID
  CASHFREE_SECRET_KEY: 'YOUR_CASHFREE_SECRET_KEY', // Replace with your Cashfree Secret Key
  CASHFREE_ENVIRONMENT: 'SANDBOX', // 'SANDBOX' or 'PRODUCTION'
  
  // Application URLs
  VITE_APP_URL: 'http://localhost:5173',
  APP_URL: 'http://localhost:5173',
  API_URL: 'http://localhost:5173',
  
  // Firebase Configuration
  VITE_FIREBASE_API_KEY: 'YOUR_FIREBASE_API_KEY',
  VITE_FIREBASE_AUTH_DOMAIN: 'freefire-tournaments-ba2a6.firebaseapp.com',
  VITE_FIREBASE_PROJECT_ID: 'freefire-tournaments-ba2a6',
  VITE_FIREBASE_STORAGE_BUCKET: 'freefire-tournaments-ba2a6.appspot.com',
  VITE_FIREBASE_MESSAGING_SENDER_ID: 'YOUR_MESSAGING_SENDER_ID',
  VITE_FIREBASE_APP_ID: 'YOUR_FIREBASE_APP_ID',
};

// Create .env file content
const envFileContent = Object.entries(envVars)
  .map(([key, value]) => `${key}=${value}`)
  .join('\n');

// Write .env file
try {
  fs.writeFileSync(path.join(__dirname, '.env'), envFileContent);
  console.log('✅ Created .env file with required variables');
  console.log('⚠️ IMPORTANT: Replace the placeholder values with your actual credentials');
} catch (error) {
  console.error('❌ Error creating .env file:', error);
}

// Create a sample env.local.example for reference
try {
  fs.writeFileSync(path.join(__dirname, '.env.example'), envFileContent);
  console.log('✅ Created .env.example file for reference');
} catch (error) {
  console.error('❌ Error creating .env.example file:', error);
}

console.log('\n🔧 Environment setup complete. Next steps:');
console.log('1. Edit the .env file and replace placeholder values with actual credentials');
console.log('2. Run "npm run dev" to start the development server\n'); 