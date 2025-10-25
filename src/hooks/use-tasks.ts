/**
 * useTasks - Hooks for task data fetching and mutations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSyncMutation } from '@/lib/use-sync-mutation';
import { api } from '@/lib/api-client';
import { projectKeys } from './use-projects';
import { departmentTasksKeys } from './use-department-tasks';
import { updateProjectProgressCache } from '@/lib/update-project-progress-cache';

// Types
export interface Task {
  id: string;
  name: string;
  description: string | null;
  projectId: string;
  statusId: string;
  priority: number;
  startDate: string | null;
  dueDate: string | null;
  assigneeUserId: string | null; // @deprecated - use assigneeUserIds
  assigneeUserIds?: string[]; // New: Array of assignee user IDs
  parentTaskId: string | null;
  isClosed: boolean;
  closeType: 'COMPLETED' | 'ABORTED' | null;
  closedAt: string | null;
  closedBy: string | null;
  difficulty: number | null;
  dateCreated: string;
  dateModified: string;
  isPinned?: boolean;

  // Relations
  assignee?: {
    id: string;
    fullName: string;
    email: string;
    profileImageUrl: string | null;
  }; // @deprecated - use assignees
  assignees?: Array<{
    id: string;
    fullName: string;
    email: string;
    profileImageUrl: string | null;
  }>; // New: Array of assignee users
  status?: {
    id: string;
    name: string;
    color: string;
  };
  _count?: {
    subtasks: number;
    comments: number;
    checklists: number;
  };
}

export interface CreateTaskInput {
  name: string;
  description?: string;
  projectId: string;
  statusId?: string;
  priority?: number;
  difficulty?: number;
  assigneeUserIds?: string[];
  startDate?: string | null;
  dueDate?: string | null;
  parentTaskId?: string | null;
}

export interface UpdateTaskInput {
  name?: string;
  description?: string;
  statusId?: string;
  priority?: number;
  startDate?: string;
  dueDate?: string;
  assigneeUserId?: string; // @deprecated - use assigneeUserIds
  assigneeUserIds?: string[]; // New: Array of assignee user IDs
  difficulty?: number;
}

export interface CloseTaskInput {
  type: 'COMPLETED' | 'ABORTED';
  comment?: string;
}

// Query keys
export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...taskKeys.lists(), filters] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
  comments: (taskId: string) => [...taskKeys.detail(taskId), 'comments'] as const,
  history: (taskId: string) => [...taskKeys.detail(taskId), 'history'] as const,
  checklists: (taskId: string) => [...taskKeys.detail(taskId), 'checklists'] as const,
};

/**
 * Fetch single task details
 */
