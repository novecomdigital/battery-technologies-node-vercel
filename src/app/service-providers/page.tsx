import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { 
  BuildingOfficeIcon,
  UserGroupIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Service Provider Card Component
interface ServiceProvider {
  id: string
  name: string
  contactPerson?: string | null
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  zipCode: string | null
  country: string | null
  _count?: {
    customers: number
    jobs: number
  }
}

const ServiceProviderCard = ({ serviceProvider }: { serviceProvider: ServiceProvider }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <BuildingOfficeIcon className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {serviceProvider.name}
              </h3>
              <p className="text-sm text-gray-500">
                {serviceProvider.email}
              </p>
            </div>
          </div>
          
          <div className="mt-4 space-y-2">
            {serviceProvider.phone && (
              <div className="flex items-center text-sm text-gray-600">
                <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
                {serviceProvider.phone}
              </div>
            )}
            {serviceProvider.email && (
              <div className="flex items-center text-sm text-gray-600">
                <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" />
                {serviceProvider.email}
              </div>
            )}
            {serviceProvider.address && (
              <div className="flex items-center text-sm text-gray-600">
                <MapPinIcon className="h-4 w-4 mr-2 text-gray-400" />
                <span className="line-clamp-1">{serviceProvider.address}</span>
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center space-x-4">
            <Link 
              href={`/customers?serviceProvider=${serviceProvider.id}`}
              className="flex items-center text-sm text-gray-600 hover:text-green-600 transition-colors"
            >
              <UserGroupIcon className="h-4 w-4 mr-1 text-gray-400" />
              <span className="font-medium">{serviceProvider._count?.customers || 0}</span>
              <span className="ml-1">customers</span>
            </Link>
            <Link 
              href={`/jobs?serviceProvider=${serviceProvider.id}`}
              className="flex items-center text-sm text-gray-600 hover:text-green-600 transition-colors"
            >
              <ChartBarIcon className="h-4 w-4 mr-1 text-gray-400" />
              <span className="font-medium">{serviceProvider._count?.jobs || 0}</span>
              <span className="ml-1">jobs</span>
            </Link>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 ml-4">
          <Link
            href={`/service-providers/${serviceProvider.id}`}
            className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-150"
          >
            <EyeIcon className="w-3.5 h-3.5 mr-1" />
            View
          </Link>
          <Link
            href={`/service-providers/${serviceProvider.id}/edit`}
            className="inline-flex items-center px-2.5 py-1.5 border border-transparent shadow-sm text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-150"
          >
            <PencilIcon className="w-3.5 h-3.5 mr-1" />
            Edit
          </Link>
        </div>
      </div>
    </div>
  )
}

// Stats Card Component
const StatsCard = ({ 
  title, 
  value, 
  icon: Icon, 
  color = 'blue',
  href 
}: {
  title: string
  value: number | string
  icon: React.ComponentType<{ className?: string }>
  color?: 'blue' | 'green' | 'purple' | 'orange'
  href?: string
}) => {
  const colorClasses = {
    blue: 'bg-green-50 text-green-600 border-green-200',
    green: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200'
  }

  const content = (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value.toLocaleString()}</p>
        </div>
        <div className={`p-3 rounded-lg border ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  )

  return href ? (
    <Link href={href} className="block">
      {content}
    </Link>
  ) : content
}

export default async function ServiceProvidersPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  // Fetch service providers data
  const [serviceProviders, totalServiceProviders, totalJobs] = await Promise.all([
    prisma.serviceProvider.findMany({
      include: {
        _count: {
          select: {
            customers: true,
            jobs: true
          }
        }
      },
      orderBy: { name: 'asc' }
    }),
    prisma.serviceProvider.count(),
    prisma.job.count()
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Service Providers</h2>
              <p className="mt-1 text-sm text-gray-600">
                Manage service provider partnerships and their referred customers.
              </p>
            </div>
            <Link
              href="/service-providers/new"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-150"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Provider
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <StatsCard
            title="Total Providers"
            value={totalServiceProviders}
            icon={BuildingOfficeIcon}
            color="blue"
          />
          <StatsCard
            title="Total Jobs"
            value={totalJobs}
            icon={ChartBarIcon}
            color="purple"
            href="/jobs"
          />
        </div>

        {/* Service Providers Grid */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                All Service Providers ({serviceProviders.length})
              </h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Sort by:</span>
                <select className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500">
                  <option>Name (A-Z)</option>
                  <option>Name (Z-A)</option>
                  <option>Most Customers</option>
                  <option>Most Jobs</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {serviceProviders.length === 0 ? (
              <div className="text-center py-12">
                <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No service providers</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Get started by adding your first service provider.
                </p>
                <Link
                  href="/service-providers/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-150"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Service Provider
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {serviceProviders.map((serviceProvider) => (
                  <ServiceProviderCard 
                    key={serviceProvider.id} 
                    serviceProvider={serviceProvider} 
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}