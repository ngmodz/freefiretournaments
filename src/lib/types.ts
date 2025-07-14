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
  isHost: boolean;
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
  isHost?: boolean;
}

// Auth user information
export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
} 

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  amount: number;
  status: 'pending' | 'done';
  timestamp: number;
  upiId?: string;
  requestedAt?: Timestamp;
}

export interface HostApplication {
  id: string;
  userId: string;
  userEmail: string;
  userName?: string;
  userUid?: string;
  userIgn?: string;
  experience: string;
  reason: string;
  preferredGameModes?: string;
  availability?: string;
  contactInfo?: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Timestamp;
  reviewedAt?: Timestamp;
  reviewedBy?: string;
  reviewNotes?: string;
}

export type StatusFilter = 'all' | 'pending' | 'done' | 'approved' | 'rejected';