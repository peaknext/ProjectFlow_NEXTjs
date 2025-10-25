import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSyncMutation } from "@/lib/use-sync-mutation";
import { api } from "@/lib/api-client";
import { DashboardData, UseDashboardOptions } from "@/types/dashboard";

/**
 * Query keys for dashboard data
 */
export const dashboardKeys = {
  all: ["dashboard"] as const,
  detail: (options?: UseDashboardOptions) =>
    [...dashboardKeys.all, options] as const,
};

/**
 * Fetch dashboard data
 *
 * @param options - Query options (limit, offset for pagination)
 * @returns Dashboard data including stats, tasks, activities, etc.
 */
export function useDashboard(options?: UseDashboardOptions) {
  return useQuery({
    queryKey: dashboardKeys.detail(options),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options?.limit) {
        params.append("limit", options.limit.toString());
      }
      if (options?.offset) {
        params.append("offset", options.offset.toString());
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
 * Load more tasks (for pagination)
 *
 * Appends new tasks to the existing myTasks list
 */
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
      // Append new tasks to existing dashboard data
      queryClient.setQueryData(dashboardKeys.detail(), (old: any) => {
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

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(dashboardKeys.detail());

      // Optimistically update the checklist
      queryClient.setQueryData(dashboardKeys.detail(), (old: any) => {
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
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(
          dashboardKeys.detail(),
          context.previousData
        );
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}
