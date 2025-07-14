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
  limit,
  serverTimestamp,
  Timestamp,
  DocumentReference,
  FirestoreError,
  writeBatch,
  runTransaction
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage, auth } from "./firebase";
import { TournamentFormData } from "@/pages/TournamentCreate";
import { useTournamentCredits } from "./walletService";
import { getUserProfile } from './firebase';

/**
 * Tournament Service
 *
 * This service handles all tournament-related operations such as creation,
 * updates, deletion, and querying.
 *
 * IMPORTANT NOTES:
 *
 * 1. Tournament Notifications:
 *    - Tournaments have automatic email notifications sent to hosts
 *    - Email notifications are sent 20 minutes before the scheduled start time
 *    - Notifications are managed by a Firebase Cloud Function (sendUpcomingTournamentNotifications)
 *    - This happens automatically based on the 'start_date' field and 'status' being 'active'
 *    - When a notification is sent, a 'notificationSent' field is set to true
 *
 * 2. Tournament Lifecycle:
 *    - Newly created tournaments have status 'active'
 *    - When started manually by host, status changes to 'ongoing'
 *    - When ended manually by host, status changes to 'ended'
 *    - When results are finalized, status changes to 'completed'
 *    - Tournaments have TTL (Time to Live) for automatic cleanup
 *
 * 3. Important Fields:
 *    - start_date: ISO string for the scheduled tournament date and time
 *    - status: Current state of the tournament ('active', 'ongoing', 'ended', 'completed', 'cancelled')
 *    - host_id: Firebase User ID of the tournament creator
 *    - notificationSent: Boolean indicating if the notification has been sent (added by the cloud function)
 */

// Participant interface for the new structure
export interface Participant {
  customUid: string;
  authUid: string;
  ign: string;
}

// Tournament type definition
export interface Tournament {
  id: string;
  name: string;
  description: string;
  mode: "Solo" | "Duo" | "Squad";
  max_players: number;
  start_date: string;
  map: string;
  room_type: "Classic" | "Clash Squad" | "Lone Wolf";
  custom_settings: {
    auto_aim: boolean;
    [key: string]: any;
  };
  entry_fee: number;
  prize_distribution: {
    [key: string]: number;
  };
  rules: string;
  host_id: string;
  status: "active" | "ongoing" | "ended" | "completed" | "cancelled";
  created_at: Timestamp;
  started_at?: Timestamp; // When the tournament was manually started by host
  ended_at?: Timestamp; // When the tournament was manually ended by host
  completed_at?: Timestamp; // When the tournament was marked as completed with winners
  participants: (string | Participant)[]; // Support both legacy string format and new object format
  filled_spots: number;
  room_id?: string | null;
  room_password?: string | null;
  winners?: {
    [position: string]: {
      uid: string;
      ign: string;
    };
  };
  // TTL field for automatic deletion - 1 hour after scheduled time
  ttl?: Timestamp;
  // Added by notification cloud function when email is sent
  notificationSent?: boolean;
  // New fields for prize distribution tracking
  total_prizes_distributed?: number; // Total amount of prizes distributed to winners
  host_earnings_distributed?: number; // Total amount distributed to host as earnings
  participantUids: string[]; // List of authUids of participants
  currentPrizePool: number; // Current prize pool accumulated from entry fees
}

