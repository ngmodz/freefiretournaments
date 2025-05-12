import { Timestamp } from 'firebase/firestore';

// User profile interface
export interface UserProfile {
  id: string;          // Firebase Auth UID
  uid: string;         // Free Fire UID 
  ign: string;         // In-game name
  fullName: string;
  email: string;
  phone: string;
  bio: string;
  location: string;
  birthdate: string;
  gender: string;
  avatar_url: string | null;
  isPremium: boolean;
  created_at?: Timestamp;
  updated_at?: Timestamp;
}

// For profile updates
export interface ProfileUpdate {
  uid?: string;
  ign?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  bio?: string;
  location?: string;
  birthdate?: string;
  gender?: string;
  avatar_url?: string | null;
  isPremium?: boolean;
}

// Auth user information
export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
} 