/**
 * Standalone script to test the host application confirmation email.
 * This script is self-contained to avoid module loading issues.
 *
 * Usage: node scripts/run-test.js
 */

import dotenv from 'dotenv';
import admin from 'firebase-admin';
import path from 'path';
import { fileURLToPath } from 'url';

// --- 1. Load Environment Variables ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '..', '.env');

console.log(`Attempting to load environment variables from: ${envPath}`);
dotenv.config({ path: envPath });


// --- 2. Initialize Firebase Admin SDK ---
let firebaseApp = null;
try {
  console.log('Initializing Firebase Admin SDK...');
  
  const serviceAccountJSON = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!serviceAccountJSON) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT not found in environment variables. Please check your .env file.');
  }
  
  const serviceAccount = JSON.parse(serviceAccountJSON);

  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  console.log('✅ Firebase Admin SDK initialized successfully.');

} catch (error) {
  console.error('❌ Error initializing Firebase Admin SDK:', error.message);
  process.exit(1); // Exit if Firebase can't be initialized
}


// --- 3. Create Test Host Application ---
async function createTestApplicationForEmail() {
  try {
    console.log('🚀 Creating a test host application to trigger confirmation email...');

    const db = admin.firestore();

    const testApplication = {
      userId: 'aDYdh0V2SwXt45Y11Iqti4UdM5o1', // UID for microft1007@gmail.com
      userEmail: 'microft1007@gmail.com',
      userName: 'Microft Test',
      fullName: 'Microft Test',
      experience: 'Testing the email confirmation functionality.',
      reason: 'To verify that the onCreate trigger sends a confirmation email.',
      status: 'pending',
      submittedAt: new Date(),
    };

    const docRef = await db.collection('hostApplications').add(testApplication);

    console.log('✅ Test host application created with ID:', docRef.id);
    console.log(`📧 Application from: ${testApplication.userEmail}`);
    console.log('--------------------------------------------------');
    console.log('👍 Success! The Cloud Function should now be triggered.');
    console.log('📬 Please check the inbox of "microft1007@gmail.com" for the confirmation email.');
    console.log('   (It may take a minute or two to arrive).');
    console.log('--------------------------------------------------');

  } catch (error) {
    console.error('❌ Error creating test host application:', error);
  }
}

// --- 4. Run the Test ---
createTestApplicationForEmail(); 