// Create a new tournament
export const createTournament = async (tournamentData: Omit<TournamentFormData, "banner_image">) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("You must be logged in to create a tournament");
    }

    // Check if user is a verified host
    const userProfile = await getUserProfile(currentUser.uid);
    if (!userProfile.isHost) { 
      throw new Error("You must be a verified host to create tournaments. Please apply to become a host.");
    }

    // --- IGN/UID validation ---
    if (!userProfile.ign || userProfile.ign.length < 3) {
      throw new Error("You must update your IGN (in-game name) in your profile before hosting a tournament.");
    }
    if (!userProfile.uid || !/^[0-9]{8,12}$/.test(userProfile.uid)) {
      throw new Error("You must update your UID (8-12 digit Free Fire ID) in your profile before hosting a tournament.");
    }
    // --- END IGN/UID validation ---

    // Verify authentication state
    console.log("Current user ID:", currentUser.uid);

    // Validate required fields
    const requiredFields = [
      'name', 'description', 'mode', 'max_players', 'start_date',
      'map', 'room_type', 'entry_fee', 'prize_distribution', 'rules'
    ];

    const missingFields = requiredFields.filter(field => !tournamentData[field]);
    if (missingFields.length > 0) {
      throw new Error(`Missing required tournament fields: ${missingFields.join(', ')}`);
    }

    // Check if date is valid
    if (new Date(tournamentData.start_date).toString() === 'Invalid Date') {
      throw new Error('Invalid start date format');
    }

    // Check if prize distribution adds up to 100%
    const totalPrizePool = tournamentData.entry_fee * tournamentData.max_players;
    const prizeTotal = Object.values(tournamentData.prize_distribution).reduce((sum, value) => sum + value, 0);
    if (prizeTotal > totalPrizePool) {
      throw new Error(`Prize distribution total cannot exceed the total expected prize pool. Current total: ${prizeTotal}`);
    }

    // Don't set TTL during creation - only when tournament is started by host
    // The TTL will be set when the host manually starts the tournament

    // Prepare tournament data
    const tournament = {
      ...tournamentData,
      host_id: currentUser.uid,
      status: "active" as const,
      created_at: serverTimestamp(),
      participants: [],
      filled_spots: 0,
      participantUids: [], // Initialize participantUids
      currentPrizePool: 0, // Initialize currentPrizePool to 0 - will increase as users join
      // ttl will be set when host starts the tournament
    };

    console.log("Creating tournament:", tournament.name);

    // Add tournament to Firestore
    const docRef = await addDoc(collection(db, "tournaments"), tournament);

    return {
      id: docRef.id,
      ...tournament,
    };
  } catch (error) {
    console.error("Error creating tournament:", error);
    throw error;
  }
};

// Upload tournament banner image
export const uploadTournamentBanner = async (file: File): Promise<string> => {
  try {
    if (!file) {
      throw new Error("No file provided");
    }

    // Generate a unique file path
    const fileExt = file.name.split('.').pop();
    const fileName = `tournament-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const filePath = `tournament-images/${fileName}`;

    // Upload to Firebase Storage
    const storageRef = ref(storage, filePath);
    await uploadBytes(storageRef, file);

    // Get download URL
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error("Error uploading tournament banner:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to upload tournament banner: ${error.message}`);
    }
    throw new Error("Failed to upload tournament banner: Unknown error");
  }
};

// Get all tournaments
export const getTournaments = async () => {
  try {
    const q = query(
      collection(db, "tournaments"),
      orderBy("created_at", "desc")
    );

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Tournament[];
  } catch (error) {
    console.error("Error getting tournaments:", error);
    throw error;
  }
};

// Get tournaments hosted by the current user
export const getHostedTournaments = async () => {
  try {
    const currentUser = auth.currentUser;
    console.log("Current user in getHostedTournaments:", currentUser?.uid);

    if (!currentUser) {
      console.error("No authenticated user found");
      return []; // Return empty array instead of throwing an error
    }

    // Create a query to get tournaments hosted by the current user
    console.log("Creating query for host_id:", currentUser.uid);
    const q = query(
      collection(db, "tournaments"),
      where("host_id", "==", currentUser.uid),
      orderBy("created_at", "desc"),
      limit(100) // Add a limit to comply with security rules
    );

    console.log("Executing query...");

    try {
      const querySnapshot = await getDocs(q);
      console.log("Query executed, found", querySnapshot.docs.length, "documents");

      // Map the document data to Tournament objects
      const hostedTournaments = querySnapshot.docs.map(doc => {
        const data = doc.data();
        console.log("Tournament found:", doc.id, data.name);
        return {
          id: doc.id,
          ...data,
        } as Tournament;
      });

      console.log("Returning", hostedTournaments.length, "hosted tournaments");
      return hostedTournaments;
    } catch (queryError) {
      console.error("Error executing query:", queryError);
      return []; // Return empty array on query error
    }
  } catch (error) {
    console.error("Error getting hosted tournaments:", error);
    if (error instanceof FirestoreError) {
      switch (error.code) {
        case 'permission-denied':
          console.error("Permission denied: The user doesn't have access to tournaments");
          return []; // Return empty array instead of throwing
        case 'unavailable':
          console.error("Firebase service is currently unavailable");
          return []; // Return empty array instead of throwing
        default:
          console.error(`Firebase error: ${error.message}`);
          return []; // Return empty array instead of throwing
      }
    }
    // Return empty array for any other errors
    return [];
  }
};

