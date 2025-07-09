import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env file in scripts directory
config({ path: resolve(process.cwd(), 'scripts', '.env') });

// Firebase configuration using environment variables
export const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

// Validate that ALL required environment variables are set
const requiredEnvVars = [
  'FIREBASE_API_KEY',
  'FIREBASE_AUTH_DOMAIN',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_STORAGE_BUCKET',
  'FIREBASE_MESSAGING_SENDER_ID',
  'FIREBASE_APP_ID'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}. Please set them in scripts/.env file`);
}

// Log configuration status (without exposing sensitive data)
console.log('Firebase configuration loaded successfully:', {
  apiKey: firebaseConfig.apiKey ? `${firebaseConfig.apiKey.substring(0, 6)}...` : 'NOT SET',
  authDomain: firebaseConfig.authDomain || 'NOT SET',
  projectId: firebaseConfig.projectId || 'NOT SET',
  storageBucket: firebaseConfig.storageBucket || 'NOT SET',
  messagingSenderId: firebaseConfig.messagingSenderId ? 'SET' : 'NOT SET',
  appId: firebaseConfig.appId ? `${firebaseConfig.appId.substring(0, 10)}...` : 'NOT SET',
});

export default firebaseConfig;
