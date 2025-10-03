// Job filters localStorage management

export interface JobFilters {
  statusFilter: string
  serviceTypeFilter: string
  technicianFilter: string
  searchTerm: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
  currentPage: number
  itemsPerPage: number
  filtersExpanded: boolean
}

const STORAGE_KEY = 'job-filters'

const defaultFilters: JobFilters = {
  statusFilter: 'ALL',
  serviceTypeFilter: 'ALL',
  technicianFilter: 'ALL',
  searchTerm: '',
  sortBy: 'jobNumber',
  sortOrder: 'desc',
  currentPage: 1,
  itemsPerPage: 25,
  filtersExpanded: false
}

export const saveJobFilters = (filters: Partial<JobFilters>) => {
  if (typeof window === 'undefined') return
  
  try {
    const currentFilters = getJobFilters()
    const updatedFilters = { ...currentFilters, ...filters }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedFilters))
  } catch (error) {
    console.error('Error saving job filters:', error)
  }
}

export const getJobFilters = (): JobFilters => {
  if (typeof window === 'undefined') return defaultFilters
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return { ...defaultFilters, ...JSON.parse(stored) }
    }
  } catch (error) {
    console.error('Error loading job filters:', error)
  }
  
  return defaultFilters
}

export const clearJobFilters = () => {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Error clearing job filters:', error)
  }
}

export const resetFiltersForStatus = (status: string) => {
  if (typeof window === 'undefined') return
  
  try {
    const currentFilters = getJobFilters()
    const updatedFilters: JobFilters = {
      ...currentFilters,
      statusFilter: status,
      serviceTypeFilter: 'ALL', // Reset service type to show all types
      searchTerm: '', // Reset search
      currentPage: 1 // Reset to first page
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedFilters))
  } catch (error) {
    console.error('Error resetting filters for status:', error)
  }
}

export const buildJobsUrl = (filters: JobFilters): string => {
  const params = new URLSearchParams()
  
  if (filters.statusFilter !== 'ALL') {
    params.set('status', filters.statusFilter)
  }
  if (filters.serviceTypeFilter !== 'ALL') {
    params.set('serviceType', filters.serviceTypeFilter)
  }
  if (filters.technicianFilter !== 'ALL') {
    params.set('assignedToId', filters.technicianFilter)
  }
  if (filters.searchTerm.trim()) {
    params.set('search', filters.searchTerm.trim())
  }
  if (filters.sortBy !== 'jobNumber') {
    params.set('sortBy', filters.sortBy)
  }
  if (filters.sortOrder !== 'desc') {
    params.set('sortOrder', filters.sortOrder)
  }
  if (filters.currentPage !== 1) {
    params.set('page', filters.currentPage.toString())
  }
  if (filters.itemsPerPage !== 25) {
    params.set('limit', filters.itemsPerPage.toString())
  }
  
  const queryString = params.toString()
  return `/jobs${queryString ? `?${queryString}` : ''}`
}