// Get tournaments by status
export const getTournamentsByStatus = async (status: Tournament["status"]) => {
  try {
    const q = query(
      collection(db, "tournaments"),
      where("status", "==", status),
      orderBy("created_at", "desc")
    );

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Tournament[];
  } catch (error) {
    console.error(`Error getting ${status} tournaments:`, error);
    throw error;
  }
};

// Get tournament by ID
export const getTournamentById = async (id: string) => {
  try {
    const docRef = doc(db, "tournaments", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as Tournament;
    } else {
      console.warn(`Tournament with id ${id} not found.`);
      return null;
    }
  } catch (error) {
    console.error("Error getting tournament:", error);
    throw error;
  }
};

// Delete tournament by ID
export const deleteTournament = async (id: string) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("You must be logged in to delete a tournament");
    }

    // Get the tournament to verify ownership
    const tournament = await getTournamentById(id);

    if (!tournament) {
      throw new Error("Tournament not found");
    }

    // Verify the current user is the host
    if (tournament.host_id !== currentUser.uid) {
      throw new Error("You can only delete tournaments that you host");
    }

    // Delete the tournament
    const docRef = doc(db, "tournaments", id);
    await deleteDoc(docRef);

    return { success: true, message: "Tournament deleted successfully" };
  } catch (error) {
    console.error("Error deleting tournament:", error);

    if (error instanceof Error) {
      throw new Error(`Failed to delete tournament: ${error.message}`);
    }

    throw new Error("Failed to delete tournament: Unknown error");
  }
};

// Update tournament status
export const updateTournamentStatus = async (id: string, status: Tournament["status"]) => {
  try {
    const docRef = doc(db, "tournaments", id);
    await updateDoc(docRef, { status });

    return { id, status };
  } catch (error) {
    console.error("Error updating tournament status:", error);
    throw error;
  }
};

// Join tournament (for participants)
export const joinTournament = async (tournamentId: string) => {
  console.log("joinTournament function called with ID:", tournamentId);
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error("You must be logged in to join a tournament");
  }

  // Define tournament variable here to make it accessible outside the transaction
  let tournament: Tournament | null = null;

  try {
    const result = await runTransaction(db, async (transaction) => {
      const tournamentRef = doc(db, "tournaments", tournamentId);
      const userRef = doc(db, "users", currentUser.uid);

      // 1. Read tournament and user data within the transaction
      const tournamentDoc = await transaction.get(tournamentRef);
      if (!tournamentDoc.exists()) {
        throw new Error("Tournament not found");
      }
      // Assign to the outer tournament variable
      tournament = { id: tournamentDoc.id, ...tournamentDoc.data() } as Tournament;

      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists()) {
        throw new Error("User profile not found");
      }
      const userProfile = userDoc.data();

      // --- IGN/UID validation ---
      if (!userProfile.ign || userProfile.ign.length < 3) {
        throw new Error("You must update your IGN (in-game name) in your profile before joining a tournament.");
      }
      if (!userProfile.uid || !/^[0-9]{8,12}$/.test(userProfile.uid)) {
        throw new Error("You must update your UID (8-12 digit Free Fire ID) in your profile before joining a tournament.");
      }
      // --- END IGN/UID validation ---

      // 2. Perform validation checks
      if (tournament.status !== "active") {
        throw new Error(`Cannot join tournament with status: ${tournament.status}`);
      }
      if ((tournament.filled_spots || 0) >= (tournament.max_players || 0)) {
        throw new Error("Tournament is full");
      }
      if (tournament.host_id === currentUser.uid) {
        throw new Error("You cannot join your own tournament as you are the host");
      }
      const participants = tournament.participants || [];
      const participantUids = tournament.participantUids || [];
      if (participantUids.includes(currentUser.uid)) {
        throw new Error("You have already joined this tournament");
      }

      // 3. Deduct credits within the transaction
      const entryFee = tournament.entry_fee || 0;
      if (entryFee > 0) {
        const wallet = userProfile.wallet || { tournamentCredits: 0 };
        if (wallet.tournamentCredits < entryFee) {
          throw new Error("Insufficient tournament credits");
        }
        const newTournamentCredits = wallet.tournamentCredits - entryFee;
        transaction.update(userRef, { 'wallet.tournamentCredits': newTournamentCredits });

        // We will create the transaction record outside the main transaction
        // as it's less critical and simplifies the transaction logic.
      }

      // 4. Prepare tournament updates
      const participantObj = {
        customUid: userProfile.uid || '',
        ign: userProfile.ign || '',
        authUid: currentUser.uid
      };

      const updatedParticipants = [...participants, participantObj];
      const updatedParticipantUids = [...participantUids, currentUser.uid];
      const updatedFilledSpots = (tournament.filled_spots || 0) + 1;

      // 5. Update tournament within the transaction
      transaction.update(tournamentRef, {
        participants: updatedParticipants,
        participantUids: updatedParticipantUids,
        filled_spots: updatedFilledSpots,
        currentPrizePool: (tournament.currentPrizePool || 0) + entryFee, // Add entry fee to currentPrizePool
      });

      return { success: true, message: "You have successfully joined the tournament!" };
    });

    // (Optional but recommended) Create a credit transaction record for auditing.
    // This is done outside the main transaction.
    if (tournament && tournament.entry_fee > 0) {
      const creditTransactionData = {
        userId: currentUser.uid,
        type: 'tournament_join',
        amount: -tournament.entry_fee,
        walletType: 'tournament',
        description: `Joined tournament: ${tournament.name}`,
        transactionDetails: { tournamentId: tournament.id, tournamentName: tournament.name },
        createdAt: serverTimestamp()
      };
      await addDoc(collection(db, "creditTransactions"), creditTransactionData);
    }

    return result;

  } catch (error) {
    console.error("Error joining tournament:", error);
    // Re-throw the error so the UI can catch it
    throw error;
  }
};

