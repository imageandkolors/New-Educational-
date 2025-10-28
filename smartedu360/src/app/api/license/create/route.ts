import { NextRequest, NextResponse } from 'next/server'
import { LicenseEngine } from '@/lib/license-engine'
import { authMiddleware } from '@/lib/middleware'
import { RBAC } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const authResponse = await authMiddleware(request)
  if (authResponse) return authResponse

  try {
    const currentUser = (request as any).user

    // Check permissions
    if (!RBAC.hasPermission(currentUser.role, 'manage_licenses')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const {
      schoolId,
      branchId,
      deviceId,
      deviceName,
      deviceInfo,
      maxUsers,
      features,
      expiresAt
    } = await request.json()

    if (!schoolId || !branchId || !expiresAt) {
      return NextResponse.json(
        { error: 'School ID, Branch ID, and expiry date are required' },
        { status: 400 }
      )
    }

    const licenseEngine = LicenseEngine.getInstance()
    const license = await licenseEngine.createLicense({
      schoolId,
      branchId,
      deviceId,
      deviceName,
      deviceInfo,
      maxUsers: maxUsers || 100,
      features: features || [],
      expiresAt: new Date(expiresAt),
      createdBy: currentUser.id
    })

    return NextResponse.json({
      success: true,
      data: license
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'License creation failed' },
      { status: 500 }
    )
  }
}