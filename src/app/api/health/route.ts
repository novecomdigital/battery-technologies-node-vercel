import { NextResponse } from 'next/server'

// Force Node.js runtime for Prisma compatibility
export const runtime = 'nodejs';
import { prisma } from '@/lib/prisma'

/**
 * Health Check Endpoint
 * 
 * Returns the health status of the application and database connection.
 * Used by monitoring services to track uptime.
 * 
 * @returns {object} Health status response
 */
export async function GET() {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`

    return NextResponse.json(
      {
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: 'connected',
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
      },
      { status: 200 }
    )
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      },
      { status: 503 }
    )
  }
}

