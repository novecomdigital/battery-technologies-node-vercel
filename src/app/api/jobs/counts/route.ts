import { NextRequest, NextResponse } from 'next/server'

// Force Node.js runtime for Prisma compatibility
export const runtime = 'nodejs';
import { prisma } from '@/lib/prisma'
import { JobStatus, ServiceType } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const serviceType = searchParams.get('serviceType')

    // Build where clause for search and service type
    const where: {
      serviceType?: ServiceType
      OR?: Array<{
        jobNumber?: { contains: string; mode: 'insensitive' }
        description?: { contains: string; mode: 'insensitive' }
        customer?: { name: { contains: string; mode: 'insensitive' } }
        serviceProvider?: { name: { contains: string; mode: 'insensitive' } }
      }>
    } = {}

    if (serviceType && Object.values(ServiceType).includes(serviceType as ServiceType)) {
      where.serviceType = serviceType as ServiceType
    }

    if (search) {
      where.OR = [
        { jobNumber: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { serviceProvider: { name: { contains: search, mode: 'insensitive' } } }
      ]
    }

    // Get counts for each status
    const counts = await Promise.all([
      // Total count
      prisma.job.count({ where }),
      // Open count
      prisma.job.count({ where: { ...where, status: JobStatus.OPEN } }),
      // Visited count
      prisma.job.count({ where: { ...where, status: JobStatus.VISITED } }),
      // Complete count
      prisma.job.count({ where: { ...where, status: JobStatus.COMPLETE } }),
      // Needs Quote count
      prisma.job.count({ where: { ...where, status: JobStatus.NEEDS_QUOTE } }),
      // On Hold count
      prisma.job.count({ where: { ...where, status: JobStatus.ON_HOLD } }),
      // Cancelled count
      prisma.job.count({ where: { ...where, status: JobStatus.CANCELLED } })
    ])

    return NextResponse.json({
      ALL: counts[0],
      OPEN: counts[1],
      VISITED: counts[2],
      COMPLETE: counts[3],
      NEEDS_QUOTE: counts[4],
      ON_HOLD: counts[5],
      CANCELLED: counts[6]
    })
  } catch (error) {
    console.error('Error fetching job counts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch job counts' },
      { status: 500 }
    )
  }
}
