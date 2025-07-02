/**
 * Application configuration
 * These values should be set in environment variables for production
 */

// Cashfree Payment Gateway Configuration
export const CASHFREE_CONFIG = {
  // App ID from Cashfree Dashboard
  APP_ID: import.meta.env.VITE_CASHFREE_APP_ID || 'TEST1234567890123456789012',
  
  // Environment - 'SANDBOX' or 'PRODUCTION'
  ENVIRONMENT: import.meta.env.VITE_CASHFREE_ENVIRONMENT || 'SANDBOX',
  
  // API Version
  API_VERSION: import.meta.env.VITE_CASHFREE_API_VERSION || '2023-08-01',
  
  // Base URLs
  SANDBOX_URL: 'https://sandbox.cashfree.com/pg',
  PRODUCTION_URL: 'https://api.cashfree.com/pg',
  
  // Current base URL based on environment
  get BASE_URL() {
    return this.ENVIRONMENT === 'PRODUCTION' ? this.PRODUCTION_URL : this.SANDBOX_URL;
  },
  
  // Return URL after payment completion
  RETURN_URL: import.meta.env.VITE_APP_URL || 'http://localhost:5173/payment-status'
};

// Application URLs
export const APP_URLS = {
  BASE_URL: import.meta.env.VITE_APP_URL || 'http://localhost:5173',
  API_BASE_URL: import.meta.env.VITE_API_URL || '/api'
};

// Firebase Configuration
export const FIREBASE_CONFIG = {
  API_KEY: import.meta.env.VITE_FIREBASE_API_KEY,
  AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  STORAGE_BUCKET: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  MESSAGING_SENDER_ID: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  APP_ID: import.meta.env.VITE_FIREBASE_APP_ID
}; 