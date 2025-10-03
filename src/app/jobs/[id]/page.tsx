'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { 
  PencilIcon, 
  CheckIcon, 
  XMarkIcon,
  UserIcon,
  BuildingOfficeIcon,
  WrenchScrewdriverIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline'
import { User } from '@prisma/client'
import MapboxMaps from '@/components/MapboxMaps'
import CustomDropdown from '@/components/CustomDropdown'
import DatePicker from '@/components/DatePicker'
import SearchableCustomerSelect from '@/components/SearchableCustomerSelect'
import { COMPANY_CONFIG } from '@/lib/company-config'
import { getJobFilters, buildJobsUrl } from '@/lib/job-filters'
import { buildUKAddress, formatAddressForDisplay, hasMinimumAddressData, getGeocodingConfidence } from '@/lib/address-utils'
import dynamic from 'next/dynamic'

const OfflinePhotoCapture = dynamic(() => import('@/components/OfflinePhotoCapture'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-200 h-48 rounded-lg"></div>
})

type JobStatus = 'OPEN' | 'COMPLETE' | 'VISITED' | 'NEEDS_QUOTE' | 'ON_HOLD' | 'CANCELLED'
type ServiceType = 'BATTERY_INSPECTION' | 'CHARGER_INSPECTION' | 'BATTERY_CHARGER_INSPECTION' | 'SUPPLY_FIT_BATTERY' | 'SUPPLY_DELIVER_CHARGER' | 'SUPPLY_FIT_CELLS' | 'CHARGER_RENTAL' | 'BATTERY_WATER_TOPPING' | 'BATTERY_REPAIR' | 'BATTERY_RENTAL' | 'CHARGER_REPAIR' | 'PARTS_ORDERED' | 'SITE_SURVEY' | 'DELIVERY' | 'COLLECTION' | 'OTHER'

interface Job {
  id: string
  jobNumber: string
  description: string
  status: JobStatus
  estimatedHours: number | null
  actualHours: number | null
  dueDate: string | null
  startDate: string | null
  endDate: string | null
  notes: string | null
  batteryType: string | null
  batteryModel: string | null
  batterySerial: string | null
  serviceType: ServiceType
  equipmentType: string | null
  equipmentModel: string | null
  equipmentSerial: string | null
  customer: {
    id: string
    name: string
    email: string
    phone: string
    address: string
    city: string
    state: string
    zipCode: string
    customerType: 'DIRECT' | 'REFERRED'
    serviceProvider?: {
      id: string
      name: string
    }
  }
  location?: {
    id: string
    name: string
    address: string
    city: string
    state: string
    zipCode: string
  }
  contact?: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string
    title: string
    department: string
  }
  photos: Array<{
    id: string
    url: string
    caption: string | null
    originalName: string
    createdAt: string
    isPrimary: boolean
  }>
  assignedToId?: string | null
}

