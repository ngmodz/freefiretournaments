/**
 * Debug script to check current user permissions
 * Usage: node debug-user-permissions.cjs <email>
 */

const { initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
const admin = require('firebase-admin');
const { config } = require('dotenv');
const { resolve } = require('path');
const fs = require('fs');

// Load environment variables
const envPath = resolve(__dirname, '..', '.env');
console.log(`Loading environment variables from: ${envPath}`);
config({ path: envPath });

// Initialize Firebase Admin SDK
let firebaseApp = null;

function initializeFirebaseAdmin() {
  if (firebaseApp) {
    return firebaseApp;
  }

  try {
    let serviceAccount = null;
    
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        console.log('✅ Using Firebase service account from environment variable');
      } catch (parseError) {
        console.error('❌ Error parsing FIREBASE_SERVICE_ACCOUNT_KEY:', parseError.message);
        throw parseError;
      }
    } else if (process.env.SERVICE_ACCOUNT_KEY_PATH) {
      const serviceAccountPath = process.env.SERVICE_ACCOUNT_KEY_PATH;
      if (fs.existsSync(serviceAccountPath)) {
        serviceAccount = require(serviceAccountPath);
        console.log('✅ Using Firebase service account from file path');
      } else {
        throw new Error(`Service account file not found: ${serviceAccountPath}`);
      }
    } else {
      console.log('⚠️  No explicit service account found, trying default application credentials...');
      firebaseApp = admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
      console.log('✅ Firebase Admin SDK initialized with default credentials');
      return firebaseApp;
    }

    if (!serviceAccount || !serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
      throw new Error('Invalid service account configuration. Missing required fields.');
    }

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    
    console.log('✅ Firebase Admin SDK initialized successfully');
    return firebaseApp;
    
  } catch (error) {
    console.error('❌ Error initializing Firebase Admin SDK:', error.message);
    throw error;
  }
}

async function debugUserPermissions() {
  try {
    const args = process.argv.slice(2);
    if (args.length !== 1) {
      console.error('❌ Usage: node debug-user-permissions.cjs <email>');
      console.error('   Example: node debug-user-permissions.cjs nishantgrewal2005@gmail.com');
      process.exit(1);
    }

    const [email] = args;
    console.log(`🔍 Debugging permissions for: ${email}`);

    // Initialize Firebase services
    initializeFirebaseAdmin();
    const auth = getAuth();
    const db = getFirestore();

    // Step 1: Get user from Firebase Auth
    console.log('\n1️⃣ Firebase Auth Information:');
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
      console.log(`   ✅ User found in Firebase Auth`);
      console.log(`   📧 Email: ${userRecord.email}`);
      console.log(`   🆔 UID: ${userRecord.uid}`);
      console.log(`   ✉️  Email Verified: ${userRecord.emailVerified}`);
      console.log(`   👤 Display Name: ${userRecord.displayName || 'Not set'}`);
    } catch (error) {
      console.log(`   ❌ User not found in Firebase Auth: ${error.message}`);
      return;
    }

    // Step 2: Check Firebase Auth Custom Claims
    console.log('\n2️⃣ Firebase Auth Custom Claims:');
    try {
      const userWithClaims = await auth.getUser(userRecord.uid);
      const customClaims = userWithClaims.customClaims || {};
      console.log(`   📋 Custom Claims:`, customClaims);
      console.log(`   🔑 admin claim: ${customClaims.admin || false}`);
      console.log(`   🏆 host claim: ${customClaims.host || false}`);
      
      if (Object.keys(customClaims).length === 0) {
        console.log('   ⚠️  No custom claims found!');
      }
    } catch (error) {
      console.log(`   ❌ Error getting custom claims: ${error.message}`);
    }

    // Step 3: Check Firestore User Document
    console.log('\n3️⃣ Firestore User Document:');
    try {
      const userDocRef = db.collection('users').doc(userRecord.uid);
      const userDoc = await userDocRef.get();
      
      if (userDoc.exists) {
        const userData = userDoc.data();
        console.log(`   ✅ User document found in Firestore`);
        console.log(`   📧 Email: ${userData.email}`);
        console.log(`   👤 Full Name: ${userData.fullName}`);
        console.log(`   🎮 IGN: ${userData.ign}`);
        console.log(`   🏆 isHost: ${userData.isHost || false}`);
        console.log(`   🔑 isAdmin: ${userData.isAdmin || false}`);
        console.log(`   📅 Created: ${userData.created_at?.toDate?.() || userData.created_at}`);
        console.log(`   🔄 Updated: ${userData.updated_at?.toDate?.() || userData.updated_at}`);
      } else {
        console.log(`   ❌ User document not found in Firestore`);
      }
    } catch (error) {
      console.log(`   ❌ Error reading Firestore document: ${error.message}`);
    }

    // Step 4: Check what the Firestore rules require
    console.log('\n4️⃣ Firestore Rules Analysis:');
    console.log('   📋 Host Applications require: request.auth.token.admin == true');
    console.log('   📋 User Profile updates for isHost require: admin token claims OR specific conditions');
    
    // Step 5: Recommendations
    console.log('\n5️⃣ Recommendations:');
    const userWithClaims2 = await auth.getUser(userRecord.uid);
    const customClaims = userWithClaims2.customClaims || {};
    
    if (!customClaims.admin) {
      console.log('   🔧 ISSUE: User lacks admin custom claims');
      console.log('   💡 SOLUTION: Set admin custom claims with the following command:');
      console.log(`   📝 Command: node set-admin-claims.cjs ${email}`);
    } else {
      console.log('   ✅ User has admin custom claims');
    }
    
    if (!customClaims.host) {
      console.log('   🔧 NOTE: User lacks host custom claims (optional)');
    }

  } catch (error) {
    console.error('\n❌ Error debugging user permissions:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the script
debugUserPermissions();
