/**
 * Permission System
 * Role-based access control with 6-level hierarchy
 * Based on 06_BUSINESS_LOGIC_GUIDE.md
 */

import { prisma } from './db';
import type { UserRole } from '../generated/prisma';

/**
 * Represents the full scope of departments/divisions/mission groups
 * that a user can access based on their primary role + additional roles
 */
export interface AccessibleScope {
  isAdmin: boolean;
  type: 'all' | 'missionGroup' | 'division' | 'department';
  missionGroupIds: string[];
  divisionIds: string[];
  departmentIds: string[];
}

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
    'delete_projects',
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
    'delete_projects',
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

      // Check if closing own tasks
      if (permission === 'close_own_tasks' && context.taskId) {
        const task = await prisma.task.findUnique({
          where: { id: context.taskId },
          select: {
            creatorUserId: true,
            assigneeUserId: true,
            assignees: {
              select: { userId: true }
            }
          },
        });

        if (!task) return false;

        // User can close if they created or are assigned to the task (support multi-assignee)
        const isAssignee = task.assigneeUserId === userId ||
                          task.assignees.some(a => a.userId === userId);

        return task.creatorUserId === userId || isAssignee;
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

/**
 * Get all accessible scope for a user based on primary role + additional roles
 * Matches GAS implementation: getUserAccessibleDepartments()
 *
 * @param userId - User ID
 * @returns AccessibleScope with all accessible IDs
 */
export async function getUserAccessibleScope(
  userId: string
): Promise<AccessibleScope> {
  // Step 1: Fetch user with additionalRoles
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      departmentId: true,
      additionalRoles: true,
    },
  });

  if (!user) {
    return {
      type: 'department' as const,
      isAdmin: false,
      missionGroupIds: [],
      divisionIds: [],
      departmentIds: [],
    };
  }

  // Step 2: Handle ADMIN special case - access everything
  if (user.role === 'ADMIN') {
    const allMGs = await prisma.missionGroup.findMany({
      where: { deletedAt: null },
      select: { id: true },
    });

    const allDivs = await prisma.division.findMany({
      where: { deletedAt: null },
      select: { id: true },
    });

    const allDepts = await prisma.department.findMany({
      where: { deletedAt: null },
      select: { id: true },
    });

    return {
      isAdmin: true,
      type: 'all' as const,
      missionGroupIds: allMGs.map((mg) => mg.id),
      divisionIds: allDivs.map((d) => d.id),
      departmentIds: allDepts.map((d) => d.id),
    };
  }

  // Step 3: Build department → role mapping
  // Map departmentId → role level (combining primary + additional roles)
  const departmentRoleMap: Record<string, string> = {};

  // Add primary role
  if (user.departmentId) {
    departmentRoleMap[user.departmentId] = user.role;
  }

  // Add additional roles
  // Supports both formats:
  // - Correct format: { "DEPT-001": "CHIEF", "DEPT-002": "MEMBER" }
  // - Legacy format: { "CHIEF": "DEPT-001", "MEMBER": "DEPT-002" }
  if (user.additionalRoles && typeof user.additionalRoles === 'object') {
    const additionalRoles = user.additionalRoles as Record<string, string>;
    Object.entries(additionalRoles).forEach(([key, value]) => {
      let deptId: string;
      let role: string;

      // Detect format: if key starts with "DEPT-", it's correct format
      if (key.startsWith('DEPT-') || key.startsWith('DIV-') || key.startsWith('dept')) {
        // Correct format: key = deptId, value = role
        deptId = key;
        role = value;
      } else {
        // Legacy format: key = role, value = deptId (BACKWARDS!)
        deptId = value;
        role = key;
      }

      // Keep higher role if department appears in both primary and additional
      const currentRole = departmentRoleMap[deptId];
      if (!currentRole || getRoleLevel(role) > getRoleLevel(currentRole)) {
        departmentRoleMap[deptId] = role;
      }
    });
  }

  // Step 4: Fetch all departments with hierarchical relationships
  const allDepartments = await prisma.department.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      divisionId: true,
      division: {
        select: {
          id: true,
          missionGroupId: true,
          missionGroup: {
            select: {
              id: true,
            },
          },
        },
      },
    },
  });

  // Step 5: Build lookup maps for efficient scope calculation
  // departmentId → divisionId
  const deptToDivMap = new Map<string, string>();
  // departmentId → missionGroupId
  const deptToMGMap = new Map<string, string>();
  // divisionId → missionGroupId
  const divToMGMap = new Map<string, string>();
  // divisionId → [departmentIds]
  const divToDeptMap = new Map<string, string[]>();
  // missionGroupId → [divisionIds]
  const mgToDivMap = new Map<string, string[]>();

  allDepartments.forEach((dept) => {
    const divId = dept.divisionId;
    const mgId = dept.division.missionGroupId;

    deptToDivMap.set(dept.id, divId);
    deptToMGMap.set(dept.id, mgId);
    divToMGMap.set(divId, mgId);

    // Build division → departments mapping
    if (!divToDeptMap.has(divId)) {
      divToDeptMap.set(divId, []);
    }
    divToDeptMap.get(divId)!.push(dept.id);

    // Build mission group → divisions mapping
    if (!mgToDivMap.has(mgId)) {
      mgToDivMap.set(mgId, []);
    }
    if (!mgToDivMap.get(mgId)!.includes(divId)) {
      mgToDivMap.get(mgId)!.push(divId);
    }
  });

  // Step 6: Process each department with its specific role
  const accessibleMGs = new Set<string>();
  const accessibleDivs = new Set<string>();
  const accessibleDepts = new Set<string>();

  Object.entries(departmentRoleMap).forEach(([deptId, role]) => {
    const divId = deptToDivMap.get(deptId);
    const mgId = deptToMGMap.get(deptId);

    if (!divId || !mgId) return; // Skip if department not found

    // Normalize role to uppercase for consistent matching
    const normalizedRole = role.toUpperCase();

    switch (normalizedRole) {
      case 'CHIEF':
        // CHIEF can access entire mission group
        accessibleMGs.add(mgId);
        // Add all divisions in this mission group
        const divsInMG = mgToDivMap.get(mgId) || [];
        divsInMG.forEach((d) => accessibleDivs.add(d));
        // Add all departments in this mission group
        divsInMG.forEach((d) => {
          const deptsInDiv = divToDeptMap.get(d) || [];
          deptsInDiv.forEach((dept) => accessibleDepts.add(dept));
        });
        break;

      case 'LEADER':
        // LEADER can access entire division
        accessibleMGs.add(mgId); // Also add parent mission group for hierarchical display
        accessibleDivs.add(divId);
        // Add all departments in this division
        const deptsInDiv = divToDeptMap.get(divId) || [];
        deptsInDiv.forEach((dept) => accessibleDepts.add(dept));
        break;

      case 'HEAD':
      case 'MEMBER':
      case 'USER':
        // HEAD/MEMBER/USER can only access their own department
        // But we need to add parent division and mission group for hierarchical display
        accessibleMGs.add(mgId);
        accessibleDivs.add(divId);
        accessibleDepts.add(deptId);
        break;
    }
  });

  // Determine scope type based on which level has the most specific access
  const mgArray = Array.from(accessibleMGs);
  const divArray = Array.from(accessibleDivs);
  const deptArray = Array.from(accessibleDepts);

  let scopeType: 'all' | 'missionGroup' | 'division' | 'department' = 'department';

  // If user has department-specific access, type is 'department'
  if (deptArray.length > 0) {
    scopeType = 'department';
  }
  // If user has division-wide access (but no dept-specific), type is 'division'
  else if (divArray.length > 0) {
    scopeType = 'division';
  }
  // If user has mission group-wide access, type is 'missionGroup'
  else if (mgArray.length > 0) {
    scopeType = 'missionGroup';
  }

  return {
    isAdmin: false,
    type: scopeType,
    missionGroupIds: mgArray,
    divisionIds: divArray,
    departmentIds: deptArray,
  };
}

