/**
 * useProjects - Hooks for project data fetching and mutations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useSyncMutation } from '@/lib/use-sync-mutation';
import type { Project } from '@/stores/use-app-store';
import type { Task } from '@/hooks/use-tasks';

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
  users?: Array<{
    id: string;
    fullName: string;
    email: string;
    profileImageUrl: string | null;
  }>;
}

interface Status {
  id: string;
  name: string;
  color: string;
  order: number;
  type: string;
}
interface CreateProjectInput {
  name: string;
  description?: string;
  departmentId: string;
  hospMissionId?: string;
  actionPlanId?: string;
  phases?: Array<{
    name: string;
    phaseOrder: number;
    startDate?: string | null;
    endDate?: string | null;
  }>;
  statuses?: Array<{
    name: string;
    color: string;
    order: number;
    statusType: 'NOT_STARTED' | 'IN_PROGRESS' | 'DONE' | 'CANCELED';
  }>;
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

interface ProjectEditDetailsResponse {
  id: string;
  name: string;
  description: string | null;
  departmentName: string;
  divisionName: string;
  missionGroupName: string;
  dateCreated: string;
  phases: Array<{
    id: string;
    name: string;
    startDate: string | null;
    endDate: string | null;
    phaseOrder: number;
  }>;
  statuses: Array<{
    id: string;
    name: string;
    color: string;
    order: number;
  }>;
}

interface EditProjectInput {
  description?: string;
  phases?: Array<{
    id: string;
    startDate: string | null;
    endDate: string | null;
  }>;
  statuses?: Array<{
    id: string;
    color: string;
  }>;
}

// Query keys
export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...projectKeys.lists(), filters] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
  board: (id: string) => [...projectKeys.detail(id), 'board'] as const,
  editDetails: (id: string) => [...projectKeys.all, 'edit-details', id] as const,
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

  return useSyncMutation({
    mutationFn: (data: CreateProjectInput) =>
      api.post<{ project: Project }>('/api/projects', data),
    onMutate: async (newProject) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: projectKeys.lists() });

      // Snapshot previous value
      const previousProjects = queryClient.getQueriesData({ queryKey: projectKeys.lists() });

      // Optimistically add new project to all list caches
      queryClient.setQueriesData({ queryKey: projectKeys.lists() }, (old: any) => {
        if (!old) return old;

        // Create temporary project object with phases data
        const tempProject: any = {
          id: `temp-${Date.now()}`,
          name: newProject.name,
          description: newProject.description || null,
          departmentId: newProject.departmentId,
          actionPlanId: newProject.actionPlanId || null,
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          dateDeleted: null,
          // Add phases array for correct phase display
          phases: newProject.phases?.map((phase, index) => ({
            id: `temp-phase-${Date.now()}-${index}`,
            name: phase.name,
            phaseOrder: phase.phaseOrder,
            startDate: phase.startDate || null,
            endDate: phase.endDate || null,
            projectId: `temp-${Date.now()}`,
          })) || [],
          // Add empty arrays for required relations
          statuses: [],
          tasks: [],
          owner: {
            id: 'temp-owner',
            fullName: 'Loading...',
            email: '',
            profileImageUrl: null,
          },
          department: {
            id: newProject.departmentId,
            name: 'Loading...',
          },
          _count: {
            tasks: 0,
            statuses: newProject.statuses?.length || 0,
            phases: newProject.phases?.length || 0,
          },
        };

        // Add to beginning of list
        if (old.projects) {
          return {
            ...old,
            projects: [tempProject, ...old.projects],
            pagination: {
              ...old.pagination,
              total: old.pagination.total + 1,
            },
          };
        }

        return old;
      });

      return { previousProjects };
    },
    onError: (_error, _newProject, context) => {
      // Rollback on error
      if (context?.previousProjects) {
        context.previousProjects.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
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
 * Delete project (with optimistic update)
 */
export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useSyncMutation({
    mutationFn: (projectId: string) =>
      api.delete(`/api/projects/${projectId}`),
    onMutate: async (projectId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: projectKeys.lists() });

      // Snapshot previous value
      const previousProjects = queryClient.getQueriesData({ queryKey: projectKeys.lists() });

      // Optimistically remove project from all list caches
      queryClient.setQueriesData({ queryKey: projectKeys.lists() }, (old: any) => {
        if (!old || !old.projects) return old;

        return {
          ...old,
          projects: old.projects.filter((p: Project) => p.id !== projectId),
          pagination: {
            ...old.pagination,
            total: old.pagination.total - 1,
          },
        };
      });

      return { previousProjects };
    },
    onError: (_error, _projectId, context) => {
      // Rollback on error
      if (context?.previousProjects) {
        context.previousProjects.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
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

/**
 * Fetch project details for editing (includes phases and statuses)
 */
export function useProjectEditDetails(
  projectId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: projectKeys.editDetails(projectId),
    queryFn: async () => {
      const response = await api.get<{ project: ProjectEditDetailsResponse }>(
        `/api/projects/${projectId}/edit-details`
      );
      return response.project;
    },
    enabled: options?.enabled !== undefined ? options.enabled : !!projectId,
    staleTime: 5 * 60 * 1000, // 5 minutes (match GAS cache)
  });
}

/**
 * Edit project (description, phases dates, statuses colors)
 */
export function useEditProject() {
  const queryClient = useQueryClient();

  return useSyncMutation({
    mutationFn: async ({
      projectId,
      updates,
    }: {
      projectId: string;
      updates: EditProjectInput;
    }) => {
      const response = await api.patch<{ project: Project }>(
        `/api/projects/${projectId}`,
        updates
      );
      return response;
    },
    onSuccess: (_data, { projectId }) => {
      // Invalidate all project-related queries
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.editDetails(projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.board(projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}