// Save tournament as draft
export const saveTournamentDraft = async (tournamentData: Omit<TournamentFormData, "banner_image">) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("You must be logged in to save a tournament draft");
    }

    // Prepare draft data
    const draft = {
      ...tournamentData,
      host_id: currentUser.uid,
      updated_at: serverTimestamp(),
    };

    // Check if a draft already exists for this user
    const q = query(
      collection(db, "tournament_drafts"),
      where("host_id", "==", currentUser.uid)
    );

    const querySnapshot = await getDocs(q);

    // If a draft exists, update it; otherwise, create a new one
    if (!querySnapshot.empty) {
      const draftDoc = querySnapshot.docs[0];
      await updateDoc(doc(db, "tournament_drafts", draftDoc.id), draft);

      return {
        id: draftDoc.id,
        ...draft,
      };
    } else {
      const docRef = await addDoc(collection(db, "tournament_drafts"), draft);

      return {
        id: docRef.id,
        ...draft,
      };
    }
  } catch (error) {
    console.error("Error saving tournament draft:", error);
    throw error;
  }
};

// Get tournament draft for current user
export const getTournamentDraft = async () => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("You must be logged in to get your tournament draft");
    }

    const q = query(
      collection(db, "tournament_drafts"),
      where("host_id", "==", currentUser.uid),
      limit(1)
    );

    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const draftDoc = querySnapshot.docs[0];

      return {
        id: draftDoc.id,
        ...draftDoc.data(),
      } as Omit<Tournament, "status" | "created_at" | "participants" | "filled_spots"> & { updated_at: Timestamp };
    }

    return null;
  } catch (error) {
    console.error("Error getting tournament draft:", error);
    throw error;
  }
};

// Add this new function
export const updateTournamentRoomDetails = async (
  tournamentId: string,
  roomId: string,
  roomPassword: string
) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("You must be logged in to update room details.");
    }

    const tournamentRef = doc(db, "tournaments", tournamentId);
    const tournamentSnap = await getDoc(tournamentRef);

    if (!tournamentSnap.exists() || tournamentSnap.data().host_id !== currentUser.uid) {
      throw new Error("You are not authorized to update this tournament or it does not exist.");
    }

    await updateDoc(tournamentRef, {
      room_id: roomId,
      room_password: roomPassword,
    });

    return { success: true, message: "Room details updated successfully." };
  } catch (error) {
    console.error("Error updating tournament room details:", error);
    // Check if error is an instance of Error and has a message property
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, message: errorMessage };
  }
};

