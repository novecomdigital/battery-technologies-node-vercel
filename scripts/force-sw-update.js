#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Update the service worker cache version to force an update
const swPath = path.join(__dirname, '..', 'public', 'sw.js');

if (fs.existsSync(swPath)) {
  let content = fs.readFileSync(swPath, 'utf8');
  
  // Generate a new cache version based on current timestamp
  const newVersion = `battery-tech-v${Date.now()}`;
  
  // Replace the cache version
  content = content.replace(/battery-tech-v\d+/g, newVersion);
  
  // Write the updated service worker
  fs.writeFileSync(swPath, content);
  
  console.log('✅ Service Worker cache version updated to:', newVersion);
  console.log('🔄 This will force browsers to download the new version');
  console.log('');
  console.log('📱 Next steps:');
  console.log('1. Refresh your desktop browser (Ctrl+Shift+R)');
  console.log('2. Or clear browser cache and reload');
  console.log('3. The app should now show the correct version');
} else {
  console.log('❌ Service Worker file not found');
}
