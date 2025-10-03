# Code Examples

This document provides examples of common patterns and implementations in this template.

## 📦 Table of Contents

- [API Routes](#api-routes)
- [React Components](#react-components)
- [Database Operations](#database-operations)
- [Testing](#testing)
- [Error Handling](#error-handling)
- [Authentication](#authentication)

---

## 🔌 API Routes

### Basic API Route

**`src/app/api/users/route.ts`:**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: users,
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch users',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    if (!body.email || !body.name) {
      return NextResponse.json(
        { success: false, error: 'Email and name are required' },
        { status: 400 }
      )
    }

    const user = await prisma.user.create({
      data: {
        email: body.email,
        name: body.name,
      },
    })

    return NextResponse.json({
      success: true,
      data: user,
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create user' },
      { status: 500 }
    )
  }
}
```

### API Route with Dynamic Segments

**`src/app/api/users/[id]/route.ts`:**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        posts: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: user,
    })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const body = await request.json()

    const user = await prisma.user.update({
      where: { id: params.id },
      data: body,
    })

    return NextResponse.json({
      success: true,
      data: user,
    })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    await prisma.user.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}
```

---

## ⚛️ React Components

### Server Component (Default)

**`src/app/users/page.tsx`:**
```typescript
import { prisma } from '@/lib/prisma'

export default async function UsersPage() {
  const users = await prisma.user.findMany()

  return (
    <div>
      <h1>Users</h1>
      <ul>
        {users.map((user) => (
          <li key={user.id}>
            {user.name} - {user.email}
          </li>
        ))}
      </ul>
    </div>
  )
}
```

### Client Component with State

**`src/components/Counter.tsx`:**
```typescript
'use client'

import { useState } from 'react'
import { Button } from './Button'

export function Counter() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <p>Count: {count}</p>
      <Button onClick={() => setCount(count + 1)}>
        Increment
      </Button>
    </div>
  )
}
```

### Component with Loading States

**`src/components/UserList.tsx`:**
```typescript
'use client'

import { useState, useEffect } from 'react'

interface User {
  id: string
  name: string
  email: string
}

export function UserList() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/users')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setUsers(data.data)
        } else {
          setError(data.error)
        }
      })
      .catch((err) => setError('Failed to fetch users'))
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>
          {user.name} - {user.email}
        </li>
      ))}
    </ul>
  )
}
```

---

## 🗄️ Database Operations

### Create Record

```typescript
const user = await prisma.user.create({
  data: {
    email: 'user@example.com',
    name: 'John Doe',
  },
})
```

### Read Records

```typescript
// Find many
const users = await prisma.user.findMany({
  where: {
    published: true,
  },
  orderBy: {
    createdAt: 'desc',
  },
  take: 10,
})

// Find one
const user = await prisma.user.findUnique({
  where: { id: 'user-id' },
  include: {
    posts: true,
  },
})
```

### Update Record

```typescript
const updatedUser = await prisma.user.update({
  where: { id: 'user-id' },
  data: {
    name: 'Jane Doe',
  },
})
```

### Delete Record

```typescript
await prisma.user.delete({
  where: { id: 'user-id' },
})
```

### Transactions

```typescript
const result = await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({
    data: { email: 'user@example.com', name: 'John' },
  })

  const post = await tx.post.create({
    data: {
      title: 'First Post',
      authorId: user.id,
    },
  })

  return { user, post }
})
```

---

## 🧪 Testing

### Component Test

```typescript
import { render, screen } from '@testing-library/react'
import { Button } from './Button'

describe('Button', () => {
  it('should render button with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button')).toHaveTextContent('Click me')
  })

  it('should handle click events', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    screen.getByRole('button').click()
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

### API Route Test

```typescript
import { GET } from './route'
import { prisma } from '@/lib/prisma'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
    },
  },
}))

describe('GET /api/users', () => {
  it('should return list of users', async () => {
    const mockUsers = [
      { id: '1', name: 'John', email: 'john@example.com' },
    ]
    
    ;(prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers)

    const response = await GET(new Request('http://localhost/api/users'))
    const data = await response.json()

    expect(data.success).toBe(true)
    expect(data.data).toEqual(mockUsers)
  })
})
```

### E2E Test (Playwright)

```typescript
import { test, expect } from '@playwright/test'

test('homepage should load', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/node-vercel-template/)
})

test('user can navigate to about page', async ({ page }) => {
  await page.goto('/')
  await page.click('text=About')
  await expect(page).toHaveURL(/\/about/)
})
```

---

## 🔧 Error Handling

### API Error Handling

```typescript
try {
  const data = await someOperation()
  return NextResponse.json({ success: true, data })
} catch (error) {
  console.error('Operation failed:', error)
  
  if (error instanceof ValidationError) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    )
  }
  
  if (error instanceof NotFoundError) {
    return NextResponse.json(
      { success: false, error: 'Resource not found' },
      { status: 404 }
    )
  }
  
  return NextResponse.json(
    { success: false, error: 'Internal server error' },
    { status: 500 }
  )
}
```

### Client Error Boundary

```typescript
'use client'

import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div>
          <h2>Something went wrong</h2>
          <button onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
```

---

## 🔐 Authentication

### API Route Protection

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

export async function GET(request: NextRequest) {
  const session = await getServerSession()

  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  // Your protected logic here
  return NextResponse.json({ data: 'Protected data' })
}
```

### Protected Page

```typescript
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'

export default async function ProtectedPage() {
  const session = await getServerSession()

  if (!session) {
    redirect('/auth/signin')
  }

  return <div>Protected content for {session.user?.name}</div>
}
```

---

## 📚 More Examples

For more examples and patterns:

- Check the `/src` directory for working implementations
- See test files (`*.test.ts` / `*.test.tsx`) for usage examples
- Refer to [`AI_WORKFLOW.md`](./AI_WORKFLOW.md) for AI-generated code patterns
- Review the [Next.js documentation](https://nextjs.org/docs)
- Review the [Prisma documentation](https://www.prisma.io/docs)

---

**Last Updated**: 2024-01-01

