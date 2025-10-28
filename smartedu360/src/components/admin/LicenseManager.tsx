'use client'

import { useState, useEffect } from 'react'
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Trash2
} from 'lucide-react'

export default function LicenseManager() {
  const [licenses, setLicenses] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    loadLicenses()
  }, [])

  const loadLicenses = async () => {
    try {
      // Mock data - in real app, this would come from API
      setLicenses([
        {
          id: '1',
          licenseKey: 'EDU360-DEMO-2024-ABC123-XYZ789',
          school: 'Springfield Elementary',
          branch: 'Main Campus',
          status: 'ACTIVE',
          expiresAt: '2024-12-31',
          currentUsers: 45,
          maxUsers: 100,
          deviceName: 'School Server 01',
          lastSync: '2024-01-15T10:30:00Z',
          isOffline: false
        },
        {
          id: '2',
          licenseKey: 'EDU360-DEMO-2024-DEF456-ABC123',
          school: 'Riverside High School',
          branch: 'North Campus',
          status: 'EXPIRED',
          expiresAt: '2024-01-10',
          currentUsers: 0,
          maxUsers: 200,
          deviceName: 'School Server 02',
          lastSync: '2024-01-10T15:45:00Z',
          isOffline: true
        },
        {
          id: '3',
          licenseKey: 'EDU360-DEMO-2024-GHI789-DEF456',
          school: 'Oakwood Academy',
          branch: 'Main Building',
          status: 'ACTIVE',
          expiresAt: '2024-02-15',
          currentUsers: 78,
          maxUsers: 150,
          deviceName: 'Academy Server',
          lastSync: '2024-01-15T09:15:00Z',
          isOffline: false
        }
      ])
    } catch (error) {
      console.error('Failed to load licenses:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'EXPIRED':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'REVOKED':
        return <XCircle className="h-4 w-4 text-gray-500" />
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium'
    switch (status) {
      case 'ACTIVE':
        return `${baseClasses} bg-green-100 text-green-800`
      case 'EXPIRED':
        return `${baseClasses} bg-red-100 text-red-800`
      case 'REVOKED':
        return `${baseClasses} bg-gray-100 text-gray-800`
      default:
        return `${baseClasses} bg-yellow-100 text-yellow-800`
    }
  }

  const getDaysUntilExpiry = (expiryDate: string) => {
    const expiry = new Date(expiryDate)
    const now = new Date()
    const diffTime = expiry.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const filteredLicenses = licenses.filter(license => {
    const matchesSearch = license.licenseKey.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         license.school.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         license.branch.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterStatus === 'all' || license.status === filterStatus
    
    return matchesSearch && matchesFilter
  })

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">License Management</h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage and monitor all system licenses
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create License
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search licenses..."
            className="input pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="input w-full sm:w-auto"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="EXPIRED">Expired</option>
          <option value="REVOKED">Revoked</option>
          <option value="PENDING">Pending</option>
        </select>
      </div>

      {/* License Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  License Key
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  School / Branch
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expires
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Device
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLicenses.map((license) => {
                const daysUntilExpiry = getDaysUntilExpiry(license.expiresAt)
                const isExpiringSoon = daysUntilExpiry <= 30 && daysUntilExpiry > 0
                
                return (
                  <tr key={license.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Shield className="h-4 w-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900 font-mono">
                            {license.licenseKey}
                          </div>
                          {license.isOffline && (
                            <div className="text-xs text-orange-600 flex items-center mt-1">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Offline Mode
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{license.school}</div>
                      <div className="text-sm text-gray-500">{license.branch}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getStatusBadge(license.status)}>
                        {getStatusIcon(license.status)}
                        <span className="ml-1">{license.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {license.currentUsers} / {license.maxUsers}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${(license.currentUsers / license.maxUsers) * 100}%`
                          }}
                        ></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{license.expiresAt}</div>
                      {isExpiringSoon && (
                        <div className="text-xs text-orange-600 flex items-center mt-1">
                          <Clock className="h-3 w-3 mr-1" />
                          {daysUntilExpiry} days left
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{license.deviceName}</div>
                      <div className="text-xs text-gray-500">
                        Last sync: {new Date(license.lastSync).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button className="text-blue-600 hover:text-blue-900">
                          <RefreshCw className="h-4 w-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-900">
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button className="text-gray-400 hover:text-gray-600">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create License Modal */}
      {showCreateModal && (
        <CreateLicenseModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            loadLicenses()
          }}
        />
      )}
    </div>
  )
}

function CreateLicenseModal({ onClose, onSuccess }: any) {
  const [formData, setFormData] = useState({
    schoolId: '',
    branchId: '',
    maxUsers: 100,
    features: [],
    expiresAt: ''
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Mock API call - in real app, this would create the license
      await new Promise(resolve => setTimeout(resolve, 1000))
      onSuccess()
    } catch (error) {
      console.error('Failed to create license:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Create New License
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">School</label>
                  <select className="input mt-1" required>
                    <option value="">Select School</option>
                    <option value="1">Springfield Elementary</option>
                    <option value="2">Riverside High School</option>
                    <option value="3">Oakwood Academy</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Branch</label>
                  <select className="input mt-1" required>
                    <option value="">Select Branch</option>
                    <option value="1">Main Campus</option>
                    <option value="2">North Campus</option>
                    <option value="3">South Campus</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Max Users</label>
                  <input
                    type="number"
                    className="input mt-1"
                    value={formData.maxUsers}
                    onChange={(e) => setFormData({...formData, maxUsers: parseInt(e.target.value)})}
                    min="1"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Expiry Date</label>
                  <input
                    type="date"
                    className="input mt-1"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData({...formData, expiresAt: e.target.value})}
                    required
                  />
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full sm:w-auto sm:ml-3"
              >
                {isLoading ? 'Creating...' : 'Create License'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary w-full sm:w-auto mt-3 sm:mt-0"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}