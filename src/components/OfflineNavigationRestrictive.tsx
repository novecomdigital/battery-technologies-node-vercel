'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  getOfflineNavigationSuggestions, 
  getTechnicianCachedPages,
  getJobDetailPages,
  isRouteAllowedOffline,
  CachedPage
} from '@/lib/offline-navigation-guard'
import { useOfflineDetection, OfflineStatus } from '@/lib/offline-detection'

interface OfflineNavigationRestrictiveProps {
  currentRoute: string
  className?: string
}

export default function OfflineNavigationRestrictive({ 
  currentRoute, 
  className = '' 
}: OfflineNavigationRestrictiveProps) {
  const router = useRouter()
  const [isOffline, setIsOffline] = useState(false)
  const [suggestions, setSuggestions] = useState<CachedPage[]>([])
  const [showAllPages, setShowAllPages] = useState(false)
  const [debugEnabled, setDebugEnabled] = useState(false)
  const offlineDetection = useOfflineDetection()

  useEffect(() => {
    // Initialize debug mode state
    const initDebugMode = () => {
      if (typeof window !== 'undefined') {
        const debugMode = localStorage.getItem('debugEnabled') === 'true'
        setDebugEnabled(debugMode)
      }
    }

    initDebugMode()

    const handleStatusChange = (status: OfflineStatus) => {
      setIsOffline(status.isOffline)
    }

    // Listen for debug mode changes
    const handleDebugToggle = (event: CustomEvent) => {
      setDebugEnabled(event.detail.enabled)
    }

    offlineDetection.addListener(handleStatusChange)
    window.addEventListener('debugToggle', handleDebugToggle as EventListener)

    return () => {
      offlineDetection.removeListener(handleStatusChange)
      window.removeEventListener('debugToggle', handleDebugToggle as EventListener)
    }
  }, [offlineDetection])

  useEffect(() => {
    if (isOffline) {
      const offlineSuggestions = getOfflineNavigationSuggestions(currentRoute)
      setSuggestions(offlineSuggestions)
    }
  }, [isOffline, currentRoute])

  const handleNavigation = (route: string) => {
    if (isRouteAllowedOffline(route)) {
      router.push(route)
    } else {
      alert('This page is not available offline. Please go online to access this page.')
    }
  }

  const getTechnicianPages = () => {
    return getTechnicianCachedPages()
  }

  const getJobPages = () => {
    return getJobDetailPages()
  }

  // Don't show anything if debug mode is disabled
  if (!debugEnabled) {
    return null
  }

  if (!isOffline || suggestions.length === 0) {
    return null
  }

  const technicianPages = getTechnicianPages()
  const jobPages = getJobPages()

  return (
    <div className={`bg-amber-50 border border-amber-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center mb-3">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-amber-800">
            Offline Mode - Limited Navigation
          </h3>
          <p className="text-xs text-amber-600 mt-1">
            You can only access pages you&apos;ve previously visited while online.
          </p>
        </div>
      </div>
      
      {/* Technician Dashboard */}
      {technicianPages.length > 0 && (
        <div className="mb-3">
          <h4 className="text-xs font-medium text-amber-700 mb-2">Technician Dashboard</h4>
          <div className="flex flex-wrap gap-2">
            {technicianPages.map((page) => (
              <button
                key={page.route}
                onClick={() => handleNavigation(page.route)}
                className="inline-flex items-center px-3 py-1.5 bg-green-100 text-green-800 hover:bg-green-200 rounded-md text-xs font-medium transition-colors"
              >
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {page.title || 'Technician Dashboard'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Job Detail Pages */}
      {jobPages.length > 0 && (
        <div className="mb-3">
          <h4 className="text-xs font-medium text-amber-700 mb-2">
            Cached Jobs ({jobPages.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {jobPages.slice(0, showAllPages ? jobPages.length : 3).map((page) => {
              const jobId = page.route.split('/').pop()
              return (
                <button
                  key={page.route}
                  onClick={() => handleNavigation(page.route)}
                  className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-800 hover:bg-blue-200 rounded-md text-xs font-medium transition-colors"
                >
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Job #{jobId}
                </button>
              )
            })}
            {jobPages.length > 3 && !showAllPages && (
              <button
                onClick={() => setShowAllPages(true)}
                className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-md text-xs font-medium transition-colors"
              >
                +{jobPages.length - 3} more
              </button>
            )}
          </div>
        </div>
      )}

      {/* Other Cached Pages */}
      {suggestions.length > 0 && (
        <div className="mb-3">
          <h4 className="text-xs font-medium text-amber-700 mb-2">Other Available Pages</h4>
          <div className="flex flex-wrap gap-2">
            {suggestions.slice(0, 3).map((page) => {
              const routeName = page.route === '/' ? 'Home' : page.route.split('/').pop()?.replace('-', ' ') || page.route
              return (
                <button
                  key={page.route}
                  onClick={() => handleNavigation(page.route)}
                  className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-md text-xs font-medium transition-colors"
                >
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {routeName.charAt(0).toUpperCase() + routeName.slice(1)}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="mt-3 text-xs text-amber-600">
        <p>
          <strong>Offline Navigation:</strong> You can only access pages you&apos;ve previously visited while online. 
          To access more pages, go online and visit them first.
        </p>
      </div>
    </div>
  )
}
