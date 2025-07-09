// Script to remove mock credits from all users
import admin from 'firebase-admin';
import fs from 'fs';
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

async function removeMockCreditsFromAllUsers() {
  try {
    console.log('Starting to remove mock credits from all users...');
    
    // Get all users
    const usersSnapshot = await db.collection('users').get();
    
    if (usersSnapshot.empty) {
      console.log('No user documents found.');
      return;
    }

    console.log(`Found ${usersSnapshot.size} user documents.`);
    
    const batch = db.batch();
    let updatedCount = 0;
    let noWalletCount = 0;

    // Process each user document
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      
      // If wallet exists, reset credits to 0
      if (userData.wallet) {
        console.log(`Removing mock credits from user: ${doc.id}`);
        
        // Keep firstPurchaseCompleted as is
        const firstPurchaseCompleted = userData.wallet.firstPurchaseCompleted || false;
        
        batch.update(doc.ref, {
          'wallet.tournamentCredits': 0,
          'wallet.hostCredits': 0,
          'wallet.totalPurchasedTournamentCredits': 0,
          'wallet.totalPurchasedHostCredits': 0,
          'wallet.firstPurchaseCompleted': firstPurchaseCompleted
        });
        
        updatedCount++;
      } else {
        noWalletCount++;
      }
    });

    // Commit the batch if there are updates
    if (updatedCount > 0) {
      await batch.commit();
      console.log(`Successfully removed mock credits from ${updatedCount} users.`);
    } else {
      console.log('No users had mock credits to remove.');
    }
    
    console.log(`${noWalletCount} users had no wallet field.`);
    
  } catch (error) {
    console.error('Error removing mock credits:', error);
  } finally {
    process.exit();
  }
}

// Run the function
removeMockCreditsFromAllUsers(); 