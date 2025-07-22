import {
  collection,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  runTransaction
} from "firebase/firestore";
import { db, auth } from "./firebase";
import { Team, TeamMember, CreateTeamData } from "./types";
import { getUserProfile } from './firebase';

/**
 * Team Service
 * 
 * This service handles all team-related operations for squad tournaments.
 * Teams are created on-the-fly when a leader joins a tournament as a team.
 * 
 * Phase 1 Implementation:
 * - Teams are temporary and created per tournament
 * - Team leader pays full entry fee
 * - Team leader receives all winnings
 * - Manual entry of teammate details by leader
 */

// Create a team for a tournament (Phase 1: on-the-fly team creation)
export const createTeamForTournament = async (
  tournamentId: string,
  teamData: CreateTeamData
): Promise<Team> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("You must be logged in to create a team");
    }

    // Get current user's profile to use as team leader
    const userProfile = await getUserProfile(currentUser.uid);
    
    // Validate team data
    if (!teamData.name.trim()) {
      throw new Error("Team name is required");
    }
    
    if (!teamData.tag.trim()) {
      throw new Error("Team tag is required");
    }
    
    if (teamData.members.length === 0) {
      throw new Error("At least one team member is required");
    }

    // Validate each member has required fields
    for (const member of teamData.members) {
      if (!member.ign.trim()) {
        throw new Error("All team members must have an IGN (in-game name)");
      }
      if (!member.uid.trim() || !/^[0-9]{8,12}$/.test(member.uid)) {
        throw new Error("All team members must have a valid UID (8-12 digit Free Fire ID)");
      }
    }

    // Create team leader member object
    const leaderMember: TeamMember = {
      user_id: currentUser.uid,
      ign: userProfile.ign,
      uid: userProfile.uid,
      role: 'leader'
    };

    // Create team member objects (all as 'member' role)
    const teamMembers: TeamMember[] = [
      leaderMember,
      ...teamData.members.map(member => ({
        user_id: '', // Empty for Phase 1 - these are manually entered
        ign: member.ign,
        uid: member.uid,
        role: 'member' as const
      }))
    ];

    // Create team document
    const team: Omit<Team, 'id'> = {
      name: teamData.name.trim(),
      tag: teamData.tag.trim().toUpperCase(),
      leader_id: currentUser.uid,
      members: teamMembers,
      created_at: serverTimestamp() as Timestamp,
      tournament_id: tournamentId
    };

    // Add team to Firestore
    const docRef = await addDoc(collection(db, "teams"), team);

    return {
      id: docRef.id,
      ...team,
      created_at: team.created_at
    } as Team;

  } catch (error) {
    console.error("Error creating team:", error);
    throw error;
  }
};

// Get team by ID
export const getTeamById = async (teamId: string): Promise<Team | null> => {
  try {
    const docRef = doc(db, "teams", teamId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as Team;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting team:", error);
    throw error;
  }
};

// Get teams for a specific tournament
export const getTeamsForTournament = async (tournamentId: string): Promise<Team[]> => {
  try {
    const q = query(
      collection(db, "teams"),
      where("tournament_id", "==", tournamentId),
      orderBy("created_at", "desc")
    );

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Team[];
  } catch (error) {
    console.error("Error getting teams for tournament:", error);
    throw error;
  }
};

// Get teams created by current user
export const getUserTeams = async (): Promise<Team[]> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("You must be logged in to get your teams");
    }

    const q = query(
      collection(db, "teams"),
      where("leader_id", "==", currentUser.uid),
      orderBy("created_at", "desc")
    );

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Team[];
  } catch (error) {
    console.error("Error getting user teams:", error);
    throw error;
  }
};

// Delete a team (only by team leader)
export const deleteTeam = async (teamId: string): Promise<void> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("You must be logged in to delete a team");
    }

    // Get the team to verify ownership
    const team = await getTeamById(teamId);
    if (!team) {
      throw new Error("Team not found");
    }

    // Verify the current user is the team leader
    if (team.leader_id !== currentUser.uid) {
      throw new Error("You can only delete teams that you lead");
    }

    // Delete the team
    const docRef = doc(db, "teams", teamId);
    await deleteDoc(docRef);

  } catch (error) {
    console.error("Error deleting team:", error);
    throw error;
  }
};

