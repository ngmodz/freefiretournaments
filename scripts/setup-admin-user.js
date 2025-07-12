// Script to set up admin users
import admin from 'firebase-admin';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables with enhanced debugging
const envPath = resolve(process.cwd(), '.env');
console.log(`--- Loading environment variables from: ${envPath} ---`);
const result = config({ path: envPath, debug: true });

if (result.error) {
  console.error('❌ DOTENV ERROR:', result.error);
}

console.log('\n--- Environment variable check ---');
console.log('💡 Parsed by dotenv:', result.parsed ? Object.keys(result.parsed).join(', ') : 'None');
console.log('💡 SERVICE_ACCOUNT_KEY_PATH from process.env:', process.env.SERVICE_ACCOUNT_KEY_PATH || 'Not set');
console.log('-------------------------------------\n');


// Initialize Firebase Admin SDK
let serviceAccount;
const serviceAccountPath = process.env.SERVICE_ACCOUNT_KEY_PATH;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      console.log('✅ Initializing with FIREBASE_SERVICE_ACCOUNT (JSON string)');
    } catch (e) {
        console.error('❌ FIREBASE_SERVICE_ACCOUNT is not valid JSON.', e.message);
        process.exit(1);
    }
} else if (serviceAccountPath) {
    console.log(`✅ Initializing with SERVICE_ACCOUNT_KEY_PATH: ${serviceAccountPath}`);
    try {
        // The credential will be loaded from the file path directly by admin.initializeApp
        serviceAccount = serviceAccountPath;
    } catch (e) {
        console.error(`❌ Could not read service account file from ${serviceAccountPath}`, e.message);
        process.exit(1);
    }
}

if (!serviceAccount) {
    console.error('❌ Firebase Admin credentials not found.');
    console.error('Please set FIREBASE_SERVICE_ACCOUNT or SERVICE_ACCOUNT_KEY_PATH in your .env file.');
    process.exit(1);
}

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('✅ Firebase Admin initialized successfully.');
  } catch (error) {
    console.error('❌ Error initializing Firebase Admin:', error.message);
    process.exit(1);
  }
}

const db = admin.firestore();

async function setupAdminUser(userId, isAdmin = true) {
  try {
    // Set the custom claim on the user's auth token
    await admin.auth().setCustomUserClaims(userId, { admin: isAdmin });
    console.log(`✅ Successfully set custom admin claim for user ${userId}`);

    // Update the Firestore document for consistency in the UI
    const userRef = db.collection('users').doc(userId);
    await userRef.update({
      isAdmin: isAdmin,
      adminSetupAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`✅ Successfully updated Firestore document for user ${userId}`);
    return true;
  } catch (error) {
    console.error(`❌ Error setting up admin user ${userId}:`, error);
    return false;
  }
}

async function listAllUsers() {
  try {
    console.log('Fetching all users...');
    
    const usersSnapshot = await db.collection('users').get();
    
    if (usersSnapshot.empty) {
      console.log('No users found');
      return;
    }
    
    console.log(`\nFound ${usersSnapshot.size} users:`);
    console.log('─'.repeat(80));
    
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      const isAdmin = userData.isAdmin ? '✅ ADMIN' : '❌ USER';
      const email = userData.email || 'No email';
      const displayName = userData.displayName || userData.fullName || 'No name';
      
      console.log(`${isAdmin} | ${doc.id} | ${email} | ${displayName}`);
    });
    
    console.log('─'.repeat(80));
  } catch (error) {
    console.error('Error listing users:', error);
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage:');
    console.log('  node setup-admin-user.js <userId> [true|false]');
    console.log('  node setup-admin-user.js --list');
    console.log('');
    console.log('Examples:');
    console.log('  node setup-admin-user.js AQlc4h5ZcRfViznAmVX1E2YwfCV2');
    console.log('  node setup-admin-user.js AQlc4h5ZcRfViznAmVX1E2YwfCV2 true');
    console.log('  node setup-admin-user.js AQlc4h5ZcRfViznAmVX1E2YwfCV2 false');
    console.log('  node setup-admin-user.js --list');
    return;
  }
  
  if (args[0] === '--list') {
    await listAllUsers();
    return;
  }
  
  const userId = args[0];
  const isAdmin = args[1] !== 'false'; // Default to true unless explicitly set to false
  
  console.log(`Setting up admin user: ${userId} (isAdmin: ${isAdmin})`);
  
  const success = await setupAdminUser(userId, isAdmin);
  
  if (success) {
    console.log('\n✅ Admin user setup completed successfully!');
    console.log(`User ${userId} can now access the admin panel at /admin.`);
    console.log('\n🚨 IMPORTANT: The user must LOG OUT and LOG BACK IN for the new permissions to take effect.');
  } else {
    console.log('\n❌ Admin user setup failed!');
    process.exit(1);
  }
}

main().catch(console.error).finally(() => {
  process.exit(0);
}); 