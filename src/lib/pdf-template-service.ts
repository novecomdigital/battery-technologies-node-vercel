import { PDFDocument, PDFTextField, PDFCheckBox, rgb, degrees } from 'pdf-lib'

export interface PDFFieldMapping {
  fieldName: string
  jobDataKey: string
  transform?: (value: unknown) => string
}

export interface PDFTemplateConfig {
  templatePath: string
  fieldMappings: PDFFieldMapping[]
  outputFilename?: string
}

export interface MultiPDFTemplateConfig {
  templates: PDFTemplateConfig[]
  outputFilename?: string
}

// Configuration for the service sheet PDF template
export const SERVICE_SHEET_CONFIG: PDFTemplateConfig = {
  templatePath: '/BatteryServiceSheet.pdf',
  outputFilename: 'service-sheet-{jobNumber}.pdf',
  fieldMappings: [
    // Job Information
    { fieldName: '$date', jobDataKey: '', transform: () => new Date().toLocaleDateString('en-GB') },
    { fieldName: '$jobNumber', jobDataKey: 'jobNumber' },
    { fieldName: '$customerJobNumber', jobDataKey: ''},
    { fieldName: '$customerPoNumber', jobDataKey: '' },
    
    // Customer Location Information
    { fieldName: '$customerAddress', jobDataKey: 'customer.address' },
    { fieldName: '$customerCity', jobDataKey: 'customer.city' },
    { fieldName: '$customerState', jobDataKey: 'customer.state' },
    { fieldName: '$customerZip', jobDataKey: 'customer.zipCode' },

    // Location Information
    { fieldName: '$jobAddress', jobDataKey: 'location.name' },
    { fieldName: '$jobCity', jobDataKey: 'location.address' },
    { fieldName: '$jobCity', jobDataKey: 'location.city' },
    { fieldName: '$jobZip', jobDataKey: 'location.zipCode' },
    
    
    // Contact Person
    { fieldName: '$jobDescription', jobDataKey: 'description'},
    
    // Equipment Information
    { fieldName: '$machineType', jobDataKey: 'equipmentType' },
    { fieldName: '$machineSerial', jobDataKey: 'equipmentSerial' },
    { fieldName: '$machineFleet', jobDataKey: '' },
    { fieldName: '$battery', jobDataKey: 'batteryType' },
    { fieldName: '$batterySerial', jobDataKey: 'batterySerial' },
    { fieldName: '$batteryManufacturer', jobDataKey: 'batteryModel' },
    { fieldName: '$charger', jobDataKey: '' },
    { fieldName: '$chargerSerial', jobDataKey: '' },
    { fieldName: '$chargerManufacturer', jobDataKey: '' },
    { fieldName: '$batteryAccessorites', jobDataKey: '' },
    { fieldName: '$plugType', jobDataKey: '' },
    { fieldName: '$trayCondition', jobDataKey: '' },
    
    // Battery Information
    { fieldName: '$plugVoltage', jobDataKey: '' },
    { fieldName: '$voltageRange', jobDataKey: '' },
    { fieldName: '$sgRange', jobDataKey: ''},
    
    // Job Info
    { fieldName: '$jobNotes', jobDataKey: 'notes'}
    
  ]
}

