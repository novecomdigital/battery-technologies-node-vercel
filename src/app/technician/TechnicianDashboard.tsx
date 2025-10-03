'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { format, startOfWeek, endOfWeek } from 'date-fns'
import {
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  FunnelIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloudIcon,
  WifiIcon
} from '@heroicons/react/24/outline'
import { useTechnicianJobCache } from '@/hooks/useTechnicianJobCache'

interface User {
  id: string
  email: string
  name: string | null
  role: string
}

interface Job {
  id: string
  jobNumber: string
  description: string
  status: string
  serviceType: string
  dueDate: string | null
  startDate: string | null
  endDate: string | null
  notes: string | null
  actualHours: number | null
  customer: {
    id: string
    name: string
  }
  location: {
    id: string
    name: string
    city: string | null
  } | null
  contact: {
    id: string
    firstName: string
    lastName: string
    phone: string | null
    email: string | null
  } | null
  assignedTo: {
    id: string
    name: string
  } | null
}

interface TechnicianDashboardProps {
  user: User
}

type FilterType = 'jobs-today' | 'jobs-this-week' | 'all-jobs'

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

const statusConfig = {
  OPEN: { 
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: ClockIcon,
    label: 'Open'
  },
  VISITED: { 
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: ExclamationTriangleIcon,
    label: 'Visited'
  },
  COMPLETE: { 
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircleIcon,
    label: 'Complete'
  },
  NEEDS_QUOTE: { 
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: ExclamationTriangleIcon,
    label: 'Needs Quote'
  },
  ON_HOLD: { 
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: ClockIcon,
    label: 'On Hold'
  },
  CANCELLED: { 
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: ExclamationTriangleIcon,
    label: 'Cancelled'
  }
}

