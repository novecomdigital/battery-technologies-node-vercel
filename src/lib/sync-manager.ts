import { offlineStorage, OfflinePhoto, OfflineJobUpdate, OfflinePhotoDelete } from './offline-storage'

export interface SyncStatus {
  isOnline: boolean
  isSyncing: boolean
  pendingPhotos: number
  pendingUpdates: number
  pendingPhotoDeletions: number
  lastSyncTime: number | null
  syncErrors: string[]
}

class SyncManager {
  private isOnline = navigator.onLine
  private isSyncing = false
  private syncListeners: ((status: SyncStatus) => void)[] = []
  private syncInterval: NodeJS.Timeout | null = null
  private maxRetries = 3

  constructor() {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      this.isOnline = navigator.onLine
      this.setupEventListeners()
      this.startPeriodicSync()
      
      // Check for pending data on startup and sync if online
      setTimeout(() => {
        this.checkAndSyncOnStartup()
      }, 2000) // Wait 2 seconds for app to fully initialize
      
      // Set up global sync trigger
      this.setupGlobalSyncTrigger()
    } else {
      // Server-side rendering - assume online
      this.isOnline = true
    }
  }

  private setupEventListeners(): void {
    // Only set up event listeners in browser environment
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      // Enhanced online/offline detection
      window.addEventListener('online', () => {
        console.log('🌐 Online event detected - triggering sync')
        this.isOnline = true
        this.notifyListeners()
        // Add a small delay to ensure network is fully available
        setTimeout(() => {
          console.log('🔄 Triggering sync after coming online...')
          this.syncPendingData()
        }, 1000)
      })

      window.addEventListener('offline', () => {
        console.log('📴 Offline event detected')
        this.isOnline = false
        this.notifyListeners()
      })

      // Listen for visibility change to sync when app becomes active
      if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
        document.addEventListener('visibilitychange', () => {
          if (!document.hidden) {
            console.log('👁️ Page became visible - checking online status and triggering sync')
            // Check if we're actually online when the page becomes visible
            this.checkOnlineStatus().then(isOnline => {
              if (isOnline) {
                console.log('🔄 Page visible and online - triggering immediate sync')
                // Trigger sync immediately when page becomes visible
                this.syncPendingData()
                
                // Also trigger another sync after a short delay to catch any missed updates
                setTimeout(() => {
                  console.log('🔄 Page visible - secondary sync check')
                  this.syncPendingData()
                }, 2000)
              } else {
                console.log('📴 Page visible but offline - skipping sync')
              }
            })
          }
        })
      }

      // Additional event listeners for better sync reliability
      window.addEventListener('focus', () => {
        console.log('🎯 Window focused - checking online status and triggering sync')
        this.checkOnlineStatus().then(isOnline => {
          if (isOnline) {
            console.log('🔄 Window focused and online - triggering sync')
            this.syncPendingData()
          } else {
            console.log('📴 Window focused but offline - skipping sync')
          }
        })
      })

      // Listen for storage events (when data is added to IndexedDB)
      window.addEventListener('storage', (e) => {
        if (e.key === 'offline-photos') {
          console.log('💾 Storage event detected - checking online status and triggering sync')
          this.checkOnlineStatus().then(isOnline => {
            if (isOnline) {
              console.log('🔄 Storage event and online - triggering sync')
              this.syncPendingData()
            } else {
              console.log('📴 Storage event but offline - skipping sync')
            }
          })
        }
      })

      // Listen for custom sync events
      window.addEventListener('battery-tech-sync', () => {
        console.log('🔄 Custom sync event received')
        this.checkOnlineStatus().then(isOnline => {
          if (isOnline) {
            console.log('🔄 Custom sync event and online - triggering sync')
            this.syncPendingData()
          } else {
            console.log('📴 Custom sync event but offline - skipping sync')
          }
        })
      })

      // Listen for job update events
      window.addEventListener('job-updated-offline', () => {
        console.log('📝 Job updated offline - checking online status and triggering sync')
        this.checkOnlineStatus().then(isOnline => {
          if (isOnline) {
            console.log('🔄 Job update and online - triggering sync')
            this.syncPendingData()
          } else {
            console.log('📴 Job update but offline - skipping sync')
          }
        })
      })
    }
  }

  private startPeriodicSync(): void {
    // Only start periodic sync in browser environment
    if (typeof window !== 'undefined') {
      // Sync every 15 seconds when online (more frequent for better responsiveness)
      this.syncInterval = setInterval(async () => {
        if (!this.isSyncing) {
          // Check online status first
          const isOnline = await this.checkOnlineStatus()
          if (isOnline) {
            console.log('🔄 Periodic sync triggered')
            this.syncPendingData()
          }
        }
      }, 15000) // Reduced from 30 seconds to 15 seconds
    }
  }

  private async checkAndSyncOnStartup(): Promise<void> {
    console.log('🚀 Checking for pending data on startup...')
    
    if (!this.isOnline) {
      console.log('📴 Offline on startup - skipping sync')
      return
    }

    try {
      // Ensure offline storage is initialized before checking for pending data
      await offlineStorage.init()
      console.log('✅ Offline storage initialized for startup check')
      
      // Check if we have any pending data
      const pendingPhotos = await offlineStorage.getPendingPhotos()
      const pendingUpdates = await offlineStorage.getPendingJobUpdates()
      const pendingDeletions = await offlineStorage.getPendingPhotoDeletions()
      
      // Also check offline editing manager
      const { offlineEditingManager } = await import('./offline-editing-manager')
      await offlineEditingManager.init()
      const allEdits = await offlineEditingManager.getAllPendingEdits()
      const allPhotos = await offlineEditingManager.getAllPendingPhotoUploads()
      
      const totalPending = pendingPhotos.length + pendingUpdates.length + pendingDeletions.length + allEdits.length + allPhotos.length
      
      console.log(`📊 Startup pending data check:`, {
        offlineStorage: {
          photos: pendingPhotos.length,
          updates: pendingUpdates.length,
          deletions: pendingDeletions.length
        },
        offlineEditingManager: {
          edits: allEdits.length,
          photos: allPhotos.length
        },
        total: totalPending
      })
      
      if (totalPending > 0) {
        console.log(`🔄 Found ${totalPending} pending items on startup - triggering sync`)
        await this.syncPendingData()
      } else {
        console.log('✅ No pending data found on startup')
      }
    } catch (error) {
      console.error('❌ Error checking pending data on startup:', error)
    }
  }

  private setupGlobalSyncTrigger(): void {
    // Set up a global sync trigger that works from anywhere in the app
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      // Listen for custom sync events
      window.addEventListener('trigger-sync', () => {
        console.log('🔄 Global sync triggered')
        this.syncPendingData()
      })
      
      // Listen for page visibility changes to trigger sync
      if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
        document.addEventListener('visibilitychange', () => {
          if (!document.hidden && this.isOnline) {
            console.log('👁️ Page became visible - triggering global sync')
            setTimeout(() => {
              this.syncPendingData()
            }, 1000)
          }
        })
      }
      
      // Listen for page focus to trigger sync
      window.addEventListener('focus', () => {
        if (this.isOnline) {
          console.log('🎯 Window focused - triggering global sync')
          setTimeout(() => {
            this.syncPendingData()
          }, 500)
        }
      })
      
      console.log('✅ Global sync triggers set up')
    }
  }

  private async notifyListeners(): Promise<void> {
    const status = await this.getSyncStatus()
    this.syncListeners.forEach(listener => listener(status))
    
    // Also dispatch a custom event for immediate UI updates
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('photoStatusChanged', {
        detail: { status }
      })
      window.dispatchEvent(event)
    }
  }

  // Method to notify when job data has been updated
  public notifyJobUpdate(jobId: string, updateData: Record<string, unknown>): void {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('jobDataUpdated', {
        detail: { jobId, updateData, timestamp: Date.now() }
      })
      window.dispatchEvent(event)
      console.log('📢 Job update event dispatched:', { jobId, updateData })
    }
  }

  private async checkOnlineStatus(): Promise<boolean> {
    try {
      // First check navigator.onLine
      if (!navigator.onLine) {
        console.log('📴 navigator.onLine reports offline')
        this.isOnline = false
        return false
      }

      // Test actual network connectivity with a lightweight request
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout
      
      try {
        const response = await fetch('/api/user/profile', {
          method: 'HEAD', // Use HEAD request for faster response
          credentials: 'include',
          signal: controller.signal,
          cache: 'no-cache'
        })
        
        clearTimeout(timeoutId)
        
        if (response.ok || response.status === 401) {
          // 401 means we're online but not authenticated, which is still "online"
          console.log('✅ Network connectivity confirmed')
          this.isOnline = true
          return true
        } else {
          console.log(`⚠️ Network check returned status ${response.status}`)
          this.isOnline = false
          return false
        }
      } catch (error) {
        clearTimeout(timeoutId)
        if (error instanceof Error && error.name === 'AbortError') {
          console.log('⏰ Network check timed out')
        } else {
          console.log('❌ Network check failed:', error)
        }
        this.isOnline = false
        return false
      }
    } catch (error) {
      console.log('❌ Online status check failed:', error)
      this.isOnline = false
      return false
    }
  }

  private async checkAuthentication(): Promise<boolean> {
    try {
      // Make a simple authenticated request to check if the user is still logged in
      const response = await fetch('/api/user/profile', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (response.status === 401) {
        console.log('🔐 Authentication check failed - user not authenticated')
        return false
      }
      
      if (response.ok) {
        console.log('✅ Authentication check passed - user is authenticated')
        return true
      }
      
      console.log(`⚠️ Authentication check returned status ${response.status}`)
      return false
    } catch (error) {
      console.error('❌ Authentication check failed with error:', error)
      return false
    }
  }

  private showAuthenticationError(): void {
    // Only show notification in browser environment and if debug mode is enabled
    if (typeof window !== 'undefined') {
      // Check if debug mode is enabled
      const debugEnabled = localStorage.getItem('debugEnabled') === 'true'
      if (!debugEnabled) {
        console.log('🔐 Authentication error occurred but debug mode is disabled - notification hidden')
        return
      }

      // Create a simple notification element
      const notification = document.createElement('div')
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #fef3cd;
        border: 1px solid #fecaca;
        border-radius: 8px;
        padding: 16px;
        max-width: 400px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        color: #92400e;
      `
      
      notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="font-size: 18px;">🔐</div>
          <div>
            <div style="font-weight: 600; margin-bottom: 4px;">Authentication Required</div>
            <div>Your session has expired. Please refresh the page to continue syncing your offline changes.</div>
          </div>
          <button onclick="this.parentElement.parentElement.remove()" style="
            background: none;
            border: none;
            font-size: 18px;
            cursor: pointer;
            color: #92400e;
            padding: 0;
            margin-left: 8px;
          ">×</button>
        </div>
      `
      
      document.body.appendChild(notification)
      
      // Auto-remove after 10 seconds
      setTimeout(() => {
        if (notification.parentElement) {
          notification.remove()
        }
      }, 10000)
    }
  }

  async getSyncStatus(): Promise<SyncStatus> {
    try {
      // Ensure database is initialized before getting storage size
      await offlineStorage.init()
      const storageSize = await offlineStorage.getStorageSize()
      
      return {
        isOnline: this.isOnline,
        isSyncing: this.isSyncing,
        pendingPhotos: storageSize.photos,
        pendingUpdates: storageSize.updates,
        pendingPhotoDeletions: storageSize.photoDeletions,
        lastSyncTime: this.getLastSyncTime(),
        syncErrors: []
      }
    } catch (error) {
      console.error('Failed to get sync status:', error)
      return {
        isOnline: this.isOnline,
        isSyncing: this.isSyncing,
        pendingPhotos: 0,
        pendingUpdates: 0,
        pendingPhotoDeletions: 0,
        lastSyncTime: this.getLastSyncTime(),
        syncErrors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }
  }

  addSyncListener(listener: (status: SyncStatus) => void): void {
    this.syncListeners.push(listener)
  }

  removeSyncListener(listener: (status: SyncStatus) => void): void {
    const index = this.syncListeners.indexOf(listener)
    if (index > -1) {
      this.syncListeners.splice(index, 1)
    }
  }

  async syncPendingData(): Promise<void> {
    if (!this.isOnline || this.isSyncing) {
      console.log(`⏸️ Sync skipped - online: ${this.isOnline}, syncing: ${this.isSyncing}`)
      return
    }

    console.log('🔄 Starting sync of pending data...')
    this.isSyncing = true
    await this.notifyListeners()

    try {
      // Ensure databases are initialized before checking for pending data
      await offlineStorage.init()
      console.log('✅ Offline storage initialized for sync')
      
      const { offlineEditingManager } = await import('./offline-editing-manager')
      await offlineEditingManager.init()
      console.log('✅ Offline editing manager initialized for sync')
      
      // Check if user is still authenticated before attempting sync
      const isAuthenticated = await this.checkAuthentication()
      if (!isAuthenticated) {
        console.log('🔐 User not authenticated - skipping sync. Please refresh the page to re-authenticate.')
        
        // Show user-friendly notification
        this.showAuthenticationError()
        
        this.isSyncing = false
        await this.notifyListeners()
        return
      }
      
      // Check if we have any pending data first
      const pendingPhotos = await offlineStorage.getPendingPhotos()
      const pendingUpdates = await offlineStorage.getPendingJobUpdates()
      const pendingDeletions = await offlineStorage.getPendingPhotoDeletions()
      
      console.log(`📊 Pending data: ${pendingPhotos.length} photos, ${pendingUpdates.length} updates, ${pendingDeletions.length} deletions`)
      
      if (pendingPhotos.length === 0 && pendingUpdates.length === 0 && pendingDeletions.length === 0) {
        console.log('✅ No pending data to sync')
        return
      }

      await Promise.all([
        this.syncPendingPhotos(),
        this.syncPendingJobUpdates(),
        this.syncPendingPhotoDeletions()
      ])
      
      this.setLastSyncTime(Date.now())
      console.log('✅ Sync completed successfully')
    } catch (error) {
      console.error('❌ Sync failed:', error)
    } finally {
      this.isSyncing = false
      await this.notifyListeners()
    }
  }

  private async syncPendingPhotos(): Promise<void> {
    // Get both pending and failed photos to retry
    const pendingPhotos = await offlineStorage.getPendingPhotos()
    const failedPhotos = await offlineStorage.getFailedPhotos()
    const allPhotos = [...pendingPhotos, ...failedPhotos]
    
    console.log(`📸 Found ${allPhotos.length} photos to sync (${pendingPhotos.length} pending, ${failedPhotos.length} failed)`)
    
    // Reset retry counts for failed photos when coming back online
    for (const photo of failedPhotos) {
      if (photo.retryCount >= this.maxRetries) {
        console.log(`🔄 Resetting retry count for photo ${photo.id} (was ${photo.retryCount})`)
        await offlineStorage.resetPhotoRetryCount(photo.id)
      }
    }
    
    // Debug: Show photo details
    allPhotos.forEach(photo => {
      console.log(`📸 Photo ${photo.id}: status=${photo.status}, jobId=${photo.jobId}, retryCount=${photo.retryCount}`)
    })
    
    for (const photo of allPhotos) {
      if (photo.retryCount >= this.maxRetries) {
        console.log(`❌ Photo ${photo.id} exceeded max retries, skipping`)
        continue
      }

      try {
        console.log(`🔄 Uploading photo ${photo.id} (attempt ${photo.retryCount + 1}/${this.maxRetries})...`)
        await offlineStorage.updatePhotoStatus(photo.id, 'uploading')
        
        // Notify listeners about status change to uploading
        await this.notifyListeners()
        
        await this.uploadPhoto(photo)
        console.log(`✅ Photo ${photo.id} uploaded successfully`)
        await offlineStorage.updatePhotoStatus(photo.id, 'uploaded')
        
        // Notify listeners about successful upload
        await this.notifyListeners()
        
        // Wait a moment for UI to update before deleting
        console.log(`⏳ Waiting for UI to update before removing photo ${photo.id} from local storage`)
        setTimeout(async () => {
          try {
            console.log(`🗑️ Deleting photo ${photo.id} from local storage`)
            await offlineStorage.deletePhoto(photo.id)
            console.log(`✅ Photo ${photo.id} completely removed from local storage`)
            
            // Notify listeners after deletion
            await this.notifyListeners()
          } catch (deleteError) {
            console.deleteError(`❌ Failed to delete photo ${photo.id} from local storage:`, deleteError)
          }
        }, 2000) // 2 second delay to allow UI to refresh
      } catch (error) {
        console.error(`❌ Photo upload failed for ${photo.id}:`, error)
        await offlineStorage.updatePhotoStatus(photo.id, 'failed')
        console.log(`❌ Photo ${photo.id} marked as failed`)
        
        // Notify listeners about failure
        await this.notifyListeners()
      }
    }
  }

  private async syncPendingJobUpdates(): Promise<void> {
    // Sync from both systems to ensure all job updates are processed
    
    // 1. Sync from offline-storage system (individual field updates)
    const pendingUpdates = await offlineStorage.getPendingJobUpdates()
    console.log(`📝 Found ${pendingUpdates.length} pending job updates to sync (offline-storage)`)
    
    for (const update of pendingUpdates) {
      if (update.retryCount >= this.maxRetries) {
        console.log(`❌ Job update ${update.id} exceeded max retries, marking as failed`)
        await offlineStorage.updateJobUpdateStatus(update.id, 'failed')
        continue
      }

      try {
        console.log(`🔄 Syncing job update ${update.id} (attempt ${update.retryCount + 1}/${this.maxRetries})`)
        await offlineStorage.updateJobUpdateStatus(update.id, 'syncing')
        await this.syncJobUpdate(update)
        await offlineStorage.updateJobUpdateStatus(update.id, 'synced')
        console.log(`✅ Job update ${update.id} synced successfully`)
        
        // Notify other pages about the job update
        this.notifyJobUpdate(update.jobId, { [update.field]: update.value })
        
        // Note: We don't delete job updates as they might be needed for conflict resolution
      } catch (error) {
        console.error(`❌ Job update ${update.id} sync failed:`, error)
        await offlineStorage.updateJobUpdateStatus(update.id, 'failed')
      }
    }

    // 2. Sync from offline-editing-manager system (complete job updates)
    try {
      const { offlineEditingManager } = await import('./offline-editing-manager')
      console.log(`🔄 Syncing from offline editing manager...`)
      await offlineEditingManager.syncAllPendingChanges()
      console.log(`✅ Offline editing manager sync completed`)
    } catch (error) {
      console.error(`❌ Offline editing manager sync failed:`, error)
    }
  }

  private async uploadPhoto(photo: OfflinePhoto): Promise<void> {
    const formData = new FormData()
    
    // Handle both File objects and serialized file data
    if (photo.file instanceof File) {
      formData.append('file', photo.file)
    } else {
      // Convert serialized file data back to File object
      const file = new File([photo.file.buffer], photo.file.name, {
        type: photo.file.type,
        lastModified: photo.file.lastModified
      })
      formData.append('file', file)
    }
    
    formData.append('jobId', photo.jobId)
    formData.append('caption', photo.caption || '')
    formData.append('isPrimary', photo.isPrimary.toString())

    console.log(`📤 Uploading photo to /api/jobs/${photo.jobId}/photos`)
    console.log(`📤 File size: ${photo.file instanceof File ? photo.file.size : photo.file.size} bytes`)
    console.log(`📤 File type: ${photo.file instanceof File ? photo.file.type : photo.file.type}`)

    // Check if we have authentication cookies
    const hasCookies = document.cookie.includes('__session') || document.cookie.includes('__clerk')
    console.log(`📤 Has auth cookies: ${hasCookies}`)
    console.log(`📤 Cookies: ${document.cookie}`)

    const response = await fetch(`/api/jobs/${photo.jobId}/photos`, {
      method: 'POST',
      body: formData,
      credentials: 'include' // Include authentication cookies
    })

    console.log(`📤 Upload response status: ${response.status}`)
    console.log(`📤 Upload response ok: ${response.ok}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`📤 Upload error response: ${errorText}`)
      
      // If it's a 401 error, try to refresh the page to re-authenticate
      if (response.status === 401) {
        console.log(`🔐 Authentication failed - user may need to re-login`)
        throw new Error(`Authentication failed: Please refresh the page and try again`)
      }
      
      throw new Error(`Photo upload failed: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const result = await response.json()
    console.log(`📤 Upload successful:`, result)
  }

  private async syncJobUpdate(update: OfflineJobUpdate): Promise<void> {
    console.log(`🔄 Syncing LOCAL job update: ${update.field} = ${update.value} for job ${update.jobId}`)
    console.log(`📱 PRIORITIZING LOCAL CHANGES over server data (offline-first behavior)`)
    
    const updatePayload = {
      [update.field]: update.value,
      offlineUpdate: true,
      timestamp: update.timestamp
    }
    
    console.log(`📤 Sending job update payload:`, updatePayload)
    
    const response = await fetch(`/api/jobs/${update.jobId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatePayload),
      credentials: 'include' // Include authentication cookies
    })

    console.log(`📤 Job update response status: ${response.status}`)
    console.log(`📤 Job update response ok: ${response.ok}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`📤 Job update error response: ${errorText}`)
      
      // If it's a 401 error, try to refresh the page to re-authenticate
      if (response.status === 401) {
        console.log(`🔐 Authentication failed - user may need to re-login`)
        throw new Error(`Authentication failed: Please refresh the page and try again`)
      }
      
      throw new Error(`Job update failed: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const result = await response.json()
    console.log(`✅ LOCAL job update successfully pushed to server:`, result)
  }

  private async syncPendingPhotoDeletions(): Promise<void> {
    const pendingDeletions = await offlineStorage.getPendingPhotoDeletions()
    console.log(`🗑️ Found ${pendingDeletions.length} pending photo deletions to sync`)
    
    for (const photoDelete of pendingDeletions) {
      if (photoDelete.retryCount >= this.maxRetries) {
        console.log(`❌ Photo deletion ${photoDelete.id} exceeded max retries, marking as failed`)
        await offlineStorage.updatePhotoDeleteStatus(photoDelete.id, 'failed')
        continue
      }

      try {
        console.log(`🔄 Deleting photo ${photoDelete.photoId} from job ${photoDelete.jobId}...`)
        await offlineStorage.updatePhotoDeleteStatus(photoDelete.id, 'syncing')
        await this.deletePhoto(photoDelete)
        console.log(`✅ Photo ${photoDelete.photoId} deleted successfully`)
        await offlineStorage.updatePhotoDeleteStatus(photoDelete.id, 'synced')
        console.log(`🗑️ Removing photo deletion ${photoDelete.id} from local storage`)
        await offlineStorage.deletePhotoDelete(photoDelete.id)
        console.log(`✅ Photo deletion ${photoDelete.id} completely removed from local storage`)
      } catch (error) {
        console.error(`❌ Photo deletion failed for ${photoDelete.id}:`, error)
        await offlineStorage.updatePhotoDeleteStatus(photoDelete.id, 'failed')
      }
    }
  }

  private async deletePhoto(photoDelete: OfflinePhotoDelete): Promise<void> {
    const response = await fetch(`/api/jobs/${photoDelete.jobId}/photos?photoId=${photoDelete.photoId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include' // Include authentication cookies
    })

    console.log(`🗑️ Delete response status: ${response.status}`)
    console.log(`🗑️ Delete response ok: ${response.ok}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`🗑️ Delete error response: ${errorText}`)
      
      // If it's a 401 error, try to refresh the page to re-authenticate
      if (response.status === 401) {
        console.log(`🔐 Authentication failed - user may need to re-login`)
        throw new Error(`Authentication failed: Please refresh the page and try again`)
      }
      
      throw new Error(`Photo deletion failed: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const result = await response.json()
    console.log(`🗑️ Delete successful:`, result)
  }

  private getLastSyncTime(): number | null {
    const stored = localStorage.getItem('lastSyncTime')
    return stored ? parseInt(stored, 10) : null
  }

  private setLastSyncTime(timestamp: number): void {
    localStorage.setItem('lastSyncTime', timestamp.toString())
  }

  // Public methods for manual sync
  async forceSync(): Promise<void> {
    console.log('🔄 Force sync requested')
    await this.syncPendingData()
  }

  async retryFailedPhotos(): Promise<void> {
    console.log('🔄 Retrying failed photos...')
    await this.syncPendingPhotos()
  }

  async retryFailedJobUpdates(): Promise<void> {
    console.log('🔄 Retrying failed job updates...')
    await this.syncPendingJobUpdates()
  }

  async checkAndSyncNow(): Promise<void> {
    console.log('🔄 Manual sync check requested...')
    
    if (!this.isOnline) {
      console.log('📴 Not online - skipping sync check')
      return
    }

    if (this.isSyncing) {
      console.log('⏳ Already syncing - skipping duplicate request')
      return
    }

    try {
      await this.syncPendingData()
    } catch (error) {
      console.error('❌ Error during manual sync check:', error)
    }
  }

  // Debug function to check offline storage contents
  async debugOfflineStorage(): Promise<void> {
    try {
      console.log('🔍 Debugging offline storage contents...')
      
      const pendingPhotos = await offlineStorage.getPendingPhotos()
      const pendingUpdates = await offlineStorage.getPendingJobUpdates()
      const pendingDeletions = await offlineStorage.getPendingPhotoDeletions()
      
      console.log('📊 Offline Storage Contents:', {
        pendingPhotos: pendingPhotos.length,
        pendingUpdates: pendingUpdates.length,
        pendingDeletions: pendingDeletions.length
      })
      
      if (pendingUpdates.length > 0) {
        console.log('📝 Pending Job Updates:', pendingUpdates.map(update => ({
          id: update.id,
          jobId: update.jobId,
          field: update.field,
          value: update.value,
          status: update.status,
          retryCount: update.retryCount
        })))
      }
      
      // Also check offline editing manager
      const { offlineEditingManager } = await import('./offline-editing-manager')
      const allEdits = await offlineEditingManager.getAllPendingEdits()
      const allPhotos = await offlineEditingManager.getAllPendingPhotoUploads()
      
      console.log('📊 Offline Editing Manager Contents:', {
        pendingEdits: allEdits.length,
        pendingPhotos: allPhotos.length
      })
      
      if (allEdits.length > 0) {
        console.log('📝 Pending Edits:', allEdits.map(edit => ({
          id: edit.id,
          jobId: edit.jobId,
          type: edit.type,
          data: edit.data,
          status: edit.status,
          retryCount: edit.retryCount
        })))
      }
      
    } catch (error) {
      console.error('❌ Failed to debug offline storage:', error)
    }
  }

  // Global method to trigger sync from anywhere
  triggerGlobalSync(): void {
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      console.log('🔄 Triggering global sync...')
      window.dispatchEvent(new CustomEvent('trigger-sync'))
    } else {
      console.warn('⚠️ Cannot trigger global sync: window.dispatchEvent not available')
    }
  }

  // Check if there are any pending items
  async hasPendingItems(): Promise<boolean> {
    const pendingPhotos = await offlineStorage.getPendingPhotos()
    const pendingUpdates = await offlineStorage.getPendingJobUpdates()
    const pendingDeletions = await offlineStorage.getPendingPhotoDeletions()
    
    return pendingPhotos.length > 0 || pendingUpdates.length > 0 || pendingDeletions.length > 0
  }

  // Get detailed sync status
  async getDetailedSyncStatus(): Promise<{
    pendingPhotos: number
    pendingUpdates: number
    pendingDeletions: number
    failedPhotos: number
    failedUpdates: number
    failedDeletions: number
  }> {
    const pendingPhotos = await offlineStorage.getPendingPhotos()
    const pendingUpdates = await offlineStorage.getPendingJobUpdates()
    const pendingDeletions = await offlineStorage.getPendingPhotoDeletions()
    
    // Count failed items
    const failedPhotos = pendingPhotos.filter(p => p.status === 'failed').length
    const failedUpdates = pendingUpdates.filter(u => u.status === 'failed').length
    const failedDeletions = pendingDeletions.filter(d => d.status === 'failed').length
    
    return {
      pendingPhotos: pendingPhotos.length,
      pendingUpdates: pendingUpdates.length,
      pendingDeletions: pendingDeletions.length,
      failedPhotos,
      failedUpdates,
      failedDeletions
    }
  }

  async clearFailedItems(): Promise<void> {
    // This would clear items that have exceeded max retries
    // Implementation depends on your specific requirements
  }

  async savePhotoDeletionForOfflineSync(jobId: string, photoId: string): Promise<void> {
    const photoDelete: OfflinePhotoDelete = {
      id: `delete_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      jobId,
      photoId,
      timestamp: Date.now(),
      status: 'pending',
      retryCount: 0
    }

    await offlineStorage.savePhotoDelete(photoDelete)
    console.log(`💾 Photo deletion saved for offline sync: ${photoId}`)
  }

  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
    }
    this.syncListeners = []
  }
}

export const syncManager = new SyncManager()
