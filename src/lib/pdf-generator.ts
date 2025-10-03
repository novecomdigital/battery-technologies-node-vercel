// PDF generation utilities
// Note: You'll need to install html2pdf.js: npm install html2pdf.js
// and add the types: npm install @types/html2pdf.js

export interface PDFOptions {
  margin?: number | [number, number, number, number]
  filename?: string
  image?: { type: 'jpeg' | 'png' | 'webp'; quality: number }
  html2canvas?: { scale: number; useCORS: boolean }
  jsPDF?: { unit: string; format: string | [number, number]; orientation: 'portrait' | 'landscape' }
}

// Default PDF options
const DEFAULT_PDF_OPTIONS: PDFOptions = {
  margin: 10,
  filename: 'job-report.pdf',
  image: { type: 'jpeg', quality: 0.98 },
  html2canvas: { scale: 2, useCORS: true },
  jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
}

// Generate PDF from HTML element
export async function generatePDFFromElement(
  element: HTMLElement, 
  options: PDFOptions = {}
): Promise<void> {
  try {
    // Dynamic import to avoid SSR issues
    const html2pdf = (await import('html2pdf.js')).default
    
    const mergedOptions = { ...DEFAULT_PDF_OPTIONS, ...options }
    
    await html2pdf()
      .set(mergedOptions)
      .from(element)
      .save()
  } catch (error) {
    console.error('PDF generation failed:', error)
    throw new Error('Failed to generate PDF. Please try again.')
  }
}

// Generate PDF from HTML string
export async function generatePDFFromHTML(
  htmlString: string, 
  options: PDFOptions = {}
): Promise<void> {
  try {
    // Create a temporary container
    const container = document.createElement('div')
    container.innerHTML = htmlString
    container.style.position = 'absolute'
    container.style.left = '-9999px'
    container.style.top = '-9999px'
    document.body.appendChild(container)
    
    await generatePDFFromElement(container, options)
    
    // Clean up
    document.body.removeChild(container)
  } catch (error) {
    console.error('PDF generation failed:', error)
    throw new Error('Failed to generate PDF. Please try again.')
  }
}

// Alternative PDF generation using browser's print functionality
export function printAsPDF(element: HTMLElement): void {
  const printWindow = window.open('', '_blank')
  
  if (!printWindow) {
    alert('Please allow popups to print the document')
    return
  }
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Job Report</title>
      <style>
        @media print {
          @page {
            margin: 0.5in;
            size: A4;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
        }
        ${element.querySelector('style')?.textContent || ''}
      </style>
    </head>
    <body>
      ${element.innerHTML}
    </body>
    </html>
  `
  
  printWindow.document.write(html)
  printWindow.document.close()
  
  // Wait for content to load, then print
  printWindow.onload = () => {
    printWindow.print()
    printWindow.close()
  }
}

// Check if html2pdf is available
export async function isHTML2PDFAvailable(): Promise<boolean> {
  try {
    await import('html2pdf.js')
    return true
  } catch {
    return false
  }
}

// Fallback PDF generation using print
export async function generatePDFWithFallback(
  element: HTMLElement, 
  options: PDFOptions = {}
): Promise<void> {
  const isAvailable = await isHTML2PDFAvailable()
  
  if (isAvailable) {
    await generatePDFFromElement(element, options)
  } else {
    console.warn('html2pdf.js not available, using print fallback')
    printAsPDF(element)
  }
}


