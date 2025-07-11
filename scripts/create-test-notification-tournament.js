// Create a test tournament that will trigger a notification
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, Timestamp } = require('firebase/firestore');

// Initialize Firebase (replace with your config if needed)
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

async function createTestNotificationTournament() {
  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    // Calculate a start time exactly 20 minutes from now
    const now = new Date();
    const startTime = new Date(now.getTime() + 20 * 60 * 1000);
    
    console.log(`Creating test tournament scheduled to start at ${startTime.toLocaleString()}`);
    
    // Get your user ID - replace with your actual user ID
    const hostId = process.env.YOUR_USER_ID || 'YOUR_USER_ID_HERE';
    
    // Create the tournament document
    const tournamentData = {
      name: `Test Notification Tournament ${now.toLocaleTimeString()}`,
      description: "This is a test tournament created to test the notification system",
      start_date: Timestamp.fromDate(startTime),
      end_date: Timestamp.fromDate(new Date(startTime.getTime() + 60 * 60 * 1000)), // 1 hour after start
      status: "active",
      host_id: hostId,
      max_players: 10,
      filled_spots: 0,
      mode: "Squad",
      map: "Bermuda",
      room_type: "Private",
      entry_fee: 0,
      prize_pool: 0,
      notificationSent: false,
      created_at: Timestamp.now()
    };
    
    // Add the tournament to Firestore
    const docRef = await addDoc(collection(db, "tournaments"), tournamentData);
    
    console.log(`✅ Test tournament created successfully with ID: ${docRef.id}`);
    console.log(`The notification should be sent when the endpoint is called.`);
    console.log(`To test, run: node test-notification-endpoint.js`);
    
  } catch (error) {
    console.error("Error creating test tournament:", error);
  }
}

// Run the function
createTestNotificationTournament(); 