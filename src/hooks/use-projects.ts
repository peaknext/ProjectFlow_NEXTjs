/**
 * useProjects - Hooks for project data fetching and mutations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { Project } from '@/stores/use-app-store';

// Types
interface ProjectsResponse {
  projects: Project[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface ProjectBoardResponse {
  project: Project;
  statuses: Status[];
  tasks: Task[];
}

interface Status {
  id: string;
  name: string;
  color: string;
  order: number;
  type: string;
}

interface Task {
  id: string;
  name: string;
  description: string | null;
  statusId: string;
  priority: number;
  startDate: string | null;
  dueDate: string | null;
  assigneeUserId: string | null;
  isClosed: boolean;
  closeType: string | null;
  dateCreated: string;
  dateModified: string;
}

interface CreateProjectInput {
  name: string;
  description?: string;
  departmentId: string;
  actionPlanId?: string;
  startDate?: string;
  endDate?: string;
  status?: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD' | 'ARCHIVED';
  color?: string;
}

interface UpdateProjectInput {
  name?: string;
  description?: string;
  departmentId?: string;
  actionPlanId?: string;
  startDate?: string;
  endDate?: string;
  status?: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD' | 'ARCHIVED';
  color?: string;
}

// Query keys
export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...projectKeys.lists(), filters] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
  board: (id: string) => [...projectKeys.detail(id), 'board'] as const,
};

/**
 * Fetch all projects with optional filters
 */
export function useProjects(params?: {
  page?: number;
  limit?: number;
  search?: string;
  departmentId?: string;
  status?: string;
}) {
  return useQuery({
    queryKey: projectKeys.list(params || {}),
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (params?.search) searchParams.set('search', params.search);
      if (params?.departmentId) searchParams.set('departmentId', params.departmentId);
      if (params?.status) searchParams.set('status', params.status);

      const url = `/api/projects${searchParams.toString() ? `?${searchParams}` : ''}`;
      return api.get<ProjectsResponse>(url);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch single project with board data (statuses + tasks)
 */
export function useProject(projectId: string | null) {
  return useQuery({
    queryKey: projectKeys.board(projectId!),
    queryFn: () => api.get<ProjectBoardResponse>(`/api/projects/${projectId}/board`),
    enabled: !!projectId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Fetch project details only (without tasks)
 */
export function useProjectDetails(projectId: string | null) {
  return useQuery({
    queryKey: projectKeys.detail(projectId!),
    queryFn: () => api.get<{ project: Project }>(`/api/projects/${projectId}`),
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Create new project
 */
export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProjectInput) =>
      api.post<{ project: Project }>('/api/projects', data),
    onSuccess: () => {
      // Invalidate projects list to refetch
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}

/**
 * Update project
 */
export function useUpdateProject(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProjectInput) =>
      api.patch<{ project: Project }>(`/api/projects/${projectId}`, data),
    onSuccess: () => {
      // Invalidate specific project and list
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}

/**
 * Delete project
 */
export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: string) =>
      api.delete(`/api/projects/${projectId}`),
    onSuccess: () => {
      // Invalidate projects list
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}

/**
 * Archive/Unarchive project
 */
export function useArchiveProject(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (archive: boolean) =>
      api.patch(`/api/projects/${projectId}`, {
        status: archive ? 'ARCHIVED' : 'ACTIVE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}