const statusConfig = {
  OPEN: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200', dot: 'bg-blue-600' },
  VISITED: { bg: 'bg-yellow-50', text: 'text-yellow-800', border: 'border-yellow-200', dot: 'bg-yellow-600' },
  COMPLETE: { bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-200', dot: 'bg-green-600' },
  NEEDS_QUOTE: { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200', dot: 'bg-purple-600' },
  ON_HOLD: { bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-200', dot: 'bg-orange-600' },
  CANCELLED: { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-200', dot: 'bg-red-600' }
}

const serviceTypeConfig = {
  BATTERY_INSPECTION: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
  CHARGER_INSPECTION: { bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-200' },
  BATTERY_CHARGER_INSPECTION: { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200' },
  SUPPLY_FIT_BATTERY: { bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-200' },
  SUPPLY_DELIVER_CHARGER: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
  SUPPLY_FIT_CELLS: { bg: 'bg-teal-50', text: 'text-teal-800', border: 'border-teal-200' },
  CHARGER_RENTAL: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  BATTERY_WATER_TOPPING: { bg: 'bg-cyan-50', text: 'text-cyan-800', border: 'border-cyan-200' },
  BATTERY_REPAIR: { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-200' },
  BATTERY_RENTAL: { bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-200' },
  CHARGER_REPAIR: { bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200' },
  PARTS_ORDERED: { bg: 'bg-violet-50', text: 'text-violet-800', border: 'border-violet-200' },
  SITE_SURVEY: { bg: 'bg-slate-50', text: 'text-slate-800', border: 'border-slate-200' },
  DELIVERY: { bg: 'bg-lime-50', text: 'text-lime-800', border: 'border-lime-200' },
  COLLECTION: { bg: 'bg-yellow-50', text: 'text-yellow-800', border: 'border-yellow-200' },
  OTHER: { bg: 'bg-gray-50', text: 'text-gray-800', border: 'border-gray-200' }
}

const getDisplayName = (type: ServiceType) => {
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .replace(/\//g, '/')
}

// Build customer address using utility function
const buildCustomerAddress = (customer: Job['customer']) => {
  return buildUKAddress({
    address: customer.address,
    city: customer.city,
    state: customer.state,
    zipCode: customer.zipCode,
    country: 'UK'
  })
}

export default function JobDetailPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const jobId = params.id as string
  
  // Get return URL from query params or use localStorage-based jobs URL
  const returnUrl = searchParams.get('return') || (() => {
    const filters = getJobFilters()
    return buildJobsUrl(filters)
  })()
  
  const [job, setJob] = useState<Job | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isCloning, setIsCloning] = useState(false)
  const [customers, setCustomers] = useState<Array<{ id: string; name: string }>>([])
  const [locations, setLocations] = useState<Array<{ id: string; name: string; customerId: string }>>([])
  const [contacts, setContacts] = useState<Array<{ id: string; firstName: string; lastName: string; customerId: string }>>([])
  const [technicians, setTechnicians] = useState<User[]>([])
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; photoId: string | null; photoName: string }>({
    isOpen: false,
    photoId: null,
    photoName: ''
  })

  // Form state
  const [formData, setFormData] = useState({
    serviceType: 'BATTERY_INSPECTION' as ServiceType,
    customerId: '',
    locationId: '',
    contactId: '',
    status: 'OPEN' as JobStatus,
    dueDate: '',
    notes: '',
    assignedToId: null as string | null
  })

  const isNewJob = jobId === 'new'

  // Check for edit query parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('edit') === 'true') {
      setIsEditing(true)
    }
  }, [])

  const fetchJob = useCallback(async () => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`)
      if (!response.ok) throw new Error('Failed to fetch job')
      const jobData = await response.json()
      setJob(jobData)
      
      // Populate form data
      setFormData({
        serviceType: jobData.serviceType,
        customerId: jobData.customer.id,
        locationId: jobData.location?.id || '',
        contactId: jobData.contact?.id || '',
        status: jobData.status,
        dueDate: jobData.dueDate ? (() => {
          const date = new Date(jobData.dueDate)
          const year = date.getFullYear()
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const day = String(date.getDate()).padStart(2, '0')
          return `${year}-${month}-${day}`
        })() : '',
        notes: jobData.notes || '',
        assignedToId: jobData.assignedToId || null
      })
      
      fetchCustomers()
    } catch (error) {
      console.error('Error fetching job:', error)
    } finally {
      setIsLoading(false)
    }
  }, [jobId])

  useEffect(() => {
    if (isNewJob) {
      setIsLoading(false)
      setIsEditing(true)
      fetchCustomers()
      fetchTechnicians()
    } else {
      fetchJob()
      fetchTechnicians()
    }
  }, [jobId, fetchJob, isNewJob])

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers')
      if (response.ok) {
        const data = await response.json()
        setCustomers(data.customers || [])
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }

  const fetchTechnicians = async () => {
    try {
      const response = await fetch('/api/technicians')
      if (response.ok) {
        const data = await response.json()
        setTechnicians(data)
      }
    } catch (error) {
      console.error('Error fetching technicians:', error)
    }
  }

  const fetchLocations = async (customerId: string) => {
    try {
      const response = await fetch(`/api/customers/${customerId}/locations`)
      if (response.ok) {
        const data = await response.json()
        setLocations(data)
      }
    } catch (error) {
      console.error('Error fetching locations:', error)
    }
  }

  const fetchContacts = async (customerId: string) => {
    try {
      const response = await fetch(`/api/customers/${customerId}/contacts`)
      if (response.ok) {
        const data = await response.json()
        setContacts(data)
      }
    } catch (error) {
      console.error('Error fetching contacts:', error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    
    // Handle assignedToId specially - convert empty string to null
    if (name === 'assignedToId') {
      setFormData(prev => ({ ...prev, [name]: value || null }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
    
    // Auto-fetch locations and contacts when customer changes
    if (name === 'customerId' && value) {
      fetchLocations(value)
      fetchContacts(value)
      // Reset location and contact when customer changes
      setFormData(prev => ({ ...prev, locationId: '', contactId: '' }))
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const selectedCustomer = customers.find(c => c.id === formData.customerId)
      if (!selectedCustomer) throw new Error('Customer not found')

      // Generate a simple description
      const serviceTypeDisplay = formData.serviceType
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
      
      const jobData = {
        ...formData,
        description: `${serviceTypeDisplay} for ${selectedCustomer.name}`,
        dueDate: formData.dueDate || null
      }

      const url = isNewJob ? '/api/jobs' : `/api/jobs/${jobId}`
      const method = isNewJob ? 'POST' : 'PUT'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobData)
      })

      if (!response.ok) throw new Error('Failed to save job')
      
      const savedJob = await response.json()
      
      if (isNewJob) {
        router.push(`/jobs/${savedJob.id}?return=${encodeURIComponent(returnUrl)}`)
      } else {
        setJob(savedJob)
        setIsEditing(false)
      }
    } catch (error) {
      console.error('Error saving job:', error)
      alert('Failed to save job. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    if (isNewJob) {
      router.push(returnUrl)
    } else {
      setIsEditing(false)
      // Reset form data to original job data
      if (job) {
        setFormData({
          serviceType: job.serviceType,
          customerId: job.customer.id,
          locationId: job.location?.id || '',
          contactId: job.contact?.id || '',
          status: job.status,
          dueDate: job.dueDate ? (() => {
            const date = new Date(job.dueDate)
            const year = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const day = String(date.getDate()).padStart(2, '0')
            return `${year}-${month}-${day}`
          })() : '',
          notes: job.notes || '',
          assignedToId: job.assignedToId || null
        })
      }
    }
  }

  const handleClone = async () => {
    if (!job) return
    
    setIsCloning(true)
    try {
      const response = await fetch(`/api/jobs/${jobId}/clone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) throw new Error('Failed to clone job')
      
      const clonedJob = await response.json()
      
      // Navigate to the new cloned job
      router.push(`/jobs/${clonedJob.id}?return=${encodeURIComponent(returnUrl)}`)
    } catch (error) {
      console.error('Error cloning job:', error)
      alert('Failed to clone job. Please try again.')
    } finally {
      setIsCloning(false)
    }
  }

  const handleDeletePhoto = async (photoId: string) => {
    if (!job) return

    try {
      // Check if we're online
      if (navigator.onLine) {
        // Online: Delete immediately
        const response = await fetch(`/api/jobs/${job.id}/photos?photoId=${photoId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to delete photo')
        }

        // Refresh the job data to get updated photos
        await fetchJob()
      } else {
        // Offline: Save for sync when online
        const { syncManager } = await import('@/lib/sync-manager')
        await syncManager.savePhotoDeletionForOfflineSync(job.id, photoId)
        
        // Remove from local state immediately for better UX
        setJob(prevJob => {
          if (!prevJob) return null
          return {
            ...prevJob,
            photos: prevJob.photos.filter(photo => photo.id !== photoId)
          }
        })
      }
      
      // Close confirmation dialog
      setDeleteConfirm({ isOpen: false, photoId: null, photoName: '' })
    } catch (error) {
      console.error('Error deleting photo:', error)
      alert('Failed to delete photo. Please try again.')
    }
  }

  const confirmDeletePhoto = (photoId: string, photoName: string) => {
    setDeleteConfirm({ isOpen: true, photoId, photoName })
  }

  const cancelDeletePhoto = () => {
    setDeleteConfirm({ isOpen: false, photoId: null, photoName: '' })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {isNewJob ? 'Create New Job' : `Job ${job?.jobNumber}`}
              </h1>
              {job && (
                <p className="text-gray-600 mt-1">{job.description}</p>
              )}
            </div>
            
            {!isNewJob && (
              <div className="flex items-center space-x-3">
                {!isEditing ? (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="inline-flex items-center justify-center w-32 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      <PencilIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                      Edit Job
                    </button>
                    <button
                      onClick={handleClone}
                      disabled={isCloning}
                      className="inline-flex items-center justify-center w-32 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      <DocumentDuplicateIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                      {isCloning ? 'Cloning...' : 'Clone Job'}
                    </button>
                  </>
                ) : (
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="inline-flex items-center justify-center w-32 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                    >
                      <CheckIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                      {isSaving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={handleCancel}
                      className="inline-flex items-center justify-center w-32 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <XMarkIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Edit Mode Indicator */}
        {(isEditing || isNewJob) && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 p-4 mb-6">
            <p className="text-sm text-green-800 font-medium">
              {isNewJob ? 'Creating New Job' : 'Edit Mode Active'} - 
              <span className="font-normal"> Fields are now editable. Don&apos;t forget to save your changes.</span>
            </p>
          </div>
        )}

        {/* Job Form */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="xl:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className={`bg-white shadow rounded-lg p-6 ${(isEditing || isNewJob) ? 'ring-2 ring-green-500 ring-opacity-30' : ''}`}>
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Basic Information
                {(isEditing || isNewJob) && (
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Editable
                  </span>
                )}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Service Type
                  </label>
                  <CustomDropdown
                    name="serviceType"
                    value={formData.serviceType}
                    onChange={(value) => handleInputChange({ target: { name: 'serviceType', value: value.target.value } } as React.ChangeEvent<HTMLSelectElement>)}
                    disabled={!isEditing && !isNewJob}
                    placeholder="Select service type"
                    options={Object.keys(serviceTypeConfig).map((type) => ({
                      value: type,
                      label: getDisplayName(type as ServiceType)
                    }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <CustomDropdown
                    name="status"
                    value={formData.status}
                    onChange={(value) => handleInputChange({ target: { name: 'status', value: value.target.value } } as React.ChangeEvent<HTMLSelectElement>)}
                    disabled={!isEditing && !isNewJob}
                    placeholder="Select status"
                    options={Object.keys(statusConfig).map((status) => ({
                      value: status,
                      label: status.replace('_', ' ')
                    }))}
                  />
                </div>


                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer
                  </label>
                  <SearchableCustomerSelect
                    name="customerId"
                    value={formData.customerId}
                    onChange={(value) => handleInputChange({ target: { name: 'customerId', value: value.target.value } } as React.ChangeEvent<HTMLSelectElement>)}
                    disabled={!isEditing && !isNewJob}
                    placeholder="Search and select customer"
                    customers={customers}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <CustomDropdown
                    name="locationId"
                    value={formData.locationId}
                    onChange={(value) => handleInputChange({ target: { name: 'locationId', value: value.target.value } } as React.ChangeEvent<HTMLSelectElement>)}
                    disabled={!isEditing && !isNewJob}
                    placeholder="Select a location"
                    options={[
                      { value: '', label: 'Select a location' },
                      ...locations.map((location) => ({
                        value: location.id,
                        label: location.name
                      }))
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact
                  </label>
                  <CustomDropdown
                    name="contactId"
                    value={formData.contactId}
                    onChange={(value) => handleInputChange({ target: { name: 'contactId', value: value.target.value } } as React.ChangeEvent<HTMLSelectElement>)}
                    disabled={!isEditing && !isNewJob}
                    placeholder="Select a contact"
                    options={[
                      { value: '', label: 'Select a contact' },
                      ...contacts.map((contact) => ({
                        value: contact.id,
                        label: `${contact.firstName} ${contact.lastName}`
                      }))
                    ]}
                  />
                </div>
              </div>
            </div>

            {/* Schedule */}
            <div className={`bg-white shadow rounded-lg p-6 ${(isEditing || isNewJob) ? 'ring-2 ring-green-500 ring-opacity-30' : ''}`}>
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Schedule
                {(isEditing || isNewJob) && (
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Editable
                  </span>
                )}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assigned Technician
                  </label>
                  <CustomDropdown
                    name="assignedToId"
                    value={formData.assignedToId || ''}
                    onChange={(value) => handleInputChange({ target: { name: 'assignedToId', value: value.target.value } } as React.ChangeEvent<HTMLSelectElement>)}
                    disabled={!isEditing && !isNewJob}
                    placeholder="Select technician..."
                    options={[
                      { value: '', label: 'Unassigned' },
                      ...technicians.map(tech => ({
                        value: tech.id,
                        label: tech.name || tech.email
                      }))
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Scheduled Date
                  </label>
                  <DatePicker
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={(value) => handleInputChange({ target: { name: 'dueDate', value: value.target.value } } as React.ChangeEvent<HTMLInputElement>)}
                    disabled={!isEditing && !isNewJob}
                    placeholder="Select due date"
                    minDate={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
            </div>


            {/* Notes */}
            <div className={`bg-white shadow rounded-lg p-6 ${(isEditing || isNewJob) ? 'ring-2 ring-green-500 ring-opacity-30' : ''}`}>
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Notes
                {(isEditing || isNewJob) && (
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Editable
                  </span>
                )}
              </h2>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                disabled={!isEditing && !isNewJob}
                rows={4}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg shadow-sm bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 hover:border-gray-400 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed disabled:border-gray-200 transition-colors duration-200 resize-vertical"
                placeholder="Add any additional notes about this job..."
              />
            </div>
          </div>

          {/* Maps and Info Sidebar */}
          <div className="space-y-6">
            {/* Route Map */}
            {job && (
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Route to Customer</h3>
                
                {/* Address data warning */}
                {!hasMinimumAddressData(job.customer) && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">
                          Limited Address Information
                        </h3>
                        <div className="mt-1 text-sm text-yellow-700">
                          <p>Insufficient address data for accurate mapping. Please add city or complete address information for better route planning.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="h-96">
                  <MapboxMaps
                    origin="Unit 3, 12 Emery Rd, Brislington, BS4 5PF, UK"
                    destination={buildCustomerAddress(job.customer)}
                    className="h-full"
                    onRouteInfo={setRouteInfo}
                  />
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  <p><strong>From:</strong> {COMPANY_CONFIG.shortAddress}</p>
                  <p><strong>To:</strong> {buildCustomerAddress(job.customer)}</p>
                  <div className="flex justify-between mt-2 pt-2 border-t border-gray-200">
                    <span>📏 Distance: {routeInfo?.distance || 'Calculating...'}</span>
                    <span>⏱️ Travel time: {routeInfo?.duration || 'Calculating...'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Job Status */}
            {job && (
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Job Status</h3>
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full ${statusConfig[job.status].dot} mr-3`}></div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig[job.status].bg} ${statusConfig[job.status].text} ${statusConfig[job.status].border} border`}>
                    {job.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            )}

            {/* Customer Information */}
            {job && (
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Information</h3>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <BuildingOfficeIcon className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">{job.customer.name}</p>
                      <p className="text-sm text-gray-600">{job.customer.address}</p>
                      <p className="text-sm text-gray-600">{formatAddressForDisplay(job.customer)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <UserIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">{job.customer.email}</p>
                      <p className="text-sm text-gray-600">{job.customer.phone}</p>
                    </div>
                  </div>

                  {job.customer.serviceProvider && (
                    <div className="flex items-center">
                      <WrenchScrewdriverIcon className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm text-gray-600">Service Provider:</p>
                        <p className="text-sm font-medium text-gray-900">{job.customer.serviceProvider.name}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Photos */}
            {job && (
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Job Photos</h3>
                
                {/* Unified Photo Management */}
                <OfflinePhotoCapture
                  jobId={job.id}
                  onPhotoAdded={(photo) => {
                    console.log('Photo added offline:', photo)
                    // Optionally refresh the job data or show a success message
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Save/Cancel buttons for new jobs */}
        {isNewJob && (
          <div className="mt-8 flex justify-end space-x-3">
            <button
              onClick={() => router.push(returnUrl)}
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {isSaving ? 'Creating...' : 'Create Job'}
            </button>
          </div>
        )}
      </div>

      {/* Delete Photo Confirmation Dialog */}
      {deleteConfirm.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <XMarkIcon className="h-6 w-6 text-red-600" />
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
