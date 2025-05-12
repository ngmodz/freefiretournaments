import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  updateDoc,
  setDoc,
  query, 
  where, 
  getDocs,
  addDoc,
  serverTimestamp,
  Timestamp,
  DocumentData,
  DocumentReference,
  deleteDoc,
  limit
} from 'firebase/firestore';
import { 
  getAuth, 
  onAuthStateChanged, 
  signOut as firebaseSignOut,
  User as FirebaseUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail
} from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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

// Log the config we're using (without exposing full API key)
console.log("Using Firebase config:", {
  apiKey: firebaseConfig.apiKey ? `${firebaseConfig.apiKey.substring(0, 5)}...` : "not set",
  projectId: firebaseConfig.projectId,
  usingEnvVars: !!import.meta.env.VITE_FIREBASE_API_KEY
});

// For development: Mock Firebase if config is missing or invalid
let app, db, auth, storage;
let isMock = false;

try {
  // Validate required Firebase config values
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.appId) {
    throw new Error("Invalid Firebase configuration - missing required fields");
  }
  
  // Initialize Firebase
  console.log("Initializing Firebase with config:", { 
    apiKey: firebaseConfig.apiKey.substring(0, 5) + '***', 
    projectId: firebaseConfig.projectId,
    appId: firebaseConfig.appId.substring(0, 8) + '***'
  });
  
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  storage = getStorage(app);
  
  // Verify initialization
  if (!db || !auth || !storage) {
    throw new Error("Firebase services not initialized properly");
  }
  
  console.log("Firebase initialized successfully:", { 
    app: !!app, 
    db: !!db, 
    auth: !!auth, 
    storage: !!storage,
    mock: isMock
  });
} catch (error) {
  console.error('Firebase initialization error:', error);
  console.warn('Using mock Firebase implementation for development');
  isMock = true;
  console.log("⚠️ IMPORTANT: App is running in MOCK MODE - profile updates will not be saved to Firestore");
  
  // Mock data store for development
  const mockData: Record<string, Record<string, any>> = {
    users: {
      'mock-user-1': {
        id: 'mock-user-1',
        ign: 'TestPlayer123',
        email: 'test@example.com',
        avatar_url: 'https://randomuser.me/api/portraits/men/1.jpg',
        isPremium: false,
      }
    },
    tournaments: {},
    tournament_drafts: {}
  };
  
  // Mock document reference
  class MockDocumentReference {
    constructor(public path: string, public id: string) {}
  }
  
  // Mock Firestore operations
  db = {
    collection: (collectionPath: string) => {
      // Create the collection if it doesn't exist
      if (!mockData[collectionPath]) {
        mockData[collectionPath] = {};
      }
      
      return {
        // Mock document
        doc: (docId: string) => {
          const docRef = new MockDocumentReference(collectionPath, docId);
          
          return {
            id: docId,
            get: async () => {
              const data = mockData[collectionPath][docId];
              return {
                exists: () => !!data,
                data: () => data,
                id: docId
              };
            },
            set: async (data: any) => {
              mockData[collectionPath][docId] = {
                ...data,
                id: docId
              };
              return docRef;
            },
            update: async (data: any) => {
              mockData[collectionPath][docId] = {
                ...mockData[collectionPath][docId],
                ...data
              };
              return docRef;
            }
          };
        },
        // Add document with auto-generated ID
        add: async (data: any) => {
          const docId = 'mock-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
          mockData[collectionPath][docId] = {
            ...data,
            id: docId,
            created_at: new Date().toISOString()
          };
          return new MockDocumentReference(collectionPath, docId);
        },
        // Query operations
        where: () => ({
          get: async () => ({
            docs: Object.entries(mockData[collectionPath]).map(([id, data]) => ({
              id,
              data: () => data,
              exists: true
            }))
          })
        }),
        orderBy: () => ({
          get: async () => ({
            docs: Object.entries(mockData[collectionPath]).map(([id, data]) => ({
              id,
              data: () => data,
              exists: true
            }))
          })
        })
      };
    }
  };
  
  // Mock Auth
  auth = {
    currentUser: {
      uid: 'mock-user-1',
      email: 'test@example.com',
      displayName: 'Test User'
    },
    onAuthStateChanged: (callback: (user: any) => void) => {
      // Simulate a logged-in user
      setTimeout(() => {
        callback({
          uid: 'mock-user-1',
          email: 'test@example.com',
          displayName: 'Test User'
        });
      }, 100);
      return () => {}; // Unsubscribe function
    }
  };
  
  // Mock Storage
  storage = {
    ref: (path: string) => ({
      put: async (file: File) => {
        console.log('Mock file upload:', file.name, 'to path:', path);
        return {
          ref: {
            getDownloadURL: async () => `https://placehold.co/600x400?text=${encodeURIComponent(file.name)}`
          }
        };
      }
    }),
    refFromURL: (url: string) => ({
      delete: async () => {
        console.log('Mock file deletion:', url);
        return Promise.resolve();
      }
    })
  };
}

