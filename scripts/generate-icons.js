#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

// This script generates PNG icons from SVG files
// You'll need to install sharp: npm install sharp

async function generateIcons() {
  try {
    const sharp = require('sharp')
    
    const sizes = [
      { size: 192, name: 'icon-192x192.png' },
      { size: 512, name: 'icon-512x512.png' },
      { size: 180, name: 'apple-touch-icon.png' }, // iOS
      { size: 144, name: 'icon-144x144.png' }, // Android
      { size: 96, name: 'icon-96x96.png' }, // Android
      { size: 72, name: 'icon-72x72.png' }, // Android
      { size: 48, name: 'icon-48x48.png' }, // Android
      { size: 36, name: 'icon-36x36.png' } // Android
    ]

    for (const { size, name } of sizes) {
      const svgPath = path.join(__dirname, '..', 'public', 'icon-192x192.svg')
      const outputPath = path.join(__dirname, '..', 'public', name)
      
      await sharp(svgPath)
        .resize(size, size)
        .png()
        .toFile(outputPath)
      
      console.log(`✅ Generated ${name} (${size}x${size})`)
    }

    console.log('🎉 All icons generated successfully!')
    
  } catch (error) {
    console.error('❌ Error generating icons:', error.message)
    console.log('💡 Install sharp first: npm install sharp')
    process.exit(1)
  }
}

generateIcons()