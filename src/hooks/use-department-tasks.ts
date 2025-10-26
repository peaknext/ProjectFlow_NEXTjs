import { useQuery, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useSyncMutation } from "@/lib/use-sync-mutation";

// ============================================
// TYPES
// ============================================

export interface DepartmentTasksFilters {
  view?: "grouped" | "flat";
  status?: string[]; // Array of status names
  priority?: number[]; // 1-4
  assigneeId?: string;
  search?: string;
  sortBy?: "dueDate" | "priority" | "name" | "createdAt";
  sortDir?: "asc" | "desc";
  includeCompleted?: boolean;
}

export interface TaskAssignee {
  id: string;
  fullName: string;
  profileImageUrl: string | null;
}

export interface TaskStatus {
  id: string;
  name: string;
  color: string;
  type: "NOT_STARTED" | "IN_PROGRESS" | "DONE";
}

export interface ChecklistProgress {
  completed: number;
  total: number;
}

export interface TaskItem {
  id: string;
  name: string;
  description: string | null;
  priority: number;
  status: TaskStatus;
  dueDate: string | null;
  startDate: string | null;
  assignee: TaskAssignee | null;
  createdAt: string;
  updatedAt: string;
  isClosed: boolean;
  closeType: "COMPLETED" | "ABORTED" | null;
  isPinned: boolean;
  isOverdue: boolean;
  isDueSoon: boolean;
  commentsCount: number;
  checklistProgress: ChecklistProgress;
  subtasksCount: number;
  projectId: string; // IMPORTANT: Needed to find correct project statuses
}

export interface ProjectStats {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  dueSoonTasks: number;
}

export interface ProjectGroup {
  id: string;
  name: string;
  description: string | null;
  status: "ACTIVE" | "COMPLETED" | "ON_HOLD" | "ARCHIVED";
  createdAt: string;
  progress: number;
  stats: ProjectStats;
  assignedUsers: TaskAssignee[];
  owner: TaskAssignee;
  statuses: TaskStatus[]; // IMPORTANT: Workflow statuses for this project
  tasks: TaskItem[];
}

export interface DepartmentStats {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  dueSoonTasks: number;
  totalProjects: number;
  activeProjects: number;
  completionRate: number;
}

export interface Department {
  id: string;
  name: string;
  division: {
    id: string;
    name: string;
  };
}

export interface DepartmentTasksResponse {
  department: Department;
  stats: DepartmentStats;
  projects: ProjectGroup[];
  users: User[];
}

// ============================================
// QUERY KEYS
// ============================================

export const departmentTasksKeys = {
  all: ["departmentTasks"] as const,
  lists: () => [...departmentTasksKeys.all, "list"] as const,
  list: (departmentId: string, filters?: DepartmentTasksFilters) =>
    [...departmentTasksKeys.lists(), departmentId, filters] as const,
};

// ============================================
// QUERY FUNCTIONS
// ============================================

async function fetchDepartmentTasks(
  departmentId: string,
  filters?: DepartmentTasksFilters
): Promise<DepartmentTasksResponse> {
  const params = new URLSearchParams();

  if (filters?.view) params.append("view", filters.view);
  if (filters?.status && filters.status.length > 0) {
    params.append("status", filters.status.join(","));
  }
  if (filters?.priority && filters.priority.length > 0) {
    params.append("priority", filters.priority.join(","));
  }
  if (filters?.assigneeId) params.append("assigneeId", filters.assigneeId);
  if (filters?.search) params.append("search", filters.search);
  if (filters?.sortBy) params.append("sortBy", filters.sortBy);
  if (filters?.sortDir) params.append("sortDir", filters.sortDir);
  if (filters?.includeCompleted !== undefined) {
    params.append("includeCompleted", String(filters.includeCompleted));
  }

  const queryString = params.toString();
  const url = `/api/departments/${departmentId}/tasks${
    queryString ? `?${queryString}` : ""
  }`;

  const response = await api.get<DepartmentTasksResponse>(url);
  return response;
}

// ============================================
// HOOKS
// ============================================

