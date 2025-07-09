#!/usr/bin/env node

/**
 * Security Setup Script
 * Helps set up secure environment configuration
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createEnvFile(templatePath, targetPath) {
  if (fs.existsSync(targetPath)) {
    console.log(`⚠️  ${targetPath} already exists. Skipping...`);
    return;
  }
  
  if (!fs.existsSync(templatePath)) {
    console.log(`❌ Template file ${templatePath} not found`);
    return;
  }
  
  fs.copyFileSync(templatePath, targetPath);
  console.log(`✅ Created ${targetPath}`);
}

function checkGitignore() {
  const gitignorePath = path.join(__dirname, '..', '.gitignore');
  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  
  const requiredPatterns = [
    '.env',
    'scripts/.env',
    'firebase-service-account*.json',
    '*api-key*',
    '*secret*'
  ];
  
  const missingPatterns = requiredPatterns.filter(pattern => 
    !gitignoreContent.includes(pattern)
  );
  
  if (missingPatterns.length > 0) {
    console.log(`⚠️  Missing .gitignore patterns: ${missingPatterns.join(', ')}`);
  } else {
    console.log('✅ .gitignore is properly configured');
  }
}

function main() {
  console.log('🔒 Setting up secure environment configuration...\n');
  
  // Create main .env file
  createEnvFile(
    path.join(__dirname, '..', '.env.example'),
    path.join(__dirname, '..', '.env')
  );
  
  // Create scripts .env file
  createEnvFile(
    path.join(__dirname, '.env.example'),
    path.join(__dirname, '.env')
  );
  
  // Check .gitignore
  checkGitignore();
  
  console.log('\n🎉 Security setup complete!');
  console.log('\n📝 Next steps:');
  console.log('1. Edit .env files with your actual values');
  console.log('2. Never commit .env files to version control');
  console.log('3. Set up proper API key restrictions');
  console.log('4. Run security audit: node scripts/security-audit.js');
  console.log('\n📖 For more information, see SECURITY-FIXED.md');
}

main();