// Profile-related functions
export const getUserProfile = async (userId: string) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return userSnap.data() as {
        id: string;
        uid: string; // Free Fire UID
        ign: string; // In-game name
        fullName: string;
        email: string;
        phone: string;
        bio: string;
        location: string;
        birthdate: string;
        gender: string;
        avatar_url: string | null;
        isPremium: boolean;
        created_at: Timestamp;
        updated_at: Timestamp;
      };
    } else if (isMock) {
      // Return mock user for development
      return {
        id: 'mock-user-1',
        uid: 'FF123456789',
        ign: 'TestPlayer123',
        fullName: 'Test User',
        email: 'test@example.com',
        phone: '+1234567890',
        bio: 'I am a passionate gamer who loves Free Fire tournaments.',
        location: 'New York, USA',
        birthdate: '1995-07-15',
        gender: 'male',
        avatar_url: 'https://randomuser.me/api/portraits/men/1.jpg',
        isPremium: false,
        created_at: Timestamp.now(),
        updated_at: Timestamp.now(),
      };
    } else {
      throw new Error('User profile not found');
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

// Create a new user profile in Firestore
export const createUserProfile = async (userId: string, profileData: {
  email?: string;
  displayName?: string;
  photoURL?: string;
  uid?: string;
  ign?: string;
  fullName?: string;
  phone?: string;
}) => {
  try {
    const userRef = doc(db, 'users', userId);
    
    // Check if user exists
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      // User exists, update profile
      await updateDoc(userRef, {
        ...profileData,
        updated_at: serverTimestamp(),
      });
    } else {
      // Create new user profile
      const userData = {
        id: userId,
        uid: profileData.uid || '',
        ign: profileData.ign || '',
        fullName: profileData.fullName || profileData.displayName || '',
        email: profileData.email || '',
        phone: profileData.phone || '',
        bio: '',
        location: '',
        birthdate: '',
        gender: '',
        avatar_url: profileData.photoURL || null,
        isPremium: false,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      };
      
      await setDoc(userRef, userData);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

// Mock serverTimestamp for development
export const mockServerTimestamp = () => {
  if (isMock) {
    return new Date().toISOString();
  }
  return serverTimestamp();
};

// Export the rest of the original functions...
export const updateUserProfile = async (userId: string, updates: {
  uid?: string;
  ign?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  bio?: string;
  location?: string;
  birthdate?: string;
  gender?: string;
  avatar_url?: string;
  isPremium?: boolean;
}) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    let validationPassed = true;
    let validationErrors = [];

    // Validate IGN format (alphanumeric, 3-20 characters)
    if (updates.ign !== undefined) {
      if (!updates.ign) {
        validationErrors.push('IGN cannot be empty');
        validationPassed = false;
      }
      else if (!/^[a-zA-Z0-9]{3,20}$/.test(updates.ign)) {
        validationErrors.push('IGN must be alphanumeric and between 3-20 characters');
        validationPassed = false;
      }
      // Uniqueness check for IGN is removed as it's no longer required
      // console.log("IGN uniqueness check skipped as duplicates are now allowed.");
    }
    
    // Validate UID format (numeric, 8-12 digits)
    if (updates.uid !== undefined) {
      if (!updates.uid) {
        validationErrors.push('UID cannot be empty');
        validationPassed = false;
      }
      else if (!/^[0-9]{8,12}$/.test(updates.uid)) {
        validationErrors.push('Free Fire UID must be a number with 8-12 digits');
        validationPassed = false;
      }
      // Uniqueness check for UID is removed as it's no longer required
      // console.log("UID uniqueness check skipped as duplicates are now allowed.");
    }
    
    if (!validationPassed) {
      throw new Error(validationErrors.join('. '));
    }
    
    const userRef = doc(db, 'users', userId);
    
    // Add updated_at timestamp
    const updatedData = {
      ...updates,
      updated_at: serverTimestamp(),
    };
    
    // Log the update attempt
    console.log(`Updating user ${userId} with data (uniqueness checks for IGN/UID are disabled):`, updatedData);
    
    // Update the document
    await updateDoc(userRef, updatedData);
    console.log(`User ${userId} profile updated successfully`);
    
    // Return updated user data
    const updatedUser = await getDoc(userRef);
    return updatedUser.data();
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Check if an IGN already exists (excluding the current user)
// This function is now modified to always return false as IGNs no longer need to be unique
export const checkIGNExists = async (ign: string, currentUserId: string): Promise<boolean> => {
  console.log(`IGN existence check skipped for IGN: ${ign} (User: ${currentUserId}) - IGNs can now be duplicated. This function will always return false.`);
  return false; // Always return false (not taken by another user)
};

// Check if a UID already exists (excluding the current user)
// This function is now modified to always return false as UIDs no longer need to be unique
export const checkUIDExists = async (uid: string, currentUserId: string): Promise<boolean> => {
  console.log(`UID existence check skipped for UID: ${uid} (User: ${currentUserId}) - UIDs can now be duplicated. This function will always return false.`);
  return false; // Always return false (not taken by another user)
};

export const uploadAvatar = async (userId: string, file: File) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    if (!file) {
      throw new Error('File is required');
    }
    
    // Generate a unique file path
    const fileExt = file.name.split('.').pop();
    if (!fileExt) {
      throw new Error('Invalid file extension');
    }
    
    // Create a totally unique filename
    const uniqueId = Math.random().toString(36).substring(2);
    const fileName = `avatar-${Date.now()}-${uniqueId}.${fileExt}`;
    
    // Use a simple flat path that's more likely to work
    const filePath = `avatars/${fileName}`;
    
    console.log("Uploading avatar with path:", filePath);
    
    // Explicitly check if storage is initialized
    if (!storage) {
      throw new Error('Firebase Storage is not initialized');
    }
    
    try {
      // Create blob from file
      const blob = file.slice(0, file.size, file.type);
      const newFile = new File([blob], fileName, { type: file.type });
      
      // Upload file to Firebase Storage
      const storageRef = ref(storage, filePath);
      console.log("Storage reference created");
      
      // Upload with explicit content type
      const metadata = {
        contentType: file.type
      };
      
      const uploadResult = await uploadBytes(storageRef, newFile, metadata);
      console.log("Upload successful, result:", uploadResult);
      
      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);
      console.log("Download URL obtained:", downloadURL);
      
      // Update user's avatar_url in Firestore
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { 
        avatar_url: downloadURL,
        updated_at: serverTimestamp()
      });
      console.log("User profile updated with new avatar URL");
      
      return downloadURL;
    } catch (uploadError) {
      console.error("Upload failed with error:", uploadError);
      
      // Try alternate upload method for older browsers
      if (uploadError instanceof Error) {
        throw new Error(`Avatar upload failed: ${uploadError.message}`);
      }
      throw uploadError;
    }
  } catch (error) {
    console.error('Error uploading avatar:', error);
    if (error instanceof Error) {
      throw new Error(`Avatar upload failed: ${error.message}`);
    }
    throw error;
  }
};

