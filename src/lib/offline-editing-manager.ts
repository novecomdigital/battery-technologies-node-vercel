// Offline Editing Manager
// This module handles offline editing with background sync when online

export interface OfflineEdit {
  id: string
  jobId: string
  type: 'job_update' | 'photo_upload' | 'photo_delete'
  data: Record<string, unknown>
  timestamp: number
  retryCount: number
  maxRetries: number
  status: 'pending' | 'syncing' | 'completed' | 'failed'
}

export interface OfflinePhotoUpload {
  id: string
  jobId: string
  file: {
    name: string
    type: string
    size: number
    lastModified: number
    buffer: ArrayBuffer
  }
  caption: string
  isPrimary: boolean
  timestamp: number
  status: 'pending' | 'uploading' | 'completed' | 'failed'
  uploadProgress: number
}

export interface SyncStatus {
  isOnline: boolean
  pendingUpdates: number
  pendingPhotos: number
  lastSync: Date | null
  isSyncing: boolean
}

class OfflineEditingManager {
  private dbName = 'OfflineEditingDB'
  private version = 1
  private db: IDBDatabase | null = null
  private initPromise: Promise<void> | null = null
  private syncListeners: ((status: SyncStatus) => void)[] = []

  async init(): Promise<void> {
    // Return existing promise if already initializing
    if (this.initPromise) {
      return this.initPromise
    }

    // Return immediately if already initialized
    if (this.db) {
      return Promise.resolve()
    }

    if (typeof window === 'undefined') {
      throw new Error('IndexedDB not available in server environment')
    }

    this.initPromise = this._init()
    return this.initPromise
  }

  private async _init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => {
        console.error('❌ Failed to open OfflineEditingDB:', request.error)
        this.initPromise = null
        reject(request.error)
      }

