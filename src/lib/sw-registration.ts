// Service Worker Registration
export function registerServiceWorker() {
  if (typeof window === 'undefined') {
    console.warn('Service worker registration skipped: window not available')
    return
  }
  
  if (!('serviceWorker' in navigator)) {
    console.warn('Service worker registration skipped: service workers not supported')
    console.log('💡 Using client-side caching fallback for offline functionality')
    return
  }
  
  console.log('🚀 Starting service worker registration...')
  
  // Register immediately, don't wait for load event
  const registerSW = async () => {
    try {
      // Check for existing service worker first
      let registration = await navigator.serviceWorker.getRegistration()
      if (registration) {
        console.log('🔄 Existing service worker found, checking for updates...')
        await registration.update()
      } else {
        console.log('🆕 No existing service worker, registering new one...')
        // Use absolute URL for local network compatibility
        const swUrl = `${window.location.origin}/sw.js?v=${Date.now()}`
        console.log('🔗 Registering service worker at:', swUrl)
        registration = await navigator.serviceWorker.register(swUrl, {
          scope: '/'
        })
      }
      console.log('Service Worker registered successfully:', registration.scope)
      console.log('Service Worker state:', registration.active?.state)
      console.log('Service Worker waiting:', registration.waiting?.state)
      console.log('Service Worker installing:', registration.installing?.state)

      // Handle updates
      registration.addEventListener('updatefound', () => {
        console.log('🔄 Service worker update found!')
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            console.log('📱 New worker state:', newWorker.state)
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('✅ New content is available, dispatching update event')
              // New content is available, notify the app
              window.dispatchEvent(new CustomEvent('sw-update-available', {
                detail: { registration, newWorker }
              }))
            }
          })
        }
      })

      // Force check for updates every time
      if (registration.waiting) {
        console.log('🔄 Service worker waiting, forcing update')
        registration.waiting.postMessage({ type: 'SKIP_WAITING' })
      }

      // Force immediate update check
      console.log('🔄 Forcing immediate update check...')
      if (registration && registration.active) {
        try {
          await registration.update()
        } catch (error) {
          console.warn('Failed to force immediate update check:', error)
        }
      }
      
      // Force activation if there's a waiting service worker
      if (registration.waiting) {
        console.log('⚡ Forcing waiting service worker to activate...')
        registration.waiting.postMessage({ type: 'SKIP_WAITING' })
      }

      // Periodically check for updates (start after a delay to ensure SW is ready)
      setTimeout(() => {
        setInterval(async () => {
          try {
            if ('serviceWorker' in navigator) {
              const currentRegistration = await navigator.serviceWorker.getRegistration()
              if (currentRegistration && currentRegistration.active) {
                await currentRegistration.update()
              }
            }
          } catch (error) {
            console.warn('Failed to check for service worker updates:', error)
          }
        }, 30000) // Check every 30 seconds
      }, 5000) // Start periodic checks after 5 seconds

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SYNC_REQUEST') {
          // Trigger sync in the main app
          window.dispatchEvent(new CustomEvent('background-sync'))
        }
      })

    } catch (error) {
      console.error('Service Worker registration failed:', error)
    }
  }
  
  // Register immediately and also on load as fallback
  registerSW()
  
  // Also register on load as a fallback for some browsers
  window.addEventListener('load', registerSW)
}

// Update service worker
export async function updateServiceWorker(registration: ServiceWorkerRegistration) {
  if (registration.waiting) {
    // Tell the waiting service worker to skip waiting and become active
    registration.waiting.postMessage({ type: 'SKIP_WAITING' })
    
    // Reload the page to use the new service worker
    window.location.reload()
  }
}

// Check for updates manually
export async function checkForUpdates() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration && registration.active) {
        console.log('🔍 Manually checking for updates...')
        await registration.update()
      } else {
        console.log('🔍 No active service worker registration found')
      }
    } catch (error) {
      console.error('Failed to check for updates:', error)
    }
  }
}

// Initialize offline storage
export async function initializeOfflineStorage() {
  if (typeof window !== 'undefined') {
    try {
      const { offlineStorage } = await import('./offline-storage')
      await offlineStorage.init()
      console.log('Offline storage initialized')
    } catch (error) {
      console.error('Failed to initialize offline storage:', error)
    }
  }
}

