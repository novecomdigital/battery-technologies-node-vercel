import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default async function SaasCustomersPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/saas-dashboard"
                className="text-gray-600 hover:text-gray-900"
              >
                ← Back to Dashboard
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">
                SaaS Customers
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
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  SaaS Customers
                </h2>
                <p className="text-gray-600">
                  Manage companies that subscribe to your service
                </p>
              </div>
              <Link
                href="/saas-dashboard/customers/new"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Add New Customer
              </Link>
            </div>
          </div>

          {/* Customer List */}
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Customer List
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                All SaaS customers and their subscription details
              </p>
            </div>
            <ul className="divide-y divide-gray-200">
              {/* Placeholder for customer data */}
              <li className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                        <span className="text-white text-sm font-medium">AC</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        Acme Corporation
                      </div>
                      <div className="text-sm text-gray-500">
                        acme@example.com • Professional Plan
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                    <Link
                      href="/saas-dashboard/customers/acme-corp"
                      className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </li>

              <li className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center">
                        <span className="text-white text-sm font-medium">TC</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        TechCorp Solutions
                      </div>
                      <div className="text-sm text-gray-500">
                        tech@example.com • Enterprise Plan
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                    <Link
                      href="/saas-dashboard/customers/techcorp"
                      className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </li>

              <li className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-yellow-500 flex items-center justify-center">
                        <span className="text-white text-sm font-medium">SC</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        StartupCo
                      </div>
                      <div className="text-sm text-gray-500">
                        startup@example.com • Basic Plan
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Trial
                    </span>
                    <Link
                      href="/saas-dashboard/customers/startupco"
                      className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </li>
            </ul>
          </div>

          {/* Customer Hierarchy Visualization */}
          <div className="mt-8 bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Customer Hierarchy Overview
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Acme Corporation</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>• 5 End Customers</div>
                    <div>• 12 Locations</div>
                    <div>• 23 Active Jobs</div>
                    <div>• 8 Contacts</div>
                  </div>
                </div>
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">TechCorp Solutions</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>• 8 End Customers</div>
                    <div>• 18 Locations</div>
                    <div>• 45 Active Jobs</div>
                    <div>• 15 Contacts</div>
                  </div>
                </div>
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">StartupCo</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>• 2 End Customers</div>
                    <div>• 3 Locations</div>
                    <div>• 5 Active Jobs</div>
                    <div>• 3 Contacts</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

