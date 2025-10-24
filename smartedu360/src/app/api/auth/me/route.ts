import { NextRequest, NextResponse } from 'next/server'
import { authMiddleware } from '@/lib/middleware'

export async function GET(request: NextRequest) {
  const authResponse = await authMiddleware(request)
  if (authResponse) return authResponse

  try {
    const user = (request as any).user

    return NextResponse.json({
      success: true,
      data: user
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to get user info' },
      { status: 500 }
    )
  }
}