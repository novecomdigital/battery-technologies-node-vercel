import { PrismaClient } from '@prisma/client'
import { getServiceTypeDisplayName, generateJobDescription } from '../src/lib/job-utils'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database with comprehensive real data...')

  // Clear existing data
  await prisma.jobPhoto.deleteMany()
  await prisma.job.deleteMany()
  await prisma.contact.deleteMany()
  await prisma.location.deleteMany()
  await prisma.customer.deleteMany()
  await prisma.serviceProvider.deleteMany()

  // Create service providers based on real data
  const serviceProviders = [
    {
      name: 'Linde Mh Ltd',
      email: 'Richard.pollard@Linde-Mh.co.uk',
      phone: '0845 6085000',
      address: 'North Road, Bridgend Ind Estate',
      city: 'Bridgend',
      state: 'Glamorgan',
      zipCode: 'CF31 3SZ',
      country: 'UK'
    },
    {
      name: 'Ftm Material Handling Ltd',
      email: 'info@ftm-mh.co.uk',
      phone: '0845 6085000',
      address: '7 North Road, Bridgend Industrial Estate',
      city: 'Bridgend',
      state: 'Glamorgan',
      zipCode: 'CF31 3TP',
      country: 'UK'
    },
    {
      name: 'Gnb Uk Ltd',
      email: 'info@gnb-uk.co.uk',
      phone: '0845 6085000',
      address: 'Aspinall Close, Middlebrook',
      city: 'Horwich',
      state: 'Lancashire',
      zipCode: 'BL6 6QQ',
      country: 'UK'
    },
    {
      name: 'Gwent Mechanical Handling Ltd',
      email: 'info@gwent-mh.co.uk',
      phone: '01633 601999',
      address: 'Pontymister Industrial Est',
      city: 'Risca',
      state: 'Newport',
      zipCode: 'NP11 6NP',
      country: 'UK'
    },
    {
      name: 'Toyota Material Handling Uk Ltd',
      email: 'info@toyota-mh.co.uk',
      phone: '01452 500000',
      address: 'Suite A, The Opus, Telford Way, Waterwells Business Park',
      city: 'Gloucester',
      state: 'Gloucestershire',
      zipCode: 'GL2 2AB',
      country: 'UK'
    },
    {
      name: 'Still Material Handling Ltd',
      email: 'info@still-mh.co.uk',
      phone: '0345 6036827',
      address: 'Jacks Way, Hill Barton Business Park',
      city: 'Clyst St Mary',
      state: 'Exeter',
      zipCode: 'EX5 1FG',
      country: 'UK'
    },
    {
      name: 'Jd Plant Services',
      email: 'info@jdplant.co.uk',
      phone: '01752 345678',
      address: 'Unit 10 Ash Court, Lee Mill Industrial Estate',
      city: 'Plymouth',
      state: 'Devon',
      zipCode: 'PL21 9GE',
      country: 'UK'
    },
    {
      name: 'Swissport Fleet Maintenance',
      email: 'info@swissport.co.uk',
      phone: '01279 680000',
      address: 'Unit G Cargo Terminal, Pincey Road',
      city: 'Stansted Airport',
      state: 'Essex',
      zipCode: 'CM24 1QJ',
      country: 'UK'
    }
  ]

  const createdServiceProviders = []
  for (const spData of serviceProviders) {
    const sp = await prisma.serviceProvider.create({ data: spData })
    createdServiceProviders.push(sp)
  }

  console.log(`✅ Created ${createdServiceProviders.length} service providers`)

  // Create customers based on real data - mix of referred and direct
  const customers = [
    // Referred customers (by service providers)
    {
      name: 'Greencore Group',
      email: 'info@greencore.co.uk',
      phone: '0845 6085000',
      address: 'Unit 4, Bristol Distribution Park, Hawkley Drive, Bradley Stoke',
      city: 'Bristol',
      state: 'Gloucestershire',
      zipCode: 'BS32 0BF',
      customerType: 'REFERRED',
      serviceProvider: createdServiceProviders[0] // Linde MH
    },
    {
      name: 'Op Chocolates Ltd',
      email: 'info@opchocolates.co.uk',
      phone: '0845 6085000',
      address: 'High Street, Dowlais',
      city: 'Merthyr Tydfil',
      state: 'Mid Glamorgan',
      zipCode: 'CF48 3TB',
      customerType: 'REFERRED',
      serviceProvider: createdServiceProviders[1] // FTM MH
    },
    {
      name: 'Yodel Delivery Network Limited',
      email: 'info@yodel.co.uk',
      phone: '0845 6085000',
      address: 'Ash Ridge Road',
      city: 'Bradley Stoke',
      state: 'Bristol',
      zipCode: 'BS32 4JQ',
      customerType: 'REFERRED',
      serviceProvider: createdServiceProviders[0] // Linde MH
    },
    {
      name: 'Wincanton Holdings (Hinckley Point)',
      email: 'info@wincanton.co.uk',
      phone: '0845 6085000',
      address: 'Gloucester Business Park, Gold Club Lane',
      city: 'Brockworth',
      state: 'Gloucester',
      zipCode: 'GL3 4AJ',
      customerType: 'REFERRED',
      serviceProvider: createdServiceProviders[0] // Linde MH
    },
    {
      name: 'Aah Pharmaceuticals Limited',
      email: 'info@aah-pharma.co.uk',
      phone: '0845 6085000',
      address: 'Unit 2, St Philips Central, Albert Road',
      city: 'Bristol',
      state: 'Somerset',
      zipCode: 'BS2 0XJ',
      customerType: 'REFERRED',
      serviceProvider: createdServiceProviders[0] // Linde MH
    },
    {
      name: 'Concrete Fabrications Limited',
      email: 'info@concrete-fab.co.uk',
      phone: '0845 6085000',
      address: 'Bowland Stone Plot K, Boscombe Business Park, Severn Road',
      city: 'Hallen',
      state: 'Bristol',
      zipCode: 'BS10 7SR',
      customerType: 'REFERRED',
      serviceProvider: createdServiceProviders[0] // Linde MH
    },
    {
      name: 'St Austell Brewery (Bristol)',
      email: 'info@staustellbrewery.co.uk',
      phone: '0845 6085000',
      address: 'Unit A Avonmouth Way',
      city: 'Avonmouth',
      state: 'Bristol',
      zipCode: 'BS11 9YA',
      customerType: 'REFERRED',
      serviceProvider: createdServiceProviders[0] // Linde MH
    },
    {
      name: 'Asda Stores',
      email: 'info@asda.co.uk',
      phone: '0845 6085000',
      address: 'Various Locations',
      city: 'Bristol',
      state: 'Somerset',
      zipCode: 'BS1 1AA',
      customerType: 'REFERRED',
      serviceProvider: createdServiceProviders[0] // Linde MH
    },
    {
      name: 'Davies Turner & Co Ltd',
      email: 'Johnmcdonald@Daviesturner.co.uk',
      phone: '0845 6085000',
      address: 'Western Freight Terminal, Fifth Way',
      city: 'Bristol',
      state: 'Somerset',
      zipCode: 'BS11 8DT',
      customerType: 'REFERRED',
      serviceProvider: createdServiceProviders[4] // Toyota MH
    },
    {
      name: 'Norco Group Limited',
      email: 'info@norco.co.uk',
      phone: '0845 6085000',
      address: 'Pitmedden Road',
      city: 'Dyce',
      state: 'Aberdeen',
      zipCode: 'AB21 0DT',
      customerType: 'REFERRED',
      serviceProvider: createdServiceProviders[5] // Still MH
    },
    {
      name: 'Smiths Dairies Ltd',
      email: 'info@smithsdairies.co.uk',
      phone: '0845 6085000',
      address: 'Queens Avenue',
      city: 'Macclesfield',
      state: 'Cheshire East',
      zipCode: 'SK10 2BN',
      customerType: 'REFERRED',
      serviceProvider: createdServiceProviders[6] // JD Plant
    },
    {
      name: 'Swissport Fleet Maintenance',
      email: 'info@swissport.co.uk',
      phone: '01279 680000',
      address: 'Unit G Cargo Terminal, Pincey Road',
      city: 'Stansted Airport',
      state: 'Essex',
      zipCode: 'CM24 1QJ',
      customerType: 'REFERRED',
      serviceProvider: createdServiceProviders[7] // Swissport
    },
    // Direct customers (Battery Technologies' own customers)
    {
      name: 'Altegra Integrated Solutions Ltd',
      email: 'info@altegra.co.uk',
      phone: '01460 242400',
      address: 'South West Depot, South Petherton',
      city: 'South Petherton',
      state: 'Somerset',
      zipCode: 'TA13 5JH',
      customerType: 'DIRECT',
      serviceProvider: null
    },
    {
      name: 'Amphora Aromatics Ltd',
      email: 'info@amphora-aromatics.co.uk',
      phone: '0845 6085000',
      address: 'St Ivel Way, Warmley',
      city: 'Warmley',
      state: 'Bristol',
      zipCode: 'BS30 8TY',
      customerType: 'DIRECT',
      serviceProvider: null
    },
    {
      name: 'Barretine',
      email: 'info@barretine.co.uk',
      phone: '0845 6085000',
      address: 'St Ivel Way, Warmley',
      city: 'Warmley',
      state: 'Bristol',
      zipCode: 'BS30 8TY',
      customerType: 'DIRECT',
      serviceProvider: null
    },
    {
      name: 'Capitol Industrial Batteries',
      email: 'info@capitol-batteries.co.uk',
      phone: '0845 6085000',
      address: 'Unit 6 Manor Farm Ind Est, Collum Lane',
      city: 'Weston Super Mare',
      state: 'Somerset',
      zipCode: 'BS22 9JL',
      customerType: 'DIRECT',
      serviceProvider: null
    },
    {
      name: 'City Batteries Limited',
      email: 'info@citybatteries.co.uk',
      phone: '0845 6085000',
      address: 'Albion Yard, Manor Road',
      city: 'Erith',
      state: 'Kent',
      zipCode: 'DA8 2AD',
      customerType: 'DIRECT',
      serviceProvider: null
    },
    {
      name: 'Cl Wheels',
      email: 'info@clwheels.co.uk',
      phone: '0845 6085000',
      address: 'Unit 6 Manor Farm Ind Est, Collum Lane',
      city: 'Weston Super Mare',
      state: 'Somerset',
      zipCode: 'BS22 9JL',
      customerType: 'DIRECT',
      serviceProvider: null
    },
    {
      name: 'Creatapack',
      email: 'info@creatapack.co.uk',
      phone: '0845 6085000',
      address: '1 Ivy Cottages, Coxgrove Hill',
      city: 'Pucklechurch',
      state: 'Bristol',
      zipCode: 'BS16 9NL',
      customerType: 'DIRECT',
      serviceProvider: null
    },
    {
      name: 'Ecobat Ltd (Shrewsbury)',
      email: 'info@ecobat.co.uk',
      phone: '0174321855',
      address: '36a Vanguard Way, Battlefield Enterprise Park',
      city: 'Shrewsbury',
      state: 'Shropshire',
      zipCode: 'SY1 3TG',
      customerType: 'DIRECT',
      serviceProvider: null
    },
    {
      name: 'Fork Most Limited',
      email: 'info@forkmost.co.uk',
      phone: '0845 6085000',
      address: '1 Ivy Cottages, Coxgrove Hill',
      city: 'Pucklechurch',
      state: 'Bristol',
      zipCode: 'BS16 9NL',
      customerType: 'DIRECT',
      serviceProvider: null
    },
    {
      name: 'Forklift Maintenance Services',
      email: 'info@forklift-maintenance.co.uk',
      phone: '0845 6085000',
      address: '1 Ivy Cottages, Coxgrove Hill',
      city: 'Pucklechurch',
      state: 'Bristol',
      zipCode: 'BS16 9NL',
      customerType: 'DIRECT',
      serviceProvider: null
    },
    {
      name: 'Greens Horticulture Ltd',
      email: 'info@greens-horticulture.co.uk',
      phone: '0845 6085000',
      address: 'Aspinall Close, Middlebrook',
      city: 'Horwich',
      state: 'Lancashire',
      zipCode: 'BL6 6QQ',
      customerType: 'DIRECT',
      serviceProvider: null
    },
    {
      name: 'I J Mcgill Transport Ltd',
      email: 'info@ijmcgill.co.uk',
      phone: '0845 6085000',
      address: 'Pontymister Industrial Est',
      city: 'Risca',
      state: 'Newport',
      zipCode: 'NP11 6NP',
      customerType: 'DIRECT',
      serviceProvider: null
    },
    {
      name: 'Industrial Battery Services',
      email: 'info@industrial-battery.co.uk',
      phone: '0845 6085000',
      address: 'Unit 10 Ash Court, Lee Mill Industrial Estate',
      city: 'Plymouth',
      state: 'Devon',
      zipCode: 'PL21 9GE',
      customerType: 'DIRECT',
      serviceProvider: null
    },
    {
      name: 'Lazy Bear Glamping',
      email: 'info@lazybearglamping.co.uk',
      phone: '0845 6085000',
      address: 'Suite A, The Opus, Telford Way, Waterwells Business Park',
      city: 'Gloucester',
      state: 'Gloucestershire',
      zipCode: 'GL2 2AB',
      customerType: 'DIRECT',
      serviceProvider: null
    },
    {
      name: 'Maynards Mechanical Handling Limited',
      email: 'info@maynards.co.uk',
      phone: '0845 6085000',
      address: '51 Wadham Grove, Emersons Green',
      city: 'Bristol',
      state: 'Somerset',
      zipCode: 'BS16 7DX',
      customerType: 'DIRECT',
      serviceProvider: null
    },
    {
      name: 'Mwi Animal Health (Prev Centaur Services Ltd)',
      email: 'info@mwi-animal.co.uk',
      phone: '0845 6085000',
      address: 'Centaur House, Torbay Road, Castle Cary',
      city: 'Castle Cary',
      state: 'Somerset',
      zipCode: 'BA7 7EU',
      customerType: 'DIRECT',
      serviceProvider: null
    },
    {
      name: 'Pegasus',
      email: 'info@pegasus.co.uk',
      phone: '0845 6085000',
      address: 'Quarry Farm, Redhill',
      city: 'Bristol',
      state: 'Somerset',
      zipCode: 'BS24 9AN',
      customerType: 'DIRECT',
      serviceProvider: null
    },
    {
      name: 'Pooler Lmt',
      email: 'info@pooler.co.uk',
      phone: '0845 6085000',
      address: 'Jacks Way, Hill Barton Business Park',
      city: 'Clyst St Mary',
      state: 'Exeter',
      zipCode: 'EX5 1FG',
      customerType: 'DIRECT',
      serviceProvider: null
    },
    {
      name: 'Precision Profiles',
      email: 'info@precision-profiles.co.uk',
      phone: '0845 6085000',
      address: 'Unit 10 Ash Court, Lee Mill Industrial Estate',
      city: 'Plymouth',
      state: 'Devon',
      zipCode: 'PL21 9GE',
      customerType: 'DIRECT',
      serviceProvider: null
    },
    {
      name: 'Prime Forklifts',
      email: 'info@primeforklifts.co.uk',
      phone: '0845 6085000',
      address: 'Unit G Cargo Terminal, Pincey Road',
      city: 'Stansted Airport',
      state: 'Essex',
      zipCode: 'CM24 1QJ',
      customerType: 'DIRECT',
      serviceProvider: null
    },
    {
      name: 'Sds Water Infrastructure Systems',
      email: 'info@sds-water.co.uk',
      phone: '0845 6085000',
      address: 'Suite A, The Opus, Telford Way, Waterwells Business Park',
      city: 'Gloucester',
      state: 'Gloucestershire',
      zipCode: 'GL2 2AB',
      customerType: 'DIRECT',
      serviceProvider: null
    },
    {
      name: 'Shield (Poole)',
      email: 'info@shield-poole.co.uk',
      phone: '0845 6085000',
      address: '31 Banbury Road, Nuffield Ind Est',
      city: 'Poole',
      state: 'Dorset',
      zipCode: 'BH17 0GA',
      customerType: 'DIRECT',
      serviceProvider: null
    },
    {
      name: 'Sibbons (Alresford) Ltd',
      email: 'info@sibbons.co.uk',
      phone: '0845 6085000',
      address: '31 Banbury Road, Nuffield Ind Est',
      city: 'Poole',
      state: 'Dorset',
      zipCode: 'BH17 0GA',
      customerType: 'DIRECT',
      serviceProvider: null
    },
    {
      name: 'Sixpenny Forge Ltd',
      email: 'info@sixpennyforge.co.uk',
      phone: '0845 6085000',
      address: 'Unit 10 Prospect Court, Nunn Close',
      city: 'Uthwaite',
      state: 'Nottingham',
      zipCode: 'NG17 2HW',
      customerType: 'DIRECT',
      serviceProvider: null
    },
    {
      name: 'South West Handling Ltd',
      email: 'info@southwest-handling.co.uk',
      phone: '0845 6085000',
      address: 'Jacks Way, Hill Barton Business Park',
      city: 'Clyst St Mary',
      state: 'Exeter',
      zipCode: 'EX5 1FG',
      customerType: 'DIRECT',
      serviceProvider: null
    },
    {
      name: 'St Battery Services',
      email: 'info@stbattery.co.uk',
      phone: '0845 6085000',
      address: 'Unit 10 Prospect Court, Nunn Close',
      city: 'Uthwaite',
      state: 'Nottingham',
      zipCode: 'NG17 2HW',
      customerType: 'DIRECT',
      serviceProvider: null
    },
    {
      name: 'Stacatruc',
      email: 'info@stacatruc.co.uk',
      phone: '0845 6085000',
      address: 'Unit G Cargo Terminal, Pincey Road',
      city: 'Stansted Airport',
      state: 'Essex',
      zipCode: 'CM24 1QJ',
      customerType: 'DIRECT',
      serviceProvider: null
    },
    {
      name: 'Strawford Forklift Services',
      email: 'Strawfordforkliftservices@Yahoo.com',
      phone: '07786024905',
      address: '2 Abbots Avenue, Hanham',
      city: 'Bristol',
      state: 'Somerset',
      zipCode: 'BS15 3PN',
      customerType: 'DIRECT',
      serviceProvider: null
    },
    {
      name: 'Tab Battery Uk Limited',
      email: 'info@tabbattery.co.uk',
      phone: '0845 6085000',
      address: 'Suite A, The Opus, Telford Way, Waterwells Business Park',
      city: 'Gloucester',
      state: 'Gloucestershire',
      zipCode: 'GL2 2AB',
      customerType: 'DIRECT',
      serviceProvider: null
    },
    {
      name: 'Uk Forklifts & Mechanical Handling Ltd',
      email: 'info@ukforklifts.co.uk',
      phone: '0845 6085000',
      address: 'Unit G Cargo Terminal, Pincey Road',
      city: 'Stansted Airport',
      state: 'Essex',
      zipCode: 'CM24 1QJ',
      customerType: 'DIRECT',
      serviceProvider: null
    }
  ]

  const createdCustomers = []
  for (const customerData of customers) {
    const customer = await prisma.customer.create({
      data: {
        name: customerData.name,
        email: customerData.email,
        phone: customerData.phone,
        address: customerData.address,
        city: customerData.city,
        state: customerData.state,
        zipCode: customerData.zipCode,
        country: 'UK',
        customerType: customerData.customerType as any,
        referralNotes: customerData.serviceProvider ? `Referred by ${customerData.serviceProvider.name}` : null,
        serviceProviderId: customerData.serviceProvider?.id || null
      }
    })
    createdCustomers.push(customer)
  }

  console.log(`✅ Created ${createdCustomers.length} customers (${customers.filter(c => c.customerType === 'REFERRED').length} referred, ${customers.filter(c => c.customerType === 'DIRECT').length} direct)`)

  // Create locations for customers
  const createdLocations = []
  for (const customer of createdCustomers) {
    const location = await prisma.location.create({
      data: {
        name: 'Main Location',
        address: customer.address || '',
        city: customer.city || '',
        state: customer.state || '',
        zipCode: customer.zipCode || '',
        country: 'UK',
        phone: customer.phone,
        email: customer.email,
        customerId: customer.id
      }
    })
    createdLocations.push(location)
  }

  console.log(`✅ Created ${createdLocations.length} locations`)

  // Create contacts for customers
  const createdContacts = []
  for (const customer of createdCustomers) {
    const contact = await prisma.contact.create({
      data: {
        firstName: 'Contact',
        lastName: customer.name.split(' ')[0] || 'Person',
        email: customer.email,
        phone: customer.phone,
        title: 'Manager',
        department: 'Operations',
        isPrimary: true,
        customerId: customer.id
      }
    })
    createdContacts.push(contact)
  }

  console.log(`✅ Created ${createdContacts.length} contacts`)


  const createdJobs = []
  for (let i = 0; i < 50; i++) {
    const customer = createdCustomers[Math.floor(Math.random() * createdCustomers.length)]
    const location = createdLocations.find(l => l.customerId === customer.id)
    const contact = createdContacts.find(c => c.customerId === customer.id)
    
    const statuses = ['OPEN', 'VISITED', 'COMPLETE', 'NEEDS_QUOTE', 'ON_HOLD']
    const serviceTypes = [
      'BATTERY_INSPECTION', 
      'CHARGER_INSPECTION', 
      'BATTERY_CHARGER_INSPECTION',
      'SUPPLY_FIT_BATTERY',
      'SUPPLY_DELIVER_CHARGER',
      'SUPPLY_FIT_CELLS',
      'CHARGER_RENTAL',
      'BATTERY_WATER_TOPPING',
      'BATTERY_REPAIR',
      'BATTERY_RENTAL',
      'CHARGER_REPAIR',
      'PARTS_ORDERED',
      'SITE_SURVEY',
      'DELIVERY',
      'COLLECTION',
      'OTHER'
    ]
    
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const serviceType = serviceTypes[Math.floor(Math.random() * serviceTypes.length)]
    
    // Create realistic due dates
    const today = new Date()
    const dueDate = new Date(today.getTime() + (Math.random() * 30 - 15) * 24 * 60 * 60 * 1000) // ±15 days from today
    
    const job = await prisma.job.create({
      data: {
        jobNumber: String(510000 + i + 1),
        description: generateJobDescription(serviceType, customer.name),
        status: status as any,
        estimatedHours: Math.floor(Math.random() * 8) + 1,
        actualHours: status === 'COMPLETE' ? Math.floor(Math.random() * 8) + 1 : null,
        dueDate: dueDate,
        startDate: status === 'VISITED' || status === 'COMPLETE' ? new Date(today.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000) : null,
        endDate: status === 'COMPLETE' ? new Date(today.getTime() - Math.random() * 3 * 24 * 60 * 60 * 1000) : null,
        notes: `Job for ${customer.name} - ${customer.customerType === 'REFERRED' ? 'Referred customer' : 'Direct customer'}`,
        batteryType: 'Lead-Acid Forklift Battery',
        batteryModel: 'Standard Industrial Battery',
        batterySerial: `BT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        serviceType: serviceType as any,
        equipmentType: 'Forklift',
        equipmentModel: 'Industrial Forklift',
        equipmentSerial: `EQ-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        serviceProviderId: customer.serviceProviderId,
        customerId: customer.id,
        locationId: location?.id,
        contactId: contact?.id
      }
    })
    createdJobs.push(job)
  }

  console.log(`✅ Created ${createdJobs.length} jobs`)

  // Create job photos
  for (const job of createdJobs.slice(0, 30)) { // Photos for first 30 jobs
    await prisma.jobPhoto.create({
      data: {
        filename: `job-${job.id}-before.jpg`,
        originalName: `job-${job.id}-before.jpg`,
        mimeType: 'image/jpeg',
        size: Math.floor(Math.random() * 2000000) + 500000,
        url: `/uploads/job-${job.id}-before.jpg`,
        caption: `${job.description} - Before service`,
        isPrimary: true,
        jobId: job.id
      }
    })
  }

  console.log(`✅ Created 30 job photos`)

  console.log('🎉 Database seeded successfully with comprehensive real data!')
  console.log(`📊 Summary:`)
  console.log(`  • ${createdServiceProviders.length} Service Providers`)
  console.log(`  • ${createdCustomers.length} Customers (${customers.filter(c => c.customerType === 'REFERRED').length} referred, ${customers.filter(c => c.customerType === 'DIRECT').length} direct)`)
  console.log(`  • ${createdLocations.length} Locations`)
  console.log(`  • ${createdContacts.length} Contacts`)
  console.log(`  • ${createdJobs.length} Jobs`)
  console.log(`  • 30 Job Photos`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
