import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from './prisma'
import { UserRole } from '@prisma/client'
import type { User, Session } from '@/types'

export interface AuthUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  branchId: string
  schoolId: string
}

export interface LoginCredentials {
  email: string
  password: string
  deviceId?: string
  deviceInfo?: any
}

export interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  role: UserRole
  branchId: string
  createdBy?: string
}

export class AuthService {
  private static instance: AuthService
  private jwtSecret: string

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'default-secret'
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  /**
   * Hash password
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12)
  }

  /**
   * Verify password
   */
  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword)
  }

  /**
   * Generate JWT token
   */
  generateToken(payload: any, expiresIn: string = '7d'): string {
    return jwt.sign(payload, this.jwtSecret, { expiresIn })
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): any {
    try {
      return jwt.verify(token, this.jwtSecret)
    } catch (error) {
      throw new Error('Invalid token')
    }
  }

  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<User> {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    })

    if (existingUser) {
      throw new Error('User already exists')
    }

    // Verify branch exists
    const branch = await prisma.branch.findUnique({
      where: { id: data.branchId }
    })

    if (!branch) {
      throw new Error('Branch not found')
    }

    // Hash password
    const hashedPassword = await this.hashPassword(data.password)

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        role: data.role,
        branchId: data.branchId,
        createdBy: data.createdBy
      }
    })

    // Remove password from response
    const { password, ...userWithoutPassword } = user
    return userWithoutPassword as User
  }

  /**
   * Login user
   */
  async login(credentials: LoginCredentials): Promise<{
    user: AuthUser
    token: string
    session: Session
  }> {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: credentials.email },
      include: {
        branch: {
          include: {
            school: true
          }
        }
      }
    })

    if (!user) {
      throw new Error('Invalid credentials')
    }

    // Verify password
    const isValidPassword = await this.verifyPassword(credentials.password, user.password)
    if (!isValidPassword) {
      throw new Error('Invalid credentials')
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error('Account is deactivated')
    }

    // Check if branch is active
    if (!user.branch.isActive) {
      throw new Error('Branch is deactivated')
    }

    // Create session
    const sessionToken = this.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      branchId: user.branchId
    })

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days

    const session = await prisma.session.create({
      data: {
        userId: user.id,
        token: sessionToken,
        deviceId: credentials.deviceId,
        deviceInfo: credentials.deviceInfo,
        expiresAt
      }
    })

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    })

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      branchId: user.branchId,
      schoolId: user.branch.schoolId
    }

    return {
      user: authUser,
      token: sessionToken,
      session: session as Session
    }
  }

  /**
   * Logout user
   */
  async logout(token: string): Promise<boolean> {
    try {
      await prisma.session.update({
        where: { token },
        data: { isActive: false }
      })
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Get user by token
   */
  async getUserByToken(token: string): Promise<AuthUser | null> {
    try {
      const session = await prisma.session.findUnique({
        where: { token },
        include: {
          user: {
            include: {
              branch: true
            }
          }
        }
      })

      if (!session || !session.isActive || session.expiresAt < new Date()) {
        return null
      }

      const user = session.user
      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        branchId: user.branchId,
        schoolId: user.branch.schoolId
      }
    } catch (error) {
      return null
    }
  }

  /**
   * Refresh token
   */
  async refreshToken(oldToken: string): Promise<string | null> {
    try {
      const session = await prisma.session.findUnique({
        where: { token: oldToken },
        include: { user: true }
      })

      if (!session || !session.isActive) {
        return null
      }

      // Generate new token
      const newToken = this.generateToken({
        userId: session.user.id,
        email: session.user.email,
        role: session.user.role,
        branchId: session.user.branchId
      })

      // Update session
      await prisma.session.update({
        where: { id: session.id },
        data: {
          token: newToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        }
      })

      return newToken
    } catch (error) {
      return null
    }
  }
}

/**
 * Role-based access control utilities
 */
export class RBAC {
  private static permissions: Record<UserRole, string[]> = {
    [UserRole.ADMIN]: [
      'manage_schools',
      'manage_branches',
      'manage_users',
      'manage_licenses',
      'view_analytics',
      'manage_settings',
      'view_audit_logs',
      'manage_notifications'
    ],
    [UserRole.TEACHER]: [
      'view_students',
      'manage_classes',
      'view_reports',
      'create_assignments',
      'grade_assignments',
      'send_notifications'
    ],
    [UserRole.STUDENT]: [
      'view_assignments',
      'submit_assignments',
      'view_grades',
      'view_schedule',
      'view_notifications'
    ],
    [UserRole.PARENT]: [
      'view_child_progress',
      'view_child_grades',
      'view_child_schedule',
      'communicate_teachers',
      'view_notifications'
    ],
    [UserRole.BURSAR]: [
      'manage_fees',
      'view_payments',
      'generate_receipts',
      'view_financial_reports',
      'send_fee_notifications'
    ],
    [UserRole.STORE_MANAGER]: [
      'manage_inventory',
      'process_orders',
      'view_stock_reports',
      'manage_suppliers'
    ]
  }

  /**
   * Check if user has permission
   */
  static hasPermission(userRole: UserRole, permission: string): boolean {
    return this.permissions[userRole]?.includes(permission) || false
  }

  /**
   * Get all permissions for a role
   */
  static getPermissions(userRole: UserRole): string[] {
    return this.permissions[userRole] || []
  }

  /**
   * Check if user can access resource
   */
  static canAccess(userRole: UserRole, resource: string, action: string): boolean {
    const permission = `${action}_${resource}`
    return this.hasPermission(userRole, permission)
  }

  /**
   * Middleware to check permissions
   */
  static requirePermission(permission: string) {
    return (user: AuthUser) => {
      if (!this.hasPermission(user.role, permission)) {
        throw new Error('Insufficient permissions')
      }
      return true
    }
  }

  /**
   * Check if user is admin
   */
  static isAdmin(userRole: UserRole): boolean {
    return userRole === UserRole.ADMIN
  }

  /**
   * Check if user can manage other users
   */
  static canManageUsers(userRole: UserRole): boolean {
    return this.hasPermission(userRole, 'manage_users')
  }
}