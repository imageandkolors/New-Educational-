import { NextRequest, NextResponse } from 'next/server'
import { LicenseEngine } from '@/lib/license-engine'
import { authMiddleware } from '@/lib/middleware'
import { RBAC } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const authResponse = await authMiddleware(request)
  if (authResponse) return authResponse

  try {
    const currentUser = (request as any).user

    // Check permissions
    if (!RBAC.hasPermission(currentUser.role, 'view_analytics')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const schoolId = searchParams.get('schoolId')

    const licenseEngine = LicenseEngine.getInstance()
    const stats = await licenseEngine.getLicenseStats(schoolId || undefined)

    return NextResponse.json({
      success: true,
      data: stats
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to get license stats' },
      { status: 500 }
    )
  }
}