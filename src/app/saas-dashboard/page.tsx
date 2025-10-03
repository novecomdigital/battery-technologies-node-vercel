import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default async function SaasDashboardPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Battery Technologies - SaaS Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="text-gray-600 hover:text-gray-900"
              >
                User Dashboard
              </Link>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </nav>
      
      <main className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              SaaS Customer Management
            </h2>
            <p className="text-gray-600">
              Manage your SaaS customers, their customers, locations, jobs, and contacts.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-medium">SC</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        SaaS Customers
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        Loading...
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-medium">C</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        End Customers
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        Loading...
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-medium">J</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Active Jobs
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        Loading...
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-sm font-medium">L</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Locations
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        Loading...
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Management Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* SaaS Customers */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  SaaS Customers
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Manage companies that subscribe to your service
                </p>
                <div className="space-y-3">
                  <Link
                    href="/saas-dashboard/customers"
                    className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-center"
                  >
                    View All SaaS Customers
                  </Link>
                  <Link
                    href="/saas-dashboard/customers/new"
                    className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-2 px-4 rounded-lg transition-colors text-center"
                  >
                    Add New SaaS Customer
                  </Link>
                </div>
              </div>
            </div>

            {/* Jobs Management */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Jobs Management
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Track and manage all jobs across all customers
                </p>
                <div className="space-y-3">
                  <Link
                    href="/saas-dashboard/jobs"
                    className="block w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-center"
                  >
                    View All Jobs
                  </Link>
                  <Link
                    href="/saas-dashboard/jobs/new"
                    className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-2 px-4 rounded-lg transition-colors text-center"
                  >
                    Create New Job
                  </Link>
                </div>
              </div>
            </div>

            {/* Analytics */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Analytics & Reports
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  View insights and generate reports
                </p>
                <div className="space-y-3">
                  <Link
                    href="/saas-dashboard/analytics"
                    className="block w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-center"
                  >
                    View Analytics
                  </Link>
                  <Link
                    href="/saas-dashboard/reports"
                    className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-2 px-4 rounded-lg transition-colors text-center"
                  >
                    Generate Reports
                  </Link>
                </div>
              </div>
            </div>

            {/* System Settings */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  System Settings
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Configure system settings and user management
                </p>
                <div className="space-y-3">
                  <Link
                    href="/saas-dashboard/settings"
                    className="block w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-center"
                  >
                    System Settings
                  </Link>
                  <Link
                    href="/saas-dashboard/users"
                    className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-2 px-4 rounded-lg transition-colors text-center"
                  >
                    User Management
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

