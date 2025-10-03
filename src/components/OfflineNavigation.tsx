'use client'

import { useState, useEffect } from 'react'
import { getOfflineNavigationSuggestions, isRouteLikelyCached } from '@/lib/offline-navigation'
import { useOfflineDetection, OfflineStatus } from '@/lib/offline-detection'

interface OfflineNavigationProps {
  currentRoute: string
  className?: string
}

export default function OfflineNavigation({ currentRoute, className = '' }: OfflineNavigationProps) {
  const [isOffline, setIsOffline] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const offlineDetection = useOfflineDetection()

  useEffect(() => {
    const handleStatusChange = (status: OfflineStatus) => {
      setIsOffline(status.isOffline)
    }

    offlineDetection.addListener(handleStatusChange)

    return () => {
      offlineDetection.removeListener(handleStatusChange)
    }
  }, [offlineDetection])

  useEffect(() => {
    if (isOffline) {
      const offlineSuggestions = getOfflineNavigationSuggestions(currentRoute)
      setSuggestions(offlineSuggestions)
    }
  }, [isOffline, currentRoute])

  if (!isOffline || suggestions.length === 0) {
    return null
  }

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center mb-3">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-blue-800">
            You&apos;re offline - Available pages:
          </h3>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {suggestions.map((route) => {
          const routeName = route === '/' ? 'Home' : route.split('/').pop()?.replace('-', ' ') || route
          const isCached = isRouteLikelyCached(route)
          
          return (
            <a
              key={route}
              href={route}
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                isCached
                  ? 'bg-green-100 text-green-800 hover:bg-green-200'
                  : 'bg-gray-100 text-gray-600 cursor-not-allowed'
              }`}
              onClick={(e) => {
                if (!isCached) {
                  e.preventDefault()
                  alert('This page is not available offline. Please check your connection and try again.')
                }
              }}
            >
              {isCached ? (
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              )}
              {routeName.charAt(0).toUpperCase() + routeName.slice(1)}
            </a>
          )
        })}
      </div>
      
      <div className="mt-3 text-xs text-blue-600">
        <p>Pages with checkmarks are available offline. Changes will sync when you&apos;re back online.</p>
      </div>
    </div>
  )
}
