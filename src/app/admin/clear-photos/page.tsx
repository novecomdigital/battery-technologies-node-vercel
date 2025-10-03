'use client'

import { useState } from 'react'

interface ClearPhotosResult {
  message: string
  deletedCount: number
  timestamp: string
}

export default function ClearPhotosPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<ClearPhotosResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const clearPhotos = async () => {
    if (!confirm('⚠️ Are you sure you want to delete ALL photos and their metadata? This action cannot be undone!')) {
      return
    }

    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/admin/clear-photos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to clear photos')
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown err occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Clear All Photos</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">⚠️ Warning</h2>
            <p className="text-gray-600">
              This action will permanently delete ALL photos and their metadata from the database. 
              This cannot be undone.
            </p>
          </div>

          <div className="mb-6">
            <h3 className="text-md font-medium text-gray-900 mb-2">What will be deleted:</h3>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>All photo records from the database</li>
              <li>Photo metadata (captions, upload dates, etc.)</li>
              <li>Photo-to-job associations</li>
            </ul>
          </div>

          <div className="mb-6">
            <h3 className="text-md font-medium text-gray-900 mb-2">What you need to do manually:</h3>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>Clear your R2 buckets in Cloudflare Dashboard</li>
              <li>Update your .env.local with correct R2 configuration</li>
              <li>Restart your development server</li>
            </ul>
          </div>

          <button
            onClick={clearPhotos}
            disabled={isLoading}
            className="w-full px-4 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Clearing Photos...' : '🗑️ Clear All Photos'}
          </button>
        </div>

        {result && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-800 mb-2">✅ Success!</h3>
            <p className="text-green-700 mb-2">{result.message}</p>
            <p className="text-sm text-green-600">
              Deleted {result.deletedCount} photos at {new Date(result.timestamp).toLocaleString()}
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-800 mb-2">❌ Error</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">📋 Next Steps</h3>
          <ol className="list-decimal list-inside text-blue-700 space-y-2">
            <li>Go to Cloudflare Dashboard → R2 Object Storage</li>
            <li>Delete all files from your R2 buckets</li>
            <li>Update your .env.local with the correct R2 configuration</li>
            <li>Restart your development server</li>
            <li>Test photo uploads with the fresh setup</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
