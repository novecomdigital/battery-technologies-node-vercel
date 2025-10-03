'use client'

import { useEffect } from 'react'

export default function ZoomPrevention() {
  useEffect(() => {
    // Prevent zoom on double tap
    let lastTouchEnd = 0
    const preventZoom = (e: TouchEvent) => {
      const now = Date.now()
      if (now - lastTouchEnd <= 300) {
        e.preventDefault()
      }
      lastTouchEnd = now
    }

    // Prevent zoom on pinch
    const preventPinchZoom = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault()
      }
    }

    // Prevent zoom on wheel with Ctrl/Cmd key
    const preventWheelZoom = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
      }
    }

    // Prevent zoom on keyboard shortcuts
    const preventKeyboardZoom = (e: KeyboardEvent) => {
      // Prevent Ctrl/Cmd + Plus/Minus/0
      if ((e.ctrlKey || e.metaKey) && 
          (e.key === '+' || e.key === '-' || e.key === '=' || e.key === '0')) {
        e.preventDefault()
      }
    }

    // Add event listeners
    document.addEventListener('touchend', preventZoom, { passive: false })
    document.addEventListener('touchstart', preventPinchZoom, { passive: false })
    document.addEventListener('touchmove', preventPinchZoom, { passive: false })
    document.addEventListener('wheel', preventWheelZoom, { passive: false })
    document.addEventListener('keydown', preventKeyboardZoom, { passive: false })

    // Set viewport meta tag dynamically
    const setViewport = () => {
      const viewport = document.querySelector('meta[name="viewport"]')
      if (viewport) {
        viewport.setAttribute('content', 
          'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
        )
      }
    }

    // Set viewport immediately and on resize
    setViewport()
    window.addEventListener('resize', setViewport)

    // Cleanup
    return () => {
      document.removeEventListener('touchend', preventZoom)
      document.removeEventListener('touchstart', preventPinchZoom)
      document.removeEventListener('touchmove', preventPinchZoom)
      document.removeEventListener('wheel', preventWheelZoom)
      document.removeEventListener('keydown', preventKeyboardZoom)
      window.removeEventListener('resize', setViewport)
    }
  }, [])

  return null
}
