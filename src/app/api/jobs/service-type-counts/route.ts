import { NextRequest, NextResponse } from 'next/server'

// Force Node.js runtime for Prisma compatibility
export const runtime = 'nodejs';
import { prisma } from '@/lib/prisma'
import { JobStatus, ServiceType } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const status = searchParams.get('status')

    // Build where clause for search and status
    const where: {
      status?: JobStatus
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

    if (search) {
      where.OR = [
        { jobNumber: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { serviceProvider: { name: { contains: search, mode: 'insensitive' } } }
      ]
    }

    // Get counts for each service type
    const counts = await Promise.all([
      // Total count
      prisma.job.count({ where }),
      // Battery Inspection
      prisma.job.count({ where: { ...where, serviceType: ServiceType.BATTERY_INSPECTION } }),
      // Charger Inspection
      prisma.job.count({ where: { ...where, serviceType: ServiceType.CHARGER_INSPECTION } }),
      // Battery & Charger Inspection
      prisma.job.count({ where: { ...where, serviceType: ServiceType.BATTERY_CHARGER_INSPECTION } }),
      // Supply & Fit Battery
      prisma.job.count({ where: { ...where, serviceType: ServiceType.SUPPLY_FIT_BATTERY } }),
      // Supply & Deliver Charger
      prisma.job.count({ where: { ...where, serviceType: ServiceType.SUPPLY_DELIVER_CHARGER } }),
      // Supply & Fit Cells
      prisma.job.count({ where: { ...where, serviceType: ServiceType.SUPPLY_FIT_CELLS } }),
      // Charger Rental
      prisma.job.count({ where: { ...where, serviceType: ServiceType.CHARGER_RENTAL } }),
      // Battery Water Topping
      prisma.job.count({ where: { ...where, serviceType: ServiceType.BATTERY_WATER_TOPPING } }),
      // Battery Repair
      prisma.job.count({ where: { ...where, serviceType: ServiceType.BATTERY_REPAIR } }),
      // Battery Rental
      prisma.job.count({ where: { ...where, serviceType: ServiceType.BATTERY_RENTAL } }),
      // Charger Repair
      prisma.job.count({ where: { ...where, serviceType: ServiceType.CHARGER_REPAIR } }),
      // Parts Ordered
      prisma.job.count({ where: { ...where, serviceType: ServiceType.PARTS_ORDERED } }),
      // Site Survey
      prisma.job.count({ where: { ...where, serviceType: ServiceType.SITE_SURVEY } }),
      // Delivery
      prisma.job.count({ where: { ...where, serviceType: ServiceType.DELIVERY } }),
      // Collection
      prisma.job.count({ where: { ...where, serviceType: ServiceType.COLLECTION } }),
      // Other
      prisma.job.count({ where: { ...where, serviceType: ServiceType.OTHER } })
    ])

    return NextResponse.json({
      ALL: counts[0],
      BATTERY_INSPECTION: counts[1],
      CHARGER_INSPECTION: counts[2],
      BATTERY_CHARGER_INSPECTION: counts[3],
      SUPPLY_FIT_BATTERY: counts[4],
      SUPPLY_DELIVER_CHARGER: counts[5],
      SUPPLY_FIT_CELLS: counts[6],
      CHARGER_RENTAL: counts[7],
      BATTERY_WATER_TOPPING: counts[8],
      BATTERY_REPAIR: counts[9],
      BATTERY_RENTAL: counts[10],
      CHARGER_REPAIR: counts[11],
      PARTS_ORDERED: counts[12],
      SITE_SURVEY: counts[13],
      DELIVERY: counts[14],
      COLLECTION: counts[15],
      OTHER: counts[16]
    })
  } catch (error) {
    console.error('Error fetching service type counts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch service type counts' },
      { status: 500 }
    )
  }
}
