'use client'

import { useState, useRef } from 'react'
import { 
  DocumentTextIcon, 
  EyeIcon, 
  PrinterIcon, 
  ArrowDownTrayIcon,
  XMarkIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline'
import { JobTemplate, getTemplate } from '@/lib/template-config'
import { TemplateData, convertJobToTemplateData, fillTemplate, generateHTMLDocument, JobData } from '@/lib/template-engine'
import { generatePDFWithFallback } from '@/lib/pdf-generator'
import { downloadCombinedFilledPDF, previewCombinedFilledPDF } from '@/lib/pdf-template-service'

interface TemplateGeneratorProps {
  jobData: Record<string, unknown> // Job data from your job record
  onClose?: () => void
}

export default function TemplateGenerator({ jobData, onClose }: TemplateGeneratorProps) {
  // Auto-select PDF Service Sheet template on component mount
  const pdfTemplate = getTemplate('pdf-service-sheet')
  const [selectedTemplate, setSelectedTemplate] = useState<JobTemplate | null>(pdfTemplate || null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [previewMode, setPreviewMode] = useState<'form' | 'preview'>('form')
  const [templateData, setTemplateData] = useState<TemplateData | null>(
    pdfTemplate ? convertJobToTemplateData(jobData as unknown as JobData) : null
  )
  const previewRef = useRef<HTMLDivElement>(null)

  // Convert job data to template data
  const convertToTemplateData = (job: Record<string, unknown>): TemplateData => {
    return convertJobToTemplateData(job as unknown as JobData)
  }

  // Handle template selection
  const handleTemplateSelect = (templateId: string) => {
    const template = getTemplate(templateId)
    if (template) {
      setSelectedTemplate(template)
      const data = convertToTemplateData(jobData)
      setTemplateData(data)
    }
  }

  // Handle field changes
  const handleFieldChange = (key: string, value: string) => {
    if (templateData) {
      setTemplateData({
        ...templateData,
        [key]: value
      })
    }
  }

  // Generate preview
  const handlePreview = () => {
    if (selectedTemplate && templateData) {
      setPreviewMode('preview')
    }
  }

  // Generate PDF
  const handleGeneratePDF = async () => {
    if (!selectedTemplate || !templateData) return

    setIsGenerating(true)
    try {
      if (selectedTemplate.type === 'pdf') {
        // Use combined PDF template service for PDF templates
        await downloadCombinedFilledPDF(jobData)
      } else {
        // Use HTML to PDF conversion for HTML templates
        if (!previewRef.current) return
        await generatePDFWithFallback(previewRef.current, {
          filename: `job-report-${templateData.jobNumber || 'report'}.pdf`
        })
      }
    } catch (error) {
      console.error('PDF generation failed:', error)
      alert('Failed to generate PDF. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  // Preview PDF template
  const handlePreviewPDF = async () => {
    if (!selectedTemplate || selectedTemplate.type !== 'pdf') return

    try {
      await previewCombinedFilledPDF(jobData)
    } catch (error) {
      console.error('PDF preview failed:', error)
      alert('Failed to preview PDF. Please try again.')
    }
  }

  // Download as HTML
  const handleDownloadHTML = () => {
    if (!selectedTemplate || !templateData) return

    const html = generateHTMLDocument(selectedTemplate, templateData)
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `job-report-${templateData.jobNumber || 'report'}.html`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Print
  const handlePrint = () => {
    if (previewRef.current) {
      window.print()
    }
  }

  if (previewMode === 'preview' && selectedTemplate && templateData) {
    const filledTemplate = fillTemplate(selectedTemplate, templateData)
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-xl font-semibold">Template Preview</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPreviewMode('form')}
                className="flex items-center space-x-2 px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                <XMarkIcon className="h-4 w-4" />
                <span>Edit</span>
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <PrinterIcon className="h-4 w-4" />
                <span>Print</span>
              </button>
              <button
                onClick={handleGeneratePDF}
                disabled={isGenerating}
                className="flex items-center space-x-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                <DocumentTextIcon className="h-4 w-4" />
                <span>{isGenerating ? 'Generating...' : 'PDF'}</span>
              </button>
              <button
                onClick={handleDownloadHTML}
                className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                <span>HTML</span>
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="flex items-center space-x-2 px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  <XMarkIcon className="h-4 w-4" />
                  <span>Close</span>
                </button>
              )}
            </div>
          </div>
          
          {/* Preview Content */}
          <div className="flex-1 overflow-auto p-4">
            <div 
              ref={previewRef}
              dangerouslySetInnerHTML={{ __html: filledTemplate }}
              className="bg-white"
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Generate Job Report</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              <XMarkIcon className="h-4 w-4" />
              <span>Close</span>
            </button>
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {!selectedTemplate ? (
            // Template Selection
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Select Template</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  onClick={() => handleTemplateSelect('job-report')}
                  className="border border-gray-300 rounded-lg p-4 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <DocumentTextIcon className="h-8 w-8 text-blue-600" />
                    <div>
                      <h4 className="font-medium">Job Report</h4>
                      <p className="text-sm text-gray-600">Standard job completion report</p>
                    </div>
                  </div>
                </div>
                
                <div
                  onClick={() => handleTemplateSelect('pdf-service-sheet')}
                  className="border border-gray-300 rounded-lg p-4 cursor-pointer hover:border-green-500 hover:bg-green-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <DocumentArrowDownIcon className="h-8 w-8 text-green-600" />
                    <div>
                      <h4 className="font-medium">PDF Service Sheet</h4>
                      <p className="text-sm text-gray-600">Service sheet using your existing PDF template</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Template Form
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Edit Template Data</h3>
                <div className="flex space-x-2">
                  {selectedTemplate.type === 'pdf' ? (
                    <>
                      <button
                        onClick={handlePreviewPDF}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <EyeIcon className="h-4 w-4" />
                        <span>Preview PDF</span>
                      </button>
                      <button
                        onClick={handleGeneratePDF}
                        disabled={isGenerating}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <DocumentArrowDownIcon className="h-4 w-4" />
                        <span>{isGenerating ? 'Generating...' : 'Download PDF'}</span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handlePreview}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <EyeIcon className="h-4 w-4" />
                      <span>Preview</span>
                    </button>
                  )}
                </div>
              </div>
              
              {selectedTemplate.type === 'pdf' ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <DocumentArrowDownIcon className="h-8 w-8 text-green-600" />
                    <div>
                      <h4 className="font-medium text-green-800">PDF Template Ready</h4>
                      <p className="text-sm text-green-600">
                        This template will use your existing PDF form and automatically fill it with job data.
                        Click &quot;Preview PDF&quot; to see how it will look, or &quot;Download PDF&quot; to generate the filled document.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedTemplate.fields.map((field) => (
                    <div key={field.key} className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      <input
                        type={field.type === 'number' ? 'number' : 'text'}
                        value={templateData?.[field.key as keyof TemplateData] || ''}
                        onChange={(e) => handleFieldChange(field.key, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder={field.defaultValue || ''}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

