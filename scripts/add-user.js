#!/usr/bin/env node

/**
 * Script to manually add a user to the database
 * Usage: node scripts/add-user.js <email> <name> <clerkId> [role]
 * Example: node scripts/add-user.js john@example.com "John Doe" user_2abc123 ADMIN
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function addUser(email, name, clerkId, role = 'TECHNICIAN') {
  try {
    console.log('👤 Adding user to database...\n')
    
    // Validate inputs
    if (!email || !name || !clerkId) {
      console.error('❌ Missing required parameters:')
      console.error('   Usage: node scripts/add-user.js <email> <name> <clerkId> [role]')
      console.error('   Example: node scripts/add-user.js john@example.com "John Doe" user_2abc123 ADMIN')
      return
    }
    
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { clerkId }
        ]
      }
    })
    
    if (existingUser) {
      console.log('❌ User already exists:')
      console.log(`   Email: ${existingUser.email}`)
      console.log(`   Clerk ID: ${existingUser.clerkId}`)
      console.log(`   Role: ${existingUser.role}`)
      return
    }
    
    // Validate role
    const validRoles = ['ADMIN', 'MANAGER', 'TECHNICIAN', 'VIEWER']
    if (!validRoles.includes(role)) {
      console.error(`❌ Invalid role: ${role}`)
      console.error(`   Valid roles: ${validRoles.join(', ')}`)
      return
    }
    
    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        clerkId,
        role
      }
    })
    
    console.log('✅ User created successfully:')
    console.log(`   ID: ${user.id}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Name: ${user.name}`)
    console.log(`   Role: ${user.role}`)
    console.log(`   Clerk ID: ${user.clerkId}`)
    console.log(`   Created: ${user.createdAt}`)
    
    console.log('\n🎉 User can now access the application!')
    
  } catch (error) {
    console.error('❌ Error adding user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Get command line arguments
const args = process.argv.slice(2)
const [email, name, clerkId, role] = args

addUser(email, name, clerkId, role)