/**
 * Get role level for comparison (higher number = more privileged)
 * Handles both "MEMBER" and "Member" formats
 */
function getRoleLevel(role: string): number {
  const levels: Record<string, number> = {
    USER: 1,
    MEMBER: 2,
    HEAD: 3,
    LEADER: 4,
    CHIEF: 5,
    ADMIN: 6,
  };
  // Normalize to uppercase for consistent lookup
  return levels[role.toUpperCase()] || 0;
}

/**
 * Get department info with full hierarchy
 * Helper function for user management scope checks
 */
async function getDepartmentInfo(departmentId: string | null) {
  if (!departmentId) return null;

  const department = await prisma.department.findUnique({
    where: { id: departmentId },
    select: {
      id: true,
      divisionId: true,
      division: {
        select: {
          id: true,
          name: true,
          missionGroupId: true,
          missionGroup: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (!department) return null;

  return {
    departmentId: department.id,
    divisionId: department.divisionId,
    divisionName: department.division.name,
    missionGroupId: department.division.missionGroupId,
    missionGroupName: department.division.missionGroup.name,
  };
}

/**
 * Check if target user is within current user's management scope
 *
 * Scope Rules:
 * - ADMIN: Can VIEW all users (including other admins), but cannot EDIT/DELETE other admins
 * - CHIEF: Can manage users in their Mission Group (including additional roles)
 * - LEADER: Can manage users in their Division (including additional roles)
 * - HEAD: Can manage users in their Department (including additional roles)
 * - MEMBER/USER: Cannot manage anyone
 *
 * Matches GAS implementation: Code.gs lines 7603-7701
 *
 * @param currentUserId - Current user ID (manager)
 * @param targetUserId - Target user ID (user to be managed)
 * @returns true if target user is in scope
 */
export async function isUserInManagementScope(
  currentUserId: string,
  targetUserId: string
): Promise<boolean> {
  // Fetch both users
  const [currentUser, targetUser] = await Promise.all([
    prisma.user.findUnique({
      where: { id: currentUserId },
      select: {
        id: true,
        role: true,
        departmentId: true,
        additionalRoles: true,
      },
    }),
    prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        role: true,
        departmentId: true,
      },
    }),
  ]);

  if (!currentUser || !targetUser) return false;

  // Cannot manage yourself
  if (currentUserId === targetUserId) return false;

  // ADMIN special cases
  if (currentUser.role === 'ADMIN') {
    // Admin can manage all non-Admin users
    return targetUser.role !== 'ADMIN';
  }

  // Non-Admin cannot manage Admin users
  if (targetUser.role === 'ADMIN') return false;

  // Get department hierarchies
  const [currentDeptInfo, targetDeptInfo] = await Promise.all([
    getDepartmentInfo(currentUser.departmentId),
    getDepartmentInfo(targetUser.departmentId),
  ]);

  if (!currentDeptInfo || !targetDeptInfo) return false;

  // Check based on current user's role
  switch (currentUser.role) {
    case 'CHIEF':
      // Chief: Can manage users in same Mission Group
      if (currentDeptInfo.missionGroupId === targetDeptInfo.missionGroupId) {
        return true;
      }

      // Check additional roles
      if (currentUser.additionalRoles) {
        const additionalRoles = currentUser.additionalRoles as Record<
          string,
          string
        >;

        // Check if current user has Chief role in target user's MG
        for (const [deptId, roleName] of Object.entries(additionalRoles)) {
          if (roleName === 'CHIEF') {
            const addDeptInfo = await getDepartmentInfo(deptId);
            if (
              addDeptInfo &&
              addDeptInfo.missionGroupId === targetDeptInfo.missionGroupId
            ) {
              return true;
            }
          }
        }
      }

      return false;

    case 'LEADER':
      // Leader: Can manage users in same Division
      if (currentDeptInfo.divisionId === targetDeptInfo.divisionId) {
        return true;
      }

      // Check additional roles
      if (currentUser.additionalRoles) {
        const additionalRoles = currentUser.additionalRoles as Record<
          string,
          string
        >;

        for (const [deptId, roleName] of Object.entries(additionalRoles)) {
          if (roleName === 'LEADER' || roleName === 'CHIEF') {
            const addDeptInfo = await getDepartmentInfo(deptId);
            if (
              addDeptInfo &&
              (addDeptInfo.divisionId === targetDeptInfo.divisionId ||
                addDeptInfo.missionGroupId === targetDeptInfo.missionGroupId)
            ) {
              return true;
            }
          }
        }
      }

      return false;

    case 'HEAD':
      // Head: Can manage users in same Department
      if (currentDeptInfo.departmentId === targetDeptInfo.departmentId) {
        return true;
      }

      // Check additional roles
      if (currentUser.additionalRoles) {
        const additionalRoles = currentUser.additionalRoles as Record<
          string,
          string
        >;

        for (const [deptId, roleName] of Object.entries(additionalRoles)) {
          if (['HEAD', 'LEADER', 'CHIEF'].includes(roleName)) {
            if (deptId === targetUser.departmentId) {
              return true;
            }
            // Also check if higher role gives access to target dept
            const addDeptInfo = await getDepartmentInfo(deptId);
            if (addDeptInfo) {
              if (
                roleName === 'CHIEF' &&
                addDeptInfo.missionGroupId === targetDeptInfo.missionGroupId
              ) {
                return true;
              }
              if (
                roleName === 'LEADER' &&
                addDeptInfo.divisionId === targetDeptInfo.divisionId
              ) {
                return true;
              }
            }
          }
        }
      }

      return false;

    default:
      // MEMBER/USER cannot manage anyone
      return false;
  }
}

/**
 * Check if current user can manage target user
 * Wrapper function with all checks: scope, role level, self-management
 *
 * Matches GAS implementation: Code.gs lines 7709-7721
 *
 * @param currentUserId - Current user ID
 * @param targetUserId - Target user ID
 * @returns true if current user can manage target user
 */
export async function canManageTargetUser(
  currentUserId: string,
  targetUserId: string
): Promise<boolean> {
  // Check basic permission
  const currentUser = await prisma.user.findUnique({
    where: { id: currentUserId },
    select: { role: true },
  });

  if (!currentUser) return false;

  // Only these roles can manage users
  const canManageUsers = ['ADMIN', 'CHIEF', 'LEADER', 'HEAD'].includes(
    currentUser.role
  );

  if (!canManageUsers) return false;

  // Check if target user is in scope
  return isUserInManagementScope(currentUserId, targetUserId);
}

/**
 * Get all users that current user can manage
 * Returns filtered list based on management scope
 *
 * Matches GAS implementation: Code.gs lines 7728-7790
 *
 * @param currentUserId - Current user ID
 * @returns Array of user IDs that current user can manage
 */
export async function getUserManageableUserIds(
  currentUserId: string
): Promise<string[]> {
  const currentUser = await prisma.user.findUnique({
    where: { id: currentUserId },
    select: {
      id: true,
      role: true,
      departmentId: true,
      additionalRoles: true,
    },
  });

  if (!currentUser) return [];

  // Only these roles can manage users
  if (!['ADMIN', 'CHIEF', 'LEADER', 'HEAD'].includes(currentUser.role)) {
    return [];
  }

  // Admin can see all users (including other admins)
  // Note: Can VIEW all, but canManageTargetUser() prevents editing other admins
  if (currentUser.role === 'ADMIN') {
    const allUsers = await prisma.user.findMany({
      where: {
        deletedAt: null,
        id: { not: currentUserId }, // Exclude self
      },
      select: { id: true },
    });
    return allUsers.map((u) => u.id);
  }

  // For other roles, use getUserAccessibleScope
  const scope = await getUserAccessibleScope(currentUserId);

  // Get all users in accessible departments
  const users = await prisma.user.findMany({
    where: {
      departmentId: { in: scope.departmentIds },
      role: { not: 'ADMIN' }, // Cannot manage Admin users
      deletedAt: null,
    },
    select: { id: true },
  });

  // Filter out self
  return users.map((u) => u.id).filter((id) => id !== currentUserId);
}

/**
 * ========================================
 * PROJECT PERMISSION FUNCTIONS
 * ========================================
 * Centralized functions for project-level permissions
 * Matches GAS implementation: Code.gs lines 7387-7413
 */

/**
 * Check if user can create project in department
 *
 * Permission rules:
 * - ADMIN: Can create projects anywhere
 * - CHIEF: Can create in their Mission Group
 * - LEADER: Can create in their Division
 * - HEAD: Can create in their Department
 * - MEMBER/USER: Cannot create projects
 *
 * @param userId - User ID
 * @param departmentId - Target department ID
 * @returns true if user can create project
 */
export async function canUserCreateProject(
  userId: string,
  departmentId: string
): Promise<boolean> {
  return checkPermission(userId, 'create_projects', { departmentId });
}

/**
 * Check if user can edit project
 *
 * Permission rules:
 * - Project owner: Can always edit
 * - ADMIN: Can edit any project
 * - CHIEF: Can edit projects in their Mission Group
 * - LEADER: Can edit projects in their Division
 * - HEAD: Can edit projects in their Department
 * - MEMBER/USER: Cannot edit (unless owner)
 *
 * @param userId - User ID
 * @param projectId - Project ID
 * @returns true if user can edit project
 */
export async function canUserEditProject(
  userId: string,
  projectId: string
): Promise<boolean> {
  const project = await prisma.project.findUnique({
    where: { id: projectId, dateDeleted: null },
    select: {
      id: true,
      departmentId: true,
      ownerUserId: true,
    },
  });

  if (!project) return false;

  // Project owner can always edit
  if (project.ownerUserId === userId) return true;

  // Check role-based permission
  return checkPermission(userId, 'edit_projects', {
    departmentId: project.departmentId,
    projectId,
  });
}

/**
 * Check if user can delete project
 *
 * Permission rules:
 * - ADMIN: Can delete any project
 * - CHIEF: Can delete projects in their Mission Group
 * - LEADER: Can delete projects in their Division
 * - HEAD: Can delete projects in their Department
 * - MEMBER/USER: Cannot delete projects
 *
 * @param userId - User ID
 * @param projectId - Project ID
 * @returns true if user can delete project
 */
export async function canUserDeleteProject(
  userId: string,
  projectId: string
): Promise<boolean> {
  const project = await prisma.project.findUnique({
    where: { id: projectId, dateDeleted: null },
    select: {
      id: true,
      departmentId: true,
    },
  });

  if (!project) return false;

  return checkPermission(userId, 'delete_projects', {
    departmentId: project.departmentId,
    projectId,
  });
}

/**
 * Check if user can view project
 *
 * Permission rules:
 * - ADMIN: Can view any project
 * - CHIEF: Can view projects in their Mission Group
 * - LEADER: Can view projects in their Division
 * - HEAD: Can view projects in their Department
 * - MEMBER: Can view projects in their Department
 * - USER: Can view projects they're involved in
 *
 * @param userId - User ID
 * @param projectId - Project ID
 * @returns true if user can view project
 */
export async function canUserViewProject(
  userId: string,
  projectId: string
): Promise<boolean> {
  const project = await prisma.project.findUnique({
    where: { id: projectId, dateDeleted: null },
    select: {
      id: true,
      departmentId: true,
    },
  });

  if (!project) return false;

  return checkPermission(userId, 'view_projects', {
    departmentId: project.departmentId,
    projectId,
  });
}
