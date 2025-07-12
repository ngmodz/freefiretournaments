// Script to check environment variables and configuration
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env') });

console.log('🔍 Environment Configuration Check');
console.log('─'.repeat(50));

// Check Firebase configuration
console.log('\n📱 Firebase Configuration:');
const firebaseVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_STORAGE_BUCKET'
];

firebaseVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`❌ ${varName}: Not set`);
  }
});

// Check Firebase Admin configuration
console.log('\n🔐 Firebase Admin Configuration:');
const adminVars = [
  'FIREBASE_SERVICE_ACCOUNT',
  'FIREBASE_SERVICE_ACCOUNT_KEY',
  'SERVICE_ACCOUNT_KEY',
  'SERVICE_ACCOUNT_KEY_PATH',
  'GOOGLE_APPLICATION_CREDENTIALS'
];

let hasAdminConfig = false;
adminVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 50)}...`);
    hasAdminConfig = true;
  } else {
    console.log(`❌ ${varName}: Not set`);
  }
});

if (!hasAdminConfig) {
  console.log('\n⚠️  No Firebase Admin configuration found!');
  console.log('You need to set up Firebase Admin credentials to use the admin panel.');
}

// Check Email configuration
console.log('\n📧 Email Configuration:');
const emailVars = [
  'EMAIL_USER',
  'EMAIL_PASSWORD'
];

emailVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    if (varName.includes('PASSWORD')) {
      console.log(`✅ ${varName}: ${'*'.repeat(Math.min(value.length, 8))}`);
    } else {
      console.log(`✅ ${varName}: ${value}`);
    }
  } else {
    console.log(`❌ ${varName}: Not set`);
  }
});

// Check CashFree configuration
console.log('\n💳 CashFree Configuration:');
const cashfreeVars = [
  'CASHFREE_APP_ID',
  'CASHFREE_SECRET_KEY',
  'CASHFREE_ENVIRONMENT'
];

cashfreeVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    if (varName.includes('SECRET')) {
      console.log(`✅ ${varName}: ${'*'.repeat(Math.min(value.length, 8))}`);
    } else {
      console.log(`✅ ${varName}: ${value}`);
    }
  } else {
    console.log(`❌ ${varName}: Not set`);
  }
});

console.log('\n─'.repeat(50));

// Summary
console.log('\n📋 Summary:');
const missingVars = [];

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
  missingVars.push('Email configuration (required for admin notifications)');
}

if (!hasAdminConfig) {
  missingVars.push('Firebase Admin configuration (required for admin panel)');
}

if (missingVars.length === 0) {
  console.log('✅ All required configurations are set!');
  console.log('You should be able to use the admin panel.');
} else {
  console.log('❌ Missing configurations:');
  missingVars.forEach(item => console.log(`  - ${item}`));
  console.log('\nPlease check your .env file and add the missing configurations.');
}

console.log('\n💡 Tips:');
console.log('1. Make sure your .env file is in the project root');
console.log('2. For Firebase Admin, you can use either:');
console.log('   - FIREBASE_SERVICE_ACCOUNT (JSON string)');
console.log('   - SERVICE_ACCOUNT_KEY_PATH (file path)');
console.log('3. For email notifications, use Gmail with App Password'); 