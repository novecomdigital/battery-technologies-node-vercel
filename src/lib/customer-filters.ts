// Customer filters localStorage management

export interface CustomerFilters {
  statusFilter: string
  customerTypeFilter: string
  searchTerm: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
  currentPage: number
  itemsPerPage: number
  filtersExpanded: boolean
}

const STORAGE_KEY = 'customer-filters'

const defaultFilters: CustomerFilters = {
  statusFilter: 'ALL',
  customerTypeFilter: 'ALL',
  searchTerm: '',
  sortBy: 'name',
  sortOrder: 'asc',
  currentPage: 1,
  itemsPerPage: 25,
  filtersExpanded: false
}

export const saveCustomerFilters = (filters: Partial<CustomerFilters>) => {
  if (typeof window === 'undefined') return
  
  try {
    const currentFilters = getCustomerFilters()
    const updatedFilters = { ...currentFilters, ...filters }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedFilters))
  } catch (error) {
    console.error('Error saving customer filters:', error)
  }
}

export const getCustomerFilters = (): CustomerFilters => {
  if (typeof window === 'undefined') return defaultFilters
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return { ...defaultFilters, ...JSON.parse(stored) }
    }
  } catch (error) {
    console.error('Error loading customer filters:', error)
  }
  
  return defaultFilters
}

export const clearCustomerFilters = () => {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Error clearing customer filters:', error)
  }
}

export const resetFiltersForStatus = (status: string) => {
  if (typeof window === 'undefined') return
  
  try {
    const currentFilters = getCustomerFilters()
    const updatedFilters: CustomerFilters = {
      ...currentFilters,
      statusFilter: status,
      customerTypeFilter: 'ALL', // Reset customer type to show all types
      searchTerm: '', // Reset search
      currentPage: 1 // Reset to first page
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedFilters))
  } catch (error) {
    console.error('Error resetting filters for status:', error)
  }
}

export const buildCustomersUrl = (filters: CustomerFilters): string => {
  const params = new URLSearchParams()
  
  if (filters.statusFilter !== 'ALL') {
    params.set('status', filters.statusFilter)
  }
  if (filters.customerTypeFilter !== 'ALL') {
    params.set('customerType', filters.customerTypeFilter)
  }
  if (filters.searchTerm.trim()) {
    params.set('search', filters.searchTerm.trim())
  }
  if (filters.sortBy !== 'name') {
    params.set('sortBy', filters.sortBy)
  }
  if (filters.sortOrder !== 'asc') {
    params.set('sortOrder', filters.sortOrder)
  }
  if (filters.currentPage !== 1) {
    params.set('page', filters.currentPage.toString())
  }
  if (filters.itemsPerPage !== 25) {
    params.set('limit', filters.itemsPerPage.toString())
  }
  
  const queryString = params.toString()
  return `/customers${queryString ? `?${queryString}` : ''}`
}