export function useDepartmentTasks(
  departmentId: string,
  filters?: DepartmentTasksFilters,
  options?: Omit<
    UseQueryOptions<DepartmentTasksResponse, Error>,
    "queryKey" | "queryFn"
  >
) {
  return useQuery<DepartmentTasksResponse, Error>({
    queryKey: departmentTasksKeys.list(departmentId, filters),
    queryFn: () => fetchDepartmentTasks(departmentId, filters),
    staleTime: 0, // Always refetch to see changes immediately
    gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
    refetchOnMount: true,
    ...options,
  });
}

// ============================================
// MUTATION FUNCTIONS
// ============================================

/**
 * Update task with optimistic updates
 */
export function useUpdateDepartmentTask(departmentId: string, filters?: DepartmentTasksFilters) {
  const queryClient = useQueryClient();
  const queryKey = departmentTasksKeys.list(departmentId, filters);

  return useSyncMutation({
    mutationFn: async ({ taskId, data }: { taskId: string; data: Partial<TaskItem> }) => {
      const response = await api.patch(`/api/tasks/${taskId}`, data);
      return response;
    },
    onMutate: async ({ taskId, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous value
      const previousData = queryClient.getQueryData<DepartmentTasksResponse>(queryKey);

      // Optimistically update the cache
      if (previousData) {
        queryClient.setQueryData<DepartmentTasksResponse>(queryKey, (old) => {
          if (!old) return old;

          const updatedProjects = old.projects.map((project) => ({
            ...project,
            tasks: project.tasks.map((task) =>
              task.id === taskId ? { ...task, ...data } : task
            ),
          }));

          return {
            ...old,
            projects: updatedProjects,
          };
        });
      }

      return { previousData };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

/**
 * Toggle task pin status with optimistic updates
 */
export function useToggleDepartmentTaskPin(departmentId: string, filters?: DepartmentTasksFilters) {
  const queryClient = useQueryClient();
  const queryKey = departmentTasksKeys.list(departmentId, filters);

  return useSyncMutation({
    mutationFn: async ({ taskId, isPinned }: { taskId: string; isPinned: boolean }) => {
      if (isPinned) {
        // Unpin
        const response = await api.delete(`/api/users/me/pinned-tasks?taskId=${taskId}`);
        return response;
      } else {
        // Pin
        const response = await api.post('/api/users/me/pinned-tasks', { taskId });
        return response;
      }
    },
    onMutate: async ({ taskId, isPinned }) => {
      await queryClient.cancelQueries({ queryKey });

      const previousData = queryClient.getQueryData<DepartmentTasksResponse>(queryKey);

      if (previousData) {
        queryClient.setQueryData<DepartmentTasksResponse>(queryKey, (old) => {
          if (!old) return old;

          const updatedProjects = old.projects.map((project) => ({
            ...project,
            tasks: project.tasks.map((task) =>
              task.id === taskId ? { ...task, isPinned: !isPinned } : task
            ),
          }));

          return {
            ...old,
            projects: updatedProjects,
          };
        });
      }

      return { previousData };
    },
    onError: (error, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

/**
 * Close/Complete task with optimistic updates
 */
export function useCloseDepartmentTask(departmentId: string, filters?: DepartmentTasksFilters) {
  const queryClient = useQueryClient();
  const queryKey = departmentTasksKeys.list(departmentId, filters);

  return useSyncMutation({
    mutationFn: async ({ taskId, closeType }: { taskId: string; closeType: 'COMPLETED' | 'ABORTED' }) => {
      const response = await api.post(`/api/tasks/${taskId}/close`, { type: closeType });
      return response;
    },
    onMutate: async ({ taskId, closeType }) => {
      await queryClient.cancelQueries({ queryKey });

      const previousData = queryClient.getQueryData<DepartmentTasksResponse>(queryKey);

      if (previousData) {
        queryClient.setQueryData<DepartmentTasksResponse>(queryKey, (old) => {
          if (!old) return old;

          const updatedProjects = old.projects.map((project) => ({
            ...project,
            tasks: project.tasks.map((task) =>
              task.id === taskId ? { ...task, isClosed: true, closeType } : task
            ),
          }));

          return {
            ...old,
            projects: updatedProjects,
          };
        });
      }

      return { previousData };
    },
    onError: (error, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}
