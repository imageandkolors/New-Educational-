import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth'
import { rateLimitMiddleware } from '@/lib/middleware'

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = rateLimitMiddleware(5, 60000)(request) // 5 requests per minute
  if (rateLimitResponse) return rateLimitResponse

  try {
    const { email, password, deviceId, deviceInfo } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const authService = AuthService.getInstance()
    const result = await authService.login({
      email,
      password,
      deviceId,
      deviceInfo
    })

    return NextResponse.json({
      success: true,
      data: {
        user: result.user,
        token: result.token,
        sessionId: result.session.id
      }
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Login failed' },
      { status: 401 }
    )
  }
}