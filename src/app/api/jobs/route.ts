import { NextRequest, NextResponse } from 'next/server'

// Force Node.js runtime for Prisma compatibility
export const runtime = 'nodejs';
import { prisma } from '@/lib/prisma'
import { JobStatus, ServiceType } from '@prisma/client'
import { generateJobDescription } from '@/lib/job-utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const serviceType = searchParams.get('serviceType')
    const customerId = searchParams.get('customerId')
    const serviceProviderId = searchParams.get('serviceProviderId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search')
    const dueDate = searchParams.get('dueDate')
    const dueDateStart = searchParams.get('dueDateStart')
    const dueDateEnd = searchParams.get('dueDateEnd')
    const sortBy = searchParams.get('sortBy') || 'jobNumber'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Build where clause
    const where: {
      status?: JobStatus
      serviceType?: ServiceType
      customerId?: string
      serviceProviderId?: string
      assignedToId?: string
      dueDate?: {
        gte?: Date
        lt?: Date
        lte?: Date
      }
      OR?: Array<{
        jobNumber?: { contains: string; mode: 'insensitive' }
        title?: { contains: string; mode: 'insensitive' }
        description?: { contains: string; mode: 'insensitive' }
        customer?: { name: { contains: string; mode: 'insensitive' } }
        serviceProvider?: { name: { contains: string; mode: 'insensitive' } }
      }>
    } = {}

    if (status && Object.values(JobStatus).includes(status as JobStatus)) {
      where.status = status as JobStatus
    }


    if (serviceType && Object.values(ServiceType).includes(serviceType as ServiceType)) {
      where.serviceType = serviceType as ServiceType
    }

    if (customerId) {
      where.customerId = customerId
    }

    if (serviceProviderId) {
      where.serviceProviderId = serviceProviderId
    }

    const assignedToId = searchParams.get('assignedToId')
    if (assignedToId) {
      where.assignedToId = assignedToId
    }

    if (dueDate) {
      const startOfDay = new Date(dueDate)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(dueDate)
      endOfDay.setHours(23, 59, 59, 999)
      
      where.dueDate = {
        gte: startOfDay,
        lt: endOfDay
      }
    }

    if (dueDateStart && dueDateEnd) {
      const startDate = new Date(dueDateStart)
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(dueDateEnd)
      endDate.setHours(23, 59, 59, 999)
      
      where.dueDate = {
        gte: startDate,
        lte: endDate
      }
    }

    if (search) {
      where.OR = [
        { jobNumber: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { serviceProvider: { name: { contains: search, mode: 'insensitive' } } }
      ]
    }

    // Get total count for pagination
    const total = await prisma.job.count({ where })

    // Get jobs with pagination
    const jobs = await prisma.job.findMany({
      where,
      include: {
        customer: true,
        serviceProvider: true,
        location: true,
        contact: true,
        assignedTo: true,
        photos: {
          take: 1,
          where: { isPrimary: true }
        }
      },
      orderBy: (() => {
        const orderBy: Record<string, string> = {}
        if (sortBy === 'jobNumber') {
          orderBy.jobNumber = sortOrder
        } else if (sortBy === 'description') {
          orderBy.description = sortOrder
        } else if (sortBy === 'status') {
          orderBy.status = sortOrder
        } else if (sortBy === 'dueDate') {
          orderBy.dueDate = sortOrder
        } else if (sortBy === 'createdAt') {
          orderBy.createdAt = sortOrder
        } else if (sortBy === 'serviceType') {
          orderBy.serviceType = sortOrder
        } else if (sortBy === 'assignedToId') {
          orderBy.assignedToId = sortOrder
        } else {
          // Default to jobNumber desc
          orderBy.jobNumber = 'desc'
        }
        return orderBy
      })(),
      skip: (page - 1) * limit,
      take: limit
    })

    return NextResponse.json({
      jobs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching jobs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
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
      assignedToId
    } = body

    // Validate required fields
    if (!serviceType || !customerId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: serviceType, customerId, status' },
        { status: 400 }
      )
    }

    // Validate enum values
    if (!Object.values(ServiceType).includes(serviceType)) {
      return NextResponse.json(
        { error: 'Invalid service type' },
        { status: 400 }
      )
    }

    if (!Object.values(JobStatus).includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    // Get the next job number
    const lastJob = await prisma.job.findFirst({
      orderBy: { jobNumber: 'desc' }
    })

    const nextJobNumber = lastJob 
      ? String(parseInt(lastJob.jobNumber) + 1)
      : '510001'

    // Get customer info for service provider
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: { serviceProvider: true }
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    // Generate description if not provided
    const jobDescription = description || generateJobDescription(serviceType, customer.name)

    const baseJobData = {
      jobNumber: nextJobNumber,
      serviceType,
      customer: { connect: { id: customerId } },
      location: locationId ? { connect: { id: locationId } } : undefined,
      contact: contactId ? { connect: { id: contactId } } : undefined,
      assignedTo: assignedToId ? { connect: { id: assignedToId } } : undefined,
      status,
      dueDate: dueDate ? new Date(dueDate) : null,
      notes: notes || null,
      batteryType: batteryType || null,
      batteryModel: batteryModel || null,
      batterySerial: batterySerial || null,
      equipmentType: equipmentType || null,
      equipmentModel: equipmentModel || null,
      equipmentSerial: equipmentSerial || null,
      description: jobDescription
    }

    const job = await prisma.job.create({
      data: (customer.serviceProviderId 
        ? { ...baseJobData, serviceProviderId: customer.serviceProviderId }
        : baseJobData) as Parameters<typeof prisma.job.create>[0]['data'],
      include: {
        customer: {
          include: {
            serviceProvider: true
          }
        },
        location: true,
        contact: true,
        photos: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    return NextResponse.json(job, { status: 201 })
  } catch (error) {
    console.error('Error creating job:', error)
    return NextResponse.json(
      { error: 'Failed to create job' },
      { status: 500 }
    )
  }
}
