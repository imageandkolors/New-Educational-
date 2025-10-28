import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from './auth'
import { LicenseEngine } from './license-engine'

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string
    email: string
    role: string
    branchId: string
    schoolId: string
  }
}

/**
 * Authentication middleware
 */
export async function authMiddleware(request: NextRequest): Promise<NextResponse | null> {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  
  if (!token) {
    return NextResponse.json({ error: 'No token provided' }, { status: 401 })
  }

  const authService = AuthService.getInstance()
  const user = await authService.getUserByToken(token)

  if (!user) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  // Add user to request
  ;(request as AuthenticatedRequest).user = user
  return null
}

/**
 * License verification middleware
 */
export async function licenseMiddleware(request: NextRequest): Promise<NextResponse | null> {
  const licenseKey = request.headers.get('X-License-Key')
  const deviceId = request.headers.get('X-Device-ID')

  if (!licenseKey) {
    return NextResponse.json({ error: 'License key required' }, { status: 403 })
  }

  const licenseEngine = LicenseEngine.getInstance()
  
  // Try online verification first, fallback to offline
  let result = await licenseEngine.verifyLicenseOnline(licenseKey, deviceId || undefined)
  
  if (!result.isValid) {
    const offlineToken = request.headers.get('X-Offline-Token')
    result = await licenseEngine.verifyLicenseOffline(licenseKey, offlineToken || undefined)
  }

  if (!result.isValid) {
    return NextResponse.json({ 
      error: 'Invalid or expired license',
      details: result.error 
    }, { status: 403 })
  }

  return null
}

/**
 * Role-based access control middleware
 */
export function roleMiddleware(allowedRoles: string[]) {
  return (request: AuthenticatedRequest): NextResponse | null => {
    const user = request.user
    
    if (!user || !allowedRoles.includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    return null
  }
}

/**
 * Rate limiting middleware
 */
const rateLimitMap = new Map()

export function rateLimitMiddleware(limit: number = 100, windowMs: number = 60000) {
  return (request: NextRequest): NextResponse | null => {
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
    const now = Date.now()
    const windowStart = now - windowMs

    if (!rateLimitMap.has(ip)) {
      rateLimitMap.set(ip, [])
    }

    const requests = rateLimitMap.get(ip)
    const validRequests = requests.filter((time: number) => time > windowStart)
    
    if (validRequests.length >= limit) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    validRequests.push(now)
    rateLimitMap.set(ip, validRequests)

    return null
  }
}