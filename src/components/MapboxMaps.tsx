'use client'

import { useEffect, useRef } from 'react'

// Global types are now defined in src/types/global.d.ts

interface MapboxMapsProps {
  origin: string
  destination: string
  className?: string
  onRouteInfo?: (info: { distance: string; duration: string }) => void
}

export default function MapboxMaps({ origin, destination, className = '', onRouteInfo }: MapboxMapsProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapRef2 = useRef<{
    on: (event: string, callback: () => void) => void
    addSource: (id: string, source: { type: string; data: unknown }) => void
    addLayer: (layer: { id: string; type: string; source: string; layout?: Record<string, unknown>; paint?: Record<string, unknown> }) => void
    remove: () => void
    getSource: (id: string) => { type: string; data: unknown } | undefined
    removeLayer: (id: string) => void
    removeSource: (id: string) => void
    fitBounds: (bounds: { extend: (coord: [number, number]) => void }, options: { padding: number }) => void
  } | null>(null)
  const onRouteInfoRef = useRef(onRouteInfo)
  const mapCreatedRef = useRef(false)
  
  // Update the ref when onRouteInfo changes
  useEffect(() => {
    onRouteInfoRef.current = onRouteInfo
  }, [onRouteInfo])

  useEffect(() => {
    console.log('🗺️ MapboxMaps useEffect triggered')
    console.log('🗺️ mapRef.current:', !!mapRef.current)
    console.log('🗺️ window.mapboxgl:', !!window.mapboxgl)
    console.log('🗺️ mapCreatedRef.current:', mapCreatedRef.current)
    console.log('🗺️ mapRef2.current:', !!mapRef2.current)
    
    // Prevent multiple map creations
    if (mapCreatedRef.current || mapRef2.current) {
      console.log('🗺️ Map already created, skipping...')
      return
    }
    
    if (!mapRef.current || !window.mapboxgl) {
      console.warn('Mapbox GL JS not loaded or map container not found')
      return
    }

    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
    console.log('🗺️ Token present:', !!token)
    if (!token) {
      console.warn('Mapbox access token not found. Please set NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN in your environment variables.')
      return
    }

    // Create map
    console.log('🗺️ Creating map...')
    const map = new window.mapboxgl.Map({
      container: mapRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-2.5879, 51.4545], // Bristol
      zoom: 10,
      accessToken: token
    })

    mapRef2.current = map
    mapCreatedRef.current = true
    console.log('🗺️ Map created successfully')

    // Add route when map loads
    map.on('load', async () => {
      console.log('🗺️ Map loaded, starting route calculation...')
      try {
        // Geocode locations - add UK to destination if not already present
        const destinationWithUK = destination.toLowerCase().includes('uk') || destination.toLowerCase().includes('united kingdom') 
          ? destination 
          : `${destination}, UK`
        
        console.log('🗺️ Geocoding origin:', origin)
        console.log('🗺️ Geocoding destination:', destinationWithUK)
        
        const [originRes, destRes] = await Promise.all([
          fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(origin)}.json?access_token=${token}&country=GB&limit=1&types=address,poi`),
          fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(destinationWithUK)}.json?access_token=${token}&country=GB&limit=1&types=address,poi`)
        ])

        console.log('🗺️ Geocoding responses received')
        const [originData, destData] = await Promise.all([originRes.json(), destRes.json()])
        
        console.log('🗺️ Origin data:', originData)
        console.log('🗺️ Destination data:', destData)

        if (!originData.features[0] || !destData.features[0]) {
          console.warn('🗺️ No features found in geocoding results')
          console.warn('🗺️ Origin features:', originData.features?.length || 0)
          console.warn('🗺️ Destination features:', destData.features?.length || 0)
          
          // Try fallback geocoding with just city and state if full address fails
          if (!destData.features[0] && destination.includes(',')) {
            console.log('🗺️ Trying fallback geocoding with simplified address...')
            const simplifiedDest = destination.split(',')[0] + ', UK' // Just use the first part + UK
            const fallbackRes = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(simplifiedDest)}.json?access_token=${token}&country=GB&limit=1&types=address,poi`)
            const fallbackData = await fallbackRes.json()
            
            if (fallbackData.features[0]) {
              console.log('🗺️ Fallback geocoding successful')
              destData.features = fallbackData.features
            } else {
              console.warn('🗺️ Fallback geocoding also failed')
              return
            }
          } else {
            return
          }
        }

        const originCoords = originData.features[0].center
        const destCoords = destData.features[0].center
        console.log('🗺️ Origin coords:', originCoords)
        console.log('🗺️ Destination coords:', destCoords)

        // Get directions with smoother geometry
        console.log('🗺️ Getting directions...')
        const dirRes = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/driving/${originCoords[0]},${originCoords[1]};${destCoords[0]},${destCoords[1]}?geometries=geojson&overview=full&access_token=${token}`
        )
        console.log('🗺️ Directions response status:', dirRes.status)
        const dirData = await dirRes.json()
        console.log('🗺️ Directions data:', dirData)

        if (!dirData.routes[0]) {
          console.warn('🗺️ No routes found in directions response:', dirData)
          
          // Check if this is an international route
          const isInternational = Math.abs(originCoords[0] - destCoords[0]) > 10 || 
                                 Math.abs(originCoords[1] - destCoords[1]) > 10
          
          if (isInternational) {
            console.warn('🗺️ International route detected - driving directions not available')
          }
          
          // Add markers even without route
          console.log('🗺️ Adding markers without route...')
          new window.mapboxgl.Marker({ color: '#5DA148' })
            .setLngLat(originCoords)
            .addTo(map)

          new window.mapboxgl.Marker({ color: '#DC2626' })
            .setLngLat(destCoords)
            .addTo(map)
          
          // Fit to show both markers
          const bounds = new window.mapboxgl.LngLatBounds()
          bounds.extend(originCoords)
          bounds.extend(destCoords)
          map.fitBounds(bounds, { padding: 50 })
          
          // Show a message about the route issue
          const routeInfo = {
            distance: isInternational ? 'International route' : 'No route found',
            duration: 'Driving directions not available'
          }
          onRouteInfoRef.current?.(routeInfo)
          
          return
        }

        const route = dirData.routes[0]
        console.log('🗺️ Route found:', route)

        // Calculate distance and duration
        const distanceKm = route.distance / 1000 // Convert to km
        const distanceMiles = (distanceKm * 0.621371).toFixed(1) // Convert to miles
        const totalMinutes = Math.round(route.duration / 60) // Convert to minutes
        const hours = Math.floor(totalMinutes / 60)
        const minutes = totalMinutes % 60
        
        let durationText
        if (hours > 0) {
          durationText = minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
        } else {
          durationText = `${minutes}m`
        }
        
        const info = {
          distance: `${distanceMiles} miles`,
          duration: durationText
        }
        
        onRouteInfoRef.current?.(info)
        console.log('🗺️ Route info sent to parent:', info)

        // Remove existing route if it exists
        if ((map as unknown as { getLayer: (id: string) => boolean }).getLayer('route')) {
          console.log('🗺️ Removing existing route layer')
          map.removeLayer('route')
        }
        if (map.getSource('route')) {
          console.log('🗺️ Removing existing route source')
          map.removeSource('route')
        }

        // Add route line
        console.log('🗺️ Adding route source and layer...')
        map.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: route.geometry
          }
        })

        map.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#5DA148',
            'line-width': 6,
            'line-opacity': 0.8,
            'line-blur': 1
          }
        })
        console.log('🗺️ Route layer added')

        // Add markers
        console.log('🗺️ Adding markers...')
        new window.mapboxgl.Marker({ color: '#5DA148' })
          .setLngLat(originCoords)
          .addTo(map)

        new window.mapboxgl.Marker({ color: '#DC2626' })
          .setLngLat(destCoords)
          .addTo(map)
        console.log('🗺️ Markers added')

        // Fit to route
        const bounds = new window.mapboxgl.LngLatBounds()
        route.geometry.coordinates.forEach((coord: [number, number]) => bounds.extend(coord))
        map.fitBounds(bounds, { padding: 50 })

      } catch (error) {
        console.error('Route error:', error)
      }
    })

    // Cleanup
    return () => {
      if (mapRef2.current) {
        mapRef2.current.remove()
        mapRef2.current = null
        mapCreatedRef.current = false
      }
    }
  }, [origin, destination]) // Remove onRouteInfo from dependencies to prevent infinite re-renders

  const hasToken = !!process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN

  return (
    <div className={className}>
      {!hasToken ? (
        <div className="w-full h-full rounded-lg bg-gray-100 flex items-center justify-center">
          <div className="text-center p-4">
            <div className="text-gray-500 mb-2">🗺️</div>
            <p className="text-sm text-gray-600 mb-2">Mapbox access token required</p>
            <p className="text-xs text-gray-500">
              Set NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN in your environment variables
            </p>
          </div>
        </div>
      ) : (
        <div ref={mapRef} className="w-full h-full rounded-lg bg-blue-200 border-2 border-blue-400" style={{ minHeight: '200px' }}>
          <div className="absolute top-2 left-2 bg-white px-2 py-1 rounded text-xs text-gray-600">
            Map Container (Debug)
          </div>
        </div>
      )}
    </div>
  )
}
