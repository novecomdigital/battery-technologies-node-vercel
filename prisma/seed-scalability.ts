import { PrismaClient, JobStatus, ServiceType } from '@prisma/client'

const prisma = new PrismaClient()

// Sample data arrays for generating realistic records
const serviceProviders = [
  { name: 'Linde Material Handling UK', email: 'service@linde-mh.co.uk', phone: '+44-345-608-5000', city: 'Basingstoke', state: 'Hampshire' },
  { name: 'Toyota Material Handling', email: 'service@toyota-mh.com', phone: '+1-555-0456', city: 'Columbus', state: 'IN' },
  { name: 'Hyster-Yale Group', email: 'support@hyster-yale.com', phone: '+1-555-0789', city: 'Greenville', state: 'NC' },
  { name: 'Crown Equipment Corp', email: 'service@crown.com', phone: '+1-419-629-2311', city: 'New Bremen', state: 'OH' },
  { name: 'Yale Materials Handling', email: 'support@yale.com', phone: '+44-1256-393939', city: 'Basingstoke', state: 'Hampshire' }
]

const companyNames = [
  'Tesco Distribution Centre', 'Amazon Fulfillment Centre', 'NHS Foundation Trust', 'University of Cambridge',
  'Sainsbury\'s Logistics', 'Asda Distribution Hub', 'Morrisons Warehouse', 'John Lewis Partnership',
  'Marks & Spencer Distribution', 'Next Retail Logistics', 'IKEA Distribution Centre', 'Argos Fulfillment',
  'B&Q Distribution Hub', 'Homebase Logistics', 'Screwfix Distribution', 'Wickes Trade Centre',
  'Royal Mail Sorting Office', 'DHL Express Hub', 'UPS Distribution Centre', 'FedEx Ground Facility',
  'DPD Local Depot', 'Hermes ParcelShop', 'Yodel Distribution Centre', 'TNT Express Hub',
  'British Airways Cargo', 'Virgin Atlantic Cargo', 'EasyJet Maintenance Base', 'Ryanair Ground Services',
  'Rolls-Royce Manufacturing', 'Jaguar Land Rover Plant', 'BMW Manufacturing UK', 'Ford Motor Company',
  'Nissan Motor Manufacturing', 'Honda of the UK Manufacturing', 'Toyota Motor Manufacturing',
  'Unilever Manufacturing', 'Procter & Gamble UK', 'Johnson & Johnson', 'GlaxoSmithKline',
  'AstraZeneca Pharmaceuticals', 'Pfizer Manufacturing UK', 'Novartis Pharmaceuticals',
  'Coca-Cola Enterprises', 'PepsiCo UK', 'Nestlé UK', 'Cadbury Mondelez',
  'British Steel', 'Tata Steel UK', 'ArcelorMittal', 'Liberty Steel Group',
  'Shell UK', 'BP Plc', 'ExxonMobil UK', 'Total Energies UK',
  'BAE Systems', 'Airbus UK', 'Thales UK', 'Leonardo UK'
]

const firstNames = [
  'James', 'Emma', 'Michael', 'Sarah', 'David', 'Lisa', 'Robert', 'Karen', 'William', 'Helen',
  'Richard', 'Amanda', 'Thomas', 'Michelle', 'Christopher', 'Jennifer', 'Daniel', 'Rebecca', 'Matthew', 'Laura',
  'Anthony', 'Sharon', 'Mark', 'Kimberly', 'Donald', 'Donna', 'Steven', 'Carol', 'Paul', 'Ruth',
  'Andrew', 'Sandra', 'Joshua', 'Maria', 'Kenneth', 'Nancy', 'Kevin', 'Betty', 'Brian', 'Dorothy',
  'George', 'Patricia', 'Timothy', 'Deborah', 'Ronald', 'Linda', 'Jason', 'Barbara', 'Edward', 'Elizabeth'
]

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
  'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts'
]

