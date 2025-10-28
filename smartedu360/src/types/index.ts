import { UserRole, LicenseStatus, NotificationStatus } from '@prisma/client'

export type { UserRole, LicenseStatus, NotificationStatus }

export interface User {
  id: string
  branchId: string
  email: string
  username?: string
  firstName: string
  lastName: string
  phone?: string
  avatar?: string
  role: UserRole
  isActive: boolean
  lastLogin?: Date
  createdAt: Date
  updatedAt: Date
  createdBy?: string
}

export interface School {
  id: string
  name: string
  code: string
  address?: string
  phone?: string
  email?: string
  website?: string
  logo?: string
  createdAt: Date
  updatedAt: Date
}

export interface Branch {
  id: string
  schoolId: string
  name: string
  code: string
  address?: string
  phone?: string
  email?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  createdBy?: string
}

export interface License {
  id: string
  schoolId: string
  branchId: string
  licenseKey: string
  deviceId?: string
  deviceName?: string
  deviceInfo?: any
  status: LicenseStatus
  maxUsers: number
  currentUsers: number
  features?: string[]
  expiresAt: Date
  lastSync?: Date
  isOffline: boolean
  offlineToken?: string
  createdAt: Date
  updatedAt: Date
  createdBy?: string
}

export interface Session {
  id: string
  userId: string
  token: string
  deviceId?: string
  deviceInfo?: any
  ipAddress?: string
  userAgent?: string
  isActive: boolean
  expiresAt: Date
  createdAt: Date
  updatedAt: Date
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface LicenseVerificationResult {
  isValid: boolean
  license?: License
  error?: string
  remainingDays?: number
  features: string[]
}

export interface DeviceInfo {
  platform: string
  model: string
  version: string
  uuid: string
  manufacturer?: string
  isVirtual?: boolean
}

export interface OfflineSyncData {
  lastSync: Date
  pendingChanges: any[]
  conflictResolution?: 'client' | 'server' | 'merge'
}