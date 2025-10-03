'use client'

import { SignIn } from '@clerk/nextjs'
import { useSearchParams } from 'next/navigation'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

export default function Page() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        {error === 'user_not_found' && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
              <div>
                <h3 className="text-sm font-medium text-red-800">
                  Access Denied
                </h3>
                <p className="text-sm text-red-700 mt-1">
                  Your account is not authorized to access this system. Please contact your administrator.
                </p>
              </div>
            </div>
          </div>
        )}
        <SignIn fallbackRedirectUrl="/dashboard" />
      </div>
    </div>
  )
}

