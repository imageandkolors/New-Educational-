import crypto from 'crypto';
import { prisma } from './prisma';
import { LicenseInfo, LicenseValidationResult, DeviceInfo } from '@/types';

const ENCRYPTION_KEY = process.env.LICENSE_ENCRYPTION_KEY || 'your-32-char-secret-key-here!!!';
const ALGORITHM = 'aes-256-gcm';

export class LicenseEngine {
  /**
   * Generate a new license key
   */
  static generateLicenseKey(schoolId: string, branchId?: string): string {
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    const data = `${schoolId}:${branchId || 'all'}:${timestamp}:${random}`;
    
    const cipher = crypto.createCipher('aes256', ENCRYPTION_KEY);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Format as XXXX-XXXX-XXXX-XXXX
    const formatted = encrypted.toUpperCase().match(/.{1,4}/g)?.slice(0, 4).join('-') || encrypted;
    return formatted;
  }

  /**
   * Create a new license
   */
  static async createLicense(data: {
    schoolId: string;
    branchId?: string;
    licenseType: string;
    maxUsers?: number;
    features?: string[];
    expiryDate: Date;
    deviceId?: string;
    deviceInfo?: DeviceInfo;
  }) {
    const licenseKey = this.generateLicenseKey(data.schoolId, data.branchId);
    
    const license = await prisma.license.create({
      data: {
        schoolId: data.schoolId,
        branchId: data.branchId,
        licenseKey,
        licenseType: data.licenseType as any,
        maxUsers: data.maxUsers || 100,
        features: data.features || [],
        expiryDate: data.expiryDate,
        deviceId: data.deviceId,
        deviceInfo: data.deviceInfo,
        status: 'ACTIVE',
      },
    });

    return license;
  }

