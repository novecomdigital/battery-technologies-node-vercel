'use client'

import { useEffect } from 'react'
import { registerServiceWorker, initializeOfflineStorage, initializeSyncManager, checkForUpdates, debugServiceWorkerStatus, preloadCriticalAssets, forceCacheCriticalAssets } from '@/lib/sw-registration'
import { initializeRoutePreCaching } from '@/lib/offline-navigation'
import { initializeOfflineNavigationGuard } from '@/lib/offline-navigation-guard'

export default function OfflineInitializer() {
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🚀 Initializing offline functionality...')
        
        // Initialize offline functionality
        await registerServiceWorker()
        await initializeOfflineStorage()
        initializeSyncManager()
        
        // Preload and force cache critical assets for offline use
        await preloadCriticalAssets()
        await forceCacheCriticalAssets()
        
        // Debug service worker status
        setTimeout(() => {
          debugServiceWorkerStatus()
        }, 1000)
        
        // Initialize route pre-caching for better offline navigation
        await initializeRoutePreCaching()
        
        // Initialize offline navigation guard
        initializeOfflineNavigationGuard()
        
        // Check for updates after a short delay to ensure SW is registered
        setTimeout(() => {
          checkForUpdates()
        }, 2000)

        // Add a global sync trigger for testing
        if (typeof window !== 'undefined') {
          // Listen for custom sync events
          window.addEventListener('battery-tech-sync', () => {
            console.log('🔄 Custom sync event received in OfflineInitializer')
            if ((window as unknown as { triggerSync?: () => void }).triggerSync) {
              (window as unknown as { triggerSync: () => void }).triggerSync()
            }
          })

          // Trigger initial sync check after everything is initialized
          setTimeout(() => {
            console.log('🔄 Triggering initial sync check...')
            if ((window as unknown as { triggerSync?: () => void }).triggerSync) {
              (window as unknown as { triggerSync: () => void }).triggerSync()
            }
          }, 5000)
        }

        console.log('✅ Offline functionality initialized successfully')
      } catch (error) {
        console.error('❌ Error initializing offline functionality:', error)
      }
    }

    initializeApp()
  }, [])

  return null // This component doesn't render anything
}
