// Re-export Prisma types
export * from '@prisma/client';

// Custom types for the application
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// License related types
export interface LicenseInfo {
  licenseKey: string;
  schoolId: string;
  branchId?: string;
  deviceId: string;
  deviceInfo: DeviceInfo;
  expiryDate: Date;
  features: string[];
  maxUsers: number;
  currentUsers: number;
}

export interface DeviceInfo {
  platform: string;
  version: string;
  model?: string;
  manufacturer?: string;
  uuid: string;
  isVirtual?: boolean;
}

export interface LicenseValidationResult {
  isValid: boolean;
  isExpired: boolean;
  daysUntilExpiry: number;
  features: string[];
  maxUsers: number;
  currentUsers: number;
  error?: string;
}

// Authentication types
export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  branchId: string;
  schoolId: string;
  avatar?: string;
  permissions: string[];
}

export interface LoginCredentials {
  email: string;
  password: string;
  deviceId?: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  branchId: string;
  phone?: string;
}

// Dashboard types
export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  totalSubjects: number;
  attendanceRate: number;
  feeCollection: number;
  recentActivities: Activity[];
}

export interface Activity {
  id: string;
  type: string;
  message: string;
  user: string;
  timestamp: Date;
  icon?: string;
}

// Form types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'date' | 'file';
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  validation?: any;
}

// Offline sync types
export interface SyncData {
  timestamp: Date;
  changes: SyncChange[];
}

export interface SyncChange {
  id: string;
  table: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  data: any;
  timestamp: Date;
}

// Navigation types
export interface NavItem {
  id: string;
  label: string;
  icon: string;
  href?: string;
  children?: NavItem[];
  roles?: UserRole[];
  badge?: string | number;
}

// Theme types
export interface ThemeConfig {
  mode: 'light' | 'dark' | 'system';
  primaryColor: string;
  fontSize: 'small' | 'medium' | 'large';
  compactMode: boolean;
}

// Notification types
export interface NotificationPayload {
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  userId?: string;
  data?: any;
  expiresAt?: Date;
}

// File upload types
export interface FileUpload {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  url?: string;
  error?: string;
}

// Search types
export interface SearchParams {
  query: string;
  filters?: Record<string, any>;
  page?: number;
  limit?: number;
}

export interface SearchResult<T> {
  items: T[];
  total: number;
  query: string;
  filters: Record<string, any>;
}

// Export Prisma enums for convenience
export {
  UserRole,
  Gender,
  EnrollmentStatus,
  AttendanceStatus,
  FeeStatus,
  LicenseType,
  LicenseStatus,
  SettingType,
  NotificationType,
  NotificationPriority,
} from '@prisma/client';