// Offline storage service using IndexedDB
export interface OfflinePhoto {
  id: string
  jobId: string
  file: File | {
    name: string
    type: string
    size: number
    lastModified: number
    buffer: ArrayBuffer
  }
  caption?: string
  isPrimary: boolean
  timestamp: number
  status: 'pending' | 'uploading' | 'uploaded' | 'failed'
  retryCount: number
}

export interface OfflineJobUpdate {
  id: string
  jobId: string
  field: string
  value: string | number | boolean | null
  timestamp: number
  status: 'pending' | 'syncing' | 'synced' | 'failed'
  retryCount: number
}

export interface OfflinePhotoDelete {
  id: string
  jobId: string
  photoId: string
  timestamp: number
  status: 'pending' | 'syncing' | 'synced' | 'failed'
  retryCount: number
}

interface StoredOfflinePhoto {
  id: string
  jobId: string
  file: {
    name: string
    type: string
    size: number
    lastModified: number
    buffer: ArrayBuffer
  }
  caption?: string
  isPrimary: boolean
  timestamp: number
  status: 'pending' | 'uploading' | 'uploaded' | 'failed'
  retryCount: number
}

class OfflineStorageService {
  private dbName = 'BatteryTechOffline'
  private version = 2
  private db: IDBDatabase | null = null
  private initPromise: Promise<void> | null = null

  async init(): Promise<void> {
    // Return existing promise if already initializing
    if (this.initPromise) {
      return this.initPromise
    }

    // Return immediately if already initialized
    if (this.db) {
      return Promise.resolve()
    }

    this.initPromise = this._init()
    return this.initPromise
  }

