// Helper functions for data transformation and validation

import type { UserRole, UserStatus, ProjectStatus, StatusType, CloseType, NotificationType } from '../src/generated/prisma';

/**
 * Map user role from GAS string to Prisma enum
 */
export function mapUserRole(role: string): UserRole {
  const roleMap: Record<string, UserRole> = {
    'Admin': 'ADMIN',
    'Chief': 'CHIEF',
    'Leader': 'LEADER',
    'Head': 'HEAD',
    'Member': 'MEMBER',
    'User': 'USER',
  };
  return (roleMap[role] || 'USER') as UserRole;
}

/**
 * Map user status from GAS string to Prisma enum
 */
export function mapUserStatus(status: string): UserStatus {
  const statusMap: Record<string, UserStatus> = {
    'Active': 'ACTIVE',
    'Suspended': 'SUSPENDED',
    'Inactive': 'INACTIVE',
  };
  return (statusMap[status] || 'ACTIVE') as UserStatus;
}

/**
 * Map project status from GAS string to Prisma enum
 */
export function mapProjectStatus(status?: string): ProjectStatus {
  const statusMap: Record<string, ProjectStatus> = {
    'Active': 'ACTIVE',
    'Completed': 'COMPLETED',
    'OnHold': 'ON_HOLD',
    'On Hold': 'ON_HOLD',
    'Archived': 'ARCHIVED',
  };
  return (statusMap[status || ''] || 'ACTIVE') as ProjectStatus;
}

/**
 * Map status type from GAS string to Prisma enum
 */
export function mapStatusType(type: string): StatusType {
  const typeMap: Record<string, StatusType> = {
    'Not Started': 'NOT_STARTED',
    'In Progress': 'IN_PROGRESS',
    'Done': 'DONE',
  };
  return (typeMap[type] || 'NOT_STARTED') as StatusType;
}

/**
 * Map task close type from GAS string to Prisma enum
 */
export function mapCloseType(type?: string): CloseType | undefined {
  if (!type) return undefined;
  const typeMap: Record<string, CloseType> = {
    'Completed': 'COMPLETED',
    'Aborted': 'ABORTED',
  };
  return typeMap[type] as CloseType | undefined;
}

/**
 * Map notification type from GAS string to Prisma enum
 */
export function mapNotificationType(type: string): NotificationType {
  const typeMap: Record<string, NotificationType> = {
    'task_assigned': 'TASK_ASSIGNED',
    'task_updated': 'TASK_UPDATED',
    'task_closed': 'TASK_CLOSED',
    'comment_mention': 'COMMENT_MENTION',
    'project_updated': 'PROJECT_UPDATED',
    'deadline_approaching': 'DEADLINE_APPROACHING',
    'overdue_task': 'OVERDUE_TASK',
    'system_announcement': 'SYSTEM_ANNOUNCEMENT',
  };
  return (typeMap[type] || 'SYSTEM_ANNOUNCEMENT') as NotificationType;
}

/**
 * Parse JSON string safely
 */
export function parseJSON(value: any): any {
  if (!value) return null;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

/**
 * Parse date string to Date object
 * Handles various date formats from Google Sheets
 */
export function parseDate(dateStr?: string): Date | null {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

/**
 * Parse integer safely
 */
export function parseIntSafe(value: any): number | null {
  if (value === null || value === undefined || value === '') return null;
  const num = parseInt(String(value), 10);
  return isNaN(num) ? null : num;
}

/**
 * Parse boolean safely
 */
export function parseBool(value: any): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const lower = value.toLowerCase();
    return lower === 'true' || lower === '1' || lower === 'yes';
  }
  return !!value;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Clean string - trim and handle empty values
 */
export function cleanString(value: any): string | null {
  if (!value) return null;
  const cleaned = String(value).trim();
  return cleaned === '' ? null : cleaned;
}

/**
 * Ensure priority is within valid range (1-4)
 */
export function normalizePriority(priority: any): number {
  const num = parseInt(String(priority), 10);
  if (isNaN(num)) return 3; // Default
  return Math.max(1, Math.min(4, num));
}

/**
 * Ensure difficulty is within valid range (1-5)
 */
export function normalizeDifficulty(difficulty: any): number | null {
  if (difficulty === null || difficulty === undefined || difficulty === '') return null;
  const num = parseInt(String(difficulty), 10);
  if (isNaN(num)) return null;
  return Math.max(1, Math.min(5, num));
}

/**
 * Log progress with colored output
 */
export function logProgress(emoji: string, message: string, ...args: any[]) {
  console.log(`${emoji} ${message}`, ...args);
}

/**
 * Log error with details
 */
export function logError(context: string, error: any, data?: any) {
  console.error(`❌ Error in ${context}:`);
  console.error(error);
  if (data) {
    console.error('Data:', JSON.stringify(data, null, 2));
  }
}

/**
 * Create a summary stats object
 */
export function createStats() {
  return {
    users: 0,
    sessions: 0,
    missionGroups: 0,
    divisions: 0,
    departments: 0,
    projects: 0,
    tasks: 0,
    statuses: 0,
    comments: 0,
    checklists: 0,
    history: 0,
    notifications: 0,
    holidays: 0,
    hospitalMissions: 0,
    itGoals: 0,
    actionPlans: 0,
    requests: 0,
    config: 0,
    permissions: 0,
    rolePermissions: 0,
    phases: 0,
  };
}

/**
 * Format duration in seconds to readable format
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}m ${secs.toFixed(1)}s`;
}

/**
 * Validate that required fields exist
 */
export function validateRequired<T extends Record<string, any>>(
  obj: T,
  requiredFields: (keyof T)[],
  context: string
): boolean {
  for (const field of requiredFields) {
    if (!obj[field]) {
      logError(context, new Error(`Missing required field: ${String(field)}`), obj);
      return false;
    }
  }
  return true;
}
