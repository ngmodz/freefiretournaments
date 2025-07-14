/**
 * Secure Firebase Admin SDK Configuration
 * Handles service account credentials from environment variables
 */

import dotenv from 'dotenv';
import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Load .env file from the project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });


// Recreate __dirname for ES Modules
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

let firebaseApp = null;

/**
 * Initialize Firebase Admin SDK securely
 * @returns {Object} Firebase Admin app instance
 */
export function initializeFirebaseAdmin() {
  if (firebaseApp) {
    return firebaseApp;
  }

  try {
    let serviceAccount = null;
    
    // Option 1: Use environment variable with full JSON (RECOMMENDED)
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        console.log('✅ Using Firebase service account from environment variable');
      } catch (parseError) {
        console.error('❌ Error parsing FIREBASE_SERVICE_ACCOUNT_KEY:', parseError.message);
        throw parseError;
      }
    }
    
    // Option 2: Use individual environment variables
    else if (process.env.FIREBASE_SERVICE_ACCOUNT_PROJECT_ID && 
             process.env.FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY && 
             process.env.FIREBASE_SERVICE_ACCOUNT_CLIENT_EMAIL) {
      serviceAccount = {
        type: process.env.FIREBASE_SERVICE_ACCOUNT_TYPE || 'service_account',
        project_id: process.env.FIREBASE_SERVICE_ACCOUNT_PROJECT_ID,
        private_key_id: process.env.FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_SERVICE_ACCOUNT_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_SERVICE_ACCOUNT_CLIENT_ID,
        auth_uri: process.env.FIREBASE_SERVICE_ACCOUNT_AUTH_URI || 'https://accounts.google.com/o/oauth2/auth',
        token_uri: process.env.FIREBASE_SERVICE_ACCOUNT_TOKEN_URI || 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: process.env.FIREBASE_SERVICE_ACCOUNT_AUTH_PROVIDER_X509_CERT_URL || 'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url: process.env.FIREBASE_SERVICE_ACCOUNT_CLIENT_X509_CERT_URL,
        universe_domain: process.env.FIREBASE_SERVICE_ACCOUNT_UNIVERSE_DOMAIN || 'googleapis.com'
      };
      console.log('✅ Using Firebase service account from individual environment variables');
    }
    
    // Option 3: Fallback to secure file (NOT RECOMMENDED for production)
    else {
      const secureFilePath = path.join(__dirname, '..', 'firebase-service-account.json.SECURE');
      if (fs.existsSync(secureFilePath)) {
        // For ES Modules, we need to read and parse JSON files, not require() them.
        const fileContents = fs.readFileSync(secureFilePath, 'utf8');
        serviceAccount = JSON.parse(fileContents);
        console.log('⚠️  Using Firebase service account from secure file (not recommended for production)');
      } else {
        throw new Error('No Firebase service account configuration found. Please set up environment variables.');
      }
    }
    
    // Validate service account
    if (!serviceAccount || !serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
      throw new Error('Invalid service account configuration. Missing required fields.');
    }
    
    // Initialize Firebase Admin
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://${serviceAccount.project_id}-default-rtdb.firebaseio.com`
    });
    
    console.log('✅ Firebase Admin SDK initialized successfully');
    return firebaseApp;
    
  } catch (error) {
    console.error('❌ Error initializing Firebase Admin SDK:', error.message);
    console.error('🔧 Please check your Firebase service account configuration');
    throw error;
  }
}

/**
 * Get Firestore instance
 * @returns {Object} Firestore instance
 */
export function getFirestore() {
  const app = initializeFirebaseAdmin();
  return admin.firestore(app);
}

/**
 * Get Auth instance
 * @returns {Object} Auth instance
 */
export function getAuth() {
  const app = initializeFirebaseAdmin();
  return admin.auth(app);
}

// Export admin for direct use if needed
export { admin };
