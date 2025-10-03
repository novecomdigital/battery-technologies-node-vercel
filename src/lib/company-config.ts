// Battery Technologies company configuration
export const COMPANY_CONFIG = {
  name: 'Battery Technologies',
  address: {
    street: 'Unit 3, 12 Emery Rd',
    city: 'Brislington',
    state: 'Bristol',
    zipCode: 'BS4 5PF',
    country: 'UK'
  },
  phone: '+44 117 123 4567',
  email: 'info@batterytechnologies.co.uk',
  // Full address string for map routing - simplified for better geocoding
  get fullAddress() {
    return `${this.address.street}, ${this.address.city}, ${this.address.zipCode}, UK`
  },
  // Short address for display
  get shortAddress() {
    return `${this.address.city}, ${this.address.state}`
  }
}
