import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

// Helper function to parse CSV
function parseCSV(csvContent: string) {
  const lines = csvContent.split('\n')
  const headers = lines[0].split(',').map(h => h.replace(/"/g, ''))
  
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.replace(/"/g, ''))
    const obj: any = {}
    headers.forEach((header, index) => {
      obj[header] = values[index] || ''
    })
    return obj
  }).filter(row => row[headers[0]]) // Remove empty rows
}

async function main() {
  console.log('🌱 Seeding database with real data...')

  // Read CSV files
  const customersData = parseCSV(fs.readFileSync(path.join(process.cwd(), 'data/customers.csv'), 'utf-8'))
  const locationsData = parseCSV(fs.readFileSync(path.join(process.cwd(), 'data/locations.csv'), 'utf-8'))
  const jobsData = parseCSV(fs.readFileSync(path.join(process.cwd(), 'data/Jobs.csv'), 'utf-8'))

  console.log(`📊 Found ${customersData.length} customers, ${locationsData.length} locations, ${jobsData.length} jobs`)

  // Create service providers from the data
  const serviceProviders = new Map()
  
  // Extract unique service providers from customers data
  customersData.forEach(customer => {
    const serviceProviderName = customer['Company Name'] || customer['Name']
    if (serviceProviderName && !serviceProviders.has(serviceProviderName)) {
      serviceProviders.set(serviceProviderName, {
        name: serviceProviderName,
        email: customer['Email'] || `${serviceProviderName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        phone: customer['Phone'] || '',
        address: customer['Address'] || '',
        city: customer['City'] || '',
        state: customer['State'] || '',
        zipCode: customer['Postcode'] || '',
        country: 'UK'
      })
    }
  })

  // Create service providers in database
  const createdServiceProviders = new Map()
  for (const [name, data] of serviceProviders) {
    const serviceProvider = await prisma.serviceProvider.create({
      data
    })
    createdServiceProviders.set(name, serviceProvider)
  }

  console.log(`✅ Created ${createdServiceProviders.size} service providers`)

  // Create customers
  const createdCustomers = new Map()
  for (const customerData of customersData.slice(0, 50)) { // Limit to first 50 for performance
    const serviceProviderName = customerData['Company Name'] || customerData['Name']
    const serviceProvider = createdServiceProviders.get(serviceProviderName)
    
    if (serviceProvider) {
      const customer = await prisma.customer.create({
        data: {
          name: customerData['Name'] || customerData['Company Name'],
          email: customerData['Email'] || null,
          phone: customerData['Phone'] || null,
          address: customerData['Address'] || null,
          city: customerData['City'] || null,
          state: customerData['State'] || null,
          zipCode: customerData['Postcode'] || null,
          country: 'UK',
          customerType: 'REFERRED',
          referralNotes: `Referred by ${serviceProviderName}`,
          serviceProviderId: serviceProvider.id
        }
      })
      createdCustomers.set(customerData['Name'] || customerData['Company Name'], customer)
    }
  }

  console.log(`✅ Created ${createdCustomers.size} customers`)

  // Create locations
  const createdLocations = new Map()
  for (const locationData of locationsData.slice(0, 100)) { // Limit to first 100 for performance
    const customerName = locationData['Company Name']
    const customer = createdCustomers.get(customerName)
    
    if (customer) {
      const location = await prisma.location.create({
        data: {
          name: locationData['Name'] || locationData['Address'] || 'Main Location',
          address: locationData['Address'] || null,
          city: locationData['City'] || null,
          state: locationData['State'] || null,
          zipCode: locationData['Postcode'] || null,
          country: 'UK',
          phone: locationData['Phone'] || null,
          email: locationData['Email'] || null,
          customerId: customer.id
        }
      })
      createdLocations.set(`${customerName}-${location.name}`, location)
    }
  }

  console.log(`✅ Created ${createdLocations.size} locations`)

  // Create contacts for customers
  const createdContacts = new Map()
  for (const [customerName, customer] of createdCustomers) {
    const contact = await prisma.contact.create({
      data: {
        firstName: 'Contact',
        lastName: customerName.split(' ')[0] || 'Person',
        email: customer.email || `${customerName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        phone: customer.phone,
        title: 'Manager',
        department: 'Operations',
        isPrimary: true,
        customerId: customer.id
      }
    })
    createdContacts.set(customer.id, contact)
  }

  console.log(`✅ Created ${createdContacts.size} contacts`)

  // Create jobs
  let jobCount = 0
  for (const jobData of jobsData.slice(0, 200)) { // Limit to first 200 for performance
    const customerName = jobData['Customer']
    const serviceProviderName = jobData['Service Provider']
    const locationName = jobData['Location']
    
    const customer = createdCustomers.get(customerName)
    const serviceProvider = createdServiceProviders.get(serviceProviderName)
    
    if (customer && serviceProvider) {
      // Find location
      let location = null
      if (locationName) {
        location = createdLocations.get(`${customerName}-${locationName}`)
      }
      
      // Get contact
      const contact = createdContacts.get(customer.id)
      
      // Parse job date
      const jobDate = jobData['Job Date'] ? new Date(jobData['Job Date'].split('/').reverse().join('-')) : new Date()
      
      // Determine service type from job description
      const jobDescription = jobData['Job Description'] || ''
      let serviceType = 'MAINTENANCE'
      if (jobDescription.toLowerCase().includes('repair')) serviceType = 'REPAIR'
      else if (jobDescription.toLowerCase().includes('supply') || jobDescription.toLowerCase().includes('fit')) serviceType = 'REPLACEMENT'
      else if (jobDescription.toLowerCase().includes('inspection')) serviceType = 'INSPECTION'
      
      
      // Determine status
      let status = 'PENDING'
      const today = new Date()
      if (jobDate < today) status = 'COMPLETED'
      else if (jobDate.toDateString() === today.toDateString()) status = 'IN_PROGRESS'

      const job = await prisma.job.create({
        data: {
          jobNumber: jobData['Job Number'] || `JOB-${Math.random().toString(36).substr(2, 9)}`,
          description: `${jobDescription} for ${customerName}`,
          status: status as any,
          estimatedHours: Math.floor(Math.random() * 8) + 1, // Random 1-8 hours
          dueDate: jobDate,
          notes: `Job ID: ${jobData['Job Number'] || 'N/A'}`,
          batteryType: 'Lead-Acid Forklift Battery',
          batteryModel: 'Standard Industrial Battery',
          batterySerial: `BT-${jobData['Job Number'] || Math.random().toString(36).substr(2, 9)}`,
          serviceType: serviceType as any,
          equipmentType: 'Forklift',
          equipmentModel: 'Industrial Forklift',
          equipmentSerial: `EQ-${Math.random().toString(36).substr(2, 9)}`,
          serviceProviderId: serviceProvider.id,
          customerId: customer.id,
          locationId: location?.id,
          contactId: contact?.id
        }
      })
      
      jobCount++
    }
  }

  console.log(`✅ Created ${jobCount} jobs`)

  // Create some job photos
  const jobs = await prisma.job.findMany({ take: 20 })
  for (const job of jobs) {
    await prisma.jobPhoto.create({
      data: {
        filename: `job-${job.id}-before.jpg`,
        originalName: `job-${job.id}-before.jpg`,
        mimeType: 'image/jpeg',
        size: Math.floor(Math.random() * 2000000) + 500000, // 500KB - 2.5MB
        url: `/uploads/job-${job.id}-before.jpg`,
        caption: `${job.description} - Before service`,
        isPrimary: true,
        jobId: job.id
      }
    })
  }

  console.log(`✅ Created ${jobs.length} job photos`)

  console.log('🎉 Database seeded successfully with real data!')
  console.log(`📊 Summary:`)
  console.log(`  • ${createdServiceProviders.size} Service Providers`)
  console.log(`  • ${createdCustomers.size} Customers`)
  console.log(`  • ${createdLocations.size} Locations`)
  console.log(`  • ${createdContacts.size} Contacts`)
  console.log(`  • ${jobCount} Jobs`)
  console.log(`  • ${jobs.length} Job Photos`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
