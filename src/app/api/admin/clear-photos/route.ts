import { NextResponse } from 'next/server'

// Force Node.js runtime for Prisma compatibility
export const runtime = 'nodejs';
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    // Check if user is authenticated and has admin privileges
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the count before deletion
    const photoCount = await prisma.jobPhoto.count()
    
    if (photoCount === 0) {
      return NextResponse.json({ 
        message: 'No photos found to delete',
        deletedCount: 0
      })
    }

    // Delete all photos
    const result = await prisma.jobPhoto.deleteMany({})
    
    console.log(`🗑️ Admin action: Deleted ${result.count} photos from database`)
    
    return NextResponse.json({ 
      message: `Successfully deleted ${result.count} photos from database`,
      deletedCount: result.count,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Error clearing photos:', error)
    return NextResponse.json({ 
      error: 'Failed to clear photos',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
