import { NextRequest, NextResponse } from 'next/server'

// Force Node.js runtime for Prisma compatibility
export const runtime = 'nodejs';
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jobNumber = searchParams.get('jobNumber') || '510422'
    
    // Check if job exists
    const job = await prisma.job.findFirst({
      where: { jobNumber },
      include: {
        photos: true
      }
    })

    if (!job) {
      return NextResponse.json({ 
        error: `Job ${jobNumber} not found`,
        availableJobs: await prisma.job.findMany({
          select: { jobNumber: true, id: true },
          take: 10,
          orderBy: { jobNumber: 'asc' }
        })
      }, { status: 404 })
    }

    // Get photo count for all jobs
    const photoStats = await prisma.jobPhoto.groupBy({
      by: ['jobId'],
      _count: {
        id: true
      }
    })

    // Get jobs with photos
    const jobsWithPhotos = await prisma.job.findMany({
      where: {
        photos: {
          some: {}
        }
      },
      select: {
        jobNumber: true,
        id: true,
        _count: {
          select: {
            photos: true
          }
        }
      },
      take: 10
    })

    return NextResponse.json({
      requestedJob: {
        jobNumber: job.jobNumber,
        id: job.id,
        photoCount: job.photos.length,
        photos: job.photos.map(photo => ({
          id: photo.id,
          url: photo.url,
          filename: photo.filename,
          originalName: photo.originalName,
          caption: photo.caption,
          createdAt: photo.createdAt,
          isPrimary: photo.isPrimary,
          mimeType: photo.mimeType,
          size: photo.size
        }))
      },
      totalJobs: await prisma.job.count(),
      totalPhotos: await prisma.jobPhoto.count(),
      jobsWithPhotos: jobsWithPhotos,
      photoStats: photoStats.length
    })
  } catch (error) {
    console.error('Error debugging job photos:', error)
    return NextResponse.json(
      { error: 'Failed to debug job photos' },
      { status: 500 }
    )
  }
}
