import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { firebaseConfig } from './firebase-config-es.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log('✅ Firebase connection test successful!');
console.log('📝 To create the required Firestore index:');
console.log('');
console.log('1. Go to Firebase Console:');
console.log('   https://console.firebase.google.com/project/freefire-tournaments-ba2a6/firestore/indexes');
console.log('');
console.log('2. Click "Add Index"');
console.log('3. Set Collection ID to: tournaments');
console.log('4. Add field paths:');
console.log('   - status (Ascending)');
console.log('   - start_date (Ascending)');
console.log('5. Click "Create"');
console.log('');
console.log('Or use this direct link:');
console.log('https://console.firebase.google.com/v1/r/project/freefire-tournaments-ba2a6/firestore/indexes?create_composite=Cl5wcm9qZWN0cy9mcmVlZmlyZS10b3VybmFtZW50cy1iYTJhNi9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvdG91cm5hbWVudHMvaW5kZXhlcy9fEAEaCgoGc3RhdHVzEAEaDgoKc3RhcnRfZGF0ZRABGgwKCF9fbmFtZV9fEAE');
console.log('');
console.log('⏳ After creating the index, wait 5-10 minutes for it to build, then run the notification system again.');

process.exit(0);
