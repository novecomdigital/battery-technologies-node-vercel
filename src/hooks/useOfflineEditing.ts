// Hook for offline editing functionality
import { useState, useEffect, useCallback } from 'react'
import { offlineEditingManager, SyncStatus } from '@/lib/offline-editing-manager'

interface UseOfflineEditingProps {
  jobId: string
  autoSync?: boolean
}

interface UseOfflineEditingReturn {
  syncStatus: SyncStatus | null
  isOnline: boolean
  queueJobUpdate: (data: Record<string, unknown>) => Promise<string>
  queuePhotoUpload: (file: File, caption: string, isPrimary?: boolean) => Promise<string>
  syncChanges: () => Promise<void>
  pendingEdits: number
  pendingPhotos: number
}

export function useOfflineEditing({ 
  jobId, 
  autoSync = true 
}: UseOfflineEditingProps): UseOfflineEditingReturn {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  // Initialize offline editing manager
  useEffect(() => {
    const initializeManager = async () => {
      try {
        await offlineEditingManager.init()
        console.log('📱 Offline editing manager initialized')
      } catch (error) {
        console.error('Failed to initialize offline editing manager:', error)
      }
    }

    initializeManager()
  }, [])

  // Set up sync status listener
  useEffect(() => {
    const handleSyncStatus = (status: SyncStatus) => {
      setSyncStatus(status)
    }

    offlineEditingManager.addSyncStatusListener(handleSyncStatus)

    // Get initial sync status
    offlineEditingManager.getSyncStatus().then(setSyncStatus)

    return () => {
      offlineEditingManager.removeSyncStatusListener(handleSyncStatus)
    }
  }, [])

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      if (autoSync) {
        console.log('📱 Back online - starting auto-sync')
        syncChanges()
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [autoSync]) // syncChanges is defined later, so we can't include it here

  // Queue a job update for offline sync
  const queueJobUpdate = useCallback(async (data: Record<string, unknown>): Promise<string> => {
    try {
      // Add timestamp and offline flag to the data
      const updateData = {
        ...data,
        offlineUpdate: true,
        timestamp: Date.now()
      }
      
      const editId = await offlineEditingManager.addOfflineEdit(jobId, 'job_update', updateData)
      console.log('📱 Job update queued for offline sync:', editId, updateData)
      return editId
    } catch (error) {
      console.error('Failed to queue job update:', error)
      throw error
    }
  }, [jobId])

  // Queue a photo upload for offline sync
  const queuePhotoUpload = useCallback(async (file: File, caption: string, isPrimary: boolean = false): Promise<string> => {
    try {
      const uploadId = await offlineEditingManager.addPhotoUpload(jobId, file, caption, isPrimary)
      console.log('📱 Photo upload queued for offline sync:', uploadId)
      return uploadId
    } catch (error) {
      console.error('Failed to queue photo upload:', error)
      throw error
    }
  }, [jobId])

  // Sync all pending changes
  const syncChanges = useCallback(async (): Promise<void> => {
    try {
      await offlineEditingManager.syncAllPendingChanges()
      console.log('✅ Offline changes synced successfully')
    } catch (error) {
      console.error('Failed to sync offline changes:', error)
      throw error
    }
  }, [])

  return {
    syncStatus,
    isOnline,
    queueJobUpdate,
    queuePhotoUpload,
    syncChanges,
    pendingEdits: syncStatus?.pendingUpdates || 0,
    pendingPhotos: syncStatus?.pendingPhotos || 0
  }
}
