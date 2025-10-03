'use client'

import { useState, useEffect, Suspense, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
// Define types locally to avoid import issues
type JobStatus = 'OPEN' | 'COMPLETE' | 'VISITED' | 'NEEDS_QUOTE' | 'ON_HOLD' | 'CANCELLED'
type ServiceType = 'BATTERY_INSPECTION' | 'CHARGER_INSPECTION' | 'BATTERY_CHARGER_INSPECTION' | 'SUPPLY_FIT_BATTERY' | 'SUPPLY_DELIVER_CHARGER' | 'SUPPLY_FIT_CELLS' | 'CHARGER_RENTAL' | 'BATTERY_WATER_TOPPING' | 'BATTERY_REPAIR' | 'BATTERY_RENTAL' | 'CHARGER_REPAIR' | 'PARTS_ORDERED' | 'SITE_SURVEY' | 'DELIVERY' | 'COLLECTION' | 'OTHER'
import { format } from 'date-fns'
import { User } from '@prisma/client'
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  ChevronUpIcon, 
  ChevronDownIcon,
  ChevronUpDownIcon,
  PencilIcon,
  XMarkIcon,
  ChevronLeftIcon,
  PlusIcon,
  ChevronRightIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline'
import { getJobFilters, saveJobFilters, buildJobsUrl, JobFilters } from '@/lib/job-filters'

interface Job {
  id: string
  jobNumber: string
  description: string | null
  status: JobStatus
  serviceType: ServiceType
  dueDate: Date | null
  customer: {
    name: string
    customerType: string
  }
  serviceProvider: {
    name: string
  } | null
  location: {
    name: string
    city: string | null
  } | null
  assignedTo: {
    id: string
    name: string | null
    email: string
  } | null
}


// Design System - Status Colors
const statusConfig = {
  OPEN: {
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    border: 'border-blue-200',
    dot: 'bg-blue-400'
  },
  VISITED: {
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    dot: 'bg-amber-400'
  },
  COMPLETE: {
    bg: 'bg-green-50',
    text: 'text-green-800',
    border: 'border-green-200',
    dot: 'bg-green-500'
  },
  NEEDS_QUOTE: {
    bg: 'bg-orange-50',
    text: 'text-orange-800',
    border: 'border-orange-200',
    dot: 'bg-orange-400'
  },
  ON_HOLD: {
    bg: 'bg-purple-50',
    text: 'text-purple-800',
    border: 'border-purple-200',
    dot: 'bg-purple-400'
  },
  CANCELLED: {
    bg: 'bg-red-50',
    text: 'text-red-800',
    border: 'border-red-200',
    dot: 'bg-red-400'
  }
}


// Design System - Service Type Colors
const serviceTypeConfig = {
  BATTERY_INSPECTION: {
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    border: 'border-blue-200'
  },
  CHARGER_INSPECTION: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-800',
    border: 'border-indigo-200'
  },
  BATTERY_CHARGER_INSPECTION: {
    bg: 'bg-purple-50',
    text: 'text-purple-800',
    border: 'border-purple-200'
  },
  SUPPLY_FIT_BATTERY: {
    bg: 'bg-green-50',
    text: 'text-green-800',
    border: 'border-green-200'
  },
  SUPPLY_DELIVER_CHARGER: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200'
  },
  SUPPLY_FIT_CELLS: {
    bg: 'bg-teal-50',
    text: 'text-teal-800',
    border: 'border-teal-200'
  },
  CHARGER_RENTAL: {
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200'
  },
  BATTERY_WATER_TOPPING: {
    bg: 'bg-cyan-50',
    text: 'text-cyan-800',
    border: 'border-cyan-200'
  },
  BATTERY_REPAIR: {
    bg: 'bg-red-50',
    text: 'text-red-800',
    border: 'border-red-200'
  },
  BATTERY_RENTAL: {
    bg: 'bg-orange-50',
    text: 'text-orange-800',
    border: 'border-orange-200'
  },
  CHARGER_REPAIR: {
    bg: 'bg-rose-50',
    text: 'text-rose-800',
    border: 'border-rose-200'
  },
  PARTS_ORDERED: {
    bg: 'bg-violet-50',
    text: 'text-violet-800',
    border: 'border-violet-200'
  },
  SITE_SURVEY: {
    bg: 'bg-slate-50',
    text: 'text-slate-800',
    border: 'border-slate-200'
  },
  DELIVERY: {
    bg: 'bg-lime-50',
    text: 'text-lime-800',
    border: 'border-lime-200'
  },
  COLLECTION: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-800',
    border: 'border-yellow-200'
  },
  OTHER: {
    bg: 'bg-gray-50',
    text: 'text-gray-800',
    border: 'border-gray-200'
  }
}