export default function TechnicianDashboard({ user }: TechnicianDashboardProps) {
  // Use the technician job cache hook
  const {
    jobs: cachedJobs,
    cacheStatus,
    isOnline,
    lastSync,
    syncJobs
  } = useTechnicianJobCache({ 
    technicianId: user.id, 
    autoSync: true,
    syncInterval: 60000 // Sync every minute
  })

  const [isSyncing, setIsSyncing] = useState(false)
  const [isManualSyncing, setIsManualSyncing] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  const [showDebugInfo, setShowDebugInfo] = useState(false)
  const [debugMode, setDebugMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('debugEnabled') === 'true'
    }
    return false
  })

  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [currentFilter, setCurrentFilter] = useState<FilterType>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('technician-dashboard-filter')
      return (saved as FilterType) || 'jobs-today'
    }
    return 'jobs-today'
  })
  const [showAllTechnicians, setShowAllTechnicians] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('technician-dashboard-show-all')
      return saved === 'true'
    }
    return false
  })
  const [searchQuery, setSearchQuery] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('technician-dashboard-search') || ''
    }
    return ''
  })
  const [searchInput, setSearchInput] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('technician-dashboard-search') || ''
    }
    return ''
  })
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  })
  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearchQuery(searchInput)
    }, 500) // 500ms delay

    return () => clearTimeout(timeoutId)
  }, [searchInput])

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true)
      
      // For today's jobs, use cached data if available
      if (currentFilter === 'jobs-today' && !showAllTechnicians && cachedJobs.length > 0) {
        console.log('📱 Using cached jobs for today')
        setJobs(cachedJobs)
        setPagination(prev => ({
          ...prev,
          total: cachedJobs.length,
          totalPages: Math.ceil(cachedJobs.length / pagination.limit)
        }))
        setLoading(false)
        return
      }
      
      const today = new Date()
      const startOfThisWeek = startOfWeek(today, { weekStartsOn: 1 }) // Monday
      const endOfThisWeek = endOfWeek(today, { weekStartsOn: 1 }) // Sunday
      
      let url = `/api/jobs?page=${pagination.page}&limit=${pagination.limit}&sortBy=dueDate&sortOrder=asc`
      
      switch (currentFilter) {
        case 'jobs-today':
          url += `&dueDate=${format(today, 'yyyy-MM-dd')}`
          if (!showAllTechnicians) {
            url += `&assignedToId=${user.id}`
          }
          break
        case 'jobs-this-week':
          url += `&dueDateStart=${format(startOfThisWeek, 'yyyy-MM-dd')}&dueDateEnd=${format(endOfThisWeek, 'yyyy-MM-dd')}`
          if (!showAllTechnicians) {
            url += `&assignedToId=${user.id}`
          }
          break
        case 'all-jobs':
          if (!showAllTechnicians) {
            url += `&assignedToId=${user.id}`
          }
          // Add search query if provided
          if (searchQuery.trim()) {
            url += `&search=${encodeURIComponent(searchQuery.trim())}`
          }
          // No additional date filters - show all jobs
          break
      }
      
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch jobs')
      
      const data = await response.json()
      setJobs(data.jobs || [])
      setPagination(prev => ({
        ...prev,
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.totalPages || 0
      }))
      
    } catch (error) {
      console.error('Error fetching jobs:', error)
      // If offline and we have cached data, use it
      if (!isOnline && cachedJobs.length > 0 && currentFilter === 'jobs-today' && !showAllTechnicians) {
        console.log('📱 Offline - using cached jobs')
        setJobs(cachedJobs)
        setPagination(prev => ({
          ...prev,
          total: cachedJobs.length,
          totalPages: Math.ceil(cachedJobs.length / pagination.limit)
        }))
      }
    } finally {
      setLoading(false)
    }
  }, [currentFilter, showAllTechnicians, pagination.page, pagination.limit, searchQuery, user.id, cachedJobs, isOnline])

  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  // Listen for job updates to refresh jobs list
  useEffect(() => {
    const handleJobUpdate = (event: CustomEvent) => {
      console.log('👨‍🔧 Technician Dashboard: Job update received, refreshing jobs list...', event.detail)
      // Refresh jobs list when job updates occur
      fetchJobs()
    }

    window.addEventListener('jobDataUpdated', handleJobUpdate as EventListener)
    
    return () => {
      window.removeEventListener('jobDataUpdated', handleJobUpdate as EventListener)
    }
  }, [fetchJobs])

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.OPEN
    const Icon = config.icon
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    )
  }

  const isOverdue = (dueDate: string | null, status: string) => {
    if (!dueDate || status === 'COMPLETE') return false
    return new Date(dueDate) < new Date()
  }

  const handleFilterChange = (filter: FilterType) => {
    setCurrentFilter(filter)
    setPagination(prev => ({ ...prev, page: 1 })) // Reset to first page
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('technician-dashboard-filter', filter)
    }
  }

  const handleToggleChange = (checked: boolean) => {
    setShowAllTechnicians(checked)
    setPagination(prev => ({ ...prev, page: 1 })) // Reset to first page
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('technician-dashboard-show-all', checked.toString())
    }
  }

  const handleSearchChange = (query: string) => {
    setSearchInput(query)
    setPagination(prev => ({ ...prev, page: 1 })) // Reset to first page
    // Save to localStorage immediately for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('technician-dashboard-search', query)
    }
  }

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const getFilterLabel = (filter: FilterType) => {
    switch (filter) {
      case 'jobs-today': return 'Today'
      case 'jobs-this-week': return 'This Week'
      case 'all-jobs': return 'All'
      default: return 'Today'
    }
  }

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const getFirstName = (fullName: string | null) => {
    if (!fullName) return ''
    return fullName.split(' ')[0]
  }

  const addDebugInfo = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setDebugInfo(prev => [...prev.slice(-9), `${timestamp}: ${message}`])
  }

  const clearDebugInfo = () => {
    setDebugInfo([])
  }

  const handleManualSync = async () => {
    if (isManualSyncing) return
    
    setIsManualSyncing(true)
    addDebugInfo('🔄 Manual sync started...')
    
    try {
      // Trigger both job cache sync and general sync
      await Promise.all([
        syncJobs(),
        // Also trigger the general sync manager
        new Promise<void>((resolve) => {
          if (typeof window !== 'undefined' && (window as unknown as { syncManager?: { forceSync: () => Promise<void> } }).syncManager) {
            (window as unknown as { syncManager: { forceSync: () => Promise<void> } }).syncManager.forceSync().then(() => resolve())
          } else {
            resolve()
          }
        })
      ])
      
      addDebugInfo('✅ Manual sync completed successfully')
    } catch (error) {
      console.error('Manual sync failed:', error)
      addDebugInfo(`❌ Manual sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsManualSyncing(false)
    }
  }

  // Listen for debug toggle events from mobile usage guide
  useEffect(() => {
    const handleDebugToggle = (event: CustomEvent) => {
      setDebugMode(event.detail.enabled)
    }

    window.addEventListener('debugToggle', handleDebugToggle as EventListener)
    
    return () => {
      window.removeEventListener('debugToggle', handleDebugToggle as EventListener)
    }
  }, [])

  // Ensure jobs are pre-cached for offline access as soon as they're available
  useEffect(() => {
    const ensureJobPreCaching = async () => {
      if (cachedJobs.length > 0 && isOnline) {
        try {
          console.log('🔧 TechnicianDashboard: Ensuring job detail pages are pre-cached...')
          const { precacheJobsForOffline } = await import('@/lib/precache-job-details')
          const result = await precacheJobsForOffline(cachedJobs)
          console.log('✅ TechnicianDashboard: Job detail pages pre-cached:', result)
        } catch (error) {
          console.warn('⚠️ TechnicianDashboard: Failed to pre-cache job details:', error)
        }
      }
    }

    // Run pre-caching after a short delay to ensure everything is loaded
    const timeoutId = setTimeout(ensureJobPreCaching, 2000)
    return () => clearTimeout(timeoutId)
  }, [cachedJobs, isOnline])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {getTimeBasedGreeting()}, {getFirstName(user.name) || user.email}
              </h1>
              <p className="mt-2 text-lg text-gray-600">
                Here are your assigned jobs
              </p>
            </div>
            
            {/* Cache Status Indicator */}
            <div className="flex items-center space-x-4">
              {cacheStatus && (
                <div className="flex items-center space-x-2 text-sm">
                  {isOnline ? (
                    <WifiIcon className="h-4 w-4 text-green-500" />
                  ) : (
                    <CloudIcon className="h-4 w-4 text-orange-500" />
                  )}
                  <span className={isOnline ? 'text-green-600' : 'text-orange-600'}>
                    {isOnline ? 'Online' : 'Offline'}
                  </span>
                  {lastSync && (
                    <span className="text-gray-500">
                      • Last sync: {format(lastSync, 'HH:mm')}
                    </span>
                  )}
                </div>
              )}
              
              {!isOnline && cachedJobs.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                  <p className="text-sm text-blue-800">
                    📱 Using cached data • {cachedJobs.length} jobs available offline
                  </p>
                </div>
              )}
              
              {/* Manual Sync Button */}
              <button
                onClick={handleManualSync}
                disabled={isManualSyncing || !isOnline}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isManualSyncing || !isOnline
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                {isManualSyncing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span>Syncing...</span>
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Sync Now</span>
                  </>
                )}
              </button>

              {isOnline && (
                <>
                  <button
                    onClick={async () => {
                      setIsSyncing(true)
                      try {
                        await syncJobs()
                      } finally {
                        setIsSyncing(false)
                      }
                    }}
                    disabled={isSyncing}
                    className="flex items-center space-x-2 bg-green-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
                  >
                    {isSyncing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Syncing...</span>
                      </>
                    ) : (
                      <>
                        <WifiIcon className="h-4 w-4" />
                        <span>Sync Now</span>
                      </>
                    )}
                  </button>
                  
                  {/* Debug buttons - only show when debug mode is enabled */}
                  {debugMode && (
                    <>
                      <button
                        onClick={async () => {
                          if (jobs.length > 0) {
                            addDebugInfo(`Starting to cache ${jobs.length} jobs for offline...`)
                            console.log('🔧 Manually pre-caching job details...')
                            console.log('📱 Jobs to pre-cache:', jobs.map(j => ({ id: j.id, jobNumber: j.jobNumber })))
                            try {
                              const { precacheJobsForOffline } = await import('@/lib/precache-job-details')
                              addDebugInfo('Pre-caching job detail pages...')
                              const result = await precacheJobsForOffline(jobs)
                              console.log('✅ Manual pre-caching result:', result)
                              
                              if (result && result.successful > 0) {
                                addDebugInfo(`✅ Successfully cached ${result.successful} job details`)
                                alert(`✅ Successfully pre-cached ${result.successful} job details for offline access`)
                              } else {
                                addDebugInfo(`⚠️ Caching completed: ${result?.successful || 0} successful, ${result?.failed || 0} failed`)
                                alert(`Pre-caching completed: ${result?.successful || 0} successful, ${result?.failed || 0} failed`)
                              }
                            } catch (error) {
                              addDebugInfo(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
                              console.error('❌ Error pre-caching job details:', error)
                              alert(`Failed to pre-cache job details: ${error instanceof Error ? error.message : 'Unknown error'}`)
                            }
                          } else {
                            addDebugInfo('No jobs to pre-cache')
                            alert('No jobs to pre-cache')
                          }
                        }}
                        className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700"
                      >
                        <CloudIcon className="h-4 w-4" />
                        <span>Cache for Offline</span>
                      </button>

                      <button
                        onClick={() => setShowDebugInfo(!showDebugInfo)}
                        className="flex items-center space-x-2 bg-gray-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-gray-700"
                      >
                        <span>Debug</span>
                      </button>

                      <button
                        onClick={async () => {
                          if (jobs.length > 0) {
                            const jobId = jobs[0].id
                            addDebugInfo(`Testing page caching for job ${jobId}...`)
                            try {
                              const result = await (window as unknown as { testPageCaching: (id: string) => Promise<{cached: boolean, justCached?: boolean, error?: string}> }).testPageCaching(jobId)
                              if (result.cached) {
                                addDebugInfo(`✅ Page caching test: ${result.justCached ? 'Just cached' : 'Already cached'}`)
                                alert(`Page caching test: ${result.justCached ? 'Just cached' : 'Already cached'} job ${jobId}`)
                              } else {
                                addDebugInfo(`❌ Page caching test failed: ${result.error}`)
                                alert(`Page caching test failed: ${result.error}`)
                              }
                            } catch (error) {
                              addDebugInfo(`❌ Error testing page caching: ${error instanceof Error ? error.message : 'Unknown error'}`)
                              alert('Failed to test page caching')
                            }
                          } else {
                            alert('No jobs to test')
                          }
                        }}
                        className="flex items-center space-x-2 bg-purple-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-purple-700"
                      >
                        <span>Test Page Cache</span>
                      </button>

                      <button
                        onClick={async () => {
                          try {
                            addDebugInfo('Checking page cache contents...')
                            const result = await (window as unknown as { checkPageCache: () => Promise<{totalPages: number, technicianJobPages: number, technicianJobUrls: string[]}> }).checkPageCache()
                            addDebugInfo(`Page cache: ${result.totalPages} total pages, ${result.technicianJobPages} job pages`)
                            addDebugInfo(`Job pages: ${result.technicianJobUrls.join(', ')}`)
                            alert(`Page cache contains ${result.totalPages} pages, ${result.technicianJobPages} job pages`)
                          } catch (error) {
                            addDebugInfo(`❌ Error checking page cache: ${error instanceof Error ? error.message : 'Unknown error'}`)
                            alert('Failed to check page cache')
                          }
                        }}
                        className="flex items-center space-x-2 bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-indigo-700"
                      >
                        <span>Check Page Cache</span>
                      </button>

                      <button
                        onClick={async () => {
                          if (confirm('Are you sure you want to clear all cached jobs? This will require re-caching.')) {
                            try {
                              addDebugInfo('Clearing all cached jobs...')
                              const { technicianJobCache } = await import('@/lib/technician-job-cache')
                              await technicianJobCache.clearAllCache()
                              addDebugInfo('✅ Cache cleared successfully')
                              alert('Cache cleared! Please refresh the page and re-cache your jobs.')
                            } catch (error) {
                              addDebugInfo(`❌ Error clearing cache: ${error instanceof Error ? error.message : 'Unknown error'}`)
                              alert('Failed to clear cache')
                            }
                          }
                        }}
                        className="flex items-center space-x-2 bg-red-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-red-700"
                      >
                        <span>Clear Cache</span>
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>


        {/* Filter Buttons */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FunnelIcon className="h-5 w-5 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900">Job Filters</h3>
              </div>
            </div>
            <div className="mt-4 flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
              {/* Filter Buttons - Grow to fill available width */}
              <div className="flex gap-3 order-1 sm:order-1 sm:flex-wrap flex-1">
                {(['jobs-today', 'jobs-this-week', 'all-jobs'] as FilterType[]).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => handleFilterChange(filter)}
                    className={`flex-1 px-6 py-3 rounded-lg text-base font-medium transition-colors duration-150 touch-manipulation whitespace-nowrap sm:flex-none ${
                      currentFilter === filter
                        ? 'bg-green-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
                    }`}
                  >
                    {getFilterLabel(filter)}
                  </button>
                ))}
              </div>
              
              {/* All Technicians Toggle - Right aligned on mobile, Right on desktop */}
              <div className="flex items-center justify-end space-x-3 order-2 sm:order-2">
                <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  All technicians
                </span>
                <button
                  type="button"
                  onClick={() => handleToggleChange(!showAllTechnicians)}
                  className={`relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 touch-manipulation ${
                    showAllTechnicians ? 'bg-green-600' : 'bg-gray-200'
                  }`}
                  role="switch"
                  aria-checked={showAllTechnicians}
                >
                  <span
                    className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      showAllTechnicians ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar - Only show when "All Jobs" filter is selected */}
        {currentFilter === 'all-jobs' && (
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:px-6">
              <div className="flex items-center space-x-2 mb-4">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900">Search Jobs</h3>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search by job number, customer name, or description..."
                  className="w-full px-4 py-3 pl-10 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 touch-manipulation placeholder:text-gray-600"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                {searchInput && (
                  <button
                    onClick={() => handleSearchChange('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Debug Info Panel - only show when debug mode is enabled */}
        {debugMode && showDebugInfo && (
          <div className="mb-6 bg-gray-100 border border-gray-300 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-gray-700">Debug Information</h3>
              <button
                onClick={clearDebugInfo}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Clear
              </button>
            </div>
            <div className="bg-black text-green-400 p-3 rounded text-xs font-mono max-h-32 overflow-y-auto">
              {debugInfo.length === 0 ? (
                <div className="text-gray-500">No debug information yet. Click &quot;Cache for Offline&quot; to see what happens.</div>
              ) : (
                debugInfo.map((info, index) => (
                  <div key={index} className="mb-1">{info}</div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Jobs List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {getFilterLabel(currentFilter)} ({pagination.total})
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  {currentFilter === 'jobs-today' && (showAllTechnicians ? 'All jobs due today' : 'Your jobs due today')}
                  {currentFilter === 'jobs-this-week' && (showAllTechnicians ? 'All jobs due this week' : 'Your jobs due this week')}
                  {currentFilter === 'all-jobs' && (showAllTechnicians ? 'All jobs in the system' : 'All your jobs')}
                </p>
              </div>
            </div>
          </div>
          
          {jobs.length === 0 ? (
            <div className="text-center py-12">
              <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No jobs found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery ? (
                  `No jobs found matching "${searchQuery}". Try adjusting your search terms.`
                ) : (
                  <>
                    {currentFilter === 'jobs-today' && (showAllTechnicians ? 'No jobs are due today.' : 'You don\'t have any jobs due today.')}
                    {currentFilter === 'jobs-this-week' && (showAllTechnicians ? 'No jobs are due this week.' : 'You don\'t have any jobs due this week.')}
                    {currentFilter === 'all-jobs' && (showAllTechnicians ? 'No jobs found in the system.' : 'You don\'t have any jobs assigned.')}
                  </>
                )}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {jobs.map((job) => (
                <li key={job.id}>
                  <Link 
                    href={`/technician/jobs/${job.id}`}
                    className="block hover:bg-gray-50 active:bg-gray-100 transition-colors duration-150 touch-manipulation"
                  >
                    <div className="px-4 py-6 sm:px-6">
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-green-600">
                            #{job.jobNumber}
                          </p>
                          <div className="flex items-center space-x-2">
                            {job.assignedTo ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                {job.assignedTo.name}
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                Unassigned
                              </span>
                            )}
                            {getStatusBadge(job.status)}
                          </div>
                        </div>
                        <p className="text-sm text-gray-900 font-medium">
                          {job.description}
                        </p>
                      </div>
                      
                      <div className="mt-3 flex flex-col space-y-3 sm:grid sm:grid-cols-2 lg:flex lg:flex-row lg:items-center lg:justify-between lg:space-y-0 lg:space-x-6 text-sm text-gray-500">
                        <div className="flex items-center">
                          <MapPinIcon className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                          <span>{job.customer.name}</span>
                          {job.location && (
                            <span className="ml-1">• {job.location.name}</span>
                          )}
                        </div>
                        
                        
                        {job.contact && (
                          <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-x-3 sm:space-y-0 sm:col-span-2 lg:flex-row lg:items-center lg:space-x-4 lg:space-y-0">
                            {job.contact.phone && (
                              <div className="flex items-center">
                                <PhoneIcon className="flex-shrink-0 mr-1 h-4 w-4 text-gray-400" />
                                <span>{job.contact.phone}</span>
                              </div>
                            )}
                            {job.contact.email && (
                              <div className="flex items-center">
                                <EnvelopeIcon className="flex-shrink-0 mr-1 h-4 w-4 text-gray-400" />
                                <span>{job.contact.email}</span>
                              </div>
                            )}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-start space-x-2">
                          {job.dueDate && (
                            <span className={`text-sm font-medium ${
                              isOverdue(job.dueDate, job.status) ? 'text-red-600' : 'text-gray-600'
                            }`}>
                              Booked for {format(new Date(job.dueDate), 'EEEE, MMM d, yyyy')}
                            </span>
                          )}
                          {isOverdue(job.dueDate, job.status) && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                              Overdue
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          
          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="relative inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="ml-3 relative inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{' '}
                    <span className="font-medium">
                      {(pagination.page - 1) * pagination.limit + 1}
                    </span>{' '}
                    to{' '}
                    <span className="font-medium">
                      {Math.min(pagination.page * pagination.limit, pagination.total)}
                    </span>{' '}
                    of{' '}
                    <span className="font-medium">{pagination.total}</span>{' '}
                    results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="relative inline-flex items-center px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                    >
                      <span className="sr-only">Previous</span>
                      <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                    
                    {/* Page numbers */}
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      const pageNum = Math.max(1, Math.min(pagination.totalPages - 4, pagination.page - 2)) + i
                      if (pageNum > pagination.totalPages) return null
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium touch-manipulation ${
                            pageNum === pagination.page
                              ? 'z-10 bg-green-50 border-green-500 text-green-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50 active:bg-gray-100'
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    })}
                    
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                      className="relative inline-flex items-center px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                    >
                      <span className="sr-only">Next</span>
                      <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
