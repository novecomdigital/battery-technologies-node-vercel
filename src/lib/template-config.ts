// Template configuration for job reports and documents
export interface TemplateField {
  key: string
  label: string
  type: 'text' | 'date' | 'number' | 'boolean' | 'address' | 'phone' | 'email'
  required?: boolean
  defaultValue?: string
  format?: string // For date formatting, number formatting, etc.
}

export interface JobTemplate {
  id: string
  name: string
  description: string
  template: string // HTML template with placeholders
  fields: TemplateField[]
  styles?: string // CSS styles for the template
  type?: 'html' | 'pdf' // Template type
  pdfTemplatePath?: string // Path to PDF template file
}

// Default job report template
export const DEFAULT_JOB_TEMPLATE: JobTemplate = {
  id: 'job-report',
  name: 'Job Report',
  description: 'Standard job completion report',
  template: `
    <div class="job-report">
      <div class="header">
        <h1>Job Report</h1>
        <div class="company-info">
          <h2>{{companyName}}</h2>
          <p>{{companyAddress}}</p>
          <p>Phone: {{companyPhone}} | Email: {{companyEmail}}</p>
        </div>
      </div>
      
      <div class="job-details">
        <h3>Job Information</h3>
        <table class="job-table">
          <tr>
            <td><strong>Job Number:</strong></td>
            <td>{{jobNumber}}</td>
            <td><strong>Date:</strong></td>
            <td>{{jobDate}}</td>
          </tr>
          <tr>
            <td><strong>Customer:</strong></td>
            <td>{{customerName}}</td>
            <td><strong>Status:</strong></td>
            <td>{{jobStatus}}</td>
          </tr>
          <tr>
            <td><strong>Service Type:</strong></td>
            <td>{{serviceType}}</td>
            <td><strong>Technician:</strong></td>
            <td>{{technicianName}}</td>
          </tr>
          <tr>
            <td><strong>Location:</strong></td>
            <td colspan="3">{{locationAddress}}</td>
          </tr>
        </table>
      </div>
      
      <div class="equipment-details">
        <h3>Equipment Information</h3>
        <table class="equipment-table">
          <tr>
            <td><strong>Battery Type:</strong></td>
            <td>{{batteryType}}</td>
            <td><strong>Battery Model:</strong></td>
            <td>{{batteryModel}}</td>
          </tr>
          <tr>
            <td><strong>Battery Serial:</strong></td>
            <td>{{batterySerial}}</td>
            <td><strong>Equipment Type:</strong></td>
            <td>{{equipmentType}}</td>
          </tr>
          <tr>
            <td><strong>Equipment Model:</strong></td>
            <td>{{equipmentModel}}</td>
            <td><strong>Equipment Serial:</strong></td>
            <td>{{equipmentSerial}}</td>
          </tr>
        </table>
      </div>
      
      <div class="work-details">
        <h3>Work Performed</h3>
        <div class="work-description">
          <p><strong>Description:</strong></p>
          <p>{{jobDescription}}</p>
        </div>
        
        <div class="work-notes">
          <p><strong>Notes:</strong></p>
          <p>{{jobNotes}}</p>
        </div>
        
        <div class="time-details">
          <table class="time-table">
            <tr>
              <td><strong>Estimated Hours:</strong></td>
              <td>{{estimatedHours}}</td>
              <td><strong>Actual Hours:</strong></td>
              <td>{{actualHours}}</td>
            </tr>
            <tr>
              <td><strong>Start Date:</strong></td>
              <td>{{startDate}}</td>
              <td><strong>End Date:</strong></td>
              <td>{{endDate}}</td>
            </tr>
          </table>
        </div>
      </div>
      
      <div class="signatures">
        <div class="signature-section">
          <p><strong>Technician Signature:</strong></p>
          <div class="signature-line">_________________________</div>
          <p>Date: _______________</p>
        </div>
        
        <div class="signature-section">
          <p><strong>Customer Signature:</strong></p>
          <div class="signature-line">_________________________</div>
          <p>Date: _______________</p>
        </div>
      </div>
    </div>
  `,
  fields: [
    { key: 'companyName', label: 'Company Name', type: 'text', required: true },
    { key: 'companyAddress', label: 'Company Address', type: 'address', required: true },
    { key: 'companyPhone', label: 'Company Phone', type: 'phone' },
    { key: 'companyEmail', label: 'Company Email', type: 'email' },
    { key: 'jobNumber', label: 'Job Number', type: 'text', required: true },
    { key: 'jobDate', label: 'Job Date', type: 'date', required: true, format: 'dd/MM/yyyy' },
    { key: 'customerName', label: 'Customer Name', type: 'text', required: true },
    { key: 'jobStatus', label: 'Job Status', type: 'text', required: true },
    { key: 'serviceType', label: 'Service Type', type: 'text', required: true },
    { key: 'technicianName', label: 'Technician Name', type: 'text', required: true },
    { key: 'locationAddress', label: 'Location Address', type: 'address' },
    { key: 'batteryType', label: 'Battery Type', type: 'text' },
    { key: 'batteryModel', label: 'Battery Model', type: 'text' },
    { key: 'batterySerial', label: 'Battery Serial', type: 'text' },
    { key: 'equipmentType', label: 'Equipment Type', type: 'text' },
    { key: 'equipmentModel', label: 'Equipment Model', type: 'text' },
    { key: 'equipmentSerial', label: 'Equipment Serial', type: 'text' },
    { key: 'jobDescription', label: 'Job Description', type: 'text' },
    { key: 'jobNotes', label: 'Job Notes', type: 'text' },
    { key: 'estimatedHours', label: 'Estimated Hours', type: 'number' },
    { key: 'actualHours', label: 'Actual Hours', type: 'number' },
    { key: 'startDate', label: 'Start Date', type: 'date', format: 'dd/MM/yyyy' },
    { key: 'endDate', label: 'End Date', type: 'date', format: 'dd/MM/yyyy' }
  ],
  styles: `
    .job-report {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      line-height: 1.6;
    }
    
    .header {
      text-align: center;
      border-bottom: 2px solid #333;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    
    .header h1 {
      color: #2c5530;
      margin-bottom: 10px;
    }
    
    .company-info h2 {
      color: #2c5530;
      margin: 10px 0 5px 0;
    }
    
    .company-info p {
      margin: 2px 0;
      color: #666;
    }
    
    .job-details, .equipment-details, .work-details {
      margin-bottom: 30px;
    }
    
    .job-details h3, .equipment-details h3, .work-details h3 {
      color: #2c5530;
      border-bottom: 1px solid #ccc;
      padding-bottom: 5px;
      margin-bottom: 15px;
    }
    
    .job-table, .equipment-table, .time-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 15px;
    }
    
    .job-table td, .equipment-table td, .time-table td {
      padding: 8px 12px;
      border: 1px solid #ddd;
      vertical-align: top;
    }
    
    .job-table td:first-child, .equipment-table td:first-child, .time-table td:first-child {
      background-color: #f5f5f5;
      font-weight: bold;
      width: 25%;
    }
    
    .work-description, .work-notes {
      margin-bottom: 15px;
    }
    
    .work-description p, .work-notes p {
      margin: 5px 0;
    }
    
    .signatures {
      display: flex;
      justify-content: space-between;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #333;
    }
    
    .signature-section {
      width: 45%;
    }
    
    .signature-line {
      height: 40px;
      border-bottom: 1px solid #333;
      margin: 10px 0;
    }
    
    @media print {
      .job-report {
        margin: 0;
        padding: 0;
      }
      
      .signatures {
        page-break-inside: avoid;
      }
    }
  `
}

