// Service Worker for offline functionality and background sync
const CACHE_NAME = 'battery-tech-v116'
const OFFLINE_URL = '/offline.html'

// Get the current origin for proper URL handling
const getOrigin = () => {
  return self.location.origin
}

// Files to cache for offline use
const CACHE_FILES = [
  '/',
  '/dashboard',
  '/jobs',
  '/customers',
  '/service-providers',
  '/technician',
  '/offline.html',
  '/manifest.json'
]

// Critical assets that must be cached for offline use
const CRITICAL_ASSETS = [
  // CSS files
  '/_next/static/css/',
  // JavaScript bundles
  '/_next/static/chunks/',
  // Fonts
  '/_next/static/media/',
  // Icons and images
  '/favicon.ico',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/apple-touch-icon.png',
  // PWA assets
  '/manifest.json',
  '/browserconfig.xml'
]

// Routes that should be cached dynamically
const DYNAMIC_ROUTES = [
  '/jobs/',
  '/customers/',
  '/technician/jobs/'
]

// Technician-specific routes that need special handling
const TECHNICIAN_ROUTES = [
  '/technician',
  '/technician/',
  '/technician/jobs',
  '/technician/jobs/'
]

// Pattern for technician job detail pages (e.g., /technician/jobs/123)
const TECHNICIAN_JOB_PATTERN = /^\/technician\/jobs\/[^\/]+$/

// Cache for individual pages that are visited
const PAGE_CACHE = 'battery-tech-pages-v116'

// Install event - cache essential files
self.addEventListener('install', (event) => {
  console.log('🔄 Service Worker installing with cache:', CACHE_NAME)
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Caching files for offline use')
        return cache.addAll(CACHE_FILES)
      })
      .then(() => {
        // Also cache technician routes in page cache for better offline support
        return caches.open(PAGE_CACHE)
      })
      .then((pageCache) => {
        console.log('📦 Pre-caching technician routes for offline use')
        return Promise.all([
          pageCache.add('/technician').catch(err => console.log('Could not cache /technician:', err)),
          pageCache.add('/technician/jobs').catch(err => console.log('Could not cache /technician/jobs:', err))
        ])
      })
      .then(() => {
        // Cache critical assets for offline use
        console.log('📦 Caching critical assets for offline use')
        return caches.open(CACHE_NAME)
      })
      .then((cache) => {
        // Cache critical static assets
        const criticalPromises = [
          // Cache manifest and icons
          cache.add('/manifest.json').catch(err => console.log('Could not cache manifest:', err)),
          cache.add('/favicon.ico').catch(err => console.log('Could not cache favicon:', err)),
          cache.add('/icon-192x192.png').catch(err => console.log('Could not cache icon-192:', err)),
          cache.add('/icon-512x512.png').catch(err => console.log('Could not cache icon-512:', err)),
          cache.add('/apple-touch-icon.png').catch(err => console.log('Could not cache apple-touch-icon:', err))
        ]
        
        return Promise.all(criticalPromises)
      })
      .then(() => {
        console.log('✅ Service worker installed, skipping waiting to force update')
        // Skip waiting immediately to force update
        return self.skipWaiting()
      })
  )
})

// Activate event - clean up old caches and redirect responses
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker activating with cache:', CACHE_NAME)
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      console.log('🗑️ Cleaning up old caches:', cacheNames)
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete ALL old caches except the current ones
          if (!cacheName.includes('battery-tech-v116')) {
            console.log('🗑️ Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => {
      // Clean up any cached redirect responses
      return caches.open(CACHE_NAME).then((cache) => {
        return cache.keys().then((requests) => {
          return Promise.all(
            requests.map((request) => {
              return cache.match(request).then((response) => {
                // Delete cached redirects
                if (response && (response.status >= 300 && response.status < 400 || response.redirected)) {
                  return cache.delete(request)
                }
              })
            })
          )
        })
      })
    }).then(() => {
      return self.clients.claim()
    })
  )
})

// Helper function to check if a URL matches dynamic routes
function isDynamicRoute(url) {
  const urlPath = new URL(url).pathname
  return DYNAMIC_ROUTES.some(route => urlPath.startsWith(route))
}