// Badge Component
const Badge = ({ 
  children, 
  size = 'sm',
  className = ''
}: {
  children: React.ReactNode
  size?: 'sm' | 'md'
  className?: string
}) => {
  const baseClasses = 'inline-flex items-center font-medium rounded-full border'
  const sizeClasses = size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm'
  
  return (
    <span className={`${baseClasses} ${sizeClasses} ${className}`}>
      {children}
    </span>
  )
}

// Status Badge Component
const StatusBadge = ({ status }: { status: JobStatus }) => {
  const config = statusConfig[status]
  return (
    <Badge 
      className={`${config.bg} ${config.text} ${config.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} mr-1.5`} />
      {status.replace('_', ' ')}
    </Badge>
  )
}


// Service Type Badge Component
const ServiceTypeBadge = ({ serviceType }: { serviceType: ServiceType }) => {
  const config = serviceTypeConfig[serviceType]
  
  // Convert enum values to readable format
  const getDisplayName = (type: ServiceType) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
      .replace(/\//g, '/')
  }
  
  return (
    <Badge 
      className={`${config.bg} ${config.text} ${config.border}`}
    >
      {getDisplayName(serviceType)}
    </Badge>
  )
}

// Sortable Header Component
const SortableHeader = ({ 
  children, 
  sortKey, 
  currentSort, 
  currentOrder, 
  onSort 
}: {
  children: React.ReactNode
  sortKey: string
  currentSort: string
  currentOrder: 'asc' | 'desc'
  onSort: (key: string) => void
}) => {
  const isActive = currentSort === sortKey
  const getSortIcon = () => {
    if (!isActive) return <ChevronUpDownIcon className="w-4 h-4 text-gray-400" />
    return currentOrder === 'asc' 
      ? <ChevronUpIcon className="w-4 h-4 text-gray-600" />
      : <ChevronDownIcon className="w-4 h-4 text-gray-600" />
  }

  return (
    <th
      scope="col"
      className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50 group transition-colors duration-150"
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        <span className={`transition-colors duration-150 ${isActive ? 'text-gray-600' : 'text-gray-400 group-hover:text-gray-500'}`}>
          {getSortIcon()}
        </span>
      </div>
    </th>
  )
}

// Filter Button Component
const FilterButton = ({ 
  label, 
  count, 
  isActive, 
  onClick,
  status
}: {
  label: string
  count: number
  isActive: boolean
  onClick: () => void
  status?: JobStatus | 'ALL'
}) => {
  // Get status-specific colors
  const getStatusColors = (status: JobStatus | 'ALL') => {
    if (status === 'ALL') {
      return {
        active: 'bg-green-600 text-white border border-green-600 shadow-sm',
        inactive: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400',
        countActive: 'bg-green-500 text-white',
        countInactive: 'bg-gray-100 text-gray-600'
      }
    }
    
    return {
      active: 'bg-green-600 text-white border border-green-600 shadow-sm',
      inactive: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400',
      countActive: 'bg-green-500 text-white',
      countInactive: 'bg-gray-100 text-gray-600'
    }
  }

  const colors = getStatusColors(status || 'ALL')

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-200 ${
        isActive
          ? `${colors.active} shadow-sm`
          : colors.inactive
      }`}
    >
      <span className="whitespace-nowrap">{label}</span>
      <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs w-8 text-center flex-shrink-0 ${
        isActive 
          ? colors.countActive
          : colors.countInactive
      }`}>
        {count}
      </span>
    </button>
  )
}

