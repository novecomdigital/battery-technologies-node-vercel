import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth-utils'
import TechnicianDashboard from './TechnicianDashboard'

export default async function TechnicianPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/sign-in')
  }
  
  if (user.role !== 'TECHNICIAN') {
    redirect('/dashboard') // Redirect non-technicians to main dashboard
  }

  return <TechnicianDashboard user={user} />
}
