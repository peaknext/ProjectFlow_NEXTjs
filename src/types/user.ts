/**
 * User Management Types
 * TypeScript interfaces and types for user system
 */

// ============================================
// ENUMS & CONSTANTS
// ============================================

export type UserRole = 'ADMIN' | 'CHIEF' | 'LEADER' | 'HEAD' | 'MEMBER' | 'USER';
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';

// Role labels in Thai
export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'ผู้ดูแลระบบ',
  CHIEF: 'หัวหน้ากลุ่มภารกิจ',
  LEADER: 'หัวหน้ากลุ่มงาน',
  HEAD: 'หัวหน้าหน่วยงาน',
  MEMBER: 'สมาชิก',
  USER: 'ผู้ใช้',
};

// Role colors for badges (matches GAS color scheme)
export const ROLE_COLORS: Record<UserRole, string> = {
  ADMIN: 'bg-purple-100 text-purple-800 dark:bg-purple-200 dark:text-purple-950',
  CHIEF: 'bg-red-100 text-red-800 dark:bg-red-200 dark:text-red-950',
  LEADER: 'bg-orange-100 text-orange-800 dark:bg-orange-200 dark:text-orange-950',
  HEAD: 'bg-blue-100 text-blue-800 dark:bg-blue-200 dark:text-blue-950',
  MEMBER: 'bg-green-100 text-green-800 dark:bg-green-200 dark:text-green-950',
  USER: 'bg-gray-100 text-gray-800 dark:bg-gray-300 dark:text-gray-950',
};

// Status labels in Thai
export const STATUS_LABELS: Record<UserStatus, string> = {
  ACTIVE: 'ใช้งานอยู่',
  SUSPENDED: 'ระงับ',
  INACTIVE: 'ไม่ใช้งาน',
};

// Status colors
export const STATUS_COLORS: Record<UserStatus, string> = {
  ACTIVE: 'text-green-600 dark:text-green-400',
  SUSPENDED: 'text-red-600 dark:text-red-400',
  INACTIVE: 'text-gray-400 dark:text-gray-500',
};

// ============================================
// INTERFACES
// ============================================

/**
 * User entity
 * Matches API response structure from /api/users
 */
export interface User {
  id: string;
  email: string;
  titlePrefix: string | null; // คำนำหน้าชื่อ
  firstName: string; // ชื่อ
  lastName: string; // นามสกุล
  fullName: string; // Auto-generated (kept for backward compatibility)
  role: UserRole;
  profileImageUrl: string | null;
  departmentId: string | null;
  department?: {
    id: string;
    name: string;
    division?: {
      id: string;
      name: string;
      missionGroup?: {
        id: string;
        name: string;
      };
    };
  };
  userStatus: UserStatus;
  isVerified: boolean;
  jobTitleId: string | null; // Foreign key to JobTitle table
  jobTitle?: {
    // Optional: included when explicitly selected
    id: string;
    jobTitleTh: string; // ชื่อตำแหน่งภาษาไทย
    jobTitleEn: string; // ชื่อตำแหน่งภาษาอังกฤษ
  };
  jobLevel: string | null;
  workLocation: string | null;
  internalPhone: string | null;
  additionalRoles?: Record<string, string> | null;
  pinnedTasks?: any; // JSON field
  createdAt: string;
  updatedAt?: string;
}

/**
 * User filters for list query
 */
export interface UserFilters {
  page: number;
  limit: number;
  search: string;
  role: string; // 'ALL' or specific role
  status: string; // 'ALL' or specific status
  missionGroupId: string | null;
  divisionId: string | null;
  departmentId: string | null;
}

/**
 * User list API response
 */
export interface UserListResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Create user input (ADMIN only - no password required)
 */
export interface CreateUserInput {
  email: string;
  titlePrefix?: string; // คำนำหน้าชื่อ (optional)
  firstName: string; // ชื่อ (required)
  lastName: string; // นามสกุล (required)
  departmentId: string;
  role: UserRole;
  jobTitleId?: string; // Foreign key to JobTitle table
  jobLevel?: string;
  workLocation?: string;
  internalPhone?: string;
}

/**
 * Update user input
 */
export interface UpdateUserInput {
  titlePrefix?: string | null; // คำนำหน้าชื่อ
  firstName?: string; // ชื่อ
  lastName?: string; // นามสกุล
  departmentId?: string | null;
  role?: UserRole;
  profileImageUrl?: string | null;
  jobTitleId?: string | null; // Foreign key to JobTitle table
  jobLevel?: string;
  workLocation?: string; // สถานที่ปฏิบัติงาน
  internalPhone?: string; // เบอร์โทรภายใน
  additionalRoles?: Record<string, string> | null;
  password?: string; // For password change
}

/**
 * User statistics (for dashboard)
 */
export interface UserStats {
  total: number;
  active: number;
  suspended: number;
  inactive: number;
  byRole: Record<UserRole, number>;
  createdThisMonth: number;
}

// ============================================
// UTILITY TYPES
// ============================================

/**
 * User with organization hierarchy (for display)
 */
export interface UserWithHierarchy extends User {
  organizationPath?: string; // e.g., "MG A / Div 1 / Dept X"
}

/**
 * User form data (for create/edit modals)
 */
export interface UserFormData {
  email: string;
  password?: string;
  confirmPassword?: string;
  titlePrefix?: string; // คำนำหน้าชื่อ (optional)
  firstName: string; // ชื่อ (required)
  lastName: string; // นามสกุล (required)
  departmentId: string;
  role: UserRole;
  jobTitleId?: string; // Foreign key to JobTitle table
  jobLevel: string;
  workLocation: string;
  internalPhone: string;
  profileImageUrl: string;
}
