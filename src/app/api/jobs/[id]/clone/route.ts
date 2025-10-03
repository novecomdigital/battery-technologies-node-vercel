import { NextRequest, NextResponse } from 'next/server'

// Force Node.js runtime for Prisma compatibility
export const runtime = 'nodejs';
import { prisma } from '@/lib/prisma'
import { JobStatus } from '@prisma/client'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params

    // Find the original job
    const originalJob = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        customer: true,
        location: true,
        contact: true,
        serviceProvider: true
      }
    })

    if (!originalJob) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      )
    }

    // Get the next job number
    const lastJob = await prisma.job.findFirst({
      orderBy: { jobNumber: 'desc' }
    })

    const nextJobNumber = lastJob 
      ? String(parseInt(lastJob.jobNumber) + 1)
      : '510001'

    // Create the cloned job with basic information
    const clonedJob = await prisma.job.create({
      data: {
        jobNumber: nextJobNumber,
        description: originalJob.description,
        serviceType: originalJob.serviceType,
        status: JobStatus.OPEN, // Always set to OPEN for cloned jobs
        customerId: originalJob.customerId,
        locationId: originalJob.locationId,
        contactId: originalJob.contactId,
        serviceProviderId: originalJob.serviceProviderId,
        batteryType: originalJob.batteryType,
        batteryModel: originalJob.batteryModel,
        batterySerial: originalJob.batterySerial,
        equipmentType: originalJob.equipmentType,
        equipmentModel: originalJob.equipmentModel,
        equipmentSerial: originalJob.equipmentSerial,
        // Don't copy dates, notes, or other job-specific data
        dueDate: null,
        startDate: null,
        endDate: null,
        notes: null,
        estimatedHours: null,
        actualHours: null
      },
      include: {
        customer: {
          include: {
            serviceProvider: true
          }
        },
        location: true,
        contact: true,
        serviceProvider: true,
        photos: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    return NextResponse.json(clonedJob, { status: 201 })
  } catch (error) {
    console.error('Error cloning job:', error)
    return NextResponse.json(
      { error: 'Failed to clone job' },
      { status: 500 }
    )
  }
}
