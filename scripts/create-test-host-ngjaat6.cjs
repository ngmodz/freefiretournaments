/**
 * Script to create a test host application for ngjaat6@gmail.com using Firebase Admin SDK
 * Usage: node create-test-host-ngjaat6.cjs
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

async function createTestHostApplication() {
  try {
    console.log('🚀 Creating test host application for ngjaat6@gmail.com...');

    // Initialize Firebase Admin
    initializeFirebaseAdmin();
    const db = getFirestore();
    
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

    const docRef = await db.collection('hostApplications').add(testApplication);
    console.log('✅ Test host application created with ID:', docRef.id);
    console.log('📧 Application email:', testApplication.userEmail);
    console.log('👤 Full Name:', testApplication.userName);
    console.log('📝 Status:', testApplication.status);
    console.log('');
    console.log('🎯 Next steps:');
    console.log('1. Log into the admin panel at http://localhost:8083/admin');
    console.log('2. Navigate to Host Panel');
    console.log('3. Find this application and click approve');
    console.log('4. Check if the email is sent to ngjaat6@gmail.com');
    console.log('5. Verify the email shows "Congratulations, Nishant Grewal!" instead of "User"');

  } catch (error) {
    console.error('❌ Error creating test host application:', error);
  }
}

// Run the function
createTestHostApplication()
  .then(() => {
    console.log('Test host application creation completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error in test host application creation:', error);
    process.exit(1);
  });
