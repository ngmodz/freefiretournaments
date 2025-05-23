import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Update the cache version in the service worker
const updateCacheVersion = () => {
  const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
  
  try {
    // Update the service worker if it exists
    const swPath = path.join(__dirname, '../public/sw.js');
    if (fs.existsSync(swPath)) {
      let swContent = fs.readFileSync(swPath, 'utf8');
      
      // Update the cache version with the current timestamp
      swContent = swContent.replace(
        /const CACHE_VERSION = ['"]v\d+-[^'"]+['"];/,
        `const CACHE_VERSION = 'v1-${timestamp}';`
      );
      
      fs.writeFileSync(swPath, swContent);
      console.log(`✅ Service worker cache version updated to: v1-${timestamp}`);
    }
    
    // Update the manifest.json if it exists
    const manifestPath = path.join(__dirname, '../public/manifest.json');
    if (fs.existsSync(manifestPath)) {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      
      manifest.start_url = `/?v=${timestamp}`;
      manifest.version = `1.0.${timestamp}`;
      
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
      console.log(`✅ Manifest version updated to: 1.0.${timestamp}`);
    }
  } catch (error) {
    console.error('❌ Error updating cache version:', error);
    // Don't fail the build process
    console.log('Continuing with build despite cache version update failure');
  }
};

updateCacheVersion(); 