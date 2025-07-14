/**
 * Script to delete the bad test host application and create a new one with real user ID
 */

const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const admin = require('firebase-admin');
const { config } = require('dotenv');
const { resolve } = require('path');

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
    
    // Use FIREBASE_SERVICE_ACCOUNT from environment
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        console.log('✅ Using Firebase service account from environment variable');
      } catch (parseError) {
        console.error('❌ Error parsing FIREBASE_SERVICE_ACCOUNT:', parseError.message);
        throw parseError;
      }
    } else {
      throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable not found');
    }

    firebaseApp = initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id
    });

    console.log('✅ Firebase Admin SDK initialized successfully');
    return firebaseApp;
  } catch (error) {
    console.error('❌ Error initializing Firebase Admin SDK:', error.message);
    throw error;
  }
}

async function fixTestApplication() {
  try {
    console.log('🔧 Fixing test host application...');

    // Initialize Firebase Admin
    initializeFirebaseAdmin();
    const db = getFirestore();
    
    // Delete the bad application (ID: 3hH8VM1rd8xnn4Cvonzi)
    console.log('🗑️ Deleting bad application...');
    await db.collection('hostApplications').doc('3hH8VM1rd8xnn4Cvonzi').delete();
    console.log('✅ Bad application deleted');
    
    // Create new application with real user ID
    const testApplication = {
      userId: 'hhLOv1lRhIh6Vr6BemWFQYIUuMe2', // Real user ID for ngjaat6@gmail.com
      userEmail: 'ngjaat6@gmail.com',
      userName: 'Nishant Grewal',
      fullName: 'Nishant Grewal',
      userIgn: 'NGModz',
      experience: 'I have been organizing gaming events for over 3 years and have extensive experience with Free Fire tournaments. I have successfully hosted multiple community events.',
      reason: 'I want to create fair and competitive tournaments for the Free Fire community and help grow the gaming scene.',
      preferredGameModes: 'Solo, Duo, Squad, Clash Squad',
      availability: 'Weekends and evenings from 6-10 PM',
      contactInfo: 'Available on Discord: NGModz#1234 and WhatsApp',
      status: 'pending',
      submittedAt: new Date(),
      reviewedAt: null,
      reviewedBy: null,
      reviewNotes: ''
    };

    console.log('📝 Creating new application with real user ID...');
    const docRef = await db.collection('hostApplications').add(testApplication);
    console.log('✅ New test host application created with ID:', docRef.id);
    console.log('📧 Application email:', testApplication.userEmail);
    console.log('👤 Full Name:', testApplication.userName);
    console.log('🆔 Real User ID:', testApplication.userId);
    console.log('📝 Status:', testApplication.status);
    console.log('');
    console.log('🎯 Next steps:');
    console.log('1. Refresh the admin panel at http://localhost:8083/admin');
    console.log('2. Navigate to Host Panel');
    console.log('3. Find the new application for "Nishant Grewal"');
    console.log('4. Click "Approve" (this should work now!)');
    console.log('5. Check ngjaat6@gmail.com for the approval email');
    console.log('6. Verify the email shows "Congratulations, Nishant Grewal!"');

  } catch (error) {
    console.error('❌ Error fixing test application:', error);
  }
}

// Run the function
fixTestApplication()
  .then(() => {
    console.log('✅ Test application fix completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error in test application fix:', error);
    process.exit(1);
  });
