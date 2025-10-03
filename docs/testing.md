# Battery Technologies - Testing Documentation

## Overview

This document outlines the comprehensive testing strategy for the Battery Technologies field service management application. The testing approach covers unit testing, integration testing, end-to-end testing, and performance testing to ensure high-quality, reliable software delivery.

## Testing Strategy

### 1. Testing Pyramid

```mermaid
graph TD
    A[E2E Tests] --> B[Integration Tests]
    B --> C[Unit Tests]
    
    A1[User Journeys] --> A
    A2[Critical Paths] --> A
    A3[Cross-browser] --> A
    
    B1[API Tests] --> B
    B2[Component Tests] --> B
    B3[Database Tests] --> B
    
    C1[Functions] --> C
    C2[Components] --> C
    C3[Utilities] --> C
```

### 2. Testing Principles

- **Test Early**: Write tests alongside development
- **Test Often**: Run tests on every commit
- **Test Everything**: Aim for 90%+ code coverage
- **Test Realistic**: Use realistic test data
- **Test Fast**: Optimize test execution time
- **Test Reliable**: Minimize flaky tests

## Unit Testing

### 1. Jest Configuration

#### Jest Setup
```javascript
// jest.config.js
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}',
  ],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
}

module.exports = createJestConfig(customJestConfig)
```

#### Jest Setup File
```javascript
// jest.setup.js
import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
    }
  },
}))

// Mock Clerk
jest.mock('@clerk/nextjs', () => ({
  useUser: () => ({
    user: {
      id: 'test-user-id',
      emailAddresses: [{ emailAddress: 'test@example.com' }],
    },
    isLoaded: true,
    isSignedIn: true,
  }),
  useAuth: () => ({
    isLoaded: true,
    isSignedIn: true,
    userId: 'test-user-id',
  }),
}))

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    job: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    customer: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}))
```

### 2. Component Testing

#### Button Component Test
```typescript
// src/components/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from './Button'

describe('Button Component', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  it('handles click events', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('applies correct variant styles', () => {
    render(<Button variant="primary">Primary Button</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-primary-600')
  })

  it('shows loading state', () => {
    render(<Button loading>Loading Button</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
    expect(screen.getByTestId('spinner')).toBeInTheDocument()
  })

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled Button</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
```

#### JobCard Component Test
```typescript
// src/components/JobCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { JobCard } from './JobCard'

const mockJob = {
  id: '1',
  jobNumber: 'JOB-001',
  title: 'Battery Replacement',
  customer: 'John Doe',
  status: 'scheduled' as const,
  scheduledDate: new Date('2024-01-15'),
  serviceType: 'Maintenance',
}

describe('JobCard Component', () => {
  it('renders job information correctly', () => {
    render(<JobCard job={mockJob} />)
    
    expect(screen.getByText('Battery Replacement')).toBeInTheDocument()
    expect(screen.getByText('#JOB-001')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Jan 15, 2024')).toBeInTheDocument()
    expect(screen.getByText('Maintenance')).toBeInTheDocument()
  })

  it('displays correct status badge', () => {
    render(<JobCard job={mockJob} />)
    const statusBadge = screen.getByText('scheduled')
    expect(statusBadge).toHaveClass('bg-warning-100')
  })

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn()
    render(<JobCard job={mockJob} onClick={handleClick} />)
    
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledWith()
  })

  it('applies hover styles', () => {
    render(<JobCard job={mockJob} />)
    const card = screen.getByRole('button')
    expect(card).toHaveClass('hover:shadow-md')
  })
})
```

### 3. Utility Function Testing

#### Date Utility Test
```typescript
// src/lib/__tests__/date-utils.test.ts
import { formatDate, formatDateTime, isToday, isTomorrow } from '../date-utils'

describe('Date Utilities', () => {
  describe('formatDate', () => {
    it('formats date correctly', () => {
      const date = new Date('2024-01-15T10:30:00Z')
      expect(formatDate(date)).toBe('Jan 15, 2024')
    })

    it('handles invalid date', () => {
      expect(formatDate(new Date('invalid'))).toBe('Invalid Date')
    })
  })

  describe('formatDateTime', () => {
    it('formats date and time correctly', () => {
      const date = new Date('2024-01-15T10:30:00Z')
      expect(formatDateTime(date)).toBe('Jan 15, 2024 at 10:30 AM')
    })
  })

  describe('isToday', () => {
    it('returns true for today', () => {
      const today = new Date()
      expect(isToday(today)).toBe(true)
    })

    it('returns false for yesterday', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      expect(isToday(yesterday)).toBe(false)
    })
  })

  describe('isTomorrow', () => {
    it('returns true for tomorrow', () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      expect(isTomorrow(tomorrow)).toBe(true)
    })
  })
})
```

