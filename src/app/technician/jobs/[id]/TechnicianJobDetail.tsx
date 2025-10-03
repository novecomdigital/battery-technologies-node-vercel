'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
// import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import {
  CheckIcon,
  XMarkIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  CameraIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'
// Auth logic moved to client-side to avoid server-only imports
import MapboxMaps from '@/components/MapboxMaps'
import TemplateGenerator from '@/components/TemplateGenerator'
import { useTechnicianJobCache } from '@/hooks/useTechnicianJobCache'
import { getCachedJob } from '@/lib/technician-job-cache'
import { useOfflineEditing } from '@/hooks/useOfflineEditing'
import { mergeOfflineJobData } from '@/lib/offline-data-merger'
import { syncManager } from '@/lib/sync-manager'
import { COMPANY_CONFIG } from '@/lib/company-config'

// Client-side auth functions
const canEditJob = (userRole: string, jobAssignedToId: string | null, userId: string): boolean => {
  // Admins and managers can edit any job
  if (userRole === 'ADMIN' || userRole === 'MANAGER') {
    return true
  }
  
  // Technicians can edit jobs assigned to them
  if (userRole === 'TECHNICIAN') {
    return jobAssignedToId === userId
  }
  
  // Viewers cannot edit jobs
  return false
}

// Helper function to convert CachedTechnicianJob to JobData for mergeOfflineJobData
const convertCachedJobToJobData = (cachedJob: { id: string; status: string; notes: string | null; batterySerial: string | null; equipmentSerial: string | null; dueDate: string | null }) => {
  return {
    id: cachedJob.id,
    status: cachedJob.status,
    notes: cachedJob.notes || undefined, // Convert null to undefined
    batterySerial: cachedJob.batterySerial || undefined,
    equipmentSerial: cachedJob.equipmentSerial || undefined,
    dueDate: cachedJob.dueDate || undefined
  }
}

// Helper function to convert MergedJobData to Job
const convertMergedJobToJob = (mergedJob: { status?: string; notes?: string; batterySerial?: string; equipmentSerial?: string; dueDate?: string }, originalJob: Job): Job => {
  return {
    id: originalJob.id,
    jobNumber: originalJob.jobNumber,
    description: originalJob.description,
    status: mergedJob.status || originalJob.status,
    serviceType: originalJob.serviceType,
    dueDate: mergedJob.dueDate || originalJob.dueDate,
    notes: mergedJob.notes || originalJob.notes,
    estimatedHours: originalJob.estimatedHours,
    batteryType: originalJob.batteryType,
    batteryModel: originalJob.batteryModel,
    batterySerial: mergedJob.batterySerial || originalJob.batterySerial,
    equipmentType: originalJob.equipmentType,
    equipmentModel: originalJob.equipmentModel,
    equipmentSerial: mergedJob.equipmentSerial || originalJob.equipmentSerial,
    assignedToId: originalJob.assignedToId,
    assignedTo: originalJob.assignedTo,
    customer: originalJob.customer,
    location: originalJob.location,
    contact: originalJob.contact
  }
}


// const getTechnicianEditableFields = (userRole: string): string[] => {
//   if (userRole === 'TECHNICIAN') {
//     return [
//       'status',
//       'notes',
//       'batterySerial',
//       'equipmentSerial'
//     ]
//   }
//   
//   // Non-technicians can edit all fields (subject to other role checks)
//   return []
// }
import CustomDropdown from '@/components/CustomDropdown'
import dynamic from 'next/dynamic'

const OfflinePhotoCapture = dynamic(() => import('@/components/OfflinePhotoCapture'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-200 h-48 rounded-lg"></div>
})

interface User {
  id: string
  email: string
  name: string | null
  role: string
}

