import crypto from 'crypto'
import { prisma } from './prisma'
import { LicenseStatus } from '@prisma/client'
import type { License, LicenseVerificationResult, DeviceInfo } from '@/types'

export class LicenseEngine {
  private static instance: LicenseEngine
  private encryptionKey: string
  private offlineGracePeriod = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds

  constructor() {
    this.encryptionKey = process.env.LICENSE_ENCRYPTION_KEY || 'default-key'
  }

  static getInstance(): LicenseEngine {
    if (!LicenseEngine.instance) {
      LicenseEngine.instance = new LicenseEngine()
    }
    return LicenseEngine.instance
  }

  /**
   * Generate a new license key
   */
  generateLicenseKey(schoolCode: string, branchCode: string): string {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 8)
    const combined = `${schoolCode}-${branchCode}-${timestamp}-${random}`
    
    // Create a hash for verification
    const hash = crypto.createHmac('sha256', this.encryptionKey)
      .update(combined)
      .digest('hex')
      .substring(0, 8)
    
    return `${combined}-${hash}`.toUpperCase()
  }

  /**
   * Validate license key format
   */
  validateLicenseKeyFormat(licenseKey: string): boolean {
    const pattern = /^[A-Z0-9]+-[A-Z0-9]+-[A-Z0-9]+-[A-Z0-9]+-[A-Z0-9]+$/
    return pattern.test(licenseKey)
  }

  /**
   * Create a new license
   */
  async createLicense(data: {
    schoolId: string
    branchId: string
    deviceId?: string
    deviceName?: string
    deviceInfo?: DeviceInfo
    maxUsers?: number
    features?: string[]
    expiresAt: Date
    createdBy?: string
  }): Promise<License> {
    // Get school and branch info for license key generation
    const branch = await prisma.branch.findUnique({
      where: { id: data.branchId },
      include: { school: true }
    })

    if (!branch) {
      throw new Error('Branch not found')
    }

    const licenseKey = this.generateLicenseKey(branch.school.code, branch.code)
    
    // Generate offline token for offline verification
    const offlineToken = this.generateOfflineToken(licenseKey, data.expiresAt)

    const license = await prisma.license.create({
      data: {
        schoolId: data.schoolId,
        branchId: data.branchId,
        licenseKey,
        deviceId: data.deviceId,
        deviceName: data.deviceName,
        deviceInfo: data.deviceInfo as any,
        maxUsers: data.maxUsers || 100,
        features: data.features || [],
        expiresAt: data.expiresAt,
        offlineToken,
        status: LicenseStatus.ACTIVE,
        createdBy: data.createdBy
      }
    })

    return license as License
  }

  /**
   * Verify license online
   */
  async verifyLicenseOnline(licenseKey: string, deviceId?: string): Promise<LicenseVerificationResult> {
    try {
      const license = await prisma.license.findUnique({
        where: { licenseKey },
        include: {
          school: true,
          branch: true
        }
      })

      if (!license) {
        return {
          isValid: false,
          error: 'License not found',
          features: []
        }
      }

      // Check if license is expired
      if (new Date() > license.expiresAt) {
        await this.updateLicenseStatus(license.id, LicenseStatus.EXPIRED)
        return {
          isValid: false,
          error: 'License expired',
          features: [],
          license: license as License
        }
      }

      // Check if license is revoked
      if (license.status === LicenseStatus.REVOKED) {
        return {
          isValid: false,
          error: 'License revoked',
          features: [],
          license: license as License
        }
      }

      // Check device binding if specified
      if (license.deviceId && deviceId && license.deviceId !== deviceId) {
        return {
          isValid: false,
          error: 'Device not authorized',
          features: [],
          license: license as License
        }
      }

      // Update last sync time
      await prisma.license.update({
        where: { id: license.id },
        data: { 
          lastSync: new Date(),
          isOffline: false
        }
      })

      const remainingDays = Math.ceil(
        (license.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )

      return {
        isValid: true,
        license: license as License,
        remainingDays,
        features: (license.features as string[]) || []
      }
    } catch (error) {
      console.error('License verification error:', error)
      return {
        isValid: false,
        error: 'Verification failed',
        features: []
      }
    }
  }

  /**
   * Verify license offline using stored token
   */
  async verifyLicenseOffline(licenseKey: string, offlineToken?: string): Promise<LicenseVerificationResult> {
    try {
      const license = await prisma.license.findUnique({
        where: { licenseKey }
      })

      if (!license) {
        return {
          isValid: false,
          error: 'License not found',
          features: []
        }
      }

      // Verify offline token
      if (!offlineToken || !this.verifyOfflineToken(licenseKey, license.expiresAt, offlineToken)) {
        return {
          isValid: false,
          error: 'Invalid offline token',
          features: []
        }
      }

      // Check if we're within the offline grace period
      const lastSync = license.lastSync || license.createdAt
      const timeSinceLastSync = Date.now() - lastSync.getTime()
      
      if (timeSinceLastSync > this.offlineGracePeriod) {
        return {
          isValid: false,
          error: 'Offline grace period exceeded. Please connect to internet.',
          features: []
        }
      }

      // Check if license would be expired
      if (new Date() > license.expiresAt) {
        return {
          isValid: false,
          error: 'License expired',
          features: [],
          license: license as License
        }
      }

      // Mark as offline mode
      await prisma.license.update({
        where: { id: license.id },
        data: { isOffline: true }
      })

      const remainingDays = Math.ceil(
        (license.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )

      return {
        isValid: true,
        license: license as License,
        remainingDays,
        features: (license.features as string[]) || []
      }
    } catch (error) {
      console.error('Offline license verification error:', error)
      return {
        isValid: false,
        error: 'Offline verification failed',
        features: []
      }
    }
  }

  /**
   * Generate offline verification token
   */
  private generateOfflineToken(licenseKey: string, expiresAt: Date): string {
    const data = `${licenseKey}:${expiresAt.getTime()}`
    return crypto.createHmac('sha256', this.encryptionKey)
      .update(data)
      .digest('hex')
  }

  /**
   * Verify offline token
   */
  private verifyOfflineToken(licenseKey: string, expiresAt: Date, token: string): boolean {
    const expectedToken = this.generateOfflineToken(licenseKey, expiresAt)
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expectedToken))
  }

  /**
   * Revoke a license
   */
  async revokeLicense(licenseId: string, revokedBy?: string): Promise<boolean> {
    try {
      await prisma.license.update({
        where: { id: licenseId },
        data: { 
          status: LicenseStatus.REVOKED,
          updatedAt: new Date()
        }
      })
      return true
    } catch (error) {
      console.error('License revocation error:', error)
      return false
    }
  }

  /**
   * Renew a license
   */
  async renewLicense(licenseId: string, newExpiryDate: Date): Promise<License | null> {
    try {
      const license = await prisma.license.findUnique({
        where: { id: licenseId }
      })

      if (!license) {
        throw new Error('License not found')
      }

      // Generate new offline token
      const offlineToken = this.generateOfflineToken(license.licenseKey, newExpiryDate)

      const updatedLicense = await prisma.license.update({
        where: { id: licenseId },
        data: {
          expiresAt: newExpiryDate,
          offlineToken,
          status: LicenseStatus.ACTIVE,
          updatedAt: new Date()
        }
      })

      return updatedLicense as License
    } catch (error) {
      console.error('License renewal error:', error)
      return null
    }
  }

  /**
   * Update license status
   */
  private async updateLicenseStatus(licenseId: string, status: LicenseStatus): Promise<void> {
    await prisma.license.update({
      where: { id: licenseId },
      data: { status, updatedAt: new Date() }
    })
  }

  /**
   * Get license statistics
   */
  async getLicenseStats(schoolId?: string): Promise<{
    total: number
    active: number
    expired: number
    revoked: number
    expiringSoon: number
  }> {
    const where = schoolId ? { schoolId } : {}
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

    const [total, active, expired, revoked, expiringSoon] = await Promise.all([
      prisma.license.count({ where }),
      prisma.license.count({ where: { ...where, status: LicenseStatus.ACTIVE } }),
      prisma.license.count({ where: { ...where, status: LicenseStatus.EXPIRED } }),
      prisma.license.count({ where: { ...where, status: LicenseStatus.REVOKED } }),
      prisma.license.count({
        where: {
          ...where,
          status: LicenseStatus.ACTIVE,
          expiresAt: { lte: thirtyDaysFromNow }
        }
      })
    ])

    return { total, active, expired, revoked, expiringSoon }
  }

  /**
   * Check if a feature is enabled for a license
   */
  hasFeature(license: License, feature: string): boolean {
    const features = license.features as string[] || []
    return features.includes(feature)
  }

  /**
   * Bind license to device
   */
  async bindToDevice(licenseId: string, deviceId: string, deviceName: string, deviceInfo?: DeviceInfo): Promise<boolean> {
    try {
      await prisma.license.update({
        where: { id: licenseId },
        data: {
          deviceId,
          deviceName,
          deviceInfo: deviceInfo as any,
          updatedAt: new Date()
        }
      })
      return true
    } catch (error) {
      console.error('Device binding error:', error)
      return false
    }
  }
}