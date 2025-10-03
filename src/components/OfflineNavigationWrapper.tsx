'use client'

import { usePathname } from 'next/navigation'
import OfflineNavigationRestrictive from './OfflineNavigationRestrictive'

export default function OfflineNavigationWrapper() {
  const pathname = usePathname()
  
  return <OfflineNavigationRestrictive currentRoute={pathname} className="mx-4 mb-4" />
}
