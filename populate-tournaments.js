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

    for (let i = 0; i < 8; i++) {
      const tournamentId = uuidv4();
      const prizePool = Math.floor(Math.random() * (50000 - 10000 + 1)) + 10000;
      const entryFee = Math.round((prizePool * 0.1) / 50) * 50;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + (i * 3));
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 1);

      const tournament = {
        name: tournamentNames[i % tournamentNames.length],
        description: `An epic battle for a prize pool of ${prizePool}. Do you have what it takes to emerge victorious?`,
        prize_pool: prizePool,
        entry_fee: entryFee,
        max_players: 50,
        filled_spots: 0,
        start_date: admin.firestore.Timestamp.fromDate(startDate),
        end_date: admin.firestore.Timestamp.fromDate(endDate),
        status: 'upcoming',
        host_id: host.uid,
        participants: [],
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