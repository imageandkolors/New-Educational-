import { NextRequest, NextResponse } from 'next/server'
import { AuthService } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 400 }
      )
    }

    const authService = AuthService.getInstance()
    const success = await authService.logout(token)

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Logged out successfully'
      })
    } else {
      return NextResponse.json(
        { error: 'Logout failed' },
        { status: 400 }
      )
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Logout failed' },
      { status: 500 }
    )
  }
}