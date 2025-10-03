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
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        serviceProvider: {
          select: {
            id: true,
            name: true
          }
        },
        locations: {
          include: {
            _count: {
              select: {
                jobs: true,
                contacts: true
              }
            }
          },
          orderBy: { name: 'asc' }
        },
        contacts: {
          where: {
            locationId: null // Only customer-level contacts
          },
          orderBy: [
            { isPrimary: 'desc' },
            { firstName: 'asc' }
          ]
        },
        _count: {
          select: {
            jobs: true,
            locations: true,
            contacts: true
          }
        }
      }
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(customer)
  } catch (error) {
    console.error('Error fetching customer:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customer' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const customer = await prisma.customer.update({
      where: { id },
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone,
        address: body.address,
        city: body.city,
        state: body.state,
        zipCode: body.zipCode,
        country: body.country,
        status: body.status,
        customerType: body.customerType,
        referralNotes: body.referralNotes,
        serviceProviderId: body.serviceProviderId
      },
      include: {
        serviceProvider: {
          select: {
            id: true,
            name: true
          }
        },
        locations: {
          include: {
            _count: {
              select: {
                jobs: true,
                contacts: true
              }
            }
          },
          orderBy: { name: 'asc' }
        },
        contacts: {
          where: {
            locationId: null
          },
          orderBy: [
            { isPrimary: 'desc' },
            { firstName: 'asc' }
          ]
        },
        _count: {
          select: {
            jobs: true,
            locations: true,
            contacts: true
          }
        }
      }
    })

    return NextResponse.json(customer)
  } catch (error) {
    console.error('Error updating customer:', error)
    return NextResponse.json(
      { error: 'Failed to update customer' },
      { status: 500 }
    )
  }
}
