'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { isRouteAllowedOffline, shouldBlockNavigation } from '@/lib/offline-navigation-guard'

export default function OfflineNavigationGuard() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Check if we should block navigation
    const checkNavigation = () => {
      if (shouldBlockNavigation(pathname)) {
        console.log('🚫 Blocking navigation to unauthorized route:', pathname)
        
        // Redirect to technician dashboard if available, otherwise show error
        const technicianRoute = '/technician'
        if (isRouteAllowedOffline(technicianRoute)) {
          console.log('🔄 Redirecting to technician dashboard')
          router.replace(technicianRoute)
        } else {
          // Show error page or redirect to a safe route
          console.log('⚠️ No safe route available, staying on current page')
        }
      }
    }

    // Check navigation on route change
    checkNavigation()

    // Listen for popstate events (back/forward navigation)
    const handlePopState = () => {
      setTimeout(checkNavigation, 100) // Small delay to ensure route is updated
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [pathname, router])

  // Intercept programmatic navigation
  useEffect(() => {
    const originalPushState = history.pushState
    const originalReplaceState = history.replaceState

    const interceptNavigation = (targetRoute: string) => {
      if (shouldBlockNavigation(targetRoute)) {
        console.log('🚫 Blocking programmatic navigation to:', targetRoute)
        
        // Find a safe route to redirect to
        const safeRoutes = ['/technician', '/dashboard', '/']
        const safeRoute = safeRoutes.find(route => isRouteAllowedOffline(route))
        
        if (safeRoute) {
          console.log('🔄 Redirecting to safe route:', safeRoute)
          router.replace(safeRoute)
        } else {
          console.log('⚠️ No safe route available')
        }
        
        return false // Block the navigation
      }
      return true // Allow the navigation
    }

    history.pushState = function(...args) {
      const targetRoute = args[2] as string
      if (interceptNavigation(targetRoute)) {
        originalPushState.apply(history, args)
      }
    }

    history.replaceState = function(...args) {
      const targetRoute = args[2] as string
      if (interceptNavigation(targetRoute)) {
        originalReplaceState.apply(history, args)
      }
    }

    return () => {
      history.pushState = originalPushState
      history.replaceState = originalReplaceState
    }
  }, [router])

  return null // This component doesn't render anything
}
