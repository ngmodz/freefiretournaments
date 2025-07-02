// Script to add wallet fields to all user documents
const admin = require('firebase-admin');
const serviceAccount = require('../firebase-admin-key.json'); // You'll need to provide this

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function addWalletFieldsToUsers() {
  try {
    console.log('Starting to add wallet fields to users...');
    
    // Get all users
    const usersSnapshot = await db.collection('users').get();
    
    if (usersSnapshot.empty) {
      console.log('No user documents found.');
      return;
    }

    const batch = db.batch();
    let updatedCount = 0;

    // Process each user document
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      
      // If wallet doesn't exist, create it with default values
      if (!userData.wallet) {
        console.log(`Adding wallet fields to user: ${doc.id}`);
        
        batch.update(doc.ref, {
          'wallet': {
            tournamentCredits: 0,
            hostCredits: 0,
            earnings: 0,
            totalPurchasedTournamentCredits: 0,
            totalPurchasedHostCredits: 0,
            firstPurchaseCompleted: false
          }
        });
        
        updatedCount++;
      }
    });

    // Commit the batch
    if (updatedCount > 0) {
      await batch.commit();
      console.log(`Successfully added wallet fields to ${updatedCount} users.`);
    } else {
      console.log('No users needed wallet fields added.');
    }
    
  } catch (error) {
    console.error('Error adding wallet fields:', error);
  } finally {
    process.exit();
  }
}

// Run the function
addWalletFieldsToUsers(); 