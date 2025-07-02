// Script to add wallet fields to a specific user document
const admin = require('firebase-admin');
const serviceAccount = require('../firebase-admin-key.json'); // You'll need to provide this

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// The user ID from the screenshot
const userId = 'AQlc4h5ZcRfViznAmVX1E2YwfCV2';

async function addWalletFieldsToUser() {
  try {
    console.log(`Starting to add wallet fields to user: ${userId}`);
    
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      console.log(`User document with ID ${userId} not found.`);
      return;
    }

    const userData = userDoc.data();
    
    // Update the user document with wallet fields
    await userRef.update({
      'wallet': {
        tournamentCredits: 100,  // You can set initial values as needed
        hostCredits: 10,         // You can set initial values as needed
        earnings: 0,
        totalPurchasedTournamentCredits: 100,
        totalPurchasedHostCredits: 10,
        firstPurchaseCompleted: true
      }
    });
    
    console.log(`Successfully added wallet fields to user: ${userId}`);
    
  } catch (error) {
    console.error('Error adding wallet fields:', error);
  } finally {
    process.exit();
  }
}

// Run the function
addWalletFieldsToUser(); 