/**
 * Script to list existing users in Firebase Auth
 * Usage: node list-users.cjs
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
    
    // Option 1: Use environment variable with full JSON
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        console.log('✅ Using Firebase service account from environment variable');
      } catch (parseError) {
        console.error('❌ Error parsing FIREBASE_SERVICE_ACCOUNT_KEY:', parseError.message);
        throw parseError;
      }
    }
    
    // Option 2: Use service account file path
    else if (process.env.SERVICE_ACCOUNT_KEY_PATH) {
      const serviceAccountPath = process.env.SERVICE_ACCOUNT_KEY_PATH;
      if (fs.existsSync(serviceAccountPath)) {
        serviceAccount = require(serviceAccountPath);
        console.log('✅ Using Firebase service account from file path');
      } else {
        throw new Error(`Service account file not found: ${serviceAccountPath}`);
      }
    }
    
    // Option 3: Try default application credentials
    else {
      console.log('⚠️  No explicit service account found, trying default application credentials...');
      firebaseApp = admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
      console.log('✅ Firebase Admin SDK initialized with default credentials');
      return firebaseApp;
    }

    // Validate service account
    if (!serviceAccount || !serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
      throw new Error('Invalid service account configuration. Missing required fields.');
    }

    // Initialize Firebase Admin
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

async function listUsers() {
  try {
    console.log('🚀 Starting user listing...');

    // Initialize Firebase services
    initializeFirebaseAdmin();
    const auth = getAuth();
    const db = getFirestore();

    console.log('\n👥 Fetching users from Firebase Auth...');
    
    // List users
    const listUsersResult = await auth.listUsers(1000); // Max 1000 users
    
    console.log(`✅ Found ${listUsersResult.users.length} users in Firebase Auth\n`);
    
    // Show user details
    for (let i = 0; i < Math.min(listUsersResult.users.length, 10); i++) {
      const user = listUsersResult.users[i];
      
      console.log(`👤 User ${i + 1}:`);
      console.log(`   UID: ${user.uid}`);
      console.log(`   Email: ${user.email || 'No email'}`);
      console.log(`   Display Name: ${user.displayName || 'No display name'}`);
      console.log(`   Email Verified: ${user.emailVerified}`);
      console.log(`   Created: ${user.metadata.creationTime}`);
      console.log(`   Last Sign In: ${user.metadata.lastSignInTime || 'Never'}`);
      
      // Check Firestore document
      try {
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log(`   Firestore Data:`);
          console.log(`     Full Name: ${userData.fullName || 'Not set'}`);
          console.log(`     IGN: ${userData.ign || 'Not set'}`);
          console.log(`     isHost: ${userData.isHost || false}`);
          console.log(`     isAdmin: ${userData.isAdmin || false}`);
        } else {
          console.log(`   Firestore Data: No document found`);
        }
      } catch (docError) {
        console.log(`   Firestore Data: Error reading document`);
      }
      
      console.log('   ---');
    }
    
    if (listUsersResult.users.length > 10) {
      console.log(`\n... and ${listUsersResult.users.length - 10} more users`);
    }
    
    console.log('\n🎉 User listing completed!');
    
    // Suggest a non-admin user for testing
    const nonHostUsers = [];
    for (const user of listUsersResult.users.slice(0, 10)) {
      if (user.email && user.email !== 'nishantgrewal2005@gmail.com') {
        try {
          const userDoc = await db.collection('users').doc(user.uid).get();
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (!userData.isHost) {
              nonHostUsers.push({
                email: user.email,
                name: userData.fullName || 'Unknown',
                ign: userData.ign || 'Unknown'
              });
            }
          }
        } catch (error) {
          // Skip this user
        }
      }
    }
    
    console.log('\n💡 Suggested users for host privilege testing:');
    if (nonHostUsers.length > 0) {
      nonHostUsers.slice(0, 3).forEach((user, index) => {
        console.log(`${index + 1}. ${user.email} (${user.name} / ${user.ign})`);
        console.log(`   Command: node update-host-status.cjs ${user.email} true`);
      });
    } else {
      console.log('   No non-host users found in the first 10 users.');
      console.log('   You may need to create a new user account by signing up in the app.');
    }

  } catch (error) {
    console.error('\n❌ Error listing users:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the script
listUsers();
