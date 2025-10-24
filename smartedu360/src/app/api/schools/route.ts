import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authMiddleware } from '@/lib/middleware'
import { RBAC } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const authResponse = await authMiddleware(request)
  if (authResponse) return authResponse

  try {
    const currentUser = (request as any).user

    // Check permissions
    if (!RBAC.hasPermission(currentUser.role, 'manage_schools')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''

    const skip = (page - 1) * limit

    const where = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { code: { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } }
      ]
    } : {}

    const [schools, total] = await Promise.all([
      prisma.school.findMany({
        where,
        skip,
        take: limit,
        include: {
          branches: {
            select: {
              id: true,
              name: true,
              isActive: true
            }
          },
          _count: {
            select: {
              branches: true,
              licenses: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.school.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: schools,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch schools' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const authResponse = await authMiddleware(request)
  if (authResponse) return authResponse

  try {
    const currentUser = (request as any).user

    // Check permissions
    if (!RBAC.hasPermission(currentUser.role, 'manage_schools')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { name, code, address, phone, email, website, logo } = await request.json()

    if (!name || !code) {
      return NextResponse.json(
        { error: 'Name and code are required' },
        { status: 400 }
      )
    }

    const school = await prisma.school.create({
      data: {
        name,
        code: code.toUpperCase(),
        address,
        phone,
        email,
        website,
        logo
      }
    })

    return NextResponse.json({
      success: true,
      data: school
    })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'School code already exists' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: error.message || 'Failed to create school' },
      { status: 500 }
    )
  }
}