const cities = [
  'London', 'Birmingham', 'Manchester', 'Leeds', 'Liverpool', 'Newcastle', 'Sheffield', 'Bristol',
  'Nottingham', 'Leicester', 'Coventry', 'Bradford', 'Stoke-on-Trent', 'Wolverhampton', 'Plymouth',
  'Derby', 'Southampton', 'Salford', 'Aberdeen', 'Westminster', 'Portsmouth', 'York', 'Peterborough',
  'Dundee', 'Lancaster', 'Oxford', 'Newport', 'Preston', 'St Albans', 'Norwich', 'Chester',
  'Cambridge', 'Salisbury', 'Exeter', 'Gloucester', 'Lisburn', 'Chichester', 'Winchester', 'Lichfield',
  'Perth', 'Elgin', 'Bangor', 'Ripon', 'Truro', 'Ely', 'Wells', 'Armagh', 'St Davids'
]

const serviceTypes: ServiceType[] = [
  'BATTERY_INSPECTION', 'CHARGER_INSPECTION', 'BATTERY_CHARGER_INSPECTION',
  'SUPPLY_FIT_BATTERY', 'SUPPLY_DELIVER_CHARGER', 'SUPPLY_FIT_CELLS',
  'CHARGER_RENTAL', 'BATTERY_WATER_TOPPING', 'BATTERY_REPAIR',
  'BATTERY_RENTAL', 'CHARGER_REPAIR', 'PARTS_ORDERED',
  'SITE_SURVEY', 'DELIVERY', 'COLLECTION', 'OTHER'
]

const jobStatuses: JobStatus[] = ['OPEN', 'VISITED', 'COMPLETE', 'NEEDS_QUOTE', 'ON_HOLD', 'CANCELLED']

const batteryTypes = [
  'Lead-Acid Forklift Battery', 'Lithium-Ion Forklift Battery', 'AGM Deep Cycle Battery',
  'Gel Cell Battery', 'Emergency Lighting Battery', 'UPS Battery', 'Solar Battery',
  'Marine Battery', 'Traction Battery', 'Stationary Battery', 'Nickel-Cadmium Battery'
]

const equipmentTypes = [
  'Forklift', 'Reach Truck', 'Pallet Jack', 'Order Picker', 'Tow Tractor',
  'UPS System', 'Emergency Lighting System', 'Fire Alarm System', 'Security System',
  'Telecommunications Equipment', 'Medical Equipment', 'Industrial Equipment'
]

// Technician users (Mike Broom and Wesley Broom)
const technicianNames = [
  { firstName: 'Mike', lastName: 'Broom', email: 'mike@batterytech.com' },
  { firstName: 'Wesley', lastName: 'Broom', email: 'wesley@batterytech.com' }
]

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

function getRandomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

function generateJobNumber(index: number): string {
  return (510000 + index + 1).toString()
}

function generateJobDescription(serviceType: ServiceType, customerName: string): string {
  const serviceTypeDisplay = serviceType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
  return `${serviceTypeDisplay} for ${customerName}`
}

