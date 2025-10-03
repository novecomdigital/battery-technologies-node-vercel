// Hook for technician job caching and offline management
import { useState, useEffect, useCallback } from 'react'
import { 
  technicianJobCache, 
  CachedTechnicianJob, 
  TechnicianCacheStatus,
  cacheTechnicianTodayJobs,
  getTechnicianTodayJobs,
  updateCachedJob
} from '@/lib/technician-job-cache'
import { precacheJobsForOffline } from '@/lib/precache-job-details'

interface UseTechnicianJobCacheProps {
  technicianId: string
  autoSync?: boolean
  syncInterval?: number
}

interface UseTechnicianJobCacheReturn {
  jobs: CachedTechnicianJob[]
  loading: boolean
  error: string | null
  cacheStatus: TechnicianCacheStatus | null
  isOnline: boolean
  lastSync: Date | null
  syncJobs: () => Promise<void>
  updateJob: (jobId: string, updates: Partial<CachedTechnicianJob>) => Promise<void>
  refreshCache: () => Promise<void>
  clearCache: () => Promise<void>
}

export function useTechnicianJobCache({ 
  technicianId, 
  autoSync = true, 
  syncInterval = 30000 
}: UseTechnicianJobCacheProps): UseTechnicianJobCacheReturn {
  const [jobs, setJobs] = useState<CachedTechnicianJob[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cacheStatus, setCacheStatus] = useState<TechnicianCacheStatus | null>(null)
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  // Initialize cache and load jobs
  useEffect(() => {
    const initializeCache = async () => {
      try {
        setLoading(true)
        setError(null)

        // Initialize the cache
        await technicianJobCache.init()

        // Load cached jobs
        const cachedJobs = await getTechnicianTodayJobs(technicianId)
        setJobs(cachedJobs)

        // Pre-cache job details for offline access if we have cached jobs
        if (cachedJobs.length > 0) {
          try {
            console.log('🔧 Pre-caching job details for offline access...')
            await precacheJobsForOffline(cachedJobs)
            console.log('✅ Job details pre-cached for offline access')
          } catch (precacheError) {
            console.warn('⚠️ Failed to pre-cache job details:', precacheError)
          }
        } else if (navigator.onLine) {
          // If no cached jobs but we're online, fetch and cache jobs immediately
          console.log('📱 No cached jobs found, fetching fresh data and pre-caching...')
          try {
            await syncJobs()
          } catch (syncError) {
            console.warn('⚠️ Failed to fetch and cache jobs on initialization:', syncError)
          }
        }

        // Load cache status
        const status = await technicianJobCache.getCacheStatus(technicianId)
        setCacheStatus(status)

      } catch (err) {
        console.err('Failed to initialize technician job cache:', err)
        setError(err instanceof Error ? err.message : 'Failed to initialize cache')
      } finally {
        setLoading(false)
      }
    }

    initializeCache()
  }, [technicianId]) // syncJobs is defined later, so we can't include it here

  // Online/offline detection
  useEffect(() => {
    const handleOnline = async () => {
      console.log('🌐 Connection restored - syncing pending changes')
      setIsOnline(true)
      
      if (autoSync) {
        // First sync any pending job updates
        await syncPendingJobUpdates()
        // Then sync the job list
        await syncJobs()
      }
    }

    const handleOffline = () => {
      console.log('📱 Connection lost - switching to offline mode')
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [autoSync]) // syncJobs and syncPendingJobUpdates are defined later, so we can't include them here

  // Sync pending job updates when coming back online
  const syncPendingJobUpdates = useCallback(async () => {
    if (!isOnline) return

    try {
      // Get all cached jobs and check if any have pending updates
      const allCachedJobs = await technicianJobCache.getTechnicianJobs(technicianId, 'all')
      
      for (const job of allCachedJobs) {
        // Check if this job was modified offline (lastCached > lastSync)
        const status = await technicianJobCache.getCacheStatus(technicianId)
        if (status && job.lastCached > (status.lastSync || 0)) {
          console.log(`🔄 Syncing pending updates for job ${job.jobNumber}`)
          
          try {
            const response = await fetch(`/api/jobs/${job.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                status: job.status,
                notes: job.notes,
                batterySerial: job.batterySerial,
                equipmentSerial: job.equipmentSerial,
                actualHours: job.actualHours,
                // Add other fields that might have been updated
              })
            })

            if (response.ok) {
              console.log(`✅ Job ${job.jobNumber} synced successfully`)
            } else {
              console.warn(`⚠️ Failed to sync job ${job.jobNumber}`)
            }
          } catch (error) {
            console.error(`❌ Error syncing job ${job.jobNumber}:`, error)
          }
        }
      }
    } catch (error) {
      console.error('Failed to sync pending job updates:', error)
    }
  }, [technicianId, isOnline])

  // Auto-sync when online
  useEffect(() => {
    if (!autoSync || !isOnline) return

    const interval = setInterval(() => {
      syncJobs()
    }, syncInterval)

    return () => clearInterval(interval)
  }, [autoSync, isOnline, syncInterval]) // syncJobs is defined later, so we can't include it here

  // Ensure pre-caching happens when jobs are available
  useEffect(() => {
    const ensurePreCaching = async () => {
      if (jobs.length > 0 && isOnline) {
        try {
          console.log('🔧 Ensuring job detail pages are pre-cached...')
          await precacheJobsForOffline(jobs)
          console.log('✅ Job detail pages pre-caching verified')
        } catch (error) {
          console.warn('⚠️ Failed to ensure pre-caching:', error)
        }
      }
    }

    // Run after a short delay to ensure jobs are loaded
    const timeoutId = setTimeout(ensurePreCaching, 1000)
    return () => clearTimeout(timeoutId)
  }, [jobs, isOnline])

  // Sync jobs from server
  const syncJobs = useCallback(async () => {
    if (!isOnline) {
      console.log('📱 Offline - skipping sync')
      return
    }

    try {
      setError(null)

      // Fetch today's jobs from server
      const today = new Date().toISOString().split('T')[0]
      const response = await fetch(`/api/jobs?assignedToId=${technicianId}&dueDate=${today}&limit=100`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch jobs from server')
      }

      const data = await response.json()
      const serverJobs = data.jobs || []

      // Convert server jobs to cached format
      const cachedJobs: CachedTechnicianJob[] = serverJobs.map((job: { id: string; jobNumber: string; description?: string; status: string; serviceType: string; dueDate?: string; startDate?: string; endDate?: string; notes?: string; actualHours?: number; estimatedHours?: number; batteryType?: string; batteryModel?: string; batterySerial?: string; equipmentType?: string; equipmentModel?: string; equipmentSerial?: string; assignedToId?: string; customer?: { id: string; name: string; phone?: string; email?: string; address?: string; city?: string; state?: string; zipCode?: string }; location?: { id: string; name: string; address?: string; city?: string; phone?: string }; assignedTo?: { id: string; name: string }; contact?: { id: string; firstName: string; lastName: string; phone?: string; email?: string; title?: string }; photos?: unknown[] }) => ({
        id: job.id,
        jobNumber: job.jobNumber,
        description: job.description || '',
        status: job.status,
        serviceType: job.serviceType,
        dueDate: job.dueDate,
        startDate: job.startDate,
        endDate: job.endDate,
        notes: job.notes,
        actualHours: job.actualHours,
        estimatedHours: job.estimatedHours,
        batteryType: job.batteryType,
        batteryModel: job.batteryModel,
        batterySerial: job.batterySerial,
        equipmentType: job.equipmentType,
        equipmentModel: job.equipmentModel,
        equipmentSerial: job.equipmentSerial,
        assignedToId: job.assignedToId,
        customer: job.customer ? {
          id: job.customer.id,
          name: job.customer.name,
          phone: job.customer.phone,
          email: job.customer.email,
          address: job.customer.address,
          city: job.customer.city,
          state: job.customer.state,
          zipCode: job.customer.zipCode
        } : {
          id: 'unknown',
          name: 'Unknown Customer',
          phone: null,
          email: null,
          address: null,
          city: null,
          state: null,
          zipCode: null
        },
        location: job.location ? {
          id: job.location.id,
          name: job.location.name,
          address: job.location.address,
          city: job.location.city,
          phone: job.location.phone
        } : null,
        contact: job.contact ? {
          id: job.contact.id,
          firstName: job.contact.firstName,
          lastName: job.contact.lastName,
          phone: job.contact.phone,
          email: job.contact.email,
          title: job.contact.title
        } : null,
        assignedTo: job.assignedTo ? {
          id: job.assignedTo.id,
          name: job.assignedTo.name
        } : null,
        photos: job.photos || [],
        lastCached: Date.now(),
        isEditable: true
      }))

      // Cache the jobs
      await cacheTechnicianTodayJobs(technicianId, cachedJobs)
      
      // Update local state
      setJobs(cachedJobs)
      
      // Update cache status
      await technicianJobCache.updateCacheStatus(technicianId, {
        lastSync: Date.now(),
        todayJobsCount: cachedJobs.length,
        totalCachedJobs: cachedJobs.length,
        isOnline: true,
        lastOfflineUpdate: null
      })

      console.log(`✅ Synced ${cachedJobs.length} jobs for technician ${technicianId}`)
      
      // Pre-cache job detail pages for offline access
      try {
        console.log('🔧 Pre-caching job detail pages for offline access...')
        const precacheResult = await precacheJobsForOffline(cachedJobs)
        console.log('✅ Job detail pages pre-cached successfully:', precacheResult)
      } catch (precacheError) {
        console.warn('⚠️ Failed to pre-cache job detail pages:', precacheError)
        // Retry pre-caching after a short delay
        setTimeout(async () => {
          try {
            console.log('🔄 Retrying job detail page pre-caching...')
            await precacheJobsForOffline(cachedJobs)
            console.log('✅ Job detail pages pre-cached on retry')
          } catch (retryError) {
            console.retryError('❌ Failed to pre-cache job detail pages on retry:', retryError)
          }
        }, 2000)
      }

    } catch (err) {
      console.err('Failed to sync jobs:', err)
      setError(err instanceof Error ? err.message : 'Failed to sync jobs')
    }
  }, [technicianId, isOnline])

  // Store individual field updates for offline sync
  const storeOfflineUpdates = useCallback(async (jobId: string, updates: Partial<CachedTechnicianJob>) => {
    try {
      // Import offline storage
      const { offlineStorage } = await import('@/lib/offline-storage')
      
      // Store each field as a separate update
      for (const [field, value] of Object.entries(updates)) {
        if (value !== undefined && value !== null) {
          const updateId = `update_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          
          await offlineStorage.saveJobUpdate({
            id: updateId,
            jobId,
            field,
            value: value as string | number | boolean | null,
            timestamp: Date.now(),
            status: 'pending',
            retryCount: 0
          })
          
          console.log(`📱 Stored offline update: ${field} = ${value}`)
        }
      }
    } catch (error) {
      console.error('Failed to store offline updates:', error)
    }
  }, [])

  // Update a specific job
  const updateJob = useCallback(async (jobId: string, updates: Partial<CachedTechnicianJob>) => {
    try {
      setError(null)

      // Update in cache
      await updateCachedJob(jobId, updates)

      // Update local state
      setJobs(prevJobs => 
        prevJobs.map(job => 
          job.id === jobId ? { ...job, ...updates, lastCached: Date.now() } : job
        )
      )

      // If online, try to sync to server
      if (isOnline) {
        try {
          const response = await fetch(`/api/jobs/${jobId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updates)
          })

          if (response.ok) {
            console.log(`✅ Job ${jobId} synced to server`)
          } else {
            console.warn(`⚠️ Failed to sync job ${jobId} to server`)
            // Store individual field updates for offline sync
            await storeOfflineUpdates(jobId, updates)
            // Mark as pending sync
            await technicianJobCache.updateCacheStatus(technicianId, {
              lastOfflineUpdate: Date.now()
            })
          }
        } catch (syncError) {
          console.warn('Failed to sync job to server:', syncError)
          // Store individual field updates for offline sync
          await storeOfflineUpdates(jobId, updates)
          // Mark as pending sync
          await technicianJobCache.updateCacheStatus(technicianId, {
            lastOfflineUpdate: Date.now()
          })
        }
      } else {
        // Store individual field updates for offline sync
        await storeOfflineUpdates(jobId, updates)
        // Mark as pending sync
        await technicianJobCache.updateCacheStatus(technicianId, {
          lastOfflineUpdate: Date.now()
        })
      }

    } catch (err) {
      console.err('Failed to update job:', err)
      setError(err instanceof Error ? err.message : 'Failed to update job')
    }
  }, [technicianId, isOnline, storeOfflineUpdates])

  // Refresh cache from local storage
  const refreshCache = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const cachedJobs = await getTechnicianTodayJobs(technicianId)
      setJobs(cachedJobs)

      const status = await technicianJobCache.getCacheStatus(technicianId)
      setCacheStatus(status)

    } catch (err) {
      console.err('Failed to refresh cache:', err)
      setError(err instanceof Error ? err.message : 'Failed to refresh cache')
    } finally {
      setLoading(false)
    }
  }, [technicianId])

  // Clear cache
  const clearCache = useCallback(async () => {
    try {
      setError(null)
      await technicianJobCache.clearTechnicianCache(technicianId)
      setJobs([])
      setCacheStatus(null)
      console.log(`🗑️ Cleared cache for technician ${technicianId}`)
    } catch (err) {
      console.err('Failed to clear cache:', err)
      setError(err instanceof Error ? err.message : 'Failed to clear cache')
    }
  }, [technicianId])

  return {
    jobs,
    loading,
    error,
    cacheStatus,
    isOnline,
    lastSync: cacheStatus?.lastSync ? new Date(cacheStatus.lastSync) : null,
    syncJobs,
    updateJob,
    refreshCache,
    clearCache
  }
}
