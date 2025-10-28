'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Menu,
  X,
  Home,
  Users,
  School,
  Settings,
  Shield,
  BarChart3,
  Bell,
  LogOut,
  User,
  BookOpen,
  DollarSign,
  Package
} from 'lucide-react'
import { UserRole } from '@prisma/client'

interface DashboardLayoutProps {
  children: React.ReactNode
  user: any
}

export default function DashboardLayout({ children, user }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('token')
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('licenseKey')
      localStorage.removeItem('offlineToken')
      router.push('/')
    }
  }

  const getNavigationItems = () => {
    const baseItems = [
      { name: 'Dashboard', href: '/dashboard', icon: Home, current: true }
    ]

    switch (user?.role) {
      case UserRole.ADMIN:
        return [
          ...baseItems,
          { name: 'Schools', href: '/dashboard/schools', icon: School, current: false },
          { name: 'Users', href: '/dashboard/users', icon: Users, current: false },
          { name: 'Licenses', href: '/dashboard/licenses', icon: Shield, current: false },
          { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3, current: false },
          { name: 'Settings', href: '/dashboard/settings', icon: Settings, current: false }
        ]
      case UserRole.TEACHER:
        return [
          ...baseItems,
          { name: 'Classes', href: '/dashboard/classes', icon: BookOpen, current: false },
          { name: 'Students', href: '/dashboard/students', icon: Users, current: false },
          { name: 'Assignments', href: '/dashboard/assignments', icon: BookOpen, current: false }
        ]
      case UserRole.STUDENT:
        return [
          ...baseItems,
          { name: 'Assignments', href: '/dashboard/assignments', icon: BookOpen, current: false },
          { name: 'Grades', href: '/dashboard/grades', icon: BarChart3, current: false },
          { name: 'Schedule', href: '/dashboard/schedule', icon: BookOpen, current: false }
        ]
      case UserRole.PARENT:
        return [
          ...baseItems,
          { name: 'Children', href: '/dashboard/children', icon: Users, current: false },
          { name: 'Progress', href: '/dashboard/progress', icon: BarChart3, current: false },
          { name: 'Communications', href: '/dashboard/messages', icon: Bell, current: false }
        ]
      case UserRole.BURSAR:
        return [
          ...baseItems,
          { name: 'Fees', href: '/dashboard/fees', icon: DollarSign, current: false },
          { name: 'Payments', href: '/dashboard/payments', icon: DollarSign, current: false },
          { name: 'Reports', href: '/dashboard/reports', icon: BarChart3, current: false }
        ]
      case UserRole.STORE_MANAGER:
        return [
          ...baseItems,
          { name: 'Inventory', href: '/dashboard/inventory', icon: Package, current: false },
          { name: 'Orders', href: '/dashboard/orders', icon: Package, current: false },
          { name: 'Suppliers', href: '/dashboard/suppliers', icon: Users, current: false }
        ]
      default:
        return baseItems
    }
  }

  const navigation = getNavigationItems()

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-40 lg:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          <SidebarContent navigation={navigation} user={user} onLogout={handleLogout} />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col bg-white border-r border-gray-200">
          <SidebarContent navigation={navigation} user={user} onLogout={handleLogout} />
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top navigation */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 pl-1 pr-4 sm:pl-3 sm:pr-6 lg:pr-8">
          <div className="flex h-16 items-center justify-between">
            <button
              type="button"
              className="border-r border-gray-200 px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex flex-1 justify-between">
              <div className="flex flex-1">
                <h1 className="text-xl font-semibold text-gray-900 ml-4 lg:ml-0 flex items-center">
                  Welcome back, {user?.firstName}
                </h1>
              </div>
              <div className="ml-4 flex items-center md:ml-6">
                <button
                  type="button"
                  className="rounded-full bg-white p-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  <Bell className="h-6 w-6" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

function SidebarContent({ navigation, user, onLogout }: any) {
  return (
    <>
      <div className="flex flex-1 flex-col pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">SmartEdu360</p>
              <p className="text-xs text-gray-500">{user?.role}</p>
            </div>
          </div>
        </div>
        <nav className="mt-5 flex-1 space-y-1 px-2">
          {navigation.map((item: any) => {
            const Icon = item.icon
            return (
              <a
                key={item.name}
                href={item.href}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  item.current
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {item.name}
              </a>
            )
          })}
        </nav>
      </div>
      <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
        <div className="flex items-center">
          <div>
            <User className="h-8 w-8 rounded-full text-gray-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">
              {user?.firstName} {user?.lastName}
            </p>
            <button
              onClick={onLogout}
              className="flex items-center text-xs text-gray-500 hover:text-gray-700"
            >
              <LogOut className="mr-1 h-3 w-3" />
              Sign out
            </button>
          </div>
        </div>
      </div>
    </>
  )
}