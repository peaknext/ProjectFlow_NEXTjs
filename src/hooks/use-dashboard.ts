import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSyncMutation } from "@/lib/use-sync-mutation";
import { api } from "@/lib/api-client";
import { useFiscalYearStore } from "@/stores/use-fiscal-year-store";
import { DashboardData, UseDashboardOptions, Activity } from "@/types/dashboard";

/**
 * Query keys for dashboard data
 */
export const dashboardKeys = {
  all: ["dashboard"] as const,
  detail: (options?: UseDashboardOptions, fiscalYears?: number[]) =>
    fiscalYears ? [...dashboardKeys.all, options, { fiscalYears }] as const : [...dashboardKeys.all, options] as const,
  activities: () => [...dashboardKeys.all, "activities"] as const,
};

/**
 * Fetch dashboard data
 *
 * @param options - Query options (separate pagination for each widget)
 * @returns Dashboard data including stats, tasks, activities, etc.
 * Now includes fiscal year filtering
 */
export function useDashboard(options?: UseDashboardOptions) {
  const selectedYears = useFiscalYearStore((state) => state.selectedYears);

  return useQuery({
    queryKey: dashboardKeys.detail(options, selectedYears),
    queryFn: async () => {
      const params = new URLSearchParams();

      // Fiscal year filtering
      const yearsParam = selectedYears.join(',');
      params.append("fiscalYears", yearsParam);

      // Separate pagination for each widget
      if (options?.myCreatedTasksLimit) {
        params.append("myCreatedTasksLimit", options.myCreatedTasksLimit.toString());
      }
      if (options?.myCreatedTasksOffset) {
        params.append("myCreatedTasksOffset", options.myCreatedTasksOffset.toString());
      }
      if (options?.assignedToMeTasksLimit) {
        params.append("assignedToMeTasksLimit", options.assignedToMeTasksLimit.toString());
      }
      if (options?.assignedToMeTasksOffset) {
        params.append("assignedToMeTasksOffset", options.assignedToMeTasksOffset.toString());
      }

      const response = await api.get<{ data: DashboardData }>(
        `/api/dashboard?${params}`
      );

      // api.get already extracts .data from { success: true, data: {...} }
      // So response is actually the DashboardData
      return response as unknown as DashboardData;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
  });
}

/**
 * Fetch recent activities (comments + history)
 *
 * Polls every 60 seconds for new activities.
 * Returns up to 30 latest activities merged from comments and history.
 *
 * @returns Activities data with automatic polling
 */
export function useActivities() {
  return useQuery({
    queryKey: dashboardKeys.activities(),
    queryFn: async () => {
      const response = await api.get<{ activities: Activity[]; count: number }>(
        "/api/dashboard/activities"
      );
      return response;
    },
    staleTime: 0, // Always consider stale (for polling)
    refetchInterval: 60000, // Poll every 1 minute (60 seconds)
    refetchIntervalInBackground: false, // Stop polling when tab inactive
  });
}

/**
 * Load more tasks (for pagination)
 *
 * DEPRECATED: No longer used - Dashboard now uses separate pagination
 * for myCreatedTasks and assignedToMeTasks via useDashboard() options
 *
 * Appends new tasks to the existing myTasks list
 */
/* COMMENTED OUT - Dead code, not used anywhere
export function useLoadMoreTasks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (currentOffset: number) => {
      const limit = 10;
      const newOffset = currentOffset + limit;
      const params = new URLSearchParams();
      params.append("limit", limit.toString());
      params.append("offset", newOffset.toString());

      const response = await api.get<DashboardData>(
        `/api/dashboard?${params}`
      );
      return { newTasks: response.myTasks.tasks, hasMore: response.myTasks.hasMore, newOffset };
    },
    onSuccess: ({ newTasks, hasMore }) => {
      // Append new tasks to ALL existing dashboard caches (future-proof)
      queryClient.setQueriesData({ queryKey: dashboardKeys.all }, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          myTasks: {
            ...old.myTasks,
            tasks: [...old.myTasks.tasks, ...newTasks],
            hasMore,
          },
        };
      });
    },
  });
}
*/

/**
 * Refresh dashboard data
 *
 * Force refetch all dashboard data
 */
export function useRefreshDashboard() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
  };
}

/**
 * Toggle checklist item
 *
 * Optimistic update for checklist checkbox with sync animation
 */
export function useToggleChecklistItem() {
  const queryClient = useQueryClient();

  return useSyncMutation({
    mutationFn: async ({
      taskId,
      checklistId,
      isChecked
    }: {
      taskId: string;
      checklistId: string;
      isChecked: boolean;
    }) => {
      const response = await api.patch(
        `/api/tasks/${taskId}/checklists/${checklistId}`,
        { isChecked }
      );
      return response.data;
    },
    onMutate: async ({ checklistId, isChecked }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: dashboardKeys.all });

      // Snapshot ALL previous dashboard caches (future-proof)
      const previousData = queryClient.getQueriesData({ queryKey: dashboardKeys.all });

      // Optimistically update ALL dashboard caches
      queryClient.setQueriesData({ queryKey: dashboardKeys.all }, (old: any) => {
        if (!old?.myChecklists) return old;
        return {
          ...old,
          myChecklists: old.myChecklists.map((group: any) => ({
            ...group,
            items: group.items.map((item: any) =>
              item.id === checklistId ? { ...item, isChecked } : item
            ),
          })),
        };
      });

      return { previousData };
    },
    onError: (error, variables, context) => {
      // Rollback ALL dashboard caches on error
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}