export function useTask(taskId: string | null) {
  return useQuery({
    queryKey: taskKeys.detail(taskId!),
    queryFn: () => api.get<{ task: Task }>(`/api/tasks/${taskId}`),
    enabled: !!taskId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Fetch tasks with filters
 */
export function useTasks(params?: {
  projectId?: string;
  assigneeUserId?: string;
  statusId?: string;
  priority?: number;
  includeClosed?: boolean;
  parentTaskId?: string;
}) {
  return useQuery({
    queryKey: taskKeys.list(params || {}),
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.projectId) searchParams.set('projectId', params.projectId);
      if (params?.assigneeUserId) searchParams.set('assigneeUserId', params.assigneeUserId);
      if (params?.statusId) searchParams.set('statusId', params.statusId);
      if (params?.priority) searchParams.set('priority', params.priority.toString());
      if (params?.includeClosed) searchParams.set('includeClosed', 'true');
      if (params?.parentTaskId) searchParams.set('parentTaskId', params.parentTaskId);

      const url = `/api/tasks${searchParams.toString() ? `?${searchParams}` : ''}`;
      return api.get<{ tasks: Task[] }>(url);
    },
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Create new task with optimistic updates
 * Matches GAS CreateTaskModal behavior
 */
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useSyncMutation({
    mutationFn: async (data: CreateTaskInput) => {
      return api.post<{ task: Task }>(`/api/projects/${data.projectId}/tasks`, data);
    },

    onMutate: async (data) => {
      const projectId = data.projectId;

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: projectKeys.board(projectId) });

      // Get previous data for rollback
      const previousData = queryClient.getQueryData(projectKeys.board(projectId));

      // Create temporary task for optimistic update
      const tempTask: Task = {
        id: `temp_${Date.now()}`,
        name: data.name,
        description: data.description || null,
        projectId: data.projectId,
        statusId: data.statusId || '',
        priority: data.priority || 3,
        difficulty: data.difficulty || 2,
        assigneeUserId: null,
        assigneeUserIds: data.assigneeUserIds || [],
        parentTaskId: data.parentTaskId || null,
        startDate: data.startDate || null,
        dueDate: data.dueDate || null,
        isClosed: false,
        closeType: null,
        closedAt: null,
        closedBy: null,
        dateCreated: new Date().toISOString(),
        dateModified: new Date().toISOString(),
        _count: {
          subtasks: 0,
          comments: 0,
          checklists: 0,
        },
      };

      // Optimistically add temp task to cache
      queryClient.setQueryData(projectKeys.board(projectId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          tasks: [...(old.tasks || []), tempTask],
        };
      });

      return { previousData, tempTask };
    },

    onSuccess: (response, variables, context) => {
      const projectId = variables.projectId;
      const tempTask = context?.tempTask;

      // Replace temp task with real task from server
      queryClient.setQueryData(projectKeys.board(projectId), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          tasks: (old.tasks || []).map((t: Task) =>
            t.id === tempTask?.id ? response.task : t
          ),
        };
      });

      // Invalidate to ensure consistency across all views
      queryClient.invalidateQueries({ queryKey: projectKeys.board(projectId) });
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({ queryKey: departmentTasksKeys.lists() }); // Department Tasks view
    },

    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(
          projectKeys.board(variables.projectId),
          context.previousData
        );
      }
    },
  });
}

/**
 * Update task
 */
export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useSyncMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: UpdateTaskInput }) =>
      api.patch<{ task: Task }>(`/api/tasks/${taskId}`, data),
    onMutate: async ({ taskId, data }) => {
      // Find projectId from all board caches
      let projectId: string | null = null;
      const boardCaches = queryClient.getQueriesData({ queryKey: projectKeys.all });

      for (const [key, value] of boardCaches) {
        const boardData = value as any;
        if (boardData?.tasks) {
          const task = boardData.tasks.find((t: Task) => t.id === taskId);
          if (task) {
            projectId = task.projectId;
            break;
          }
        }
      }

      // Also check task detail cache
      const taskData: any = queryClient.getQueryData(taskKeys.detail(taskId));
      if (!projectId && taskData?.task?.projectId) {
        projectId = taskData.task.projectId;
      }

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: taskKeys.detail(taskId) });
      if (projectId) {
        await queryClient.cancelQueries({ queryKey: projectKeys.board(projectId) });
      }

      // Snapshot previous values
      const previousTask = queryClient.getQueryData(taskKeys.detail(taskId));
      const previousBoard = projectId ? queryClient.getQueryData(projectKeys.board(projectId)) : null;

      // Optimistically update task detail
      queryClient.setQueryData(taskKeys.detail(taskId), (old: any) => {
        if (!old?.task) return old;
        return {
          ...old,
          task: { ...old.task, ...data },
        };
      });

      // Optimistically update board tasks (for List/Board/Calendar views)
      if (projectId) {
        queryClient.setQueryData(projectKeys.board(projectId), (old: any) => {
          if (!old?.tasks) return old;
          return {
            ...old,
            tasks: old.tasks.map((task: Task) =>
              task.id === taskId ? { ...task, ...data } : task
            ),
          };
        });

        // Recalculate project progress after task update
        updateProjectProgressCache(queryClient, projectId);
      }

      return { previousTask, previousBoard, projectId };
    },
    onError: (err, { taskId }, context) => {
      // Rollback to previous values on error
      if (context?.previousTask) {
        queryClient.setQueryData(taskKeys.detail(taskId), context.previousTask);
      }
      if (context?.previousBoard && context?.projectId) {
        queryClient.setQueryData(projectKeys.board(context.projectId), context.previousBoard);
      }
    },
    onSettled: (response) => {
      if (response?.task) {
        // Refetch task details
        queryClient.invalidateQueries({ queryKey: taskKeys.detail(response.task.id) });
        // Refetch project board
        queryClient.invalidateQueries({
          queryKey: projectKeys.board(response.task.projectId)
        });
        // Refetch history to show changes
        queryClient.invalidateQueries({ queryKey: taskKeys.history(response.task.id) });
      }
    },
  });
}

