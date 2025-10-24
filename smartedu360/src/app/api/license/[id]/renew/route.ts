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
    const { expiresAt } = await request.json()

    if (!licenseId || !expiresAt) {
      return NextResponse.json(
        { error: 'License ID and expiry date are required' },
        { status: 400 }
      )
    }

    const licenseEngine = LicenseEngine.getInstance()
    const license = await licenseEngine.renewLicense(licenseId, new Date(expiresAt))

    if (license) {
      return NextResponse.json({
        success: true,
        data: license
      })
    } else {
      return NextResponse.json(
        { error: 'Failed to renew license' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'License renewal failed' },
      { status: 500 }
    )
  }
}