#### Job Utility Test
```typescript
// src/lib/__tests__/job-utils.test.ts
import { getJobStatus, calculateJobDuration, formatJobNumber } from '../job-utils'

describe('Job Utilities', () => {
  describe('getJobStatus', () => {
    it('returns correct status for scheduled job', () => {
      const job = {
        scheduledDate: new Date('2024-01-15T10:00:00Z'),
        completedDate: null,
        cancelledDate: null,
      }
      expect(getJobStatus(job)).toBe('scheduled')
    })

    it('returns completed status', () => {
      const job = {
        scheduledDate: new Date('2024-01-15T10:00:00Z'),
        completedDate: new Date('2024-01-15T12:00:00Z'),
        cancelledDate: null,
      }
      expect(getJobStatus(job)).toBe('completed')
    })
  })

  describe('calculateJobDuration', () => {
    it('calculates duration correctly', () => {
      const start = new Date('2024-01-15T10:00:00Z')
      const end = new Date('2024-01-15T12:30:00Z')
      expect(calculateJobDuration(start, end)).toBe('2h 30m')
    })
  })

  describe('formatJobNumber', () => {
    it('formats job number with prefix', () => {
      expect(formatJobNumber(1)).toBe('JOB-001')
      expect(formatJobNumber(123)).toBe('JOB-123')
    })
  })
})
```

## Integration Testing

### 1. API Route Testing

#### Job API Test
```typescript
// src/app/api/jobs/__tests__/route.test.ts
import { GET, POST } from '../route'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    job: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
}))

describe('/api/jobs', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET', () => {
    it('returns jobs successfully', async () => {
      const mockJobs = [
        {
          id: '1',
          title: 'Battery Replacement',
          status: 'scheduled',
          customer: { name: 'John Doe' },
        },
      ]

      ;(prisma.job.findMany as jest.Mock).mockResolvedValue(mockJobs)

      const request = new NextRequest('http://localhost:3000/api/jobs')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockJobs)
      expect(prisma.job.findMany).toHaveBeenCalled()
    })

    it('handles database errors', async () => {
      ;(prisma.job.findMany as jest.Mock).mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/jobs')
      const response = await GET(request)

      expect(response.status).toBe(500)
    })
  })

  describe('POST', () => {
    it('creates job successfully', async () => {
      const jobData = {
        title: 'New Job',
        customerId: 'customer-1',
        serviceType: 'Maintenance',
      }

      const mockJob = { id: '1', ...jobData }
      ;(prisma.job.create as jest.Mock).mockResolvedValue(mockJob)

      const request = new NextRequest('http://localhost:3000/api/jobs', {
        method: 'POST',
        body: JSON.stringify(jobData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data).toEqual(mockJob)
      expect(prisma.job.create).toHaveBeenCalledWith({
        data: jobData,
      })
    })

    it('validates required fields', async () => {
      const invalidData = { title: '' }

      const request = new NextRequest('http://localhost:3000/api/jobs', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })
  })
})
```

### 2. Database Integration Tests

#### Prisma Integration Test
```typescript
// src/lib/__tests__/prisma.test.ts
import { PrismaClient } from '@prisma/client'

describe('Database Integration', () => {
  let prisma: PrismaClient

  beforeAll(async () => {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.TEST_DATABASE_URL,
        },
      },
    })
    await prisma.$connect()
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  beforeEach(async () => {
    // Clean up test data
    await prisma.job.deleteMany()
    await prisma.customer.deleteMany()
    await prisma.user.deleteMany()
  })

  describe('User Operations', () => {
    it('creates and retrieves user', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          name: 'Test User',
          role: 'TECHNICIAN',
        },
      })

      expect(user.email).toBe('test@example.com')
      expect(user.name).toBe('Test User')

      const retrievedUser = await prisma.user.findUnique({
        where: { id: user.id },
      })

      expect(retrievedUser).toEqual(user)
    })
  })

  describe('Job Operations', () => {
    it('creates job with customer relationship', async () => {
      const customer = await prisma.customer.create({
        data: {
          name: 'Test Customer',
          email: 'customer@example.com',
          type: 'RESIDENTIAL',
        },
      })

      const job = await prisma.job.create({
        data: {
          title: 'Test Job',
          jobNumber: 'JOB-001',
          status: 'SCHEDULED',
          serviceType: 'MAINTENANCE',
          customerId: customer.id,
        },
      })

      expect(job.customerId).toBe(customer.id)

      const jobWithCustomer = await prisma.job.findUnique({
        where: { id: job.id },
        include: { customer: true },
      })

      expect(jobWithCustomer?.customer.name).toBe('Test Customer')
    })
  })
})
```

## End-to-End Testing

### 1. Playwright Configuration

