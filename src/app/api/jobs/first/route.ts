import { NextRequest, NextResponse } from 'next/server'

// Force Node.js runtime for Prisma compatibility
export const runtime = 'nodejs';
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jobNumber = searchParams.get('jobNumber')
    
    let job
    
    if (jobNumber) {
      // Get specific job by job number
      job = await prisma.job.findFirst({
        where: { jobNumber },
        include: {
          customer: {
            include: {
              serviceProvider: true
            }
          },
          location: true,
          contact: true,
          assignedTo: true,
          photos: {
            orderBy: { createdAt: 'desc' }
          }
        }
      })
    } else {
      // Get the first job with all related data
      job = await prisma.job.findFirst({
        include: {
          customer: {
            include: {
              serviceProvider: true
            }
          },
          location: true,
          contact: true,
          assignedTo: true,
          photos: {
            orderBy: { createdAt: 'desc' }
          }
        },
        orderBy: { createdAt: 'asc' } // Get the first created job
      })
    }

    if (!job) {
      return NextResponse.json({ 
        error: jobNumber ? `Job ${jobNumber} not found` : 'No jobs found' 
      }, { status: 404 })
    }

    return NextResponse.json(job)
  } catch (error) {
    console.error('Error fetching job:', error)
    return NextResponse.json(
      { error: 'Failed to fetch job' },
      { status: 500 }
    )
  }
}