async function main() {
  console.log('🌱 Starting scalability seed with ~500 job records...')

  // Clean existing data
  console.log('🧹 Cleaning existing data...')
  await prisma.jobPhoto.deleteMany({})
  await prisma.job.deleteMany({})
  await prisma.contact.deleteMany({})
  await prisma.location.deleteMany({})
  await prisma.customer.deleteMany({})
  await prisma.serviceProvider.deleteMany({})
  await prisma.user.deleteMany({})

  // Create technician users
  console.log('👨‍🔧 Creating technician users...')
  const technicians = []
  for (let i = 0; i < technicianNames.length; i++) {
    const tech = technicianNames[i]
    const technician = await prisma.user.create({
      data: {
        name: `${tech.firstName} ${tech.lastName}`,
        email: tech.email,
        clerkId: `seed_technician_${i + 1}`,
        role: 'TECHNICIAN'
      }
    })
    technicians.push(technician)
  }

  // Create service providers
  console.log('🏢 Creating service providers...')
  const createdServiceProviders = []
  for (let i = 0; i < serviceProviders.length; i++) {
    const sp = serviceProviders[i]
    const serviceProvider = await prisma.serviceProvider.create({
      data: {
        name: sp.name,
        email: sp.email,
        phone: sp.phone,
        address: `${i + 1}00 Business Park`,
        city: sp.city,
        state: sp.state,
        zipCode: `${10000 + i}`,
        country: 'UK'
      }
    })
    createdServiceProviders.push(serviceProvider)
  }

  // Create customers (mix of referred and direct)
  console.log('🏭 Creating customers...')
  const createdCustomers = []
  for (let i = 0; i < companyNames.length; i++) {
    const companyName = companyNames[i]
    const isReferred = Math.random() > 0.6 // 40% referred customers
    const serviceProvider = isReferred ? getRandomElement(createdServiceProviders) : null
    
    const customer = await prisma.customer.create({
      data: {
        name: companyName,
        email: `contact@${companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
        phone: `+44-20-${7000 + i}-${1000 + i}`,
        address: `${i + 1} Industrial Estate`,
        city: getRandomElement(cities),
        state: 'England',
        zipCode: `${20000 + i}`,
        country: 'UK',
        customerType: isReferred ? 'REFERRED' : 'DIRECT',
        serviceProviderId: serviceProvider?.id,
        referralNotes: isReferred ? `Referred by ${serviceProvider?.name}` : null
      }
    })
    createdCustomers.push(customer)
  }

  // Create locations for customers (1-3 locations per customer)
  console.log('📍 Creating locations...')
  const createdLocations = []
  for (const customer of createdCustomers) {
    const locationCount = Math.floor(Math.random() * 3) + 1 // 1-3 locations
    
    for (let i = 0; i < locationCount; i++) {
      const location = await prisma.location.create({
        data: {
          name: i === 0 ? 'Main Site' : `Site ${i + 1}`,
          address: `${customer.address} - Building ${i + 1}`,
          city: customer.city || 'Unknown',
          state: customer.state || 'Unknown',
          zipCode: customer.zipCode || 'Unknown',
          country: customer.country || 'Unknown',
          phone: customer.phone,
          email: `site${i + 1}@${customer.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
          customerId: customer.id
        }
      })
      createdLocations.push(location)
    }
  }

  // Create contacts for customers (1-2 contacts per customer)
  console.log('👥 Creating contacts...')
  const createdContacts = []
  for (const customer of createdCustomers) {
    const contactCount = Math.floor(Math.random() * 2) + 1 // 1-2 contacts
    
    for (let i = 0; i < contactCount; i++) {
      const firstName = getRandomElement(firstNames)
      const lastName = getRandomElement(lastNames)
      
      const contact = await prisma.contact.create({
        data: {
          firstName,
          lastName,
          email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${customer.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
          phone: `${customer.phone}-${i + 1}`,
          title: i === 0 ? 'Facilities Manager' : 'Operations Coordinator',
          department: i === 0 ? 'Facilities' : 'Operations',
          isPrimary: i === 0,
          customerId: customer.id
        }
      })
      createdContacts.push(contact)
    }
  }

  // Create jobs (~500 records)
  console.log('💼 Creating jobs (targeting ~500 records)...')
  const jobsPerCustomer = Math.ceil(500 / createdCustomers.length)
  let jobCount = 0
  
  for (let customerIndex = 0; customerIndex < createdCustomers.length && jobCount < 500; customerIndex++) {
    const customer = createdCustomers[customerIndex]
    const customerLocations = createdLocations.filter(loc => loc.customerId === customer.id)
    const customerContacts = createdContacts.filter(contact => contact.customerId === customer.id)
    
    const jobsForThisCustomer = Math.min(jobsPerCustomer, 500 - jobCount)
    
    for (let jobIndex = 0; jobIndex < jobsForThisCustomer; jobIndex++) {
      const serviceType = getRandomElement(serviceTypes)
      const status = getRandomElement(jobStatuses)
      const location = getRandomElement(customerLocations)
      const contact = getRandomElement(customerContacts)
      const assignedTechnician = Math.random() > 0.3 ? getRandomElement(technicians) : null // 70% assigned
      
      // Generate realistic dates based on status
      let dueDate: Date | null = null
      let startDate: Date | null = null
      let endDate: Date | null = null
      
      const now = new Date()
      const pastDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) // 90 days ago
      const futureDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000) // 90 days ahead
      
      switch (status) {
        case 'COMPLETE':
          startDate = getRandomDate(pastDate, now)
          endDate = new Date(startDate.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000) // Within 7 days of start
          dueDate = new Date(startDate.getTime() - Math.random() * 14 * 24 * 60 * 60 * 1000) // Due before start
          break
        case 'VISITED':
          startDate = getRandomDate(pastDate, now)
          dueDate = new Date(startDate.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000)
          break
        case 'OPEN':
        case 'NEEDS_QUOTE':
        case 'ON_HOLD':
          dueDate = getRandomDate(now, futureDate)
          break
        case 'CANCELLED':
          dueDate = getRandomDate(pastDate, futureDate)
          break
      }
      
      const job = await prisma.job.create({
        data: {
          jobNumber: generateJobNumber(jobCount),
          description: generateJobDescription(serviceType, customer.name),
          status,
          serviceType,
          estimatedHours: Math.floor(Math.random() * 8) + 1, // 1-8 hours
          actualHours: status === 'COMPLETE' ? Math.floor(Math.random() * 10) + 1 : null,
          dueDate,
          startDate,
          endDate,
          notes: `${serviceType.replace(/_/g, ' ').toLowerCase()} service for ${customer.name}`,
          batteryType: getRandomElement(batteryTypes),
          batteryModel: `${getRandomElement(['Model A', 'Model B', 'Model C'])}-${Math.floor(Math.random() * 1000)}`,
          batterySerial: `BAT-${new Date().getFullYear()}-${String(jobCount + 1).padStart(3, '0')}`,
          equipmentType: getRandomElement(equipmentTypes),
          equipmentModel: `${getRandomElement(['Series X', 'Series Y', 'Series Z'])}-${Math.floor(Math.random() * 100)}`,
          equipmentSerial: `EQ-${new Date().getFullYear()}-${String(jobCount + 1).padStart(3, '0')}`,
          serviceProviderId: customer.serviceProviderId,
          customerId: customer.id,
          locationId: location.id,
          contactId: contact.id,
          assignedToId: assignedTechnician?.id
        }
      })
      
      jobCount++
      
      // Add photos for some jobs (30% chance)
      if (Math.random() < 0.3) {
        await prisma.jobPhoto.create({
          data: {
            filename: `job-${job.jobNumber}-photo.jpg`,
            originalName: `job-${job.jobNumber}-photo.jpg`,
            mimeType: 'image/jpeg',
            size: Math.floor(Math.random() * 2000000) + 500000, // 500KB - 2.5MB
            url: `/uploads/job-${job.jobNumber}-photo.jpg`,
            caption: `${serviceType.replace(/_/g, ' ').toLowerCase()} documentation`,
            isPrimary: true,
            jobId: job.id
          }
        })
      }
    }
  }

  console.log('✅ Scalability seed completed successfully!')
  console.log(`📊 Created:`)
  console.log(`   • ${technicians.length} technician users`)
  console.log(`   • ${createdServiceProviders.length} service providers`)
  console.log(`   • ${createdCustomers.length} customers`)
  console.log(`   • ${createdLocations.length} locations`)
  console.log(`   • ${createdContacts.length} contacts`)
  console.log(`   • ${jobCount} jobs`)
  console.log(`   • ~${Math.floor(jobCount * 0.3)} job photos`)
  console.log('')
  console.log('🎯 Database is ready for scalability testing!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
