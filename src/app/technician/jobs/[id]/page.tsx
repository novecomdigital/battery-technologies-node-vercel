import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth-utils'
import TechnicianJobDetail from './TechnicianJobDetail'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function TechnicianJobDetailPage({ params }: PageProps) {
  const { id } = await params
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/sign-in')
  }
  
  if (user.role !== 'TECHNICIAN') {
    redirect('/dashboard')
  }

  return <TechnicianJobDetail jobId={id} user={user} />
}
