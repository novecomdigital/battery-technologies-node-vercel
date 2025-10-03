// Force Node.js runtime for Prisma compatibility
export const runtime = 'nodejs';

import { GET } from './route'
import { prisma } from '@/lib/prisma'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    $queryRaw: jest.fn(),
  },
}))

describe('/api/health', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return healthy status when database is connected', async () => {
    // Mock successful database query
    ;(prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }])

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.status).toBe('ok')
    expect(data.database).toBe('connected')
    expect(data.timestamp).toBeDefined()
  })

  it('should return error status when database is disconnected', async () => {
    // Mock database query failure
    ;(prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('Database connection failed'))

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(503)
    expect(data.status).toBe('error')
    expect(data.database).toBe('disconnected')
    expect(data.timestamp).toBeDefined()
  })

  it('should not expose error details in production', async () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'

    // Mock database query failure
    ;(prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('Database connection failed'))

    const response = await GET()
    const data = await response.json()

    expect(data.error).toBeUndefined()

    process.env.NODE_ENV = originalEnv
  })

  it('should include uptime information', async () => {
    ;(prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }])

    const response = await GET()
    const data = await response.json()

    expect(data.uptime).toBeDefined()
    expect(typeof data.uptime).toBe('number')
  })
})

