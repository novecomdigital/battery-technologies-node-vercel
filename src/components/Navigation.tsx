'use client'

import { useState, useEffect, useRef } from 'react'
import { useUser, UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  HomeIcon,
  BriefcaseIcon,
  UsersIcon,
  UserGroupIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import {
  HomeIcon as HomeIconSolid,
  BriefcaseIcon as BriefcaseIconSolid,
  UsersIcon as UsersIconSolid,
  UserGroupIcon as UserGroupIconSolid
} from '@heroicons/react/24/solid'

interface UserData {
  id: string
  email: string
  name: string | null
  role: string
}

export default function Navigation() {
  const { user, isLoaded } = useUser()
  const pathname = usePathname()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const hasFetched = useRef(false)

  useEffect(() => {
    if (isLoaded && user && !hasFetched.current) {
      hasFetched.current = true
      fetchUserData()
    } else if (isLoaded && !user) {
      setLoading(false)
      hasFetched.current = false
    }
  }, [isLoaded, user])

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const data = await response.json()
        setUserData(data)
      } else if (response.status === 404) {
        // User not found in database - this is expected for new users
        console.log('User not found in database - this is normal for new users')
        setUserData(null)
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Don't show navigation on sign-in/sign-up pages
  if (pathname?.includes('/sign-')) {
    return null
  }

  if (!isLoaded || loading) {
    return (
      <nav className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-200">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="animate-pulse bg-gray-300 h-8 w-32 rounded"></div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="animate-pulse bg-gray-300 h-8 w-8 rounded-full"></div>
            </div>
          </div>
        </div>
      </nav>
    )
  }

  if (!user) {
    return null
  }

  const getNavigationItems = () => {
    const role = userData?.role

    if (role === 'TECHNICIAN') {
      return [
        {
          name: 'Dashboard',
          href: '/technician',
          icon: HomeIcon,
          iconSolid: HomeIconSolid,
          current: pathname === '/technician'
        }
      ]
    }

    // Admin, Manager, Viewer navigation
    return [
      {
        name: 'Dashboard',
        href: '/dashboard',
        icon: HomeIcon,
        iconSolid: HomeIconSolid,
        current: pathname === '/dashboard'
      },
      {
        name: 'Jobs',
        href: '/jobs',
        icon: BriefcaseIcon,
        iconSolid: BriefcaseIconSolid,
        current: pathname?.startsWith('/jobs')
      },
      {
        name: 'Customers',
        href: '/customers',
        icon: UserGroupIcon,
        iconSolid: UserGroupIconSolid,
        current: pathname?.startsWith('/customers')
      },
      {
        name: 'Service Providers',
        href: '/service-providers',
        icon: UsersIcon,
        iconSolid: UsersIconSolid,
        current: pathname === '/service-providers'
      }
    ]
  }

  const navigationItems = getNavigationItems()

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-200">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href={userData?.role === 'TECHNICIAN' ? '/technician' : '/dashboard'}>
                <span className="text-xl font-bold text-green-600">
                  Battery Technologies
                </span>
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigationItems.map((item) => {
                const Icon = item.current ? item.iconSolid : item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200 ${
                      item.current
                        ? 'border-green-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2 text-green-600" />
                    {item.name}
                  </Link>
                )
              })}
              
              {/* Desktop sync button */}
              <button
                onClick={() => {
                  console.log('🔄 Desktop sync triggered')
                  window.dispatchEvent(new CustomEvent('trigger-sync'))
                }}
                className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors duration-200"
                title="Sync offline changes"
              >
                <ArrowPathIcon className="h-4 w-4 mr-2 text-green-600" />
                Sync
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {userData && (
              <div className="hidden sm:flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {userData.name || userData.email}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  userData.role === 'TECHNICIAN'
                    ? 'bg-blue-100 text-blue-800'
                    : userData.role === 'ADMIN'
                    ? 'bg-green-100 text-green-800'
                    : userData.role === 'MANAGER'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {userData.role}
                </span>
              </div>
            )}
            <UserButton 
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8"
                }
              }}
            />
            
            {/* Mobile menu button */}
            <button
              type="button"
              className="sm:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden">
            <div className="pt-2 pb-3 space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.current ? item.iconSolid : item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors duration-200 ${
                      item.current
                        ? 'bg-green-50 border-green-500 text-green-700'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div className="flex items-center">
                      <Icon className="h-5 w-5 mr-3 text-green-600" />
                      {item.name}
                    </div>
                  </Link>
                )
              })}
              
              {/* Mobile sync button */}
              <button
                onClick={() => {
                  console.log('🔄 Mobile sync triggered')
                  window.dispatchEvent(new CustomEvent('trigger-sync'))
                  setMobileMenuOpen(false)
                }}
                className="block w-full text-left pl-3 pr-4 py-2 border-l-4 border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors duration-200"
              >
                <div className="flex items-center">
                  <ArrowPathIcon className="h-5 w-5 mr-3 text-green-600" />
                  Sync Now
                </div>
              </button>
              
              {/* Mobile user info */}
              {userData && (
                <div className="pt-4 pb-3 border-t border-gray-200">
                  <div className="flex items-center px-4">
                    <div className="flex-shrink-0">
                      <UserButton 
                        afterSignOutUrl="/"
                        appearance={{
                          elements: {
                            avatarBox: "h-10 w-10"
                          }
                        }}
                      />
                    </div>
                    <div className="ml-3">
                      <div className="text-base font-medium text-gray-800">
                        {userData.name || userData.email}
                      </div>
                      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        userData.role === 'TECHNICIAN'
                          ? 'bg-blue-100 text-blue-800'
                          : userData.role === 'ADMIN'
                          ? 'bg-green-100 text-green-800'
                          : userData.role === 'MANAGER'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {userData.role}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
