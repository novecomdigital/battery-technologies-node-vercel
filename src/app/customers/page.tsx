'use client'

import { useState, useEffect, Suspense, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
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
  BuildingOfficeIcon,
  UserGroupIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline'
import { getCustomerFilters, saveCustomerFilters, buildCustomersUrl, CustomerFilters } from '@/lib/customer-filters'

// Define types locally to avoid import issues
type CustomerStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
type CustomerType = 'DIRECT' | 'REFERRED'

interface Customer {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  zipCode: string | null
  country: string | null
  status: CustomerStatus
  customerType: CustomerType
  referralNotes: string | null
  createdAt: Date
  updatedAt: Date
  serviceProvider: {
    id: string
    name: string
  } | null
  _count: {
    jobs: number
    locations: number
    contacts: number
  }
}


// Design System - Status Colors
const statusConfig = {
  ACTIVE: {
    bg: 'bg-green-50',
    text: 'text-green-800',
    border: 'border-green-200',
    dot: 'bg-green-400'
  },
  INACTIVE: {
    bg: 'bg-gray-50',
    text: 'text-gray-800',
    border: 'border-gray-200',
    dot: 'bg-gray-400'
  },
  SUSPENDED: {
    bg: 'bg-red-50',
    text: 'text-red-800',
    border: 'border-red-200',
    dot: 'bg-red-400'
  }
}

// Design System - Customer Type Colors
const customerTypeConfig = {
  DIRECT: {
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    border: 'border-blue-200'
  },
  REFERRED: {
    bg: 'bg-purple-50',
    text: 'text-purple-800',
    border: 'border-purple-200'
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
const StatusBadge = ({ status }: { status: CustomerStatus }) => {
  const config = statusConfig[status]
  return (
    <Badge 
      className={`${config.bg} ${config.text} ${config.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} mr-1.5`} />
      {status}
    </Badge>
  )
}

// Customer Type Badge Component
const CustomerTypeBadge = ({ customerType }: { customerType: CustomerType }) => {
  const config = customerTypeConfig[customerType]
  
  return (
    <Badge 
      className={`${config.bg} ${config.text} ${config.border}`}
    >
      {customerType === 'DIRECT' ? 'Direct' : 'Referred'}
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
  status?: CustomerStatus | 'ALL'
}) => {
  const getStatusColors = (status: CustomerStatus | 'ALL') => {
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

// Customer Type Filter Button Component
const CustomerTypeFilterButton = ({
  label,
  count,
  isActive,
  onClick,
  customerType
}: {
  label: string
  count: number
  isActive: boolean
  onClick: () => void
  customerType?: CustomerType | 'ALL'
}) => {
  const getCustomerTypeColors = (customerType: CustomerType | 'ALL') => {
    if (customerType === 'ALL') {
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

  const colors = getCustomerTypeColors(customerType || 'ALL')

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

function CustomersPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  
  // Initialize filters from localStorage
  const [filters, setFilters] = useState<CustomerFilters>(() => getCustomerFilters())
  const [searchTerm, setSearchTerm] = useState(filters.searchTerm)
  const [statusFilter, setStatusFilter] = useState<CustomerStatus | 'ALL'>(filters.statusFilter as CustomerStatus | 'ALL')
  const [customerTypeFilter, setCustomerTypeFilter] = useState<CustomerType | 'ALL'>(filters.customerTypeFilter as CustomerType | 'ALL')
  const [sortBy, setSortBy] = useState(filters.sortBy)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(filters.sortOrder)
  const [currentPage, setCurrentPage] = useState(filters.currentPage)
  const [itemsPerPage, setItemsPerPage] = useState(filters.itemsPerPage)
  const [totalCustomers, setTotalCustomers] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [initialized, setInitialized] = useState(false)
  const [filtersExpanded, setFiltersExpanded] = useState(filters.filtersExpanded)
  
  const [statusCounts, setStatusCounts] = useState({
    ALL: 0,
    ACTIVE: 0,
    INACTIVE: 0,
    SUSPENDED: 0
  })
  
  const [customerTypeCounts, setCustomerTypeCounts] = useState<Record<CustomerType | 'ALL', number>>({
    ALL: 0,
    DIRECT: 0,
    REFERRED: 0
  })

  // Function to save current filters to localStorage
  const saveCurrentFilters = useCallback(() => {
    const currentFilters: CustomerFilters = {
      statusFilter,
      customerTypeFilter,
      searchTerm,
      sortBy,
      sortOrder,
      currentPage,
      itemsPerPage,
      filtersExpanded
    }
    saveCustomerFilters(currentFilters)
    setFilters(currentFilters)
  }, [statusFilter, customerTypeFilter, searchTerm, sortBy, sortOrder, currentPage, itemsPerPage, filtersExpanded])

  // Function to build current customers URL with filters
  const getCurrentCustomersUrl = () => {
    const currentFilters: CustomerFilters = {
      statusFilter,
      customerTypeFilter,
      searchTerm,
      sortBy,
      sortOrder,
      currentPage,
      itemsPerPage,
      filtersExpanded
    }
    return buildCustomersUrl(currentFilters)
  }

  const getFilterDescription = () => {
    const activeFilters = []
    
    if (statusFilter !== 'ALL') {
      activeFilters.push(statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1).toLowerCase())
    }
    if (customerTypeFilter !== 'ALL') {
      const formattedType = customerTypeFilter.replace(/_/g, ' ').toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
      activeFilters.push(formattedType)
    }
    if (searchTerm) {
      activeFilters.push(`"${searchTerm}"`)
    }
    
    if (activeFilters.length === 0) return null
    
    return activeFilters.join(' • ')
  }

  // Initialize filters from URL parameters
  useEffect(() => {
    if (initialized) return
    
    const statusParam = searchParams.get('status')
    const customerTypeParam = searchParams.get('customerType')
    const searchParam = searchParams.get('search')
    
    if (statusParam && ['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(statusParam)) {
      setStatusFilter(statusParam as CustomerStatus)
    }
    
    if (customerTypeParam && ['DIRECT', 'REFERRED'].includes(customerTypeParam)) {
      setCustomerTypeFilter(customerTypeParam as CustomerType)
    }
    
    if (searchParam) {
      setSearchTerm(searchParam)
    }
    
    setInitialized(true)
  }, [searchParams, initialized])

  const fetchCustomers = useCallback(async () => {
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

      if (customerTypeFilter !== 'ALL') {
        params.append('customerType', customerTypeFilter)
      }

      if (searchTerm) {
        params.append('search', searchTerm)
      }

      // Build counts params
      const countsParams = new URLSearchParams()
      if (searchTerm) {
        countsParams.append('search', searchTerm)
      }
      if (customerTypeFilter !== 'ALL') {
        countsParams.append('customerType', customerTypeFilter)
      }

      // Fetch customers and counts in parallel
      const [customersResponse, countsResponse] = await Promise.all([
        fetch(`/api/customers?${params}`),
        fetch(`/api/customers/counts?${countsParams.toString()}`)
      ])

      if (!customersResponse.ok) {
        throw new Error('Failed to fetch customers')
      }
      
      if (!countsResponse.ok) {
        throw new Error('Failed to fetch customer counts')
      }

      const [customersData, countsData] = await Promise.all([
        customersResponse.json(),
        countsResponse.json()
      ])

      setCustomers(customersData.customers)
      setTotalCustomers(customersData.pagination.total)
      setTotalPages(customersData.pagination.totalPages)
      setStatusCounts(countsData)
    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setLoading(false)
    }
  }, [currentPage, itemsPerPage, sortBy, sortOrder, statusFilter, customerTypeFilter, searchTerm])

  const fetchCustomerTypeCounts = useCallback(async () => {
    try {
      const countsParams = new URLSearchParams()
      if (searchTerm) {
        countsParams.append('search', searchTerm)
      }
      if (statusFilter !== 'ALL') {
        countsParams.append('status', statusFilter)
      }

      const response = await fetch(`/api/customers/customer-type-counts?${countsParams.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setCustomerTypeCounts(data)
      }
    } catch (error) {
      console.error('Error fetching customer type counts:', error)
    }
  }, [searchTerm, statusFilter])

  // Save filters to localStorage whenever they change
  useEffect(() => {
    if (initialized) {
      saveCurrentFilters()
    }
  }, [initialized, saveCurrentFilters])

  // Main effect to fetch customers when filters, sorting, or pagination change
  useEffect(() => {
    if (!initialized) return
    fetchCustomers()
  }, [initialized, fetchCustomers])

  // Effect to fetch customer type counts when search or status filter changes
  useEffect(() => {
    if (!initialized) return
    fetchCustomerTypeCounts()
  }, [initialized, fetchCustomerTypeCounts])

  // Debounced search effect - only reset page, don't fetch customers here
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1) // Reset to first page when searching
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  // Reset to first page when filters change (except search which is handled above)
  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, customerTypeFilter, sortBy, sortOrder])

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage)
    setCurrentPage(1) // Reset to first page when changing page size
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Customer Management</h2>
          <p className="mt-1 text-sm text-gray-600">
            Manage and track all customers and their service relationships.
          </p>
        </div>

        {/* Search and Filters Card */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 mb-6">
          <div className="p-6">
            {/* Search Bar */}
            <div className="mb-6">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Search Customers
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="search"
                  placeholder="Search by customer name, email, or company..."
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
                        label={status === 'ALL' ? 'All Customers' : status}
                        count={count}
                        isActive={statusFilter === status}
                        onClick={() => setStatusFilter(status as CustomerStatus | 'ALL')}
                        status={status as CustomerStatus | 'ALL'}
                      />
                    ))}
                  </div>
                </div>

                {/* Customer Type Filters */}
                <div>
                  <div className="flex items-center mb-3">
                    <label className="text-sm font-medium text-gray-700">
                      Filter by Customer Type
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(customerTypeCounts).map(([customerType, count]) => (
                      <CustomerTypeFilterButton
                        key={customerType}
                        label={customerType === 'ALL' ? 'All Types' : customerType}
                        count={count}
                        isActive={customerTypeFilter === customerType}
                        onClick={() => setCustomerTypeFilter(customerType as CustomerType | 'ALL')}
                        customerType={customerType as CustomerType | 'ALL'}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Customers Table Card */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <h3 className="text-lg font-medium text-gray-900">
                  Customers ({totalCustomers.toLocaleString()})
                </h3>
                {(statusFilter !== 'ALL' || customerTypeFilter !== 'ALL' || searchTerm) && (
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Filtered
                    </span>
                    {(statusFilter !== 'ALL' || customerTypeFilter !== 'ALL' || searchTerm) && (
                      <button
                        onClick={() => {
                          setStatusFilter('ALL')
                          setCustomerTypeFilter('ALL')
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
                  href="/customers/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-150"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Add Customer
                </Link>
              </div>
            </div>
          </div>

          <div className="overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
                  <p className="text-sm text-gray-600">Loading customers...</p>
                </div>
              </div>
            ) : customers.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                  <UserGroupIcon className="h-12 w-12" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">No customers found</h3>
                <p className="text-sm text-gray-500">
                  {searchTerm || statusFilter !== 'ALL' 
                    ? 'Try adjusting your search or filter criteria.'
                    : 'No customers have been added yet.'
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <SortableHeader
                        sortKey="name"
                        currentSort={sortBy}
                        currentOrder={sortOrder}
                        onSort={handleSort}
                      >
                        CUSTOMER
                      </SortableHeader>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <SortableHeader
                        sortKey="customerType"
                        currentSort={sortBy}
                        currentOrder={sortOrder}
                        onSort={handleSort}
                      >
                        TYPE
                      </SortableHeader>
                      <SortableHeader
                        sortKey="status"
                        currentSort={sortBy}
                        currentOrder={sortOrder}
                        onSort={handleSort}
                      >
                        STATUS
                      </SortableHeader>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        JOBS
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        LOCATIONS
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {customers.map((customer) => (
                      <tr 
                        key={customer.id} 
                        className="hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                        onClick={() => router.push(`/customers/${customer.id}?return=${encodeURIComponent(getCurrentCustomersUrl())}`)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center">
                                <span className="text-white text-sm font-medium">
                                  {customer.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {customer.name}
                              </div>
                              {customer.serviceProvider && (
                                <div className="text-sm text-gray-500">
                                  <span className="inline-flex items-center">
                                    <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mr-1.5"></span>
                                    Referred by {customer.serviceProvider.name}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {customer.email && (
                              <div className="flex items-center">
                                <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-1" />
                                {customer.email}
                              </div>
                            )}
                            {customer.phone && (
                              <div className="flex items-center mt-1">
                                <PhoneIcon className="h-4 w-4 text-gray-400 mr-1" />
                                {customer.phone}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {customer.city && customer.state ? (
                              <div className="flex items-center">
                                <MapPinIcon className="h-4 w-4 text-gray-400 mr-1" />
                                {customer.city}, {customer.state}
                              </div>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <CustomerTypeBadge customerType={customer.customerType} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={customer.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <BuildingOfficeIcon className="h-4 w-4 text-gray-400 mr-1" />
                            {customer._count.jobs}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <MapPinIcon className="h-4 w-4 text-gray-400 mr-1" />
                            {customer._count.locations}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                          <Link
                            href={`/customers/${customer.id}?return=${encodeURIComponent(getCurrentCustomersUrl())}`}
                            className="inline-flex items-center justify-center w-16 px-2.5 py-1.5 border border-transparent shadow-sm text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-150"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <PencilIcon className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          {/* Pagination */}
          {!loading && customers.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              totalItems={totalCustomers}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={handleItemsPerPageChange}
            />
          )}
        </div>
      </main>
    </div>
  )
}

export default function CustomersPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CustomersPageContent />
    </Suspense>
  )
}