// Preload critical assets for offline use
export async function preloadCriticalAssets() {
  if (typeof window === 'undefined') return

  try {
    console.log('🔄 Preloading critical assets for offline use...')
    
    const criticalAssets = [
      '/manifest.json',
      '/favicon.ico',
      '/icon-192x192.png',
      '/icon-512x512.png',
      '/apple-touch-icon.png'
    ]

    // Preload critical assets
    const preloadPromises = criticalAssets.map(async (asset) => {
      try {
        const response = await fetch(asset)
        if (response.ok) {
          console.log(`✅ Preloaded: ${asset}`)
        }
      } catch (error) {
        console.log(`⚠️ Could not preload ${asset}:`, error)
      }
    })

    await Promise.all(preloadPromises)
    console.log('✅ Critical assets preloading completed')
  } catch (error) {
    console.error('❌ Error preloading critical assets:', error)
  }
}

// Force cache critical assets for offline use
export async function forceCacheCriticalAssets() {
  if (typeof window === 'undefined' || !('caches' in window)) return

  try {
    console.log('🔄 Force caching critical assets for offline use...')
    
    const cache = await caches.open('battery-tech-v116')
    
    const criticalAssets = [
      '/manifest.json',
      '/favicon.ico',
      '/icon-192x192.png',
      '/icon-512x512.png',
      '/apple-touch-icon.png',
      '/browserconfig.xml'
    ]

    // Force cache critical assets
    const cachePromises = criticalAssets.map(async (asset) => {
      try {
        const response = await fetch(asset)
        if (response.ok) {
          await cache.put(asset, response)
          console.log(`✅ Force cached: ${asset}`)
        }
      } catch (error) {
        console.log(`⚠️ Could not force cache ${asset}:`, error)
      }
    })

    await Promise.all(cachePromises)
    console.log('✅ Critical assets force caching completed')
  } catch (error) {
    console.error('❌ Error force caching critical assets:', error)
  }
}

