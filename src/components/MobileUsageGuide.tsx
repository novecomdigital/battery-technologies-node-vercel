'use client'

import { useState, useEffect } from 'react'
import { 
  DevicePhoneMobileIcon, 
  CameraIcon, 
  WifiIcon, 
  CloudArrowUpIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  BugAntIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline'

export default function MobileUsageGuide() {
  const [isOpen, setIsOpen] = useState(false)
  const [cacheVersion, setCacheVersion] = useState<string>('loading...')
  const [debugEnabled, setDebugEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('debugEnabled') === 'true'
    }
    return false
  })

  // Get cache version from service worker
  useEffect(() => {
    const getCacheVersion = async () => {
      try {
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.getRegistration()
          if (registration?.active) {
            // Send message to service worker to get cache version
            const channel = new MessageChannel()
            channel.port1.onmessage = (event) => {
              if (event.data.type === 'CACHE_VERSION') {
                setCacheVersion(event.data.version || 'unknown')
              }
            }
            registration.active.postMessage({ type: 'GET_CACHE_VERSION' }, [channel.port2])
            
            // Set timeout to show fallback if no response
            setTimeout(() => {
              if (cacheVersion === 'loading...') {
                setCacheVersion('no response')
              }
            }, 3000)
          } else {
            setCacheVersion('no sw')
          }
        } else {
          setCacheVersion('not supported')
        }
      } catch (error) {
        console.error('Failed to get cache version:', error)
        setCacheVersion('error')
      }
    }
    
    getCacheVersion()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Freeze background scroll when modal is open and retry getting cache version
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      
      // Retry getting cache version when modal opens
      const getCacheVersion = async () => {
        try {
          console.log('🔍 Getting cache version for mobile usage guide...')
          
          // Try to get cache version from service worker file directly
          try {
            const response = await fetch('/sw.js')
            const swText = await response.text()
            const cacheMatch = swText.match(/const CACHE_NAME = 'battery-tech-(v\d+)'/)
            if (cacheMatch) {
              console.log('🎯 Found cache version in service worker file:', cacheMatch[1])
              setCacheVersion(cacheMatch[1])
              return
            }
          } catch (error) {
            console.log('⚠️ Could not read service worker file:', error)
          }
          
          // Fallback to service worker message
          if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.getRegistration()
            console.log('📱 Service worker registration:', registration)
            if (registration?.active) {
              console.log('✅ Active service worker found, requesting cache version...')
              const channel = new MessageChannel()
              channel.port1.onmessage = (event) => {
                console.log('📨 Received message from service worker:', event.data)
                if (event.data.type === 'CACHE_VERSION') {
                  console.log('🎯 Cache version received:', event.data.version)
                  setCacheVersion(event.data.version || 'unknown')
                }
              }
              registration.active.postMessage({ type: 'GET_CACHE_VERSION' }, [channel.port2])
              console.log('📤 Sent GET_CACHE_VERSION message to service worker')
              
              // Set timeout to show fallback if no response
              setTimeout(() => {
                if (cacheVersion === 'loading...') {
                  console.log('⏰ Timeout waiting for cache version response')
                  setCacheVersion('timeout')
                }
              }, 2000)
            } else if (registration?.waiting) {
              console.log('⏳ Service worker is waiting, forcing activation...')
              registration.waiting.postMessage({ type: 'SKIP_WAITING' })
              setCacheVersion('waiting...')
            } else if (registration?.installing) {
              console.log('🔄 Service worker is installing...')
              setCacheVersion('installing...')
            } else {
              console.log('❌ No active service worker found')
              console.log('📊 Service worker states:', {
                active: registration?.active?.state,
                waiting: registration?.waiting?.state,
                installing: registration?.installing?.state
              })
              setCacheVersion('no active sw')
            }
          } else {
            console.log('❌ Service worker not supported')
            setCacheVersion('not supported')
          }
        } catch (error) {
          console.error('❌ Failed to get cache version:', error)
          setCacheVersion('error')
        }
      }
      
      getCacheVersion()
    } else {
      document.body.style.overflow = 'unset'
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-40 bg-green-600 text-white p-3 rounded-full shadow-lg hover:bg-green-700 transition-colors md:hidden"
        title="Mobile Usage Guide"
      >
        <DevicePhoneMobileIcon className="w-6 h-6" />
      </button>
    )
  }

  return (
    <div 
      className="fixed inset-0 z-50 bg-white md:hidden"
      onClick={() => setIsOpen(false)}
    >
      <div 
        className="h-full w-full overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Mobile Usage Guide</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            {/* Install App */}
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-semibold text-sm">1</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Install the App</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Tap &quot;Install&quot; when prompted to add the app to your home screen for easy access.
                </p>
              </div>
            </div>

            {/* Camera Access */}
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <CameraIcon className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Camera Access</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Allow camera access when prompted to take photos of job sites.
                </p>
              </div>
            </div>

            {/* Offline Mode */}
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <WifiIcon className="w-4 h-4 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Offline Mode</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Take photos and update jobs even without internet. Data syncs automatically when back online.
                </p>
              </div>
            </div>

            {/* Photo Upload */}
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <CloudArrowUpIcon className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Photo Upload</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Photos are stored locally and upload automatically when you have internet connection.
                </p>
              </div>
            </div>

            {/* Status Indicators */}
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <CheckCircleIcon className="w-4 h-4 text-gray-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Status Indicators</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Yellow dot = Pending upload, Blue dot = Uploading, Green check = Uploaded
                </p>
              </div>
            </div>

            {/* Debug Section */}
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <BugAntIcon className="w-4 h-4 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">Debug</h3>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-sm text-gray-600">
                    Enable debug mode to see detailed logs and troubleshooting information.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      const newDebugEnabled = !debugEnabled
                      setDebugEnabled(newDebugEnabled)
                      localStorage.setItem('debugEnabled', newDebugEnabled.toString())
                      // Dispatch custom event for other components to listen
                      window.dispatchEvent(new CustomEvent('debugToggle', { detail: { enabled: newDebugEnabled } }))
                    }}
                    className={`relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                      debugEnabled ? 'bg-green-600' : 'bg-gray-200'
                    }`}
                    role="switch"
                    aria-checked={debugEnabled}
                  >
                    <span
                      className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        debugEnabled ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Reset Install Prompt Section */}
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <DevicePhoneMobileIcon className="w-4 h-4 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">Reset Install Prompt</h3>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-sm text-gray-600">
                    Clear the dismissed install prompt to show it again on iOS devices.
                  </p>
                  <button
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        sessionStorage.removeItem('installPromptDismissed')
                        alert('Install prompt reset! Refresh the page to see it again.')
                      }
                    }}
                    className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200 transition-colors text-sm whitespace-nowrap"
                  >
                    Reset Prompt
                  </button>
                </div>
              </div>
            </div>

            {/* Support Logs Section */}
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <EnvelopeIcon className="w-4 h-4 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">Support Logs</h3>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-sm text-gray-600">
                    Send diagnostic logs to support team for troubleshooting issues.
                  </p>
                  <button
                    onClick={() => {
                      // Placeholder for future email functionality
                      alert('Send log functionality will be implemented in a future update.')
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm whitespace-nowrap"
                  >
                    Send Logs
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-start space-x-2">
              <InformationCircleIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-900">Pro Tip</h4>
                <p className="text-sm text-blue-700 mt-1">
                  The app works best when installed on your home screen. This gives you full offline functionality and better performance.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsOpen(false)}
            className="w-full mt-6 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-base font-medium"
          >
            Got it!
          </button>
          
          {/* App Version */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-center text-sm text-gray-500">
              Battery Technologies v0.1.0
            </p>
            <p className="text-center text-xs text-gray-400 mt-1">
              Cache: {cacheVersion}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
