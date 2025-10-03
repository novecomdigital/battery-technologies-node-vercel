// Technician-specific job caching system
// This handles caching of today's jobs for each technician for offline access

export interface CachedTechnicianJob {
  id: string
  jobNumber: string
  description: string
  status: string
  serviceType: string
  dueDate: string | null
  startDate: string | null
  endDate: string | null
  notes: string | null
  actualHours: number | null
  estimatedHours: number | null
  batteryType: string | null
  batteryModel: string | null
  batterySerial: string | null
  equipmentType: string | null
  equipmentModel: string | null
  equipmentSerial: string | null
  assignedToId: string | null
  customer: {
    id: string
    name: string
    phone: string | null
    email: string | null
    address: string | null
    city: string | null
    state: string | null
    zipCode: string | null
  }
  location: {
    id: string
    name: string
    address: string | null
    city: string | null
    phone: string | null
  } | null
  contact: {
    id: string
    firstName: string
    lastName: string
    phone: string | null
    email: string | null
    title: string | null
  } | null
  assignedTo: {
    id: string
    name: string
  } | null
  photos: Array<{
    id: string
    url: string
    caption: string | null
    originalName: string
    createdAt: string
    isPrimary: boolean
  }>
  lastCached: number
  isEditable: boolean
}

export interface TechnicianCacheStatus {
  technicianId: string
  lastSync: number | null
  todayJobsCount: number
  totalCachedJobs: number
  isOnline: boolean
  lastOfflineUpdate: number | null
}

class TechnicianJobCache {
  private dbName = 'TechnicianJobCache'
  private version = 2
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    if (typeof window === 'undefined') return

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        const transaction = (event.target as IDBOpenDBRequest).transaction!

        // Create jobs store
        if (!db.objectStoreNames.contains('jobs')) {
          const jobsStore = db.createObjectStore('jobs', { keyPath: 'id' })
          jobsStore.createIndex('technicianId', 'assignedToId', { unique: false })
          jobsStore.createIndex('dueDate', 'dueDate', { unique: false })
          jobsStore.createIndex('lastCached', 'lastCached', { unique: false })
        } else {
          // Update existing store if needed
          const jobsStore = transaction.objectStore('jobs')
          if (!jobsStore.indexNames.contains('technicianId')) {
            jobsStore.createIndex('technicianId', 'assignedToId', { unique: false })
          }
        }