// Initialize sync manager
export function initializeSyncManager() {
  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    // Use a more robust initialization approach
    const initSyncManager = async () => {
      try {
        console.log('🔄 Starting sync manager initialization...')
        
        // Import sync manager with error handling
        const syncManagerModule = await import('./sync-manager')
        console.log('📦 Sync manager module imported:', syncManagerModule)
        
        // Check if syncManager exists in the module
        if (!syncManagerModule || !syncManagerModule.syncManager) {
          console.error('❌ syncManager not found in module:', Object.keys(syncManagerModule || {}))
          return
        }
        
        const syncManager = syncManagerModule.syncManager
        console.log('✅ SyncManager extracted from module:', typeof syncManager)
        
        // Validate that syncManager is a proper object
        if (typeof syncManager !== 'object' || syncManager === null) {
          console.error('❌ syncManager is not a valid object:', typeof syncManager)
          return
        }
        
        // Validate required methods exist
        const requiredMethods = ['forceSync', 'checkAndSyncNow', 'debugOfflineStorage']
        const missingMethods = requiredMethods.filter(method => typeof (syncManager as unknown as Record<string, unknown>)[method] !== 'function')
        
        if (missingMethods.length > 0) {
          console.error('❌ syncManager missing required methods:', missingMethods)
          console.log('Available methods:', Object.getOwnPropertyNames(syncManager))
          return
        }
        
        console.log('✅ SyncManager validation passed')
        
        // Listen for background sync requests
        window.addEventListener('background-sync', () => {
          console.log('🔄 Background sync requested')
          try {
            syncManager.forceSync()
          } catch (error) {
            console.error('❌ Error in background sync:', error)
          }
        });
        
        // Also listen for custom sync events
        window.addEventListener('manual-sync', () => {
          console.log('🔄 Manual sync requested')
          try {
            syncManager.checkAndSyncNow()
          } catch (error) {
            console.error('❌ Error in manual sync:', error)
          }
        });
        
        // Make sync manager globally available for debugging
        (window as unknown as Record<string, unknown>).syncManager = syncManager;
        
        // Add debug function to window for easy testing
        (window as unknown as Record<string, unknown>).debugOfflineStorage = () => {
          try {
            return syncManager.debugOfflineStorage()
          } catch (error) {
            console.error('❌ Error in debug function:', error)
          }
        };

        // Add a global sync trigger function
        (window as unknown as Record<string, unknown>).triggerSync = () => {
          console.log('🔄 Global sync trigger called')
          try {
            syncManager.checkAndSyncNow()
          } catch (error) {
            console.error('❌ Error in global sync trigger:', error)
          }
        }
        
        // Add a function to check sync status
        (window as unknown as Record<string, unknown>).getSyncStatus = () => {
          try {
            return syncManager.getSyncStatus()
          } catch (error) {
            console.error('❌ Error getting sync status:', error)
            return null
          }
        }

        // Add a function to force cache assets
        (window as unknown as Record<string, unknown>).forceCacheAssets = () => {
          console.log('🔄 Force caching assets triggered')
          try {
            forceCacheCriticalAssets()
          } catch (error) {
            console.error('❌ Error force caching assets:', error)
          }
        }

        // Add a function to check cache contents
        (window as unknown as Record<string, unknown>).checkCacheContents = async () => {
          try {
            console.log('🔍 Checking cache contents...')
            const cacheNames = await caches.keys()
            console.log('📦 Available caches:', cacheNames)
            
            for (const cacheName of cacheNames) {
              const cache = await caches.open(cacheName)
              const keys = await cache.keys()
              console.log(`📁 Cache "${cacheName}" contains ${keys.length} items:`)
              keys.forEach((request, index) => {
                console.log(`  ${index + 1}. ${request.url}`)
              })
            }
          } catch (error) {
            console.error('❌ Error checking cache contents:', error)
          }
        }

        // Add a function to pre-cache job details
        (window as unknown as Record<string, unknown>).precacheJobDetails = async (jobIds: string[]) => {
          try {
            console.log('🔧 Pre-caching job details for:', jobIds)
            const { precacheJobsForOffline } = await import('./precache-job-details')
            const result = await precacheJobsForOffline(jobIds.map(id => ({ id })))
            console.log('✅ Job details pre-caching result:', result)
            return result
          } catch (error) {
            console.error('❌ Error pre-caching job details:', error)
            return null
          }
        }

        // Add a function to check cached jobs
        (window as unknown as Record<string, unknown>).checkCachedJobs = async () => {
          try {
            console.log('🔍 Checking cached jobs...')
            const { getTechnicianTodayJobs } = await import('./technician-job-cache')
            const cachedJobs = await getTechnicianTodayJobs('current-user-id') // This will need to be updated with actual user ID
            console.log('📱 Cached jobs:', cachedJobs.map(job => ({ id: job.id, jobNumber: job.jobNumber, description: job.description })))
            return cachedJobs
          } catch (error) {
            console.error('❌ Error checking cached jobs:', error)
            return []
          }
        }

// Add a function to test page caching
(window as unknown as Record<string, unknown>).testPageCaching = async (jobId: string) => {
  try {
    console.log('🔧 Testing page caching for job:', jobId)
    const jobDetailUrl = `/technician/jobs/${jobId}`
    
    // Check if page is already cached
    const pageCache = await caches.open('battery-tech-pages-v116')
    const cachedResponse = await pageCache.match(jobDetailUrl)
    
    if (cachedResponse) {
      console.log('✅ Page is already cached:', jobDetailUrl)
      return { cached: true, url: jobDetailUrl }
    } else {
      console.log('❌ Page is not cached:', jobDetailUrl)
      
      // Try to fetch and cache it
      const response = await fetch(jobDetailUrl)
      if (response.ok) {
        await pageCache.put(jobDetailUrl, response.clone())
        console.log('✅ Successfully cached page:', jobDetailUrl)
        return { cached: true, url: jobDetailUrl, justCached: true }
      } else {
        console.log('❌ Failed to fetch page:', response.status)
        return { cached: false, url: jobDetailUrl, error: `HTTP ${response.status}` }
      }
    }
  } catch (error) {
    console.error('❌ Error testing page caching:', error)
    return { cached: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Add a function to check what's in the page cache
(window as unknown as Record<string, unknown>).checkPageCache = async () => {
  try {
    console.log('🔍 Checking page cache contents...')
    const pageCache = await caches.open('battery-tech-pages-v116')
    const keys = await pageCache.keys()
    const urls = keys.map(request => request.url)
    
    console.log('📱 Page cache contains:', urls)
    
    // Check for technician job pages specifically
    const technicianJobPages = urls.filter(url => url.includes('/technician/jobs/'))
    console.log('🔧 Technician job pages in cache:', technicianJobPages)
    
    return {
      totalPages: urls.length,
      technicianJobPages: technicianJobPages.length,
      allUrls: urls,
      technicianJobUrls: technicianJobPages
    }
  } catch (error) {
    console.error('❌ Error checking page cache:', error)
    return { error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
        
        console.log('✅ Sync manager initialized and available globally')
      } catch (error) {
        console.error('❌ Failed to initialize sync manager:', error)
        console.error('Error details:', {
          name: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        })
        
        // Create a fallback sync manager to prevent crashes
        console.log('🔄 Creating fallback sync manager...')
        const fallbackSyncManager: Record<string, () => void> = {
          forceSync: () => console.log('⚠️ Fallback sync manager - sync not available'),
          checkAndSyncNow: () => console.log('⚠️ Fallback sync manager - sync not available'),
          debugOfflineStorage: () => console.log('⚠️ Fallback sync manager - debug not available')
        };
        
        // Make fallback sync manager globally available
        (window as unknown as Record<string, unknown>).syncManager = fallbackSyncManager;
        (window as unknown as Record<string, unknown>).debugOfflineStorage = () => fallbackSyncManager.debugOfflineStorage();
        
        console.log('⚠️ Fallback sync manager created and available globally')
      }
    }
    
    // Start initialization
    initSyncManager()
  } else {
    console.warn('⚠️ Cannot initialize sync manager: window.addEventListener not available')
  }
}

// Test function to manually trigger update notification (for development)
export function testUpdateNotification() {
  if (typeof window !== 'undefined') {
    console.log('🧪 Testing update notification...')
    window.dispatchEvent(new CustomEvent('sw-update-available', {
      detail: { 
        registration: { waiting: true },
        newWorker: { state: 'installed' }
      }
    }))
  }
}

// Debug function to check service worker status
export async function debugServiceWorkerStatus() {
  if (typeof window === 'undefined') {
    console.log('❌ Window not available')
    return
  }
  
  console.log('🔍 Service Worker Debug Info:')
  console.log('- Service Worker support:', 'serviceWorker' in navigator)
  console.log('- Current URL:', window.location.href)
  console.log('- Origin:', window.location.origin)
  console.log('- Protocol:', window.location.protocol)
  console.log('- Hostname:', window.location.hostname)
  console.log('- Is localhost:', window.location.hostname === 'localhost')
  console.log('- Is local network:', window.location.hostname.startsWith('192.168.') || window.location.hostname.startsWith('10.') || window.location.hostname.startsWith('172.'))
  console.log('- Is HTTPS:', window.location.protocol === 'https:')
  console.log('- Is HTTP:', window.location.protocol === 'http:')
  
  if (!('serviceWorker' in navigator)) {
    console.log('❌ Service workers not supported in this browser')
    console.log('💡 This could be because:')
    console.log('   - Browser doesn\'t support service workers')
    console.log('   - Running on HTTP instead of HTTPS (some browsers require HTTPS)')
    console.log('   - Browser security settings block service workers')
    return
  }
  
  try {
    const registration = await navigator.serviceWorker.getRegistration()
    if (registration) {
      console.log('✅ Service Worker Registration Found:')
      console.log('- Scope:', registration.scope)
      console.log('- Active:', registration.active?.state)
      console.log('- Waiting:', registration.waiting?.state)
      console.log('- Installing:', registration.installing?.state)
      console.log('- Controller:', navigator.serviceWorker.controller?.state)
    } else {
      console.log('❌ No Service Worker Registration Found')
    }
  } catch (error) {
    console.error('❌ Error checking service worker status:', error)
  }
}
