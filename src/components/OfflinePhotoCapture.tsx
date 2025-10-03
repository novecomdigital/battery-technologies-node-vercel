'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { CameraIcon, PhotoIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline'
import { offlineStorage, OfflinePhoto } from '@/lib/offline-storage'
import { syncManager } from '@/lib/sync-manager'

interface OfflinePhotoCaptureProps {
  jobId: string
  onPhotoAdded?: (photo: OfflinePhoto) => void
  onSyncStatusChange?: (status: {
    isOnline: boolean
    pendingUpdates: number
    pendingPhotos: number
    lastSync: Date | null
  }) => void
  className?: string
}

export default function OfflinePhotoCapture({ 
  jobId, 
  onPhotoAdded, 
  onSyncStatusChange,
  className = '' 
}: OfflinePhotoCaptureProps) {
  const router = useRouter()
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null)
  const [compressedFile, setCompressedFile] = useState<File | null>(null)
  const [caption, setCaption] = useState('')
  const [isPrimary, setIsPrimary] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [offlinePhotos, setOfflinePhotos] = useState<OfflinePhoto[]>([])
  const [uploadedPhotos, setUploadedPhotos] = useState<{
    id: string
    url: string
    caption?: string
    originalName: string
    isPrimary: boolean
    createdAt: string
  }[]>([])
  const [syncStatus, setSyncStatus] = useState<{
    isOnline: boolean
    pendingUpdates: number
    pendingPhotos: number
    lastSync: Date | null
  } | null>(null)
  const [debugMessages, setDebugMessages] = useState<string[]>([])
  const [debugEnabled, setDebugEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('debugEnabled') === 'true'
    }
    return false
  })
  const [refreshTrigger, setRefreshTrigger] = useState(0) // Force re-render trigger
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; photoId: string | null; photoName: string }>({
    isOpen: false,
    photoId: null,
    photoName: ''
  })
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null)
  
  // Track when photos were last loaded to avoid unnecessary API calls
  // const [isLoadingPhotos, setIsLoadingPhotos] = useState(false) // Removed unused state
  
  // Use refs to avoid dependency issues in useCallback
  const lastPhotoLoadTimeRef = useRef<number>(0)
  const isLoadingPhotosRef = useRef<boolean>(false)
  const loadOfflinePhotosRef = useRef<(() => Promise<void>) | undefined>(undefined)
  const loadUploadedPhotosRef = useRef<((force?: boolean) => Promise<void>) | undefined>(undefined)
  const syncStatusRef = useRef<typeof syncStatus>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Cleanup scroll lock on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.width = ''
      document.body.style.height = ''
    }
  }, [])

  // Listen for debug toggle changes
  useEffect(() => {
    const handleDebugToggle = (event: CustomEvent) => {
      setDebugEnabled(event.detail.enabled)
    }

    window.addEventListener('debugToggle', handleDebugToggle as EventListener)
    return () => {
      window.removeEventListener('debugToggle', handleDebugToggle as EventListener)
    }
  }, [])


  const addDebugMessage = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setDebugMessages(prev => [`${timestamp}: ${message}`, ...prev.slice(0, 9)]) // Keep last 10 messages
  }, [])

  // Debug effect to track refresh trigger changes
  useEffect(() => {
    if (debugEnabled) {
      addDebugMessage(`🔄 Refresh trigger changed: ${refreshTrigger}`)
    }
  }, [refreshTrigger, debugEnabled, addDebugMessage])

  // Clean URL to remove extra % characters and fix common issues
  const cleanPhotoUrl = (url: string): string => {
    if (!url) return url
    
    // Remove extra % characters that might be in the URL
    let cleanedUrl = url.replace(/%+/g, '')
    
    // Ensure proper URL format
    if (cleanedUrl.includes('.r2.dev') && !cleanedUrl.includes('://')) {
      cleanedUrl = 'https://' + cleanedUrl
    }
    
    // Remove any double slashes except after protocol
    cleanedUrl = cleanedUrl.replace(/([^:]\/)\/+/g, '$1')
    
    console.log('🔧 URL cleaned:', { original: url, cleaned: cleanedUrl })
    return cleanedUrl
  }

  const getPhotoThumbnail = (photo: OfflinePhoto): string => {
    try {
      console.log('🔍 getPhotoThumbnail called with photo:', {
        id: photo.id,
        fileType: typeof photo.file,
        isFile: photo.file instanceof File,
        hasBuffer: photo.file && typeof photo.file === 'object' && 'buffer' in photo.file,
        fileKeys: photo.file && typeof photo.file === 'object' ? Object.keys(photo.file) : 'not object'
      })
      
      // Check if photo.file is a File object or serialized data
      if (photo.file instanceof File) {
        console.log('✅ Using direct File object')
        return URL.createObjectURL(photo.file)
      } else if (photo.file && typeof photo.file === 'object' && 'buffer' in photo.file) {
        console.log('✅ Recreating File from serialized data')
        console.log('📊 File data:', {
          name: photo.file.name,
          type: photo.file.type,
          size: photo.file.size,
          bufferType: photo.file.buffer?.constructor?.name,
          bufferLength: photo.file.buffer?.byteLength
        })
        
        // Check if File constructor is available
        if (typeof File === 'undefined') {
          console.error('❌ File constructor not available')
          return ''
        }
        
        // Validate buffer data
        if (!photo.file.buffer || !(photo.file.buffer instanceof ArrayBuffer)) {
          console.error('❌ Invalid buffer data')
          return ''
        }
        
        // Validate file properties
        if (!photo.file.name || !photo.file.type) {
          console.error('❌ Missing file name or type')
          return ''
        }
        
        // Recreate File object from serialized data
        const fileBlob = new Blob([photo.file.buffer], { type: photo.file.type })
        console.log('📦 Created blob:', { size: fileBlob.size, type: fileBlob.type })
        
        const file = new File([fileBlob], photo.file.name, {
          type: photo.file.type,
          lastModified: photo.file.lastModified || Date.now()
        })
        console.log('📁 Created file:', { name: file.name, size: file.size, type: file.type })
        
        const url = URL.createObjectURL(file)
        console.log('🔗 Created URL:', url)
        return url
      } else {
        console.error('❌ Invalid photo file structure:', photo.file)
        return ''
      }
    } catch (error) {
      console.error('❌ Failed to create thumbnail URL:', error)
      console.error('❌ Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      })
      return ''
    }
  }

  // Removed unused function

  const handlePhotoClick = (index: number) => {
    setSelectedPhotoIndex(index)
    // Lock body scroll when modal opens
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.width = '100%'
    document.body.style.height = '100%'
    // Trigger PWA theme update
    setTimeout(() => {
      if (typeof window !== 'undefined' && window.updatePWATheme) {
        window.updatePWATheme()
      }
    }, 100)
  }

  const closeModal = () => {
    setSelectedPhotoIndex(null)
    // Re-enable body scroll
    document.body.style.overflow = ''
    document.body.style.position = ''
    document.body.style.width = ''
    document.body.style.height = ''
    // Trigger PWA theme update
    setTimeout(() => {
      if (typeof window !== 'undefined' && window.updatePWATheme) {
        window.updatePWATheme()
      }
    }, 100)
  }

  const navigatePhoto = (direction: 'prev' | 'next') => {
    if (selectedPhotoIndex === null) return
    
    const allPhotos = [...uploadedPhotos, ...offlinePhotos.map(p => ({
      id: p.id,
      url: getPhotoThumbnail(p),
      caption: p.caption,
      originalName: 'Offline photo',
      isPrimary: p.isPrimary,
      createdAt: new Date(p.timestamp).toISOString()
    }))]
    
    if (direction === 'prev') {
      setSelectedPhotoIndex(selectedPhotoIndex > 0 ? selectedPhotoIndex - 1 : allPhotos.length - 1)
    } else {
      setSelectedPhotoIndex(selectedPhotoIndex < allPhotos.length - 1 ? selectedPhotoIndex + 1 : 0)
    }
  }

  // Swipe gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    })
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    })
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const deltaX = touchStart.x - touchEnd.x
    const deltaY = touchStart.y - touchEnd.y
    const isLeftSwipe = deltaX > 50
    const isRightSwipe = deltaX < -50
    const isVerticalSwipe = Math.abs(deltaY) > Math.abs(deltaX)
    
    // Only handle horizontal swipes, ignore vertical swipes
    if (isVerticalSwipe) return
    
    if (isLeftSwipe) {
      navigatePhoto('next')
    } else if (isRightSwipe) {
      navigatePhoto('prev')
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (selectedPhotoIndex === null) return

    switch (event.key) {
      case 'Escape':
        closeModal()
        break
      case 'ArrowLeft':
        navigatePhoto('prev')
        break
      case 'ArrowRight':
        navigatePhoto('next')
        break
    }
  }

  const handleDeletePhoto = async (photoId: string) => {
    try {
      // Check if this is the last photo before deleting
      const totalPhotos = uploadedPhotos.length + offlinePhotos.length
      const isLastPhoto = totalPhotos === 1

      // Check if we're online
      if (navigator.onLine) {
        // Online: Delete immediately
        const response = await fetch(`/api/jobs/${jobId}/photos?photoId=${photoId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to delete photo')
        }

        // Remove from local state
        setUploadedPhotos(prev => prev.filter(photo => photo.id !== photoId))
        addDebugMessage(`Photo ${photoId} deleted successfully`)
      } else {
        // Offline: Save for sync when online
        const { syncManager } = await import('@/lib/sync-manager')
        await syncManager.savePhotoDeletionForOfflineSync(jobId, photoId)
        
        // Remove from local state immediately for better UX
        setUploadedPhotos(prev => prev.filter(photo => photo.id !== photoId))
        addDebugMessage(`Photo ${photoId} queued for deletion when online`)
      }
      
      // Close confirmation dialog
      setDeleteConfirm({ isOpen: false, photoId: null, photoName: '' })

      // Handle photo viewer navigation after deletion
      if (isLastPhoto) {
        // If this was the last photo, close modal and redirect back to the job
        setSelectedPhotoIndex(null)
        // Unlock scroll before redirecting
        document.body.style.overflow = ''
        document.body.style.position = ''
        document.body.style.width = ''
        document.body.style.height = ''
        addDebugMessage(`Last photo deleted - redirecting back to job`)
        router.push(`/technician/jobs/${jobId}`)
      } else if (selectedPhotoIndex !== null) {
        // If we're viewing photos and this wasn't the last one, adjust the index
        const newTotalPhotos = totalPhotos - 1
        if (selectedPhotoIndex >= newTotalPhotos) {
          // If we deleted the last photo in the viewer, go to the previous one
          setSelectedPhotoIndex(newTotalPhotos - 1)
        }
        // If we deleted a photo before the current one, the index stays the same
        // (the next photo slides into the current position)
      }
    } catch (error) {
      console.error('Error deleting photo:', error)
      addDebugMessage(`Failed to delete photo: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const confirmDeletePhoto = (photoId: string, photoName: string) => {
    setDeleteConfirm({ isOpen: true, photoId, photoName })
  }

  const cancelDeletePhoto = () => {
    setDeleteConfirm({ isOpen: false, photoId: null, photoName: '' })
  }

  const compressImage = (file: File, maxWidth: number = 1920, quality: number = 0.8): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      const img = document.createElement('img')
      
      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
        
        canvas.width = width
        canvas.height = height
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height)
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              })
              resolve(compressedFile)
            } else {
              resolve(file) // Fallback to original
            }
          },
          'image/jpeg',
          quality
        )
      }
      
      img.src = URL.createObjectURL(file)
    })
  }

  const loadOfflinePhotos = useCallback(async () => {
    try {
      const photos = await offlineStorage.getPhotosByJob(jobId)
      setOfflinePhotos(photos)
      
      // Debug: Show photo statuses
      const statusCounts = photos.reduce((acc, photo) => {
        acc[photo.status] = (acc[photo.status] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      console.log('📸 Photo status counts:', statusCounts)
      // Use ref to avoid dependency issues
      const timestamp = new Date().toLocaleTimeString()
      setDebugMessages(prev => [`${timestamp}: 📸 Photos: ${JSON.stringify(statusCounts)}`, ...prev.slice(0, 9)])
    } catch (error) {
      console.error('Failed to load offline photos:', error)
    }
  }, [jobId]) // Remove addDebugMessage dependency

  const loadUploadedPhotos = useCallback(async (force = false) => {
    // Avoid unnecessary API calls if we just loaded photos recently
    const now = Date.now()
    const timeSinceLastLoad = now - lastPhotoLoadTimeRef.current
    
    if (!force && timeSinceLastLoad < 10000) { // Less than 10 seconds ago
      const timestamp = new Date().toLocaleTimeString()
      setDebugMessages(prev => [`${timestamp}: ⏭️ Skipping photo load - loaded ${Math.round(timeSinceLastLoad / 1000)}s ago`, ...prev.slice(0, 9)])
      return
    }
    
    if (isLoadingPhotosRef.current) {
      const timestamp = new Date().toLocaleTimeString()
      setDebugMessages(prev => [`${timestamp}: ⏭️ Photo load already in progress, skipping...`, ...prev.slice(0, 9)])
      return
    }
    
    try {
      isLoadingPhotosRef.current = true
      const timestamp = new Date().toLocaleTimeString()
      setDebugMessages(prev => [`${timestamp}: 📸 Loading uploaded photos...`, ...prev.slice(0, 9)])
      
      const response = await fetch(`/api/jobs/${jobId}/photos`)
      if (response.ok) {
        const photos = await response.json()
        setUploadedPhotos(photos)
        lastPhotoLoadTimeRef.current = now
        const successTimestamp = new Date().toLocaleTimeString()
        setDebugMessages(prev => [`${successTimestamp}: 📸 Loaded ${photos.length} uploaded photos`, ...prev.slice(0, 9)])
      } else {
        const errorTimestamp = new Date().toLocaleTimeString()
        setDebugMessages(prev => [`${errorTimestamp}: ❌ Failed to load uploaded photos: ${response.status}`, ...prev.slice(0, 9)])
      }
    } catch (error) {
      console.error('Failed to load uploaded photos:', error)
      const errorTimestamp = new Date().toLocaleTimeString()
      setDebugMessages(prev => [`${errorTimestamp}: ❌ Failed to load uploaded photos: ${error}`, ...prev.slice(0, 9)])
    } finally {
      isLoadingPhotosRef.current = false
    }
  }, [jobId]) // Remove addDebugMessage dependency

  // Store functions in refs to avoid dependency issues
  useEffect(() => {
    loadOfflinePhotosRef.current = loadOfflinePhotos
    loadUploadedPhotosRef.current = loadUploadedPhotos
  }, [loadOfflinePhotos, loadUploadedPhotos])

  useEffect(() => {
    if (loadOfflinePhotosRef.current) {
      loadOfflinePhotosRef.current()
    }
    if (loadUploadedPhotosRef.current) {
      loadUploadedPhotosRef.current(true) // Force load on mount
    }
    
    // Set initial sync status immediately - just show online/offline
    const initialStatus = {
      isOnline: navigator.onLine,
      pendingUpdates: 0,
      pendingPhotos: 0,
      lastSync: null
    }
    
    setSyncStatus(initialStatus)
    
    // Notify parent component immediately
    if (onSyncStatusChange) {
      onSyncStatusChange(initialStatus)
    }
    
    // Listen for sync status updates
    const handleSyncStatus = (status: {
      isOnline: boolean
      isSyncing: boolean
      pendingPhotos: number
      pendingUpdates: number
      lastSyncTime: number | null
    }) => {
      const previousPendingPhotos = syncStatus?.pendingPhotos || 0
      
      const newStatus = {
        isOnline: status.isOnline,
        pendingUpdates: status.pendingUpdates,
        pendingPhotos: status.pendingPhotos,
        lastSync: status.lastSyncTime ? new Date(status.lastSyncTime) : null
      }
      
      setSyncStatus(newStatus)
      syncStatusRef.current = newStatus // Update ref
      
      // Notify parent component of sync status change
      if (onSyncStatusChange) {
        onSyncStatusChange(newStatus)
      }
      
      addDebugMessage(`📊 Sync status updated: online=${status.isOnline}, pendingPhotos=${status.pendingPhotos}`)
      
      // Always refresh photos when sync status changes (not just when count decreases)
      // This ensures we catch individual photo status changes
      addDebugMessage(`🔄 Sync status changed - refreshing photo list...`)
      // Force a re-render to ensure status changes are visible
      setRefreshTrigger(prev => prev + 1)
      if (loadOfflinePhotosRef.current) {
        loadOfflinePhotosRef.current() // Refresh offline photos (to show status updates)
      }
      if (loadUploadedPhotosRef.current) {
        loadUploadedPhotosRef.current(true) // Force refresh uploaded photos
      }
      
      // If photos were successfully synced (pending count decreased), do additional refresh
      if (previousPendingPhotos > 0 && status.pendingPhotos < previousPendingPhotos) {
        addDebugMessage(`🔄 Photos synced! Additional refresh...`)
        // Additional refresh after a delay to catch any photos that were moved
        setTimeout(() => {
          if (loadOfflinePhotosRef.current) {
            loadOfflinePhotosRef.current() // Refresh offline photos (to remove synced ones)
          }
          if (loadUploadedPhotosRef.current) {
            loadUploadedPhotosRef.current(true) // Force refresh uploaded photos (to show newly synced ones)
          }
        }, 3000) // Longer delay to ensure all sync operations are complete
      }
    }
    
    syncManager.addSyncListener(handleSyncStatus)
    
    return () => {
      syncManager.removeSyncListener(handleSyncStatus)
    }
  }, [jobId]) // Only depend on jobId to prevent infinite loops

  // Remove this useEffect as it's redundant and causes issues
  // loadOfflinePhotos is already called in the main useEffect above

  // Periodic refresh of photos to catch any synced photos (only when there are pending photos)
  useEffect(() => {
    // Only set up interval if there are pending photos to sync
    if (syncStatus?.pendingPhotos === 0) {
      return // No pending photos, no need to poll
    }

    const interval = setInterval(() => {
      // Use ref to get current values without causing dependency issues
      const currentSyncStatus = syncStatusRef.current
      if (currentSyncStatus?.isOnline && currentSyncStatus?.pendingPhotos > 0) {
        const now = Date.now()
        const timeSinceLastLoad = now - lastPhotoLoadTimeRef.current
        
        // Only refresh if it's been more than 30 seconds since last load
        if (timeSinceLastLoad > 30000) {
          console.log('🔄 Periodic refresh: checking for synced photos...')
          if (loadOfflinePhotosRef.current) {
            loadOfflinePhotosRef.current() // Refresh offline photos
          }
          if (loadUploadedPhotosRef.current) {
            loadUploadedPhotosRef.current() // This will use intelligent loading
          }
        } else {
          console.log(`⏭️ Periodic refresh skipped - loaded ${Math.round(timeSinceLastLoad / 1000)}s ago`)
        }
      }
    }, 60000) // Check every 60 seconds when there are pending photos (less aggressive)

    return () => clearInterval(interval)
  }, [syncStatus?.pendingPhotos]) // Only depend on pendingPhotos to set up/tear down interval

  // Additional frequent refresh for status changes (every 3 seconds when online)
  useEffect(() => {
    const interval = setInterval(() => {
      const currentSyncStatus = syncStatusRef.current
      if (currentSyncStatus?.isOnline) {
        if (loadOfflinePhotosRef.current) {
          loadOfflinePhotosRef.current() // Refresh to catch status changes
        }
      }
    }, 3000) // Check every 3 seconds when online

    return () => clearInterval(interval)
  }, [])

  // Listen for custom photo status change events
  useEffect(() => {
    const handlePhotoStatusChange = (event: CustomEvent) => {
      addDebugMessage(`📸 Photo status change event received - refreshing photos...`)
      // Force a re-render to ensure status changes are visible
      setRefreshTrigger(prev => prev + 1)
      if (loadOfflinePhotosRef.current) {
        loadOfflinePhotosRef.current() // Refresh to catch status changes
      }
    }

    window.addEventListener('photoStatusChanged', handlePhotoStatusChange as EventListener)
    
    return () => {
      window.removeEventListener('photoStatusChanged', handlePhotoStatusChange as EventListener)
    }
  }, [])

  // Trigger sync when component becomes visible (user navigates back to job)
  useEffect(() => {
    const handleVisibilityChange = () => {
      const currentSyncStatus = syncStatusRef.current
      if (!document.hidden && currentSyncStatus?.isOnline && currentSyncStatus?.pendingPhotos > 0) {
        const now = Date.now()
        const timeSinceLastLoad = now - lastPhotoLoadTimeRef.current
        
        // Only trigger sync if it's been more than 10 seconds since last load
        if (timeSinceLastLoad > 10000) {
          addDebugMessage(`👁️ Page became visible with ${currentSyncStatus.pendingPhotos} pending photos - triggering sync`)
          syncManager.forceSync()
        } else {
          addDebugMessage(`👁️ Page became visible but skipping sync - loaded ${Math.round(timeSinceLastLoad / 1000)}s ago`)
        }
      }
    }

    const handleOnlineStatus = () => {
      const currentSyncStatus = syncStatusRef.current
      if (navigator.onLine && currentSyncStatus?.pendingPhotos && currentSyncStatus.pendingPhotos > 0) {
        addDebugMessage(`🌐 Back online with ${currentSyncStatus.pendingPhotos} pending photos - triggering sync`)
        syncManager.forceSync()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('online', handleOnlineStatus)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('online', handleOnlineStatus)
    }
  }, []) // No dependencies to prevent infinite loops

  const openCamera = () => {
    // Trigger the file input with camera capture
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }


  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    addDebugMessage(`📸 Original file size: ${(file.size / 1024 / 1024).toFixed(2)} MB`)

    // Compress the image
    try {
      const compressedFile = await compressImage(file)
      addDebugMessage(`📸 Compressed size: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`)
      
      // Convert compressed file to data URL for preview
      const photoUrl = URL.createObjectURL(compressedFile)
      setCapturedPhoto(photoUrl)
      setCompressedFile(compressedFile)
    } catch (error) {
      addDebugMessage(`❌ Compression failed: ${error}`)
      // Fallback to original file
      const photoUrl = URL.createObjectURL(file)
      setCapturedPhoto(photoUrl)
      setCompressedFile(file)
    }
  }

  const savePhoto = async () => {
    if (!capturedPhoto || !compressedFile) return

    setIsUploading(true)

    try {
      const photo: OfflinePhoto = {
        id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        jobId,
        file: compressedFile,
        caption: caption.trim() || undefined,
        isPrimary,
        timestamp: Date.now(),
        status: 'pending',
        retryCount: 0
      }

      // Initialize and save to offline storage
      await offlineStorage.init()
      await offlineStorage.savePhoto(photo)
      
      // Verify the photo was saved
      const savedPhotos = await offlineStorage.getPhotosByJob(jobId)
      if (!savedPhotos.find(p => p.id === photo.id)) {
        throw new Error('Photo was not saved to local storage')
      }
      
       // Refresh offline photos
       if (loadOfflinePhotosRef.current) {
         await loadOfflinePhotosRef.current()
       }
      
      // Trigger sync if online
      if (navigator.onLine) {
        console.log('🌐 Online - triggering immediate sync')
        await syncManager.forceSync()
      } else {
        console.log('📴 Offline - photo saved for later sync')
      }
      
      // Clear the captured photo
      setCapturedPhoto(null)
      setCompressedFile(null)
      setCaption('')
      setIsPrimary(false)
      
      if (onPhotoAdded) {
        onPhotoAdded(photo)
      }
    } catch (error) {
      console.error('Failed to save photo:', error)
      alert(`Failed to save photo: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsUploading(false)
    }
  }

  const cancelCapture = () => {
    setCapturedPhoto(null)
    setCaption('')
    setIsPrimary(false)
    if (capturedPhoto) {
      URL.revokeObjectURL(capturedPhoto)
    }
  }

  const retryFailedPhoto = async (photoId: string) => {
    try {
      console.log(`🔄 Retrying failed photo: ${photoId}`)
      
      // Reset the photo status to pending
      await offlineStorage.resetPhotoRetryCount(photoId)
      
       // Refresh the photos list
       if (loadOfflinePhotosRef.current) {
         await loadOfflinePhotosRef.current()
       }
      
      // Trigger sync if online
      if (navigator.onLine) {
        console.log('🌐 Online - triggering immediate sync for retry')
        await syncManager.retryFailedPhotos()
      } else {
        console.log('📴 Offline - photo marked for retry when online')
      }
      
      addDebugMessage(`🔄 Retrying photo ${photoId}`)
    } catch (error) {
      console.error('Failed to retry photo:', error)
      addDebugMessage(`❌ Failed to retry photo: ${error}`)
    }
  }

  const getStatusIcon = (status: OfflinePhoto['status']) => {
    switch (status) {
      case 'pending':
        return <div className="w-3 h-3 bg-yellow-400 rounded-full" title="Pending upload" />
      case 'uploading':
        return <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse" title="Uploading..." />
      case 'uploaded':
        return <CheckIcon className="w-3 h-3 text-green-500" title="Uploaded" />
      case 'failed':
        return <XMarkIcon className="w-3 h-3 text-red-500" title="Upload failed" />
      default:
        return null
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Camera Controls */}
      <div className="flex space-x-2">
        {!capturedPhoto && (
          <>
            <button
              onClick={openCamera}
              className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <CameraIcon className="w-4 h-4 mr-2" />
              Take Photo
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PhotoIcon className="w-4 h-4 mr-2" />
              Choose File
            </button>
          </>
        )}
      </div>


      {/* Captured Photo Preview */}
      {capturedPhoto && (
        <div className="space-y-4">
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={capturedPhoto}
              alt="Captured photo"
              className="w-full h-64 object-cover rounded-lg"
            />
            {compressedFile && (
              <div className="mt-2 text-xs text-gray-600 bg-gray-100 p-2 rounded">
                📸 Compressed for upload (max 1920px width, 80% quality)
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Caption (optional)
              </label>
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Add a caption..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={isPrimary}
                onChange={(e) => setIsPrimary(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Set as primary photo</span>
            </label>

            <div className="flex space-x-2">
              <button
                onClick={() => {
                  console.log('🖱️ Save button clicked!')
                  addDebugMessage('🖱️ Save button clicked!')
                  savePhoto()
                }}
                disabled={isUploading}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckIcon className="w-4 h-4 mr-2" />
                    Save Photo
                  </>
                )}
              </button>
              <button
                onClick={cancelCapture}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <XMarkIcon className="w-4 h-4 mr-2" />
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Offline Photos List */}
      {offlinePhotos.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">
            Offline Photos ({offlinePhotos.length})
          </h4>
          <div className="space-y-2">
            {offlinePhotos.map((photo) => {
              const thumbnailUrl = getPhotoThumbnail(photo)
              return (
                <div key={photo.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={thumbnailUrl}
                        alt="Photo thumbnail"
                        className="w-12 h-12 object-cover rounded"
                        onError={(e) => {
                          console.error('❌ Failed to load photo thumbnail:', thumbnailUrl)
                          console.error('❌ Error details:', e)
                          // Hide the broken image
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                        {getStatusIcon(photo.status)}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="text-sm text-gray-700">
                        {photo.caption || 'Untitled photo'}
                        {photo.isPrimary && <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Primary</span>}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(photo.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(photo.status)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Photo Gallery */}
      {(uploadedPhotos.length > 0 || offlinePhotos.length > 0) && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">
            Job Photos ({uploadedPhotos.length + offlinePhotos.length})
          </h4>
          
          
          {/* Thumbnail Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {/* Uploaded Photos */}
            {uploadedPhotos.map((photo, index) => {
              const cleanedUrl = cleanPhotoUrl(photo.url)
              return (
                <div
                  key={photo.id}
                  className="relative group cursor-pointer"
                  onClick={() => handlePhotoClick(index)}
                >
                  <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden hover:ring-2 hover:ring-green-500 hover:ring-offset-2 transition-all duration-200">
                    {cleanedUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={cleanedUrl}
                        alt="Uploaded photo"
                        className="w-full h-full object-cover"
                        onLoad={() => {
                          console.log('Successfully loaded uploaded photo:', cleanedUrl)
                        }}
                        onError={(e) => {
                          console.error('Failed to load uploaded photo:', photo.url)
                          console.error('Cleaned URL:', cleanedUrl)
                          console.error('Error details:', e)
                        
                        // Test if the URL is accessible with multiple methods
                        console.log('🔍 Testing URL accessibility for:', photo.url)
                        
                        // Test 1: HEAD request
                        fetch(photo.url, { method: 'HEAD' })
                          .then(response => {
                            console.log('📡 HEAD request result:', {
                              url: photo.url,
                              status: response.status,
                              statusText: response.statusText,
                              headers: Object.fromEntries(response.headers.entries())
                            })
                          })
                          .catch(fetchError => {
                            console.error('❌ HEAD request failed:', fetchError)
                          })
                        
                        // Test 2: GET request
                        fetch(photo.url, { method: 'GET' })
                          .then(response => {
                            console.log('📡 GET request result:', {
                              url: photo.url,
                              status: response.status,
                              statusText: response.statusText,
                              contentType: response.headers.get('content-type'),
                              contentLength: response.headers.get('content-length')
                            })
                          })
                          .catch(fetchError => {
                            console.error('❌ GET request failed:', fetchError)
                          })
                        
                        // Test 3: Direct image load test
                        const testImg = new Image()
                        testImg.onload = () => console.log('✅ Direct image load successful:', photo.url)
                        testImg.onerror = (imgError) => console.error('❌ Direct image load failed:', imgError)
                        testImg.src = photo.url
                        
                        // Try fallback URL if the current one fails
                        const currentUrl = photo.url
                        const fallbackUrl = currentUrl.replace(
                          'pub-842311243a966a889f7f2e54f981b454.r2.dev',
                          'pub-e9be35a84de94387b6876cfdc423c997.r2.dev'
                        )
                        
                        if (currentUrl !== fallbackUrl) {
                          console.log('🔄 Trying fallback URL:', fallbackUrl)
                          const fallbackImg = new Image()
                          fallbackImg.onload = () => {
                            console.log('✅ Fallback URL worked!')
                            const img = e.currentTarget
                            img.src = fallbackUrl
                          }
                          fallbackImg.onerror = () => {
                            console.log('❌ Fallback URL also failed')
                            showErrorFallback(e.currentTarget)
                          }
                          fallbackImg.src = fallbackUrl
                        } else {
                          showErrorFallback(e.currentTarget)
                        }
                        
                        function showErrorFallback(img: HTMLImageElement) {
                          const parent = img.parentElement
                          if (parent) {
                            parent.innerHTML = `
                              <div class="w-full h-full flex flex-col items-center justify-center bg-gray-100 text-gray-600">
                                <svg class="w-8 h-8 mb-2" fill="currentColor" viewBox="0 0 20 20">
                                  <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"></path>
                                </svg>
                                <div class="text-xs text-center px-2">
                                  <div>Failed to load</div>
                                  <div class="text-red-500">R2 config issue</div>
                                  <button onclick="window.location.reload()" class="mt-1 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600">
                                    Retry
                                  </button>
                                </div>
                              </div>
                            `
                          }
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-green-600">
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"></path>
                      </svg>
                    </div>
                  )}
                </div>
                {photo.isPrimary && (
                  <div className="absolute top-1 left-1 bg-green-600 text-white text-xs px-1 py-0.5 rounded">
                    Primary
                  </div>
                )}
                <div className="absolute bottom-1 right-1 text-xs">
                  ✅
                </div>
              </div>
              )
            })}
            
            {/* Offline Photos */}
            {offlinePhotos.map((photo, index) => {
              const thumbnailUrl = getPhotoThumbnail(photo)
              const globalIndex = uploadedPhotos.length + index
              return (
                <div
                  key={`${photo.id}-${refreshTrigger}`}
                  className="relative group cursor-pointer"
                  onClick={() => handlePhotoClick(globalIndex)}
                >
                  <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden hover:ring-2 hover:ring-yellow-500 hover:ring-offset-2 transition-all duration-200">
                    {thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={thumbnailUrl}
                        alt="Offline photo"
                        className="w-full h-full object-cover"
                        onLoad={() => {
                          console.log('Successfully loaded offline photo thumbnail:', photo.id)
                        }}
                        onError={() => {
                          console.error('Failed to load offline photo thumbnail:', photo.id)
                          console.error('Blob URL:', thumbnailUrl)
                          console.error('File details:', photo.file)
                          // Don't hide the image, just log the error for now
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-yellow-600">
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"></path>
                        </svg>
                      </div>
                    )}
                  </div>
                  {photo.isPrimary && (
                    <div className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-1 py-0.5 rounded">
                      Primary
                    </div>
                  )}
                  <div className="absolute bottom-1 right-1 bg-yellow-600 text-white text-xs px-1 py-0.5 rounded">
                    {photo.status === 'pending' ? '⏳' : photo.status === 'uploading' ? '🔄' : photo.status === 'uploaded' ? '✅' : '❌'}
                  </div>
                  {photo.status === 'failed' && (
                    <div className="absolute top-1 right-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          retryFailedPhoto(photo.id)
                        }}
                        className="bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 rounded-full transition-colors"
                        title="Retry upload"
                      >
                        ↻
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}


      {/* iOS PWA Status Banner */}
      {syncStatus && syncStatus.pendingPhotos > 0 && (
        <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded-lg">
          <div className="text-sm text-yellow-800">
            <strong>⚠️ {syncStatus.pendingPhotos} photos waiting to upload</strong>
          </div>
          <div className="text-xs text-yellow-700 mt-1">
            Tap &quot;Sync Now&quot; above to retry upload. If it fails, you&apos;ll see an error message.
          </div>
          <div className="mt-2 flex space-x-2">
            <button
               onClick={async () => {
                 addDebugMessage('🔄 Refreshing photo list...')
                 if (loadOfflinePhotosRef.current) {
                   await loadOfflinePhotosRef.current()
                 }
                 if (loadUploadedPhotosRef.current) {
                   await loadUploadedPhotosRef.current(true) // Force refresh
                 }
                 addDebugMessage('📸 Photo list refreshed')
               }}
              className="text-xs bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600"
            >
              Refresh List
            </button>
            <button
              onClick={async () => {
                addDebugMessage('🔄 Retrying all failed photos...')
                try {
                  // Get all photos for this job
                  const photos = await offlineStorage.getPhotosByJob(jobId)
                  const failedPhotos = photos.filter(p => p.status === 'failed')
                  
                  for (const photo of failedPhotos) {
                    await offlineStorage.resetPhotoRetryCount(photo.id)
                    addDebugMessage(`🔄 Reset retry count for photo ${photo.id}`)
                  }
                  
                  await loadOfflinePhotos()
                  
                  // Trigger sync if online
                  if (navigator.onLine) {
                    await syncManager.retryFailedPhotos()
                    addDebugMessage(`✅ Triggered retry for ${failedPhotos.length} failed photos`)
                  } else {
                    addDebugMessage(`📴 Offline - ${failedPhotos.length} photos marked for retry when online`)
                  }
                } catch (error) {
                  addDebugMessage(`❌ Failed to retry photos: ${error}`)
                }
              }}
              className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 mr-2"
            >
              Retry All Failed
            </button>
            <button
              onClick={async () => {
                addDebugMessage('🗑️ Clearing failed photos...')
                try {
                  // Get all photos for this job
                  const photos = await offlineStorage.getPhotosByJob(jobId)
                  const failedPhotos = photos.filter(p => p.status === 'failed')
                  
                  for (const photo of failedPhotos) {
                    await offlineStorage.deletePhoto(photo.id)
                    addDebugMessage(`🗑️ Deleted failed photo ${photo.id}`)
                  }
                  
                   if (loadOfflinePhotosRef.current) {
                     await loadOfflinePhotosRef.current()
                   }
                   addDebugMessage(`✅ Cleared ${failedPhotos.length} failed photos`)
                } catch (error) {
                  addDebugMessage(`❌ Failed to clear photos: ${error}`)
                }
              }}
              className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
            >
              Clear Failed
            </button>
          </div>
        </div>
      )}

      {/* Debug Panel - Only show when debug is enabled */}
      {debugEnabled && (
        <div className="mt-4 p-3 bg-gray-100 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-medium text-gray-700">
              Debug Log {syncStatus && syncStatus.pendingPhotos > 0 && `(${syncStatus.pendingPhotos} pending)`}
            </div>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  addDebugMessage('🔍 Checking local storage...')
                  try {
                    const pending = await offlineStorage.getPendingPhotos()
                    const jobPhotos = await offlineStorage.getPhotosByJob(jobId)
                    const storageSize = await offlineStorage.getStorageSize()
                    
                    addDebugMessage(`📸 Local storage: pending=${pending.length}, job photos=${jobPhotos.length}`)
                    addDebugMessage(`📊 Storage size: photos=${storageSize.photos}, updates=${storageSize.updates}, deletions=${storageSize.photoDeletions}`)
                    
                    pending.forEach((photo, index) => {
                      addDebugMessage(`📸 Pending ${index + 1}: ${photo.id} (${photo.file.size} bytes, job: ${photo.jobId})`)
                    })
                    
                    jobPhotos.forEach((photo, index) => {
                      addDebugMessage(`📸 Job photo ${index + 1}: ${photo.id} (${photo.status}, ${photo.file.size} bytes)`)
                    })
                  } catch (error) {
                    addDebugMessage(`❌ Failed to check local storage: ${error}`)
                  }
                }}
                className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
              >
                Check Storage
              </button>
              <button
                onClick={async () => {
                  try {
                    const logText = debugMessages.join('\n')
                    if (navigator.clipboard && window.isSecureContext) {
                      await navigator.clipboard.writeText(logText)
                      addDebugMessage('📋 Debug log copied to clipboard')
                    } else {
                      // Fallback for older browsers
                      const textArea = document.createElement('textarea')
                      textArea.value = logText
                      document.body.appendChild(textArea)
                      textArea.select()
                      document.execCommand('copy')
                      document.body.removeChild(textArea)
                      addDebugMessage('📋 Debug log copied to clipboard (fallback)')
                    }
                  } catch (error) {
                    addDebugMessage(`❌ Failed to copy to clipboard: ${error}`)
                  }
                }}
                className="text-xs bg-purple-500 text-white px-2 py-1 rounded hover:bg-purple-600"
              >
                Copy Log
              </button>
              <button
                onClick={async () => {
                  addDebugMessage('🔄 Manual sync triggered...')
                  try {
                    await syncManager.forceSync()
                    addDebugMessage('✅ Manual sync completed')
                    
                    // Refresh the photo list after sync
                    if (loadOfflinePhotosRef.current) {
                     await loadOfflinePhotosRef.current()
                   }
                    if (loadUploadedPhotosRef.current) {
                      await loadUploadedPhotosRef.current(true) // Force refresh after sync
                    }
                    addDebugMessage('📸 Photo list refreshed')
                  } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error)
                    addDebugMessage(`❌ Manual sync failed: ${errorMessage}`)
                    alert(`Manual sync failed: ${errorMessage}`)
                  }
                }}
                className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
              >
                Sync Now
              </button>
            </div>
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {debugMessages.length > 0 ? (
              debugMessages.map((message, index) => (
                <div key={index} className="text-xs text-gray-600 font-mono">
                  {message}
                </div>
              ))
            ) : (
              <div className="text-xs text-gray-500 italic">
                No debug messages yet. Take a photo to see sync activity.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hidden file input for camera capture */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Photo Modal */}
      {selectedPhotoIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black photo-modal"
          style={{
            touchAction: 'none',
            overflow: 'hidden'
          }}
          onClick={closeModal}
          onKeyDown={handleKeyDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onWheel={(e) => e.preventDefault()}
          tabIndex={0}
        >
          {(() => {
            const allPhotos = [...uploadedPhotos.map(p => ({
              ...p,
              url: cleanPhotoUrl(p.url)
            })), ...offlinePhotos.map(p => ({
              id: p.id,
              url: getPhotoThumbnail(p),
              caption: p.caption,
              originalName: 'Offline photo',
              isPrimary: p.isPrimary,
              createdAt: new Date(p.timestamp).toISOString()
            }))]
            
            const photo = allPhotos[selectedPhotoIndex]
            if (!photo) return null

            return (
              <>
                {/* Portrait: Full modal with controls */}
                <div className="portrait-view w-full h-full p-4 sm:p-6 md:p-8 flex flex-col">
                  <div 
                    className="relative flex flex-col bg-white rounded-lg overflow-hidden w-full h-full max-w-6xl mx-auto"
                  >

                    {/* Photo counter */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm z-10">
                      {selectedPhotoIndex + 1} of {uploadedPhotos.length + offlinePhotos.length}
                    </div>
                    {/* Photo */}
                    <div
                      className="flex-1 flex flex-col"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Image container */}
                      <div className="flex-1 flex items-center justify-center min-h-0 p-4 overflow-hidden" style={{ paddingBottom: '120px' }}>
                        <div className="w-full h-full flex items-center justify-center overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={photo.url}
                            alt={photo.caption || photo.originalName}
                            className="max-w-full max-h-full object-contain rounded-lg"
                            style={{ 
                              maxHeight: 'calc(100vh - 240px)',
                              maxWidth: 'calc(100vw - 2rem)'
                            }}
                          />
                        </div>
                      </div>
                      
                        {/* Photo info - anchored at bottom */}
                        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 bg-white border-t border-gray-200">
                          {/* Text and date at the top */}
                          <div className="mb-4">
                            <h3 className="text-lg font-medium text-gray-900">
                              {photo.caption || photo.originalName}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {new Date(photo.createdAt).toLocaleString()}
                            </p>
                            {photo.isPrimary && (
                              <span className="inline-block mt-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                                Primary Photo
                              </span>
                            )}
                          </div>
                          
                          {/* Buttons at the bottom */}
                          <div className="flex items-center justify-between gap-3">
                            <button
                              onClick={closeModal}
                              className="px-4 py-3 bg-gray-600 text-white text-base font-medium rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 min-h-[44px] min-w-[70px] flex-1 sm:flex-none"
                            >
                              Close
                            </button>
                            
                            {/* Delete button - only show for uploaded photos */}
                            {selectedPhotoIndex !== null && selectedPhotoIndex < uploadedPhotos.length && (
                              <button
                                onClick={() => {
                                  const photoToDelete = uploadedPhotos[selectedPhotoIndex]
                                  if (photoToDelete) {
                                    confirmDeletePhoto(photoToDelete.id, photoToDelete.caption || photoToDelete.originalName || `Photo ${photoToDelete.id}`)
                                  }
                                }}
                                className="px-4 py-3 bg-red-600 text-white text-base font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 min-h-[44px] min-w-[70px] flex-1 sm:flex-none"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                    </div>
                  </div>
                </div>

                {/* Landscape: Just the image */}
                <div 
                  className="landscape-view"
                  style={{
                    touchAction: 'none',
                    overflow: 'hidden'
                  }}
                >
                  {/* Close button */}
                  <button
                    onClick={closeModal}
                    className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-75 transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>

                  {/* Navigation buttons */}
                  {(uploadedPhotos.length + offlinePhotos.length) > 1 && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          navigatePhoto('prev')
                        }}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-75 transition-colors"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          navigatePhoto('next')
                        }}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-75 transition-colors"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </>
                  )}

                  {/* Photo counter */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                    {selectedPhotoIndex + 1} of {uploadedPhotos.length + offlinePhotos.length}
                  </div>

                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.url}
                    alt={photo.caption || photo.originalName}
                    className="w-full h-full object-contain"
                    onClick={(e) => e.stopPropagation()}
                    onError={(e) => {
                      console.error('❌ Failed to load photo in modal:', photo.url)
                      console.error('❌ Error details:', e)
                      // Show error fallback
                      const img = e.currentTarget
                      const parent = img.parentElement
                      if (parent) {
                        parent.innerHTML = `
                          <div class="w-full h-full flex flex-col items-center justify-center bg-gray-100 text-gray-600">
                            <svg class="w-16 h-16 mb-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"></path>
                            </svg>
                            <div class="text-center px-4">
                              <div class="text-lg font-medium mb-2">Failed to load photo</div>
                              <div class="text-sm text-red-500 mb-4">URL: ${photo.url}</div>
                              <button onclick="window.location.reload()" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                                Retry
                              </button>
                            </div>
                          </div>
                        `
                      }
                    }}
                  />
                </div>
              </>
            )
          })()}
        </div>
      )}

      {/* Delete Photo Confirmation Dialog */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900">
                    Delete Photo
                  </h3>
                </div>
              </div>
              <div className="mb-6">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete &quot;{deleteConfirm.photoName}&quot;? This action cannot be undone.
                </p>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={cancelDeletePhoto}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteConfirm.photoId && handleDeletePhoto(deleteConfirm.photoId)}
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