// Helper function to check if a URL is a technician route
function isTechnicianRoute(url) {
  const urlPath = new URL(url).pathname
  return TECHNICIAN_ROUTES.some(route => urlPath.startsWith(route)) || 
         TECHNICIAN_JOB_PATTERN.test(urlPath)
}

// Helper function to find a fallback route for dynamic routes
function findFallbackRoute(url) {
  const urlPath = new URL(url).pathname
  
  if (urlPath.startsWith('/jobs/')) {
    return '/jobs'
  } else if (urlPath.startsWith('/customers/')) {
    return '/customers'
  } else if (TECHNICIAN_JOB_PATTERN.test(urlPath)) {
    // For /technician/jobs/123, fallback to /technician
    return '/technician'
  } else if (urlPath.startsWith('/technician/jobs/')) {
    return '/technician'
  } else if (urlPath.startsWith('/technician')) {
    return '/technician'
  }
  
  return null
}

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return
  }

  // Handle API requests with network-first strategy
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          // Don't cache redirects or invalid responses
          if (!networkResponse || 
              networkResponse.status < 200 || 
              networkResponse.status >= 400 || 
              networkResponse.type !== 'basic' ||
              networkResponse.redirected) {
            return networkResponse
          }

          // Clone the response for caching
          const responseToCache = networkResponse.clone()

          // Cache API responses in a separate cache
          caches.open('battery-tech-api-v116')
            .then((cache) => {
              cache.put(event.request, responseToCache)
              console.log('💾 Cached API response:', event.request.url)
            })

          return networkResponse
        })
        .catch((error) => {
          console.log('🌐 API network failed, trying cache:', event.request.url)
          // Try to serve from cache when network fails
          return caches.match(event.request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                console.log('📦 Serving cached API response:', event.request.url)
                return cachedResponse
              }
              console.log('❌ No cached API response found for:', event.request.url)
              // Return a basic offline response for API calls
              return new Response(
                JSON.stringify({ 
                  error: 'Offline - no cached data available',
                  offline: true 
                }),
                {
                  status: 503,
                  statusText: 'Service Unavailable',
                  headers: { 'Content-Type': 'application/json' }
                }
              )
            })
        })
    )
    return
  }

  // Special handling for technician job detail pages - try cache first
  if (TECHNICIAN_JOB_PATTERN.test(new URL(event.request.url).pathname)) {
    console.log('🔧 Service Worker: Handling technician job detail page request:', event.request.url)
    
    event.respondWith(
      caches.open(PAGE_CACHE)
        .then((cache) => {
          console.log('🔍 Service Worker: Checking page cache for:', event.request.url)
          return cache.match(event.request)
        })
        .then((cachedResponse) => {
          if (cachedResponse) {
            console.log('✅ Service Worker: Serving technician job detail page from cache:', event.request.url)
            return cachedResponse
          }
          
          console.log('❌ Service Worker: Page not found in cache, fetching from network:', event.request.url)
          
          // If not in cache, fetch from network and cache it
          return fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse.ok) {
                console.log('🌐 Service Worker: Network response OK, caching page:', event.request.url)
                const responseToCache = networkResponse.clone()
                caches.open(PAGE_CACHE)
                  .then((cache) => {
                    cache.put(event.request, responseToCache)
                    console.log('💾 Service Worker: Successfully cached technician job detail page:', event.request.url)
                  })
                  .catch((cacheError) => {
                    console.error('❌ Service Worker: Failed to cache page:', cacheError)
                  })
              } else {
                console.log('❌ Service Worker: Network response not OK:', networkResponse.status, event.request.url)
              }
              return networkResponse
            })
            .catch((error) => {
              console.log('🌐 Service Worker: Network failed for technician job detail page:', event.request.url, error)
              // Return a fallback page
              return new Response(
                `<!DOCTYPE html>
                <html>
                  <head><title>Job Not Available Offline</title></head>
                  <body>
                    <h1>Job Not Available Offline</h1>
                    <p>This job detail page is not available offline. Please go online to view this job.</p>
                    <button onclick="history.back()">Go Back</button>
                  </body>
                </html>`,
                { 
                  headers: { 'Content-Type': 'text/html' },
                  status: 200
                }
              )
            })
        })
        .catch((error) => {
          console.error('❌ Service Worker: Error in technician job detail page handler:', error)
          // Return fallback page on error
          return new Response(
            `<!DOCTYPE html>
            <html>
              <head><title>Error Loading Job</title></head>
              <body>
                <h1>Error Loading Job</h1>
                <p>There was an error loading this job page.</p>
                <button onclick="history.back()">Go Back</button>
              </body>
            </html>`,
            { 
              headers: { 'Content-Type': 'text/html' },
              status: 200
            }
          )
        })
    )
    return
  }

  // Handle static assets with cache-first strategy for better offline experience
  if (event.request.url.includes('/_next/static/') || 
      event.request.url.includes('.css') || 
      event.request.url.includes('.js') ||
      event.request.url.includes('.woff') ||
      event.request.url.includes('.woff2') ||
      event.request.url.includes('.ttf') ||
      event.request.url.includes('.eot') ||
      event.request.url.includes('.svg') ||
      event.request.url.includes('.png') ||
      event.request.url.includes('.jpg') ||
      event.request.url.includes('.jpeg') ||
      event.request.url.includes('.gif') ||
      event.request.url.includes('.webp') ||
      event.request.url.includes('globals.css')) {
    
    event.respondWith(
      caches.match(event.request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            console.log('📦 Serving static asset from cache:', event.request.url)
            return cachedResponse
          }
          
          // If not in cache, fetch from network and cache it
          return fetch(event.request)
            .then((networkResponse) => {
              // Don't cache invalid responses
              if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                return networkResponse
              }
              
              // Clone the response and cache it
              const responseToCache = networkResponse.clone()
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache)
                  console.log('💾 Cached static asset:', event.request.url)
                })
              
              return networkResponse
            })
            .catch(() => {
              // If network fails and no cache, return a basic response for critical assets
              if (event.request.url.includes('globals.css')) {
                return new Response('/* Offline fallback CSS */', {
                  headers: { 'Content-Type': 'text/css' }
                })
              }
              throw new Error('Network failed and no cache available')
            })
        })
    )
    return
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Return cached version if it exists and is valid
        if (cachedResponse && cachedResponse.status === 200 && !cachedResponse.redirected) {
          console.log('📦 Serving from cache:', event.request.url)
          return cachedResponse
        }
        
        // Log what we found in cache for debugging
        if (cachedResponse) {
          console.log('⚠️ Cached response found but invalid:', {
            url: event.request.url,
            status: cachedResponse.status,
            redirected: cachedResponse.redirected
          })
        } else {
          console.log('❌ No cached response found for:', event.request.url)
        }

        // If cached response is a redirect, delete it
        if (cachedResponse && (cachedResponse.status >= 300 && cachedResponse.status < 400 || cachedResponse.redirected)) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.delete(event.request)
          })
        }

        // Try to fetch from network
        return fetch(event.request)
          .then((networkResponse) => {
            // Don't cache redirects or invalid responses
            if (!networkResponse || 
                networkResponse.status < 200 || 
                networkResponse.status >= 400 || 
                networkResponse.type !== 'basic' ||
                networkResponse.redirected) {
              return networkResponse
            }

            // Clone the response for caching
            const responseToCache = networkResponse.clone()

            // Determine which cache to use
            let cacheToUse = CACHE_NAME
            if (isDynamicRoute(event.request.url) || isTechnicianRoute(event.request.url)) {
              cacheToUse = PAGE_CACHE // Cache all dynamic and technician routes in page cache
            }
            
            // Special handling for technician job detail pages
            if (TECHNICIAN_JOB_PATTERN.test(new URL(event.request.url).pathname)) {
              cacheToUse = PAGE_CACHE
              console.log('🔧 Caching technician job detail page:', event.request.url)
            }

            // Cache the response
            caches.open(cacheToUse)
              .then((cache) => {
                cache.put(event.request, responseToCache)
                console.log('💾 Cached in', cacheToUse, ':', event.request.url)
              })

            return networkResponse
          })
          .catch((error) => {
            console.log('🌐 Network failed for:', event.request.url, error)
            
            // If this is a document request (page navigation)
            if (event.request.destination === 'document') {
              // First try to find the exact page in page cache
              return caches.open(PAGE_CACHE).then((pageCache) => {
                return pageCache.match(event.request).then((pageResponse) => {
                  if (pageResponse && pageResponse.status === 200) {
                    console.log('📱 Serving cached page:', event.request.url)
                    return pageResponse
                  }

                  // For dynamic routes, try to find a fallback
                  if (isDynamicRoute(event.request.url)) {
                    const fallbackRoute = findFallbackRoute(event.request.url)
                    if (fallbackRoute) {
                      console.log('🔄 Trying fallback route:', fallbackRoute)
                      return caches.match(fallbackRoute).then((fallbackResponse) => {
                        if (fallbackResponse) {
                          console.log('✅ Serving fallback route:', fallbackRoute)
                          return fallbackResponse
                        }
                        // If no fallback found, show offline page
                        return caches.match(OFFLINE_URL)
                      })
                    }
                  }

                  // For technician routes, try to find a fallback
                  if (isTechnicianRoute(event.request.url)) {
                    console.log('🔧 Trying technician fallback for:', event.request.url)
                    
                    // For technician job detail pages, try multiple fallbacks
                    if (TECHNICIAN_JOB_PATTERN.test(new URL(event.request.url).pathname)) {
                      console.log('🔧 Technician job detail page - trying fallbacks')
                      
                      // Try to find any cached technician job page first
                      return pageCache.keys().then((requests) => {
                        const technicianJobRequest = requests.find(req => 
                          TECHNICIAN_JOB_PATTERN.test(new URL(req.url).pathname)
                        )
                        
                        if (technicianJobRequest) {
                          console.log('✅ Found cached technician job page:', technicianJobRequest.url)
                          return pageCache.match(technicianJobRequest)
                        }
                        
                        // If no job page found, fallback to technician dashboard
                        return caches.match('/technician').then((technicianResponse) => {
                          if (technicianResponse) {
                            console.log('✅ Serving technician dashboard fallback')
                            return technicianResponse
                          }
                          // For technician routes, don't redirect to offline page - serve what we have
                          console.log('⚠️ No technician pages cached, but staying on current page')
                          return undefined
                        })
                      })
                    }
                    
                    // For other technician routes, try to serve the main technician page
                    return caches.match('/technician').then((technicianResponse) => {
                      if (technicianResponse) {
                        console.log('✅ Serving technician fallback:', '/technician')
                        return technicianResponse
                      }
                      // For technician routes, don't redirect to offline page - serve what we have
                      console.log('⚠️ No technician pages cached, but staying on current page')
                      return undefined
                    })
                  }
                  
                  // For technician job detail pages that don't match the pattern, try to serve technician dashboard
                  if (event.request.url.includes('/technician/jobs/')) {
                    console.log('🔧 Technician job page - trying technician dashboard fallback')
                    return caches.match('/technician').then((technicianResponse) => {
                      if (technicianResponse) {
                        console.log('✅ Serving technician dashboard fallback for job page')
                        return technicianResponse
                      }
                      console.log('⚠️ No technician pages cached')
                      return undefined
                    })
                  }
                  
                  // For other document requests, show offline page
                  console.log('📱 Serving offline page for:', event.request.url)
                  return caches.match(OFFLINE_URL)
                })
              })
            }
            
            // For non-document requests, return undefined to let browser handle it
            return undefined
          })
      })
  )
})

// Background sync for offline data
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

async function doBackgroundSync() {
  try {
    // Get all clients (tabs) and notify them to sync
    const clients = await self.clients.matchAll()
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_REQUEST',
        timestamp: Date.now()
      })
    })
  } catch (error) {
    console.error('Background sync failed:', error)
  }
}

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  } else if (event.data && event.data.type === 'GET_CACHE_VERSION') {
    // Extract version from CACHE_NAME (e.g., 'battery-tech-v15' -> 'v15')
    const version = CACHE_NAME.replace('battery-tech-', '')
    console.log('📊 Cache version requested, returning:', version)
    event.ports[0].postMessage({
      type: 'CACHE_VERSION',
      version: version
    })
  }
})

// Push notifications (for future use)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json()
    const options = {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey
      },
      actions: [
        {
          action: 'explore',
          title: 'View Job',
          icon: '/icon-192x192.png'
        },
        {
          action: 'close',
          title: 'Close',
          icon: '/icon-192x192.png'
        }
      ]
    }

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    )
  }
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'explore') {
    // Open the app
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})
