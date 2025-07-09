// Script to add wallet fields to all users
import admin from 'firebase-admin';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env') });

// Read the service account file from environment variable
const serviceAccountPath = process.env.SERVICE_ACCOUNT_KEY_PATH;
if (!serviceAccountPath) {
  throw new Error('SERVICE_ACCOUNT_KEY_PATH environment variable is required');
}
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath));

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function addWalletFieldsToAllUsers() {
  try {
    console.log('Starting to add wallet fields to all users...');
    
    // Get all users
    const usersSnapshot = await db.collection('users').get();
    
    if (usersSnapshot.empty) {
      console.log('No user documents found.');
      return;
    }

    console.log(`Found ${usersSnapshot.size} user documents.`);
    
    const batch = db.batch();
    let updatedCount = 0;
    let alreadyHasWalletCount = 0;

    // Process each user document
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      
      // If wallet doesn't exist, create it with default values
      if (!userData.wallet) {
        console.log(`Adding wallet fields to user: ${doc.id}`);
        
        batch.update(doc.ref, {
          'wallet': {
            tournamentCredits: 100,  // Default starting credits
            hostCredits: 5,          // Default starting host credits
            earnings: 0,
            totalPurchasedTournamentCredits: 100,
            totalPurchasedHostCredits: 5,
            firstPurchaseCompleted: false
          }
        });
        
        updatedCount++;
      } else {
        alreadyHasWalletCount++;
      }
    });

    // Commit the batch if there are updates
    if (updatedCount > 0) {
      await batch.commit();
      console.log(`Successfully added wallet fields to ${updatedCount} users.`);
    } else {
      console.log('No users needed wallet fields added.');
    }
    
    console.log(`${alreadyHasWalletCount} users already had wallet fields.`);
    
  } catch (error) {
    console.error('Error adding wallet fields:', error);
  } finally {
    process.exit();
  }
}

// Run the function
addWalletFieldsToAllUsers(); 