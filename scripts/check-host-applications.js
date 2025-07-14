/**
 * Script to check host applications in Firestore
 * Usage: node check-host-applications.js
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { firebaseConfig } from './firebase-config-es.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkHostApplications() {
  try {
    console.log('🔍 Checking host applications...');

    const applicationsRef = collection(db, 'hostApplications');
    const snapshot = await getDocs(applicationsRef);
    
    if (snapshot.empty) {
      console.log('❌ No host applications found in the database.');
      return;
    }

    console.log(`✅ Found ${snapshot.size} host application(s):`);
    console.log('');

    snapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`Application ID: ${doc.id}`);
      console.log(`User Email: ${data.userEmail}`);
      console.log(`User Name: ${data.userName || 'N/A'}`);
      console.log(`Status: ${data.status}`);
      console.log(`Submitted: ${data.submittedAt?.toDate?.() || data.submittedAt}`);
      if (data.reviewedAt) {
        console.log(`Reviewed: ${data.reviewedAt?.toDate?.() || data.reviewedAt}`);
      }
      console.log('---');
    });

  } catch (error) {
    console.error('❌ Error checking host applications:', error);
  }
}

// Run the function
checkHostApplications()
  .then(() => {
    console.log('Host applications check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error in host applications check:', error);
    process.exit(1);
  });
