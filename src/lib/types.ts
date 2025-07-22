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

// Team-related interfaces for squad tournaments
export interface TeamMember {
  user_id: string;    // Firebase Auth UID
  ign: string;        // In-game name
  uid: string;        // Free Fire UID
  role: 'leader' | 'member';
}

export interface Team {
  id: string;
  name: string;
  tag: string;        // Short team tag (e.g., "ANH")
  leader_id: string;  // Firebase Auth UID of team leader
  members: TeamMember[];
  created_at: Timestamp;
  tournament_id?: string; // Optional: if team is created for specific tournament
}

// For team creation
export interface CreateTeamData {
  name: string;
  tag: string;
  members: Omit<TeamMember, 'user_id' | 'role'>[]; // IGN and UID only, leader info added automatically
}
// For storing team data directly in tournament participants (Phase 1)
export interface TeamParticipant {
  teamId: string;
  teamName: string;
  teamTag: string;
  leaderId: string;
  leaderIgn: string;
  leaderUid: string;
  members: {
    ign: string;
    uid: string;
    role: string;
  }[];
  totalMembers: number;
  joinedAt: string;
}

// Duo-specific type definitions for enhanced type safety
export interface DuoTeamData extends CreateTeamData {
  members: [Omit<TeamMember, 'user_id' | 'role'>]; // Exactly 1 additional member (leader + 1 = duo)
}

export interface DuoTeam extends Team {
  members: [TeamMember, TeamMember]; // Exactly 2 members: leader + partner
}

export interface DuoParticipant extends TeamParticipant {
  totalMembers: 2; // Always 2 for duo teams
  members: [
    {
      ign: string;
      uid: string;
      role: 'leader';
    },
    {
      ign: string;
      uid: string;
      role: 'member';
    }
  ]; // Exactly 2 members with defined roles
}

// Validation result interface for duo team operations
export interface DuoValidationResult {
  isValid: boolean;
  error?: string;
}

// Duo team creation data with strict typing
export interface CreateDuoTeamData {
  name: string;
  tag: string;
  partner: {
    ign: string;
    uid: string;
  }; // Single partner instead of members array
}

// Helper type to identify duo teams
export type TeamType = 'solo' | 'duo' | 'squad';

// Enhanced team member with duo-specific context
export interface DuoTeamMember extends TeamMember {
  role: 'leader' | 'member';
  isDuoPartner?: boolean; // Helper flag for UI components
}