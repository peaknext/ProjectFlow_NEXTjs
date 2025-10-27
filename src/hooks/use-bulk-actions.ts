import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useSyncMutation } from "@/lib/use-sync-mutation";
import { departmentTasksKeys } from "./use-department-tasks";
import { taskKeys } from "./use-tasks";
import { dashboardKeys } from "./use-dashboard";
import { projectKeys } from "./use-projects";

// ============================================
// TYPES
// ============================================

export interface BulkUpdatePayload {
  taskIds: string[];
  updates: {
    statusId?: string;
    priority?: 1 | 2 | 3 | 4;
    assigneeUserId?: string;
    dueDate?: string;
  };
}

export interface BulkUpdateResponse {
  updated: number;
  failed: number;
  tasks: Array<{
    id: string;
    name: string;
    status: any;
    priority: number;
    assignee: any;
    dueDate: string | null;
    updatedAt: string;
  }>;
}

// ============================================
// API FUNCTIONS
// ============================================

async function bulkUpdateTasks(
  payload: BulkUpdatePayload
): Promise<BulkUpdateResponse> {
  const response = await api.post<{ data: BulkUpdateResponse }>(
    "/api/tasks/bulk-update",
    payload
  );
  return response.data;
}

// ============================================
// HOOKS
// ============================================

export function useBulkUpdateTasks(departmentId: string) {
  const queryClient = useQueryClient();

  return useSyncMutation<BulkUpdateResponse, Error, BulkUpdatePayload>({
    mutationFn: bulkUpdateTasks,
    onSuccess: (data) => {
      // Invalidate department tasks query to refetch
      queryClient.invalidateQueries({
        queryKey: departmentTasksKeys.list(departmentId),
      });

      // Invalidate individual task queries (use proper taskKeys)
      data.tasks.forEach((task) => {
        queryClient.invalidateQueries({
          queryKey: taskKeys.detail(task.id),
        });
      });

      // Invalidate dashboard widgets (My Tasks, Overdue, Pinned)
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });

      // Invalidate project boards (tasks may appear in multiple views)
      queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
    onError: (error) => {
      console.error("Bulk update failed:", error);
    },
  });
}
