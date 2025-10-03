#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

// Read the current service worker file
const swPath = path.join(__dirname, '..', 'public', 'sw.js')
const swContent = fs.readFileSync(swPath, 'utf8')

// Extract current version number
const versionMatch = swContent.match(/const CACHE_NAME = 'battery-tech-v(\d+)'/)
if (!versionMatch) {
  console.error('Could not find CACHE_NAME in service worker file')
  process.exit(1)
}

const currentVersion = parseInt(versionMatch[1])
const newVersion = currentVersion + 1

// Update the cache version
const updatedContent = swContent.replace(
  /const CACHE_NAME = 'battery-tech-v\d+'/,
  `const CACHE_NAME = 'battery-tech-v${newVersion}'`
)

// Write the updated content back
fs.writeFileSync(swPath, updatedContent)

console.log(`✅ Updated cache version from v${currentVersion} to v${newVersion}`)
console.log('📦 Ready for deployment! Users will be notified of the update.')
