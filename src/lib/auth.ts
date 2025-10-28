import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from './prisma';
import { AuthUser, LoginCredentials } from '@/types';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '7d';

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  static async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  static generateToken(payload: any): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  static verifyToken(token: string): any {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  static async login(credentials: LoginCredentials): Promise<{ user: AuthUser; token: string }> {
    const { email, password, deviceId } = credentials;

    // Find user with branch and school info
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        branch: {
          include: {
            school: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new Error('Invalid credentials or account disabled');
    }

    // Verify password
    const isValidPassword = await this.comparePassword(password, user.password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Check license validity for the branch/school
    const license = await this.validateLicense(user.branch.schoolId, user.branchId);
    if (!license.isValid) {
      throw new Error(`License ${license.error || 'invalid'}`);
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Create session
    const sessionToken = this.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      branchId: user.branchId,
      schoolId: user.branch.schoolId,
    });

    await prisma.session.create({
      data: {
        userId: user.id,
        token: sessionToken,
        deviceInfo: deviceId ? { deviceId } : undefined,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      branchId: user.branchId,
      schoolId: user.branch.schoolId,
      avatar: user.avatar,
      permissions: this.getRolePermissions(user.role),
    };

    return { user: authUser, token: sessionToken };
  }

  static async validateSession(token: string): Promise<AuthUser | null> {
    try {
      const decoded = this.verifyToken(token);
      
      const session = await prisma.session.findUnique({
        where: { token },
        include: {
          user: {
            include: {
              branch: {
                include: {
                  school: true,
                },
              },
            },
          },
        },
      });

      if (!session || !session.isActive || session.expiresAt < new Date()) {
        return null;
      }

      const user = session.user;
      if (!user.isActive) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        branchId: user.branchId,
        schoolId: user.branch.schoolId,
        avatar: user.avatar,
        permissions: this.getRolePermissions(user.role),
      };
    } catch (error) {
      return null;
    }
  }

  static async logout(token: string): Promise<void> {
    await prisma.session.updateMany({
      where: { token },
      data: { isActive: false },
    });
  }

  static getRolePermissions(role: string): string[] {
    const permissions: Record<string, string[]> = {
      ADMIN: [
        'user:create', 'user:read', 'user:update', 'user:delete',
        'school:manage', 'branch:manage', 'license:manage',
        'settings:manage', 'audit:read', 'reports:all',
      ],
      TEACHER: [
        'student:read', 'class:manage', 'subject:manage',
        'attendance:manage', 'grade:manage', 'timetable:read',
      ],
      STUDENT: [
        'profile:read', 'profile:update', 'attendance:read',
        'grade:read', 'timetable:read', 'fee:read',
      ],
      PARENT: [
        'child:read', 'attendance:read', 'grade:read',
        'fee:read', 'timetable:read',
      ],
      BURSAR: [
        'fee:manage', 'payment:manage', 'financial:read',
        'reports:financial',
      ],
      STORE_MANAGER: [
        'inventory:manage', 'purchase:manage', 'reports:inventory',
      ],
    };

    return permissions[role] || [];
  }

  static async validateLicense(schoolId: string, branchId?: string): Promise<{ isValid: boolean; error?: string }> {
    const license = await prisma.license.findFirst({
      where: {
        schoolId,
        branchId: branchId || undefined,
        status: 'ACTIVE',
        expiryDate: {
          gt: new Date(),
        },
      },
    });

    if (!license) {
      return { isValid: false, error: 'No active license found' };
    }

    if (license.expiryDate < new Date()) {
      return { isValid: false, error: 'License expired' };
    }

    return { isValid: true };
  }
}