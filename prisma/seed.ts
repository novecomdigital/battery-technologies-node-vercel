import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create sample Service Providers (companies that refer customers to Battery Technologies)
  const lindeMH = await prisma.serviceProvider.create({
    data: {
      name: 'Linde Material Handling UK',
      email: 'service@linde-mh.co.uk',
      phone: '+44-345-608-5000',
      address: 'Linde House, Basingstoke',
      city: 'Basingstoke',
      state: 'Hampshire',
      zipCode: 'RG24 8PZ',
      country: 'UK'
    }
  })

  const toyotaMH = await prisma.serviceProvider.create({
    data: {
      name: 'Toyota Material Handling',
      email: 'service@toyota-mh.com',
      phone: '+1-555-0456',
      address: '456 Industrial Way',
      city: 'Columbus',
      state: 'IN',
      zipCode: '47201',
      country: 'USA'
    }
  })

  const hysterYale = await prisma.serviceProvider.create({
    data: {
      name: 'Hyster-Yale Group',
      email: 'support@hyster-yale.com',
      phone: '+1-555-0789',
      address: '789 Manufacturing Blvd',
      city: 'Greenville',
      state: 'NC',
      zipCode: '27834',
      country: 'USA'
    }
  })

  // Create sample customers - mix of referred and direct customers
  
  // REFERRED CUSTOMERS (via Linde Material Handling)
  const tescoDistribution = await prisma.customer.create({
    data: {
      name: 'Tesco Distribution Centre',
      email: 'facilities@tesco.co.uk',
      phone: '+44-20-7706-4000',
      address: 'Tesco House, Shire Park',
      city: 'Welwyn Garden City',
      state: 'Hertfordshire',
      zipCode: 'AL7 1GA',
      country: 'UK',
      customerType: 'REFERRED',
      serviceProviderId: lindeMH.id,
      referralNotes: 'Referred by Linde MH - operates 15 Linde electric forklifts requiring battery maintenance'
    }
  })

  const amazonFulfillment = await prisma.customer.create({
    data: {
      name: 'Amazon Fulfillment Centre',
      email: 'facilities@amazon.co.uk',
      phone: '+44-20-3860-0000',
      address: 'Amazon Way',
      city: 'Dunfermline',
      state: 'Fife',
      zipCode: 'KY11 8XT',
      country: 'UK',
      customerType: 'REFERRED',
      serviceProviderId: lindeMH.id,
      referralNotes: 'Referred by Linde MH - fleet of 25 Linde H20-H35 diesel forklifts'
    }
  })

  // DIRECT CUSTOMERS (Battery Technologies' own customers)
  const nhsHospital = await prisma.customer.create({
    data: {
      name: 'NHS Foundation Trust',
      email: 'estates@nhs.uk',
      phone: '+44-20-7946-0000',
      address: 'NHS England',
      city: 'London',
      state: 'England',
      zipCode: 'SW1A 2NS',
      country: 'UK',
      customerType: 'DIRECT',
      referralNotes: 'Direct customer - emergency lighting and UPS battery maintenance across multiple hospital sites'
    }
  })

  const universityCampus = await prisma.customer.create({
    data: {
      name: 'University of Cambridge',
      email: 'estates@cam.ac.uk',
      phone: '+44-1223-334400',
      address: 'The Old Schools, Trinity Lane',
      city: 'Cambridge',
      state: 'Cambridgeshire',
      zipCode: 'CB2 1TN',
      country: 'UK',
      customerType: 'DIRECT',
      referralNotes: 'Direct customer - backup power systems and research equipment batteries'
    }
  })

  // Create sample locations for customers
  
  // Tesco Distribution Centre locations
  const tescoMainWarehouse = await prisma.location.create({
    data: {
      name: 'Main Distribution Warehouse',
      address: 'Tesco House, Shire Park',
      city: 'Welwyn Garden City',
      state: 'Hertfordshire',
      zipCode: 'AL7 1GA',
      country: 'UK',
      phone: '+44-20-7706-4000',
      email: 'warehouse@tesco.co.uk',
      customerId: tescoDistribution.id
    }
  })

  // Amazon Fulfillment Centre locations
  const amazonDunfermline = await prisma.location.create({
    data: {
      name: 'Dunfermline Fulfillment Centre',
      address: 'Amazon Way',
      city: 'Dunfermline',
      state: 'Fife',
      zipCode: 'KY11 8XT',
      country: 'UK',
      phone: '+44-20-3860-0000',
      email: 'fulfillment@amazon.co.uk',
      customerId: amazonFulfillment.id
    }
  })

  // NHS Hospital locations
  const nhsMainHospital = await prisma.location.create({
    data: {
      name: 'Main Hospital Site',
      address: 'NHS Foundation Trust',
      city: 'London',
      state: 'England',
      zipCode: 'SW1A 2NS',
      country: 'UK',
      phone: '+44-20-7946-0000',
      email: 'estates@nhs.uk',
      customerId: nhsHospital.id
    }
  })

  // University locations
  const cambridgeMainCampus = await prisma.location.create({
    data: {
      name: 'Main Campus',
      address: 'The Old Schools, Trinity Lane',
      city: 'Cambridge',
      state: 'Cambridgeshire',
      zipCode: 'CB2 1TN',
      country: 'UK',
      phone: '+44-1223-334400',
      email: 'estates@cam.ac.uk',
      customerId: universityCampus.id
    }
  })

  // Create sample contacts
  
  // Tesco contacts
  const tescoFacilitiesManager = await prisma.contact.create({
    data: {
      firstName: 'James',
      lastName: 'Wilson',
      email: 'james.wilson@tesco.co.uk',
      phone: '+44-20-7706-4001',
      title: 'Facilities Manager',
      department: 'Operations',
      isPrimary: true,
      customerId: tescoDistribution.id
    }
  })

  // Amazon contacts
  const amazonOperationsManager = await prisma.contact.create({
    data: {
      firstName: 'Emma',
      lastName: 'Thompson',
      email: 'emma.thompson@amazon.co.uk',
      phone: '+44-20-3860-0001',
      title: 'Operations Manager',
      department: 'Fulfillment',
      isPrimary: true,
      customerId: amazonFulfillment.id
    }
  })

  // NHS contacts
  const nhsEstatesManager = await prisma.contact.create({
    data: {
      firstName: 'Dr. Michael',
      lastName: 'Brown',
      email: 'michael.brown@nhs.uk',
      phone: '+44-20-7946-0001',
      title: 'Estates Manager',
      department: 'Facilities',
      isPrimary: true,
      customerId: nhsHospital.id
    }
  })

  // University contacts
  const cambridgeEstatesDirector = await prisma.contact.create({
    data: {
      firstName: 'Professor Sarah',
      lastName: 'Davis',
      email: 'sarah.davis@cam.ac.uk',
      phone: '+44-1223-334401',
      title: 'Estates Director',
      department: 'Estates',
      isPrimary: true,
      customerId: universityCampus.id
    }
  })

  // Create sample battery servicing jobs
  
  // REFERRED JOB: Tesco forklift battery maintenance (via Linde MH)
  const tescoForkliftMaintenance = await prisma.job.create({
    data: {
      jobNumber: 'JOB-001',
      description: 'Monthly maintenance check on Linde E12-E20 electric forklift batteries',
      status: 'OPEN',
      estimatedHours: 6.0,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      notes: 'Regular maintenance schedule for 15 Linde electric forklifts - referred by Linde MH',
      batteryType: 'Lead-Acid Forklift Battery',
      batteryModel: 'Linde E12-E20 Battery Pack',
      batterySerial: 'LINDE-E12-2024-001',
      serviceType: 'BATTERY_INSPECTION',
      equipmentType: 'Forklift',
      equipmentModel: 'Linde E12 Electric Forklift',
      equipmentSerial: 'LINDE-E12-2023-015',
      serviceProviderId: lindeMH.id,
      customerId: tescoDistribution.id,
      locationId: tescoMainWarehouse.id,
      contactId: tescoFacilitiesManager.id
    }
  })

  // REFERRED JOB: Amazon forklift battery replacement (via Linde MH)
  const amazonForkliftBatteryReplacement = await prisma.job.create({
    data: {
      jobNumber: 'JOB-002',
      description: 'Replace failed battery in Linde H20-H35 diesel forklift',
      status: 'VISITED',
      estimatedHours: 4.0,
      startDate: new Date(),
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      notes: 'Critical battery replacement - forklift out of service - referred by Linde MH',
      batteryType: 'Lead-Acid Forklift Battery',
      batteryModel: 'Linde H20-H35 Battery Pack',
      batterySerial: 'LINDE-H20-2024-045',
      serviceType: 'SUPPLY_FIT_BATTERY',
      equipmentType: 'Forklift',
      equipmentModel: 'Linde H20-H35 Diesel Forklift',
      equipmentSerial: 'LINDE-H20-2023-025',
      serviceProviderId: lindeMH.id,
      customerId: amazonFulfillment.id,
      locationId: amazonDunfermline.id,
      contactId: amazonOperationsManager.id
    }
  })

  // DIRECT JOB: NHS emergency lighting battery maintenance
  const nhsEmergencyLightingMaintenance = await prisma.job.create({
    data: {
      jobNumber: 'JOB-003',
      description: 'Quarterly maintenance check on emergency lighting battery systems',
      status: 'OPEN',
      estimatedHours: 8.0,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      notes: 'Critical safety system maintenance across hospital site',
      batteryType: 'Emergency Lighting Battery',
      batteryModel: 'ELB-12V-7AH',
      batterySerial: 'ELB-2024-001',
      serviceType: 'BATTERY_INSPECTION',
      equipmentType: 'Emergency Lighting System',
      equipmentModel: 'Emergency Exit Lighting',
      equipmentSerial: 'EL-2023-001',
      customerId: nhsHospital.id,
      locationId: nhsMainHospital.id,
      contactId: nhsEstatesManager.id
    }
  })

  // DIRECT JOB: University UPS battery replacement
  const cambridgeUPSBatteryReplacement = await prisma.job.create({
    data: {
      jobNumber: 'JOB-004',
      description: 'Replace failed UPS battery in research laboratory',
      status: 'COMPLETE',
      estimatedHours: 3.0,
      startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      endDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      notes: 'Critical research equipment backup power restored',
      batteryType: 'UPS Battery',
      batteryModel: 'PowerSafe SBS C12-200',
      batterySerial: 'PS-2024-001',
      serviceType: 'SUPPLY_FIT_BATTERY',
      equipmentType: 'UPS System',
      equipmentModel: 'APC Smart-UPS 3000VA',
      equipmentSerial: 'APC-2023-001',
      customerId: universityCampus.id,
      locationId: cambridgeMainCampus.id,
      contactId: cambridgeEstatesDirector.id
    }
  })

  // Create sample job photos
  
  // Tesco forklift battery photos
  await prisma.jobPhoto.create({
    data: {
      filename: 'tesco-forklift-battery-before.jpg',
      originalName: 'tesco-forklift-battery-before.jpg',
      mimeType: 'image/jpeg',
      size: 1024000,
      url: '/uploads/tesco-forklift-battery-before.jpg',
      caption: 'Linde E12 forklift battery condition before maintenance',
      isPrimary: true,
      jobId: tescoForkliftMaintenance.id
    }
  })

  // Amazon forklift battery photos
  await prisma.jobPhoto.create({
    data: {
      filename: 'amazon-forklift-battery-failed.png',
      originalName: 'amazon-forklift-battery-failed.png',
      mimeType: 'image/png',
      size: 2048000,
      url: '/uploads/amazon-forklift-battery-failed.png',
      caption: 'Failed Linde H20 forklift battery requiring replacement',
      isPrimary: true,
      jobId: amazonForkliftBatteryReplacement.id
    }
  })

  // NHS emergency lighting photos
  await prisma.jobPhoto.create({
    data: {
      filename: 'nhs-emergency-lighting-battery.jpg',
      originalName: 'nhs-emergency-lighting-battery.jpg',
      mimeType: 'image/jpeg',
      size: 1500000,
      url: '/uploads/nhs-emergency-lighting-battery.jpg',
      caption: 'Emergency lighting battery system in hospital corridor',
      isPrimary: true,
      jobId: nhsEmergencyLightingMaintenance.id
    }
  })

  // University UPS photos
  await prisma.jobPhoto.create({
    data: {
      filename: 'cambridge-ups-battery-replacement.jpg',
      originalName: 'cambridge-ups-battery-replacement.jpg',
      mimeType: 'image/jpeg',
      size: 1800000,
      url: '/uploads/cambridge-ups-battery-replacement.jpg',
      caption: 'UPS battery replacement completed in research laboratory',
      isPrimary: true,
      jobId: cambridgeUPSBatteryReplacement.id
    }
  })

  console.log('✅ Database seeded successfully!')
  console.log(`Created ${3} service providers (Linde MH, Toyota MH, Hyster-Yale), ${4} customers (2 referred, 2 direct), ${4} locations, ${4} contacts, ${4} battery jobs, and ${4} photos`)
  console.log('📋 Examples include:')
  console.log('  • REFERRED: Tesco & Amazon forklift battery maintenance (via Linde MH)')
  console.log('  • DIRECT: NHS emergency lighting & Cambridge UPS battery services')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
