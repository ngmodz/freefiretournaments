#!/usr/bin/env node

/**
 * EMERGENCY SECURITY SETUP SCRIPT
 * Run this immediately after rotating Firebase credentials
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚨 EMERGENCY SECURITY SETUP 🚨\n');

function checkSecurityStatus() {
  const rootDir = path.join(__dirname, '..');
  const issues = [];
  
  // Check for any remaining service account files
  const serviceAccountFiles = [
    'firebase-service-account.json',
    'firebase-admin-key.json',
    'serviceAccount.json'
  ];
  
  serviceAccountFiles.forEach(file => {
    const filePath = path.join(rootDir, file);
    if (fs.existsSync(filePath)) {
      issues.push(`❌ CRITICAL: ${file} still exists and may contain sensitive data`);
    }
  });
  
  // Check if .env files exist
  const envFiles = [
    path.join(rootDir, '.env'),
    path.join(__dirname, '.env')
  ];
  
  envFiles.forEach(file => {
    if (!fs.existsSync(file)) {
      issues.push(`⚠️  Missing: ${file} - you need to create this from the .env.example`);
    }
  });
  
  return issues;
}

function main() {
  const issues = checkSecurityStatus();
  
  if (issues.length > 0) {
    console.log('🔍 SECURITY ISSUES FOUND:\n');
    issues.forEach(issue => console.log(issue));
    console.log('\n');
  } else {
    console.log('✅ Basic security checks passed\n');
  }
  
  console.log('🔥 IMMEDIATE ACTIONS REQUIRED:\n');
  console.log('1. Go to Firebase Console: https://console.firebase.google.com/project/freefire-tournaments-ba2a6/settings/serviceaccounts/adminsdk');
  console.log('2. Delete the compromised key (Private Key ID: 2ede2bbed81ac8e5c809ae3961bc688b455eefda)');
  console.log('3. Generate a new private key');
  console.log('4. Create scripts/.env and set FIREBASE_SERVICE_ACCOUNT_KEY with the new credentials');
  console.log('5. Create .env in root directory with VITE_* variables');
  console.log('6. Test that everything works with new credentials');
  console.log('7. Monitor Firebase usage for any unauthorized access');
  
  console.log('\n📋 SETUP STEPS:\n');
  console.log('# 1. Copy environment templates');
  console.log('cp .env.example .env');
  console.log('cp scripts/.env.example scripts/.env');
  console.log('');
  console.log('# 2. Edit the .env files with your new rotated credentials');
  console.log('# 3. Test the application');
  console.log('npm run dev');
  console.log('');
  console.log('# 4. Test scripts');
  console.log('node scripts/check-tournament-ttl.js');
  
  console.log('\n🚨 REMEMBER:');
  console.log('- The old credentials are COMPROMISED and must be rotated');
  console.log('- NEVER commit .env files to version control');
  console.log('- Use proper secrets management in production');
  console.log('- Monitor for any unauthorized Firebase usage');
  
  console.log('\n📞 If you need help:');
  console.log('- Check SECURITY-BREACH-ALERT.md for detailed instructions');
  console.log('- Review the secure-firebase-admin.js for implementation');
  console.log('- Run security audit: node scripts/security-audit.js');
}

main();