// Configuration for the photos PDF template
export const PHOTOS_CONFIG: PDFTemplateConfig = {
  templatePath: '/Batteryphotos.pdf',
  outputFilename: 'photos-{jobNumber}.pdf',
  fieldMappings: [
    // Job Information for photos sheet (using same field naming pattern as service sheet)
    { fieldName: '$date', jobDataKey: '', transform: () => new Date().toLocaleDateString('en-GB') },
    { fieldName: '$jobNumber', jobDataKey: 'jobNumber' },
    { fieldName: '$customerJobNumber', jobDataKey: 'customer.jobNumber'},
    
    // Customer Location Information
    { fieldName: '$customerAddress', jobDataKey: 'customer.address' },
    { fieldName: '$customerCity', jobDataKey: 'customer.city' },
    { fieldName: '$customerState', jobDataKey: 'customer.state' },
    { fieldName: '$customerZip', jobDataKey: 'customer.zipCode' },
 
    // Location Information
    { fieldName: '$jobAddress', jobDataKey: 'location.name' },
    { fieldName: '$jobCity', jobDataKey: 'location.address' },
    { fieldName: '$jobZip', jobDataKey: 'location.zipCode' },
    
    // Job Description
    { fieldName: '$jobDescription', jobDataKey: 'description'},
    
    // Equipment Information (if needed on photos sheet)
    { fieldName: '$machineType', jobDataKey: 'batteryType' },
    { fieldName: '$machineSerial', jobDataKey: 'batteryModel' },
    { fieldName: '$battery', jobDataKey: 'batteryType' },
    { fieldName: '$batterySerial', jobDataKey: 'batteryModel' },
    
    // Job Notes
    { fieldName: '$jobNotes', jobDataKey: 'notes'},
    
    // Add more photo-specific fields as needed based on your PDF form fields
    // You may need to adjust these field names to match your actual PDF form field names
  ]
}

// Combined configuration for both PDFs
export const COMBINED_PDF_CONFIG: MultiPDFTemplateConfig = {
  templates: [SERVICE_SHEET_CONFIG, PHOTOS_CONFIG],
  outputFilename: 'complete-service-report-{jobNumber}.pdf'
}

// Helper function to get nested object value by path
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((current: unknown, key: string) => {
    if (current && typeof current === 'object' && current !== null) {
      return (current as Record<string, unknown>)[key]
    }
    return undefined
  }, obj)
}

