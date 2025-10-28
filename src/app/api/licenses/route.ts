import { NextRequest, NextResponse } from 'next/server';
import { LicenseEngine } from '@/lib/license';
import { prisma } from '@/lib/prisma';
import { authMiddleware, rbacMiddleware } from '@/lib/middleware';
import { z } from 'zod';

const createLicenseSchema = z.object({
  schoolId: z.string().min(1, 'School ID is required'),
  branchId: z.string().optional(),
  licenseType: z.enum(['TRIAL', 'BASIC', 'STANDARD', 'PREMIUM', 'ENTERPRISE']),
  maxUsers: z.number().min(1).optional(),
  features: z.array(z.string()).optional(),
  expiryDate: z.string().transform((str) => new Date(str)),
  deviceId: z.string().optional(),
});

// GET /api/licenses - List licenses
export async function GET(request: NextRequest) {
  try {
    // Apply authentication middleware
    const authResponse = await authMiddleware(request);
    if (authResponse.status !== 200) return authResponse;

    const userRole = request.headers.get('x-user-role');
    const schoolId = request.headers.get('x-school-id');

    // Only admins can view licenses
    if (userRole !== 'ADMIN') {
      return NextResponse.json({
        success: false,
        error: 'Insufficient permissions',
      }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');

    const where: any = { schoolId };
    if (status) {
      where.status = status;
    }

    const [licenses, total] = await Promise.all([
      prisma.license.findMany({
        where,
        include: {
          school: { select: { name: true } },
          branch: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.license.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        licenses,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    console.error('Get licenses error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch licenses',
    }, { status: 500 });
  }
}

// POST /api/licenses - Create new license
export async function POST(request: NextRequest) {
  try {
    // Apply authentication middleware
    const authResponse = await authMiddleware(request);
    if (authResponse.status !== 200) return authResponse;

    const userRole = request.headers.get('x-user-role');

    // Only admins can create licenses
    if (userRole !== 'ADMIN') {
      return NextResponse.json({
        success: false,
        error: 'Insufficient permissions',
      }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createLicenseSchema.parse(body);

    const license = await LicenseEngine.createLicense(validatedData);

    return NextResponse.json({
      success: true,
      data: { license },
      message: 'License created successfully',
    });
  } catch (error: any) {
    console.error('Create license error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to create license',
    }, { status: 400 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}