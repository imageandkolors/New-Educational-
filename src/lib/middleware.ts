import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from './auth';
import { LicenseEngine } from './license';

export interface AuthenticatedRequest extends NextRequest {
  user?: any;
}

/**
 * Authentication middleware
 */
export async function authMiddleware(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '') ||
                request.cookies.get('auth-token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const user = await AuthService.validateSession(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    // Add user to request
    const response = NextResponse.next();
    response.headers.set('x-user-id', user.id);
    response.headers.set('x-user-role', user.role);
    response.headers.set('x-school-id', user.schoolId);
    response.headers.set('x-branch-id', user.branchId);
    
    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
  }
}

/**
 * Role-based access control middleware
 */
export function rbacMiddleware(allowedRoles: string[]) {
  return async (request: NextRequest) => {
    const userRole = request.headers.get('x-user-role');
    
    if (!userRole || !allowedRoles.includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    return NextResponse.next();
  };
}

/**
 * License validation middleware
 */
export async function licenseMiddleware(request: NextRequest) {
  const schoolId = request.headers.get('x-school-id');
  const branchId = request.headers.get('x-branch-id');

  if (!schoolId) {
    return NextResponse.json({ error: 'School context required' }, { status: 400 });
  }

  try {
    const validation = await AuthService.validateLicense(schoolId, branchId || undefined);
    
    if (!validation.isValid) {
      return NextResponse.json({ 
        error: 'License validation failed',
        details: validation.error 
      }, { status: 402 }); // Payment Required
    }

    return NextResponse.next();
  } catch (error) {
    return NextResponse.json({ error: 'License validation error' }, { status: 500 });
  }
}

/**
 * Rate limiting middleware
 */
const rateLimitMap = new Map();

export function rateLimitMiddleware(limit: number = 100, windowMs: number = 60000) {
  return async (request: NextRequest) => {
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    const now = Date.now();
    const windowStart = now - windowMs;

    if (!rateLimitMap.has(ip)) {
      rateLimitMap.set(ip, []);
    }

    const requests = rateLimitMap.get(ip);
    const validRequests = requests.filter((time: number) => time > windowStart);
    
    if (validRequests.length >= limit) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    validRequests.push(now);
    rateLimitMap.set(ip, validRequests);

    return NextResponse.next();
  };
}

/**
 * CORS middleware
 */
export function corsMiddleware(request: NextRequest) {
  const response = NextResponse.next();
  
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: response.headers });
  }

  return response;
}

/**
 * Audit logging middleware
 */
export async function auditMiddleware(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  const schoolId = request.headers.get('x-school-id');
  const branchId = request.headers.get('x-branch-id');
  
  // Log the request (implement based on your needs)
  if (userId && schoolId && ['POST', 'PUT', 'DELETE'].includes(request.method)) {
    try {
      // This would be implemented to log to your audit system
      console.log('Audit log:', {
        userId,
        schoolId,
        branchId,
        method: request.method,
        url: request.url,
        timestamp: new Date(),
        ip: request.ip,
        userAgent: request.headers.get('user-agent'),
      });
    } catch (error) {
      console.error('Audit logging failed:', error);
    }
  }

  return NextResponse.next();
}

/**
 * Combine multiple middlewares
 */
export function combineMiddlewares(...middlewares: Array<(req: NextRequest) => Promise<NextResponse> | NextResponse>) {
  return async (request: NextRequest) => {
    for (const middleware of middlewares) {
      const response = await middleware(request);
      if (response.status !== 200 && !response.headers.get('x-middleware-next')) {
        return response;
      }
    }
    return NextResponse.next();
  };
}