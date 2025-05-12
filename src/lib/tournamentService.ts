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
  FirestoreError
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage, auth } from "./firebase";
import { TournamentFormData } from "@/pages/TournamentCreate";

// Tournament type definition
export interface Tournament {
  id: string;
  name: string;
  description: string;
  mode: "Solo" | "Duo" | "Squad";
  max_players: number;
  start_date: string;
  map: string;
  room_type: "Classic" | "Clash Squad";
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
  status: "active" | "ongoing" | "completed" | "cancelled";
  created_at: Timestamp;
  participants: string[];
  filled_spots: number;
  room_id?: string | null;
  room_password?: string | null;
}

// Create a new tournament
export const createTournament = async (tournamentData: Omit<TournamentFormData, "banner_image">) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("You must be logged in to create a tournament");
    }
    
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
    const prizeTotal = Object.values(tournamentData.prize_distribution).reduce((sum, value) => sum + value, 0);
    if (prizeTotal !== 100) {
      throw new Error(`Prize distribution total must be 100%. Current total: ${prizeTotal}%`);
    }
    
    // Prepare tournament data
    const tournament = {
      ...tournamentData,
      host_id: currentUser.uid,
      status: "active" as const,
      created_at: serverTimestamp(),
      participants: [],
      filled_spots: 0,
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
  let retryCount = 0;
  const maxRetries = 2;
  
  while (retryCount <= maxRetries) {
    try {
      // Check authentication
      const currentUser = auth.currentUser;
      console.log("Current user:", currentUser?.uid);
      if (!currentUser) {
        throw new Error("You must be logged in to join a tournament");
      }
      
      // Get the tournament with error handling
      console.log("Fetching tournament data");
      let tournament = null;
      try {
        tournament = await getTournamentById(tournamentId);
      } catch (fetchError) {
        console.error("Error fetching tournament:", fetchError);
        throw new Error("Could not load tournament data. Please try again.");
      }
      
      console.log("Tournament data:", tournament);
      
      if (!tournament) {
        throw new Error("Tournament not found");
      }
      
      // Check tournament status
      if (tournament.status !== "active") {
        throw new Error(`Cannot join tournament with status: ${tournament.status}`);
      }
      
      // Check if the tournament is full
      const filledSpots = tournament.filled_spots || 0;
      const maxPlayers = tournament.max_players || 0;
      
      console.log("Checking if tournament is full:", {
        filledSpots: filledSpots,
        maxPlayers: maxPlayers
      });
      
      if (filledSpots >= maxPlayers) {
        throw new Error("Tournament is full");
      }
      
      // Ensure participants array exists
      const participants = Array.isArray(tournament.participants) ? tournament.participants : [];
      
      // Check if the user is already a participant
      console.log("Checking if user is already a participant:", {
        participants: participants,
        userId: currentUser.uid,
        includes: participants.includes(currentUser.uid)
      });
      
      if (participants.includes(currentUser.uid)) {
        throw new Error("You have already joined this tournament");
      }
      
      // Check if the user is the host
      if (tournament.host_id === currentUser.uid) {
        throw new Error("You cannot join your own tournament as you are the host");
      }
      
      // Prepare update data
      const updatedParticipants = [...participants, currentUser.uid];
      const updatedFilledSpots = filledSpots + 1;
      
      // Update the tournament
      console.log("Updating tournament with new participant", {
        previousParticipants: participants, 
        newParticipants: updatedParticipants,
        previousFilledSpots: filledSpots,
        newFilledSpots: updatedFilledSpots
      });
      
      const docRef = doc(db, "tournaments", tournamentId);
      
      try {
        await updateDoc(docRef, {
          participants: updatedParticipants,
          filled_spots: updatedFilledSpots,
        });
        
        console.log("Tournament joined successfully");
        return { 
          success: true,
          message: "You have successfully joined the tournament!" 
        };
      } catch (updateError) {
        console.error("Error updating tournament:", updateError);
        
        // If it's a permission error, throw a specific error
        if ((updateError as FirestoreError).code === 'permission-denied') {
          throw new Error("You don't have permission to join this tournament. This might be due to security rules.");
        }
        
        // For other errors, we might retry
        if (retryCount < maxRetries) {
          console.log(`Retry attempt ${retryCount + 1} of ${maxRetries}`);
          retryCount++;
          continue;
        }
        
        throw updateError;
      }
    } catch (error) {
      console.error("Error joining tournament:", error);
      
      // If we've reached max retries, or it's a non-retryable error, rethrow
      if (retryCount >= maxRetries || 
          error instanceof Error && 
          ["You must be logged in", "Tournament not found", "Tournament is full", "You have already joined"].some(msg => error.message.includes(msg))) {
        throw error;
      }
      
      // Otherwise, retry
      console.log(`Retry attempt ${retryCount + 1} of ${maxRetries}`);
      retryCount++;
    }
  }
  
  // If we've exhausted all retries
  throw new Error("Failed to join tournament after multiple attempts. Please try again later.");
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