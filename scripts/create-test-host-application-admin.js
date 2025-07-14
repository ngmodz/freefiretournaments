/**
 * Script to create a test host application using Firebase Admin SDK
 * Usage: node create-test-host-application-admin.js
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { getFirestore } = require('./secure-firebase-admin.js');

async function createTestHostApplication() {
  try {
    console.log('🚀 Creating test host application with Admin SDK...');

    const db = getFirestore();
    
    const testApplication = {
      userId: 'test-user-id-' + Date.now(),
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
    console.log('� Full Name:', testApplication.userName);
    console.log('�📝 Status:', testApplication.status);
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
