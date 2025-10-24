import { NextRequest, NextResponse } from 'next/server'
import { LicenseEngine } from '@/lib/license-engine'
import { authMiddleware } from '@/lib/middleware'
import { RBAC } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const licenseId = params.id

    if (!licenseId) {
      return NextResponse.json(
        { error: 'License ID is required' },
        { status: 400 }
      )
    }

    const licenseEngine = LicenseEngine.getInstance()
    const success = await licenseEngine.revokeLicense(licenseId, currentUser.id)

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'License revoked successfully'
      })
    } else {
      return NextResponse.json(
        { error: 'Failed to revoke license' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'License revocation failed' },
      { status: 500 }
    )
  }
}