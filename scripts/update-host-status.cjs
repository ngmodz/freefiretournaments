/**
 * Script to update host status for any user
 * Usage: node update-host-status.cjs <email> <true|false>
 * Example: node update-host-status.cjs user@example.com true
 */

const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getAuth } = require('firebase-admin/auth');
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

async function updateHostStatus() {
  try {
    // Get command line arguments
    const args = process.argv.slice(2);
    if (args.length !== 2) {
      console.error('❌ Usage: node update-host-status.cjs <email> <true|false>');
      console.error('   Example: node update-host-status.cjs user@example.com true');
      process.exit(1);
    }

    const [email, hostStatusStr] = args;
    const hostStatus = hostStatusStr.toLowerCase() === 'true';

    console.log(`🚀 Starting host status update for: ${email}`);
    console.log(`📝 Setting isHost to: ${hostStatus}`);

    // Initialize Firebase services
    initializeFirebaseAdmin();
    const db = getFirestore();
    const auth = getAuth();

    // Step 1: Find user by email
    console.log('\n🔍 Looking up user by email...');
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
      console.log(`✅ Found user: ${userRecord.uid}`);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        console.error(`❌ User with email ${email} not found in Firebase Auth`);
        process.exit(1);
      } else {
        throw error;
      }
    }

    // Step 2: Check if user document exists in Firestore
    console.log('\n📋 Checking user document in Firestore...');
    const userRef = db.collection('users').doc(userRecord.uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      console.error(`❌ User document not found in Firestore for UID: ${userRecord.uid}`);
      console.log('💡 User might need to log in to the app first to create their profile');
      process.exit(1);
    }

    const userData = userDoc.data();
    console.log('👤 Current user data:', {
      email: userData.email,
      fullName: userData.fullName,
      ign: userData.ign,
      isHost: userData.isHost,
      isAdmin: userData.isAdmin,
      created_at: userData.created_at?.toDate?.() || userData.created_at
    });

    // Step 3: Update host status
    console.log(`\n🔄 Updating host status to: ${hostStatus}...`);
    try {
      await userRef.update({
        isHost: hostStatus,
        updated_at: new Date()
      });
      console.log('✅ Successfully updated host status in Firestore');
    } catch (error) {
      console.error('❌ Failed to update Firestore document:', error.message);
      throw error;
    }

    // Step 4: Set custom claims (optional, for enhanced security)
    console.log('\n🎫 Setting Firebase Auth custom claims...');
    try {
      const currentClaims = userRecord.customClaims || {};
      await auth.setCustomUserClaims(userRecord.uid, {
        ...currentClaims,
        host: hostStatus
      });
      console.log('✅ Successfully updated Firebase Auth custom claims');
    } catch (error) {
      console.error('❌ Failed to update custom claims:', error.message);
      console.log('⚠️  Firestore update succeeded, but custom claims failed');
    }

    // Step 5: Verify the update
    console.log('\n🔍 Verifying the update...');
    const updatedDoc = await userRef.get();
    const updatedData = updatedDoc.data();
    
    console.log('✅ Final verification:');
    console.log(`   Email: ${updatedData.email}`);
    console.log(`   Name: ${updatedData.fullName}`);
    console.log(`   Host Status: ${updatedData.isHost}`);
    console.log(`   Updated At: ${updatedData.updated_at?.toDate?.() || updatedData.updated_at}`);

    // Step 6: Show next steps
    console.log('\n📋 Next Steps:');
    if (hostStatus) {
      console.log('✅ User now has host privileges and can:');
      console.log('   - Create tournaments');
      console.log('   - Manage their tournaments');
      console.log('   - Access host panel features');
    } else {
      console.log('⚠️  User host privileges have been revoked');
      console.log('   - Cannot create new tournaments');
      console.log('   - Existing tournaments remain active');
    }
    
    console.log('\n🎉 Host status update completed successfully!');

  } catch (error) {
    console.error('\n❌ Error updating host status:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Show help if no arguments
if (process.argv.length <= 2) {
  console.log('🏆 Host Status Update Script');
  console.log('===========================');
  console.log('');
  console.log('Usage: node update-host-status.cjs <email> <true|false>');
  console.log('');
  console.log('Examples:');
  console.log('  Grant host privileges:  node update-host-status.cjs user@example.com true');
  console.log('  Revoke host privileges: node update-host-status.cjs user@example.com false');
  console.log('');
  console.log('Requirements:');
  console.log('  - User must exist in Firebase Auth');
  console.log('  - User must have logged into the app at least once');
  console.log('  - Firebase Admin SDK credentials must be configured');
  console.log('');
  process.exit(0);
}

// Run the script
updateHostStatus();
