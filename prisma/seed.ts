import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Clean existing data (optional - comment out if you want to preserve data)
  // await prisma.post.deleteMany()
  // await prisma.tag.deleteMany()
  // await prisma.user.deleteMany()

  // Create example users
  const user1 = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      email: 'alice@example.com',
      name: 'Alice Johnson',
      emailVerified: new Date(),
    },
  })

  const user2 = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      email: 'bob@example.com',
      name: 'Bob Smith',
      emailVerified: new Date(),
    },
  })

  console.log('✅ Created users:', { user1: user1.email, user2: user2.email })

  // Create example tags
  const tag1 = await prisma.tag.upsert({
    where: { slug: 'technology' },
    update: {},
    create: {
      name: 'Technology',
      slug: 'technology',
    },
  })

  const tag2 = await prisma.tag.upsert({
    where: { slug: 'tutorial' },
    update: {},
    create: {
      name: 'Tutorial',
      slug: 'tutorial',
    },
  })

  console.log('✅ Created tags:', { tag1: tag1.name, tag2: tag2.name })

  // Create example posts
  const post1 = await prisma.post.upsert({
    where: { slug: 'getting-started' },
    update: {},
    create: {
      title: 'Getting Started with Next.js',
      slug: 'getting-started',
      content:
        'This is a comprehensive guide to getting started with Next.js...',
      description: 'Learn the basics of Next.js development',
      published: true,
      publishedAt: new Date(),
      authorId: user1.id,
      tags: {
        connect: [{ id: tag1.id }, { id: tag2.id }],
      },
    },
  })

  const post2 = await prisma.post.create({
    data: {
      title: 'Advanced TypeScript Patterns',
      slug: 'advanced-typescript',
      content: 'Exploring advanced TypeScript patterns and techniques...',
      description: 'Deep dive into TypeScript best practices',
      published: true,
      publishedAt: new Date(),
      authorId: user2.id,
      tags: {
        connect: [{ id: tag1.id }],
      },
    },
  })

  const post3 = await prisma.post.create({
    data: {
      title: 'Building with Tailwind CSS',
      slug: 'tailwind-css-guide',
      content: 'A complete guide to building modern UIs with Tailwind CSS...',
      description: 'Master Tailwind CSS utilities and patterns',
      published: false, // Draft post
      authorId: user1.id,
      tags: {
        connect: [{ id: tag2.id }],
      },
    },
  })

  console.log('✅ Created posts:', {
    post1: post1.title,
    post2: post2.title,
    post3: post3.title,
  })

  // Add your custom seed data here
  // Example:
  // await prisma.yourModel.createMany({
  //   data: [
  //     { field: 'value1' },
  //     { field: 'value2' },
  //   ],
  // })

  console.log('🎉 Database seeding completed successfully!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Error during seeding:', e)
    await prisma.$disconnect()
    process.exit(1)
  })

