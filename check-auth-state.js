// Simple script to check current auth and firestore state
import { auth, db } from './src/lib/firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

console.log('Starting auth state checker...');

onAuthStateChanged(auth, async (user) => {
  if (user) {
    console.log('Authenticated user found:', user.uid);
    console.log('Email:', user.email);
    
    // Check if profile exists in Firestore
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        console.log('✅ User profile exists in Firestore');
        console.log('Profile data:', userSnap.data());
      } else {
        console.log('❌ User profile does NOT exist in Firestore');
        console.log('This explains the registration issue!');
      }
    } catch (error) {
      console.error('Error checking Firestore profile:', error);
    }
  } else {
    console.log('No authenticated user found');
  }
});

// Keep script running
setTimeout(() => {
  console.log('Auth check complete');
  process.exit(0);
}, 5000);
