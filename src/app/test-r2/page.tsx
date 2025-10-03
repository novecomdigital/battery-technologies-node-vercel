'use client'

import { useState } from 'react'

interface TestResult {
  test: string
  success: boolean
  status?: number
  statusText?: string
  headers?: Record<string, string>
  contentType?: string | null
  contentLength?: string | null
  error?: string
}

export default function TestR2Page() {
  const [testUrl, setTestUrl] = useState('https://pub-842311243a966a889f7f2e54f981b454.r2.dev/1757412614395-image.jpg')
  const [results, setResults] = useState<TestResult[]>([])

  const testUrlAccess = async () => {
    const newResults: TestResult[] = []
    
    // Test 1: HEAD request
    try {
      const headResponse = await fetch(testUrl, { method: 'HEAD' })
      newResults.push({
        test: 'HEAD Request',
        status: headResponse.status,
        statusText: headResponse.statusText,
        headers: Object.fromEntries(headResponse.headers.entries()),
        success: headResponse.ok
      })
    } catch (error) {
      newResults.push({
        test: 'HEAD Request',
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      })
    }

    // Test 2: GET request
    try {
      const getResponse = await fetch(testUrl, { method: 'GET' })
      newResults.push({
        test: 'GET Request',
        status: getResponse.status,
        statusText: getResponse.statusText,
        contentType: getResponse.headers.get('content-type'),
        contentLength: getResponse.headers.get('content-length'),
        success: getResponse.ok
      })
    } catch (error) {
      newResults.push({
        test: 'GET Request',
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      })
    }

    // Test 3: Image load
    try {
      const img = new Image()
      await new Promise((resolve, reject) => {
        img.onload = () => resolve(true)
        img.onerror = () => reject(new Error('Image load failed'))
        img.src = testUrl
      })
      newResults.push({
        test: 'Image Load',
        success: true
      })
    } catch (error) {
      newResults.push({
        test: 'Image Load',
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      })
    }

    setResults(newResults)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">R2 URL Test</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Test URL:
          </label>
          <input
            type="text"
            value={testUrl}
            onChange={(e) => setTestUrl(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter R2 URL to test"
          />
          <button
            onClick={testUrlAccess}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Test URL Access
          </button>
        </div>

        {results.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Results</h2>
            {results.map((result, index) => (
              <div key={index} className={`p-4 rounded-md mb-4 ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <h3 className={`font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                  {result.test} - {result.success ? '✅ Success' : '❌ Failed'}
                </h3>
                <pre className="mt-2 text-sm text-gray-600 overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Tests</h2>
          <div className="space-y-2">
            <button
              onClick={() => setTestUrl('https://pub-e9be35a84de94387b6876cfdc423c997.r2.dev/1757410486708-image.jpg')}
              className="block w-full text-left px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Test Working URL (pub-e9be35a84de94387b6876cfdc423c997)
            </button>
            <button
              onClick={() => setTestUrl('https://pub-842311243a966a889f7f2e54f981b454.r2.dev/1757412614395-image.jpg')}
              className="block w-full text-left px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md"
            >
              Test Failing URL (pub-842311243a966a889f7f2e54f981b454)
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
