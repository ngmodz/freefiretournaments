/**
 * Script to update host status for any user
 * Usage: node update-host-status.js <email> <true|false>
 * Example: node update-host-status.js user@example.com true
 */

import { getFirestore, getAuth } from './secure-firebase-admin.js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
const envPath = resolve(process.cwd(), '.env');
console.log(`Loading environment variables from: ${envPath}`);
config({ path: envPath });

async function updateHostStatus() {
  try {
    // Get command line arguments
    const args = process.argv.slice(2);
    if (args.length !== 2) {
      console.error('❌ Usage: node update-host-status.js <email> <true|false>');
      console.error('   Example: node update-host-status.js user@example.com true');
      process.exit(1);
    }

    const [email, hostStatusStr] = args;
    const hostStatus = hostStatusStr.toLowerCase() === 'true';

    console.log(`🚀 Starting host status update for: ${email}`);
    console.log(`📝 Setting isHost to: ${hostStatus}`);

    // Initialize Firebase services
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
  console.log('Usage: node update-host-status.js <email> <true|false>');
  console.log('');
  console.log('Examples:');
  console.log('  Grant host privileges:  node update-host-status.js user@example.com true');
  console.log('  Revoke host privileges: node update-host-status.js user@example.com false');
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