// Combined PDF Service Sheet Template
export const PDF_SERVICE_SHEET_TEMPLATE: JobTemplate = {
  id: 'pdf-service-sheet',
  name: 'Complete Service Report',
  description: 'Combined service sheet and photos using PDF templates',
  type: 'pdf',
  pdfTemplatePath: '/BatteryServiceSheet.pdf', // This will be handled by the combined config
  template: '', // Not used for PDF templates
  fields: [
    { key: 'jobNumber', label: 'Job Number', type: 'text', required: true },
    { key: 'dueDate', label: 'Job Date', type: 'date', required: true, format: 'dd/MM/yyyy' },
    { key: 'customer.name', label: 'Customer Name', type: 'text', required: true },
    { key: 'serviceType', label: 'Service Type', type: 'text', required: true },
    { key: 'assignedTo.name', label: 'Technician Name', type: 'text', required: true },
    { key: 'status', label: 'Job Status', type: 'text', required: true },
    { key: 'location.name', label: 'Location Name', type: 'text' },
    { key: 'location.address', label: 'Location Address', type: 'address' },
    { key: 'location.city', label: 'Location City', type: 'text' },
    { key: 'location.phone', label: 'Location Phone', type: 'phone' },
    { key: 'customer.phone', label: 'Customer Phone', type: 'phone' },
    { key: 'customer.email', label: 'Customer Email', type: 'email' },
    { key: 'contact.firstName', label: 'Contact First Name', type: 'text' },
    { key: 'contact.lastName', label: 'Contact Last Name', type: 'text' },
    { key: 'contact.title', label: 'Contact Title', type: 'text' },
    { key: 'contact.phone', label: 'Contact Phone', type: 'phone' },
    { key: 'contact.email', label: 'Contact Email', type: 'email' },
    { key: 'batteryType', label: 'Battery Type', type: 'text' },
    { key: 'batteryModel', label: 'Battery Model', type: 'text' },
    { key: 'batterySerial', label: 'Battery Serial', type: 'text' },
    { key: 'equipmentType', label: 'Equipment Type', type: 'text' },
    { key: 'equipmentModel', label: 'Equipment Model', type: 'text' },
    { key: 'equipmentSerial', label: 'Equipment Serial', type: 'text' },
    { key: 'description', label: 'Job Description', type: 'text' },
    { key: 'notes', label: 'Job Notes', type: 'text' },
    { key: 'estimatedHours', label: 'Estimated Hours', type: 'number' },
    { key: 'startDate', label: 'Start Date', type: 'date', format: 'dd/MM/yyyy' },
    { key: 'endDate', label: 'End Date', type: 'date', format: 'dd/MM/yyyy' }
  ]
}

// Template registry
export const TEMPLATE_REGISTRY: JobTemplate[] = [
  DEFAULT_JOB_TEMPLATE,
  PDF_SERVICE_SHEET_TEMPLATE
]

// Get template by ID
export function getTemplate(templateId: string): JobTemplate | undefined {
  return TEMPLATE_REGISTRY.find(template => template.id === templateId)
}

// Get all available templates
export function getAllTemplates(): JobTemplate[] {
  return TEMPLATE_REGISTRY
}

