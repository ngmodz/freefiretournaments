import { 
  doc, 
  getDoc, 
  updateDoc,
  setDoc,
  Timestamp
} from 'firebase/firestore';
import { db, isMock } from './index';

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
  phone?: string;
}) => {
  try {
    const userRef = doc(db, 'users', userId);
    const timestamp = Timestamp.now();
    
    // Set up initial profile data
    const userData = {
      id: userId,
      email: profileData.email || '',
      fullName: profileData.displayName || '',
      avatar_url: profileData.photoURL || null,
      uid: profileData.uid || '',
      ign: profileData.ign || '',
      phone: profileData.phone || '',
      bio: '',
      location: '',
      birthdate: '',
      gender: '',
      isPremium: false,
      created_at: timestamp,
      updated_at: timestamp
    };
    
    await setDoc(userRef, userData);
    return userData;
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

// Update user profile in Firestore
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
    const userRef = doc(db, 'users', userId);
    
    // Add updated_at timestamp to updates
    const updatedData = {
      ...updates,
      updated_at: Timestamp.now()
    };
    
    await updateDoc(userRef, updatedData);
    return { success: true };
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}; 