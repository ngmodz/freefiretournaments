require('dotenv').config();
const admin = require('firebase-admin');
const axios = require('axios');

// =================================================================================================
// Service Account Configuration
// =================================================================================================
// The script now reads the service account JSON from the .env file.
// Ensure your .env file has the FIREBASE_SERVICE_ACCOUNT variable.
// =================================================================================================
let serviceAccount;
try {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT is not set in the .env file.');
  }
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} catch (error) {
  console.error('Error parsing FIREBASE_SERVICE_ACCOUNT from .env file.', error);
  process.exit(1);
}

// --- Test Configuration ---
const HOST_EMAIL = 'nishantgrewal2005@gmail.com';
const PARTICIPANT_EMAILS = [
  'microft1007@gmail.com', 
  'aiwithhindi@gmail.com',
  'ngjaat6@gmail.com'
];
const MODERATOR_API_URL = 'https://freefiretournaments.vercel.app/api/automated-moderator';
// If you set a CRON_SECRET, uncomment the line below and add your secret.
// const MODERATOR_API_URL = 'https://freefiretournaments.vercel.app/api/automated-moderator?secret=YOUR_SECRET';
const ENTRY_FEE = 10; // Credits


// --- Firebase Initialization ---
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (error) {
  if (error.code === 'app/duplicate-app') {
    console.log('Firebase Admin already initialized.');
  } else {
    console.error('Firebase Admin initialization error:', error);
    process.exit(1);
  }
}
const db = admin.firestore();

// --- Helper Functions ---

/** Finds a user by email and returns their UID and IGN. */
async function findUserByEmail(email) {
  console.log(`Finding user: ${email}`);
  const userQuery = await db.collection('users').where('email', '==', email).limit(1).get();
  if (userQuery.empty) throw new Error(`User with email ${email} not found.`);
  const userDoc = userQuery.docs[0];
  console.log(`Found user: ${userDoc.id}`);
  return { uid: userDoc.id, ign: userDoc.data().ign || 'TestIGN', data: userDoc.data() };
}

/** Creates a test tournament with a specific start date. */
async function createTournament(host, startDate, name, minParticipants = 2) {
  console.log(`Creating tournament "${name}"...`);
  const tournamentData = {
    name,
    host_id: host.uid,
    host_ign: host.ign,
    start_date: admin.firestore.Timestamp.fromDate(startDate),
    status: 'active',
    entry_fee: ENTRY_FEE,
    min_participants: minParticipants,
    filled_spots: 0,
    participants: [],
    participantUids: [],
    // Add other required tournament fields with default values
    description: 'This is a test tournament.',
    mode: 'Solo',
    max_players: 50,
    map: 'Bermuda',
    room_type: 'Classic',
    prize_distribution: { '1st': 100 },
    rules: 'No cheating.',
    created_at: admin.firestore.FieldValue.serverTimestamp(),
  };
  const tournamentRef = await db.collection('tournaments').add(tournamentData);
  console.log(`Created tournament with ID: ${tournamentRef.id}`);
  return tournamentRef;
}

/** Simulates a user joining a tournament. */
async function joinTournament(tournamentRef, user) {
  console.log(`User ${user.ign} (${user.uid}) is joining tournament ${tournamentRef.id}`);
  return db.runTransaction(async (transaction) => {
    const tournamentDoc = await transaction.get(tournamentRef);
    if (!tournamentDoc.exists) throw new Error("Tournament not found");

    const newParticipant = { authUid: user.uid, ign: user.ign, customUid: user.data.uid || '' };
    
    transaction.update(tournamentRef, {
      participants: admin.firestore.FieldValue.arrayUnion(newParticipant),
      participantUids: admin.firestore.FieldValue.arrayUnion(user.uid),
      filled_spots: admin.firestore.FieldValue.increment(1)
    });
  });
}

/** Calls the moderator API endpoint. */
async function triggerModerator() {
  console.log(`\n📞 Triggering moderator API at: ${MODERATOR_API_URL}`);
  try {
    const response = await axios.get(MODERATOR_API_URL);
    console.log('✅ API Response:', response.data);
  } catch (error) {
    console.error('❌ API Error:', error.response ? error.response.data : error.message);
  }
}

// --- Main Test Function ---
async function runAggressiveTest() {
  console.log('--- aggressive-test-moderator.js ---');
  console.log('This script will create live data in your Firestore database.');

  const host = await findUserByEmail(HOST_EMAIL);
  const participants = await Promise.all(PARTICIPANT_EMAILS.map(findUserByEmail));

  // --- Test 1: Host Penalty ---
  console.log('\n=================================================');
  console.log('--- TEST 1: HOST PENALTY (15 minutes late)  ---');
  console.log('=================================================');
  const penaltyTestStartDate = new Date(Date.now() - 15 * 60 * 1000);
  const penaltyTournamentRef = await createTournament(host, penaltyTestStartDate, "Aggressive Penalty Test");
  
  await Promise.all(participants.map(p => joinTournament(penaltyTournamentRef, p)));
  
  await triggerModerator();
  console.log('\nACTION: Check host email (`nishantgrewal2005@gmail.com`) for a penalty notification.');
  console.log('ACTION: Check host credit balance in Firestore to confirm 10 credits were deducted.');

  // --- Test 2: Tournament Cancellation ---
  console.log('\n======================================================');
  console.log('--- TEST 2: CANCELLATION & REFUND (25 minutes late) ---');
  console.log('======================================================');
  const cancelTestStartDate = new Date(Date.now() - 25 * 60 * 1000);
  const cancelTournamentRef = await createTournament(host, cancelTestStartDate, "Aggressive Cancellation Test");

  await Promise.all(participants.map(p => joinTournament(cancelTournamentRef, p)));

  await triggerModerator();
  console.log('\nACTION: Check host email for a cancellation notification.');
  console.log('ACTION: Check participant emails for cancellation and refund notifications.');
  console.log('ACTION: Check participant credit balances to confirm they were refunded.');
  
  console.log('\n\n--- Test complete ---');
}

runAggressiveTest().catch(error => {
  console.error("\n--- A critical error occurred during the test ---");
  console.error(error);
}); 