/**
 * Close task (complete or abort) - with optimistic update
 */
export function useCloseTask() {
  const queryClient = useQueryClient();

  return useSyncMutation({
    mutationFn: ({ taskId, closeType }: { taskId: string; closeType: 'COMPLETED' | 'ABORTED' }) =>
      api.post<{ task: Task }>(`/api/tasks/${taskId}/close`, { type: closeType }),
    onMutate: async ({ taskId, closeType }) => {
      // Find projectId from all board caches
      let projectId: string | null = null;
      const boardCaches = queryClient.getQueriesData({ queryKey: projectKeys.all });

      for (const [key, value] of boardCaches) {
        const boardData = value as any;
        if (boardData?.tasks) {
          const task = boardData.tasks.find((t: Task) => t.id === taskId);
          if (task) {
            projectId = task.projectId;
            break;
          }
        }
      }

      // Also check task detail cache
      const taskData: any = queryClient.getQueryData(taskKeys.detail(taskId));
      if (!projectId && taskData?.task?.projectId) {
        projectId = taskData.task.projectId;
      }

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: taskKeys.detail(taskId) });
      if (projectId) {
        await queryClient.cancelQueries({ queryKey: projectKeys.board(projectId) });
      }

      // Save previous data
      const previousTask = queryClient.getQueryData(taskKeys.detail(taskId));
      const previousBoard = projectId ? queryClient.getQueryData(projectKeys.board(projectId)) : null;

      // Optimistically update task to closed state
      queryClient.setQueryData(taskKeys.detail(taskId), (old: any) => {
        if (!old?.task) return old;
        return {
          ...old,
          task: {
            ...old.task,
            isClosed: true,
            closeType: closeType,
            closeDate: new Date().toISOString(),
          },
        };
      });

      // Optimistically update board cache
      if (projectId) {
        queryClient.setQueryData(projectKeys.board(projectId), (old: any) => {
          if (!old?.tasks) return old;
          return {
            ...old,
            tasks: old.tasks.map((task: Task) =>
              task.id === taskId
                ? { ...task, isClosed: true, closeType: closeType, closeDate: new Date().toISOString() }
                : task
            ),
          };
        });

        // Recalculate project progress after closing task
        updateProjectProgressCache(queryClient, projectId);
      }

      return { previousTask, previousBoard, projectId };
    },
    onError: (error, { taskId }, context) => {
      // Rollback on error
      if (context?.previousTask) {
        queryClient.setQueryData(taskKeys.detail(taskId), context.previousTask);
      }
      if (context?.previousBoard && context?.projectId) {
        queryClient.setQueryData(projectKeys.board(context.projectId), context.previousBoard);
      }
    },
    onSettled: (response) => {
      if (response?.task) {
        // Sync with server
        queryClient.invalidateQueries({ queryKey: taskKeys.detail(response.task.id) });
        queryClient.invalidateQueries({ queryKey: projectKeys.board(response.task.projectId) });
        queryClient.invalidateQueries({ queryKey: taskKeys.history(response.task.id) });
        queryClient.invalidateQueries({ queryKey: departmentTasksKeys.lists() }); // Department Tasks view
      }
    },
  });
}

/**
 * Delete task - with optimistic update
 */
