import dotenv from 'dotenv';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { createRequire } from 'module';
import fs from 'fs';

// Initialize dotenv
dotenv.config();

// Create require function
const require = createRequire(import.meta.url);

// Initialize Firebase Admin
const serviceAccountPath = process.env.SERVICE_ACCOUNT_KEY_PATH;
console.log(`Loading service account from: ${serviceAccountPath}`);

try {
  let serviceAccount;
  
  // Check if the path is absolute or relative
  if (serviceAccountPath.startsWith('/') || /^[A-Z]:\\/.test(serviceAccountPath)) {
    // Read the file directly for absolute paths
    const rawData = fs.readFileSync(serviceAccountPath);
    serviceAccount = JSON.parse(rawData);
  } else {
    // Use require for relative paths
    serviceAccount = require(serviceAccountPath);
  }
  
  initializeApp({
    credential: cert(serviceAccount),
  });
  
  console.log("Firebase Admin initialized successfully");
  
  // Function to check withdrawal request fields
  async function checkWithdrawalFields() {
    try {
      const db = getFirestore();
      const snapshot = await db.collection('withdrawalRequests').limit(1).get();
      
      if (snapshot.empty) {
        console.log('No withdrawal requests found.');
        return;
      }
      
      // Get the first document
      const doc = snapshot.docs[0];
      const data = doc.data();
      
      console.log('Document ID:', doc.id);
      console.log('Fields in withdrawal request:');
      
      // Print all fields and their values
      Object.keys(data).forEach(key => {
        const value = data[key];
        let displayValue;
        
        if (value && typeof value.toDate === 'function') {
          displayValue = value.toDate().toString();
        } else if (typeof value === 'object') {
          displayValue = JSON.stringify(value);
        } else {
          displayValue = value;
        }
        
        console.log(`- ${key}: ${displayValue}`);
      });
      
    } catch (error) {
      console.error('Error checking withdrawal fields:', error);
    }
  }
  
  // Run the function
  checkWithdrawalFields().then(() => {
    console.log('Check completed.');
    process.exit(0);
  }).catch(err => {
    console.error('Error running script:', err);
    process.exit(1);
  });
  
} catch (error) {
  console.error('Error initializing Firebase Admin:', error);
  process.exit(1);
} 