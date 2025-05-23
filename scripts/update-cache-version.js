import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Update the cache version in the service worker
const updateCacheVersion = () => {
  const swPath = path.join(__dirname, '../public/sw.js');
  const timestamp = new Date().getTime();
  
  try {
    let swContent = fs.readFileSync(swPath, 'utf8');
    
    // Update the cache version with the current timestamp
    swContent = swContent.replace(
      /const CACHE_VERSION = ['"]v\d+-\d+['"];/,
      `const CACHE_VERSION = 'v1-${timestamp}';`
    );
    
    fs.writeFileSync(swPath, swContent);
    console.log(`✅ Service worker cache version updated to: v1-${timestamp}`);
    
    // Also update the manifest.json start_url parameter
    const manifestPath = path.join(__dirname, '../public/manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    manifest.start_url = `/?v=${timestamp}`;
    manifest.version = `1.0.${timestamp}`;
    
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log(`✅ Manifest version updated to: 1.0.${timestamp}`);
    
  } catch (error) {
    console.error('❌ Error updating cache version:', error);
  }
};

updateCacheVersion(); 