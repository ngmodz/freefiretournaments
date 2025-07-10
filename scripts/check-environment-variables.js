// Check Firebase environment variables status
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

/**
 * Check environment variables status
 */
function checkEnvironmentVariables() {
  console.log('========== ENVIRONMENT VARIABLES CHECK ==========');
  
  // Firebase client variables check (with VITE_ prefix)
  const clientVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID'
  ];
  
  console.log('\n----- CLIENT ENVIRONMENT VARIABLES (for frontend) -----');
  clientVars.forEach(varName => {
    const status = process.env[varName] ? '✅ PRESENT' : '❌ MISSING';
    console.log(`${varName}: ${status}`);
  });
  
  // Firebase API variables check (without VITE_ prefix)
  const apiVars = [
    'FIREBASE_API_KEY',
    'FIREBASE_AUTH_DOMAIN',
    'FIREBASE_PROJECT_ID',
    'FIREBASE_STORAGE_BUCKET',
    'FIREBASE_MESSAGING_SENDER_ID',
    'FIREBASE_APP_ID'
  ];
  
  console.log('\n----- API ENVIRONMENT VARIABLES (for backend) -----');
  apiVars.forEach(varName => {
    const status = process.env[varName] ? '✅ PRESENT' : '❌ MISSING';
    console.log(`${varName}: ${status}`);
    
    // Check if we have a VITE_ equivalent
    const viteVarName = 'VITE_' + varName;
    if (!process.env[varName] && process.env[viteVarName]) {
      console.log(`   → Use ${viteVarName} value for ${varName}`);
    }
  });
  
  // Email credentials check
  const emailVars = [
    'EMAIL_USER',
    'EMAIL_PASSWORD'
  ];
  
  console.log('\n----- EMAIL CREDENTIALS -----');
  emailVars.forEach(varName => {
    const status = process.env[varName] ? '✅ PRESENT' : '❌ MISSING';
    console.log(`${varName}: ${status}`);
  });
  
  // Service account check
  const serviceAccountVars = [
    'FIREBASE_SERVICE_ACCOUNT',
    'SERVICE_ACCOUNT_KEY_PATH'
  ];
  
  console.log('\n----- SERVICE ACCOUNT (for admin SDK) -----');
  let hasServiceAccount = false;
  
  serviceAccountVars.forEach(varName => {
    const status = process.env[varName] ? '✅ PRESENT' : '❌ MISSING';
    console.log(`${varName}: ${status}`);
    if (process.env[varName]) hasServiceAccount = true;
  });
  
  if (!hasServiceAccount) {
    console.log('   → Also checking for service-account.json file in root directory');
    try {
      const serviceAccountPath = path.resolve(__dirname, '../service-account.json');
      const fs = require('fs');
      if (fs.existsSync(serviceAccountPath)) {
        console.log('   ✅ service-account.json file found');
        hasServiceAccount = true;
      } else {
        console.log('   ❌ service-account.json file not found');
      }
    } catch (err) {
      console.log('   ❌ Error checking for service-account.json file');
    }
  }
  
  // Summary
  console.log('\n----- SUMMARY -----');
  
  const hasAllClientVars = clientVars.every(varName => !!process.env[varName]);
  const hasAllApiVars = apiVars.every(varName => !!process.env[varName] || !!process.env['VITE_' + varName]);
  const hasAllEmailVars = emailVars.every(varName => !!process.env[varName]);
  
  console.log(`Frontend Firebase Config: ${hasAllClientVars ? '✅ COMPLETE' : '❌ INCOMPLETE'}`);
  console.log(`API Firebase Config: ${hasAllApiVars ? '✅ COMPLETE' : '❌ INCOMPLETE'}`);
  console.log(`Email Credentials: ${hasAllEmailVars ? '✅ COMPLETE' : '❌ INCOMPLETE'}`);
  console.log(`Service Account: ${hasServiceAccount ? '✅ AVAILABLE' : '❌ MISSING'}`);
  
  // Next steps
  console.log('\n----- NEXT STEPS -----');
  
  if (!hasAllApiVars) {
    console.log(`
1. Add these non-prefixed Firebase variables to your .env file AND Vercel:
${apiVars.filter(varName => !process.env[varName]).map(varName => `   ${varName}=${process.env['VITE_' + varName] || 'YOUR_VALUE_HERE'}`).join('\n')}
`);
  }
  
  if (!hasAllEmailVars) {
    console.log(`
2. Add these email credentials to your .env file AND Vercel:
${emailVars.filter(varName => !process.env[varName]).map(varName => `   ${varName}=YOUR_VALUE_HERE`).join('\n')}
`);
  }
  
  if (!hasServiceAccount) {
    console.log(`
3. For admin SDK operations (like creating tournaments), add either:
   - FIREBASE_SERVICE_ACCOUNT environment variable with your service account JSON
   - SERVICE_ACCOUNT_KEY_PATH environment variable pointing to your service account file
   - or place a service-account.json file in the project root directory
`);
  }
  
  if (hasAllApiVars && hasAllEmailVars) {
    console.log(`
✅ All necessary environment variables for the notification system are present!
Next steps:
1. Push these changes to GitHub
2. Deploy to Vercel
3. Verify cron-job.org is configured to hit: https://freefiretournaments.vercel.app/api/tournament-notifications
4. Create a test tournament starting in 25 minutes to test the notification system
`);
  }
}

// Run the check
checkEnvironmentVariables();
