// Offline Navigation Utilities
// This module handles pre-caching of routes for better offline navigation

export interface RouteCacheConfig {
  routes: string[]
  priority: 'high' | 'medium' | 'low'
  preloadOnIdle?: boolean
}

// Routes that should be pre-cached for offline use
export const ROUTE_CACHE_CONFIG: RouteCacheConfig[] = [
  {
    routes: ['/dashboard', '/jobs', '/customers', '/technician'],
    priority: 'high',
    preloadOnIdle: true
  },
  {
    routes: ['/service-providers', '/saas-dashboard'],
    priority: 'medium',
    preloadOnIdle: true
  }
]

// Cache key for storing route cache metadata
const ROUTE_CACHE_KEY = 'battery-tech-routes'

// Pre-cache a specific route
export async function preCacheRoute(route: string): Promise<boolean> {
  try {
    if (typeof window === 'undefined') {
      console.warn('Pre-caching not available: window not available')
      return false
    }
    
    // Try service worker caching first
    if ('caches' in window) {
      console.log('🔄 Attempting to pre-cache route with service worker:', route)
      const cache = await caches.open('battery-tech-pages-v115')
      const response = await fetch(route)
      
      if (response.ok) {
        await cache.put(route, response.clone())
        console.log('✅ Pre-cached route with service worker:', route)
        return true
      } else {
        console.warn('❌ Failed to fetch route for pre-caching:', route, 'Status:', response.status)
        return false
      }
    } else {
      console.warn('❌ Service worker not available for pre-caching')
      return false
    }
  } catch (error) {
    console.warn('❌ Failed to pre-cache route:', route, error)
    return false
  }
}

// Pre-cache multiple routes
export async function preCacheRoutes(routes: string[]): Promise<{ success: string[], failed: string[] }> {
  const results = await Promise.allSettled(
    routes.map(route => preCacheRoute(route))
  )
  
  const success: string[] = []
  const failed: string[] = []
  
  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value) {
      success.push(routes[index])
    } else {
      failed.push(routes[index])
    }
  })
  
  return { success, failed }
}

// Get cached route metadata
export function getCachedRoutes(): string[] {
  if (typeof window === 'undefined') return []
  
  try {
    const cached = localStorage.getItem(ROUTE_CACHE_KEY)
    return cached ? JSON.parse(cached) : []
  } catch {
    return []
  }
}

// Save route cache metadata
export function saveCachedRoutes(routes: string[]): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(ROUTE_CACHE_KEY, JSON.stringify(routes))
  } catch (error) {
    console.warn('Failed to save cached routes:', error)
  }
}

// Initialize route pre-caching
export async function initializeRoutePreCaching(): Promise<void> {
  if (typeof window === 'undefined') return
  
  // Wait for service worker to be ready
  await waitForServiceWorker()
  
  // Wait for the page to be idle before pre-caching
  if ('requestIdleCallback' in window) {
    requestIdleCallback(async () => {
      await preCacheHighPriorityRoutes()
    })
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(async () => {
      await preCacheHighPriorityRoutes()
    }, 3000) // Increased delay to ensure SW is ready
  }
}

// Wait for service worker to be ready
async function waitForServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service workers not supported')
    return
  }
  
  try {
    const registration = await navigator.serviceWorker.getRegistration()
    if (registration && registration.active) {
      console.log('✅ Service worker is active, proceeding with pre-caching')
      return
    }
    
    // Wait for service worker to become active
    console.log('⏳ Waiting for service worker to become active...')
    await new Promise<void>((resolve) => {
      const checkSW = () => {
        navigator.serviceWorker.getRegistration().then(reg => {
          if (reg && reg.active) {
            console.log('✅ Service worker is now active')
            resolve()
          } else {
            setTimeout(checkSW, 100) // Check every 100ms
          }
        })
      }
      checkSW()
      
      // Timeout after 10 seconds
      setTimeout(() => {
        console.warn('⚠️ Service worker not ready after 10 seconds, proceeding anyway')
        resolve()
      }, 10000)
    })
  } catch (error) {
    console.warn('Error waiting for service worker:', error)
  }
}

// Pre-cache high priority routes
async function preCacheHighPriorityRoutes(): Promise<void> {
  const highPriorityConfig = ROUTE_CACHE_CONFIG.find(config => config.priority === 'high')
  if (!highPriorityConfig) return
  
  const alreadyCached = getCachedRoutes()
  const routesToCache = highPriorityConfig.routes.filter(route => !alreadyCached.includes(route))
  
  if (routesToCache.length === 0) return
  
  console.log('🚀 Pre-caching high priority routes:', routesToCache)
  const { success, failed } = await preCacheRoutes(routesToCache)
  
  if (success.length > 0) {
    const updatedCached = [...alreadyCached, ...success]
    saveCachedRoutes(updatedCached)
    console.log('✅ Successfully pre-cached routes:', success)
  }
  
  if (failed.length > 0) {
    console.warn('⚠️ Failed to pre-cache routes:', failed)
    
    // Retry failed routes after a delay
    console.log('🔄 Retrying failed routes in 2 seconds...')
    setTimeout(async () => {
      const retryResults = await preCacheRoutes(failed)
      if (retryResults.success.length > 0) {
        const updatedCached = [...alreadyCached, ...success, ...retryResults.success]
        saveCachedRoutes(updatedCached)
        console.log('✅ Successfully pre-cached retry routes:', retryResults.success)
      }
      if (retryResults.failed.length > 0) {
        console.warn('⚠️ Still failed to pre-cache after retry:', retryResults.failed)
      }
    }, 2000)
  }
}

// Pre-cache a specific job or customer page
export async function preCacheDynamicRoute(baseRoute: string, id: string): Promise<boolean> {
  const fullRoute = `${baseRoute}/${id}`
  return await preCacheRoute(fullRoute)
}

// Check if a route is likely cached
export function isRouteLikelyCached(route: string): boolean {
  const cachedRoutes = getCachedRoutes()
  return cachedRoutes.includes(route) || 
         cachedRoutes.some(cached => route.startsWith(cached))
}

// Get offline navigation suggestions
export function getOfflineNavigationSuggestions(currentRoute: string): string[] {
  const suggestions: string[] = []
  const cachedRoutes = getCachedRoutes()
  
  // Always suggest dashboard and main pages
  if (!currentRoute.includes('/dashboard')) {
    suggestions.push('/dashboard')
  }
  
  if (!currentRoute.includes('/jobs')) {
    suggestions.push('/jobs')
  }
  
  if (!currentRoute.includes('/customers')) {
    suggestions.push('/customers')
  }
  
  // Add other cached routes that aren't the current one
  cachedRoutes.forEach(route => {
    if (route !== currentRoute && !suggestions.includes(route)) {
      suggestions.push(route)
    }
  })
  
  return suggestions.slice(0, 5) // Limit to 5 suggestions
}