export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useSyncMutation({
    mutationFn: (taskId: string) =>
      api.delete(`/api/tasks/${taskId}`),
    onMutate: async (taskId) => {
      // Find projectId from all board caches
      let projectId: string | null = null;
      const boardCaches = queryClient.getQueriesData({ queryKey: projectKeys.all });

      for (const [key, value] of boardCaches) {
        const boardData = value as any;
        if (boardData?.tasks) {
          const task = boardData.tasks.find((t: Task) => t.id === taskId);
          if (task) {
            projectId = task.projectId;
            break;
          }
        }
      }

      // Also check task detail cache
      const taskData: any = queryClient.getQueryData(taskKeys.detail(taskId));
      if (!projectId && taskData?.task?.projectId) {
        projectId = taskData.task.projectId;
      }

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: taskKeys.detail(taskId) });
      if (projectId) {
        await queryClient.cancelQueries({ queryKey: projectKeys.board(projectId) });
      }

      // Save previous data
      const previousTask = queryClient.getQueryData(taskKeys.detail(taskId));
      const previousBoard = projectId ? queryClient.getQueryData(projectKeys.board(projectId)) : null;

      // Optimistically remove task from board cache
      if (projectId) {
        queryClient.setQueryData(projectKeys.board(projectId), (old: any) => {
          if (!old?.tasks) return old;
          return {
            ...old,
            tasks: old.tasks.filter((task: Task) => task.id !== taskId),
          };
        });
      }

      return { previousTask, previousBoard, projectId };
    },
    onError: (error, taskId, context) => {
      // Rollback on error
      if (context?.previousTask) {
        queryClient.setQueryData(taskKeys.detail(taskId), context.previousTask);
      }
      if (context?.previousBoard && context?.projectId) {
        queryClient.setQueryData(projectKeys.board(context.projectId), context.previousBoard);
      }
    },
    onSettled: (_, __, taskId) => {
      // Sync with server
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

/**
 * Fetch task comments
 */
export function useTaskComments(taskId: string | null) {
  return useQuery({
    queryKey: taskKeys.comments(taskId!),
    queryFn: () => api.get<{ comments: any[] }>(`/api/tasks/${taskId}/comments`),
    enabled: !!taskId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

/**
 * Create task comment (with optimistic update)
 */
export function useCreateComment(taskId: string) {
  const queryClient = useQueryClient();

  return useSyncMutation({
    mutationFn: (data: { content: string; mentionedUserIds: string[] }) =>
      api.post(`/api/tasks/${taskId}/comments`, data),
    onMutate: async (data) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: taskKeys.comments(taskId) });

      // Save previous data
      const previousData = queryClient.getQueryData(taskKeys.comments(taskId));

      // Get current user from session or cache (you might need to adjust this)
      const currentUser = {
        id: 'temp-user-id', // This will be replaced by server response
        fullName: 'You',
        email: '',
        profileImageUrl: null,
      };

      // Create optimistic comment with temporary ID
      const optimisticComment = {
        id: `temp-${Date.now()}`,
        taskId,
        userId: currentUser.id,
        content: data.content,
        mentionedUserIds: data.mentionedUserIds || [],
        createdAt: new Date().toISOString(),
        user: currentUser,
      };

      // Optimistically add comment to list
      queryClient.setQueryData(taskKeys.comments(taskId), (old: any) => {
        if (!old?.comments) return { comments: [optimisticComment] };
        return {
          ...old,
          comments: [optimisticComment, ...old.comments],
        };
      });

      return { previousData };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(taskKeys.comments(taskId), context.previousData);
      }
    },
    onSettled: () => {
      // Sync with server
      queryClient.invalidateQueries({ queryKey: taskKeys.comments(taskId) });
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
      queryClient.invalidateQueries({ queryKey: taskKeys.history(taskId) });
    },
  });
}

/**
 * Fetch task history
 */
