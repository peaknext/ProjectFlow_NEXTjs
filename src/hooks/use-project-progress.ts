/**
 * Frontend hook for hybrid project progress calculation
 *
 * Strategy:
 * 1. Use cached progress from backend by default
 * 2. Recalculate on frontend only when there are optimistic updates
 * 3. Provides instant UI feedback without API calls
 */

import { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { calculateProgress } from '@/lib/calculate-progress';
import { projectKeys } from './use-projects';
import { taskKeys } from './use-tasks';

interface UseProjectProgressOptions {
  projectId: string;
  /**
   * Force recalculation even without optimistic updates
   * Useful for filtered views or "what-if" scenarios
   */
  forceRecalculate?: boolean;
}

/**
 * Get project progress using hybrid approach
 *
 * - Returns cached backend value by default
 * - Recalculates on frontend when there are local changes
 * - Provides instant UI updates after optimistic mutations
 *
 * @example
 * ```tsx
 * function ProjectCard({ projectId }) {
 *   const progress = useProjectProgress({ projectId });
 *
 *   return <ProgressBar value={progress} />;
 * }
 * ```
 */
export function useProjectProgress({
  projectId,
  forceRecalculate = false,
}: UseProjectProgressOptions): number {
  const queryClient = useQueryClient();

  // Get cached board data (tasks + statuses)
  const boardData = queryClient.getQueryData<any>(
    ['projects', projectId, 'board']
  );

  // Get cached project data
  const project = queryClient.getQueryData<any>(
    ['projects', projectId]
  );

  return useMemo(() => {
    // If have board data with tasks, calculate from it
    if (boardData?.tasks && boardData?.statuses) {
      const tasks = boardData.tasks;
      const statuses = boardData.statuses;

      if (tasks.length > 0 && statuses.length > 0) {
        const result = calculateProgress(tasks, statuses);
        return result.progress;
      }
    }

    // Fallback: use cached progress from backend
    if (project?.progress != null) {
      return project.progress;
    }

    // Default: 0
    return 0;
  }, [boardData, project, forceRecalculate]);
}

/**
 * Get detailed progress information
 * Useful for showing detailed stats
 */
export function useProjectProgressDetails(projectId: string) {
  const queryClient = useQueryClient();

  return useMemo(() => {
    const project = queryClient.getQueryData<any>(
      projectKeys.detail(projectId)
    );
    const boardData = queryClient.getQueryData<any>(
      projectKeys.board(projectId)
    );

    if (!project) {
      return {
        progress: 0,
        completedWeight: 0,
        totalWeight: 0,
        maxStatusOrder: 0,
        totalTasks: 0,
        completedTasks: 0,
        abortedTasks: 0,
        openTasks: 0,
        source: 'none' as const,
      };
    }

    // Try to calculate from local data first
    if (boardData) {
      const tasks = boardData.tasks || [];
      const statuses = boardData.statuses || project.statuses || [];

      if (tasks.length > 0 && statuses.length > 0) {
        const result = calculateProgress(tasks, statuses);
        return {
          ...result,
          source: 'frontend' as const,
        };
      }
    }

    // Fallback to backend cached value
    return {
      progress: project.progress ?? 0,
      completedWeight: 0,
      totalWeight: 0,
      maxStatusOrder: 0,
      totalTasks: 0,
      completedTasks: 0,
      abortedTasks: 0,
      openTasks: 0,
      source: 'backend' as const,
    };
  }, [projectId, queryClient]);
}

/**
 * Check if progress needs recalculation
 * Used internally by optimistic update hooks
 */
export function useHasStaleProgress(projectId: string): boolean {
  const queryClient = useQueryClient();

  return useMemo(() => {
    const project = queryClient.getQueryData<any>(
      projectKeys.detail(projectId)
    );
    const boardData = queryClient.getQueryData<any>(
      projectKeys.board(projectId)
    );

    if (!project || !boardData) return false;

    // Check if tasks have been modified (isFetching is false but data is different)
    const queryState = queryClient.getQueryState(projectKeys.board(projectId));

    // If there are pending mutations, progress is stale
    return (queryState?.status === 'success' && !queryState.isFetching) || false;
  }, [projectId, queryClient]);
}
