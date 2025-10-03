import { NextRequest, NextResponse } from 'next/server'

// Force Node.js runtime for Prisma compatibility
export const runtime = 'nodejs';
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '25')
    const skip = (page - 1) * limit
    
    // Sorting
    const sortBy = searchParams.get('sortBy') || 'name'
    const sortOrder = searchParams.get('sortOrder') || 'asc'
    
    // Filters
    const status = searchParams.get('status')
    const customerType = searchParams.get('customerType')
    const search = searchParams.get('search')
    
    // Build where clause
    const where: {
      status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
      customerType?: 'DIRECT' | 'REFERRED'
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
    
    // Build orderBy clause
    const orderBy: Record<string, string> = {}
    orderBy[sortBy] = sortOrder
    
    // Fetch customers with pagination
    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          address: true,
          city: true,
          state: true,
          zipCode: true,
          country: true,
          status: true,
          customerType: true,
          referralNotes: true,
          createdAt: true,
          updatedAt: true,
          serviceProvider: {
            select: {
              id: true,
              name: true
            }
          },
          _count: {
            select: {
              jobs: true,
              locations: true,
              contacts: true
            }
          }
        },
        orderBy,
        skip,
        take: limit
      }),
      prisma.customer.count({ where })
    ])
    
    const totalPages = Math.ceil(total / limit)
    
    return NextResponse.json({
      customers,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    })
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    )
  }
}
