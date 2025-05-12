// Main firebase entry point that exports everything
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, collection, query, getDocs, limit } from 'firebase/firestore';
import { getAuth, onAuthStateChanged, signOut as firebaseSignOut, createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, User as FirebaseUser, sendPasswordResetEmail } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

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
let app, db, auth, storage;
let isMock = false;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  storage = getStorage(app);
  console.log("Firebase initialized successfully");
} catch (error) {
  console.error('Firebase initialization error:', error);
  console.warn('Using mock Firebase implementation for development');
  isMock = true;
  console.log("⚠️ IMPORTANT: App is running in MOCK MODE - profile updates will not be saved to Firestore");
  
  // Import and setup mock implementations
  const { setupMockFirestore, setupMockAuth, setupMockStorage } = require('./mock');
  db = setupMockFirestore();
  auth = setupMockAuth();
  storage = setupMockStorage();
}

// Export core services
export { app, db, auth, storage, isMock };

// Auth functions
// Get the current user
export const getCurrentUser = (): Promise<FirebaseUser | null> => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
};

// Sign out
export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
    return { success: true };
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

// Auth change listener
export const onAuthChange = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Sign up with email and password
export const signUpWithEmail = async (email: string, password: string) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return result;
  } catch (error) {
    console.error('Error signing up with email:', error);
    throw error;
  }
};

// Sign in with email and password
export const signInWithEmail = async (email: string, password: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result;
  } catch (error) {
    console.error('Error signing in with email:', error);
    throw error;
  }
};

// Sign in with Google
export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return result;
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

// Password reset
export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

// Storage functions
// Upload avatar to Firebase Storage
export const uploadAvatar = async (userId: string, file: File) => {
  try {
    // Create a storage reference for the avatar
    const storageRef = ref(storage, `avatars/${userId}`);
    
    // Upload the file
    const snapshot = await uploadBytes(storageRef, file);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return { 
      success: true,
      url: downloadURL
    };
  } catch (error) {
    console.error('Error uploading avatar:', error);
    throw error;
  }
};

// Delete avatar from Firebase Storage
export const deleteAvatar = async (url: string) => {
  try {
    const fileRef = ref(storage, url);
    await deleteObject(fileRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting avatar:', error);
    throw error;
  }
};

// Utility functions
// Mock server timestamp for development
export const mockServerTimestamp = () => {
  return new Date().toISOString();
};

// Verify Firestore connection
export const verifyFirestoreConnection = async () => {
  try {
    // Attempt to fetch a sample document to verify the connection
    const testQuery = query(collection(db, 'users'), limit(1));
    await getDocs(testQuery);
    return { 
      connected: true,
      message: 'Successfully connected to Firestore'
    };
  } catch (error) {
    console.error('Error verifying Firestore connection:', error);
    return { 
      connected: false,
      message: 'Failed to connect to Firestore'
    };
  }
};

// Export profile functions
export { getUserProfile, createUserProfile, updateUserProfile } from './profile'; 