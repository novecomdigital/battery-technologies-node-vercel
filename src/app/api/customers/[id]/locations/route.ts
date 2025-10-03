import { NextRequest, NextResponse } from 'next/server'

// Force Node.js runtime for Prisma compatibility
export const runtime = 'nodejs';
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const locations = await prisma.location.findMany({
      where: { customerId: id },
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        state: true,
        zipCode: true
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(locations)
  } catch (error) {
    console.error('Error fetching locations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch locations' },
      { status: 500 }
    )
  }
}
