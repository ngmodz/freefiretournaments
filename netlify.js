// This file is used to help with Netlify deployment
// It's a simple file that ensures Netlify can find the necessary configuration

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Netlify deployment helper');
console.log('Checking for required files:');

// Check if netlify.toml exists
if (fs.existsSync(path.join(__dirname, 'netlify.toml'))) {
  console.log('✅ netlify.toml found');
} else {
  console.error('❌ netlify.toml not found');
}

// Check if dist directory exists
if (fs.existsSync(path.join(__dirname, 'dist'))) {
  console.log('✅ dist directory found');
} else {
  console.error('❌ dist directory not found');
}

// Check if functions directory exists
if (fs.existsSync(path.join(__dirname, 'netlify/functions'))) {
  console.log('✅ netlify/functions directory found');
} else {
  console.error('❌ netlify/functions directory not found');
}

// Log environment
console.log('Environment:', process.env.NODE_ENV || 'not set');
console.log('Node version:', process.version);

// This file doesn't do anything else, it's just a helper for debugging Netlify deployments 