import { NextRequest, NextResponse } from 'next/server'

// Force Node.js runtime for Prisma compatibility
export const runtime = 'nodejs';
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { JobStatus, ServiceType } from '@prisma/client'
import { getCurrentUser } from '@/lib/auth-utils'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const job = await prisma.job.findUnique({
      where: { id },
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

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user for role-based access control
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { id } = await params
    const body = await request.json()
    const {
      serviceType,
      customerId,
      locationId,
      contactId,
      status,
      dueDate,
      notes,
      batteryType,
      batteryModel,
      batterySerial,
      equipmentType,
      equipmentModel,
      equipmentSerial,
      description,
      assignedToId,
      actualHours
    } = body

    // Get the job to check permissions
    const existingJob = await prisma.job.findUnique({
      where: { id },
      select: {
        id: true,
        assignedToId: true,
        status: true
      }
    })

    if (!existingJob) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    // Check if user can edit this job
    const { canEditJob } = await import('@/lib/auth-utils')
    if (!canEditJob(currentUser.role, existingJob.assignedToId, currentUser.id)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // For partial updates, we don't require all fields
    // Only validate if the fields are provided

    // Validate enum values only if provided
    if (serviceType && !Object.values(ServiceType).includes(serviceType)) {
      return NextResponse.json(
        { error: 'Invalid service type' },
        { status: 400 }
      )
    }

    if (status && !Object.values(JobStatus).includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    // Build update data object with only provided fields
    const updateData: {
      serviceType?: 'BATTERY_INSPECTION' | 'CHARGER_INSPECTION' | 'BATTERY_CHARGER_INSPECTION' | 'SUPPLY_FIT_BATTERY' | 'SUPPLY_DELIVER_CHARGER' | 'SUPPLY_FIT_CELLS' | 'CHARGER_RENTAL' | 'BATTERY_WATER_TOPPING' | 'BATTERY_REPAIR' | 'BATTERY_RENTAL'
      customer?: { connect: { id: string } }
      location?: { connect: { id: string } } | { disconnect: true }
      contact?: { connect: { id: string } } | { disconnect: true }
      assignedTo?: { connect: { id: string } } | { disconnect: true }
      description?: string
      status?: 'OPEN' | 'COMPLETE' | 'VISITED' | 'NEEDS_QUOTE' | 'ON_HOLD' | 'CANCELLED'
      dueDate?: Date | null
      notes?: string | null
      batteryType?: string | null
      batteryModel?: string | null
      batterySerial?: string | null
      equipmentType?: string | null
      equipmentModel?: string | null
      equipmentSerial?: string | null
      estimatedHours?: number | null
      actualHours?: number | null
    } = {}
    
    if (serviceType !== undefined) updateData.serviceType = serviceType as 'BATTERY_INSPECTION' | 'CHARGER_INSPECTION' | 'BATTERY_CHARGER_INSPECTION' | 'SUPPLY_FIT_BATTERY' | 'SUPPLY_DELIVER_CHARGER' | 'SUPPLY_FIT_CELLS' | 'CHARGER_RENTAL' | 'BATTERY_WATER_TOPPING' | 'BATTERY_REPAIR' | 'BATTERY_RENTAL'
    if (customerId !== undefined) updateData.customer = { connect: { id: customerId } }
    if (locationId !== undefined) updateData.location = locationId ? { connect: { id: locationId } } : { disconnect: true }
    if (contactId !== undefined) updateData.contact = contactId ? { connect: { id: contactId } } : { disconnect: true }
    if (assignedToId !== undefined) updateData.assignedTo = assignedToId ? { connect: { id: assignedToId } } : { disconnect: true }
    if (status !== undefined) updateData.status = status as 'OPEN' | 'COMPLETE' | 'VISITED' | 'NEEDS_QUOTE' | 'ON_HOLD' | 'CANCELLED'
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null
    if (notes !== undefined) updateData.notes = notes || null
    if (batteryType !== undefined) updateData.batteryType = batteryType || null
    if (batteryModel !== undefined) updateData.batteryModel = batteryModel || null
    if (batterySerial !== undefined) updateData.batterySerial = batterySerial || null
    if (equipmentType !== undefined) updateData.equipmentType = equipmentType || null
    if (equipmentModel !== undefined) updateData.equipmentModel = equipmentModel || null
    if (equipmentSerial !== undefined) updateData.equipmentSerial = equipmentSerial || null
    if (description !== undefined) updateData.description = description || null
    if (actualHours !== undefined) updateData.actualHours = actualHours || null

    const job = await prisma.job.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json(job)
  } catch (error) {
    console.error('Error updating job:', error)
    return NextResponse.json(
      { error: 'Failed to update job' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user for role-based access control
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Only admins can delete jobs
    if (currentUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { id } = await params
    await prisma.job.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Job deleted successfully' })
  } catch (error) {
    console.error('Error deleting job:', error)
    return NextResponse.json(
      { error: 'Failed to delete job' },
      { status: 500 }
    )
  }
}
