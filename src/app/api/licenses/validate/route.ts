import { NextRequest, NextResponse } from 'next/server';
import { LicenseEngine } from '@/lib/license';
import { z } from 'zod';

const validateSchema = z.object({
  licenseKey: z.string().min(1, 'License key is required'),
  deviceId: z.string().min(1, 'Device ID is required'),
  deviceInfo: z.object({
    platform: z.string(),
    version: z.string(),
    model: z.string().optional(),
    manufacturer: z.string().optional(),
    uuid: z.string(),
    isVirtual: z.boolean().optional(),
  }).optional(),
  offline: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = validateSchema.parse(body);

    const { licenseKey, deviceId, deviceInfo, offline } = validatedData;

    let validation;
    if (offline) {
      validation = await LicenseEngine.validateLicenseOffline(licenseKey, deviceId);
    } else {
      validation = await LicenseEngine.validateLicenseOnline(licenseKey, deviceId, deviceInfo);
      
      // Cache the result for offline use
      if (validation.isValid) {
        await LicenseEngine.cacheLicenseData(licenseKey, validation);
      }
    }

    return NextResponse.json({
      success: true,
      data: validation,
    });
  } catch (error: any) {
    console.error('License validation error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'License validation failed',
    }, { status: 400 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}