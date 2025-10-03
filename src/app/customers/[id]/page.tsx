'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { 
  PencilIcon, 
  CheckIcon, 
  XMarkIcon,
  PlusIcon,
  UserGroupIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  ChartBarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import CustomDropdown from '@/components/CustomDropdown'
// import { getCustomerFilters, buildCustomersUrl } from '@/lib/customer-filters'

type CustomerStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
type CustomerType = 'DIRECT' | 'REFERRED'
type LocationStatus = 'ACTIVE' | 'INACTIVE' | 'CLOSED'

interface Contact {
  id: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  title: string | null
  department: string | null
  isPrimary: boolean
  locationId: string | null
  createdAt: string
  updatedAt: string
}

interface Location {
  id: string
  name: string
  address: string
  city: string
  state: string
  zipCode: string
  country: string
  phone: string | null
  email: string | null
  status: LocationStatus
  createdAt: string
  updatedAt: string
  _count: {
    jobs: number
    contacts: number
  }
}

interface Customer {
  id: string
  name: string
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  zipCode: string | null
  country: string | null
  status: CustomerStatus
  customerType: CustomerType
  referralNotes: string | null
  createdAt: string
  updatedAt: string
  serviceProvider: {
    id: string
    name: string
  } | null
  locations: Location[]
  contacts: Contact[]
  _count: {
    jobs: number
    locations: number
    contacts: number
  }
}

