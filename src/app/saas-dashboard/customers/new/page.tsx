import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import SaasCustomerForm from '@/components/forms/SaasCustomerForm'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default async function NewSaasCustomerPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  const handleSubmit = async (data: {
    name: string
    email: string
    phone: string
    address: string
    city: string
    state: string
    zipCode: string
    country: string
    plan: 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE'
  }) => {
    'use server'
    
    try {
      const response = await fetch('/api/saas-customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        // Redirect to customers list
        redirect('/saas-dashboard/customers')
      } else {
        console.error('Failed to create SaaS customer')
      }
    } catch (error) {
      console.error('Error creating SaaS customer:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/saas-dashboard/customers"
                className="text-gray-600 hover:text-gray-900"
              >
                ← Back to Customers
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">
                Add New SaaS Customer
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="text-gray-600 hover:text-gray-900"
              >
                User Dashboard
              </Link>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </nav>
      
      <main className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Add New SaaS Customer
            </h2>
            <p className="text-gray-600">
              Create a new company that will subscribe to your service
            </p>
          </div>

          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <SaasCustomerForm onSubmit={handleSubmit} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