#### Playwright Setup
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

### 2. E2E Test Examples

#### Authentication Flow Test
```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('user can sign in', async ({ page }) => {
    await page.goto('/sign-in')
    
    // Wait for Clerk to load
    await page.waitForSelector('[data-clerk-element="sign-in"]')
    
    // Fill in credentials
    await page.fill('input[name="identifier"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('h1')).toContainText('Dashboard')
  })

  test('user can sign out', async ({ page }) => {
    // Sign in first
    await page.goto('/sign-in')
    await page.fill('input[name="identifier"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    // Wait for dashboard
    await page.waitForURL('/dashboard')
    
    // Sign out
    await page.click('[data-testid="user-menu"]')
    await page.click('[data-testid="sign-out"]')
    
    // Should redirect to sign in
    await expect(page).toHaveURL('/sign-in')
  })
})
```

#### Job Management Flow Test
```typescript
// e2e/jobs.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Job Management', () => {
  test.beforeEach(async ({ page }) => {
    // Sign in before each test
    await page.goto('/sign-in')
    await page.fill('input[name="identifier"]', 'technician@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
  })

  test('user can create a new job', async ({ page }) => {
    await page.goto('/jobs')
    
    // Click new job button
    await page.click('[data-testid="new-job-button"]')
    
    // Fill job form
    await page.fill('input[name="title"]', 'Battery Replacement')
    await page.selectOption('select[name="customerId"]', 'customer-1')
    await page.selectOption('select[name="serviceType"]', 'MAINTENANCE')
    await page.fill('input[name="scheduledDate"]', '2024-01-15')
    await page.fill('textarea[name="description"]', 'Replace old battery with new one')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    
    // Should redirect to jobs list
    await expect(page).toHaveURL('/jobs')
    
    // Should show new job in list
    await expect(page.locator('text=Battery Replacement')).toBeVisible()
  })

  test('user can update job status', async ({ page }) => {
    await page.goto('/jobs')
    
    // Click on first job
    await page.click('[data-testid="job-card"]:first-child')
    
    // Update status to in-progress
    await page.selectOption('select[name="status"]', 'IN_PROGRESS')
    await page.click('[data-testid="save-button"]')
    
    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    
    // Status should be updated
    await expect(page.locator('text=In Progress')).toBeVisible()
  })

  test('user can add photos to job', async ({ page }) => {
    await page.goto('/jobs')
    
    // Click on first job
    await page.click('[data-testid="job-card"]:first-child')
    
    // Click add photo button
    await page.click('[data-testid="add-photo-button"]')
    
    // Upload test image
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles('tests/fixtures/test-image.jpg')
    
    // Should show photo in gallery
    await expect(page.locator('[data-testid="photo-gallery"] img')).toBeVisible()
  })
})
```

#### Offline Functionality Test
```typescript
// e2e/offline.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Offline Functionality', () => {
  test('app works offline', async ({ page, context }) => {
    // Sign in first
    await page.goto('/sign-in')
    await page.fill('input[name="identifier"]', 'technician@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
    
    // Go offline
    await context.setOffline(true)
    
    // Should still be able to view jobs
    await page.goto('/jobs')
    await expect(page.locator('[data-testid="job-card"]')).toBeVisible()
    
    // Should show offline indicator
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible()
    
    // Should be able to create job (queued for sync)
    await page.click('[data-testid="new-job-button"]')
    await page.fill('input[name="title"]', 'Offline Job')
    await page.click('button[type="submit"]')
    
    // Should show queued message
    await expect(page.locator('[data-testid="queued-message"]')).toBeVisible()
    
    // Go back online
    await context.setOffline(false)
    
    // Should sync automatically
    await expect(page.locator('[data-testid="sync-indicator"]')).toBeVisible()
    await expect(page.locator('[data-testid="sync-complete"]')).toBeVisible()
  })
})
```

## Performance Testing

### 1. Load Testing

#### API Load Test
```typescript
// tests/load/api-load.test.ts
import { test, expect } from '@playwright/test'

test.describe('API Load Testing', () => {
  test('jobs API handles concurrent requests', async ({ page }) => {
    const requests = []
    
    // Make 10 concurrent requests
    for (let i = 0; i < 10; i++) {
      requests.push(
        page.request.get('/api/jobs')
      )
    }
    
    const responses = await Promise.all(requests)
    
    // All requests should succeed
    responses.forEach(response => {
      expect(response.status()).toBe(200)
    })
    
    // Response time should be under 2 seconds
    const startTime = Date.now()
    await page.request.get('/api/jobs')
    const responseTime = Date.now() - startTime
    expect(responseTime).toBeLessThan(2000)
  })
})
```

### 2. Performance Monitoring

