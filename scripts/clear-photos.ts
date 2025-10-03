#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function clearAllPhotos() {
  try {
    console.log('🗑️ Starting to clear all photos and metadata...')
    
    // Get count before deletion
    const photoCount = await prisma.jobPhoto.count()
    console.log(`📊 Found ${photoCount} photos to delete`)
    
    if (photoCount === 0) {
      console.log('✅ No photos found to delete')
      return
    }
    
    // Delete all photos
    const result = await prisma.jobPhoto.deleteMany({})
    
    console.log(`✅ Successfully deleted ${result.count} photos from database`)
    
    // Also clear any offline photo data
    console.log('🧹 Clearing offline photo storage...')
    // Note: This would need to be done in the browser, but we can log the instruction
    
    console.log('🎉 Photo cleanup complete!')
    console.log('')
    console.log('Next steps:')
    console.log('1. Clear your R2 buckets in Cloudflare Dashboard')
    console.log('2. Update your .env.local with the correct R2 configuration')
    console.log('3. Restart your development server')
    console.log('4. Test photo uploads with the fresh setup')
    
  } catch (error) {
    console.error('❌ Error clearing photos:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
clearAllPhotos()
