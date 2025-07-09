#!/usr/bin/env node

// Security audit script to check for exposed sensitive data
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

const SENSITIVE_PATTERNS = [
  // API Keys
  /AIza[0-9A-Za-z\\-_]{35}/g,
  /sk_live_[0-9a-zA-Z]{24}/g,
  /sk_test_[0-9a-zA-Z]{24}/g,
  /pk_live_[0-9a-zA-Z]{24}/g,
  /pk_test_[0-9a-zA-Z]{24}/g,
  
  // Firebase specific
  /firebase[a-zA-Z0-9_-]*\.json/g,
  /firebase-adminsdk-[a-zA-Z0-9_-]*\.json/g,
  /freefire-tournaments-ba2a6/g,
  /1096983059652/g,
  
  // Common secret patterns
  /password\s*=\s*['"][^'"]{8,}['"]/gi,
  /secret\s*=\s*['"][^'"]{8,}['"]/gi,
  /private.*key/gi,
  /BEGIN\s+PRIVATE\s+KEY/gi,
  
  // Database URLs
  /mongodb:\/\/[^\\s]+/g,
  /postgres:\/\/[^\\s]+/g,
  /mysql:\/\/[^\\s]+/g,
  
  // JWT secrets
  /jwt[._-]?secret/gi,
  /token[._-]?secret/gi,
];

const EXCLUDED_PATHS = [
  'node_modules/',
  '.git/',
  'dist/',
  'build/',
  '.env.example',
  'SECURITY.md',
  'SECURITY-FIXED.md',
  '.gitignore',
  'security-audit.js', // Don't scan the audit script itself
  'setup-security.js'
];

async function scanDirectory(dir) {
  const results = [];
  const files = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    const relativePath = path.relative(process.cwd(), fullPath);
    
    // Skip excluded paths
    if (EXCLUDED_PATHS.some(excluded => relativePath.includes(excluded))) {
      continue;
    }
    
    if (file.isDirectory()) {
      results.push(...await scanDirectory(fullPath));
    } else if (file.isFile()) {
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        
        for (const pattern of SENSITIVE_PATTERNS) {
          const matches = content.match(pattern);
          if (matches) {
            results.push({
              file: relativePath,
              pattern: pattern.toString(),
              matches: matches.slice(0, 3), // Limit to first 3 matches
              line: content.split('\\n').findIndex(line => pattern.test(line)) + 1
            });
          }
        }
      } catch (error) {
        // Skip binary files or files that can't be read
      }
    }
  }
  
  return results;
}

async function runSecurityAudit() {
  console.log('🔍 Running security audit...');
  console.log('==========================================');
  
  const results = await scanDirectory(process.cwd());
  
  if (results.length === 0) {
    console.log('✅ No sensitive data patterns found!');
    return;
  }
  
  console.log(`⚠️  Found ${results.length} potential security issues:`);
  console.log('');
  
  results.forEach((result, index) => {
    console.log(`${index + 1}. File: ${result.file}`);
    console.log(`   Pattern: ${result.pattern}`);
    console.log(`   Line: ${result.line}`);
    console.log(`   Matches: ${result.matches.join(', ')}`);
    console.log('');
  });
  
  console.log('🚨 SECURITY RECOMMENDATIONS:');
  console.log('1. Remove or replace all hardcoded sensitive data');
  console.log('2. Use environment variables for all configuration');
  console.log('3. Add sensitive patterns to .gitignore');
  console.log('4. Rotate any exposed API keys or secrets');
  console.log('5. Review git history for exposed data');
}

runSecurityAudit().catch(console.error);
