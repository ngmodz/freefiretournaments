import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getFirebaseConfig, debugEnvironment } from './firebase-config-helper.js';

// Initialize Firebase Admin with service account
let firebaseApp;
let db;

// Initialize Firebase Admin
try {
  // For Vercel, use the environment variables
  const firebaseConfig = getFirebaseConfig();
  
  // Check if we have environment variables for admin initialization
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // Parse the service account JSON
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    
    // Initialize with the service account
    firebaseApp = initializeApp({
      credential: cert(serviceAccount)
    });
  } else {
    // Initialize without service account (will use default application credentials)
    firebaseApp = initializeApp({
      projectId: firebaseConfig.projectId
    });
  }
  
  // Get Firestore
  db = getFirestore(firebaseApp);
} catch (error) {
  console.error('Firebase Admin initialization error:', error);
}

/**
 * API endpoint to create a test tournament with admin privileges
 * This bypasses client SDK permission issues
 */
export default async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }
  
  try {
    console.log('Creating test tournament via API');
    
    // Log environment details for debugging
    console.log('Environment:', debugEnvironment());
    
    // Get tournament data from request body
    const tournamentData = req.body;
    
    // Validate required fields
    if (!tournamentData.name || !tournamentData.start_date || !tournamentData.host_email) {
      return res.status(400).json({ 
        error: 'Missing required fields. Required: name, start_date, host_email' 
      });
    }
    
    // Find or create host user
    let hostId;
    let hostUser;
    
    // Query for existing user with this email
    const usersRef = db.collection('users');
    const userQuerySnapshot = await usersRef.where('email', '==', tournamentData.host_email).limit(1).get();
    
    if (userQuerySnapshot.empty) {
      console.log(`Creating new host user with email: ${tournamentData.host_email}`);
      
      // Create a new user with this email
      const newUserRef = usersRef.doc(`test-host-${Date.now()}`);
      const userData = {
        email: tournamentData.host_email,
        name: 'Test Host',
        created_at: new Date(),
        credits: 100,
        total_credits: 100,
        wallet_credits: 50
      };
      
      await newUserRef.set(userData);
      hostId = newUserRef.id;
      hostUser = userData;
      
      console.log(`Created new host user with ID: ${hostId}`);
    } else {
      // Use existing user
      const userDoc = userQuerySnapshot.docs[0];
      hostId = userDoc.id;
      hostUser = userDoc.data();
      
      console.log(`Using existing host user with ID: ${hostId}`);
    }
    
    // Parse start date string to Firestore timestamp
    const startDate = new Date(tournamentData.start_date);
    
    // Create tournament object
    const tournament = {
      name: tournamentData.name,
      status: 'active',
      mode: tournamentData.mode || 'Solo',
      map: tournamentData.map || 'Bermuda',
      room_type: tournamentData.room_type || 'Classic',
      max_players: tournamentData.max_players || 12,
      filled_spots: tournamentData.filled_spots || 8,
      entry_fee: tournamentData.entry_fee || 10,
      entry_fee_credits: tournamentData.entry_fee || 10,
      prize_pool: tournamentData.prize_pool || 100,
      start_date: startDate,
      host_id: hostId,
      host_credits: tournamentData.host_credits || 10,
      notificationSent: false,
      created_at: new Date(),
      game: tournamentData.game || 'free-fire',
      tournament_type: tournamentData.tournament_type || 'solo',
      room_id: tournamentData.room_id || '',
      room_password: tournamentData.room_password || '',
      rules: tournamentData.rules || 'Standard tournament rules',
      description: tournamentData.description || 'Test tournament for notification system'
    };
    
    // Add tournament to Firestore
    const tournamentRef = await db.collection('tournaments').add(tournament);
    
    console.log(`Created tournament with ID: ${tournamentRef.id}`);
    
    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Tournament created successfully',
      tournamentId: tournamentRef.id,
      hostId: hostId,
      startTime: startDate.toISOString(),
      notificationWindow: {
        start: new Date(startDate.getTime() - (21 * 60 * 1000)).toISOString(),
        end: new Date(startDate.getTime() - (19 * 60 * 1000)).toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error creating tournament:', error);
    return res.status(500).json({ 
      error: 'Failed to create tournament',
      message: error.message
    });
  }
}
