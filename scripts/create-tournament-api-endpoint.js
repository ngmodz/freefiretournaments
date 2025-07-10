import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * This script creates the API endpoint for tournament creation
 * It copies the required files to the API directory
 */
function createTournamentAPIEndpoint() {
  console.log('🔧 CREATING TOURNAMENT API ENDPOINT 🔧');
  console.log('=======================================');
  
  try {
    // Check if the API endpoint file already exists
    const apiFilePath = path.resolve(__dirname, '../api/create-test-tournament.js');
    
    if (fs.existsSync(apiFilePath)) {
      console.log('✅ API endpoint already exists at:');
      console.log(apiFilePath);
    } else {
      console.error('❌ API endpoint file not found. Please run:');
      console.error('node scripts/create-tournament-via-api.js');
      return;
    }
    
    // Check for the helper file
    const helperFilePath = path.resolve(__dirname, '../api/firebase-config-helper.js');
    
    if (!fs.existsSync(helperFilePath)) {
      console.error('❌ Firebase config helper file not found at:');
      console.error(helperFilePath);
      console.error('Please make sure this file exists first.');
      return;
    }
    
    console.log('✅ All required files are in place');
    
    // Instructions for deploying to Vercel
    console.log('\n📋 DEPLOYMENT INSTRUCTIONS:');
    console.log('1. Push these changes to your GitHub repository:');
    console.log('   git add api/create-test-tournament.js');
    console.log('   git commit -m "Add tournament creation API endpoint"');
    console.log('   git push');
    console.log('');
    console.log('2. Ensure your Vercel environment has these variables:');
    console.log('   - FIREBASE_API_KEY');
    console.log('   - FIREBASE_AUTH_DOMAIN');
    console.log('   - FIREBASE_PROJECT_ID');
    console.log('   - FIREBASE_STORAGE_BUCKET');
    console.log('   - FIREBASE_MESSAGING_SENDER_ID');
    console.log('   - FIREBASE_APP_ID');
    console.log('   - FIREBASE_SERVICE_ACCOUNT (JSON string of your service account)');
    console.log('');
    console.log('3. Deploy your changes to Vercel');
    console.log('');
    console.log('4. Once deployed, test the API endpoint:');
    console.log('   node scripts/create-tournament-via-api.js');
    
    console.log('\n💡 Setting up FIREBASE_SERVICE_ACCOUNT in Vercel:');
    console.log('1. Go to Firebase Console > Project Settings > Service Accounts');
    console.log('2. Click "Generate new private key"');
    console.log('3. Download the JSON file');
    console.log('4. Open the file and copy all its contents');
    console.log('5. In Vercel, add an environment variable named FIREBASE_SERVICE_ACCOUNT');
    console.log('6. Paste the JSON content as the value (keep all quotes and formatting)');
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
  }
}

// Run the function
createTournamentAPIEndpoint();
