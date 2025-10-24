import { NextRequest, NextResponse } from 'next/server'
import { LicenseEngine } from '@/lib/license-engine'
import { rateLimitMiddleware } from '@/lib/middleware'

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = rateLimitMiddleware(10, 60000)(request) // 10 requests per minute
  if (rateLimitResponse) return rateLimitResponse

  try {
    const { licenseKey, deviceId, offlineToken, forceOffline } = await request.json()

    if (!licenseKey) {
      return NextResponse.json(
        { error: 'License key is required' },
        { status: 400 }
      )
    }

    const licenseEngine = LicenseEngine.getInstance()
    let result

    if (forceOffline) {
      // Force offline verification
      result = await licenseEngine.verifyLicenseOffline(licenseKey, offlineToken)
    } else {
      // Try online first, fallback to offline
      result = await licenseEngine.verifyLicenseOnline(licenseKey, deviceId)
      
      if (!result.isValid && offlineToken) {
        result = await licenseEngine.verifyLicenseOffline(licenseKey, offlineToken)
      }
    }

    return NextResponse.json({
      success: result.isValid,
      data: result
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'License verification failed' },
      { status: 500 }
    )
  }
}