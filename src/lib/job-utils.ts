/**
 * Utility functions for job-related operations
 */

/**
 * Converts a service type enum value to a readable display name
 * @param serviceType - The service type enum value (e.g., 'BATTERY_INSPECTION')
 * @returns A formatted display name (e.g., 'Battery Inspection')
 */
export function getServiceTypeDisplayName(serviceType: string): string {
  return serviceType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .replace(/\//g, '/')
}


/**
 * Generates a job title based on service type and customer name
 * @param serviceType - The service type enum value
 * @param customerName - The name of the customer
 * @returns A formatted job title
 */
export function generateJobTitle(serviceType: string, customerName: string): string {
  const displayServiceType = getServiceTypeDisplayName(serviceType)
  return `${displayServiceType} - ${customerName}`
}

/**
 * Generates a job description based on service type and customer name
 * @param serviceType - The service type enum value
 * @param customerName - The name of the customer
 * @returns A formatted job description
 */
export function generateJobDescription(serviceType: string, customerName: string): string {
  const displayServiceType = getServiceTypeDisplayName(serviceType)
  return `${displayServiceType} for ${customerName}`
}
