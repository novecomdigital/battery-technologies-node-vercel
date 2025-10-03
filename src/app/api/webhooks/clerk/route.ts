import { NextRequest } from 'next/server'

// Force Node.js runtime for Prisma compatibility
export const runtime = 'nodejs';
import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { sendWelcomeEmail } from '@/lib/resend'

type WebhookEvent = {
  type: string
  data: {
    id: string
    email_addresses: Array<{ email_address: string }>
    first_name?: string
    last_name?: string
  }
}

export async function POST(req: NextRequest) {
  // Get the headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400,
    })
  }

  // Get the body
  const payload = await req.text()

  // Create a new Svix instance with your secret.
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '')

  let evt: WebhookEvent

  // Verify the payload with the headers
  try {
    evt = wh.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.err('Error verifying webhook:', err)
    return new Response('Error occured', {
      status: 400,
    })
  }

  // Handle the webhook
  const eventType = evt.type

  if (eventType === 'user.created') {
    const { id, email_addresses, first_name, last_name } = evt.data

    try {
      // Create user in database
      const user = await prisma.user.create({
        data: {
          clerkId: id,
          email: email_addresses[0].email_address,
          name: `${first_name || ''} ${last_name || ''}`.trim() || null,
        },
      })

      // Send welcome email
      if (user.email && user.name) {
        await sendWelcomeEmail(user.email, user.name)
      }

      console.log('User created successfully:', user)
    } catch (error) {
      console.error('Error creating user:', error)
      return new Response('Error creating user', {
        status: 500,
      })
    }
  }

  if (eventType === 'user.updated') {
    const { id, email_addresses, first_name, last_name } = evt.data

    try {
      await prisma.user.update({
        where: { clerkId: id },
        data: {
          email: email_addresses[0].email_address,
          name: `${first_name || ''} ${last_name || ''}`.trim() || null,
        },
      })

      console.log('User updated successfully')
    } catch (error) {
      console.error('Error updating user:', error)
      return new Response('Error updating user', {
        status: 500,
      })
    }
  }

  if (eventType === 'user.deleted') {
    const { id } = evt.data

    try {
      await prisma.user.delete({
        where: { clerkId: id },
      })

      console.log('User deleted successfully')
    } catch (error) {
      console.error('Error deleting user:', error)
      return new Response('Error deleting user', {
        status: 500,
      })
    }
  }

  return new Response('', { status: 200 })
}