        // Create cache status store
        if (!db.objectStoreNames.contains('cacheStatus')) {
          db.createObjectStore('cacheStatus', { keyPath: 'technicianId' })
        }
      }
    })
  }

  async cacheTechnicianJobs(technicianId: string, jobs: CachedTechnicianJob[]): Promise<void> {
    if (!this.db) await this.init()

    const transaction = this.db!.transaction(['jobs', 'cacheStatus'], 'readwrite')
    const jobsStore = transaction.objectStore('jobs')
    const statusStore = transaction.objectStore('cacheStatus')

    // Cache each job
    for (const job of jobs) {
      job.lastCached = Date.now()
      job.isEditable = true
      await new Promise<void>((resolve, reject) => {
        const request = jobsStore.put(job)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
      })
    }

    // Update cache status
    const status: TechnicianCacheStatus = {
      technicianId,
      lastSync: Date.now(),
      todayJobsCount: jobs.length,
      totalCachedJobs: jobs.length,
      isOnline: navigator.onLine,
      lastOfflineUpdate: null
    }

    await new Promise<void>((resolve, reject) => {
      const request = statusStore.put(status)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })

    console.log(`✅ Cached ${jobs.length} jobs for technician ${technicianId}`)
  }

  async getTechnicianJobs(technicianId: string, filter: 'today' | 'all' = 'today'): Promise<CachedTechnicianJob[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['jobs'], 'readonly')
      const store = transaction.objectStore('jobs')
      const index = store.index('technicianId')
      const request = index.getAll(technicianId)

      request.onsuccess = () => {
        let jobs = request.result as CachedTechnicianJob[]
        console.log(`📱 Found ${jobs.length} jobs for technician ${technicianId} in cache`)

        if (filter === 'today') {
          const today = new Date().toISOString().split('T')[0]
          const beforeFilter = jobs.length
          jobs = jobs.filter(job => job.dueDate === today)
          console.log(`📱 Filtered to ${jobs.length} today's jobs (from ${beforeFilter} total)`)
        }

        // Sort by due date
        jobs.sort((a, b) => {
          if (!a.dueDate) return 1
          if (!b.dueDate) return -1
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        })

        console.log(`📱 Returning ${jobs.length} jobs for technician ${technicianId}`)
        resolve(jobs)
      }

      request.onerror = () => {
        console.error('❌ Error getting technician jobs:', request.error)
        reject(request.error)
      }
    })
  }

  async getJobById(jobId: string): Promise<CachedTechnicianJob | null> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['jobs'], 'readonly')
      const store = transaction.objectStore('jobs')
      const request = store.get(jobId)

      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  }

  async updateJob(jobId: string, updates: Partial<CachedTechnicianJob>): Promise<void> {
    if (!this.db) await this.init()

    const job = await this.getJobById(jobId)
    if (!job) throw new Error('Job not found in cache')

    const updatedJob = {
      ...job,
      ...updates,
      lastCached: Date.now()
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['jobs'], 'readwrite')
      const store = transaction.objectStore('jobs')
      const request = store.put(updatedJob)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getCacheStatus(technicianId: string): Promise<TechnicianCacheStatus | null> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cacheStatus'], 'readonly')
      const store = transaction.objectStore('cacheStatus')
      const request = store.get(technicianId)

      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  }

  async updateCacheStatus(technicianId: string, updates: Partial<TechnicianCacheStatus>): Promise<void> {
    if (!this.db) await this.init()

    const currentStatus = await this.getCacheStatus(technicianId)
    const updatedStatus = {
      ...currentStatus,
      technicianId,
      ...updates
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cacheStatus'], 'readwrite')
      const store = transaction.objectStore('cacheStatus')
      const request = store.put(updatedStatus)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async clearTechnicianCache(technicianId: string): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['jobs', 'cacheStatus'], 'readwrite')
      const jobsStore = transaction.objectStore('jobs')
      const statusStore = transaction.objectStore('cacheStatus')

      // Delete all jobs for this technician
      const jobsIndex = jobsStore.index('technicianId')
      const jobsRequest = jobsIndex.openCursor(IDBKeyRange.only(technicianId))

      jobsRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          cursor.delete()
          cursor.continue()
        } else {
          // Delete cache status
          const statusRequest = statusStore.delete(technicianId)
          statusRequest.onsuccess = () => resolve()
          statusRequest.onerror = () => reject(statusRequest.error)
        }
      }

      jobsRequest.onerror = () => reject(jobsRequest.error)
    })
  }

  async clearAllCache(): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['jobs', 'cacheStatus'], 'readwrite')
      const jobsStore = transaction.objectStore('jobs')
      const statusStore = transaction.objectStore('cacheStatus')

      // Clear all jobs
      const clearJobsRequest = jobsStore.clear()
      clearJobsRequest.onsuccess = () => {
        // Clear all cache status
        const clearStatusRequest = statusStore.clear()
        clearStatusRequest.onsuccess = () => {
          console.log(`🗑️ Cleared all cache data`)
          resolve()
        }
        clearStatusRequest.onerror = () => reject(clearStatusRequest.error)
      }
      clearJobsRequest.onerror = () => reject(clearJobsRequest.error)
    })
  }

  async getCacheSize(): Promise<{ jobs: number; technicians: number }> {
    if (!this.db) await this.init()

    const jobsCount = await new Promise<number>((resolve, reject) => {
      const transaction = this.db!.transaction(['jobs'], 'readonly')
      const store = transaction.objectStore('jobs')
      const request = store.count()
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })

    const techniciansCount = await new Promise<number>((resolve, reject) => {
      const transaction = this.db!.transaction(['cacheStatus'], 'readonly')
      const store = transaction.objectStore('cacheStatus')
      const request = store.count()
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })

    return { jobs: jobsCount, technicians: techniciansCount }
  }
}

// Create singleton instance
export const technicianJobCache = new TechnicianJobCache()

// Convenience functions
export async function cacheTechnicianTodayJobs(technicianId: string, jobs: CachedTechnicianJob[]): Promise<void> {
  return technicianJobCache.cacheTechnicianJobs(technicianId, jobs)
}

export async function getTechnicianTodayJobs(technicianId: string): Promise<CachedTechnicianJob[]> {
  return technicianJobCache.getTechnicianJobs(technicianId, 'today')
}

export async function getTechnicianAllJobs(technicianId: string): Promise<CachedTechnicianJob[]> {
  return technicianJobCache.getTechnicianJobs(technicianId, 'all')
}

export async function updateCachedJob(jobId: string, updates: Partial<CachedTechnicianJob>): Promise<void> {
  return technicianJobCache.updateJob(jobId, updates)
}

export async function getCachedJob(jobId: string): Promise<CachedTechnicianJob | null> {
  return technicianJobCache.getJobById(jobId)
}