  private async _init(): Promise<void> {
    if (typeof window === 'undefined') {
      throw new Error('IndexedDB not available in server environment')
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => {
        console.error('❌ Failed to open IndexedDB:', request.error)
        this.initPromise = null
        reject(request.error)
      }

      request.onsuccess = () => {
        this.db = request.result
        console.log('✅ Offline storage database initialized')
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Photos store
        if (!db.objectStoreNames.contains('photos')) {
          const photosStore = db.createObjectStore('photos', { keyPath: 'id' })
          photosStore.createIndex('jobId', 'jobId', { unique: false })
          photosStore.createIndex('status', 'status', { unique: false })
          photosStore.createIndex('timestamp', 'timestamp', { unique: false })
        }

        // Job updates store
        if (!db.objectStoreNames.contains('jobUpdates')) {
          const jobUpdatesStore = db.createObjectStore('jobUpdates', { keyPath: 'id' })
          jobUpdatesStore.createIndex('jobId', 'jobId', { unique: false })
          jobUpdatesStore.createIndex('status', 'status', { unique: false })
          jobUpdatesStore.createIndex('timestamp', 'timestamp', { unique: false })
        }

        // Photo deletions store
        if (!db.objectStoreNames.contains('photoDeletions')) {
          const photoDeletionsStore = db.createObjectStore('photoDeletions', { keyPath: 'id' })
          photoDeletionsStore.createIndex('jobId', 'jobId', { unique: false })
          photoDeletionsStore.createIndex('status', 'status', { unique: false })
          photoDeletionsStore.createIndex('timestamp', 'timestamp', { unique: false })
        }

        // Sync queue store
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncQueueStore = db.createObjectStore('syncQueue', { keyPath: 'id' })
          syncQueueStore.createIndex('type', 'type', { unique: false })
          syncQueueStore.createIndex('priority', 'priority', { unique: false })
        }
      }
    })
  }

  // Photo management
  async savePhoto(photo: OfflinePhoto): Promise<void> {
    if (!this.db) {
      await this.init()
    }
    
    if (!this.db) {
      throw new Error('Failed to initialize offline storage database')
    }
    
    console.log('💾 savePhoto called with:', {
      id: photo.id,
      fileType: typeof photo.file,
      isFile: photo.file instanceof File,
      hasBuffer: photo.file && typeof photo.file === 'object' && 'buffer' in photo.file
    })
    
    let fileBuffer: ArrayBuffer
    let fileData: {
      name: string
      type: string
      size: number
      lastModified: number
    }
    
    // Handle both File objects and serialized data
    if (photo.file instanceof File) {
      console.log('📁 Processing File object:', {
        name: photo.file.name,
        type: photo.file.type,
        size: photo.file.size
      })
      
      try {
        fileBuffer = await photo.file.arrayBuffer()
        fileData = {
          name: photo.file.name,
          type: photo.file.type,
          size: photo.file.size,
          lastModified: photo.file.lastModified
        }
        console.log('✅ File object processed successfully')
      } catch (error) {
        console.error('❌ Failed to process File object:', error)
        throw error
      }
    } else if (photo.file && typeof photo.file === 'object' && 'buffer' in photo.file) {
      console.log('📦 Processing serialized data:', {
        name: photo.file.name,
        type: photo.file.type,
        size: photo.file.size
      })
      
      fileBuffer = photo.file.buffer
      fileData = {
        name: photo.file.name,
        type: photo.file.type,
        size: photo.file.size,
        lastModified: photo.file.lastModified
      }
      console.log('✅ Serialized data processed successfully')
    } else {
      console.error('❌ Invalid file structure:', photo.file)
      throw new Error('Invalid file structure')
    }
    
    // Create a serializable version of the photo
    const serializablePhoto = {
      ...photo,
      file: {
        ...fileData,
        buffer: fileBuffer
      }
    }
    
    console.log('💾 Saving serializable photo:', {
      id: serializablePhoto.id,
      fileSize: serializablePhoto.file.size,
      bufferSize: serializablePhoto.file.buffer.byteLength
    })
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['photos'], 'readwrite')
      const store = transaction.objectStore('photos')
      const request = store.put(serializablePhoto)
      
      request.onsuccess = () => {
        console.log('✅ Photo saved successfully')
        resolve()
      }
      request.onerror = () => {
        console.error('❌ Failed to save photo:', request.error)
        reject(request.error)
      }
      transaction.onerror = () => {
        console.error('❌ Transaction failed:', transaction.error)
        reject(transaction.error)
      }
    })
  }

  async getPhotosByJob(jobId: string): Promise<OfflinePhoto[]> {
    if (!this.db) {
      await this.init()
    }
    
    if (!this.db) {
      throw new Error('Failed to initialize offline storage database')
    }
    
    console.log('📸 getPhotosByJob called for jobId:', jobId)
    
    const transaction = this.db.transaction(['photos'], 'readonly')
    const store = transaction.objectStore('photos')
    const index = store.index('jobId')
    const request = index.getAll(jobId)
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        console.log('📸 Retrieved photos from storage:', request.result.length)
        
        const photos = request.result.map((storedPhoto: StoredOfflinePhoto, index) => {
          console.log(`📸 Processing photo ${index + 1}:`, {
            id: storedPhoto.id,
            fileData: {
              name: storedPhoto.file.name,
              type: storedPhoto.file.type,
              size: storedPhoto.file.size,
              bufferLength: storedPhoto.file.buffer?.byteLength
            }
          })
          
          try {
            // Check if File constructor is available
            if (typeof File === 'undefined') {
              console.error('❌ File constructor not available')
              throw new Error('File constructor not available')
            }
            
            // Validate buffer data
            if (!storedPhoto.file.buffer || !(storedPhoto.file.buffer instanceof ArrayBuffer)) {
              console.error('❌ Invalid buffer data for photo:', storedPhoto.id)
              throw new Error('Invalid buffer data')
            }
            
            // Convert ArrayBuffer back to File
            const file = new File([storedPhoto.file.buffer], storedPhoto.file.name, {
              type: storedPhoto.file.type,
              lastModified: storedPhoto.file.lastModified
            })
            
            console.log(`✅ Created File object for photo ${index + 1}:`, {
              name: file.name,
              size: file.size,
              type: file.type
            })
            
            return {
              ...storedPhoto,
              file
            }
          } catch (error) {
            console.error(`❌ Failed to create File object for photo ${index + 1}:`, error)
            console.error('❌ Error details:', {
              name: error instanceof Error ? error.name : 'Unknown',
              message: error instanceof Error ? error.message : String(error),
              stack: error instanceof Error ? error.stack : undefined
            })
            
            // Return the photo with the serialized file data instead
            return {
              ...storedPhoto,
              file: storedPhoto.file // Keep the serialized data
            }
          }
        })
        
        console.log('📸 Returning photos:', photos.length)
        resolve(photos)
      }
      request.onerror = () => {
        console.error('❌ Failed to retrieve photos:', request.error)
        reject(request.error)
      }
    })
  }

  async getPendingPhotos(): Promise<OfflinePhoto[]> {
    if (!this.db) {
      await this.init()
    }
    
    if (!this.db) {
      throw new Error('Failed to initialize offline storage database')
    }
    
    const transaction = this.db.transaction(['photos'], 'readonly')
    const store = transaction.objectStore('photos')
    const index = store.index('status')
    const request = index.getAll('pending')
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const photos = request.result.map((storedPhoto: StoredOfflinePhoto) => {
          // Convert ArrayBuffer back to File
          const file = new File([storedPhoto.file.buffer], storedPhoto.file.name, {
            type: storedPhoto.file.type,
            lastModified: storedPhoto.file.lastModified
          })
          
          return {
            ...storedPhoto,
            file
          }
        })
        resolve(photos)
      }
      request.onerror = () => reject(request.error)
    })
  }

  async getFailedPhotos(): Promise<OfflinePhoto[]> {
    if (!this.db) {
      await this.init()
    }
    
    if (!this.db) {
      throw new Error('Failed to initialize offline storage database')
    }
    
    const transaction = this.db.transaction(['photos'], 'readonly')
    const store = transaction.objectStore('photos')
    const index = store.index('status')
    const request = index.getAll('failed')
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const photos = request.result.map((storedPhoto: StoredOfflinePhoto) => {
          // Convert ArrayBuffer back to File
          const file = new File([storedPhoto.file.buffer], storedPhoto.file.name, {
            type: storedPhoto.file.type,
            lastModified: storedPhoto.file.lastModified
          })
          
          return {
            ...storedPhoto,
            file
          }
        })
        resolve(photos)
      }
      request.onerror = () => reject(request.error)
    })
  }

  async updatePhotoStatus(id: string, status: OfflinePhoto['status']): Promise<void> {
    if (!this.db) {
      await this.init()
    }
    
    if (!this.db) {
      throw new Error('Failed to initialize offline storage database')
    }
    
    const transaction = this.db.transaction(['photos'], 'readwrite')
    const store = transaction.objectStore('photos')
    const getRequest = store.get(id)
    
    getRequest.onsuccess = () => {
      const photo = getRequest.result
      if (photo) {
        photo.status = status
        if (status === 'failed') {
          photo.retryCount = (photo.retryCount || 0) + 1
        }
        store.put(photo)
      }
    }
  }

  async resetPhotoRetryCount(id: string): Promise<void> {
    if (!this.db) {
      await this.init()
    }
    
    if (!this.db) {
      throw new Error('Failed to initialize offline storage database')
    }
    
    const transaction = this.db.transaction(['photos'], 'readwrite')
    const store = transaction.objectStore('photos')
    const getRequest = store.get(id)
    
    getRequest.onsuccess = () => {
      const photo = getRequest.result
      if (photo) {
        photo.retryCount = 0
        photo.status = 'pending' // Reset status to pending so it can be retried
        store.put(photo)
      }
    }
  }

  async deletePhoto(id: string): Promise<void> {
    if (!this.db) {
      await this.init()
    }
    
    if (!this.db) {
      throw new Error('Failed to initialize offline storage database')
    }
    
    const transaction = this.db.transaction(['photos'], 'readwrite')
    const store = transaction.objectStore('photos')
    await store.delete(id)
  }

  // Photo deletion management
  async savePhotoDelete(photoDelete: OfflinePhotoDelete): Promise<void> {
    if (!this.db) {
      await this.init()
    }
    
    if (!this.db) {
      throw new Error('Failed to initialize offline storage database')
    }
    
    const transaction = this.db.transaction(['photoDeletions'], 'readwrite')
    const store = transaction.objectStore('photoDeletions')
    await store.put(photoDelete)
  }

  async getPendingPhotoDeletions(): Promise<OfflinePhotoDelete[]> {
    if (!this.db) {
      await this.init()
    }
    
    if (!this.db) {
      throw new Error('Failed to initialize offline storage database')
    }
    
    const transaction = this.db.transaction(['photoDeletions'], 'readonly')
    const store = transaction.objectStore('photoDeletions')
    const index = store.index('status')
    const request = index.getAll('pending')
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async updatePhotoDeleteStatus(id: string, status: OfflinePhotoDelete['status']): Promise<void> {
    if (!this.db) {
      await this.init()
    }
    
    if (!this.db) {
      throw new Error('Failed to initialize offline storage database')
    }
    
    const transaction = this.db.transaction(['photoDeletions'], 'readwrite')
    const store = transaction.objectStore('photoDeletions')
    const getRequest = store.get(id)
    
    getRequest.onsuccess = () => {
      const photoDelete = getRequest.result
      if (photoDelete) {
        photoDelete.status = status
        if (status === 'failed') {
          photoDelete.retryCount = (photoDelete.retryCount || 0) + 1
        }
        store.put(photoDelete)
      }
    }
  }

  async deletePhotoDelete(id: string): Promise<void> {
    if (!this.db) {
      await this.init()
    }
    
    if (!this.db) {
      throw new Error('Failed to initialize offline storage database')
    }
    
    const transaction = this.db.transaction(['photoDeletions'], 'readwrite')
    const store = transaction.objectStore('photoDeletions')
    await store.delete(id)
  }

  // Job updates management
  async saveJobUpdate(update: OfflineJobUpdate): Promise<void> {
    if (!this.db) {
      await this.init()
    }
    
    if (!this.db) {
      throw new Error('Failed to initialize offline storage database')
    }
    
    const transaction = this.db.transaction(['jobUpdates'], 'readwrite')
    const store = transaction.objectStore('jobUpdates')
    await store.put(update)
  }

  async getPendingJobUpdates(): Promise<OfflineJobUpdate[]> {
    if (!this.db) {
      await this.init()
    }
    
    if (!this.db) {
      throw new Error('Failed to initialize offline storage database')
    }
    
    const transaction = this.db.transaction(['jobUpdates'], 'readonly')
    const store = transaction.objectStore('jobUpdates')
    const index = store.index('status')
    const request = index.getAll('pending')
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async updateJobUpdateStatus(id: string, status: OfflineJobUpdate['status']): Promise<void> {
    if (!this.db) {
      await this.init()
    }
    
    if (!this.db) {
      throw new Error('Failed to initialize offline storage database')
    }
    
    const transaction = this.db.transaction(['jobUpdates'], 'readwrite')
    const store = transaction.objectStore('jobUpdates')
    const getRequest = store.get(id)
    
    getRequest.onsuccess = () => {
      const update = getRequest.result
      if (update) {
        update.status = status
        if (status === 'failed') {
          update.retryCount = (update.retryCount || 0) + 1
        }
        store.put(update)
      }
    }
  }

  // Utility methods
  async clearAllData(): Promise<void> {
    if (!this.db) {
      await this.init()
    }
    
    if (!this.db) {
      throw new Error('Failed to initialize offline storage database')
    }
    
    const transaction = this.db.transaction(['photos', 'jobUpdates', 'photoDeletions', 'syncQueue'], 'readwrite')
    
    await Promise.all([
      transaction.objectStore('photos').clear(),
      transaction.objectStore('jobUpdates').clear(),
      transaction.objectStore('photoDeletions').clear(),
      transaction.objectStore('syncQueue').clear()
    ])
  }

  async getStorageSize(): Promise<{ photos: number; updates: number; photoDeletions: number }> {
    if (!this.db) {
      await this.init()
    }
    
    if (!this.db) {
      throw new Error('Failed to initialize offline storage database')
    }
    
    const transaction = this.db.transaction(['photos', 'jobUpdates', 'photoDeletions'], 'readonly')
    
    const photosCount = await new Promise<number>((resolve, reject) => {
      const request = transaction.objectStore('photos').count()
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    
    const updatesCount = await new Promise<number>((resolve, reject) => {
      const request = transaction.objectStore('jobUpdates').count()
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    
    const photoDeletionsCount = await new Promise<number>((resolve, reject) => {
      const request = transaction.objectStore('photoDeletions').count()
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    
    return { photos: photosCount, updates: updatesCount, photoDeletions: photoDeletionsCount }
  }
}

export const offlineStorage = new OfflineStorageService()
