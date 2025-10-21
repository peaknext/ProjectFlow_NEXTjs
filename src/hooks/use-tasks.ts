/**
 * useTasks - Hooks for task data fetching and mutations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSyncMutation } from '@/lib/use-sync-mutation';
import { api } from '@/lib/api-client';
import { projectKeys } from './use-projects';

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
  assigneeUserId: string | null;
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
  };
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
  statusId: string;
  priority?: number;
  startDate?: string;
  dueDate?: string;
  assigneeUserId?: string;
  parentTaskId?: string;
  difficulty?: number;
}

export interface UpdateTaskInput {
  name?: string;
  description?: string;
  statusId?: string;
  priority?: number;
  startDate?: string;
  dueDate?: string;
  assigneeUserId?: string;
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

      const url = `/api/tasks${searchParams.toString() ? `?${searchParams}` : ''}`;
      return api.get<{ tasks: Task[] }>(url);
    },
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Create new task
 */
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTaskInput) =>
      api.post<{ task: Task }>('/api/tasks', data),
    onSuccess: (response) => {
      // Invalidate project board to refetch tasks
      queryClient.invalidateQueries({
        queryKey: projectKeys.board(response.task.projectId)
      });
      // Invalidate tasks list
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
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
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: taskKeys.detail(taskId) });

      // Snapshot previous value
      const previousTask = queryClient.getQueryData(taskKeys.detail(taskId));

      // Optimistically update to the new value
      queryClient.setQueryData(taskKeys.detail(taskId), (old: any) => {
        if (!old?.task) return old;
        return {
          ...old,
          task: { ...old.task, ...data },
        };
      });

      return { previousTask };
    },
    onError: (err, { taskId }, context) => {
      // Rollback to previous value on error
      if (context?.previousTask) {
        queryClient.setQueryData(taskKeys.detail(taskId), context.previousTask);
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
    mutationFn: ({ taskId, data }: { taskId: string; data: CloseTaskInput }) =>
      api.post<{ task: Task }>(`/api/tasks/${taskId}/close`, data),
    onMutate: async ({ taskId, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: taskKeys.detail(taskId) });

      // Save previous data
      const previousData = queryClient.getQueryData(taskKeys.detail(taskId));

      // Optimistically update task to closed state
      queryClient.setQueryData(taskKeys.detail(taskId), (old: any) => {
        if (!old?.task) return old;
        return {
          ...old,
          task: {
            ...old.task,
            isClosed: true,
            closeType: data.closeType,
            closeDate: new Date().toISOString(),
          },
        };
      });

      return { previousData };
    },
    onError: (error, { taskId }, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(taskKeys.detail(taskId), context.previousData);
      }
    },
    onSettled: (response) => {
      if (response?.task) {
        // Sync with server
        queryClient.invalidateQueries({ queryKey: taskKeys.detail(response.task.id) });
        queryClient.invalidateQueries({ queryKey: projectKeys.board(response.task.projectId) });
        queryClient.invalidateQueries({ queryKey: taskKeys.history(response.task.id) });
      }
    },
  });
}

/**
 * Delete task
 */
export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) =>
      api.delete(`/api/tasks/${taskId}`),
    onSuccess: (_, taskId) => {
      // Invalidate all task queries
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
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: taskKeys.detail(taskId) });

      // Save previous data
      const previousTask = queryClient.getQueryData(taskKeys.detail(taskId));

      // Optimistically update task's isPinned status
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

      return { previousTask };
    },
    onError: (error, { taskId }, context) => {
      // Rollback on error
      if (context?.previousTask) {
        queryClient.setQueryData(taskKeys.detail(taskId), context.previousTask);
      }
    },
    onSettled: (response, error, { taskId }) => {
      // Sync with server
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(taskId) });
      queryClient.invalidateQueries({ queryKey: ['users', 'me', 'pinned-tasks'] });
    },
  });
}