#### Core Web Vitals Test
```typescript
// e2e/performance.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Performance', () => {
  test('meets Core Web Vitals', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Measure performance metrics
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const metrics = {}
          
          entries.forEach((entry) => {
            if (entry.entryType === 'largest-contentful-paint') {
              metrics.lcp = entry.startTime
            }
            if (entry.entryType === 'first-input') {
              metrics.fid = entry.processingStart - entry.startTime
            }
            if (entry.entryType === 'layout-shift') {
              metrics.cls = entry.value
            }
          })
          
          resolve(metrics)
        }).observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] })
      })
    })
    
    // LCP should be under 2.5s
    expect(metrics.lcp).toBeLessThan(2500)
    
    // FID should be under 100ms
    expect(metrics.fid).toBeLessThan(100)
    
    // CLS should be under 0.1
    expect(metrics.cls).toBeLessThan(0.1)
  })
})
```

## Test Data Management

### 1. Test Fixtures

#### Sample Data
```typescript
// tests/fixtures/test-data.ts
export const testUsers = [
  {
    id: 'user-1',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'ADMIN',
  },
  {
    id: 'user-2',
    email: 'technician@example.com',
    name: 'Technician User',
    role: 'TECHNICIAN',
  },
]

export const testCustomers = [
  {
    id: 'customer-1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    type: 'RESIDENTIAL',
  },
  {
    id: 'customer-2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '+1234567891',
    type: 'COMMERCIAL',
  },
]

export const testJobs = [
  {
    id: 'job-1',
    jobNumber: 'JOB-001',
    title: 'Battery Replacement',
    status: 'SCHEDULED',
    serviceType: 'MAINTENANCE',
    customerId: 'customer-1',
    scheduledDate: new Date('2024-01-15T10:00:00Z'),
  },
]
```

### 2. Database Seeding

#### Test Database Setup
```typescript
// tests/setup/test-db.ts
import { PrismaClient } from '@prisma/client'
import { testUsers, testCustomers, testJobs } from '../fixtures/test-data'

export async function seedTestDatabase() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.TEST_DATABASE_URL,
      },
    },
  })

  // Clean existing data
  await prisma.job.deleteMany()
  await prisma.customer.deleteMany()
  await prisma.user.deleteMany()

  // Seed test data
  await prisma.user.createMany({ data: testUsers })
  await prisma.customer.createMany({ data: testCustomers })
  await prisma.job.createMany({ data: testJobs })

  await prisma.$disconnect()
}
```

## Continuous Integration

### 1. GitHub Actions Workflow

#### Test Pipeline
```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:ci
        env:
          TEST_DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
      
      - name: Run E2E tests
        run: npm run test:e2e:ci
        env:
          TEST_DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
      
      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
```

## Test Reporting

### 1. Coverage Reports

#### Coverage Configuration
```json
{
  "collectCoverageFrom": [
    "src/**/*.{js,jsx,ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/*.stories.{js,jsx,ts,tsx}",
    "!src/**/__tests__/**",
    "!src/**/__mocks__/**"
  ],
  "coverageReporters": [
    "text",
    "lcov",
    "html",
    "json"
  ],
  "coverageDirectory": "coverage",
  "coverageThreshold": {
    "global": {
      "branches": 90,
      "functions": 90,
      "lines": 90,
      "statements": 90
    }
  }
}
```

### 2. Test Results

#### Test Summary
- **Unit Tests**: 200+ tests covering components, utilities, and functions
- **Integration Tests**: 50+ tests covering API routes and database operations
- **E2E Tests**: 30+ tests covering critical user journeys
- **Performance Tests**: 10+ tests covering load and Core Web Vitals
- **Coverage**: 90%+ code coverage across all test types

## Best Practices

### 1. Test Organization
- **Structure**: Mirror source code structure in test directories
- **Naming**: Use descriptive test names that explain the scenario
- **Grouping**: Group related tests using `describe` blocks
- **Isolation**: Each test should be independent and not rely on others

### 2. Test Data
- **Fixtures**: Use consistent test data across all tests
- **Cleanup**: Clean up test data after each test
- **Realistic**: Use realistic data that matches production scenarios
- **Varied**: Test with different data combinations

### 3. Assertions
- **Specific**: Use specific assertions that clearly indicate what failed
- **Descriptive**: Include descriptive error messages
- **Complete**: Test all expected outcomes, not just happy paths
- **Edge Cases**: Include tests for edge cases and error conditions

### 4. Performance
- **Fast**: Keep unit tests fast (< 100ms each)
- **Parallel**: Run tests in parallel when possible
- **Efficient**: Use efficient test data setup and teardown
- **Monitoring**: Monitor test execution time and optimize slow tests

---

*Document Version: 1.0*  
*Last Updated: [Current Date]*  
*Next Review: [Review Date]*
