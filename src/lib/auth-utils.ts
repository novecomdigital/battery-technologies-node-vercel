import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'

export async function getCurrentUser() {
  const { userId: clerkId } = await auth()
  
  if (!clerkId) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      clerkId: true
    }
  })

  return user
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Authentication required')
  }
  return user
}

export async function requireRole(allowedRoles: UserRole[]) {
  const user = await requireAuth()
  if (!allowedRoles.includes(user.role)) {
    throw new Error('Insufficient permissions')
  }
  return user
}

export function canEditJob(userRole: UserRole, jobAssignedToId: string | null, userId: string): boolean {
  // Admins and managers can edit any job
  if (userRole === 'ADMIN' || userRole === 'MANAGER') {
    return true
  }
  
  // Technicians can only edit jobs assigned to them
  if (userRole === 'TECHNICIAN') {
    return jobAssignedToId === userId
  }
  
  // Viewers cannot edit jobs
  return false
}

export function canCreateJob(userRole: UserRole): boolean {
  return userRole === 'ADMIN' || userRole === 'MANAGER'
}

export function canViewAllJobs(userRole: UserRole): boolean {
  return userRole === 'ADMIN' || userRole === 'MANAGER' || userRole === 'VIEWER'
}

export function getTechnicianEditableFields(userRole: UserRole): string[] {
  if (userRole === 'TECHNICIAN') {
    return [
      'status',
      'notes',
      'startDate',
      'endDate',
      'actualHours',
      'batterySerial',
      'equipmentSerial'
    ]
  }
  
  // Non-technicians can edit all fields (subject to other role checks)
  return []
}
