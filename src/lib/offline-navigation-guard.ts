// Offline Navigation Guard
// This module restricts navigation to only cached pages when offline

export interface CachedPage {
  route: string
  title: string
  cachedAt: number
  isTechnicianPage: boolean
  isJobDetailPage: boolean
}

export interface OfflineNavigationState {
  isOffline: boolean
  cachedPages: CachedPage[]
  allowedRoutes: string[]
  currentRoute: string
}

// Storage key for cached pages
const CACHED_PAGES_KEY = 'battery-tech-cached-pages'

// Get cached pages from storage
export function getCachedPages(): CachedPage[] {
  if (typeof window === 'undefined') return []
  
  try {
    const cached = localStorage.getItem(CACHED_PAGES_KEY)
    return cached ? JSON.parse(cached) : []
  } catch {
    return []
  }
}

// Save cached pages to storage
export function saveCachedPages(pages: CachedPage[]): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(CACHED_PAGES_KEY, JSON.stringify(pages))
  } catch (error) {
    console.warn('Failed to save cached pages:', error)
  }
}

// Add a page to cached pages
export function addCachedPage(route: string, title: string): void {
  const pages = getCachedPages()
  const existingPage = pages.find(p => p.route === route)
  
  if (existingPage) {
    // Update existing page
    existingPage.cachedAt = Date.now()
    existingPage.title = title
  } else {
    // Add new page
    const newPage: CachedPage = {
      route,
      title,
      cachedAt: Date.now(),
      isTechnicianPage: route.startsWith('/technician') && !route.includes('/jobs/'),
      isJobDetailPage: route.includes('/technician/jobs/')
    }
    pages.push(newPage)
  }
  
  saveCachedPages(pages)
  console.log('📱 Added cached page:', route, title)
}

// Check if a route is allowed when offline
export function isRouteAllowedOffline(route: string): boolean {
  const pages = getCachedPages()
  return pages.some(page => page.route === route)
}

// Get allowed routes for offline navigation
export function getAllowedOfflineRoutes(): string[] {
  const pages = getCachedPages()
  return pages.map(page => page.route)
}

// Get offline navigation state
export function getOfflineNavigationState(): OfflineNavigationState {
  const pages = getCachedPages()
  const isOffline = !navigator.onLine
  
  return {
    isOffline,
    cachedPages: pages,
    allowedRoutes: pages.map(p => p.route),
    currentRoute: typeof window !== 'undefined' ? window.location.pathname : ''
  }
}

// Check if current navigation should be blocked
export function shouldBlockNavigation(targetRoute: string): boolean {
  if (navigator.onLine) {
    return false // Allow all navigation when online
  }
  
  return !isRouteAllowedOffline(targetRoute)
}

// Get technician-specific cached pages
export function getTechnicianCachedPages(): CachedPage[] {
  const pages = getCachedPages()
  return pages.filter(page => 
    page.isTechnicianPage || page.isJobDetailPage
  )
}

// Get job detail pages
export function getJobDetailPages(): CachedPage[] {
  const pages = getCachedPages()
  return pages.filter(page => page.isJobDetailPage)
}

// Clear old cached pages (older than 7 days)
export function cleanupOldCachedPages(): void {
  const pages = getCachedPages()
  const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
  
  const recentPages = pages.filter(page => page.cachedAt > sevenDaysAgo)
  
  if (recentPages.length !== pages.length) {
    saveCachedPages(recentPages)
    console.log('🧹 Cleaned up old cached pages:', pages.length - recentPages.length)
  }
}

// Initialize offline navigation guard
export function initializeOfflineNavigationGuard(): void {
  if (typeof window === 'undefined') return
  
  // Clean up old pages
  cleanupOldCachedPages()
  
  // Track page visits to build cache
  const trackPageVisit = () => {
    const currentRoute = window.location.pathname
    const title = document.title
    
    // Only track technician-related pages
    if (currentRoute.startsWith('/technician')) {
      addCachedPage(currentRoute, title)
    }
  }
  
  // Track initial page load
  trackPageVisit()
  
  // Track navigation changes
  window.addEventListener('popstate', trackPageVisit)
  
  // Track programmatic navigation
  const originalPushState = history.pushState
  const originalReplaceState = history.replaceState
  
  history.pushState = function(...args) {
    originalPushState.apply(history, args)
    setTimeout(trackPageVisit, 100) // Small delay to ensure route is updated
  }
  
  history.replaceState = function(...args) {
    originalReplaceState.apply(history, args)
    setTimeout(trackPageVisit, 100)
  }
  
  console.log('🛡️ Offline navigation guard initialized')
}

// Get navigation suggestions for offline mode
export function getOfflineNavigationSuggestions(currentRoute: string): CachedPage[] {
  const pages = getCachedPages()
  
  // Filter out current route and sort by relevance
  const suggestions = pages
    .filter(page => page.route !== currentRoute)
    .sort((a, b) => {
      // Prioritize technician dashboard and job detail pages
      if (a.isTechnicianPage && !b.isTechnicianPage) return -1
      if (!a.isTechnicianPage && b.isTechnicianPage) return 1
      if (a.isJobDetailPage && !b.isJobDetailPage) return -1
      if (!a.isJobDetailPage && b.isJobDetailPage) return 1
      
      // Then by recency
      return b.cachedAt - a.cachedAt
    })
  
  return suggestions.slice(0, 5) // Limit to 5 suggestions
}
