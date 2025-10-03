import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database with simplified real data...')

  // Clear existing data
  await prisma.jobPhoto.deleteMany()
  await prisma.job.deleteMany()
  await prisma.contact.deleteMany()
  await prisma.location.deleteMany()
  await prisma.customer.deleteMany()
  await prisma.serviceProvider.deleteMany()

  // Create service providers based on the real data
  const lindeMH = await prisma.serviceProvider.create({
    data: {
      name: 'Linde Mh Ltd',
      email: 'Richard.pollard@Linde-Mh.co.uk',
      phone: '0845 6085000',
      address: 'North Road, Bridgend Ind Estate',
      city: 'Bridgend',
      state: 'Glamorgan',
      zipCode: 'CF31 3SZ',
      country: 'UK'
    }
  })

  const ftmMH = await prisma.serviceProvider.create({
    data: {
      name: 'Ftm Material Handling Ltd',
      email: 'info@ftm-mh.co.uk',
      phone: '0845 6085000',
      address: '7 North Road, Bridgend Industrial Estate',
      city: 'Bridgend',
      state: 'Glamorgan',
      zipCode: 'CF31 3TP',
      country: 'UK'
    }
  })

  const gnbUK = await prisma.serviceProvider.create({
    data: {
      name: 'Gnb Uk Ltd',
      email: 'info@gnb-uk.co.uk',
      phone: '0845 6085000',
      address: 'Aspinall Close, Middlebrook',
      city: 'Horwich',
      state: 'Lancashire',
      zipCode: 'BL6 6QQ',
      country: 'UK'
    }
  })

  const gwentMH = await prisma.serviceProvider.create({
    data: {
      name: 'Gwent Mechanical Handling Ltd',
      email: 'info@gwent-mh.co.uk',
      phone: '01633 601999',
      address: 'Pontymister Industrial Est',
      city: 'Risca',
      state: 'Newport',
      zipCode: 'NP11 6NP',
      country: 'UK'
    }
  })

  console.log('✅ Created 4 service providers')

  // Create customers based on real data
  const customers = [
    {
      name: 'Greencore Group',
      email: 'info@greencore.co.uk',
      phone: '0845 6085000',
      address: 'Unit 4, Bristol Distribution Park, Hawkley Drive, Bradley Stoke',
      city: 'Bristol',
      state: 'Gloucestershire',
      zipCode: 'BS32 0BF',
      serviceProvider: lindeMH
    },
    {
      name: 'Op Chocolates Ltd',
      email: 'info@opchocolates.co.uk',
      phone: '0845 6085000',
      address: 'High Street, Dowlais',
      city: 'Merthyr Tydfil',
      state: 'Mid Glamorgan',
      zipCode: 'CF48 3TB',
      serviceProvider: ftmMH
    },
    {
      name: 'Yodel Delivery Network Limited',
      email: 'info@yodel.co.uk',
      phone: '0845 6085000',
      address: 'Ash Ridge Road',
      city: 'Bradley Stoke',
      state: 'Bristol',
      zipCode: 'BS32 4JQ',
      serviceProvider: lindeMH
    },
    {
      name: 'Wincanton Holdings (Hinckley Point)',
      email: 'info@wincanton.co.uk',
      phone: '0845 6085000',
      address: 'Gloucester Business Park, Gold Club Lane',
      city: 'Brockworth',
      state: 'Gloucester',
      zipCode: 'GL3 4AJ',
      serviceProvider: lindeMH
    },
    {
      name: 'Aah Pharmaceuticals Limited',
      email: 'info@aah-pharma.co.uk',
      phone: '0845 6085000',
      address: 'Unit 2, St Philips Central, Albert Road',
      city: 'Bristol',
      state: 'Somerset',
      zipCode: 'BS2 0XJ',
      serviceProvider: lindeMH
    },
    {
      name: 'Concrete Fabrications Limited',
      email: 'info@concrete-fab.co.uk',
      phone: '0845 6085000',
      address: 'Bowland Stone Plot K, Boscombe Business Park, Severn Road',
      city: 'Hallen',
      state: 'Bristol',
      zipCode: 'BS10 7SR',
      serviceProvider: lindeMH
    },
    {
      name: 'St Austell Brewery (Bristol)',
      email: 'info@staustellbrewery.co.uk',
      phone: '0845 6085000',
      address: 'Unit A Avonmouth Way',
      city: 'Avonmouth',
      state: 'Bristol',
      zipCode: 'BS11 9YA',
      serviceProvider: lindeMH
    },
    {
      name: 'Asda Stores',
      email: 'info@asda.co.uk',
      phone: '0845 6085000',
      address: 'Various Locations',
      city: 'Bristol',
      state: 'Somerset',
      zipCode: 'BS1 1AA',
      serviceProvider: lindeMH
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
        customerType: 'REFERRED',
        referralNotes: `Referred by ${customerData.serviceProvider.name}`,
        serviceProviderId: customerData.serviceProvider.id
      }
    })
    createdCustomers.push(customer)
  }

  console.log(`✅ Created ${createdCustomers.length} customers`)

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

  // Create jobs based on real data
  const jobs = [
    {
      title: 'Charger Inspection',
      description: 'Inspection of forklift charger system',
      status: 'PENDING',
      dueDate: new Date('2025-09-08'),
      customer: createdCustomers[0], // Greencore Group
      location: createdLocations[0],
      contact: createdContacts[0],
      serviceProvider: lindeMH
    },
    {
      title: 'Battery Inspection',
      description: 'Inspection of forklift battery system',
      status: 'PENDING',
      dueDate: new Date('2025-09-09'),
      customer: createdCustomers[1], // Op Chocolates Ltd
      location: createdLocations[1],
      contact: createdContacts[1],
      serviceProvider: ftmMH
    },
    {
      title: 'Supply & Fit Battery',
      description: 'Supply and installation of new forklift battery',
      status: 'PENDING',
      dueDate: new Date('2025-09-09'),
      customer: createdCustomers[2], // Yodel Delivery Network
      location: createdLocations[2],
      contact: createdContacts[2],
      serviceProvider: lindeMH
    },
    {
      title: 'Battery Water Topping',
      description: 'Top up battery water levels',
      status: 'IN_PROGRESS',
      dueDate: new Date('2025-09-04'),
      customer: createdCustomers[3], // Wincanton Holdings
      location: createdLocations[3],
      contact: createdContacts[3],
      serviceProvider: lindeMH
    },
    {
      title: 'Supply & Fit Cell/s',
      description: 'Supply and fit new battery cells',
      status: 'PENDING',
      dueDate: new Date('2025-09-04'),
      customer: createdCustomers[4], // Aah Pharmaceuticals
      location: createdLocations[4],
      contact: createdContacts[4],
      serviceProvider: lindeMH
    },
    {
      title: 'Charger Repair',
      description: 'Repair of forklift charger system',
      status: 'PENDING',
      dueDate: new Date('2025-09-04'),
      customer: createdCustomers[5], // Concrete Fabrications
      location: createdLocations[5],
      contact: createdContacts[5],
      serviceProvider: lindeMH
    },
    {
      title: 'Battery Inspection',
      description: 'Inspection of forklift battery system',
      status: 'PENDING',
      dueDate: new Date('2025-09-03'),
      customer: createdCustomers[6], // St Austell Brewery
      location: createdLocations[6],
      contact: createdContacts[6],
      serviceProvider: lindeMH
    },
    {
      title: 'Supply & Fit Battery',
      description: 'Supply and installation of new forklift battery',
      status: 'PENDING',
      dueDate: new Date('2025-09-08'),
      customer: createdCustomers[7], // Asda Stores
      location: createdLocations[7],
      contact: createdContacts[7],
      serviceProvider: lindeMH
    }
  ]

  const createdJobs = []
  for (const jobData of jobs) {
    const job = await prisma.job.create({
      data: {
        jobNumber: `JOB-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        description: jobData.description,
        status: jobData.status as any,
        estimatedHours: Math.floor(Math.random() * 8) + 1,
        dueDate: jobData.dueDate,
        notes: `Job for ${jobData.customer.name}`,
        batteryType: 'Lead-Acid Forklift Battery',
        batteryModel: 'Standard Industrial Battery',
        batterySerial: `BT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        serviceType: 'BATTERY_INSPECTION',
        equipmentType: 'Forklift',
        equipmentModel: 'Industrial Forklift',
        equipmentSerial: `EQ-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        serviceProviderId: jobData.serviceProvider.id,
        customerId: jobData.customer.id,
        locationId: jobData.location.id,
        contactId: jobData.contact.id
      }
    })
    createdJobs.push(job)
  }

  console.log(`✅ Created ${createdJobs.length} jobs`)

  // Create job photos
  for (const job of createdJobs) {
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

  console.log(`✅ Created ${createdJobs.length} job photos`)

  console.log('🎉 Database seeded successfully with real data!')
  console.log(`📊 Summary:`)
  console.log(`  • 4 Service Providers (Linde MH, FTM MH, GNB UK, Gwent MH)`)
  console.log(`  • ${createdCustomers.length} Customers`)
  console.log(`  • ${createdLocations.length} Locations`)
  console.log(`  • ${createdContacts.length} Contacts`)
  console.log(`  • ${createdJobs.length} Jobs`)
  console.log(`  • ${createdJobs.length} Job Photos`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