interface Job {
  id: string
  jobNumber: string
  description: string
  status: string
  serviceType: string
  dueDate: string | null
  notes: string | null
  estimatedHours: number | null
  batteryType: string | null
  batteryModel: string | null
  batterySerial: string | null
  equipmentType: string | null
  equipmentModel: string | null
  equipmentSerial: string | null
  assignedToId: string | null
  assignedTo: {
    id: string
    name: string
  } | null
  customer: {
    id: string
    name: string
    phone: string | null
    email: string | null
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
}

interface TechnicianJobDetailProps {
  jobId: string
  user: User
}

const statusConfig = {
  OPEN: { color: 'bg-blue-100 text-blue-800', label: 'Open' },
  VISITED: { color: 'bg-yellow-100 text-yellow-800', label: 'Visited' },
  COMPLETE: { color: 'bg-green-100 text-green-800', label: 'Complete' },
  NEEDS_QUOTE: { color: 'bg-purple-100 text-purple-800', label: 'Needs Quote' },
  ON_HOLD: { color: 'bg-gray-100 text-gray-800', label: 'On Hold' },
  CANCELLED: { color: 'bg-red-100 text-red-800', label: 'Cancelled' },
  NOT_FOUND: { color: 'bg-gray-100 text-gray-600', label: 'Not Available Offline' }
}

export default function TechnicianJobDetail({ jobId, user }: TechnicianJobDetailProps) {
  // const router = useRouter()
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingSections, setEditingSections] = useState<{
    status: boolean
    notes: boolean
    battery: boolean
    equipment: boolean
  }>({
    status: false,
    notes: false,
    battery: false,
    equipment: false
  })
  const [isSaving, setIsSaving] = useState(false)
  const [syncStatus, setSyncStatus] = useState<{
    isOnline: boolean
    pendingUpdates: number
    pendingPhotos: number
    lastSync: Date | null
    isSyncing?: boolean
  } | null>(null)
  const [routeInfo, setRouteInfo] = useState<{
    distance: string
    duration: string
  } | null>(null)
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  const [showDebugInfo, setShowDebugInfo] = useState(false)
  const [debugMode, setDebugMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('debugEnabled') === 'true'
    }
    return false
  })
  const [showTemplateGenerator, setShowTemplateGenerator] = useState(false)
  const [formData, setFormData] = useState({
    status: 'OPEN',
    notes: '',
    dueDate: '',
    batterySerial: '',
    equipmentSerial: ''
  })
  
  // Ref to prevent infinite loops
  const isFetchingRef = useRef(false)
  const fetchJobRef = useRef<(() => Promise<void>) | undefined>(undefined)
  const previousPendingUpdatesRef = useRef<number | null>(null)

  // Use technician job cache for offline editing
  const {
    jobs: cachedJobs,
    isOnline: cacheIsOnline,
    updateJob: updateCachedJob
  } = useTechnicianJobCache({ 
    technicianId: user.id, 
    autoSync: true,
    syncInterval: 30000
  })

  // Use offline editing manager
  const {
    isOnline: editingIsOnline,
    queueJobUpdate,
    syncStatus: editingSyncStatus
  } = useOfflineEditing({ 
    jobId, 
    autoSync: true 
  })

  const canEdit = job ? canEditJob(user.role as 'TECHNICIAN' | 'ADMIN' | 'MANAGER' | 'VIEWER', job.assignedToId, user.id) : false
  // const editableFields = getTechnicianEditableFields(user.role as 'TECHNICIAN' | 'ADMIN' | 'MANAGER' | 'VIEWER')

  // Memoize the route info callback to prevent infinite re-renders
  const handleRouteInfo = useCallback((info: { distance: string; duration: string }) => {
    setRouteInfo(info)
  }, [])

  const addDebugInfo = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setDebugInfo(prev => [...prev.slice(-9), `${timestamp}: ${message}`])
  }

  const clearDebugInfo = () => {
    setDebugInfo([])
  }

  // Listen for debug toggle events from mobile usage guide
  useEffect(() => {
    const handleDebugToggle = (event: CustomEvent) => {
      setDebugMode(event.detail.enabled)
    }

    window.addEventListener('debugToggle', handleDebugToggle as EventListener)
    
    return () => {
      window.removeEventListener('debugToggle', handleDebugToggle as EventListener)
    }
  }, [])

  const fetchJob = useCallback(async () => {
    // Prevent infinite loops
    if (isFetchingRef.current) {
      console.log('🔄 Already fetching job, skipping...')
      return
    }
    
    try {
      isFetchingRef.current = true
      setLoading(true)
      
      console.log('🔍 Fetching job:', jobId)
      console.log('📱 Cached jobs available:', cachedJobs.length)
      console.log('📱 Cache is online:', cacheIsOnline)
      console.log('📱 Navigator online:', navigator.onLine)
      
      addDebugInfo(`Loading job ${jobId}...`)
      addDebugInfo(`Cached jobs: ${cachedJobs.length}, Online: ${navigator.onLine}`)
      
      // First try to get from cache if available
      const cachedJob = cachedJobs.find(j => j.id === jobId)
      if (cachedJob) {
        console.log('📱 Using cached job data for job:', jobId)
        addDebugInfo(`✅ Found job in cache: ${cachedJob.jobNumber}`)
        
        // Merge with offline updates
        const jobData = convertCachedJobToJobData(cachedJob)
        const mergedJob = await mergeOfflineJobData(jobData)
        console.log('🔄 Merged job data with offline updates:', mergedJob)
        addDebugInfo(`🔄 Merged with offline updates`)
        
        const convertedJob = convertMergedJobToJob(mergedJob, cachedJob)
        setJob(convertedJob)
        setFormData({
          status: mergedJob.status || 'OPEN',
          notes: mergedJob.notes || '',
          dueDate: mergedJob.dueDate ? (() => {
            const date = new Date(mergedJob.dueDate)
            const year = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const day = String(date.getDate()).padStart(2, '0')
            return `${year}-${month}-${day}`
          })() : '',
          batterySerial: mergedJob.batterySerial || '',
          equipmentSerial: mergedJob.equipmentSerial || ''
        })
        setLoading(false)
        return
        } else {
        console.log('📱 Job not found in cache:', jobId)
        console.log('📱 Available cached jobs:', cachedJobs.map(j => ({ id: j.id, jobNumber: j.jobNumber })))
        addDebugInfo(`❌ Job not found in cache`)
        addDebugInfo(`Available jobs: ${cachedJobs.map(j => j.jobNumber).join(', ')}`)
        
        // Try direct cache access as fallback
        try {
          console.log('📱 Trying direct cache access for job:', jobId)
          const directCachedJob = await getCachedJob(jobId)
          if (directCachedJob) {
            console.log('📱 Found job in direct cache access')
            
            // Merge with offline updates
            const jobData = convertCachedJobToJobData(directCachedJob)
            const mergedJob = await mergeOfflineJobData(jobData)
            console.log('🔄 Merged job data with offline updates (direct cache):', mergedJob)
            
            const convertedJob = convertMergedJobToJob(mergedJob, directCachedJob)
            setJob(convertedJob)
            setFormData({
              status: mergedJob.status || 'OPEN',
              notes: mergedJob.notes || '',
              dueDate: mergedJob.dueDate ? (() => {
                const date = new Date(mergedJob.dueDate)
                const year = date.getFullYear()
                const month = String(date.getMonth() + 1).padStart(2, '0')
                const day = String(date.getDate()).padStart(2, '0')
                return `${year}-${month}-${day}`
              })() : '',
              batterySerial: mergedJob.batterySerial || '',
              equipmentSerial: mergedJob.equipmentSerial || ''
            })
            setLoading(false)
            return
          }
        } catch (directCacheError) {
          console.log('📱 Direct cache access failed:', directCacheError)
        }
      }
      
      // If not in cache, try to fetch from server (only if online)
      if (cacheIsOnline && navigator.onLine) {
        try {
          console.log('🌐 Attempting to fetch job from server...')
          const response = await fetch(`/api/jobs/${jobId}`)
          if (!response.ok) throw new Error('Failed to fetch job')
          
          const jobData = await response.json()
          setJob(jobData)
          
          // Initialize form data
          setFormData({
            status: jobData.status || 'OPEN',
            notes: jobData.notes || '',
            dueDate: jobData.dueDate ? (() => {
              const date = new Date(jobData.dueDate)
              const year = date.getFullYear()
              const month = String(date.getMonth() + 1).padStart(2, '0')
              const day = String(date.getDate()).padStart(2, '0')
              return `${year}-${month}-${day}`
            })() : '',
            batterySerial: jobData.batterySerial || '',
            equipmentSerial: jobData.equipmentSerial || ''
          })
        } catch (fetchError) {
          console.log('📱 Failed to fetch job from server, checking cache again:', fetchError)
          // If fetch fails, try to find in cache again (might have been added since first check)
          const retryCachedJob = cachedJobs.find(j => j.id === jobId)
          if (retryCachedJob) {
            console.log('📱 Found job in cache on retry')
            setJob(retryCachedJob)
            setFormData({
              status: retryCachedJob.status || 'OPEN',
              notes: retryCachedJob.notes || '',
              dueDate: retryCachedJob.dueDate ? (() => {
                const date = new Date(retryCachedJob.dueDate)
                const year = date.getFullYear()
                const month = String(date.getMonth() + 1).padStart(2, '0')
                const day = String(date.getDate()).padStart(2, '0')
                return `${year}-${month}-${day}`
              })() : '',
              batterySerial: retryCachedJob.batterySerial || '',
              equipmentSerial: retryCachedJob.equipmentSerial || ''
            })
            setLoading(false)
            return
          }
          throw fetchError
        }
      } else {
        // Offline - check if we have the job in cache
        console.log('📱 Offline mode - checking cache for job:', jobId)
        const offlineCachedJob = cachedJobs.find(j => j.id === jobId)
        if (offlineCachedJob) {
          console.log('📱 Found job in cache while offline')
          setJob(offlineCachedJob)
          setFormData({
            status: offlineCachedJob.status || 'OPEN',
            notes: offlineCachedJob.notes || '',
            dueDate: offlineCachedJob.dueDate ? (() => {
              const date = new Date(offlineCachedJob.dueDate)
              const year = date.getFullYear()
              const month = String(date.getMonth() + 1).padStart(2, '0')
              const day = String(date.getDate()).padStart(2, '0')
              return `${year}-${month}-${day}`
            })() : '',
            batterySerial: offlineCachedJob.batterySerial || '',
            equipmentSerial: offlineCachedJob.equipmentSerial || ''
          })
          setLoading(false)
          return
        }
        
        // No job found in cache while offline
        console.log('📱 Job not found in cache while offline:', jobId)
        console.log('📱 Available cached job IDs:', cachedJobs.map(j => j.id))
        addDebugInfo(`❌ Job not found while offline`)
        addDebugInfo(`Available job IDs: ${cachedJobs.map(j => j.id).join(', ')}`)
        
        // Show helpful offline message
        setJob({
          id: jobId,
          jobNumber: 'Not Cached',
          description: 'This job is not available offline',
          status: 'NOT_FOUND',
          serviceType: 'UNKNOWN',
          dueDate: null,
          notes: 'This job was not cached for offline access. Please go online to view this job.',
          estimatedHours: null,
          batteryType: null,
          batteryModel: null,
          batterySerial: null,
          equipmentType: null,
          equipmentModel: null,
          equipmentSerial: null,
          assignedToId: null,
          customer: {
            id: 'unknown',
            name: 'Job Not Available Offline',
            phone: null,
            email: null
          },
          location: null,
          contact: null,
          assignedTo: null
        })
        
        setFormData({
          status: 'NOT_FOUND',
          notes: 'This job is not available offline. Please go online to view this job.',
          dueDate: '',
          batterySerial: '',
          equipmentSerial: ''
        })
        setLoading(false)
        return
      }
      
    } catch (error) {
      console.error('Error fetching job:', error)
      
      // If we have cached data, show a helpful message
      if (cachedJobs.length > 0) {
        console.log('📱 Job not found, but we have cached jobs available')
        // Set a placeholder job to show helpful message
        setJob({
          id: jobId,
          jobNumber: 'Not Found',
          description: 'This job is not available offline',
          status: 'NOT_FOUND',
          serviceType: 'UNKNOWN',
          dueDate: null,
          notes: 'This job was not cached for offline access. Please go online to view this job.',
          estimatedHours: null,
          batteryType: null,
          batteryModel: null,
          batterySerial: null,
          equipmentType: null,
          equipmentModel: null,
          equipmentSerial: null,
          assignedToId: null,
          customer: {
            id: 'unknown',
            name: 'Job Not Available Offline',
            phone: null,
            email: null
          },
          location: null,
          contact: null,
          assignedTo: null
        })
        
        setFormData({
          status: 'NOT_FOUND',
          notes: 'This job is not available offline. Please go online to view this job.',
          dueDate: '',
          batterySerial: '',
          equipmentSerial: ''
        })
      } else {
        console.log('📱 No cached jobs available')
      }
    } finally {
      setLoading(false)
      isFetchingRef.current = false
    }
  }, [jobId, cachedJobs, cacheIsOnline]) // Include dependencies but use refs to prevent infinite loops
  
  // Store fetchJob in ref for stable reference
  useEffect(() => {
    fetchJobRef.current = fetchJob
  }, [fetchJob])

  // Initial fetch on mount
  useEffect(() => {
    if (fetchJobRef.current && !isFetchingRef.current) {
      fetchJobRef.current()
    }
  }, []) // Only run on mount

  // Re-fetch job when cached jobs change (in case cache was loaded after component mount)
  useEffect(() => {
    if (cachedJobs.length > 0 && !job && fetchJobRef.current && !isFetchingRef.current) {
      console.log('📱 Cached jobs loaded, re-fetching job:', jobId)
      fetchJobRef.current()
    }
  }, [cachedJobs.length, jobId, job]) // Include job dependency

  // Refresh job data when sync status changes (e.g., when offline updates are synced)
  useEffect(() => {
    if (editingSyncStatus && fetchJobRef.current && !isFetchingRef.current) {
      const currentPendingUpdates = editingSyncStatus.pendingUpdates
      const previousPendingUpdates = previousPendingUpdatesRef.current
      
      // Only refresh if pending updates went from > 0 to 0 (sync completed)
      // Skip if this is the first time we're seeing the sync status
      if (previousPendingUpdates !== null && previousPendingUpdates > 0 && currentPendingUpdates === 0) {
        console.log('🔄 Sync completed, refreshing job data to show latest changes')
        fetchJobRef.current()
      } else if (previousPendingUpdates === null) {
        // First time seeing sync status, just store the current value
        console.log('📊 Initial sync status:', currentPendingUpdates, 'pending updates')
      }
      
      // Update the previous value
      previousPendingUpdatesRef.current = currentPendingUpdates
    }
  }, [editingSyncStatus?.pendingUpdates]) // Only depend on pendingUpdates to prevent infinite loops

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleDropdownChange = (e: { target: { name: string; value: string } }) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const startEditingSection = (section: keyof typeof editingSections) => {
    if (!canEditThisJob) return
    setEditingSections(prev => ({ ...prev, [section]: true }))
  }

  const cancelEditingSection = (section: keyof typeof editingSections) => {
    if (!job) return
    
    // Reset form data for this section
    if (section === 'status') {
      setFormData(prev => ({ ...prev, status: job.status || 'OPEN' }))
    } else if (section === 'notes') {
      setFormData(prev => ({ ...prev, notes: job.notes || '' }))
    } else if (section === 'battery') {
      setFormData(prev => ({ ...prev, batterySerial: job.batterySerial || '' }))
    } else if (section === 'equipment') {
      setFormData(prev => ({ ...prev, equipmentSerial: job.equipmentSerial || '' }))
    }
    
    setEditingSections(prev => ({ ...prev, [section]: false }))
  }

  const handleSaveSection = async (section: keyof typeof editingSections) => {
    if (!job || !canEditThisJob) return
    
    try {
      setIsSaving(true)
      
      // Only update the fields for the specific section being saved
      const updateData: {
        status?: string
        notes?: string | null
        completedDate?: Date | null
        batterySerial?: string
        equipmentSerial?: string
        dueDate?: Date | null
      } = {}
      
      if (section === 'status') {
        updateData.status = formData.status
      } else if (section === 'notes') {
        updateData.notes = formData.notes || null
      } else if (section === 'battery') {
        updateData.batterySerial = formData.batterySerial || undefined
      } else if (section === 'equipment') {
        updateData.equipmentSerial = formData.equipmentSerial || undefined
      }
      
      // Always preserve the current due date when making any updates
      // This prevents the due date from being lost during partial updates
      if (job?.dueDate) {
        updateData.dueDate = new Date(job.dueDate)
      }
      
      // Update cached job first
      const cacheUpdateData = {
        ...updateData,
        dueDate: updateData.dueDate ? updateData.dueDate.toISOString().split('T')[0] : null
      }
      await updateCachedJob(jobId, cacheUpdateData)
      
      // Update local state
      setJob(prev => prev ? { 
        ...prev, 
        ...updateData,
        dueDate: updateData.dueDate ? updateData.dueDate.toISOString().split('T')[0] : prev.dueDate
      } : null)
      setEditingSections(prev => ({ ...prev, [section]: false }))
      
      // Try to sync to server if online, otherwise queue for offline sync
      if (cacheIsOnline && editingIsOnline) {
        try {
          console.log('🔄 Attempting to sync job update to server:', updateData)
          
          const response = await fetch(`/api/jobs/${jobId}`, {
            method: 'PUT',
            headers: { 
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              ...updateData,
              offlineUpdate: false,
              timestamp: Date.now()
            }),
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
            
            throw new Error(`Failed to update job: ${response.status} ${response.statusText} - ${errorText}`)
          }
          
          const updatedJob = await response.json()
          setJob(updatedJob)
          console.log('✅ Job synced to server successfully')
          
          // Notify other pages about the job update
          if (typeof window !== 'undefined' && (window as unknown as { syncManager?: { notifyJobUpdate: (jobId: string, updateData: Record<string, unknown>) => void } }).syncManager) {
            (window as unknown as { syncManager: { notifyJobUpdate: (jobId: string, updateData: Record<string, unknown>) => void } }).syncManager.notifyJobUpdate(jobId, updateData)
          }
        } catch (syncError) {
          console.warn('Failed to sync to server, queuing for offline sync:', syncError)
          // Queue for offline sync
          await queueJobUpdate(updateData)
        }
      } else {
        console.log('📱 Offline - job saved locally, queuing for sync when online')
        // Queue for offline sync
        await queueJobUpdate(updateData)
        
        // Dispatch custom event to trigger sync when online
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('job-updated-offline', {
            detail: { jobId, updateData }
          }))
        }
      }
    } catch (error) {
      console.error('Error updating job:', error)
      alert(`Failed to save changes: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSaving(false)
    }
  }


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Job not found</h2>
          <p className="mt-2 text-gray-600">The job you&apos;re looking for doesn&apos;t exist.</p>
        </div>
      </div>
    )
  }

  // Technicians can view all jobs but only edit their own
  // const canView = true // Technicians can always view jobs
  const canEditThisJob = canEdit // But only edit jobs assigned to them

  const StatusBadge = ({ status }: { status: string }) => {
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.OPEN
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Header */}
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Job #{job.jobNumber}
              </h1>
              <p className="text-sm text-gray-600">{job.description}</p>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowTemplateGenerator(true)}
                className="flex items-center space-x-2 bg-green-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-700"
              >
                <DocumentTextIcon className="h-4 w-4" />
                <span>Generate Report</span>
              </button>
              
              {debugMode && (
                <button
                  onClick={() => setShowDebugInfo(!showDebugInfo)}
                  className="flex items-center space-x-2 bg-gray-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-gray-700"
                >
                  <span>Debug</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* View/Edit Mode Indicators */}
        {!canEditThisJob && (
          <div className="max-w-7xl mx-auto mb-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-4">
              <p className="text-sm text-blue-800 font-medium">
                View Only - 
                <span className="font-normal"> This job is {job.assignedTo ? `assigned to ${job.assignedTo.name}` : 'unassigned'}. You can view details but cannot edit.</span>
              </p>
            </div>
          </div>
        )}

        {/* Debug Info Panel - only show when debug mode is enabled */}
        {debugMode && showDebugInfo && (
          <div className="max-w-7xl mx-auto mb-6 bg-gray-100 border border-gray-300 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-gray-700">Debug Information</h3>
              <button
                onClick={clearDebugInfo}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Clear
              </button>
            </div>
            <div className="bg-black text-green-400 p-3 rounded text-xs font-mono max-h-32 overflow-y-auto">
              {debugInfo.length === 0 ? (
                <div className="text-gray-500">No debug information yet. Try loading this job to see what happens.</div>
              ) : (
                debugInfo.map((info, index) => (
                  <div key={index} className="mb-1">{info}</div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Job Content */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="space-y-6">
            {/* Job Status & Progress */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Job Status & Progress
                {canEditThisJob && (
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Editable
                  </span>
                )}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Current Status
                    </label>
                    {canEditThisJob && !editingSections.status && (
                      <button
                        onClick={() => startEditingSection('status')}
                        className="text-green-600 hover:text-green-700 text-sm font-medium touch-manipulation"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                  {editingSections.status && canEditThisJob ? (
                    <div className="space-y-3">
                      <CustomDropdown
                        name="status"
                        value={formData.status}
                        onChange={handleDropdownChange}
                        options={[
                          { value: 'OPEN', label: 'Open' },
                          { value: 'VISITED', label: 'Visited' },
                          { value: 'COMPLETE', label: 'Complete' },
                          { value: 'NEEDS_QUOTE', label: 'Needs Quote' },
                          { value: 'ON_HOLD', label: 'On Hold' }
                        ]}
                      />
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleSaveSection('status')}
                          disabled={isSaving}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 active:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                        >
                          <CheckIcon className="h-4 w-4 mr-1" />
                          {isSaving ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={() => cancelEditingSection('status')}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 active:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 touch-manipulation"
                        >
                          <XMarkIcon className="h-4 w-4 mr-1" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-1">
                      <StatusBadge status={job.status} />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Scheduled Date
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {job.dueDate ? format(new Date(job.dueDate), 'EEEE, MMM d, yyyy') : 'Not scheduled'}
                  </p>
                </div>
              </div>
            </div>

            {/* Equipment Details */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">
                  Equipment Details
                  {canEditThisJob && (
                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Editable
                    </span>
                  )}
                </h2>
                {canEditThisJob && !editingSections.battery && !editingSections.equipment && (
                  <button
                    onClick={() => {
                      startEditingSection('battery')
                      startEditingSection('equipment')
                    }}
                    className="text-green-600 hover:text-green-700 text-sm font-medium touch-manipulation"
                  >
                    Edit
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Battery Type
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {job.batteryType || 'Not specified'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Battery Model
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {job.batteryModel || 'Not specified'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Battery Serial Number
                  </label>
                  {editingSections.battery && canEditThisJob ? (
                    <input
                      type="text"
                      name="batterySerial"
                      value={formData.batterySerial}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg shadow-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 hover:border-gray-400 transition-colors duration-200 touch-manipulation"
                      placeholder="Enter battery serial number"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">
                      {job.batterySerial || 'Not recorded'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Equipment Serial Number
                  </label>
                  {editingSections.equipment && canEditThisJob ? (
                    <input
                      type="text"
                      name="equipmentSerial"
                      value={formData.equipmentSerial}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg shadow-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 hover:border-gray-400 transition-colors duration-200 touch-manipulation"
                      placeholder="Enter equipment serial number"
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">
                      {job.equipmentSerial || 'Not recorded'}
                    </p>
                  )}
                </div>
              </div>
              {(editingSections.battery || editingSections.equipment) && canEditThisJob && (
                <div className="mt-4 flex items-center space-x-2">
                  <button
                    onClick={() => {
                      handleSaveSection('battery')
                      handleSaveSection('equipment')
                    }}
                    disabled={isSaving}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 active:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                  >
                    <CheckIcon className="h-4 w-4 mr-1" />
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => {
                      cancelEditingSection('battery')
                      cancelEditingSection('equipment')
                    }}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 active:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 touch-manipulation"
                  >
                    <XMarkIcon className="h-4 w-4 mr-1" />
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">
                  Work Notes
                  {canEditThisJob && (
                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Editable
                    </span>
                  )}
                </h2>
                {canEditThisJob && !editingSections.notes && (
                  <button
                    onClick={() => startEditingSection('notes')}
                    className="text-green-600 hover:text-green-700 text-sm font-medium touch-manipulation"
                  >
                    Edit
                  </button>
                )}
              </div>
              {editingSections.notes && canEditThisJob ? (
                <div className="space-y-3">
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg shadow-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 hover:border-gray-400 transition-colors duration-200 resize-vertical touch-manipulation"
                    placeholder="Add notes about the work performed, issues encountered, or recommendations..."
                  />
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleSaveSection('notes')}
                      disabled={isSaving}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 active:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                    >
                      <CheckIcon className="h-4 w-4 mr-1" />
                      {isSaving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => cancelEditingSection('notes')}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 active:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 touch-manipulation"
                    >
                      <XMarkIcon className="h-4 w-4 mr-1" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-900 whitespace-pre-wrap">
                  {job.notes || 'No notes added yet.'}
                </p>
              )}
            </div>

            {/* Photos */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center justify-between">
                <div className="flex items-center">
                  <CameraIcon className="h-5 w-5 mr-2" />
                  Job Photos
                </div>
                <div className="flex items-center justify-between text-sm font-medium">
                  <div className="flex items-center">
                    {syncStatus ? (
                      <>
                        {syncStatus.isOnline ? (
                          <span className="text-green-600">● Online</span>
                        ) : (
                          <span className="text-red-600">● Offline</span>
                        )}
                        {syncStatus.pendingPhotos > 0 && (
                          <span className="ml-2 text-yellow-600">
                            ({syncStatus.pendingPhotos} pending)
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-gray-400">● Loading...</span>
                    )}
                  </div>
                  
                  {/* Manual sync button */}
                  {syncStatus?.isOnline && (
                    <button
                      onClick={() => {
                        console.log('🔄 Manual sync triggered from job detail')
                        if ((window as unknown as { triggerSync?: () => void }).triggerSync) {
                          (window as unknown as { triggerSync: () => void }).triggerSync()
                        } else if (syncManager) {
                          syncManager.checkAndSyncNow()
                        }
                      }}
                      className="ml-4 px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      disabled={syncStatus?.isSyncing}
                    >
                      {syncStatus?.isSyncing ? 'Syncing...' : 'Sync Now'}
                    </button>
                  )}
                </div>
              </h2>
              <OfflinePhotoCapture 
                jobId={job.id} 
                onSyncStatusChange={(status) => {
                  console.log('Sync status changed:', status)
                  setSyncStatus(status)
                }}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Job Info */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Job Information</h3>
                <div className="flex items-center space-x-2">
                  {job && (job as Job & { _offlineUpdates?: { hasPendingUpdates: boolean } })._offlineUpdates?.hasPendingUpdates && (
                    <div className="flex items-center text-sm text-yellow-600">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2 animate-pulse"></div>
                      <span>Pending offline updates</span>
                    </div>
                  )}
                  <button
                    onClick={async () => {
                      console.log('🔄 Manual sync triggered')
                      await syncManager.checkAndSyncNow()
                    }}
                    className="text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors"
                    title="Sync offline changes"
                  >
                    Sync Now
                  </button>
                </div>
              </div>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Service Type</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {job.serviceType.replace(/_/g, ' ')}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Scheduled Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {job.dueDate ? format(new Date(job.dueDate), 'EEEE, MMM d, yyyy') : 'Not scheduled'}
                  </dd>
                </div>
                {job.assignedToId && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Assigned To</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {job.assignedToId === user.id ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          You
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Another Technician
                        </span>
                      )}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Customer Info */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Customer</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{job.customer.name}</p>
                </div>
                {job.customer.phone && (
                  <div className="flex items-center text-sm text-gray-600">
                    <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
                    <a href={`tel:${job.customer.phone}`} className="hover:text-green-600">
                      {job.customer.phone}
                    </a>
                  </div>
                )}
                {job.customer.email && (
                  <div className="flex items-center text-sm text-gray-600">
                    <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" />
                    <a href={`mailto:${job.customer.email}`} className="hover:text-green-600">
                      {job.customer.email}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Location Info */}
            {job.location && (
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Location</h3>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <MapPinIcon className="h-4 w-4 mr-2 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-gray-600">
                      <p className="font-medium text-gray-900">{job.location.name}</p>
                      {job.location.address && <p>{job.location.address}</p>}
                      {job.location.city && <p>{job.location.city}</p>}
                    </div>
                  </div>
                  {job.location.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
                      <a href={`tel:${job.location.phone}`} className="hover:text-green-600">
                        {job.location.phone}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Contact Info */}
            {job.contact && (
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Contact</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {job.contact.firstName} {job.contact.lastName}
                    </p>
                    {job.contact.title && (
                      <p className="text-sm text-gray-600">{job.contact.title}</p>
                    )}
                  </div>
                  {job.contact.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
                      <a href={`tel:${job.contact.phone}`} className="hover:text-green-600">
                        {job.contact.phone}
                      </a>
                    </div>
                  )}
                  {job.contact.email && (
                    <div className="flex items-center text-sm text-gray-600">
                      <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" />
                      <a href={`mailto:${job.contact.email}`} className="hover:text-green-600">
                        {job.contact.email}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Map */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Location Map</h3>
                {routeInfo && (
                  <div className="text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded-lg">
                    <span className="font-medium">{routeInfo.distance}</span>
                    <span className="mx-2">•</span>
                    <span>{routeInfo.duration}</span>
                  </div>
                )}
              </div>
              <div className="h-64 lg:h-80 rounded-lg overflow-hidden">
                {job.location?.address ? (
                  <div>
                    {debugMode && (
                      <>
                        <div className="text-xs text-gray-400 mb-2">
                          Debug: Origin: {COMPANY_CONFIG.fullAddress} | Destination: {job.location.address}, {job.location.city || ''}
                        </div>
                        <div className="text-xs text-gray-400 mb-2">
                          Address components: address=&quot;{job.location.address}&quot; city=&quot;{job.location.city}&quot; country=&quot;UK&quot;
                        </div>
                        <div className="text-xs text-blue-400 mb-2">
                          Mapbox Token: {process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ? '✅ Present' : '❌ Missing'}
                        </div>
                      </>
                    )}
                    <MapboxMaps
                      origin={COMPANY_CONFIG.fullAddress}
                      destination={`${job.location.address}, ${job.location.city || ''}`}
                      className="w-full h-full"
                      onRouteInfo={handleRouteInfo}
                    />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
                    <div className="text-center">
                      <p className="text-gray-500">No location address available</p>
                      {debugMode && (
                        <p className="text-xs text-gray-400 mt-1">Debug: job.location = {JSON.stringify(job.location)}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              {routeInfo && (
                <div className="mt-3 text-xs text-gray-500">
                  <p>Route from {COMPANY_CONFIG.name} to {job.location?.name || 'client location'}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Template Generator Modal */}
      {showTemplateGenerator && (
        <TemplateGenerator
          jobData={job as unknown as Record<string, unknown>}
          onClose={() => setShowTemplateGenerator(false)}
        />
      )}
    </div>
  )
}

