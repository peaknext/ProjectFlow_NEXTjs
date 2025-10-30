/**
 * Extended Prisma Types with Relations and Computed Fields
 * These types extend the base Prisma types with additional relations and fields
 */

import type { Task, Project, User, Status, Department, Division, MissionGroup } from '@/generated/prisma';

// ==================== Task Extended Types ====================

/**
 * Task with all possible relations loaded
 */
export interface TaskWithRelations extends Task {
  project?: {
    id: string;
    name: string;
    departmentId: string;
    department?: {
      id: string;
      name: string;
      divisionId: string;
      division?: {
        id: string;
        name: string;
        missionGroupId: string;
        missionGroup?: {
          id: string;
          name: string;
        };
      };
    };
  };
  assignees?: Array<{
    id: string;
    fullName: string;
    email: string;
    profileImageUrl: string | null;
    role: string;
  }>;
  status?: {
    id: string;
    name: string;
    color: string;
    order: number;
    statusType: string;
  };
  creator?: {
    id: string;
    fullName: string;
    email: string;
    profileImageUrl: string | null;
  };
  closedBy?: {
    id: string;
    fullName: string;
  };
  parentTask?: {
    id: string;
    name: string;
  };
  _count?: {
    subtasks: number;
    comments: number;
    checklists: number;
  };
  isPinned?: boolean;
}

/**
 * Task with project relation (guaranteed non-null)
 */
export interface TaskWithProject extends TaskWithRelations {
  project: {
    id: string;
    name: string;
    departmentId: string;
    department?: {
      id: string;
      name: string;
      divisionId: string;
    };
  };
}

/**
 * Task with creator relation (guaranteed non-null)
 */
export interface TaskWithCreator extends TaskWithRelations {
  creator: {
    id: string;
    fullName: string;
    email: string;
    profileImageUrl: string | null;
  };
}

// ==================== Project Extended Types ====================

/**
 * Project with all possible relations loaded
 * Note: Omits createdAt/updatedAt from base Project type to override as strings for JSON responses
 */
export interface ProjectWithRelations extends Omit<Project, 'createdAt' | 'updatedAt'> {
  creator?: {
    id: string;
    fullName: string;
    email: string;
    profileImageUrl: string | null;
  };
  department?: {
    id: string;
    name: string;
    divisionId: string;
    division?: {
      id: string;
      name: string;
      missionGroupId: string;
      missionGroup?: {
        id: string;
        name: string;
      };
    };
  };
  owner?: {
    id: string;
    fullName: string;
    email: string;
  };
  statuses?: Array<{
    id: string;
    name: string;
    color: string;
    order: number;
    statusType: string;
  }>;
  _count?: {
    tasks: number;
    statuses: number;
  };
  // Timestamps that may not be in base Prisma type (overridden as strings for JSON)
  createdAt?: string;
  updatedAt?: string;
  dateCreated?: string;
  dateModified?: string;
}

/**
 * Project with creator and timestamps (guaranteed non-null)
 */
export interface ProjectWithCreator extends ProjectWithRelations {
  creator: {
    id: string;
    fullName: string;
    email: string;
    profileImageUrl: string | null;
  };
  createdAt: string;
  dateCreated: string;
}

// ==================== User Extended Types ====================

/**
 * User with additional custom fields
 * Note: Omits notes and additionalRoles from base User type to override as optional for flexibility
 */
export interface UserWithExtras extends Omit<User, 'notes' | 'additionalRoles'> {
  // Custom notes field (may not be in schema)
  notes?: string;
  // Department relation
  department?: {
    id: string;
    name: string;
    divisionId: string;
  };
  // Additional roles for multi-department access
  additionalRoles?: Array<{
    role: string;
    departmentId: string;
    divisionId: string;
    missionGroupId: string;
  }>;
}

/**
 * User with department relation (guaranteed non-null)
 */
export interface UserWithDepartment extends User {
  department: {
    id: string;
    name: string;
    divisionId: string;
    division?: {
      id: string;
      name: string;
    };
  };
}

// ==================== JSON Field Types ====================

/**
 * Structure of pinnedTasks JSON field in User table
 */
export interface PinnedTask {
  taskId: string;
  pinnedAt: string;
}

/**
 * Array type for pinnedTasks JSON field
 */
export type PinnedTasksArray = PinnedTask[];

/**
 * Structure of additionalRoles JSON field in User table
 */
export interface AdditionalRole {
  role: string;
  departmentId: string;
  divisionId: string;
  missionGroupId: string;
}

/**
 * Array type for additionalRoles JSON field
 */
export type AdditionalRolesArray = AdditionalRole[];

// ==================== Status Extended Types ====================

/**
 * Status with project relation
 */
export interface StatusWithProject extends Status {
  project?: {
    id: string;
    name: string;
  };
}

// ==================== Department Extended Types ====================

/**
 * Department with full hierarchy
 */
export interface DepartmentWithHierarchy extends Department {
  division?: {
    id: string;
    name: string;
    missionGroupId: string;
    missionGroup?: {
      id: string;
      name: string;
    };
  };
  projects?: Array<{
    id: string;
    name: string;
    status: string;
  }>;
  users?: Array<{
    id: string;
    fullName: string;
    role: string;
  }>;
}

// ==================== History/Activity Extended Types ====================

/**
 * History record with user relation
 */
export interface HistoryWithUser {
  id: string;
  historyText: string;
  historyType: string;
  taskId: string;
  userId: string;
  createdAt: string;
  user?: {
    id: string;
    fullName: string;
    profileImageUrl: string | null;
  };
  task?: {
    id: string;
    name: string;
  };
}

// ==================== Comment Extended Types ====================

/**
 * Comment with user relation
 */
export interface CommentWithUser {
  id: string;
  content: string;
  taskId: string;
  userId: string;
  createdAt: string;
  user?: {
    id: string;
    fullName: string;
    profileImageUrl: string | null;
  };
}

// ==================== Checklist Extended Types ====================

/**
 * Checklist item with task relation
 */
export interface ChecklistWithTask {
  id: string;
  name: string;
  isChecked: boolean;
  order: number;
  taskId: string;
  task?: {
    id: string;
    name: string;
  };
}

// ==================== Type Helper Functions ====================

/**
 * Type guard to check if task has project relation loaded
 */
export function hasProject(task: TaskWithRelations): task is TaskWithProject {
  return task.project !== undefined && task.project !== null;
}

/**
 * Type guard to check if project has creator loaded
 */
export function hasCreator(project: ProjectWithRelations): project is ProjectWithCreator {
  return project.creator !== undefined && project.creator !== null;
}

/**
 * Type guard to check if user has department loaded
 */
export function hasDepartment(user: User | UserWithDepartment): user is UserWithDepartment {
  return (user as UserWithDepartment).department !== undefined;
}
