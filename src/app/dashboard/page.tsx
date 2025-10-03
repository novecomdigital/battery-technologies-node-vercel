'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ChartBarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  PlusIcon,
  CalendarDaysIcon,
  BoltIcon
} from '@heroicons/react/24/outline'
import { clearJobFilters, resetFiltersForStatus } from '@/lib/job-filters'

// Define a minimal job interface for dashboard display
interface DashboardJob {
  id: string
  jobNumber: string
  status: string
  description: string | null
  customer: {
    name: string
  }
}

// Stat Card Component
const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  color = 'blue',
  trend,
  href,
  resetFilters = false,
  statusFilter = null
}: {
  title: string
  value: number | string | undefined
  icon: React.ComponentType<{ className?: string }>
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple'
  trend?: { value: number; isPositive: boolean }
  href?: string
  resetFilters?: boolean
  statusFilter?: string | null
}) => {
  const colorClasses = {
    blue: 'bg-green-50 text-green-600 border-green-200',
    green: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    yellow: 'bg-amber-50 text-amber-600 border-amber-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200'
  }

  const handleClick = () => {
    if (resetFilters) {
      clearJobFilters()
    } else if (statusFilter) {
      resetFiltersForStatus(statusFilter)
    }
  }

  const content = (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value?.toLocaleString() || '0'}</p>
          {trend && (
            <p className={`text-sm mt-1 ${trend.isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
              {trend.isPositive ? '+' : ''}{trend.value}% from last month
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg border ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  )

  return href ? (
    <Link href={href} className="block" onClick={handleClick}>
      {content}
    </Link>
  ) : content
}

// Quick Action Button Component
const QuickActionButton = ({ 
  title, 
  description, 
  icon: Icon, 
  href, 
  color = 'blue',
  resetFilters = false
}: {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  color?: 'blue' | 'green' | 'purple' | 'orange'
  resetFilters?: boolean
}) => {
  const colorClasses = {
    blue: 'bg-green-600 hover:bg-green-700 text-white',
    green: 'bg-green-600 hover:bg-green-700 text-white',
    purple: 'bg-green-600 hover:bg-green-700 text-white',
    orange: 'bg-green-600 hover:bg-green-700 text-white'
  }

  const handleClick = () => {
    if (resetFilters) {
      clearJobFilters()
    }
  }

  return (
    <Link
      href={href}
      className={`flex items-center p-4 rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200 ${colorClasses[color]}`}
      onClick={handleClick}
    >
      <div className="flex-shrink-0">
        <Icon className="h-6 w-6" />
      </div>
      <div className="ml-4">
        <h3 className="text-sm font-medium">{title}</h3>
        <p className="text-sm opacity-90 mt-1">{description}</p>
      </div>
    </Link>
  )
}

// Job List Item Component
interface Job {
  id: string
  jobNumber: string
  description: string | null
  status: string
  customer: {
    name: string
  }
}

const JobListItem = ({ job }: { job: Job }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-blue-100 text-blue-800'
      case 'VISITED': return 'bg-amber-100 text-amber-800'
      case 'COMPLETE': return 'bg-emerald-100 text-emerald-800'
      case 'NEEDS_QUOTE': return 'bg-orange-100 text-orange-800'
      case 'ON_HOLD': return 'bg-purple-100 text-purple-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }


  return (
    <div 
      className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow duration-150 cursor-pointer"
      onClick={() => window.location.href = `/jobs/${job.id}?return=%2Fdashboard`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-3">
          <span className="text-sm font-mono font-medium text-gray-900">
            {job.jobNumber}
          </span>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(job.status)}`}>
            {job.status.replace('_', ' ')}
          </span>
        </div>
        <h4 className="text-sm font-medium text-gray-900 mt-1 truncate">
          {job.description || 'No description'}
        </h4>
        <p className="text-sm text-gray-500 truncate">
          {job.customer.name}
        </p>
      </div>
      <div className="flex items-center space-x-2 ml-4">
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  // const [userData, setUserData] = useState<{
  //   id: string
  //   email: string
  //   name: string | null
  //   role: string
  // } | null>(null)
  const [dashboardData, setDashboardData] = useState<{
    totalJobs: number
    openJobs: number
    visitedJobs: number
    completedJobs: number
    totalCustomers: number
    totalServiceProviders: number
    todaysJobs: DashboardJob[]
    recentJobs: DashboardJob[]
  }>({
    totalJobs: 0,
    openJobs: 0,
    visitedJobs: 0,
    completedJobs: 0,
    totalCustomers: 0,
    totalServiceProviders: 0,
    todaysJobs: [],
    recentJobs: []
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const hasCheckedRole = useRef(false)

  const checkUserRole = useCallback(async () => {
    try {
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const data = await response.json()
        
        // Redirect technicians to their dashboard
        if (data.role === 'TECHNICIAN') {
          router.push('/technician')
          return
        }
        
        // Continue with dashboard data fetch for other roles
        fetchDashboardData()
      } else if (response.status === 404) {
        // User not found in database - redirect to sign out
        console.log('User not found in database - redirecting to sign out')
        router.push('/sign-in?error=user_not_found')
      } else {
        router.push('/sign-in')
      }
    } catch (error) {
      console.error('Error checking user role:', error)
      router.push('/sign-in')
    }
  }, [router])
  useEffect(() => {
    if (!isLoaded) return
    
    if (!user) {
      router.push('/sign-in')
      return
    }

    // Only check user role once
    if (!hasCheckedRole.current) {
      hasCheckedRole.current = true
      checkUserRole()
    }
  }, [isLoaded, user, router, checkUserRole])

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      const [
        totalJobs,
        openJobs,
        visitedJobs,
        completedJobs,
        totalCustomers,
        totalServiceProviders,
        todaysJobs,
        recentJobs
      ] = await Promise.all([
        fetch('/api/jobs/counts').then(res => res.json()).then(data => data.ALL || 0),
        fetch('/api/jobs/counts?status=OPEN').then(res => res.json()).then(data => data.OPEN || 0),
        fetch('/api/jobs/counts?status=VISITED').then(res => res.json()).then(data => data.VISITED || 0),
        fetch('/api/jobs/counts?status=COMPLETE').then(res => res.json()).then(data => data.COMPLETE || 0),
        fetch('/api/customers').then(res => res.json()).then(data => data.length),
        fetch('/api/service-providers').then(res => res.json()).then(data => data.length),
        fetch(`/api/jobs?limit=10&sortBy=dueDate&sortOrder=asc&dueDate=${new Date().toISOString().split('T')[0]}`).then(res => res.json()).then(data => data.jobs || []),
        fetch('/api/jobs?limit=5&sortBy=createdAt&sortOrder=desc').then(res => res.json()).then(data => data.jobs || [])
      ])

      setDashboardData({
        totalJobs,
        openJobs,
        visitedJobs,
        completedJobs,
        totalCustomers,
        totalServiceProviders,
        todaysJobs,
        recentJobs
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Listen for job updates to refresh dashboard data
  useEffect(() => {
    const handleJobUpdate = (event: CustomEvent) => {
      console.log('📊 Dashboard: Job update received, refreshing data...', event.detail)
      // Show refreshing indicator and refresh dashboard data
      setRefreshing(true)
      fetchDashboardData().finally(() => {
        setRefreshing(false)
      })
    }

    window.addEventListener('jobDataUpdated', handleJobUpdate as EventListener)
    
    return () => {
      window.removeEventListener('jobDataUpdated', handleJobUpdate as EventListener)
    }
  }, [])

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const { totalJobs, openJobs, visitedJobs, completedJobs, totalCustomers, totalServiceProviders, todaysJobs, recentJobs } = dashboardData

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
              <p className="mt-1 text-sm text-gray-600">
                Welcome back! Here&apos;s what&apos;s happening with your battery service operations.
              </p>
            </div>
            {refreshing && (
              <div className="flex items-center space-x-2 text-sm text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span>Updating...</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="All Jobs"
            value={totalJobs}
            icon={ChartBarIcon}
            color="blue"
            href="/jobs"
            resetFilters={true}
          />
          <StatCard
            title="Open Jobs"
            value={openJobs}
            icon={ExclamationTriangleIcon}
            color="red"
            href="/jobs"
            statusFilter="OPEN"
          />
          <StatCard
            title="Visited Jobs"
            value={visitedJobs}
            icon={ClockIcon}
            color="yellow"
            href="/jobs"
            statusFilter="VISITED"
          />
          <StatCard
            title="Completed Jobs"
            value={completedJobs}
            icon={CheckCircleIcon}
            color="green"
            href="/jobs"
            statusFilter="COMPLETE"
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <StatCard
            title="Total Customers"
            value={totalCustomers}
            icon={UserGroupIcon}
            color="purple"
          />
          <StatCard
            title="Service Providers"
            value={totalServiceProviders}
            icon={BuildingOfficeIcon}
            color="blue"
          />
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <QuickActionButton
              title="Create New Job"
              description="Add a new service job"
              icon={PlusIcon}
              href="/jobs/new?return=%2Fdashboard"
              color="blue"
            />
            <QuickActionButton
              title="View All Jobs"
              description="Browse and manage jobs"
              icon={ChartBarIcon}
              href="/jobs"
              color="green"
              resetFilters={true}
            />
            <QuickActionButton
              title="Add Customer"
              description="Register new customer"
              icon={UserGroupIcon}
              href="/customers/new"
              color="purple"
            />
            <QuickActionButton
              title="Schedule Jobs"
              description="Plan upcoming work"
              icon={CalendarDaysIcon}
              href="/jobs/schedule"
              color="orange"
            />
          </div>
        </div>

        {/* Today's Jobs and Recent Jobs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Today's Jobs */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Today&apos;s Jobs</h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {todaysJobs.length} jobs
                </span>
              </div>
            </div>
            <div className="p-6">
              {todaysJobs.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarDaysIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h4 className="text-sm font-medium text-gray-900 mb-1">No jobs scheduled today</h4>
                  <p className="text-sm text-gray-500">All caught up! Great work.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todaysJobs.map((job) => (
                    <JobListItem key={job.id} job={job} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Jobs */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Recent Jobs</h3>
                <Link
                  href="/jobs?return=%2Fdashboard"
                  className="text-sm font-medium text-green-600 hover:text-green-700 transition-colors duration-150"
                >
                  View all
                </Link>
              </div>
            </div>
            <div className="p-6">
              {recentJobs.length === 0 ? (
                <div className="text-center py-8">
                  <BoltIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h4 className="text-sm font-medium text-gray-900 mb-1">No recent jobs</h4>
                  <p className="text-sm text-gray-500">Jobs will appear here as they&apos;re created.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentJobs.map((job) => (
                    <JobListItem key={job.id} job={job} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}