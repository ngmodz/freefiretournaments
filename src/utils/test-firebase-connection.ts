// Utility script to test Firebase connection
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  query, 
  limit, 
  DocumentData
} from 'firebase/firestore';
import { getAuth, signInAnonymously, UserCredential } from 'firebase/auth';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

interface TestResult {
  success: boolean;
  message?: string;
  error?: string;
  code?: string;
}

// Test function to be called from browser console
export async function testFirebaseConnection(): Promise<TestResult> {
  console.log('Testing Firebase connection...');
  
  try {
    // Test authentication
    console.log('Testing authentication...');
    const anonymousUser: UserCredential = await signInAnonymously(auth);
    console.log('Anonymous auth successful:', anonymousUser.user.uid);
    
    // Test Firestore connection
    console.log('Testing Firestore connection...');
    const q = query(collection(db, 'tournaments'), limit(1));
    const querySnapshot = await getDocs(q);
    
    console.log(`Firestore connection successful! Found ${querySnapshot.size} tournaments.`);
    
    if (querySnapshot.size > 0) {
      console.log('Sample tournament data:');
      querySnapshot.forEach(doc => {
        console.log('- Tournament ID:', doc.id);
        console.log('- Tournament name:', doc.data().name);
      });
    }
    
    return {
      success: true,
      message: 'Firebase connection test successful!'
    };
  } catch (error: any) {
    console.error('Firebase connection test failed:', error);
    return {
      success: false,
      error: error.message,
      code: error.code
    };
  }
}

// Export a function to verify security rules
export async function testSecurityRules(): Promise<TestResult> {
  try {
    console.log('Testing Firebase security rules...');
    
    // Try to create a tournament
    const tournamentsCollection = collection(db, 'tournaments');
    
    console.log('Attempting to read tournaments collection...');
    const querySnapshot = await getDocs(query(tournamentsCollection, limit(1)));
    console.log('Successfully read tournaments collection!');
    
    return {
      success: true,
      message: 'Security rules test successful - read access works!'
    };
  } catch (error: any) {
    console.error('Security rules test failed:', error);
    return {
      success: false,
      error: error.message,
      code: error.code
    };
  }
}

// Make the functions available on the window object for browser usage
declare global {
  interface Window {
    testFirebaseConnection: () => Promise<TestResult>;
    testSecurityRules: () => Promise<TestResult>;
  }
}

// Auto-run test if this file is loaded directly
if (typeof window !== 'undefined') {
  window.testFirebaseConnection = testFirebaseConnection;
  window.testSecurityRules = testSecurityRules;
  
  console.log('Firebase test utilities loaded!');
  console.log('Run testFirebaseConnection() or testSecurityRules() in the console to test your Firebase connection.');
} 