import admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

// Replace with your service account key file path
const serviceAccount = JSON.parse(fs.readFileSync("D:/freefire-tournaments-ba2a6-firebase-adminsdk-fbsvc-2ede2bbed8.json"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const tournamentNames = [
    "Vanguard Championship",
    "Apex Legends Invitational",
    "Phoenix Rising Tournament",
    "Elite Gamers Showdown",
    "Cybernetic Arena",
    "Omega Protocol",
    "Hydra Series",
    "Titan Clash"
];

const createTournaments = async () => {
  try {
    const hostEmail = "nishantgrewal2005@gmail.com";
    const host = await admin.auth().getUserByEmail(hostEmail);
    const maps = ["Bermuda", "Kalahari", "Purgatory"];
    const modes = ["Solo", "Duo", "Squad"];
    const testUsers = JSON.parse(fs.readFileSync('test-users.json'));

    for (let i = 0; i < 8; i++) {
      const tournamentId = uuidv4();
      const prizePool = Math.floor(Math.random() * (1000 - 800 + 1)) + 800;
      const entryFee = Math.floor(Math.random() * (250 - 150 + 1)) + 150;
      
      let startDate = new Date();
      let endDate = new Date();
      let status = '';

      if (i < 3) {
        // --- Ended Tournaments ---
        status = 'ended';
        startDate.setDate(startDate.getDate() - ((i + 1) * 4)); // 4, 8, 12 days in the past
        endDate.setDate(startDate.getDate() + 1); // Lasts for one day
      } else if (i < 5) {
        // --- Live/Ongoing Tournaments ---
        status = 'ongoing';
        startDate.setDate(startDate.getDate() - 1); // Started yesterday
        startDate.setHours(startDate.getHours() - (i-2)); // Stagger start times
        endDate.setDate(startDate.getDate() + 2); // Ends tomorrow
      } else {
        // --- Upcoming Tournaments (status should be 'active' for the UI) ---
        status = 'active';
        startDate.setDate(startDate.getDate() + ((i - 4) * 3)); // 3, 6, 9 days in the future
        endDate.setDate(startDate.getDate() + 1); // Lasts for one day
      }

      // Add a random number of test users to the tournament
      const participantCount = Math.floor(Math.random() * 10);
      const participants = [];
      const participantUids = [];

      // Get a shuffled list of users to pick from
      const shuffledUsers = [...testUsers].sort(() => 0.5 - Math.random());
      
      // Ensure we don't try to add more participants than we have test users
      const numParticipantsToAdd = Math.min(participantCount, shuffledUsers.length);

      for(let j = 0; j < numParticipantsToAdd; j++) {
          const user = shuffledUsers[j];
          if (user) {
            participants.push({
                authUid: user.uid,
                displayName: user.displayName,
                email: user.email
            });
            participantUids.push(user.uid);
          }
      }

      const tournament = {
        name: tournamentNames[i % tournamentNames.length],
        description: `An epic battle for a prize pool of ${prizePool}. Do you have what it takes to emerge victorious?`,
        prize_pool: prizePool,
        entry_fee: entryFee,
        max_players: 50,
        filled_spots: participants.length,
        start_date: admin.firestore.Timestamp.fromDate(startDate),
        end_date: admin.firestore.Timestamp.fromDate(endDate),
        status: status,
        host_id: host.uid,
        participants: participants,
        participantUids: participantUids,
        game: 'Free Fire',
        map: maps[i % maps.length],
        mode: modes[i % modes.length],
        isFeatured: Math.random() < 0.3,
        rules: "Standard tournament rules apply. No cheating or hacking. All decisions by the admin are final.",
        streamUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        created_at: admin.firestore.FieldValue.serverTimestamp()
      };

      await db.collection('tournaments').doc(tournamentId).set(tournament);
      console.log(`Successfully created tournament: ${tournament.name}`);
    }
    console.log('Finished creating tournaments.');
  } catch (error) {
    console.error('Error creating tournaments:', error);
  }
};

createTournaments(); 