  /**
   * Validate license online
   */
  static async validateLicenseOnline(
    licenseKey: string,
    deviceId: string,
    deviceInfo?: DeviceInfo
  ): Promise<LicenseValidationResult> {
    try {
      const license = await prisma.license.findUnique({
        where: { licenseKey },
        include: {
          school: true,
          branch: true,
        },
      });

      if (!license) {
        return {
          isValid: false,
          isExpired: false,
          daysUntilExpiry: 0,
          features: [],
          maxUsers: 0,
          currentUsers: 0,
          error: 'License not found',
        };
      }

      // Check if license is active
      if (license.status !== 'ACTIVE') {
        return {
          isValid: false,
          isExpired: false,
          daysUntilExpiry: 0,
          features: [],
          maxUsers: license.maxUsers || 0,
          currentUsers: license.currentUsers,
          error: `License is ${license.status.toLowerCase()}`,
        };
      }

      // Check expiry
      const now = new Date();
      const isExpired = license.expiryDate < now;
      const daysUntilExpiry = Math.ceil((license.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (isExpired) {
        return {
          isValid: false,
          isExpired: true,
          daysUntilExpiry: 0,
          features: license.features as string[] || [],
          maxUsers: license.maxUsers || 0,
          currentUsers: license.currentUsers,
          error: 'License expired',
        };
      }

      // Check device binding (if license is device-specific)
      if (license.deviceId && license.deviceId !== deviceId) {
        return {
          isValid: false,
          isExpired: false,
          daysUntilExpiry,
          features: license.features as string[] || [],
          maxUsers: license.maxUsers || 0,
          currentUsers: license.currentUsers,
          error: 'License bound to different device',
        };
      }

      // Update device info and last sync
      await prisma.license.update({
        where: { id: license.id },
        data: {
          deviceId,
          deviceInfo: deviceInfo || license.deviceInfo,
          lastSync: new Date(),
          isOffline: false,
        },
      });

      return {
        isValid: true,
        isExpired: false,
        daysUntilExpiry,
        features: license.features as string[] || [],
        maxUsers: license.maxUsers || 0,
        currentUsers: license.currentUsers,
      };
    } catch (error) {
      console.error('License validation error:', error);
      return {
        isValid: false,
        isExpired: false,
        daysUntilExpiry: 0,
        features: [],
        maxUsers: 0,
        currentUsers: 0,
        error: 'Validation failed',
      };
    }
  }

  /**
   * Validate license offline (using cached data)
   */
  static async validateLicenseOffline(licenseKey: string, deviceId: string): Promise<LicenseValidationResult> {
    try {
      // Get cached license data from local storage or database
      const cachedLicense = await this.getCachedLicense(licenseKey);
      
      if (!cachedLicense) {
        return {
          isValid: false,
          isExpired: false,
          daysUntilExpiry: 0,
          features: [],
          maxUsers: 0,
          currentUsers: 0,
          error: 'No cached license data available',
        };
      }

      // Basic offline validation
      const now = new Date();
      const isExpired = new Date(cachedLicense.expiryDate) < now;
      const daysUntilExpiry = Math.ceil((new Date(cachedLicense.expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Allow some grace period for offline usage (e.g., 30 days)
      const gracePeriod = 30;
      const lastSync = cachedLicense.lastSync ? new Date(cachedLicense.lastSync) : new Date(0);
      const daysSinceSync = Math.ceil((now.getTime() - lastSync.getTime()) / (1000 * 60 * 60 * 24));

      if (daysSinceSync > gracePeriod) {
        return {
          isValid: false,
          isExpired: false,
          daysUntilExpiry,
          features: cachedLicense.features || [],
          maxUsers: cachedLicense.maxUsers || 0,
          currentUsers: cachedLicense.currentUsers || 0,
          error: 'License requires online validation',
        };
      }

      return {
        isValid: !isExpired,
        isExpired,
        daysUntilExpiry: Math.max(0, daysUntilExpiry),
        features: cachedLicense.features || [],
        maxUsers: cachedLicense.maxUsers || 0,
        currentUsers: cachedLicense.currentUsers || 0,
        error: isExpired ? 'License expired' : undefined,
      };
    } catch (error) {
      return {
        isValid: false,
        isExpired: false,
        daysUntilExpiry: 0,
        features: [],
        maxUsers: 0,
        currentUsers: 0,
        error: 'Offline validation failed',
      };
    }
  }

  /**
   * Get cached license data
   */
  private static async getCachedLicense(licenseKey: string) {
    try {
      // Try to get from database first
      const license = await prisma.license.findUnique({
        where: { licenseKey },
      });

      if (license) {
        return {
          licenseKey: license.licenseKey,
          expiryDate: license.expiryDate,
          features: license.features as string[],
          maxUsers: license.maxUsers,
          currentUsers: license.currentUsers,
          lastSync: license.lastSync,
        };
      }

      // Fallback to localStorage (for client-side)
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem(`license_${licenseKey}`);
        return cached ? JSON.parse(cached) : null;
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Cache license data for offline use
   */
  static async cacheLicenseData(licenseKey: string, licenseData: any) {
    try {
      // Cache in localStorage (client-side)
      if (typeof window !== 'undefined') {
        localStorage.setItem(`license_${licenseKey}`, JSON.stringify({
          ...licenseData,
          cachedAt: new Date().toISOString(),
        }));
      }
    } catch (error) {
      console.error('Failed to cache license data:', error);
    }
  }

  /**
   * Revoke a license
   */
  static async revokeLicense(licenseKey: string, reason?: string) {
    const license = await prisma.license.update({
      where: { licenseKey },
      data: {
        status: 'REVOKED',
        updatedAt: new Date(),
      },
    });

    // Log the revocation
    await prisma.auditLog.create({
      data: {
        schoolId: license.schoolId,
        branchId: license.branchId,
        action: 'LICENSE_REVOKED',
        entity: 'License',
        entityId: license.id,
        newValues: { reason },
      },
    });

    return license;
  }

  /**
   * Renew a license
   */
  static async renewLicense(licenseKey: string, newExpiryDate: Date) {
    const license = await prisma.license.update({
      where: { licenseKey },
      data: {
        expiryDate: newExpiryDate,
        status: 'ACTIVE',
        updatedAt: new Date(),
      },
    });

    // Log the renewal
    await prisma.auditLog.create({
      data: {
        schoolId: license.schoolId,
        branchId: license.branchId,
        action: 'LICENSE_RENEWED',
        entity: 'License',
        entityId: license.id,
        newValues: { expiryDate: newExpiryDate },
      },
    });

    return license;
  }

  /**
   * Get license statistics
   */
  static async getLicenseStats(schoolId?: string) {
    const whereClause = schoolId ? { schoolId } : {};

    const stats = await prisma.license.groupBy({
      by: ['status'],
      where: whereClause,
      _count: {
        id: true,
      },
    });

    const expiringSoon = await prisma.license.count({
      where: {
        ...whereClause,
        status: 'ACTIVE',
        expiryDate: {
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          gt: new Date(),
        },
      },
    });

    return {
      byStatus: stats.reduce((acc, stat) => {
        acc[stat.status] = stat._count.id;
        return acc;
      }, {} as Record<string, number>),
      expiringSoon,
    };
  }

  /**
   * Sync license data (for offline-to-online transition)
   */
  static async syncLicenseData(licenseKey: string, deviceId: string) {
    try {
      // Validate online to get fresh data
      const validation = await this.validateLicenseOnline(licenseKey, deviceId);
      
      if (validation.isValid) {
        // Update cached data
        await this.cacheLicenseData(licenseKey, validation);
      }

      return validation;
    } catch (error) {
      console.error('License sync failed:', error);
      throw error;
    }
  }

  /**
   * Check if feature is enabled for license
   */
  static async hasFeature(licenseKey: string, feature: string): Promise<boolean> {
    try {
      const license = await prisma.license.findUnique({
        where: { licenseKey },
        select: { features: true, status: true },
      });

      if (!license || license.status !== 'ACTIVE') {
        return false;
      }

      const features = license.features as string[] || [];
      return features.includes(feature);
    } catch (error) {
      return false;
    }
  }

  /**
   * Update user count for license
   */
  static async updateUserCount(licenseKey: string, count: number) {
    await prisma.license.update({
      where: { licenseKey },
      data: { currentUsers: count },
    });
  }
}