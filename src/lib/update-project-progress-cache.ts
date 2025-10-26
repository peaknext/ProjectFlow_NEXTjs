/**
 * Helper to update project progress in React Query cache
 * after optimistic task mutations
 */

import { QueryClient } from '@tanstack/react-query';
import { calculateProgress } from './calculate-progress';
import { projectKeys } from '@/hooks/use-projects';
import { taskKeys } from '@/hooks/use-tasks';

/**
 * Recalculate and update project progress in cache
 *
 * Call this after optimistic task updates to keep progress in sync
 *
 * @param queryClient - React Query client
 * @param projectId - Project ID to update
 *
 * @example
 * ```ts
 * // In onMutate of task mutation
 * onMutate: async ({ taskId, projectId }) => {
 *   // ... update task cache
 *
 *   // Recalculate progress
 *   updateProjectProgressCache(queryClient, projectId);
 * }
 * ```
 */
export function updateProjectProgressCache(
  queryClient: QueryClient,
  projectId: string
): void {
  try {
    // Get board data (has tasks + statuses)
    const boardData = queryClient.getQueryData<any>(
      taskKeys.board(projectId)
    );

    if (!boardData) return;

    const tasks = boardData.tasks || [];
    const statuses = boardData.statuses || [];

    if (tasks.length === 0 || statuses.length === 0) return;

    // Calculate new progress
    const result = calculateProgress(tasks, statuses);

    // Update project cache
    queryClient.setQueryData(projectKeys.detail(projectId), (old: any) => {
      if (!old) return old;

      return {
        ...old,
        progress: result.progress,
        // Note: Don't update progressUpdatedAt here - backend will update it
      };
    });
  } catch (error) {
    // Silently fail - progress update is not critical
    console.warn('Failed to update progress cache:', error);
  }
}
