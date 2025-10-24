import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
                  request.cookies.get('auth-token')?.value;

    if (token) {
      await AuthService.logout(token);
    }

    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });

    // Clear the auth cookie
    response.cookies.delete('auth-token');

    return response;
  } catch (error: any) {
    console.error('Logout error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Logout failed',
    }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}