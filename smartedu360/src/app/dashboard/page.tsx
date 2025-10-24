'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { UserRole } from '@prisma/client'
import AdminDashboard from '@/components/dashboard/AdminDashboard'
import TeacherDashboard from '@/components/dashboard/TeacherDashboard'
import StudentDashboard from '@/components/dashboard/StudentDashboard'
import ParentDashboard from '@/components/dashboard/ParentDashboard'
import BursarDashboard from '@/components/dashboard/BursarDashboard'
import StoreManagerDashboard from '@/components/dashboard/StoreManagerDashboard'

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/')
        return
      }

      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.data)
      } else {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        router.push('/')
      }
    } catch (error) {
      console.error('Auth check error:', error)
      router.push('/')
    } finally {
      setIsLoading(false)
    }
  }

  const renderDashboard = () => {
    if (!user) return null

    switch (user.role) {
      case UserRole.ADMIN:
        return <AdminDashboard user={user} />
      case UserRole.TEACHER:
        return <TeacherDashboard user={user} />
      case UserRole.STUDENT:
        return <StudentDashboard user={user} />
      case UserRole.PARENT:
        return <ParentDashboard user={user} />
      case UserRole.BURSAR:
        return <BursarDashboard user={user} />
      case UserRole.STORE_MANAGER:
        return <StoreManagerDashboard user={user} />
      default:
        return <div>Unknown user role</div>
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <DashboardLayout user={user}>
      {renderDashboard()}
    </DashboardLayout>
  )
}