      request.onsuccess = () => {
        this.db = request.result
        console.log('✅ Offline editing database initialized')
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create offline edits store
        if (!db.objectStoreNames.contains('offlineEdits')) {
          const editsStore = db.createObjectStore('offlineEdits', { keyPath: 'id' })
          editsStore.createIndex('jobId', 'jobId', { unique: false })
          editsStore.createIndex('status', 'status', { unique: false })
          editsStore.createIndex('timestamp', 'timestamp', { unique: false })
        }

        // Create photo uploads store
        if (!db.objectStoreNames.contains('photoUploads')) {
          const photosStore = db.createObjectStore('photoUploads', { keyPath: 'id' })
          photosStore.createIndex('jobId', 'jobId', { unique: false })
          photosStore.createIndex('status', 'status', { unique: false })
        }
      }
    })
  }

  // Add an offline edit
  async addOfflineEdit(jobId: string, type: OfflineEdit['type'], data: Record<string, unknown>): Promise<string> {
    if (!this.db) await this.init()

    const edit: OfflineEdit = {
      id: `edit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      jobId,
      type,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: 3,
      status: 'pending'
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offlineEdits'], 'readwrite')
      const store = transaction.objectStore('offlineEdits')
      const request = store.add(edit)

      request.onsuccess = () => {
        console.log('📱 Offline edit queued:', edit.id)
        this.notifySyncStatus()
        resolve(edit.id)
      }
      request.onerror = () => reject(request.error)
    })
  }

  // Add a photo upload
  async addPhotoUpload(jobId: string, file: File, caption: string, isPrimary: boolean): Promise<string> {
    if (!this.db) await this.init()

    // Convert File to ArrayBuffer for IndexedDB storage
    const fileBuffer = await file.arrayBuffer()
    
    const upload: OfflinePhotoUpload = {
      id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      jobId,
      file: {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified,
        buffer: fileBuffer
      } as { name: string; type: string; size: number; lastModified: number; buffer: ArrayBuffer }, // Store serializable file data instead of File object
      caption,
      isPrimary,
      timestamp: Date.now(),
      status: 'pending',
      uploadProgress: 0
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['photoUploads'], 'readwrite')
      const store = transaction.objectStore('photoUploads')
      const request = store.add(upload)

      request.onsuccess = () => {
        console.log('📱 Photo upload queued:', upload.id)
        this.notifySyncStatus()
        resolve(upload.id)
      }
      request.onerror = () => reject(request.error)
    })
  }

  // Get pending edits for a job
  async getPendingEdits(jobId: string): Promise<OfflineEdit[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offlineEdits'], 'readonly')
      const store = transaction.objectStore('offlineEdits')
      const index = store.index('jobId')
      const request = index.getAll(jobId)

      request.onsuccess = () => {
        const edits = request.result as OfflineEdit[]
        resolve(edits.filter(edit => edit.status === 'pending'))
      }
      request.onerror = () => reject(request.error)
    })
  }

  // Get pending photo uploads for a job
  async getPendingPhotoUploads(jobId: string): Promise<OfflinePhotoUpload[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['photoUploads'], 'readonly')
      const store = transaction.objectStore('photoUploads')
      const index = store.index('jobId')
      const request = index.getAll(jobId)

      request.onsuccess = () => {
        const uploads = request.result as OfflinePhotoUpload[]
        resolve(uploads.filter(upload => upload.status === 'pending'))
      }
      request.onerror = () => reject(request.error)
    })
  }

  // Update edit status
  async updateEditStatus(editId: string, status: OfflineEdit['status']): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offlineEdits'], 'readwrite')
      const store = transaction.objectStore('offlineEdits')
      const getRequest = store.get(editId)

      getRequest.onsuccess = () => {
        const edit = getRequest.result
        if (edit) {
          edit.status = status
          if (status === 'syncing') {
            edit.retryCount++
          }
          const putRequest = store.put(edit)
          putRequest.onsuccess = () => {
            this.notifySyncStatus()
            resolve()
          }
          putRequest.onerror = () => reject(putRequest.error)
        } else {
          resolve()
        }
      }
      getRequest.onerror = () => reject(getRequest.error)
    })
  }

  // Update photo upload status
  async updatePhotoUploadStatus(uploadId: string, status: OfflinePhotoUpload['status'], progress?: number): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['photoUploads'], 'readwrite')
      const store = transaction.objectStore('photoUploads')
      const getRequest = store.get(uploadId)

      getRequest.onsuccess = () => {
        const upload = getRequest.result
        if (upload) {
          upload.status = status
          if (progress !== undefined) {
            upload.uploadProgress = progress
          }
          const putRequest = store.put(upload)
          putRequest.onsuccess = () => {
            this.notifySyncStatus()
            resolve()
          }
          putRequest.onerror = () => reject(putRequest.error)
        } else {
          resolve()
        }
      }
      getRequest.onerror = () => reject(getRequest.error)
    })
  }

  // Remove completed edit
  async removeEdit(editId: string): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offlineEdits'], 'readwrite')
      const store = transaction.objectStore('offlineEdits')
      const request = store.delete(editId)

      request.onsuccess = () => {
        this.notifySyncStatus()
        resolve()
      }
      request.onerror = () => reject(request.error)
    })
  }

  // Remove completed photo upload
  async removePhotoUpload(uploadId: string): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['photoUploads'], 'readwrite')
      const store = transaction.objectStore('photoUploads')
      const request = store.delete(uploadId)

      request.onsuccess = () => {
        this.notifySyncStatus()
        resolve()
      }
      request.onerror = () => reject(request.error)
    })
  }

  // Get sync status
  async getSyncStatus(): Promise<SyncStatus> {
    if (!this.db) await this.init()

    const pendingEdits = await new Promise<number>((resolve, reject) => {
      const transaction = this.db!.transaction(['offlineEdits'], 'readonly')
      const store = transaction.objectStore('offlineEdits')
      const index = store.index('status')
      const request = index.count('pending')
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })

    const pendingPhotos = await new Promise<number>((resolve, reject) => {
      const transaction = this.db!.transaction(['photoUploads'], 'readonly')
      const store = transaction.objectStore('photoUploads')
      const index = store.index('status')
      const request = index.count('pending')
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })

    return {
      isOnline: navigator.onLine,
      pendingUpdates: pendingEdits,
      pendingPhotos,
      lastSync: null, // TODO: Implement last sync tracking
      isSyncing: false // TODO: Implement sync status tracking
    }
  }

  // Sync all pending changes
  async syncAllPendingChanges(): Promise<void> {
    if (!navigator.onLine) {
      console.log('📱 Offline - cannot sync changes')
      return
    }

    console.log('🔄 Starting background sync...')
    
    try {
      // Get all pending edits
      const allEdits = await this.getAllPendingEdits()
      
      for (const edit of allEdits) {
        await this.syncEdit(edit)
      }

      // Get all pending photo uploads
      const allPhotos = await this.getAllPendingPhotoUploads()
      
      for (const photo of allPhotos) {
        await this.syncPhotoUpload(photo)
      }

      console.log('✅ Background sync completed')
    } catch (error) {
      console.error('❌ Background sync failed:', error)
    }
  }

  // Get all pending edits
  async getAllPendingEdits(): Promise<OfflineEdit[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offlineEdits'], 'readonly')
      const store = transaction.objectStore('offlineEdits')
      const index = store.index('status')
      const request = index.getAll('pending')

      request.onsuccess = () => resolve(request.result as OfflineEdit[])
      request.onerror = () => reject(request.error)
    })
  }

  // Get all pending photo uploads
  async getAllPendingPhotoUploads(): Promise<OfflinePhotoUpload[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['photoUploads'], 'readonly')
      const store = transaction.objectStore('photoUploads')
      const index = store.index('status')
      const request = index.getAll('pending')

      request.onsuccess = () => resolve(request.result as OfflinePhotoUpload[])
      request.onerror = () => reject(request.error)
    })
  }

  // Sync a single edit
  private async syncEdit(edit: OfflineEdit): Promise<void> {
    try {
      await this.updateEditStatus(edit.id, 'syncing')

      console.log(`🔄 Syncing LOCAL edit ${edit.id} for job ${edit.jobId}:`, edit.data)
      console.log(`📱 PRIORITIZING LOCAL CHANGES over server data (offline-first behavior)`)

      const response = await fetch(`/api/jobs/${edit.jobId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...edit.data,
          offlineUpdate: true,
          timestamp: edit.timestamp
        }),
        credentials: 'include' // Include authentication cookies
      })

      console.log(`📤 Edit sync response status: ${response.status}`)
      console.log(`📤 Edit sync response ok: ${response.ok}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`📤 Edit sync error response: ${errorText}`)
        
        // If it's a 401 error, try to refresh the page to re-authenticate
        if (response.status === 401) {
          console.log(`🔐 Authentication failed - user may need to re-login`)
          throw new Error(`Authentication failed: Please refresh the page and try again`)
        }
        
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`)
      }

      const result = await response.json()
      console.log(`📤 Edit sync successful:`, result)

      await this.updateEditStatus(edit.id, 'completed')
      await this.removeEdit(edit.id)
      console.log('✅ Synced edit:', edit.id)
    } catch (error) {
      console.error('❌ Failed to sync edit:', edit.id, error)
      await this.updateEditStatus(edit.id, 'failed')
    }
  }

  // Sync a photo upload
  private async syncPhotoUpload(upload: OfflinePhotoUpload): Promise<void> {
    try {
      await this.updatePhotoUploadStatus(upload.id, 'uploading', 0)

      // Recreate File object from stored data
      const fileBlob = new Blob([upload.file.buffer], { type: upload.file.type })
      const file = new File([fileBlob], upload.file.name, {
        type: upload.file.type,
        lastModified: upload.file.lastModified
      })

      const formData = new FormData()
      formData.append('file', file)
      formData.append('jobId', upload.jobId)
      formData.append('caption', upload.caption)
      formData.append('isPrimary', upload.isPrimary.toString())

      const response = await fetch(`/api/jobs/${upload.jobId}/photos`, {
        method: 'POST',
        body: formData,
        credentials: 'include' // Include authentication cookies
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      await this.updatePhotoUploadStatus(upload.id, 'completed', 100)
      await this.removePhotoUpload(upload.id)
      console.log('✅ Synced photo upload:', upload.id)
    } catch (error) {
      console.error('❌ Failed to sync photo upload:', upload.id, error)
      await this.updatePhotoUploadStatus(upload.id, 'failed')
    }
  }

  // Notify sync status listeners
  private notifySyncStatus(): void {
    this.getSyncStatus().then(status => {
      this.syncListeners.forEach(listener => listener(status))
    })
  }

  // Add sync status listener
  addSyncStatusListener(listener: (status: SyncStatus) => void): void {
    this.syncListeners.push(listener)
  }

  // Remove sync status listener
  removeSyncStatusListener(listener: (status: SyncStatus) => void): void {
    this.syncListeners = this.syncListeners.filter(l => l !== listener)
  }
}

// Create singleton instance
export const offlineEditingManager = new OfflineEditingManager()

// Convenience functions
export async function queueOfflineEdit(jobId: string, type: OfflineEdit['type'], data: Record<string, unknown>): Promise<string> {
  return offlineEditingManager.addOfflineEdit(jobId, type, data)
}

export async function queuePhotoUpload(jobId: string, file: File, caption: string, isPrimary: boolean = false): Promise<string> {
  return offlineEditingManager.addPhotoUpload(jobId, file, caption, isPrimary)
}

export async function syncOfflineChanges(): Promise<void> {
  return offlineEditingManager.syncAllPendingChanges()
}
