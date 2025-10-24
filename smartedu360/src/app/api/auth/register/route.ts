import { NextRequest, NextResponse } from 'next/server'
import { AuthService, RBAC } from '@/lib/auth'
import { authMiddleware } from '@/lib/middleware'
import { UserRole } from '@prisma/client'

export async function POST(request: NextRequest) {
  // Check authentication for user creation
  const authResponse = await authMiddleware(request)
  if (authResponse) return authResponse

  try {
    const { email, password, firstName, lastName, phone, role, branchId } = await request.json()

    if (!email || !password || !firstName || !lastName || !role || !branchId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if current user can create users
    const currentUser = (request as any).user
    if (!RBAC.canManageUsers(currentUser.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to create users' },
        { status: 403 }
      )
    }

    // Validate role
    if (!Object.values(UserRole).includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    const authService = AuthService.getInstance()
    const user = await authService.register({
      email,
      password,
      firstName,
      lastName,
      phone,
      role,
      branchId,
      createdBy: currentUser.id
    })

    return NextResponse.json({
      success: true,
      data: user
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Registration failed' },
      { status: 400 }
    )
  }
}