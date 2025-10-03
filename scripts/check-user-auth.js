#!/usr/bin/env node

/**
 * Script to check user authentication status and help debug auth issues
 * Usage: node scripts/check-user-auth.js [clerkId]
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkUserAuth(clerkId) {
  try {
    console.log('🔍 Checking user authentication status...\n')
    
    if (clerkId) {
      // Check specific user
      const user = await prisma.user.findUnique({
        where: { clerkId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          clerkId: true,
          createdAt: true
        }
      })
      
      if (user) {
        console.log('✅ User found in database:')
        console.log(`   ID: ${user.id}`)
        console.log(`   Email: ${user.email}`)
        console.log(`   Name: ${user.name}`)
        console.log(`   Role: ${user.role}`)
        console.log(`   Clerk ID: ${user.clerkId}`)
        console.log(`   Created: ${user.createdAt}`)
      } else {
        console.log('❌ User NOT found in database:')
        console.log(`   Clerk ID: ${clerkId}`)
        console.log('   This user can authenticate with Clerk but cannot access the application.')
      }
    } else {
      // List all users
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          clerkId: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      })
      
      console.log(`📊 Found ${users.length} users in database:\n`)
      
      if (users.length === 0) {
        console.log('   No users found. This means:')
        console.log('   - No one can access the application')
        console.log('   - Users need to be created via Clerk webhook or manually')
        console.log('   - Check if Clerk webhook is properly configured')
      } else {
        users.forEach((user, index) => {
          console.log(`${index + 1}. ${user.name || 'No name'} (${user.email})`)
          console.log(`   Role: ${user.role}`)
          console.log(`   Clerk ID: ${user.clerkId}`)
          console.log(`   Created: ${user.createdAt}`)
          console.log('')
        })
      }
    }
    
    console.log('\n🔧 Authentication Flow:')
    console.log('1. User signs in with Clerk')
    console.log('2. Middleware checks if user exists in database')
    console.log('3. If not found, user is redirected to sign-in with error')
    console.log('4. If found, user can access the application')
    
  } catch (error) {
    console.error('❌ Error checking user auth:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Get command line arguments
const args = process.argv.slice(2)
const clerkId = args[0]

checkUserAuth(clerkId)
