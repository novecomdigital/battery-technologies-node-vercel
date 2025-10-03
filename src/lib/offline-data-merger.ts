// Offline Data Merger
// This module handles merging offline job updates with server data based on timestamps

import { offlineEditingManager, OfflineEdit } from './offline-editing-manager'

export interface JobData {
  id: string
  status?: string
  notes?: string
  batterySerial?: string
  equipmentSerial?: string
  dueDate?: string
  [key: string]: unknown
}

export interface MergedJobData extends JobData {
  _offlineUpdates?: {
    hasPendingUpdates: boolean
    lastUpdateTimestamp: number | null
    pendingFields: string[]
  }
}

/**
 * Merges offline job updates with server job data
 * ALWAYS prioritizes local offline changes over server data for offline-first behavior
 * This ensures that any changes made while offline take precedence when syncing
 */
export async function mergeOfflineJobData(jobData: JobData): Promise<MergedJobData> {
  try {
    // Get all pending offline updates for this job
    const offlineUpdates = await getOfflineUpdatesForJob(jobData.id)
    
    if (offlineUpdates.length === 0) {
      return {
        ...jobData,
        _offlineUpdates: {
          hasPendingUpdates: false,
          lastUpdateTimestamp: null,
          pendingFields: []
        }
      }
    }

    // Create a copy of the job data to merge into
    const mergedData: MergedJobData = { ...jobData }
    
    // Get the latest update for each field
    const latestUpdates = getLatestUpdatesByField(offlineUpdates)
    
    // Apply the latest updates to the merged data
    const pendingFields: string[] = []
    let lastUpdateTimestamp: number | null = null
    
    for (const [field, update] of Object.entries(latestUpdates)) {
      if (update && update.timestamp) {
        // ALWAYS prioritize local changes over server data for offline-first behavior
        // This ensures that any offline changes take precedence
        mergedData[field] = update.value
        pendingFields.push(field)
        lastUpdateTimestamp = Math.max(lastUpdateTimestamp || 0, update.timestamp)
        
        console.log(`🔄 Applied offline update: ${field} = ${update.value} (timestamp: ${update.timestamp})`)
      }
    }

    // Add metadata about offline updates
    mergedData._offlineUpdates = {
      hasPendingUpdates: pendingFields.length > 0,
      lastUpdateTimestamp,
      pendingFields
    }

    console.log(`🔄 Merged offline updates for job ${jobData.id}:`, {
      pendingFields,
      lastUpdateTimestamp,
      totalUpdates: offlineUpdates.length
    })

    return mergedData
  } catch (error) {
    console.error('Failed to merge offline job data:', error)
    return {
      ...jobData,
      _offlineUpdates: {
        hasPendingUpdates: false,
        lastUpdateTimestamp: null,
        pendingFields: []
      }
    }
  }
}

/**
 * Gets all pending offline updates for a specific job
 */
async function getOfflineUpdatesForJob(jobId: string): Promise<OfflineEdit[]> {
  try {
    // Get all pending edits for this job
    const allEdits = await offlineEditingManager.getPendingEdits(jobId)
    
    // Filter for job updates only
    return allEdits.filter(edit => edit.type === 'job_update')
  } catch (error) {
    console.error('Failed to get offline updates for job:', error)
    return []
  }
}

/**
 * Gets the latest update for each field based on timestamps
 */
function getLatestUpdatesByField(updates: OfflineEdit[]): Record<string, { value: unknown; timestamp: number }> {
  const fieldUpdates: Record<string, { value: unknown; timestamp: number }> = {}
  
  for (const update of updates) {
    if (update.data && typeof update.data === 'object') {
      for (const [field, value] of Object.entries(update.data)) {
        // Skip metadata fields
        if (field === 'offlineUpdate' || field === 'timestamp') continue
        
        const currentUpdate = fieldUpdates[field]
        if (!currentUpdate || update.timestamp > currentUpdate.timestamp) {
          fieldUpdates[field] = {
            value,
            timestamp: update.timestamp
          }
        }
      }
    }
  }
  
  return fieldUpdates
}

// Removed unused function getServerFieldTimestamp

/**
 * Checks if a job has pending offline updates
 */
export async function hasPendingOfflineUpdates(jobId: string): Promise<boolean> {
  try {
    const updates = await getOfflineUpdatesForJob(jobId)
    return updates.length > 0
  } catch (error) {
    console.error('Failed to check pending offline updates:', error)
    return false
  }
}

/**
 * Gets the timestamp of the last offline update for a job
 */
export async function getLastOfflineUpdateTimestamp(jobId: string): Promise<number | null> {
  try {
    const updates = await getOfflineUpdatesForJob(jobId)
    if (updates.length === 0) return null
    
    return Math.max(...updates.map(update => update.timestamp))
  } catch (error) {
    console.error('Failed to get last offline update timestamp:', error)
    return null
  }
}
