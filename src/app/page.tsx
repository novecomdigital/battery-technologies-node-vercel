import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BoltIcon } from '@heroicons/react/24/outline'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const { userId } = await auth()

  if (userId) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-100 flex flex-col">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <div className="flex items-center">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-green-600 rounded-lg">
                  <BoltIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Battery Technologies</h1>
                  <p className="text-sm text-gray-600">Service Management</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/sign-in"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-150"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-md mx-auto">
          {/* Welcome Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-green-100 text-green-800 text-sm font-medium mb-6">
              <BoltIcon className="h-4 w-4 mr-2" />
              Internal Administration Portal
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Battery Technologies
              <span className="text-green-600"> Admin</span>
            </h1>
            
            <p className="text-gray-600 mb-8">
              Sign in to access your service management dashboard
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <BoltIcon className="h-6 w-6 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Welcome Back</h2>
              <p className="text-sm text-gray-600">Access your dashboard</p>
            </div>

            <div className="space-y-4">
              <Link
                href="/sign-in"
                className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
              >
                <BoltIcon className="h-5 w-5 mr-2" />
                Sign In to Dashboard
              </Link>
              
              <div className="text-center">
                <span className="text-sm text-gray-500">Don&apos;t have an account?</span>
                <Link
                  href="/sign-up"
                  className="ml-1 text-sm font-medium text-green-600 hover:text-green-700 transition-colors duration-150"
                >
                  Contact Administrator
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full px-4 sm:px-6 lg:px-8 py-4 bg-white border-t border-gray-200">
        <div className="max-w-md mx-auto">
          <div className="text-center">
            <div className="text-sm text-gray-500">
              © {new Date().getFullYear()} Battery Technologies. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}