// Authentication functions
export const getCurrentUser = (): Promise<FirebaseUser | null> => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
};

export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
    return { success: true };
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

export const onAuthChange = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// New authentication functions
export const signUpWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // Create a user profile in Firestore
    await createUserProfile(userCredential.user.uid, {
      email: userCredential.user.email,
      displayName: userCredential.user.displayName,
      photoURL: userCredential.user.photoURL,
    });
    
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error('Error signing up:', error);
    throw error;
  }
};

export const signInWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
};

export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    
    // Create or update the user profile in Firestore
    await createUserProfile(userCredential.user.uid, {
      email: userCredential.user.email,
      displayName: userCredential.user.displayName,
      photoURL: userCredential.user.photoURL,
    });
    
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

// Simple function to verify Firestore connection without any test documents
export const verifyFirestoreConnection = async () => {
  try {
    if (isMock) {
      console.log("Cannot verify Firestore connection in mock mode");
      return { success: false, error: "App is running in mock mode" };
    }
    
    // Just check if we can access Firestore by doing a simple operation
    const usersCollection = collection(db, 'users');
    await getDocs(query(usersCollection, where('isPremium', '==', true), limit(1)));
    
    console.log("✅ Firestore connection verified successfully");
    return { success: true };
  } catch (error) {
    console.error("❌ Firestore connection verification failed:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
};

// Add a new function to verify ownership of UID/IGN
export const requestVerification = async (userId: string, type: 'uid' | 'ign', value: string, evidence?: string) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    if (!value) {
      throw new Error(`${type.toUpperCase()} value is required`);
    }
    
    // Create a verification request in Firestore
    const verificationRef = collection(db, 'verification_requests');
    
    // Add the verification request
    await addDoc(verificationRef, {
      userId,
      type,
      value,
      evidence: evidence || '',
      status: 'pending',
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    });
    
    return {
      success: true,
      message: `Your ${type.toUpperCase()} verification request has been submitted. Our team will review it within 24-48 hours.`
    };
  } catch (error) {
    console.error(`Error requesting ${type} verification:`, error);
    throw error;
  }
};

