// Pre-cache job detail pages for offline access
// This ensures that when jobs are loaded, their detail pages are also cached

export async function precacheJobDetailPages(jobIds: string[], baseUrl: string = '') {
  if (typeof window === 'undefined') return
  
  try {
    console.log('🔧 Pre-caching job detail pages for offline access...')
    console.log('📱 Job IDs to pre-cache:', jobIds)
    console.log('📱 Base URL:', baseUrl || window.location.origin)
    
    // Get the service worker registration
    const registration = await navigator.serviceWorker.ready
    if (!registration) {
      console.log('⚠️ Service worker not ready for pre-caching')
      return
    }
    
    // Also ensure we have access to caches API
    if (!('caches' in window)) {
      console.log('⚠️ Cache API not available for pre-caching')
      return
    }
    
    // Cache each job detail page
    const actualBaseUrl = baseUrl || window.location.origin
    const cachePromises = jobIds.map(async (jobId) => {
      try {
        const jobDetailUrl = `${actualBaseUrl}/technician/jobs/${jobId}`
        console.log('🔧 Pre-caching job detail page:', jobDetailUrl)
        
        // Fetch the page to cache it
        console.log('🌐 Pre-caching: Fetching job detail page:', jobDetailUrl)
        const response = await fetch(jobDetailUrl, {
          method: 'GET',
          headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Cache-Control': 'no-cache'
          }
        })
        
        console.log('🌐 Pre-caching: Response status:', response.status, 'for', jobDetailUrl)
        
        if (response.ok) {
          console.log('💾 Pre-caching: Caching job detail page in both caches:', jobDetailUrl)
          
          // Manually cache the response in the page cache
          const pageCache = await caches.open('battery-tech-pages-v116')
          await pageCache.put(jobDetailUrl, response.clone())
          console.log('✅ Pre-caching: Cached in page cache:', jobDetailUrl)
          
          // Also cache in the main cache for better offline support
          const mainCache = await caches.open('battery-tech-v116')
          await mainCache.put(jobDetailUrl, response.clone())
          console.log('✅ Pre-caching: Cached in main cache:', jobDetailUrl)
          
          // Verify the page was actually cached
          const cachedPage = await pageCache.match(jobDetailUrl)
          if (cachedPage) {
            console.log('✅ Pre-caching: Verification successful - page found in cache:', jobDetailUrl)
          } else {
            console.log('❌ Pre-caching: Verification failed - page not found in cache:', jobDetailUrl)
          }
          
          console.log('✅ Successfully pre-cached job detail page:', jobDetailUrl)
          return { jobId, success: true }
        } else {
          console.log('❌ Failed to pre-cache job detail page:', jobDetailUrl, response.status)
          return { jobId, success: false, error: `HTTP ${response.status}` }
        }
      } catch (error) {
        console.log('❌ Error pre-caching job detail page:', jobId, error)
        return { jobId, success: false, error: error instanceof Error ? error.message : 'Unknown error' }
      }
    })
    
    const results = await Promise.allSettled(cachePromises)
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length
    const failed = results.filter(r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)).length
    
    console.log(`🔧 Pre-caching complete: ${successful} successful, ${failed} failed`)
    
    return {
      total: jobIds.length,
      successful,
      failed,
      results: results.map(r => r.status === 'fulfilled' ? r.value : { success: false, error: 'Promise rejected' })
    }
    
  } catch (error) {
    console.error('❌ Error in pre-caching job detail pages:', error)
    return {
      total: jobIds.length,
      successful: 0,
      failed: jobIds.length,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Helper function to extract job IDs from cached jobs
export function extractJobIdsFromCachedJobs(cachedJobs: { id: string }[]): string[] {
  return cachedJobs.map(job => job.id).filter(Boolean)
}

// Pre-cache job detail pages when jobs are loaded
export async function precacheJobsForOffline(jobs: { id: string }[], baseUrl: string = '') {
  if (!jobs || jobs.length === 0) {
    console.log('📱 No jobs to pre-cache')
    return
  }
  
  const jobIds = extractJobIdsFromCachedJobs(jobs)
  console.log(`🔧 Pre-caching ${jobIds.length} job detail pages for offline access`)
  
  return await precacheJobDetailPages(jobIds, baseUrl)
}