// Fill PDF template with job data
export async function fillPDFTemplate(
  jobData: Record<string, unknown>, 
  config: PDFTemplateConfig = SERVICE_SHEET_CONFIG
): Promise<Uint8Array> {
  try {
    // Fetch the PDF template
    const templateResponse = await fetch(config.templatePath)
    if (!templateResponse.ok) {
      throw new Error(`Failed to fetch PDF template: ${templateResponse.statusText}`)
    }
    
    const templateBytes = await templateResponse.arrayBuffer()
    
    // Load the PDF document
    const pdfDoc = await PDFDocument.load(templateBytes)
    const form = pdfDoc.getForm()
    
    // Get all form fields for debugging
    const fields = form.getFields()
    console.log('Available PDF form fields:', fields.map(field => ({
      name: field.getName(),
      type: field.constructor.name
    })))
    
    // Fill the form fields
    config.fieldMappings.forEach(mapping => {
      try {
        const field = form.getField(mapping.fieldName)
        let value = getNestedValue(jobData, mapping.jobDataKey)
        
        // Apply transformation if provided
        if (mapping.transform && value !== undefined && value !== null) {
          value = mapping.transform(value)
        }
        
        // Convert to string and handle null/undefined
        const stringValue = value?.toString() || ''
        
        // Fill the field based on its type
        if (field instanceof PDFTextField) {
          field.setText(stringValue)
        } else if (field instanceof PDFCheckBox) {
          // For checkboxes, check if value is truthy
          if (stringValue && stringValue.toLowerCase() !== 'false') {
            field.check()
          } else {
            field.uncheck()
          }
        }
        
        console.log(`Filled field "${mapping.fieldName}" with value: "${stringValue}"`)
      } catch (fieldError) {
        console.warn(`Could not fill field "${mapping.fieldName}":`, fieldError)
        // Continue with other fields even if one fails
      }
    })
    
    // Flatten the form to make it non-editable (optional)
    // form.flatten()
    
    // Save the PDF
    const pdfBytes = await pdfDoc.save()
    return pdfBytes
    
  } catch (error) {
    console.error('Error filling PDF template:', error)
    throw new Error(`Failed to fill PDF template: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Generate filename from template
export function generateFilename(jobData: Record<string, unknown>, template: string): string {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const value = getNestedValue(jobData, key)
    return value?.toString() || 'unknown'
  })
}

// Download filled PDF
export async function downloadFilledPDF(
  jobData: Record<string, unknown>, 
  config: PDFTemplateConfig = SERVICE_SHEET_CONFIG
): Promise<void> {
  try {
    const pdfBytes = await fillPDFTemplate(jobData, config)
    
    // Create blob and download
    const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = config.outputFilename 
      ? generateFilename(jobData, config.outputFilename)
      : `service-sheet-${jobData.jobNumber || 'report'}.pdf`
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Clean up
    URL.revokeObjectURL(url)
    
  } catch (error) {
    console.error('Error downloading PDF:', error)
    throw error
  }
}

// Preview filled PDF in new window
export async function previewFilledPDF(
  jobData: Record<string, unknown>, 
  config: PDFTemplateConfig = SERVICE_SHEET_CONFIG
): Promise<void> {
  try {
    const pdfBytes = await fillPDFTemplate(jobData, config)
    
    // Create blob URL
    const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    
    // Open in new window
    const newWindow = window.open(url, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes')
    
    if (!newWindow) {
      throw new Error('Failed to open preview window. Please allow popups.')
    }
    
    // Clean up URL after window loads
    newWindow.onload = () => {
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    }
    
  } catch (error) {
    console.error('Error previewing PDF:', error)
    throw error
  }
}

// Fill photos PDF with actual images
export async function fillPhotosPDF(
  jobData: Record<string, unknown>,
  config: PDFTemplateConfig = PHOTOS_CONFIG
): Promise<Uint8Array> {
  try {
    // Fetch the PDF template
    const templateResponse = await fetch(config.templatePath)
    if (!templateResponse.ok) {
      throw new Error(`Failed to fetch PDF template: ${templateResponse.statusText}`)
    }
    
    const templateBytes = await templateResponse.arrayBuffer()
    const pdfDoc = await PDFDocument.load(templateBytes)
    
    // Fill text fields first (like job info)
    const form = pdfDoc.getForm()
    config.fieldMappings.forEach(mapping => {
      try {
        const field = form.getField(mapping.fieldName)
        let value = getNestedValue(jobData, mapping.jobDataKey)
        
        if (mapping.transform && value !== undefined && value !== null) {
          value = mapping.transform(value)
        }
        
        const stringValue = value?.toString() || ''
        
        if (field instanceof PDFTextField) {
          field.setText(stringValue)
        } else if (field instanceof PDFCheckBox) {
          if (stringValue && stringValue.toLowerCase() !== 'false') {
            field.check()
          } else {
            field.uncheck()
          }
        }
      } catch (fieldError) {
        console.warn(`Could not fill field "${mapping.fieldName}":`, fieldError)
      }
    })
    
    // Add photos to the PDF
          if ((jobData as {photos?: Array<{url: string}>}).photos && (jobData as {photos: Array<{url: string}>}).photos.length > 0) {
            console.log('📸 Processing photos for PDF:', (jobData as {photos: Array<{url: string}>}).photos.length, 'photos found')
            console.log('📸 Photo URLs:', (jobData as {photos: Array<{url: string}>}).photos.map((p) => p.url))
            await addPhotosToPages(pdfDoc, (jobData as {photos: Array<{url: string}>}).photos)
          } else {
            console.log('⚠️ No photos found in jobData:', (jobData as {photos?: Array<{url: string}>}).photos)
          }
    
    return await pdfDoc.save()
    
  } catch (error) {
    console.error('Error filling photos PDF:', error)
    throw new Error(`Failed to fill photos PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Add photos to PDF pages (2 photos per page)
async function addPhotosToPages(pdfDoc: PDFDocument, photos: Array<{url: string, caption?: string}>): Promise<void> {
  console.log('🖼️ Starting addPhotosToPages with', photos.length, 'photos')
  const photosPerPage = 2
  
  // Calculate how many pages we need
  const pagesNeeded = Math.ceil(photos.length / photosPerPage)
  console.log(`📄 Need ${pagesNeeded} pages for ${photos.length} photos (${photosPerPage} photos per page)`)
  
  // Get current pages
  const currentPages = pdfDoc.getPages()
  const additionalPagesNeeded = pagesNeeded - currentPages.length
  
  // Create all additional pages in one batch operation if needed
  if (additionalPagesNeeded > 0) {
    console.log(`📄 Creating ${additionalPagesNeeded} additional template pages`)
    // Create array of page indices to copy (all pointing to the first page)
    const pageIndicesToCopy = Array(additionalPagesNeeded).fill(0)
    // Copy all pages in one operation
    const copiedPages = await pdfDoc.copyPages(pdfDoc, pageIndicesToCopy)
    // Add all copied pages
    copiedPages.forEach(page => pdfDoc.addPage(page))
  }
  
  // Now add photos to the pages
  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i]
    // Clean the photo URL - remove extra % characters and fix encoding issues
    const cleanUrl = photo.url.replace(/([^:])%+/g, '$1').replace(/%%+/g, '%')
    console.log(`🖼️ Processing photo ${i + 1}/${photos.length}:`)
    console.log(`   Original URL: ${photo.url}`)
    console.log(`   Cleaned URL:  ${cleanUrl}`)
    
    const pageIndex = Math.floor(i / photosPerPage)
    const photoIndexOnPage = i % photosPerPage
    
    // Get the page for this photo (should already exist)
    const page = pdfDoc.getPages()[pageIndex]
    console.log(`📄 Adding photo ${i + 1} to page ${pageIndex + 1} (position ${photoIndexOnPage + 1} of ${photosPerPage})`);
    
    try {
      // Fetch the photo using proxy to handle CORS
      console.log(`🌐 Fetching photo from URL: ${cleanUrl}`)
      let imageResponse: Response
      
      // Check if it's an external URL that might have CORS issues
      const isExternalUrl = cleanUrl.startsWith('http') && (
        typeof window === 'undefined' || !cleanUrl.includes(window.location.hostname)
      )
      
      if (isExternalUrl) {
        // Use our proxy API to bypass CORS
        const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(cleanUrl)}`
        console.log(`🔄 Using proxy for external URL: ${proxyUrl}`)
        imageResponse = await fetch(proxyUrl)
      } else {
        // Direct fetch for local or same-origin URLs
        console.log(`🔄 Direct fetch for local URL`)
        imageResponse = await fetch(cleanUrl)
      }
      
      if (!imageResponse.ok) {
        console.warn(`❌ Failed to fetch photo: ${cleanUrl} - Status: ${imageResponse.status} ${imageResponse.statusText}`)
        continue
      }
      console.log(`✅ Successfully fetched photo: ${cleanUrl}`)
      
      const imageBytes = await imageResponse.arrayBuffer()
      
      // Determine image type and embed
      let image
      const contentType = imageResponse.headers.get('content-type')
      if (contentType?.includes('jpeg') || contentType?.includes('jpg')) {
        image = await pdfDoc.embedJpg(imageBytes)
      } else if (contentType?.includes('png')) {
        image = await pdfDoc.embedPng(imageBytes)
      } else {
        console.warn(`Unsupported image type: ${contentType}`)
        continue
      }
      
      // Calculate position (2 photos per page, stacked vertically)
      const pageWidth = page.getWidth()
      const pageHeight = page.getHeight()
      const margin = 50
      const timestampHeight = 30 // Space for timestamp
      const photoSpacing = 60 // Space between photos (increased for better separation)
      const availableWidth = pageWidth - (2 * margin)
      
      // Calculate available height for each photo (divide page into 2 sections)
      const formFieldsSpace = 280 // Increased space reserved for form fields at top
      const totalAvailableHeight = pageHeight - (2 * margin) - formFieldsSpace
      const maxPhotoHeight = (totalAvailableHeight - photoSpacing - (2 * timestampHeight)) / 2
      
      // Scale image to fit - make photos smaller by reducing max dimensions
      const imageWidth = image.width
      const imageHeight = image.height
      const aspectRatio = imageWidth / imageHeight
      
      // Limit maximum photo size - increased for larger photos
      const maxPhotoWidth = availableWidth * 1.4 // Increased from 0.8 to 0.95
      const constrainedMaxPhotoHeight = maxPhotoHeight * 1.4 // Increased from 0.9 to 0.95
      
      let scaledWidth = Math.min(maxPhotoWidth, availableWidth)
      let scaledHeight = scaledWidth / aspectRatio
      
      if (scaledHeight > constrainedMaxPhotoHeight) {
        scaledHeight = constrainedMaxPhotoHeight
        scaledWidth = scaledHeight * aspectRatio
      }
      
      // Position photos with clear separation
      const x = margin + (availableWidth - scaledWidth) / 2
      let y: number
      
      if (photoIndexOnPage === 0) {
        // Top photo - position well below form fields
        y = pageHeight - margin - formFieldsSpace - scaledHeight
      } else {
        // Bottom photo - position with clear separation from top photo
        const topPhotoBottom = pageHeight - margin - formFieldsSpace - scaledHeight
        y = topPhotoBottom - timestampHeight - photoSpacing - scaledHeight - timestampHeight
      }
      
      // Draw the image
      page.drawImage(image, {
        x,
        y,
        width: scaledWidth,
        height: scaledHeight,
      })
      
      // Add timestamp text to the left of the image
      const createdAt = new Date()
      const timestampText = `${createdAt.toLocaleDateString('en-GB')} ${createdAt.toLocaleTimeString('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })}`
      
      page.drawText(timestampText, {
        x: x - 30, // Closer to the image (30px left of image)
        y: y + (scaledHeight / 2), // Vertically centered with image
        size: 10,
        color: rgb(0, 0, 0),
        rotate: degrees(90), // Rotate 90 degrees counterclockwise (vertical text)
      })
      
      // Add caption if available
      if (photo.caption) {
        page.drawText(photo.caption, {
          x: x, // Align with left edge of photo
          y: y - 30, // Below the timestamp
          size: 8,
          color: rgb(0, 0, 0), // Changed from gray to black
        })
      }
      
    } catch (photoError) {
      console.warn(`Error adding photo to PDF:`, photoError)
    }
  }
}

// Fill multiple PDF templates and merge them
export async function fillAndMergePDFTemplates(
  jobData: Record<string, unknown>,
  config: MultiPDFTemplateConfig = COMBINED_PDF_CONFIG
): Promise<Uint8Array> {
  try {
    console.log('🔄 Starting fillAndMergePDFTemplates')
    console.log('📊 Job data photos:', (jobData as {photos?: Array<{url: string}>}).photos?.length || 0)
    if ((jobData as {photos?: Array<{url: string}>}).photos) {
      console.log('📊 Photo URLs:', (jobData as {photos: Array<{url: string}>}).photos.map((p) => p.url))
    }
    const filledPDFs: Uint8Array[] = []
    
    // Fill each PDF template
    for (let i = 0; i < config.templates.length; i++) {
      const templateConfig = config.templates[i]
      console.log('📄 Processing template:', templateConfig.templatePath)
      
      // Use specialized function for photos PDF
      if (templateConfig.templatePath.includes('Batteryphotos')) {
        console.log('📸 Using fillPhotosPDF for photos template')
        const filledPDF = await fillPhotosPDF(jobData, templateConfig)
        filledPDFs.push(filledPDF)
      } else {
        console.log('📝 Using fillPDFTemplate for service sheet')
        const filledPDF = await fillPDFTemplate(jobData, templateConfig)
        filledPDFs.push(filledPDF)
      }
    }
    
    // Create a new PDF document for merging
    const mergedPDF = await PDFDocument.create()
    
    // Add pages from each filled PDF
    for (const pdfBytes of filledPDFs) {
      const pdf = await PDFDocument.load(pdfBytes)
      const pages = await mergedPDF.copyPages(pdf, pdf.getPageIndices())
      pages.forEach(page => mergedPDF.addPage(page))
    }
    
    // Save the merged PDF
    return await mergedPDF.save()
    
  } catch (error) {
    console.error('Error filling and merging PDF templates:', error)
    throw new Error(`Failed to fill and merge PDF templates: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Download combined filled PDFs
export async function downloadCombinedFilledPDF(
  jobData: Record<string, unknown>,
  config: MultiPDFTemplateConfig = COMBINED_PDF_CONFIG
): Promise<void> {
  try {
    const pdfBytes = await fillAndMergePDFTemplates(jobData, config)
    
    // Create blob and download
    const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = config.outputFilename 
      ? generateFilename(jobData, config.outputFilename)
      : `complete-service-report-${jobData.jobNumber || 'report'}.pdf`
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Clean up
    URL.revokeObjectURL(url)
    
  } catch (error) {
    console.error('Error downloading combined PDF:', error)
    throw error
  }
}

// Preview combined filled PDFs
export async function previewCombinedFilledPDF(
  jobData: Record<string, unknown>,
  config: MultiPDFTemplateConfig = COMBINED_PDF_CONFIG
): Promise<void> {
  try {
    const pdfBytes = await fillAndMergePDFTemplates(jobData, config)
    
    // Create blob URL
    const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    
    // Open in new window
    const newWindow = window.open(url, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes')
    
    if (!newWindow) {
      throw new Error('Failed to open preview window. Please allow popups.')
    }
    
    // Clean up URL after window loads
    newWindow.onload = () => {
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    }
    
  } catch (error) {
    console.error('Error previewing combined PDF:', error)
    throw error
  }
}

// Check if PDF has form fields
export async function analyzePDFTemplate(templatePath: string): Promise<{
  hasForm: boolean
  fields: Array<{ name: string; type: string }>
}> {
  try {
    const response = await fetch(templatePath)
    const templateBytes = await response.arrayBuffer()
    const pdfDoc = await PDFDocument.load(templateBytes)
    const form = pdfDoc.getForm()
    const fields = form.getFields()
    
    return {
      hasForm: fields.length > 0,
      fields: fields.map(field => ({
        name: field.getName(),
        type: field.constructor.name
      }))
    }
  } catch (error) {
    console.error('Error analyzing PDF template:', error)
    return { hasForm: false, fields: [] }
  }
}

// Download photos PDF only
export async function downloadPhotosPDF(
  jobData: Record<string, unknown>,
  config: PDFTemplateConfig = PHOTOS_CONFIG
): Promise<void> {
  try {
    const pdfBytes = await fillPhotosPDF(jobData, config)
    
    // Create blob and download
    const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = config.outputFilename 
      ? generateFilename(jobData, config.outputFilename)
      : `photos-${jobData.jobNumber || 'report'}.pdf`
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Clean up
    URL.revokeObjectURL(url)
    
  } catch (error) {
    console.error('Error downloading photos PDF:', error)
    throw error
  }
}

// Preview photos PDF only
export async function previewPhotosPDF(
  jobData: Record<string, unknown>,
  config: PDFTemplateConfig = PHOTOS_CONFIG
): Promise<void> {
  try {
    const pdfBytes = await fillPhotosPDF(jobData, config)
    
    // Create blob URL
    const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    
    // Open in new window
    const newWindow = window.open(url, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes')
    
    if (!newWindow) {
      throw new Error('Failed to open preview window. Please allow popups.')
    }
    
    // Clean up URL after window loads
    newWindow.onload = () => {
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    }
    
  } catch (error) {
    console.error('Error previewing photos PDF:', error)
    throw error
  }
}

// Analyze multiple PDF templates
export async function analyzeMultiplePDFTemplates(
  config: MultiPDFTemplateConfig = COMBINED_PDF_CONFIG
): Promise<Array<{
  templatePath: string
  hasForm: boolean
  fields: Array<{ name: string; type: string }>
}>> {
  const results = []
  
  for (const templateConfig of config.templates) {
    const analysis = await analyzePDFTemplate(templateConfig.templatePath)
    results.push({
      templatePath: templateConfig.templatePath,
      ...analysis
    })
  }
  
  return results
}