export function useTaskHistory(taskId: string | null) {
  return useQuery({
    queryKey: taskKeys.history(taskId!),
    queryFn: () => api.get<{ history: any[] }>(`/api/tasks/${taskId}/history`),
    enabled: !!taskId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Fetch task checklists
 */
export function useTaskChecklists(taskId: string | null) {
  return useQuery({
    queryKey: taskKeys.checklists(taskId!),
    queryFn: () => api.get<{ items: any[] }>(`/api/tasks/${taskId}/checklists`),
    enabled: !!taskId,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Create checklist item
 */
export function useCreateChecklistItem(taskId: string) {
  const queryClient = useQueryClient();

  return useSyncMutation({
    mutationFn: (data: { name: string; order: number }) =>
      api.post(`/api/tasks/${taskId}/checklists`, data),
    onMutate: async (newItem) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: taskKeys.checklists(taskId) });

      // Snapshot previous value
      const previousData = queryClient.getQueryData(taskKeys.checklists(taskId));

      // Optimistically add new item
      queryClient.setQueryData(taskKeys.checklists(taskId), (old: any) => {
        if (!old) return old;

        const tempId = `temp-${Date.now()}`;
        const optimisticItem = {
          id: tempId,
          taskId,
          name: newItem.name,
          isChecked: false,
          order: newItem.order,
        };

        return {
          ...old,
          items: [...(old.items || []), optimisticItem],
          total: (old.total || 0) + 1,
        };
      });

      return { previousData };
    },
    onError: (error, newItem, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(taskKeys.checklists(taskId), context.previousData);
      }
    },
    onSettled: () => {
      // Sync with server
      queryClient.invalidateQueries({ queryKey: taskKeys.checklists(taskId) });
      queryClient.invalidateQueries({ queryKey: taskKeys.history(taskId) });
    },
  });
}

/**
 * Update checklist item (with optimistic update)
 */
export function useUpdateChecklistItem(taskId: string) {
  const queryClient = useQueryClient();

  return useSyncMutation({
    mutationFn: ({ itemId, data }: { itemId: string; data: { isChecked?: boolean; name?: string } }) =>
      api.patch(`/api/tasks/${taskId}/checklists/${itemId}`, data),
    onMutate: async ({ itemId, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: taskKeys.checklists(taskId) });

      // Save previous data
      const previousData = queryClient.getQueryData(taskKeys.checklists(taskId));

      // Optimistically update checklist item
      queryClient.setQueryData(taskKeys.checklists(taskId), (old: any) => {
        if (!old?.items) return old;
        return {
          ...old,
          items: old.items.map((item: any) =>
            item.id === itemId ? { ...item, ...data } : item
          ),
        };
      });

      return { previousData };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(taskKeys.checklists(taskId), context.previousData);
      }
    },
    onSettled: () => {
      // Sync with server
      queryClient.invalidateQueries({ queryKey: taskKeys.checklists(taskId) });
      queryClient.invalidateQueries({ queryKey: taskKeys.history(taskId) });
    },
  });
}

/**
 * Delete checklist item (with optimistic update)
 */
export function useDeleteChecklistItem(taskId: string) {
  const queryClient = useQueryClient();

  return useSyncMutation({
    mutationFn: ({ itemId }: { itemId: string }) =>
      api.delete(`/api/tasks/${taskId}/checklists/${itemId}`),
    onMutate: async ({ itemId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: taskKeys.checklists(taskId) });

      // Save previous data
      const previousData = queryClient.getQueryData(taskKeys.checklists(taskId));

      // Optimistically remove checklist item
      queryClient.setQueryData(taskKeys.checklists(taskId), (old: any) => {
        if (!old?.items) return old;
        return {
          ...old,
          items: old.items.filter((item: any) => item.id !== itemId),
        };
      });

      return { previousData };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(taskKeys.checklists(taskId), context.previousData);
      }
    },
    onSettled: () => {
      // Sync with server
      queryClient.invalidateQueries({ queryKey: taskKeys.checklists(taskId) });
      queryClient.invalidateQueries({ queryKey: taskKeys.history(taskId) });
    },
  });
}

/**
 * Toggle pin task (with optimistic update)
 */
