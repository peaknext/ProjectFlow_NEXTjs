/**
 * Standard API Response Types
 * Used throughout the application for type-safe API communication
 */

// ==================== Base Response Types ====================

/**
 * Error response structure
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Success response structure
 */
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
}

/**
 * Union type for all API responses
 */
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Type guard to check if response is an error
 */
export function isApiError(response: unknown): response is ApiErrorResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    'success' in response &&
    (response as any).success === false &&
    'error' in response
  );
}

/**
 * Type guard to check if response is successful
 */
export function isApiSuccess<T>(response: unknown): response is ApiSuccessResponse<T> {
  return (
    typeof response === 'object' &&
    response !== null &&
    'success' in response &&
    (response as any).success === true &&
    'data' in response
  );
}

// ==================== Specific API Response Types ====================

/**
 * Workspace API response data
 */
export interface WorkspaceData {
  user: {
    id: string;
    fullName: string;
    email: string;
    role: string;
    departmentId: string | null;
    profileImageUrl: string | null;
    additionalRoles?: Array<{
      role: string;
      departmentId: string;
      divisionId: string;
      missionGroupId: string;
    }>;
  };
  departments: Array<{
    id: string;
    name: string;
    divisionId: string;
    projects: Array<{
      id: string;
      name: string;
      status: string;
    }>;
  }>;
  divisions?: Array<{
    id: string;
    name: string;
    missionGroupId: string;
  }>;
  missionGroups?: Array<{
    id: string;
    name: string;
  }>;
}

/**
 * Project Board API response data
 */
export interface BoardData {
  project: {
    id: string;
    name: string;
    description: string | null;
    status: string;
    progress: number;
    startDate: string | null;
    endDate: string | null;
    departmentId: string;
    ownerId: string | null;
    dateCreated: string;
    dateModified: string;
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
      projects?: Array<{
        id: string;
        name: string;
        status: string;
      }>;
    };
    owner?: {
      id: string;
      fullName: string;
      email: string;
    };
  };
  statuses: Array<{
    id: string;
    name: string;
    color: string;
    order: number;
    statusType: string;
  }>;
  tasks: Array<{
    id: string;
    name: string;
    description: string | null;
    projectId: string;
    statusId: string;
    priority: number;
    startDate: string | null;
    dueDate: string | null;
    assigneeUserId: string | null;
    assigneeUserIds?: string[];
    parentTaskId: string | null;
    isClosed: boolean;
    closeType: string | null;
    closeDate: string | null;
    dateCreated: string;
    dateModified: string;
    assignees?: Array<{
      id: string;
      fullName: string;
      email: string;
      profileImageUrl: string | null;
    }>;
    _count?: {
      subtasks: number;
      comments: number;
      checklists: number;
    };
  }>;
  departmentUsers: Array<{
    id: string;
    fullName: string;
    email: string;
    profileImageUrl: string | null;
    role: string;
  }>;
}

/**
 * Dashboard API response data
 */
export interface DashboardData {
  stats: {
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    inProgressTasks: number;
  };
  overdueTasks: Array<{
    id: string;
    name: string;
    dueDate: string;
    priority: number;
    project?: {
      id: string;
      name: string;
    };
  }>;
  recentActivities: Array<{
    id: string;
    historyText: string;
    createdAt: string;
    user?: {
      id: string;
      fullName: string;
      profileImageUrl: string | null;
    };
  }>;
  myTasks: Array<{
    id: string;
    name: string;
    statusId: string;
    priority: number;
    dueDate: string | null;
    isClosed: boolean;
  }>;
}

/**
 * Task detail API response data
 */
export interface TaskDetailData {
  task: {
    id: string;
    name: string;
    description: string | null;
    projectId: string;
    statusId: string;
    priority: number;
    difficulty: number | null;
    startDate: string | null;
    dueDate: string | null;
    assigneeUserIds?: string[];
    parentTaskId: string | null;
    isClosed: boolean;
    closeType: string | null;
    closeDate: string | null;
    dateCreated: string;
    dateModified: string;
    creatorUserId: string;
    project?: {
      id: string;
      name: string;
      departmentId: string;
    };
    assignees?: Array<{
      id: string;
      fullName: string;
      email: string;
      profileImageUrl: string | null;
    }>;
    status?: {
      id: string;
      name: string;
      color: string;
    };
    creator?: {
      id: string;
      fullName: string;
    };
    closedBy?: {
      id: string;
      fullName: string;
    };
    _count?: {
      subtasks: number;
      comments: number;
      checklists: number;
    };
  };
  comments?: Array<{
    id: string;
    content: string;
    createdAt: string;
    user?: {
      id: string;
      fullName: string;
      profileImageUrl: string | null;
    };
  }>;
  checklists?: Array<{
    id: string;
    name: string;
    isChecked: boolean;
    order: number;
  }>;
  history?: Array<{
    id: string;
    historyText: string;
    createdAt: string;
    user?: {
      id: string;
      fullName: string;
    };
  }>;
}

/**
 * Reports API response data
 */
export interface ReportsData {
  summary: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    overdueTasks: number;
    completionRate: number;
  };
  tasksByStatus: Array<{
    statusName: string;
    count: number;
    color: string;
  }>;
  tasksByPriority: Array<{
    priority: number;
    count: number;
  }>;
  taskCompletionTrend: Array<{
    date: string;
    completed: number;
    created: number;
  }>;
}
