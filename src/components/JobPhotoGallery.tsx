'use client'

import { useState } from 'react'
import Image from 'next/image'
import { PhotoIcon, XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

// Global types are now defined in src/types/global.d.ts

interface JobPhoto {
  id: string
  url: string
  filename: string
  uploadedAt: string
  isPrimary?: boolean
}

interface JobPhotoGalleryProps {
  photos: JobPhoto[]
  jobId: string
  onPhotoUpload?: (file: File) => void
  onPhotoDelete?: (photoId: string) => void
  onSetPrimary?: (photoId: string) => void
  canEdit?: boolean
}

export default function JobPhotoGallery({
  photos,
  // jobId,
  onPhotoUpload,
  onPhotoDelete,
  onSetPrimary,
  canEdit = false
}: JobPhotoGalleryProps) {
  // Clean URL to remove extra % characters and fix common issues
  const cleanPhotoUrl = (url: string): string => {
    if (!url) return url
    
    try {
      // Remove extra % characters that might be in the URL
      let cleanedUrl = url.replace(/%+/g, '')
      
      // Ensure proper URL format
      if (cleanedUrl.includes('.r2.dev') && !cleanedUrl.includes('://')) {
        cleanedUrl = 'https://' + cleanedUrl
      }
      
      // Remove any double slashes except after protocol
      cleanedUrl = cleanedUrl.replace(/([^:]\/)\/+/g, '$1')
      
      // Validate URL
      new URL(cleanedUrl)
      
      console.log('🔧 URL cleaned in JobPhotoGallery:', { original: url, cleaned: cleanedUrl })
      return cleanedUrl
    } catch (error) {
      console.error('❌ Invalid URL in JobPhotoGallery:', url, error)
      return url // Return original if cleaning fails
    }
  }
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handlePhotoClick = (index: number) => {
    setSelectedPhotoIndex(index)
    // Trigger PWA theme update
    setTimeout(() => {
      if (typeof window !== 'undefined' && window.updatePWATheme) {
        window.updatePWATheme()
      }
    }, 100)
  }

  const closeModal = () => {
    setSelectedPhotoIndex(null)
    // Trigger PWA theme update
    setTimeout(() => {
      if (typeof window !== 'undefined' && window.updatePWATheme) {
        window.updatePWATheme()
      }
    }, 100)
  }

  const navigatePhoto = (direction: 'prev' | 'next') => {
    if (selectedPhotoIndex === null) return
    
    if (direction === 'prev') {
      setSelectedPhotoIndex(selectedPhotoIndex > 0 ? selectedPhotoIndex - 1 : photos.length - 1)
    } else {
      setSelectedPhotoIndex(selectedPhotoIndex < photos.length - 1 ? selectedPhotoIndex + 1 : 0)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !onPhotoUpload) return

    setIsUploading(true)
    try {
      await onPhotoUpload(file)
    } catch (error) {
      console.error('Error uploading photo:', error)
    } finally {
      setIsUploading(false)
      // Reset the input
      event.target.value = ''
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (selectedPhotoIndex === null) return

    switch (event.key) {
      case 'Escape':
        closeModal()
        break
      case 'ArrowLeft':
        navigatePhoto('prev')
        break
      case 'ArrowRight':
        navigatePhoto('next')
        break
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (photos.length === 0 && !canEdit) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Job Photos</h3>
        <div className="text-center py-8">
          <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No photos</h3>
          <p className="mt-1 text-sm text-gray-500">No photos have been uploaded for this job yet.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          Job Photos ({photos.length})
        </h3>
        {canEdit && (
          <div className="flex items-center space-x-2">
            <label className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 cursor-pointer">
              <PhotoIcon className="h-4 w-4 mr-2" />
              {isUploading ? 'Uploading...' : 'Add Photo'}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="hidden"
              />
            </label>
          </div>
        )}
      </div>

      {photos.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {photos.map((photo, index) => (
            <div key={photo.id} className="relative group">
              <div
                className="aspect-square bg-gray-200 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-green-500 hover:ring-offset-2 transition-all duration-200"
                onClick={() => handlePhotoClick(index)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cleanPhotoUrl(photo.url)}
                  alt={photo.filename}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error('❌ Failed to load photo in gallery:', photo.url)
                    console.error('❌ Cleaned URL:', cleanPhotoUrl(photo.url))
                    console.error('❌ Error details:', e)
                    // Show error placeholder instead of hiding
                    const img = e.currentTarget
                    const parent = img.parentElement
                    if (parent) {
                      parent.innerHTML = `
                        <div class="w-full h-full flex flex-col items-center justify-center bg-gray-100 text-gray-600">
                          <svg class="w-8 h-8 mb-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"></path>
                          </svg>
                          <div class="text-xs text-center px-2">
                            <div>Failed to load</div>
                            <div class="text-red-500">Image error</div>
                          </div>
                        </div>
                      `
                    }
                  }}
                />
                {photo.isPrimary && (
                  <div className="absolute top-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded">
                    Primary
                  </div>
                )}
              </div>
              
              {/* Photo info overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-end">
                <div className="w-full p-2 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <p className="text-xs truncate">{photo.filename}</p>
                  <p className="text-xs text-gray-300">{formatDate(photo.uploadedAt)}</p>
                </div>
              </div>

              {/* Action buttons */}
              {canEdit && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="flex space-x-1">
                    {!photo.isPrimary && onSetPrimary && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onSetPrimary(photo.id)
                        }}
                        className="p-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                        title="Set as primary"
                      >
                        <PhotoIcon className="h-3 w-3" />
                      </button>
                    )}
                    {onPhotoDelete && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onPhotoDelete(photo.id)
                        }}
                        className="p-1 bg-red-600 text-white rounded hover:bg-red-700"
                        title="Delete photo"
                      >
                        <XMarkIcon className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : canEdit ? (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No photos yet</h3>
          <p className="mt-1 text-sm text-gray-500">Upload photos to document this job.</p>
        </div>
      ) : null}

      {/* Photo Modal */}
      {selectedPhotoIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
          onKeyDown={handleKeyDown}
          tabIndex={-1}
        >
          <div className="relative w-full h-full p-4 sm:p-6 md:p-8 flex flex-col">
            {/* Close button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 z-10 p-2 sm:p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75"
            >
              <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>

            {/* Navigation buttons */}
            {photos.length > 1 && (
              <>
                <button
                  onClick={() => navigatePhoto('prev')}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 p-2 sm:p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75"
                >
                  <ChevronLeftIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
                <button
                  onClick={() => navigatePhoto('next')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 p-2 sm:p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75"
                >
                  <ChevronRightIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </>
            )}

            {/* Photo */}
            <div className="flex-1 flex items-center justify-center min-h-0 overflow-hidden" style={{ paddingBottom: '80px' }}>
              <div className="w-full h-full flex items-center justify-center overflow-hidden">
                <Image
                  src={cleanPhotoUrl(photos[selectedPhotoIndex].url)}
                  alt={photos[selectedPhotoIndex].filename}
                  width={800}
                  height={600}
                  className="max-w-full max-h-full object-contain rounded-lg"
                  style={{ 
                    maxHeight: 'calc(100vh - 200px)',
                    maxWidth: 'calc(100vw - 2rem)'
                  }}
                  onError={(e) => {
                    console.error('❌ Failed to load photo in modal:', photos[selectedPhotoIndex].url)
                    console.error('❌ Cleaned URL:', cleanPhotoUrl(photos[selectedPhotoIndex].url))
                    console.error('❌ Error details:', e)
                    // Show error fallback
                    const img = e.currentTarget
                    const parent = img.parentElement
                    if (parent) {
                      parent.innerHTML = `
                        <div class="w-full h-full flex flex-col items-center justify-center bg-gray-100 text-gray-600">
                          <svg class="w-16 h-16 mb-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"></path>
                          </svg>
                          <div class="text-center px-4">
                            <div class="text-lg font-medium mb-2">Failed to load photo</div>
                            <div class="text-sm text-red-500 mb-4">URL: ${photos[selectedPhotoIndex].url}</div>
                            <div class="text-sm text-blue-500 mb-4">Cleaned: ${cleanPhotoUrl(photos[selectedPhotoIndex].url)}</div>
                            <button onclick="window.location.reload()" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                              Retry
                            </button>
                          </div>
                        </div>
                      `
                    }
                  }}
                />
              </div>
            </div>

            {/* Photo info - anchored at bottom */}
            <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-50 text-white p-3 sm:p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{photos[selectedPhotoIndex].filename}</p>
                  <p className="text-sm text-gray-300">
                    {formatDate(photos[selectedPhotoIndex].uploadedAt)}
                    {photos[selectedPhotoIndex].isPrimary && (
                      <span className="ml-2 bg-green-600 px-2 py-1 rounded text-xs">Primary</span>
                    )}
                  </p>
                </div>
                <p className="text-sm text-gray-300">
                  {selectedPhotoIndex + 1} of {photos.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