export function useTogglePinTask() {
  const queryClient = useQueryClient();

  return useSyncMutation({
    mutationFn: async ({ taskId, isPinned }: { taskId: string; isPinned: boolean }) => {
      if (isPinned) {
        // Unpin: DELETE with taskId as query param
        return api.delete(`/api/users/me/pinned-tasks?taskId=${taskId}`);
      } else {
        // Pin: POST with taskId in body
        return api.post('/api/users/me/pinned-tasks', { taskId });
      }
    },
    onMutate: async ({ taskId, isPinned }) => {
      // Find projectId from board caches
      let projectId: string | null = null;
      const boardCaches = queryClient.getQueriesData({ queryKey: projectKeys.all });

      for (const [key, value] of boardCaches) {
        const boardData = value as any;
        if (boardData?.tasks) {
          const task = boardData.tasks.find((t: Task) => t.id === taskId);
          if (task) {
            projectId = task.projectId;
            break;
          }
        }
      }

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: taskKeys.detail(taskId) });
      if (projectId) {
        await queryClient.cancelQueries({ queryKey: projectKeys.board(projectId) });
      }

      // Save previous data
      const previousTask = queryClient.getQueryData(taskKeys.detail(taskId));
      const previousBoard = projectId ? queryClient.getQueryData(projectKeys.board(projectId)) : null;

      // Optimistically update task detail
      queryClient.setQueryData(taskKeys.detail(taskId), (old: any) => {
        if (!old?.task) return old;
        return {
          ...old,
          task: {
            ...old.task,
            isPinned: !isPinned, // Toggle the pin status
          },
        };
      });

      // Optimistically update board cache
      if (projectId) {
        queryClient.setQueryData(projectKeys.board(projectId), (old: any) => {
          if (!old?.tasks) return old;
          return {
            ...old,
            tasks: old.tasks.map((task: Task) =>
              task.id === taskId ? { ...task, isPinned: !isPinned } : task
            ),
          };
        });
      }

      return { previousTask, previousBoard, projectId };
    },
    onError: (error, { taskId }, context) => {
      // Rollback on error
      if (context?.previousTask) {
        queryClient.setQueryData(taskKeys.detail(taskId), context.previousTask);
      }
      if (context?.previousBoard && context?.projectId) {
        queryClient.setQueryData(projectKeys.board(context.projectId), context.previousBoard);
      }
    },
    onSettled: (response, error, { taskId }) => {
      // Sync with server
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
      queryClient.invalidateQueries({ queryKey: ['users', 'me', 'pinned-tasks'] });
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

/**
 * Unpin task (simplified hook for dashboard)
 */
export function useUnpinTask() {
  const queryClient = useQueryClient();

  return useSyncMutation({
    mutationFn: async (taskId: string) => {
      return api.delete(`/api/users/me/pinned-tasks?taskId=${taskId}`);
    },
    onMutate: async (taskId: string) => {
      // Cancel outgoing refetches for dashboard
      await queryClient.cancelQueries({ queryKey: ['dashboard'] });

      // Save previous dashboard data
      const previousDashboard = queryClient.getQueryData(['dashboard']);

      // Optimistically remove task from pinned tasks
      queryClient.setQueryData(['dashboard'], (old: any) => {
        if (!old?.pinnedTasks) return old;
        return {
          ...old,
          pinnedTasks: old.pinnedTasks.filter((task: any) => task.id !== taskId),
        };
      });

      return { previousDashboard };
    },
    onError: (error, taskId, context) => {
      // Rollback on error
      if (context?.previousDashboard) {
        queryClient.setQueryData(['dashboard'], context.previousDashboard);
      }
    },
    onSettled: () => {
      // Sync with server
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}

/**
 * Complete task (mark as done - simplified hook for dashboard)
 */
export function useCompleteTask() {
  const queryClient = useQueryClient();

  return useSyncMutation({
    mutationFn: async (taskId: string) => {
      return api.post(`/api/tasks/${taskId}/close`, { type: 'COMPLETED' });
    },
    onMutate: async (taskId: string) => {
      // Cancel outgoing refetches for dashboard
      await queryClient.cancelQueries({ queryKey: ['dashboard'] });

      // Save previous dashboard data
      const previousDashboard = queryClient.getQueryData(['dashboard']);

      // Optimistically update task as completed in myTasks
      queryClient.setQueryData(['dashboard'], (old: any) => {
        if (!old?.myTasks?.tasks) return old;
        return {
          ...old,
          myTasks: {
            ...old.myTasks,
            tasks: old.myTasks.tasks.map((task: any) =>
              task.id === taskId
                ? {
                    ...task,
                    isClosed: true,
                    closeType: 'COMPLETED',
                    status: {
                      ...task.status,
                      type: 'DONE',
                    },
                  }
                : task
            ),
          },
        };
      });

      return { previousDashboard };
    },
    onError: (error, taskId, context) => {
      // Rollback on error
      if (context?.previousDashboard) {
        queryClient.setQueryData(['dashboard'], context.previousDashboard);
      }
    },
    onSettled: () => {
      // Sync with server
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
}
