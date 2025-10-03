import { NextResponse } from 'next/server'

// Force Node.js runtime for Prisma compatibility
export const runtime = 'nodejs';
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const serviceProviders = await prisma.serviceProvider.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        createdAt: true
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(serviceProviders)
  } catch (error) {
    console.error('Error fetching service providers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch service providers' },
      { status: 500 }
    )
  }
}