// Start tournament (only for host)
export const startTournament = async (tournamentId: string) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("You must be logged in to start a tournament");
    }

    // Get the tournament to verify ownership and check timing
    const tournament = await getTournamentById(tournamentId);

    if (!tournament) {
      throw new Error("Tournament not found");
    }

    // Verify the current user is the host
    if (tournament.host_id !== currentUser.uid) {
      throw new Error("Only the tournament host can start the tournament");
    }

    // Check if tournament can be started (20 minutes before scheduled time)
    const now = new Date();
    const scheduledStartTime = new Date(tournament.start_date);
    const twentyMinutesBeforeStart = new Date(scheduledStartTime.getTime() - 20 * 60 * 1000);

    if (now.getTime() < twentyMinutesBeforeStart.getTime()) {
      const timeUntilStartWindow = twentyMinutesBeforeStart.getTime() - now.getTime();
      const minutesUntilStart = Math.ceil(timeUntilStartWindow / (1000 * 60));
      throw new Error(`Tournament can only be started 20 minutes before scheduled time. You can start it in ${minutesUntilStart} minutes.`);
    }

    // Check if tournament is in the correct status
    if (tournament.status !== "active") {
      throw new Error(`Tournament cannot be started. Current status: ${tournament.status}`);
    }

    // Check if TTL is already set (automatically by cloud function)
    let ttlTimestamp = tournament.ttl;

    // If TTL is not set, calculate it (2 hours after scheduled start time)
    if (!ttlTimestamp) {
      const ttlDate = new Date(scheduledStartTime.getTime() + 2 * 60 * 60 * 1000); // Add 2 hours to scheduled time
      ttlTimestamp = Timestamp.fromDate(ttlDate);
    }

    // Update tournament status to "ongoing" and set TTL if not already set
    const docRef = doc(db, "tournaments", tournamentId);
    const updateData: any = {
      status: "ongoing",
      started_at: serverTimestamp() // Add timestamp when tournament was started
    };

    // Only set TTL if it's not already set
    if (!tournament.ttl) {
      updateData.ttl = ttlTimestamp;
    }

    await updateDoc(docRef, updateData);

    console.log(`Tournament ${tournamentId} started successfully with TTL set to ${ttlTimestamp.toDate().toISOString()} (2 hours after scheduled time)`);

    return {
      success: true,
      message: "Tournament started successfully",
      tournament: {
        ...tournament,
        status: "ongoing" as const,
        ttl: ttlTimestamp
      }
    };
  } catch (error) {
    console.error("Error starting tournament:", error);
    throw error;
  }
};

// Check if tournament can be started by host
export const canStartTournament = (tournament: Tournament, currentUserId?: string) => {
  if (!currentUserId || tournament.host_id !== currentUserId) {
    return {
      canStart: false,
      reason: "Only the tournament host can start the tournament"
    };
  }

  if (tournament.status !== "active") {
    return {
      canStart: false,
      reason: `Tournament cannot be started. Current status: ${tournament.status}`
    };
  }

  const now = new Date();
  const scheduledStartTime = new Date(tournament.start_date);
  const twentyMinutesBeforeStart = new Date(scheduledStartTime.getTime() - 20 * 60 * 1000);

  if (now.getTime() < twentyMinutesBeforeStart.getTime()) {
    const timeUntilStartWindow = twentyMinutesBeforeStart.getTime() - now.getTime();
    const minutesUntilStart = Math.ceil(timeUntilStartWindow / (1000 * 60));
    return {
      canStart: false,
      reason: `Tournament can only be started 20 minutes before scheduled time. You can start it in ${minutesUntilStart} minutes.`
    };
  }

  return {
    canStart: true,
    reason: "Tournament is ready to start"
  };
};

