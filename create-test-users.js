import admin from 'firebase-admin';
import fs from 'fs';
import { faker } from '@faker-js/faker';

// Initialize Firebase Admin
const serviceAccount = JSON.parse(fs.readFileSync("D:/freefire-tournaments-ba2a6-firebase-adminsdk-fbsvc-2ede2bbed8.json"));
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const createTestUsers = async (count) => {
  console.log(`Creating ${count} test users...`);
  const users = [];
  for (let i = 0; i < count; i++) {
    const email = faker.internet.email();
    const password = 'Password123!'; // Use a more secure password
    const displayName = faker.person.fullName();

    try {
      const userRecord = await admin.auth().createUser({
        email,
        password,
        displayName,
      });
      console.log(`Successfully created new user: ${displayName} (${email})`);
      users.push({
          uid: userRecord.uid,
          displayName: userRecord.displayName,
          email: userRecord.email,
      });
    } catch (error) {
      console.error(`Error creating user ${email}:`, error.message);
    }
  }

  // Save users to a file to be used by the tournament populator
  fs.writeFileSync('test-users.json', JSON.stringify(users, null, 2));
  console.log('Test users saved to test-users.json');
  return users;
};

createTestUsers(15); 