// Script to update all user profiles in Firestore with missing ign or uid fields
const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp({
  credential: applicationDefault(),
});

const db = getFirestore();

async function updateMissingIGNandUID() {
  const usersRef = db.collection('users');
  const snapshot = await usersRef.get();
  let updatedCount = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    let update = {};
    if (!data.ign || typeof data.ign !== 'string' || data.ign.trim() === '') {
      update.ign = `Player_${doc.id.substring(0, 6)}`;
    }
    if (!data.uid || typeof data.uid !== 'string' || data.uid.trim() === '') {
      update.uid = doc.id;
    }
    if (Object.keys(update).length > 0) {
      await usersRef.doc(doc.id).update(update);
      updatedCount++;
      console.log(`Updated user ${doc.id}:`, update);
    }
  }
  console.log(`Update complete. Total users updated: ${updatedCount}`);
}

updateMissingIGNandUID().catch(console.error); 