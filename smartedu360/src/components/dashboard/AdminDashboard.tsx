'use client'

import { useState, useEffect } from 'react'
import {
  Users,
  School,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Activity
} from 'lucide-react'
import LicenseManager from '@/components/admin/LicenseManager'
import StatsCard from '@/components/ui/StatsCard'

interface AdminDashboardProps {
  user: any
}

export default function AdminDashboard({ user }: AdminDashboardProps) {
  const [stats, setStats] = useState<any>(null)
  const [licenseStats, setLicenseStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('token')
      
      // Load license statistics
      const licenseResponse = await fetch('/api/license/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (licenseResponse.ok) {
        const licenseData = await licenseResponse.json()
        setLicenseStats(licenseData.data)
      }

      // Mock additional stats (in real app, these would come from APIs)
      setStats({
        totalUsers: 1250,
        activeUsers: 1180,
        totalSchools: 15,
        activeBranches: 42,
        systemHealth: 98.5,
        uptime: '99.9%'
      })
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: Activity },
    { id: 'licenses', name: 'License Management', icon: Shield },
    { id: 'users', name: 'User Management', icon: Users },
    { id: 'schools', name: 'School Management', icon: School }
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {tab.name}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title="Total Users"
              value={stats?.totalUsers || 0}
              icon={Users}
              trend={{ value: 12, isPositive: true }}
              color="blue"
            />
            <StatsCard
              title="Active Schools"
              value={stats?.totalSchools || 0}
              icon={School}
              trend={{ value: 2, isPositive: true }}
              color="green"
            />
            <StatsCard
              title="Active Licenses"
              value={licenseStats?.active || 0}
              icon={Shield}
              trend={{ value: 5, isPositive: true }}
              color="purple"
            />
            <StatsCard
              title="System Health"
              value={`${stats?.systemHealth || 0}%`}
              icon={Activity}
              trend={{ value: 0.5, isPositive: true }}
              color="emerald"
            />
          </div>

          {/* License Overview */}
          {licenseStats && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-medium">License Status</h3>
                </div>
                <div className="card-content">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        <span>Active Licenses</span>
                      </div>
                      <span className="font-semibold">{licenseStats.active}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Clock className="h-5 w-5 text-red-500 mr-2" />
                        <span>Expired Licenses</span>
                      </div>
                      <span className="font-semibold">{licenseStats.expired}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <AlertTriangle className="h-5 w-5 text-orange-500 mr-2" />
                        <span>Expiring Soon</span>
                      </div>
                      <span className="font-semibold">{licenseStats.expiringSoon}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-medium">System Status</h3>
                </div>
                <div className="card-content">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>System Uptime</span>
                      <span className="font-semibold text-green-600">{stats?.uptime}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Active Users</span>
                      <span className="font-semibold">{stats?.activeUsers}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Active Branches</span>
                      <span className="font-semibold">{stats?.activeBranches}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'licenses' && (
        <LicenseManager />
      )}

      {activeTab === 'users' && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium">User Management</h3>
            <p className="text-sm text-gray-600">Manage system users and their permissions</p>
          </div>
          <div className="card-content">
            <p className="text-gray-500">User management interface coming soon...</p>
          </div>
        </div>
      )}

      {activeTab === 'schools' && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium">School Management</h3>
            <p className="text-sm text-gray-600">Manage schools and branches</p>
          </div>
          <div className="card-content">
            <p className="text-gray-500">School management interface coming soon...</p>
          </div>
        </div>
      )}
    </div>
  )
}