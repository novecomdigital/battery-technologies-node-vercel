import { NextRequest, NextResponse } from 'next/server'

// Force Node.js runtime for Prisma compatibility
export const runtime = 'nodejs';
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Filters
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    
    // Build where clause
    const where: {
      status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
      OR?: Array<{
        name?: { contains: string; mode: 'insensitive' }
        email?: { contains: string; mode: 'insensitive' }
        phone?: { contains: string; mode: 'insensitive' }
        city?: { contains: string; mode: 'insensitive' }
        state?: { contains: string; mode: 'insensitive' }
      }>
    } = {}
    
    if (status && status !== 'ALL') {
      where.status = status as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
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
    
    // Get counts for each customer type
    const [all, direct, referred] = await Promise.all([
      prisma.customer.count({ where }),
      prisma.customer.count({ where: { ...where, customerType: 'DIRECT' } }),
      prisma.customer.count({ where: { ...where, customerType: 'REFERRED' } })
    ])
    
    return NextResponse.json({
      ALL: all,
      DIRECT: direct,
      REFERRED: referred
    })
  } catch (error) {
    console.error('Error fetching customer type counts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customer type counts' },
      { status: 500 }
    )
  }
}
