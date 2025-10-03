import { format } from 'date-fns'
import { JobTemplate } from './template-config'
import { COMPANY_CONFIG } from './company-config'

export interface JobData {
  id: string
  jobNumber: string
  description: string | null
  status: string
  serviceType: string
  dueDate: string | null
  startDate: string | null
  endDate: string | null
  notes: string | null
  estimatedHours: number | null
  actualHours: number | null
  batteryType: string | null
  batteryModel: string | null
  batterySerial: string | null
  equipmentType: string | null
  equipmentModel: string | null
  equipmentSerial: string | null
  customer: {
    id: string
    name: string
    phone: string | null
    email: string | null
  }
  location: {
    id: string
    name: string
    address: string | null
    city: string | null
    state: string | null
    zipCode: string | null
  } | null
  contact: {
    id: string
    firstName: string
    lastName: string
    phone: string | null
    email: string | null
    title: string | null
  } | null
  assignedTo: {
    id: string
    name: string
  } | null
}

export interface TemplateData {
  // Company data
  companyName: string
  companyAddress: string
  companyPhone: string
  companyEmail: string
  
  // Job data
  jobNumber: string
  jobDate: string
  customerName: string
  jobStatus: string
  serviceType: string
  technicianName: string
  locationAddress: string
  
  // Equipment data
  batteryType: string
  batteryModel: string
  batterySerial: string
  equipmentType: string
  equipmentModel: string
  equipmentSerial: string
  
  // Work data
  jobDescription: string
  jobNotes: string
  estimatedHours: string
  actualHours: string
  startDate: string
  endDate: string
}

// Convert job data to template data
export function convertJobToTemplateData(job: JobData): TemplateData {
  const formatDate = (date: string | null, formatStr: string = 'dd/MM/yyyy'): string => {
    if (!date) return ''
    try {
      return format(new Date(date), formatStr)
    } catch {
      return date
    }
  }

  const formatAddress = (location: JobData['location']): string => {
    if (!location) return ''
    
    const parts = [
      location.address,
      location.city,
      location.state,
      location.zipCode
    ].filter(Boolean)
    
    return parts.join(', ')
  }

  return {
    // Company data
    companyName: COMPANY_CONFIG.name,
    companyAddress: COMPANY_CONFIG.fullAddress,
    companyPhone: COMPANY_CONFIG.phone,
    companyEmail: COMPANY_CONFIG.email,
    
    // Job data
    jobNumber: job.jobNumber || '',
    jobDate: formatDate(job.dueDate),
    customerName: job.customer?.name || '',
    jobStatus: job.status || '',
    serviceType: job.serviceType || '',
    technicianName: job.assignedTo?.name || '',
    locationAddress: formatAddress(job.location),
    
    // Equipment data
    batteryType: job.batteryType || '',
    batteryModel: job.batteryModel || '',
    batterySerial: job.batterySerial || '',
    equipmentType: job.equipmentType || '',
    equipmentModel: job.equipmentModel || '',
    equipmentSerial: job.equipmentSerial || '',
    
    // Work data
    jobDescription: job.description || '',
    jobNotes: job.notes || '',
    estimatedHours: job.estimatedHours?.toString() || '',
    actualHours: job.actualHours?.toString() || '',
    startDate: formatDate(job.startDate),
    endDate: formatDate(job.endDate)
  }
}

// Fill template with data
export function fillTemplate(template: JobTemplate, data: TemplateData): string {
  let filledTemplate = template.template
  
  // Replace all placeholders with data
  Object.entries(data).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`
    const replacement = value || '' // Replace with empty string if value is null/undefined
    filledTemplate = filledTemplate.replace(new RegExp(placeholder, 'g'), replacement)
  })
  
  return filledTemplate
}

// Generate complete HTML document with styles
export function generateHTMLDocument(template: JobTemplate, data: TemplateData): string {
  const filledTemplate = fillTemplate(template, data)
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${template.name}</title>
      <style>
        ${template.styles || ''}
      </style>
    </head>
    <body>
      ${filledTemplate}
    </body>
    </html>
  `
}

// Generate PDF from template (this will be implemented with a PDF library)
export async function generatePDF(template: JobTemplate, data: TemplateData): Promise<Blob> {
  // This is a placeholder - you'll need to implement actual PDF generation
  // You can use libraries like jsPDF, Puppeteer, or html2pdf
  const html = generateHTMLDocument(template, data)
  
  // For now, return a simple text representation
  // In a real implementation, you'd use a PDF library here
  const textContent = html.replace(/<[^>]*>/g, '') // Strip HTML tags
  return new Blob([textContent], { type: 'text/plain' })
}

// Preview template in a new window
export function previewTemplate(template: JobTemplate, data: TemplateData): void {
  const html = generateHTMLDocument(template, data)
  const newWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes')
  
  if (newWindow) {
    newWindow.document.write(html)
    newWindow.document.close()
  }
}

// Download template as HTML file
export function downloadTemplateAsHTML(template: JobTemplate, data: TemplateData, filename?: string): void {
  const html = generateHTMLDocument(template, data)
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = filename || `${template.name.toLowerCase().replace(/\s+/g, '-')}-${data.jobNumber || 'report'}.html`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