// Update team details (only by team leader)
export const updateTeam = async (
  teamId: string, 
  updates: Partial<Pick<Team, 'name' | 'tag' | 'members'>>
): Promise<void> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("You must be logged in to update a team");
    }

    // Get the team to verify ownership
    const team = await getTeamById(teamId);
    if (!team) {
      throw new Error("Team not found");
    }

    // Verify the current user is the team leader
    if (team.leader_id !== currentUser.uid) {
      throw new Error("You can only update teams that you lead");
    }

    // Update the team
    const docRef = doc(db, "teams", teamId);
    await updateDoc(docRef, updates);

  } catch (error) {
    console.error("Error updating team:", error);
    throw error;
  }
};

// Validate team size for tournament mode
export const validateTeamSizeForMode = (teamSize: number, mode: "Solo" | "Duo" | "Squad"): boolean => {
  switch (mode) {
    case "Solo":
      return teamSize === 1;
    case "Duo":
      return teamSize === 2;
    case "Squad":
      return teamSize >= 2 && teamSize <= 4; // Allow 2-4 members for squad
    default:
      return false;
  }
};

// Get team size requirements for tournament mode
export const getTeamSizeForMode = (mode: "Solo" | "Duo" | "Squad"): { min: number; max: number } => {
  switch (mode) {
    case "Solo":
      return { min: 1, max: 1 };
    case "Duo":
      return { min: 2, max: 2 };
    case "Squad":
      return { min: 2, max: 4 };
    default:
      return { min: 1, max: 1 };
  }
};

// Duo-specific validation helper
export const validateDuoTeam = (teamData: CreateTeamData): { isValid: boolean; error?: string } => {
  // Check if exactly 1 additional member (leader + 1 member = 2 total)
  if (teamData.members.length !== 1) {
    return {
      isValid: false,
      error: "Duo teams require exactly one additional member (you + 1 teammate)"
    };
  }

  // Validate the single member has required fields
  const member = teamData.members[0];
  if (!member.ign.trim()) {
    return {
      isValid: false,
      error: "Teammate must have an IGN (in-game name)"
    };
  }

  if (!member.uid.trim() || !/^[0-9]{8,12}$/.test(member.uid)) {
    return {
      isValid: false,
      error: "Teammate must have a valid UID (8-12 digit Free Fire ID)"
    };
  }

  // Validate team name and tag
  if (!teamData.name.trim()) {
    return {
      isValid: false,
      error: "Team name is required"
    };
  }

  if (!teamData.tag.trim()) {
    return {
      isValid: false,
      error: "Team tag is required"
    };
  }

  return { isValid: true };
};

// Duo team creation wrapper with enhanced validation
export const createDuoTeamForTournament = async (
  tournamentId: string,
  teamData: CreateTeamData,
  leaderId?: string
): Promise<Team> => {
  try {
    // Validate duo-specific constraints
    const validation = validateDuoTeam(teamData);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    // Use existing createTeamForTournament with duo validation
    const team = await createTeamForTournament(tournamentId, teamData);

    // Additional duo-specific validation after creation
    if (team.members.length !== 2) {
      throw new Error("Duo team must have exactly 2 members");
    }

    return team;
  } catch (error) {
    console.error("Error creating duo team:", error);
    throw error;
  }
};

// Check if a team is a duo team
export const isDuoTeam = (team: Team): boolean => {
  return team.members.length === 2;
};

// Get duo team partner (non-leader member)
export const getDuoPartner = (team: Team): TeamMember | null => {
  if (!isDuoTeam(team)) {
    return null;
  }
  
  return team.members.find(member => member.role === 'member') || null;
};

// Get duo team leader
export const getDuoLeader = (team: Team): TeamMember | null => {
  if (!isDuoTeam(team)) {
    return null;
  }
  
  return team.members.find(member => member.role === 'leader') || null;
};