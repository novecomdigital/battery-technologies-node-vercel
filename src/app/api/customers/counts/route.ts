import { NextRequest, NextResponse } from 'next/server'

// Force Node.js runtime for Prisma compatibility
export const runtime = 'nodejs';
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Filters
    const customerType = searchParams.get('customerType')
    const search = searchParams.get('search')
    
    // Build where clause
    const where: {
      customerType?: 'DIRECT' | 'REFERRED'
      OR?: Array<{
        name?: { contains: string; mode: 'insensitive' }
        email?: { contains: string; mode: 'insensitive' }
        phone?: { contains: string; mode: 'insensitive' }
        city?: { contains: string; mode: 'insensitive' }
        state?: { contains: string; mode: 'insensitive' }
      }>
    } = {}
    
    if (customerType && customerType !== 'ALL') {
      where.customerType = customerType as 'DIRECT' | 'REFERRED'
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { state: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    // Get counts for each status
    const [all, active, inactive, suspended] = await Promise.all([
      prisma.customer.count({ where }),
      prisma.customer.count({ where: { ...where, status: 'ACTIVE' } }),
      prisma.customer.count({ where: { ...where, status: 'INACTIVE' } }),
      prisma.customer.count({ where: { ...where, status: 'SUSPENDED' } })
    ])
    
    return NextResponse.json({
      ALL: all,
      ACTIVE: active,
      INACTIVE: inactive,
      SUSPENDED: suspended
    })
  } catch (error) {
    console.error('Error fetching customer status counts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customer status counts' },
      { status: 500 }
    )
  }
}
