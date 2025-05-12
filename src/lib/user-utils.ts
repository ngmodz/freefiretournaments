import { 
  collection,
  query, 
  where, 
  getDocs, 
  limit,
  Timestamp 
} from 'firebase/firestore';
import { db, updateUserProfile, getUserProfile } from './firebase';
import { UserProfile, ProfileUpdate } from './types';

/**
 * Find a user by their Free Fire UID
 */
export async function findUserByUID(uid: string): Promise<UserProfile | null> {
  try {
    // Create a query against the users collection
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('uid', '==', uid), limit(1));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const userData = querySnapshot.docs[0].data() as UserProfile;
    return userData;
  } catch (error) {
    console.error('Error finding user by UID:', error);
    throw error;
  }
}

/**
 * Find a user by their IGN (in-game name)
 */
export async function findUserByIGN(ign: string): Promise<UserProfile | null> {
  try {
    // Create a query against the users collection
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('ign', '==', ign), limit(1));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const userData = querySnapshot.docs[0].data() as UserProfile;
    return userData;
  } catch (error) {
    console.error('Error finding user by IGN:', error);
    throw error;
  }
}

/**
 * Validate user profile data
 */
export function validateUserData(data: ProfileUpdate): { valid: boolean, errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  // Validate UID
  if (data.uid && !/^[0-9]{8,12}$/.test(data.uid)) {
    errors.uid = 'Free Fire UID must be a number with 8-12 digits';
  }

  // Validate IGN
  if (data.ign && !/^[a-zA-Z0-9]{3,20}$/.test(data.ign)) {
    errors.ign = 'In-game name must be alphanumeric and between 3-20 characters';
  }

  // Validate email
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Please enter a valid email address';
  }

  // Validate phone
  if (data.phone && !/^\+?[0-9]{10,15}$/.test(data.phone)) {
    errors.phone = 'Please enter a valid phone number';
  }

  // Check if there are any errors
  const valid = Object.keys(errors).length === 0;
  
  return { valid, errors };
}

/**
 * Format timestamp to readable date
 */
export function formatDate(timestamp: Timestamp | undefined): string {
  if (!timestamp) return '';
  
  return new Date(timestamp.toDate()).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Check if UID is already in use by another user
 * (This function is now modified to always allow UIDs as they no longer need to be unique)
 */
export async function isUIDAvailable(uid: string, currentUserId?: string): Promise<boolean> {
  console.log(`UID uniqueness check skipped for UID: ${uid} (User: ${currentUserId}) - UIDs can now be duplicated.`);
  // Always return true as UIDs no longer need to be unique
  return true;
}

/**
 * Check if IGN is already in use by another user
 * (This function is now modified to always allow IGNs as they no longer need to be unique)
 */
export async function isIGNAvailable(ign: string, currentUserId?: string): Promise<boolean> {
  console.log(`IGN uniqueness check skipped for IGN: ${ign} (User: ${currentUserId}) - IGNs can now be duplicated.`);
  // Always return true as IGNs no longer need to be unique
  return true;
} 