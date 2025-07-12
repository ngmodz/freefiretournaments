// A script to create a fresh, correctly-encoded .env file.
import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const targetEnvPath = path.join(rootDir, '.env');

const envContent = `# === Vercel & App URLs ===
API_URL="http://localhost:3002"
APP_URL="http://localhost:8083"
NEXT_PUBLIC_APP_URL="http://localhost:8080"
VITE_APP_URL="http://localhost:8083"

# === Cashfree Payment Configuration ===
CASHFREE_APP_ID="YOUR_CASHFREE_APP_ID"
CASHFREE_ENVIRONMENT="SANDBOX"
CASHFREE_SECRET_KEY="YOUR_CASHFREE_SECRET_KEY"
VITE_CASHFREE_API_VERSION="2023-08-01"
VITE_CASHFREE_APP_ID="YOUR_CASHFREE_APP_ID"
VITE_CASHFREE_ENVIRONMENT="SANDBOX"

# === Firebase Configuration (Client-side) ===
VITE_FIREBASE_API_KEY="AIzaSyB8rpTnmKUQ9wi9OzvnHDm5EJ55LzlOx8Q"
VITE_FIREBASE_APP_ID="1:605081354961:web:9cfda0d8e1d537c5223bf0"
VITE_FIREBASE_AUTH_DOMAIN="freefire-tournaments-ba2a6.firebaseapp.com"
VITE_FIREBASE_MEASUREMENT_ID="G-4PHRYS0RL6"
VITE_FIREBASE_MESSAGING_SENDER_ID="605081354961"
VITE_FIREBASE_PROJECT_ID="freefire-tournaments-ba2a6"
VITE_FIREBASE_STORAGE_BUCKET="freefire-tournaments-ba2a6.firebasestorage.app"

# === Firebase Admin/Server-side ===
SERVICE_ACCOUNT_KEY_PATH="D:\\freefire-tournaments-ba2a6-firebase-adminsdk-fbsvc-2ede2bbed8.json"

# === Email Configuration ===
EMAIL_USER=freefiretournaments03@gmail.com
EMAIL_PASSWORD=eyym uhok glkx gony
ADMIN_EMAIL=nishantgrewal2005@gmail.com
`;

console.log('--- .env File Re-creator ---');

try {
  // Write the content with explicit UTF-8 encoding, creating the file
  fs.writeFileSync(targetEnvPath, envContent.trim(), { encoding: 'utf-8' });
  console.log(`✅ Successfully created fresh .env file at: ${targetEnvPath}`);
  
  console.log('\nThe .env file has been recreated with the correct encoding and content.');
  console.log('Please try running the admin setup script again now:');
  console.log('node scripts/setup-admin-user.js --list');
  
} catch (error) {
  console.error('\n❌ An error occurred while creating the file:');
  console.error(error.message);
  process.exit(1);
} 