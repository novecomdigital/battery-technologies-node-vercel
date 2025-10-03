// Global type declarations for the application

declare global {
  interface Window {
    // PWA theme management
    updatePWATheme?: () => void
    
    // Microsoft-specific properties for iOS detection
    MSStream?: unknown
    
    // Mapbox GL JS
    mapboxgl?: {
      Map: new (options: {
        container: HTMLElement
        style: string
        center: [number, number]
        zoom: number
        accessToken: string
      }) => {
        on: (event: string, callback: () => void) => void
        addSource: (id: string, source: { type: string; data: unknown }) => void
        addLayer: (layer: { id: string; type: string; source: string; layout?: Record<string, unknown>; paint?: Record<string, unknown> }) => void
        remove: () => void
        getSource: (id: string) => { type: string; data: unknown } | undefined
        removeLayer: (id: string) => void
        removeSource: (id: string) => void
        fitBounds: (bounds: { extend: (coord: [number, number]) => void }, options: { padding: number }) => void
      }
      Marker: new (options: { color: string }) => {
        setLngLat: (coords: [number, number]) => { addTo: (map: unknown) => void }
      }
      LngLatBounds: new () => {
        extend: (coord: [number, number]) => void
      }
    }
  }

  // Navigator connection types for network detection
  interface Navigator {
    connection?: {
      type?: string
      effectiveType?: string
    }
    mozConnection?: {
      type?: string
      effectiveType?: string
    }
    webkitConnection?: {
      type?: string
      effectiveType?: string
    }
  }
}

export {}