// End tournament (only for host)
export const endTournament = async (tournamentId: string) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("You must be logged in to end a tournament");
    }

    // Get the tournament to verify ownership
    const tournament = await getTournamentById(tournamentId);

    if (!tournament) {
      throw new Error("Tournament not found");
    }

    // Verify the current user is the host
    if (tournament.host_id !== currentUser.uid) {
      throw new Error("Only the tournament host can end the tournament");
    }

    // Check if tournament is in the correct status (must be ongoing)
    if (tournament.status !== "ongoing") {
      throw new Error(`Tournament cannot be ended. Current status: ${tournament.status}`);
    }

    // Update tournament status to "ended" and set TTL for 10 minutes (for prize distribution)
    const endedAt = new Date();
    const ttlDate = new Date(endedAt.getTime() + 10 * 60 * 1000); // Add 10 minutes for prize distribution
    const ttlTimestamp = Timestamp.fromDate(ttlDate);

    const docRef = doc(db, "tournaments", tournamentId);
    await updateDoc(docRef, {
      status: "ended",
      ended_at: serverTimestamp(), // Add timestamp when tournament was ended
      ttl: ttlTimestamp // Set TTL to 10 minutes after ending for prize distribution
    });

    console.log(`Tournament ${tournamentId} ended successfully with TTL set to ${ttlDate.toISOString()} (10 minutes for prize distribution)`);

    return {
      success: true,
      message: "Tournament ended successfully",
      tournament: {
        ...tournament,
        status: "ended" as const
      }
    };
  } catch (error) {
    console.error("Error ending tournament:", error);
    throw error;
  }
};

// Check if tournament can be ended by host
export const canEndTournament = (tournament: Tournament, currentUserId?: string) => {
  if (!currentUserId || tournament.host_id !== currentUserId) {
    return {
      canEnd: false,
      reason: "Only the tournament host can end the tournament"
    };
  }

  if (tournament.status !== "ongoing") {
    return {
      canEnd: false,
      reason: `Tournament cannot be ended. Current status: ${tournament.status}`
    };
  }

  return {
    canEnd: true,
    reason: "Tournament is ready to be ended"
  };
};

// Set TTL for tournaments that have reached their scheduled start time
export const setTTLForScheduledTournaments = async () => {
  try {
    const now = new Date();
    const nowTimestamp = Timestamp.fromDate(now);

    // Query for active tournaments that have reached their scheduled start time but don't have TTL set yet
    const tournamentsQuery = query(
      collection(db, "tournaments"),
      where("status", "==", "active"),
      where("start_date", "<=", nowTimestamp),
      where("ttl", "==", null)
    );

    const tournaments = await getDocs(tournamentsQuery);

    if (tournaments.empty) {
      console.log("No tournaments found that need TTL set");
      return {
        success: true,
        updatedCount: 0,
        message: "No tournaments need TTL set"
      };
    }

    console.log(`Found ${tournaments.size} tournaments that need TTL set`);

    // Set TTL for tournaments in batches
    const batch = writeBatch(db);
    let updatedCount = 0;

    tournaments.forEach((doc) => {
      const tournamentData = doc.data();
      const scheduledStartTime = new Date(tournamentData.start_date);

      // Calculate TTL (2 hours after scheduled start time)
      const ttlDate = new Date(scheduledStartTime.getTime() + 2 * 60 * 60 * 1000); // Add 2 hours
      const ttlTimestamp = Timestamp.fromDate(ttlDate);

      console.log(`Setting TTL for tournament: ${doc.id} - ${tournamentData.name} to ${ttlDate.toISOString()}`);

      batch.update(doc.ref, {
        ttl: ttlTimestamp
      });
      updatedCount++;
    });

    // Commit the batch update
    await batch.commit();

    console.log(`Successfully set TTL for ${updatedCount} tournaments`);

    return {
      success: true,
      updatedCount,
      message: `Set TTL for ${updatedCount} tournaments`
    };

  } catch (error) {
    console.error("Error setting tournament TTL:", error);
    return {
      success: false,
      updatedCount: 0,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
};

// Initialize automatic TTL setting
export const initializeAutomaticTTLSetting = () => {
  // Check for tournaments that need TTL set every 5 minutes
  setInterval(async () => {
    try {
      await setTTLForScheduledTournaments();
    } catch (error) {
      console.error("Error in automatic TTL setting:", error);
    }
  }, 5 * 60 * 1000); // 5 minutes

  // Also check immediately on initialization
  setTTLForScheduledTournaments().catch(console.error);

  console.log("✅ Automatic TTL setting initialized (5-minute intervals)");
};