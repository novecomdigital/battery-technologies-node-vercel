'use client'

import { useState, useEffect } from 'react'
import { downloadCombinedFilledPDF, previewCombinedFilledPDF, analyzeMultiplePDFTemplates, downloadPhotosPDF, previewPhotosPDF } from '@/lib/pdf-template-service'

export default function TestPDFTemplate() {
  const [pdfAnalysis, setPdfAnalysis] = useState<Array<{
    templatePath: string
    hasForm: boolean
    fields: Array<{ name: string; type: string }>
  }> | null>(null)
  const [jobData, setJobData] = useState<Record<string, unknown> | null>(null)
  const [jobNumber, setJobNumber] = useState('510422')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingJob, setIsLoadingJob] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    analyzePDF()
    fetchFirstJob()
  }, [])

  const fetchJob = async (specificJobNumber?: string) => {
    try {
      setIsLoadingJob(true)
      setError(null)
      const jobNum = specificJobNumber || jobNumber
      const url = jobNum ? `/api/jobs/first?jobNumber=${jobNum}` : '/api/jobs/first'
      const response = await fetch(url)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch job data')
      }
      const job = await response.json()
      setJobData(job)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch job data')
    } finally {
      setIsLoadingJob(false)
    }
  }

  const fetchFirstJob = () => fetchJob()

  const debugJobPhotos = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch(`/api/debug/job-photos?jobNumber=${jobNumber}`)
      const debug = await response.json()
      setDebugInfo(debug)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to debug job photos')
    } finally {
      setIsLoading(false)
    }
  }

  const analyzePDF = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const analysis = await analyzeMultiplePDFTemplates()
      setPdfAnalysis(analysis)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze PDFs')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePreview = async () => {
    if (!jobData) {
      setError('No job data available. Please wait for job data to load.')
      return
    }
    
    try {
      setError(null)
      await previewCombinedFilledPDF(jobData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to preview combined PDF')
    }
  }

  const handleDownload = async () => {
    if (!jobData) {
      setError('No job data available. Please wait for job data to load.')
      return
    }
    
    try {
      setError(null)
      await downloadCombinedFilledPDF(jobData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download combined PDF')
    }
  }

  const handlePreviewPhotos = async () => {
    if (!jobData) {
      setError('No job data available. Please wait for job data to load.')
      return
    }
    
    try {
      setError(null)
      await previewPhotosPDF(jobData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to preview photos PDF')
    }
  }

  const handleDownloadPhotos = async () => {
    if (!jobData) {
      setError('No job data available. Please wait for job data to load.')
      return
    }
    
    try {
      setError(null)
      await downloadPhotosPDF(jobData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download photos PDF')
    }
  }

  const testPhotoFetch = async () => {
    if (!jobData || !(jobData as {photos?: Array<{url: string}>}).photos || (jobData as {photos: Array<{url: string}>}).photos.length === 0) {
      alert('No photos to test')
      return
    }

    console.log('🧪 Testing photo fetch...')
    for (let i = 0; i < (jobData as {photos: Array<{url: string}>}).photos.length; i++) {
      const photo = (jobData as {photos: Array<{url: string}>}).photos[i]
      const cleanUrl = photo.url.replace(/([^:])%+/g, '$1').replace(/%%+/g, '%')
      
      console.log(`🧪 Testing photo ${i + 1}:`)
      console.log(`   Original: ${photo.url}`)
      console.log(`   Cleaned:  ${cleanUrl}`)
      
      try {
        // Test direct fetch first
        console.log(`   🔄 Testing direct fetch...`)
        try {
          const directResponse = await fetch(cleanUrl)
          console.log(`   Direct Status: ${directResponse.status} ${directResponse.statusText}`)
        } catch (directError) {
          console.log(`   Direct Error: ${directError}`)
        }

        // Test proxy fetch
        console.log(`   🔄 Testing proxy fetch...`)
        const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(cleanUrl)}`
        const response = await fetch(proxyUrl)
        console.log(`   Proxy Status: ${response.status} ${response.statusText}`)
        console.log(`   Content-Type: ${response.headers.get('content-type')}`)
        console.log(`   Content-Length: ${response.headers.get('content-length')}`)
        
        if (response.ok) {
          const blob = await response.blob()
          console.log(`   Blob size: ${blob.size} bytes`)
          console.log(`   Blob type: ${blob.type}`)
        }
      } catch (error) {
        console.error(`   Error: ${error}`)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">PDF Template Test</h1>
          
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-red-800 font-medium">Error</h3>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          )}

          {/* PDF Analysis */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">PDF Templates Analysis</h2>
            {isLoading ? (
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ) : pdfAnalysis ? (
              <div className="space-y-6">
                {pdfAnalysis.map((analysis, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3">
                      {analysis.templatePath.replace('/', '')} 
                      {index === 0 && <span className="text-sm text-green-600 ml-2">(Service Sheet - First)</span>}
                      {index === 1 && <span className="text-sm text-blue-600 ml-2">(Photos - Second)</span>}
                    </h3>
                    
                    <p className="mb-2">
                      <strong>Has Form Fields:</strong> {analysis.hasForm ? '✅ Yes' : '❌ No'}
                    </p>
                    <p className="mb-2">
                      <strong>Total Fields:</strong> {analysis.fields.length}
                    </p>
                    
                    {analysis.fields.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-medium text-gray-900 mb-2">Available Form Fields:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {analysis.fields.map((field, fieldIndex) => (
                            <div key={fieldIndex} className="bg-white rounded border p-2">
                              <span className="font-mono text-sm text-blue-600">{field.name}</span>
                              <span className="text-xs text-gray-500 ml-2">({field.type})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {analysis.fields.length === 0 && (
                      <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h4 className="text-yellow-800 font-medium">No Form Fields Found</h4>
                        <p className="text-yellow-600 text-sm mt-1">
                          This PDF doesn&apos;t appear to have fillable form fields. You may need to:
                        </p>
                        <ul className="text-yellow-600 text-sm mt-2 list-disc list-inside">
                          <li>Create form fields in your PDF using Adobe Acrobat or similar software</li>
                          <li>Or use a different approach like overlaying text on specific coordinates</li>
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Failed to analyze PDF templates</p>
            )}
          </div>

          {/* Real Job Data */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Real Job Data</h2>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={jobNumber}
                  onChange={(e) => setJobNumber(e.target.value)}
                  placeholder="Job Number (e.g., 510422)"
                  className="px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={() => fetchJob()}
                  disabled={isLoadingJob}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoadingJob ? 'Loading...' : 'Load Job'}
                </button>
                <button
                  onClick={debugJobPhotos}
                  disabled={isLoading}
                  className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                >
                  {isLoading ? 'Debugging...' : 'Debug Photos'}
                </button>
                <button
                  onClick={testPhotoFetch}
                  disabled={!jobData || !(jobData as {photos?: Array<{url: string}>}).photos || (jobData as {photos: Array<{url: string}>}).photos.length === 0}
                  className="px-3 py-1 text-sm bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
                >
                  Test Photo Fetch
                </button>
              </div>
            </div>
            
            {isLoadingJob ? (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ) : jobData ? (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="mb-4">
                  <h3 className="font-medium text-gray-900 mb-2">
                    Job #{(jobData as {jobNumber: string}).jobNumber} - {(jobData as {customer?: {name: string}}).customer?.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Status: {(jobData as {status: string}).status} | Service: {(jobData as {serviceType: string}).serviceType} | Due: {(jobData as {dueDate?: string}).dueDate ? new Date((jobData as {dueDate: string}).dueDate).toLocaleDateString() : 'Not set'}
                  </p>
                  <p className="text-sm text-gray-500">
                    Photos: {(jobData as {photos?: Array<{url: string}>}).photos?.length || 0} attached
                  </p>
                </div>
                <details className="cursor-pointer">
                  <summary className="text-sm font-medium text-gray-700 hover:text-gray-900">
                    View Full Job Data (Click to expand)
                  </summary>
                  <pre className="text-xs text-gray-700 overflow-auto mt-2 max-h-64">
                    {JSON.stringify(jobData, null, 2)}
                  </pre>
                </details>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-500">No job data loaded yet.</p>
              </div>
            )}
          </div>

          {/* Debug Information */}
          {debugInfo && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Photo Debug Information</h2>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <h3 className="font-medium text-gray-900">Database Stats</h3>
                    <p className="text-sm text-gray-600">Total Jobs: {(debugInfo as {totalJobs: number}).totalJobs}</p>
                    <p className="text-sm text-gray-600">Total Photos: {(debugInfo as {totalPhotos: number}).totalPhotos}</p>
                    <p className="text-sm text-gray-600">Jobs with Photos: {(debugInfo as {jobsWithPhotos?: Array<unknown>}).jobsWithPhotos?.length || 0}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Requested Job ({jobNumber})</h3>
                    <p className="text-sm text-gray-600">Found: {(debugInfo as {requestedJob?: unknown}).requestedJob ? 'Yes' : 'No'}</p>
                    {(debugInfo as {requestedJob?: {photoCount: number}}).requestedJob && (
                      <p className="text-sm text-gray-600">Photos: {(debugInfo as {requestedJob: {photoCount: number}}).requestedJob.photoCount}</p>
                    )}
                  </div>
                </div>

                {(debugInfo as {requestedJob?: {photos?: Array<{url: string, caption?: string}>}}).requestedJob && (debugInfo as {requestedJob: {photos?: Array<{url: string, caption?: string}>}}).requestedJob.photos && (debugInfo as {requestedJob: {photos: Array<{url: string, caption?: string}>}}).requestedJob.photos.length > 0 && (
                  <div className="mb-4">
                    <h3 className="font-medium text-gray-900 mb-2">Photo Details for Job {jobNumber}</h3>
                    <div className="space-y-2">
                      {((debugInfo as {requestedJob: {photos: Array<{url: string, caption?: string}>}}).requestedJob.photos).map((photo, index: number) => {
                        const cleanUrl = photo.url.replace(/([^:])%+/g, '$1').replace(/%%+/g, '%')
                        const hasUrlIssue = photo.url !== cleanUrl
                        return (
                        <div key={index} className="bg-white border border-gray-200 rounded p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">Photo {index + 1}</p>
                              <p className="text-xs text-gray-500">ID: {index + 1}</p>
                              <p className="text-xs text-gray-600">Original URL: {photo.url}</p>
                              {hasUrlIssue && (
                                <p className="text-xs text-green-600">Cleaned URL: {cleanUrl}</p>
                              )}
                              <p className="text-xs text-gray-600">Created: {new Date().toLocaleString()}</p>
                              {photo.caption && <p className="text-xs text-gray-600">Caption: {photo.caption}</p>}
                            </div>
                            <div className="ml-4">
                              <img 
                                src={cleanUrl} 
                                alt={`Photo ${index + 1}`}
                                className="w-16 h-16 object-cover rounded border"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const errorDiv = document.createElement('div');
                                  errorDiv.className = 'w-16 h-16 bg-red-100 border border-red-300 rounded flex items-center justify-center text-xs text-red-600';
                                  errorDiv.textContent = 'Failed to load';
                                  target.parentNode?.appendChild(errorDiv);
                                }}
                              />
                            </div>
                          </div>
                        </div>
                        )
                      })}
                    </div>
                  </div>
                )}
                
                {(debugInfo as {jobsWithPhotos?: Array<{id: string, jobNumber: string, _count?: {photos: number}}>}).jobsWithPhotos && (debugInfo as {jobsWithPhotos: Array<{id: string, jobNumber: string, _count?: {photos: number}}>}).jobsWithPhotos.length > 0 && (
                  <div className="mb-4">
                    <h3 className="font-medium text-gray-900 mb-2">Jobs with Photos (Sample)</h3>
                    <div className="space-y-1">
                      {((debugInfo as {jobsWithPhotos: Array<{id: string, jobNumber: string, _count?: {photos: number}}>}).jobsWithPhotos).map((job) => (
                        <div key={job.id} className="text-sm text-gray-600">
                          Job #{job.jobNumber}: {job._count?.photos || 0} photos
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(debugInfo as {error?: string}).error && (
                  <div className="mb-4">
                    <h3 className="font-medium text-red-700">Error</h3>
                    <p className="text-sm text-red-600">{(debugInfo as {error: string}).error}</p>
                    {(debugInfo as {availableJobs?: Array<{jobNumber: string}>}).availableJobs && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-600">Available jobs (sample):</p>
                        <div className="text-xs text-gray-500">
                          {((debugInfo as {availableJobs: Array<{jobNumber: string}>}).availableJobs).map((job) => job.jobNumber).join(', ')}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Test Actions */}
          <div className="space-y-4">
            <div className="flex space-x-4">
              <button
                onClick={handlePreview}
                disabled={!jobData || isLoadingJob}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Preview Combined PDF
              </button>
              <button
                onClick={handleDownload}
                disabled={!jobData || isLoadingJob}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Download Combined PDF
              </button>
              <button
                onClick={analyzePDF}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Re-analyze PDFs
              </button>
            </div>
            
            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Test Photos PDF Only:</h3>
              <div className="flex space-x-4">
                <button
                  onClick={handlePreviewPhotos}
                  disabled={!jobData || isLoadingJob}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Preview Photos PDF
                </button>
                <button
                  onClick={handleDownloadPhotos}
                  disabled={!jobData || isLoadingJob}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Download Photos PDF
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                This will generate only the photos PDF with actual job images (2 per page) and timestamps.
              </p>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-blue-800 font-medium">Instructions</h3>
            <div className="text-blue-600 text-sm mt-2 space-y-2">
              <p>1. Make sure your PDF files are located at:</p>
              <ul className="list-disc list-inside ml-4">
                <li><code>/public/BatteryServiceSheet.pdf</code> (Service sheet - will appear first)</li>
                <li><code>/public/Batteryphotos.pdf</code> (Photos sheet - will appear second)</li>
              </ul>
              <p>2. If the PDFs have form fields, they should be listed above for each template</p>
              <p>3. Update the field mappings in <code>src/lib/pdf-template-service.ts</code> to match your PDF field names:</p>
              <ul className="list-disc list-inside ml-4">
                <li><code>SERVICE_SHEET_CONFIG</code> for the service sheet fields</li>
                <li><code>PHOTOS_CONFIG</code> for the photos sheet fields</li>
              </ul>
              <p>4. The page now uses real job data from your database (the first job record)</p>
              <p>5. Test the preview and download functions to see if the data fills correctly in both PDFs</p>
              <p>6. The system will automatically merge both PDFs with the service sheet first and photos second</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
