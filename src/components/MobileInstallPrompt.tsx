'use client'

import { useState, useEffect } from 'react'
import { DevicePhoneMobileIcon, ArrowDownTrayIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function MobileInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    setIsClient(true)
    
    // Detect iOS
    const userAgent = navigator.userAgent
    const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream
    setIsIOS(isIOSDevice)
    console.log('📱 iOS detected:', isIOSDevice)
    
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log('📱 App is already installed (standalone mode)')
      setIsInstalled(true)
      return
    }

    console.log('📱 App not installed, waiting for beforeinstallprompt event...')
    console.log('📱 User Agent:', navigator.userAgent)
    console.log('📱 Service Worker support:', 'serviceWorker' in navigator)
    console.log('📱 HTTPS:', location.protocol === 'https:')
    
    // Check service worker registration
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(reg => {
        console.log('📱 Service Worker registration:', reg ? 'Found' : 'Not found')
        if (reg) {
          console.log('📱 SW state:', reg.active?.state)
        }
      })
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('📱 beforeinstallprompt event received!')
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowInstallPrompt(true)
    }

    // For iOS, show install prompt after a delay (since beforeinstallprompt won't fire)
    if (isIOSDevice) {
      console.log('📱 iOS detected - will show install instructions')
      setTimeout(() => {
        setShowInstallPrompt(true)
      }, 3000) // Show after 3 seconds
    }

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('📱 App installed event received!')
      setIsInstalled(true)
      setShowInstallPrompt(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt')
    } else {
      console.log('User dismissed the install prompt')
    }
    
    setDeferredPrompt(null)
    setShowInstallPrompt(false)
  }

  const dismissPrompt = () => {
    setShowInstallPrompt(false)
    // Don't show again for this session
    sessionStorage.setItem('installPromptDismissed', 'true')
  }

  // Don't render anything until client-side hydration is complete
  if (!isClient) {
    return null
  }

  // Don't show if already installed or dismissed
  if (isInstalled || !showInstallPrompt || (typeof window !== 'undefined' && sessionStorage.getItem('installPromptDismissed'))) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:hidden">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <DevicePhoneMobileIcon className="w-6 h-6 text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900">
              Install Battery Technologies
            </h3>
                   {isIOS ? (
                     <div className="text-xs text-gray-500 mt-1">
                       <p className="mb-2">To install this app on your iPhone/iPad:</p>
                       <ol className="list-decimal list-inside space-y-1 text-xs">
                         <li className="flex items-center">
                           Tap the <strong>&nbsp;Share&nbsp;</strong> button 
                           <svg className="w-6 h-6 text-gray-800" fill="currentColor" viewBox="0 0 18 27">
                             <path d="M6.055,9.355L4.082,9.355C2.48,9.355 1.572,10.254 1.572,11.865L1.572,19.385C1.572,20.996 2.48,21.895 4.082,21.895L13.242,21.895C14.854,21.895 15.762,20.996 15.762,19.385L15.762,11.865C15.762,10.254 14.854,9.355 13.242,9.355L11.27,9.355L11.27,7.783L13.242,7.783C15.869,7.783 17.334,9.238 17.334,11.865L17.334,19.385C17.334,22.002 15.869,23.467 13.242,23.467L4.082,23.467C1.455,23.467 0,22.002 0,19.385L0,11.865C0,9.238 1.455,7.783 4.082,7.783L6.055,7.783L6.055,9.355Z"/>
                             <path d="M9.378,3.66L9.443,5.127L9.443,15.068C9.443,15.479 9.082,15.82 8.662,15.82C8.242,15.82 7.891,15.479 7.891,15.068L7.891,5.127L7.956,3.655L8.662,2.9L9.378,3.66Z"/>
                             <path d="M5.352,6.094C5.537,6.094 5.752,6.016 5.889,5.859L7.402,4.248L8.662,2.9L9.932,4.248L11.436,5.859C11.572,6.016 11.777,6.094 11.963,6.094C12.373,6.094 12.676,5.801 12.676,5.41C12.676,5.195 12.598,5.039 12.451,4.893L9.229,1.787C9.033,1.592 8.867,1.533 8.662,1.533C8.467,1.533 8.301,1.592 8.096,1.787L4.883,4.893C4.736,5.039 4.648,5.195 4.648,5.41C4.648,5.801 4.941,6.094 5.352,6.094Z"/>
                           </svg>
                           at the bottom
                         </li>
                         <li>Scroll down and tap <strong>&quot;Add to Home Screen&quot;</strong></li>
                         <li>Tap <strong>&quot;Add&quot;</strong> to confirm</li>
                       </ol>
                       <p className="mt-2 text-green-600 font-medium">This will give you offline access and better performance!</p>
                       <p className="mt-1 text-gray-400 text-xs">You can continue using the web version if you prefer.</p>
                     </div>
                   ) : (
              <p className="text-xs text-gray-500 mt-1">
                Install this app on your device for offline access and better performance.
              </p>
            )}
            <div className="flex space-x-2 mt-3">
              {!isIOS && (
                <button
                  onClick={handleInstallClick}
                  className="flex items-center px-3 py-1.5 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 transition-colors"
                >
                  <ArrowDownTrayIcon className="w-3 h-3 mr-1" />
                  Install
                </button>
              )}
              <button
                onClick={dismissPrompt}
                className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                  isIOS 
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {isIOS ? 'Got it' : 'Not now'}
              </button>
            </div>
          </div>
          {!isIOS && (
            <button
              onClick={dismissPrompt}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
