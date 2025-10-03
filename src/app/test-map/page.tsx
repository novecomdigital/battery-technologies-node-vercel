'use client'

import { useState, useCallback } from 'react'
import MapboxMaps from '@/components/MapboxMaps'
import { COMPANY_CONFIG } from '@/lib/company-config'

export default function TestMapPage() {
  const [origin, setOrigin] = useState(COMPANY_CONFIG.fullAddress)
  const [destination, setDestination] = useState('London, UK')
  const [routeInfo, setRouteInfo] = useState<{
    distance: string
    duration: string
  } | null>(null)

  const handleRouteInfo = useCallback((info: { distance: string; duration: string }) => {
    setRouteInfo(info)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Map Routing Test</h1>
        
        {/* Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Origin
              </label>
              <input
                type="text"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter origin address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Destination
              </label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter destination address"
              />
            </div>
          </div>
          
          {routeInfo && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-800">
                <span className="font-medium">Distance: {routeInfo.distance}</span>
                <span className="mx-2">•</span>
                <span>Duration: {routeInfo.duration}</span>
              </div>
            </div>
          )}
        </div>

        {/* Map Container */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="text-lg font-medium text-gray-900">Map View</h2>
            <p className="text-sm text-gray-600 mt-1">
              Testing route from &quot;{origin}&quot; to &quot;{destination}&quot;
            </p>
            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
              <strong>Note:</strong> You need to set up a Mapbox access token. Add <code>NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN</code> to your environment variables.
            </div>
          </div>
          
          <div className="h-96">
            <MapboxMaps
              origin={origin}
              destination={destination}
              className="w-full h-full"
              onRouteInfo={handleRouteInfo}
            />
          </div>
        </div>

        {/* Debug Info */}
        <div className="mt-6 bg-gray-100 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Debug Information</h3>
          <div className="text-xs text-gray-600 space-y-1">
            <div><strong>Origin:</strong> {origin}</div>
            <div><strong>Destination:</strong> {destination}</div>
            <div><strong>Company Config:</strong> {JSON.stringify(COMPANY_CONFIG, null, 2)}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