// Add function to check verification status
export const checkVerificationStatus = async (userId: string, type: 'uid' | 'ign', value: string) => {
  try {
    const verificationRef = collection(db, 'verification_requests');
    const q = query(
      verificationRef, 
      where('userId', '==', userId),
      where('type', '==', type),
      where('value', '==', value),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return { exists: false, status: null };
    }
    
    const data = querySnapshot.docs[0].data();
    return { 
      exists: true, 
      status: data.status,
      created_at: data.created_at
    };
  } catch (error) {
    console.error(`Error checking ${type} verification status:`, error);
    throw error;
  }
};

// Add a utility function to directly check the database for availability issues
export const debugCheckValueInFirestore = async (type: 'ign' | 'uid', value: string): Promise<any> => {
  try {
    console.log(`DEBUG CHECK: Searching for ${type}='${value}' in Firestore`);
    
    if (isMock) {
      return { 
        success: false, 
        error: "App is running in mock mode, can't check real database", 
        foundUsers: [],
        type,
        value
      };
    }
    
    // Direct approach to avoid issues with existing functions
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where(type, '==', value));
    const querySnapshot = await getDocs(q);
    
    const results = [];
    
    querySnapshot.forEach(doc => {
      results.push({
        id: doc.id,
        [type]: doc.data()[type],
        data: doc.data()
      });
    });
    
    console.log(`DEBUG CHECK: Found ${results.length} users with ${type}='${value}'`, results);
    
    return {
      success: true,
      exists: !querySnapshot.empty,
      count: querySnapshot.size,
      foundUsers: results,
      type,
      value
    };
  } catch (error) {
    console.error(`ERROR in debug check for ${type}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error",
      foundUsers: [],
      type,
      value
    };
  }
};

// Export app, db, auth, and storage for direct access if needed
export { isMock, app, db, auth, storage }; 