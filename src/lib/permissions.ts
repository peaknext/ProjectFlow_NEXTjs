/**
 * Permission System
 * Role-based access control with 6-level hierarchy
 * Based on 06_BUSINESS_LOGIC_GUIDE.md
 */

import { prisma } from './db';
import type { UserRole } from '../generated/prisma';

// Permission definitions based on role hierarchy
const ROLE_PERMISSIONS: Record<string, string[]> = {
  ADMIN: ['*'], // All permissions

  CHIEF: [
    'view_projects',
    'create_projects',
    'edit_projects',
    'delete_projects',
    'view_tasks',
    'create_tasks',
    'edit_tasks',
    'delete_tasks',
    'close_tasks',
    'view_users',
    'create_users',
    'edit_users',
    'delete_users',
    'view_reports',
    'manage_departments',
    'manage_statuses',
    'view_all_projects',
  ],

  LEADER: [
    'view_projects',
    'create_projects',
    'edit_projects',
    'view_tasks',
    'create_tasks',
    'edit_tasks',
    'close_tasks',
    'view_users',
    'view_reports',
    'manage_statuses',
  ],

  HEAD: [
    'view_projects',
    'create_projects',
    'edit_projects',
    'view_tasks',
    'create_tasks',
    'edit_tasks',
    'close_tasks',
    'view_reports',
  ],

  MEMBER: [
    'view_projects',
    'view_tasks',
    'create_tasks',
    'edit_own_tasks',
    'close_own_tasks',
  ],

  USER: ['view_projects', 'view_tasks'],
};

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: UserRole | string): string[] {
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS['USER'];
}

/**
 * Check if user has permission
 * @param userId - User ID
 * @param permission - Permission key (e.g., 'edit_tasks')
 * @param context - Optional context (projectId, taskId, etc.)
 */
export async function checkPermission(
  userId: string,
  permission: string,
  context?: {
    projectId?: string;
    taskId?: string;
    targetUserId?: string;
    departmentId?: string;
  }
): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        departmentId: true,
        additionalRoles: true,
      },
    });

    if (!user) {
      return false;
    }

    // Get base role permissions
    const permissions = getRolePermissions(user.role);

    // Admin has all permissions
    if (permissions.includes('*')) {
      return true;
    }

    // Check if user has the permission
    if (!permissions.includes(permission)) {
      return false;
    }

    // Context-based checks
    if (context) {
      // Check if editing own tasks
      if (permission === 'edit_own_tasks' && context.taskId) {
        const task = await prisma.task.findUnique({
          where: { id: context.taskId },
          select: { creatorUserId: true, assigneeUserId: true },
        });

        if (!task) return false;

        // User can edit if they created or are assigned to the task
        return (
          task.creatorUserId === userId || task.assigneeUserId === userId
        );
      }

      // Check department-level access
      if (context.departmentId) {
        // Chiefs and Leaders can access their scope
        if (['CHIEF', 'LEADER'].includes(user.role)) {
          return await isInScope(userId, user.role, context.departmentId);
        }
      }

      // Check project ownership
      if (context.projectId) {
        const project = await prisma.project.findUnique({
          where: { id: context.projectId },
          select: { ownerUserId: true, departmentId: true },
        });

        if (!project) return false;

        // Project owner has full access
        if (project.ownerUserId === userId) {
          return true;
        }

        // Check if user is in same department (for department-scoped roles)
        if (user.departmentId === project.departmentId) {
          return true;
        }
      }
    }

    return true;
  } catch (error) {
    console.error('Permission check error:', error);
    return false;
  }
}

/**
 * Check if user is in scope for department/division/mission group
 */
async function isInScope(
  userId: string,
  role: string,
  departmentId: string
): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        department: {
          include: {
            division: {
              include: {
                missionGroup: true,
              },
            },
          },
        },
      },
    });

    if (!user || !user.department) {
      return false;
    }

    const targetDept = await prisma.department.findUnique({
      where: { id: departmentId },
      include: {
        division: {
          include: {
            missionGroup: true,
          },
        },
      },
    });

    if (!targetDept) {
      return false;
    }

    // Check based on role hierarchy
    switch (role) {
      case 'CHIEF':
        // Can access entire mission group
        return (
          user.department.division.missionGroupId ===
          targetDept.division.missionGroupId
        );

      case 'LEADER':
        // Can access entire division
        return user.department.divisionId === targetDept.divisionId;

      case 'HEAD':
        // Can access own department only
        return user.departmentId === departmentId;

      default:
        return false;
    }
  } catch (error) {
    console.error('Scope check error:', error);
    return false;
  }
}

/**
 * Get effective role for user in context
 * Considers additional roles
 */
export async function getEffectiveRole(
  userId: string,
  context?: { departmentId?: string; projectId?: string }
): Promise<UserRole> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      additionalRoles: true,
    },
  });

  if (!user) {
    return 'USER' as UserRole;
  }

  // Check additional roles for context
  if (context?.departmentId && user.additionalRoles) {
    const additionalRoles = user.additionalRoles as Record<string, string>;
    const roleInDept = additionalRoles[context.departmentId];

    if (roleInDept) {
      // Return higher role between base and additional
      const roles = ['USER', 'MEMBER', 'HEAD', 'LEADER', 'CHIEF', 'ADMIN'];
      const baseIndex = roles.indexOf(user.role);
      const additionalIndex = roles.indexOf(roleInDept);

      return (
        additionalIndex > baseIndex ? roleInDept : user.role
      ) as UserRole;
    }
  }

  return user.role;
}

/**
 * Check if user can view task
 */
export async function canUserViewTask(
  userId: string,
  taskId: string
): Promise<boolean> {
  return checkPermission(userId, 'view_tasks', { taskId });
}

/**
 * Check if user can edit task
 */
export async function canUserEditTask(
  userId: string,
  taskId: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user) return false;

  // High-level roles can edit all tasks
  if (['ADMIN', 'CHIEF', 'LEADER', 'HEAD'].includes(user.role)) {
    return checkPermission(userId, 'edit_tasks', { taskId });
  }

  // MEMBER/USER can only edit own tasks
  return checkPermission(userId, 'edit_own_tasks', { taskId });
}

/**
 * Check if user can delete task
 */
export async function canUserDeleteTask(
  userId: string,
  taskId: string
): Promise<boolean> {
  return checkPermission(userId, 'delete_tasks', { taskId });
}

/**
 * Check if user can close task
 */
export async function canUserCloseTask(
  userId: string,
  taskId: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user) return false;

  // High-level roles can close all tasks
  if (['ADMIN', 'CHIEF', 'LEADER', 'HEAD'].includes(user.role)) {
    return checkPermission(userId, 'close_tasks', { taskId });
  }

  // MEMBER can only close own tasks
  return checkPermission(userId, 'close_own_tasks', { taskId });
}
