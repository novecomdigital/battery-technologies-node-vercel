// Force Node.js runtime to avoid Edge Runtime issues with Prisma
export const runtime = 'nodejs';

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks/clerk', // Only webhook should be public
])

const isTechnicianRoute = createRouteMatcher([
  '/technician(.*)',
])

const isApiRoute = createRouteMatcher([
  '/api(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth()
  
  // Handle API routes first
  if (isApiRoute(req)) {
    // Only protect API routes that are not public
    if (!isPublicRoute(req) && !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    // Let API routes continue without auth.protect()
    return
  }
  
  // Handle page routes
  if (!isPublicRoute(req)) {
    await auth.protect()
    
    // Additional check: ensure user exists in database
    if (userId) {
      try {
        const user = await prisma.user.findUnique({
          where: { clerkId: userId },
          select: { id: true }
        })
        
        if (!user) {
          // User authenticated with Clerk but not in database
          return NextResponse.redirect(new URL('/sign-in?error=user_not_found', req.url))
        }
      } catch (error) {
        console.error('Error checking user in database:', error)
        // On database error, allow through but log the issue
      }
    }
  }
  
  // Handle technician route access
  if (isTechnicianRoute(req)) {
    if (!userId) {
      return NextResponse.redirect(new URL('/sign-in', req.url))
    }
    
    // Additional role check will be done in the page components
    // since we need to query the database for user role
  }
})

export const config = {
  // Protects all routes including api/trpc routes
  // Please edit this to allow other routes to be public as needed.
  // See https://clerk.com/docs/references/nextjs/auth-middleware for more information about configuring your Middleware
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}