const statusConfig = {
  ACTIVE: { bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-200', dot: 'bg-green-400' },
  INACTIVE: { bg: 'bg-gray-50', text: 'text-gray-800', border: 'border-gray-200', dot: 'bg-gray-400' },
  SUSPENDED: { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-200', dot: 'bg-red-400' }
}

const customerTypeConfig = {
  DIRECT: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
  REFERRED: { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200' }
}

const locationStatusConfig = {
  ACTIVE: { bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-200', dot: 'bg-green-400' },
  INACTIVE: { bg: 'bg-gray-50', text: 'text-gray-800', border: 'border-gray-200', dot: 'bg-gray-400' },
  CLOSED: { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-200', dot: 'bg-red-400' }
}

// Badge Component
const Badge = ({ 
  children, 
  size = 'sm',
  className = ''
}: {
  children: React.ReactNode
  size?: 'sm' | 'md'
  className?: string
}) => {
  const baseClasses = 'inline-flex items-center font-medium rounded-full border'
  const sizeClasses = size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm'
  
  return (
    <span className={`${baseClasses} ${sizeClasses} ${className}`}>
      {children}
    </span>
  )
}

// Status Badge Component
const StatusBadge = ({ status }: { status: CustomerStatus }) => {
  const config = statusConfig[status]
  return (
    <Badge 
      className={`${config.bg} ${config.text} ${config.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} mr-1.5`} />
      {status}
    </Badge>
  )
}

// Customer Type Badge Component
const CustomerTypeBadge = ({ customerType }: { customerType: CustomerType }) => {
  const config = customerTypeConfig[customerType]
  
  return (
    <Badge 
      className={`${config.bg} ${config.text} ${config.border}`}
    >
      {customerType === 'DIRECT' ? 'Direct' : 'Referred'}
    </Badge>
  )
}

// Location Status Badge Component
const LocationStatusBadge = ({ status }: { status: LocationStatus }) => {
  const config = locationStatusConfig[status]
  return (
    <Badge 
      className={`${config.bg} ${config.text} ${config.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} mr-1.5`} />
      {status}
    </Badge>
  )
}

export default function CustomerDetailPage() {
  const router = useRouter()
  const params = useParams()
  // const searchParams = useSearchParams()
  const customerId = params.id as string

  // Get return URL from query params or use localStorage-based customers URL
  // const returnUrl = searchParams.get('return') || (() => {
  //   const filters = getCustomerFilters()
  //   return buildCustomersUrl(filters)
  // })()

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    status: 'ACTIVE' as CustomerStatus,
    customerType: 'DIRECT' as CustomerType,
    referralNotes: '',
    serviceProviderId: ''
  })

  const fetchCustomer = useCallback(async () => {
    try {
      const response = await fetch(`/api/customers/${customerId}`)
      if (response.ok) {
        const customerData = await response.json()
        setCustomer(customerData)
        setFormData({
          name: customerData.name || '',
          email: customerData.email || '',
          phone: customerData.phone || '',
          address: customerData.address || '',
          city: customerData.city || '',
          state: customerData.state || '',
          zipCode: customerData.zipCode || '',
          country: customerData.country || '',
          status: customerData.status,
          customerType: customerData.customerType,
          referralNotes: customerData.referralNotes || '',
          serviceProviderId: customerData.serviceProvider?.id || ''
        })
      } else {
        console.error('Failed to fetch customer')
      }
    } catch (error) {
      console.error('Error fetching customer:', error)
    } finally {
      setLoading(false)
    }
  }, [customerId])

  useEffect(() => {
    if (customerId) {
      fetchCustomer()
    }
  }, [customerId, fetchCustomer])

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const updatedCustomer = await response.json()
        setCustomer(updatedCustomer)
        setEditing(false)
      } else {
        console.error('Failed to update customer')
      }
    } catch (error) {
      console.error('Error updating customer:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || '',
        city: customer.city || '',
        state: customer.state || '',
        zipCode: customer.zipCode || '',
        country: customer.country || '',
        status: customer.status,
        customerType: customer.customerType,
        referralNotes: customer.referralNotes || '',
        serviceProviderId: customer.serviceProvider?.id || ''
      })
    }
    setEditing(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Loading customer...</p>
        </div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Customer not found</h3>
          <p className="text-sm text-gray-500 mb-4">
            The customer you&apos;re looking for doesn&apos;t exist or has been deleted.
          </p>
          <button
            onClick={() => router.push('/customers')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Back to Customers
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {customer.name}
              </h1>
              <div className="flex items-center space-x-4 mt-2">
                <StatusBadge status={customer.status} />
                <CustomerTypeBadge customerType={customer.customerType} />
                {customer.serviceProvider && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    Referred by {customer.serviceProvider.name}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {editing ? (
                <>
                  <button
                    onClick={handleCancel}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <XMarkIcon className="w-4 h-4 mr-2" />
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    <CheckIcon className="w-4 h-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <PencilIcon className="w-4 h-4 mr-2" />
                  Edit Customer
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Customer Information */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Customer Information</h2>
              </div>
              <div className="p-6">
                {editing ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company Name *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                      </label>
                      <CustomDropdown
                        name="status"
                        value={formData.status}
                        onChange={(value) => setFormData({ ...formData, status: value.target.value as CustomerStatus })}
                        options={[
                          { value: 'ACTIVE', label: 'Active' },
                          { value: 'INACTIVE', label: 'Inactive' },
                          { value: 'SUSPENDED', label: 'Suspended' }
                        ]}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Customer Type
                      </label>
                      <CustomDropdown
                        name="customerType"
                        value={formData.customerType}
                        onChange={(value) => setFormData({ ...formData, customerType: value.target.value as CustomerType })}
                        options={[
                          { value: 'DIRECT', label: 'Direct' },
                          { value: 'REFERRED', label: 'Referred' }
                        ]}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address
                      </label>
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City
                      </label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        State
                      </label>
                      <input
                        type="text"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ZIP Code
                      </label>
                      <input
                        type="text"
                        value={formData.zipCode}
                        onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Country
                      </label>
                      <input
                        type="text"
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    {formData.customerType === 'REFERRED' && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Referral Notes
                        </label>
                        <textarea
                          value={formData.referralNotes}
                          onChange={(e) => setFormData({ ...formData, referralNotes: e.target.value })}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          placeholder="Notes about the referral relationship..."
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                      <p className="text-sm text-gray-900">{customer.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <p className="text-sm text-gray-900">{customer.email || '—'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <p className="text-sm text-gray-900">{customer.phone || '—'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <StatusBadge status={customer.status} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Customer Type</label>
                      <CustomerTypeBadge customerType={customer.customerType} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                      <p className="text-sm text-gray-900">
                        {customer.address ? (
                          <>
                            {customer.address}
                            {customer.city && <><br />{customer.city}, {customer.state} {customer.zipCode}</>}
                            {customer.country && <><br />{customer.country}</>}
                          </>
                        ) : '—'}
                      </p>
                    </div>
                    {customer.referralNotes && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Referral Notes</label>
                        <p className="text-sm text-gray-900">{customer.referralNotes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Locations */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900">Locations</h2>
                  <button className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                    <PlusIcon className="w-4 h-4 mr-1" />
                    Add Location
                  </button>
                </div>
              </div>
              <div className="p-6">
                {customer.locations.length === 0 ? (
                  <div className="text-center py-8">
                    <MapPinIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-sm font-medium text-gray-900 mb-2">No locations</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Add locations for this customer to organize jobs and contacts.
                    </p>
                    <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                      <PlusIcon className="w-4 h-4 mr-2" />
                      Add First Location
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {customer.locations.map((location) => (
                      <div key={location.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-sm font-medium text-gray-900">{location.name}</h3>
                              <LocationStatusBadge status={location.status} />
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center text-sm text-gray-600">
                                <MapPinIcon className="h-4 w-4 mr-2 text-gray-400" />
                                {location.address}, {location.city}, {location.state} {location.zipCode}
                              </div>
                              {location.phone && (
                                <div className="flex items-center text-sm text-gray-600">
                                  <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
                                  {location.phone}
                                </div>
                              )}
                              {location.email && (
                                <div className="flex items-center text-sm text-gray-600">
                                  <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" />
                                  {location.email}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center space-x-4 mt-3">
                              <div className="flex items-center text-sm text-gray-600">
                                <ChartBarIcon className="h-4 w-4 mr-1 text-gray-400" />
                                <span className="font-medium">{location._count.jobs}</span>
                                <span className="ml-1">jobs</span>
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                <UserGroupIcon className="h-4 w-4 mr-1 text-gray-400" />
                                <span className="font-medium">{location._count.contacts}</span>
                                <span className="ml-1">contacts</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <button className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                              <PencilIcon className="w-3.5 h-3.5 mr-1" />
                              Edit
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Contacts */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900">Contacts</h2>
                  <button className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                    <PlusIcon className="w-4 h-4 mr-1" />
                    Add Contact
                  </button>
                </div>
              </div>
              <div className="p-6">
                {customer.contacts.length === 0 ? (
                  <div className="text-center py-8">
                    <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-sm font-medium text-gray-900 mb-2">No contacts</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Add contacts for this customer to manage communication.
                    </p>
                    <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                      <PlusIcon className="w-4 h-4 mr-2" />
                      Add First Contact
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {customer.contacts.map((contact) => (
                      <div key={contact.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="text-sm font-medium text-gray-900">
                                {contact.firstName} {contact.lastName}
                              </h3>
                              {contact.isPrimary && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Primary
                                </span>
                              )}
                            </div>
                            <div className="space-y-1">
                              {contact.title && (
                                <p className="text-sm text-gray-600">{contact.title}</p>
                              )}
                              {contact.department && (
                                <p className="text-sm text-gray-600">{contact.department}</p>
                              )}
                              {contact.email && (
                                <div className="flex items-center text-sm text-gray-600">
                                  <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" />
                                  {contact.email}
                                </div>
                              )}
                              {contact.phone && (
                                <div className="flex items-center text-sm text-gray-600">
                                  <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
                                  {contact.phone}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <button className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                              <PencilIcon className="w-3.5 h-3.5 mr-1" />
                              Edit
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Quick Stats</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <ChartBarIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-sm font-medium text-gray-700">Total Jobs</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{customer._count.jobs}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <MapPinIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-sm font-medium text-gray-700">Locations</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{customer._count.locations}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <UserGroupIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-sm font-medium text-gray-700">Contacts</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{customer._count.contacts}</span>
                </div>
              </div>
            </div>

            {/* Customer Details */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Details</h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
                  <p className="text-sm text-gray-900">
                    {format(new Date(customer.createdAt), 'MMM d, yyyy')}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
                  <p className="text-sm text-gray-900">
                    {format(new Date(customer.updatedAt), 'MMM d, yyyy')}
                  </p>
                </div>
                {customer.serviceProvider && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Service Provider</label>
                    <p className="text-sm text-gray-900">{customer.serviceProvider.name}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white shadow-sm rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
              </div>
              <div className="p-6 space-y-3">
                <button className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Create Job
                </button>
                <button className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                  <ChartBarIcon className="w-4 h-4 mr-2" />
                  View All Jobs
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