// Service Type Filter Button Component
const ServiceTypeFilterButton = ({
  // label,
  count,
  isActive,
  onClick,
  serviceType
}: {
  // label: string
  count: number
  isActive: boolean
  onClick: () => void
  serviceType?: ServiceType | 'ALL'
}) => {
  // Get service type specific colors
  const getServiceTypeColors = () => {
    if (serviceType === 'ALL') {
      return {
        active: 'bg-green-600 text-white border border-green-600 shadow-sm',
        inactive: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400',
        countActive: 'bg-green-500 text-white',
        countInactive: 'bg-gray-100 text-gray-600'
      }
    }
    
    return {
      active: 'bg-green-600 text-white border border-green-600 shadow-sm',
      inactive: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400',
      countActive: 'bg-green-500 text-white',
      countInactive: 'bg-gray-100 text-gray-600'
    }
  }

  const colors = getServiceTypeColors()

  // Convert enum values to readable format
  const getDisplayName = (type: ServiceType | 'ALL') => {
    if (type === 'ALL') return 'All Types'
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
      .replace(/\//g, '/')
  }

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-200 ${
        isActive
          ? `${colors.active} shadow-sm`
          : colors.inactive
      }`}
    >
      <span className="whitespace-nowrap">{getDisplayName(serviceType || 'ALL')}</span>
      <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs w-8 text-center flex-shrink-0 ${
        isActive 
          ? colors.countActive
          : colors.countInactive
      }`}>
        {count}
      </span>
    </button>
  )
}

// Pagination Component
const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
  onItemsPerPageChange
}: {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  totalItems: number
  itemsPerPage: number
  onItemsPerPageChange: (itemsPerPage: number) => void
}) => {
  const getVisiblePages = () => {
    const delta = 2
    const range = []
    const rangeWithDots = []

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i)
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...')
    } else {
      rangeWithDots.push(1)
    }

    rangeWithDots.push(...range)

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages)
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages)
    }

    return rangeWithDots
  }

  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  return (
    <div className="bg-white border-t border-gray-200 px-4 py-4 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Results Info and Items Per Page */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="items-per-page" className="text-sm font-medium text-gray-700 whitespace-nowrap">
              Show
            </label>
            <div className="relative">
              <select
                id="items-per-page"
                value={itemsPerPage}
                onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm font-medium text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 hover:border-gray-400 transition-colors duration-200"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <ChevronDownIcon className="h-4 w-4 text-gray-400" />
              </div>
            </div>
            <span className="text-sm text-gray-700 whitespace-nowrap">per page</span>
          </div>
          
          <div className="text-sm text-gray-700">
            <span className="font-medium text-gray-900">{startItem.toLocaleString()}</span>
            <span className="text-gray-500"> to </span>
            <span className="font-medium text-gray-900">{endItem.toLocaleString()}</span>
            <span className="text-gray-500"> of </span>
            <span className="font-medium text-gray-900">{totalItems.toLocaleString()}</span>
            <span className="text-gray-500"> results</span>
          </div>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center sm:justify-end">
            <nav className="flex items-center space-x-1" aria-label="Pagination">
              {/* Previous Button */}
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                aria-label="Previous page"
              >
                <ChevronLeftIcon className="h-4 w-4" />
                <span className="sr-only">Previous</span>
              </button>

              {/* Page Numbers */}
              <div className="flex items-center space-x-1">
                {getVisiblePages().map((page, index) => (
                  <button
                    key={index}
                    onClick={() => typeof page === 'number' && onPageChange(page)}
                    disabled={page === '...'}
                    className={`relative inline-flex items-center px-3 py-2 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                      page === currentPage
                        ? 'z-10 bg-green-600 text-white border border-green-600 shadow-sm'
                        : page === '...'
                        ? 'text-gray-400 cursor-default px-2'
                        : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-900'
                    } rounded-lg`}
                    aria-label={page === '...' ? 'More pages' : `Go to page ${page}`}
                    aria-current={page === currentPage ? 'page' : undefined}
                  >
                    {page}
                  </button>
                ))}
              </div>

              {/* Next Button */}
              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                aria-label="Next page"
              >
                <ChevronRightIcon className="h-4 w-4" />
                <span className="sr-only">Next</span>
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  )
}

function JobsPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  
  // Initialize filters from localStorage
  const [filters, setFilters] = useState<JobFilters>(() => getJobFilters())
  const [searchTerm, setSearchTerm] = useState(filters.searchTerm)
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'ALL'>(filters.statusFilter as JobStatus | 'ALL')
  const [serviceTypeFilter, setServiceTypeFilter] = useState<ServiceType | 'ALL'>(filters.serviceTypeFilter as ServiceType | 'ALL')
  const [sortBy, setSortBy] = useState(filters.sortBy)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(filters.sortOrder)
  const [currentPage, setCurrentPage] = useState(filters.currentPage)
  const [itemsPerPage, setItemsPerPage] = useState(filters.itemsPerPage)
  const [totalJobs, setTotalJobs] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [initialized, setInitialized] = useState(false)
  const [statusCounts, setStatusCounts] = useState({
    ALL: 0,
    OPEN: 0,
    VISITED: 0,
    COMPLETE: 0,
    NEEDS_QUOTE: 0,
    ON_HOLD: 0,
    CANCELLED: 0
  })
  const [serviceTypeCounts, setServiceTypeCounts] = useState<Record<ServiceType | 'ALL', number>>({
    ALL: 0,
    BATTERY_INSPECTION: 0,
    CHARGER_INSPECTION: 0,
    BATTERY_CHARGER_INSPECTION: 0,
    SUPPLY_FIT_BATTERY: 0,
    SUPPLY_DELIVER_CHARGER: 0,
    SUPPLY_FIT_CELLS: 0,
    CHARGER_RENTAL: 0,
    BATTERY_WATER_TOPPING: 0,
    BATTERY_REPAIR: 0,
    BATTERY_RENTAL: 0,
    CHARGER_REPAIR: 0,
    PARTS_ORDERED: 0,
    SITE_SURVEY: 0,
    DELIVERY: 0,
    COLLECTION: 0,
    OTHER: 0
  })
  const [cloningJobId, setCloningJobId] = useState<string | null>(null)
  const [technicianFilter, setTechnicianFilter] = useState<string>(filters.technicianFilter)
  const [technicians, setTechnicians] = useState<User[]>([])
  const [filtersExpanded, setFiltersExpanded] = useState(filters.filtersExpanded)

  // Function to save current filters to localStorage
  const saveCurrentFilters = useCallback(() => {
    const currentFilters: JobFilters = {
      statusFilter,
      serviceTypeFilter,
      technicianFilter,
      searchTerm,
      sortBy,
      sortOrder,
      currentPage,
      itemsPerPage,
      filtersExpanded
    }
    saveJobFilters(currentFilters)
    setFilters(currentFilters)
  }, [statusFilter, serviceTypeFilter, technicianFilter, searchTerm, sortBy, sortOrder, currentPage, itemsPerPage, filtersExpanded])

  // Function to build current jobs URL with filters
  const getCurrentJobsUrl = () => {
    const currentFilters: JobFilters = {
      statusFilter,
      serviceTypeFilter,
      technicianFilter,
      searchTerm,
      sortBy,
      sortOrder,
      currentPage,
      itemsPerPage,
      filtersExpanded
    }
    return buildJobsUrl(currentFilters)
  }

  const getFilterDescription = () => {
    const activeFilters = []
    
    if (statusFilter !== 'ALL') {
      activeFilters.push(statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1).toLowerCase())
    }
    if (serviceTypeFilter !== 'ALL') {
      const formattedType = serviceTypeFilter.replace(/_/g, ' ').toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
      activeFilters.push(formattedType)
    }
    if (technicianFilter !== 'ALL') {
      activeFilters.push(`Technician: ${technicianFilter}`)
    }
    if (searchTerm) {
      activeFilters.push(`"${searchTerm}"`)
    }
    
    if (activeFilters.length === 0) return null
    
    return activeFilters.join(' • ')
  }

  // Function to build URL with current filter state
  const buildJobUrl = (jobId: string) => {
    const currentUrl = getCurrentJobsUrl()
    return `/jobs/${jobId}?return=${encodeURIComponent(currentUrl)}`
  }

  // Get return URL from query params
  // const returnUrl = searchParams.get('return') || '/jobs'

  // Initialize filters from URL parameters and fetch data
  useEffect(() => {
    if (initialized) return // Only run once on initial load
    
    const statusParam = searchParams.get('status')
    const serviceTypeParam = searchParams.get('serviceType')
    const searchParam = searchParams.get('search')
    
    // Set initial filter state from URL parameters
    if (statusParam && ['OPEN', 'VISITED', 'COMPLETE', 'NEEDS_QUOTE', 'ON_HOLD', 'CANCELLED'].includes(statusParam)) {
      setStatusFilter(statusParam as JobStatus)
    }
    
    if (serviceTypeParam && Object.keys(serviceTypeConfig).includes(serviceTypeParam)) {
      setServiceTypeFilter(serviceTypeParam as ServiceType)
    }
    
    if (searchParam) {
      setSearchTerm(searchParam)
    }
    
    setInitialized(true)
  }, [searchParams, initialized])

  const fetchJobs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        sortBy,
        sortOrder,
      })

      if (statusFilter !== 'ALL') {
        params.append('status', statusFilter)
      }

      if (serviceTypeFilter !== 'ALL') {
        params.append('serviceType', serviceTypeFilter)
      }

      if (technicianFilter !== 'ALL') {
        params.append('assignedToId', technicianFilter)
      }

      if (searchTerm) {
        params.append('search', searchTerm)
      }

      // Build counts params
      const countsParams = new URLSearchParams()
      if (searchTerm) {
        countsParams.append('search', searchTerm)
      }
      if (serviceTypeFilter !== 'ALL') {
        countsParams.append('serviceType', serviceTypeFilter)
      }

      // Fetch jobs and counts in parallel
      const [jobsResponse, countsResponse] = await Promise.all([
        fetch(`/api/jobs?${params}`),
        fetch(`/api/jobs/counts?${countsParams.toString()}`)
      ])

      if (!jobsResponse.ok) {
        throw new Error('Failed to fetch jobs')
      }
      
      if (!countsResponse.ok) {
        throw new Error('Failed to fetch job counts')
      }

      const [jobsData, countsData] = await Promise.all([
        jobsResponse.json(),
        countsResponse.json()
      ])

      setJobs(jobsData.jobs)
      setTotalJobs(jobsData.pagination.total)
      setTotalPages(jobsData.pagination.totalPages)
      setStatusCounts(countsData)
    } catch (error) {
      console.error('Error fetching jobs:', error)
    } finally {
      setLoading(false)
    }
  }, [currentPage, itemsPerPage, sortBy, sortOrder, statusFilter, serviceTypeFilter, technicianFilter, searchTerm])

  const fetchServiceTypeCounts = useCallback(async () => {
    try {
      const countsParams = new URLSearchParams()
      if (searchTerm) {
        countsParams.append('search', searchTerm)
      }
      if (statusFilter !== 'ALL') {
        countsParams.append('status', statusFilter)
      }

      const response = await fetch(`/api/jobs/service-type-counts?${countsParams.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setServiceTypeCounts(data)
      }
    } catch (error) {
      console.error('Error fetching service type counts:', error)
    }
  }, [searchTerm, statusFilter])

  const fetchTechnicians = async () => {
    try {
      const response = await fetch('/api/technicians')
      if (response.ok) {
        const data = await response.json()
        setTechnicians(data)
      }
    } catch (error) {
      console.error('Error fetching technicians:', error)
    }
  }

  // Save filters to localStorage whenever they change
  useEffect(() => {
    if (initialized) {
      saveCurrentFilters()
    }
  }, [initialized, saveCurrentFilters])

  // Main effect to fetch jobs when filters, sorting, or pagination change
  useEffect(() => {
    if (!initialized) return // Wait for initialization to complete
    fetchJobs()
    fetchTechnicians()
  }, [initialized, fetchJobs])

  // Listen for job updates to refresh jobs list
  useEffect(() => {
    const handleJobUpdate = (event: CustomEvent) => {
      console.log('📋 Jobs page: Job update received, refreshing jobs list...', event.detail)
      // Refresh jobs list when job updates occur
      fetchJobs()
    }

    window.addEventListener('jobDataUpdated', handleJobUpdate as EventListener)
    
    return () => {
      window.removeEventListener('jobDataUpdated', handleJobUpdate as EventListener)
    }
  }, [fetchJobs])

  // Effect to fetch service type counts when search or status filter changes
  useEffect(() => {
    if (!initialized) return // Wait for initialization to complete
    fetchServiceTypeCounts()
  }, [initialized, fetchServiceTypeCounts])

  // Debounced search effect - only reset page, don't fetch jobs here
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1) // Reset to first page when searching
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  // Reset to first page when filters change (except search which is handled above)
  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, serviceTypeFilter, sortBy, sortOrder])

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('desc')
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1) // Reset to first page when changing page size
  }

  const handleCloneJob = async (jobId: string) => {
    setCloningJobId(jobId)
    try {
      const response = await fetch(`/api/jobs/${jobId}/clone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) throw new Error('Failed to clone job')
      
      const clonedJob = await response.json()
      
      // Navigate to the new cloned job
      router.push(`/jobs/${clonedJob.id}?return=${encodeURIComponent(getCurrentJobsUrl())}`)
    } catch (error) {
      console.error('Error cloning job:', error)
      alert('Failed to clone job. Please try again.')
    } finally {
      setCloningJobId(null)
    }
  }


  return (
    <div className="min-h-screen bg-gray-50">
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Job Management</h2>
          <p className="mt-1 text-sm text-gray-600">
            Manage and track all battery service jobs across your operations.
          </p>
        </div>

        {/* Search and Filters Card */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 mb-6">
          <div className="p-6">
            {/* Search Bar */}
            <div className="mb-6">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Search Jobs
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="search"
                  placeholder="Search by job number, customer, or service provider..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setSearchTerm('')
                    }
                  }}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors duration-150"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
            </div>

            {/* Filters Toggle */}
            <button
              onClick={() => setFiltersExpanded(!filtersExpanded)}
              className="w-full flex items-center justify-between mb-4 p-2 -m-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center">
                <FunnelIcon className="h-4 w-4 text-gray-500 mr-2" />
                <span className="text-sm font-medium text-gray-700">Filters</span>
                {getFilterDescription() && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 max-w-xs truncate">
                    {getFilterDescription()}
                  </span>
                )}
              </div>
              <div className="flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors">
                <span className="mr-1">{filtersExpanded ? 'Hide' : 'Show'} filters</span>
                {filtersExpanded ? (
                  <ChevronUpIcon className="h-4 w-4" />
                ) : (
                  <ChevronDownIcon className="h-4 w-4" />
                )}
              </div>
            </button>

            {/* Collapsible Filters */}
            {filtersExpanded && (
              <div className="space-y-6 border-t border-gray-200 pt-6">
                {/* Status Filters */}
                <div>
                  <div className="flex items-center mb-3">
                    <label className="text-sm font-medium text-gray-700">
                      Filter by Status
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(statusCounts).map(([status, count]) => (
                      <FilterButton
                        key={status}
                        label={status === 'ALL' ? 'All Jobs' : status.replace('_', ' ')}
                        count={count}
                        isActive={statusFilter === status}
                        onClick={() => setStatusFilter(status as JobStatus | 'ALL')}
                        status={status as JobStatus | 'ALL'}
                      />
                    ))}
                  </div>
                </div>

                {/* Service Type Filters */}
                <div>
                  <div className="flex items-center mb-3">
                    <label className="text-sm font-medium text-gray-700">
                      Filter by Service Type
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(serviceTypeCounts).map(([serviceType, count]) => (
                      <ServiceTypeFilterButton
                        key={serviceType}
                        count={count}
                        isActive={serviceTypeFilter === serviceType}
                        onClick={() => setServiceTypeFilter(serviceType as ServiceType | 'ALL')}
                        serviceType={serviceType as ServiceType | 'ALL'}
                      />
                    ))}
                  </div>
                </div>

                {/* Technician Filter */}
                <div>
                  <div className="flex items-center mb-3">
                    <label className="text-sm font-medium text-gray-700">
                      Filter by Technician
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setTechnicianFilter('ALL')}
                      className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-colors ${
                        technicianFilter === 'ALL'
                          ? 'bg-blue-100 text-blue-800 border-blue-200'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      All Technicians
                    </button>
                    {technicians.map((technician) => (
                      <button
                        key={technician.id}
                        onClick={() => setTechnicianFilter(technician.id)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-colors ${
                          technicianFilter === technician.id
                            ? 'bg-blue-100 text-blue-800 border-blue-200'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {technician.name || technician.email}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Jobs Table Card */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <h3 className="text-lg font-medium text-gray-900">
                  Jobs ({totalJobs.toLocaleString()})
                </h3>
                {(statusFilter !== 'ALL' || serviceTypeFilter !== 'ALL' || searchTerm) && (
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Filtered
                    </span>
                    {(statusFilter !== 'ALL' || serviceTypeFilter !== 'ALL' || searchTerm) && (
                      <button
                        onClick={() => {
                          setStatusFilter('ALL')
                          setServiceTypeFilter('ALL')
                          setSearchTerm('')
                          setCurrentPage(1)
                        }}
                        className="text-xs text-gray-500 hover:text-gray-700 underline"
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <Link
                  href={`/jobs/new?return=${encodeURIComponent(getCurrentJobsUrl())}`}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-150"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Create New Job
                </Link>
              </div>
            </div>
          </div>

          <div className="overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
                  <p className="text-sm text-gray-600">Loading jobs...</p>
                </div>
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">No jobs found</h3>
                <p className="text-sm text-gray-500">
                  {searchTerm || statusFilter !== 'ALL' 
                    ? 'Try adjusting your search or filter criteria.'
                    : 'No jobs have been created yet.'
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <SortableHeader
                        sortKey="jobNumber"
                        currentSort={sortBy}
                        currentOrder={sortOrder}
                        onSort={handleSort}
                      >
                        NUMBER
                      </SortableHeader>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <SortableHeader
                        sortKey="assignedToId"
                        currentSort={sortBy}
                        currentOrder={sortOrder}
                        onSort={handleSort}
                      >
                        Technician
                      </SortableHeader>
                      <SortableHeader
                        sortKey="status"
                        currentSort={sortBy}
                        currentOrder={sortOrder}
                        onSort={handleSort}
                      >
                        Status
                      </SortableHeader>
                      <SortableHeader
                        sortKey="serviceType"
                        currentSort={sortBy}
                        currentOrder={sortOrder}
                        onSort={handleSort}
                      >
                        Service Type
                      </SortableHeader>
                      <SortableHeader
                        sortKey="dueDate"
                        currentSort={sortBy}
                        currentOrder={sortOrder}
                        onSort={handleSort}
                      >
                        DATE
                      </SortableHeader>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {jobs.map((job) => (
                      <tr 
                        key={job.id} 
                        className="hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                        onClick={() => router.push(buildJobUrl(job.id))}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-mono font-medium text-gray-900">
                            {job.jobNumber}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {job.customer.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {job.serviceProvider ? (
                              <span className="inline-flex items-center">
                                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-1.5"></span>
                                Referred by {job.serviceProvider.name}
                              </span>
                            ) : (
                              <span className="inline-flex items-center">
                                <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1.5"></span>
                                Direct Customer
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {job.location?.name || '—'}
                          </div>
                          {job.location?.city && (
                            <div className="text-sm text-gray-500">
                              {job.location.city}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {job.assignedTo ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {job.assignedTo.name || job.assignedTo.email}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-sm">Unassigned</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={job.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <ServiceTypeBadge serviceType={job.serviceType} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {job.dueDate ? (
                            <div>
                              <div className="font-medium">
                                {format(new Date(job.dueDate), 'MMM d, yyyy')}
                              </div>
                              <div className="text-xs text-gray-400">
                                {format(new Date(job.dueDate), 'EEEE')}
                              </div>
                            </div>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                          <div className="flex flex-col items-center space-y-1">
                            <Link
                              href={`${buildJobUrl(job.id)}&edit=true`}
                              className="inline-flex items-center justify-center w-16 px-2.5 py-1.5 border border-transparent shadow-sm text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-150"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <PencilIcon className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                              Edit
                            </Link>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleCloneJob(job.id)
                              }}
                              disabled={cloningJobId === job.id}
                              className="inline-flex items-center justify-center w-16 px-2.5 py-1.5 border border-transparent shadow-sm text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150 disabled:opacity-50"
                            >
                              <DocumentDuplicateIcon className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                              {cloningJobId === job.id ? 'Cloning...' : 'Clone'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          {/* Pagination */}
          {!loading && jobs.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              totalItems={totalJobs}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={handleItemsPerPageChange}
            />
          )}
        </div>
      </main>
    </div>
  )
}

export default function JobsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <JobsPageContent />
    </Suspense>
  )
}
