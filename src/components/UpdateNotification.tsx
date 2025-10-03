'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { updateServiceWorker } from '@/lib/sw-registration'

export default function UpdateNotification() {
  const [isVisible, setIsVisible] = useState(false)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)

  useEffect(() => {
    // Listen for service worker updates
    if (typeof window !== 'undefined') {
      const handleUpdateAvailable = (event: CustomEvent) => {
        console.log('🔔 Update notification received:', event.detail)
        setIsVisible(true)
        setRegistration(event.detail.registration)
      }

      window.addEventListener('sw-update-available', handleUpdateAvailable as EventListener)

      return () => {
        window.removeEventListener('sw-update-available', handleUpdateAvailable as EventListener)
      }
    }
  }, [])

  const handleUpdate = async () => {
    if (registration) {
      await updateServiceWorker(registration)
    }
    setIsVisible(false)
  }

  const handleDismiss = () => {
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full bg-white rounded-lg shadow-lg border border-gray-200 p-4 animate-in slide-in-from-right duration-300">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <ArrowPathIcon className="h-5 w-5 text-green-600" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-gray-900">
            Update Available
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            A new version of the app is ready. Update now to get the latest features and improvements.
          </p>
          <div className="mt-3 flex space-x-2">
            <button
              onClick={handleUpdate}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Update Now
            </button>
            <button
              onClick={handleDismiss}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Later
            </button>
          </div>
        </div>
        <div className="ml-4 flex-shrink-0">
          <button
            onClick={handleDismiss}
            className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <span className="sr-only">Close</span>
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
