// Utility functions for handling UK addresses and geocoding

export interface AddressData {
  address?: string | null
  city?: string | null
  state?: string | null
  zipCode?: string | null
  country?: string | null
}

/**
 * Builds a proper UK address format for geocoding, avoiding numerical zip codes
 * @param addressData - The address components
 * @param includeUK - Whether to append 'UK' to the address (default: true)
 * @returns Formatted address string suitable for geocoding
 */
export function buildUKAddress(addressData: AddressData, includeUK: boolean = true): string {
  const parts = []
  
  // Add address
  if (addressData.address) {
    parts.push(addressData.address)
  }
  
  // Add city
  if (addressData.city) {
    parts.push(addressData.city)
  }
  
  // Add state (county/region)
  if (addressData.state) {
    parts.push(addressData.state)
  }
  
  // Only add zip code if it looks like a proper UK postcode (contains letters)
  // Skip numerical zip codes as they don't work well with UK geocoding
  if (addressData.zipCode && /[A-Za-z]/.test(addressData.zipCode)) {
    parts.push(addressData.zipCode)
  }
  
  // Add UK for better geocoding if requested
  if (includeUK) {
    parts.push('UK')
  }
  
  // If we have no address components at all, return a fallback
  if (parts.length === 0) {
    return includeUK ? 'UK' : ''
  }
  
  return parts.join(', ')
}

/**
 * Checks if a zip code looks like a proper UK postcode
 * @param zipCode - The zip code to check
 * @returns True if it looks like a UK postcode
 */
export function isUKPostcode(zipCode: string | null | undefined): boolean {
  if (!zipCode) return false
  
  // UK postcode pattern: letters and numbers in specific format
  // Examples: SW1A 1AA, M1 1AA, B33 8TH, W1A 0AX, EC1A 1BB
  const ukPostcodePattern = /^[A-Z]{1,2}[0-9R][0-9A-Z]? [0-9][A-Z]{2}$/i
  return ukPostcodePattern.test(zipCode.trim())
}

/**
 * Formats an address for display purposes (without UK suffix)
 * @param addressData - The address components
 * @returns Formatted address string for display
 */
export function formatAddressForDisplay(addressData: AddressData): string {
  return buildUKAddress(addressData, false)
}

/**
 * Creates a geocoding-friendly address string
 * @param addressData - The address components
 * @returns Address string optimized for geocoding APIs
 */
export function createGeocodingAddress(addressData: AddressData): string {
  return buildUKAddress(addressData, true)
}

/**
 * Checks if we have enough address data for reliable geocoding
 * @param addressData - The address components
 * @returns True if we have sufficient data for geocoding
 */
export function hasMinimumAddressData(addressData: AddressData): boolean {
  // We need at least city OR (address + state) for reasonable geocoding
  const hasCity = !!addressData.city
  const hasAddressAndState = !!(addressData.address && addressData.state)
  
  return hasCity || hasAddressAndState
}

/**
 * Gets a geocoding confidence level based on available address data
 * @param addressData - The address components
 * @returns Confidence level: 'high', 'medium', 'low', or 'insufficient'
 */
export function getGeocodingConfidence(addressData: AddressData): 'high' | 'medium' | 'low' | 'insufficient' {
  if (!hasMinimumAddressData(addressData)) {
    return 'insufficient'
  }
  
  const hasAddress = !!addressData.address
  const hasCity = !!addressData.city
  const hasState = !!addressData.state
  const hasValidPostcode = isUKPostcode(addressData.zipCode)
  
  // High confidence: address + city + (state OR postcode)
  if (hasAddress && hasCity && (hasState || hasValidPostcode)) {
    return 'high'
  }
  
  // Medium confidence: address + city OR city + state + postcode
  if ((hasAddress && hasCity) || (hasCity && hasState && hasValidPostcode)) {
    return 'medium'
  }
  
  // Low confidence: just city OR address + state
  return 'low'
}
