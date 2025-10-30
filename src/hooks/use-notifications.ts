/**
 * React Query hooks for Notifications
 *
 * Provides hooks for fetching, marking, and managing notifications
 * with optimistic updates and polling support.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useSyncMutation } from "@/lib/use-sync-mutation";

// ============================================
// TYPES
// ============================================

export type NotificationType =
  | "TASK_ASSIGNED"
  | "TASK_UPDATED"
  | "TASK_CLOSED"
  | "COMMENT_MENTION"
  | "PROJECT_UPDATED";

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  isRead: boolean;
  taskId?: string;
  task?: {
    id: string;
    name: string;
    project: {
      id: string;
      name: string;
    };
  };
  triggeredBy?: {
    id: string;
    fullName: string;
    email: string;
    profileImageUrl: string;
  };
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface UnreadCountResponse {
  unreadCount: number;
}

// ============================================
// QUERY KEYS
// ============================================

export const notificationKeys = {
  all: ["notifications"] as const,
  lists: () => [...notificationKeys.all, "list"] as const,
  list: (filters?: { isRead?: boolean; type?: NotificationType }) =>
    [...notificationKeys.lists(), filters] as const,
  unreadCount: () => [...notificationKeys.all, "unread-count"] as const,
};

// ============================================
// HOOKS
// ============================================

/**
 * Fetch notifications with optional filtering
 */
export function useNotifications(filters?: {
  isRead?: boolean;
  type?: NotificationType;
  limit?: number;
  offset?: number;
}) {
  return useQuery<NotificationsResponse>({
    queryKey: notificationKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.isRead !== undefined) {
        params.append("isRead", String(filters.isRead));
      }
      if (filters?.type) {
        params.append("type", filters.type);
      }
      if (filters?.limit) {
        params.append("limit", String(filters.limit));
      }
      if (filters?.offset) {
        params.append("offset", String(filters.offset));
      }

      const response = await api.get<NotificationsResponse>(
        `/api/notifications?${params.toString()}`
      );

      // Ensure we always return a valid NotificationsResponse object
      // Even if the API returns empty/null data
      return {
        notifications: response?.notifications || [],
        total: response?.total || 0,
        limit: response?.limit || (filters?.limit || 50),
        offset: response?.offset || (filters?.offset || 0),
        hasMore: response?.hasMore || false,
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Fetch unread notification count
 * Polls every 1 minute by default
 */
export function useUnreadCount(options?: { refetchInterval?: number }) {
  return useQuery<UnreadCountResponse>({
    queryKey: notificationKeys.unreadCount(),
    queryFn: async () => {
      const response = await api.get<UnreadCountResponse>(
        "/api/notifications/unread-count"
      );

      // Ensure we always return a valid UnreadCountResponse object
      return {
        unreadCount: response?.unreadCount ?? 0,
      };
    },
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: options?.refetchInterval ?? 60 * 1000, // Poll every 1 minute
  });
}

/**
 * Mark single notification as read
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useSyncMutation({
    mutationFn: async (notificationId: string) => {
      const response = await api.patch(`/api/notifications/${notificationId}`);
      return response.data;
    },
    onMutate: async (notificationId: string) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: notificationKeys.all });

      // Save previous state
      const previousNotifications = queryClient.getQueryData(
        notificationKeys.list()
      );
      const previousUnreadCount = queryClient.getQueryData(
        notificationKeys.unreadCount()
      );

      // Optimistically update notification lists
      queryClient.setQueriesData(
        { queryKey: notificationKeys.lists() },
        (old: any) => {
          if (!old?.notifications) return old;
          return {
            ...old,
            notifications: old.notifications.map((n: Notification) =>
              n.id === notificationId ? { ...n, isRead: true } : n
            ),
          };
        }
      );

      // Optimistically update unread count
      queryClient.setQueryData(
        notificationKeys.unreadCount(),
        (old: UnreadCountResponse | undefined) => {
          if (!old) return { unreadCount: 0 };
          return {
            unreadCount: Math.max(0, old.unreadCount - 1),
          };
        }
      );

      return { previousNotifications, previousUnreadCount };
    },
    onError: (error, notificationId, context) => {
      // Rollback on error
      if (context?.previousNotifications) {
        queryClient.setQueryData(
          notificationKeys.list(),
          context.previousNotifications
        );
      }
      if (context?.previousUnreadCount) {
        queryClient.setQueryData(
          notificationKeys.unreadCount(),
          context.previousUnreadCount
        );
      }
    },
    onSettled: () => {
      // Force refetch unread count ทันที (ไม่รอ staleTime)
      queryClient.refetchQueries({
        queryKey: notificationKeys.unreadCount(),
        type: 'active'
      });

      // Invalidate notification lists
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
    },
  });
}

/**
 * Mark all notifications as read
 */
export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useSyncMutation({
    mutationFn: async () => {
      const response = await api.post("/api/notifications/mark-all-read");
      return response.data;
    },
    onMutate: async () => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: notificationKeys.all });

      // Save previous state
      const previousNotifications = queryClient.getQueryData(
        notificationKeys.list()
      );
      const previousUnreadCount = queryClient.getQueryData(
        notificationKeys.unreadCount()
      );

      // Optimistically update all notification lists
      queryClient.setQueriesData(
        { queryKey: notificationKeys.lists() },
        (old: any) => {
          if (!old?.notifications) return old;
          return {
            ...old,
            notifications: old.notifications.map((n: Notification) => ({
              ...n,
              isRead: true,
            })),
          };
        }
      );

      // Optimistically update unread count to 0
      queryClient.setQueryData(notificationKeys.unreadCount(), {
        unreadCount: 0,
      });

      return { previousNotifications, previousUnreadCount };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousNotifications) {
        queryClient.setQueryData(
          notificationKeys.list(),
          context.previousNotifications
        );
      }
      if (context?.previousUnreadCount) {
        queryClient.setQueryData(
          notificationKeys.unreadCount(),
          context.previousUnreadCount
        );
      }
    },
    onSettled: () => {
      // Force refetch unread count ทันที (ไม่รอ staleTime)
      queryClient.refetchQueries({
        queryKey: notificationKeys.unreadCount(),
        type: 'active'
      });

      // Invalidate notification lists
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() });
    },
  });
}

/**
 * Delete notification
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useSyncMutation({
    mutationFn: async (notificationId: string) => {
      const response = await api.delete(`/api/notifications/${notificationId}`);
      return response.data;
    },
    onMutate: async (notificationId: string) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: notificationKeys.all });

      // Save previous state
      const previousNotifications = queryClient.getQueryData(
        notificationKeys.list()
      );
      const previousUnreadCount = queryClient.getQueryData(
        notificationKeys.unreadCount()
      );

      // Find if the notification being deleted is unread
      const notifications =
        (previousNotifications as NotificationsResponse | undefined)?.notifications || [];
      const deletedNotification = notifications.find(
        (n: Notification) => n.id === notificationId
      );
      const wasUnread = deletedNotification && !deletedNotification.isRead;

      // Optimistically remove from lists
      queryClient.setQueriesData(
        { queryKey: notificationKeys.lists() },
        (old: any) => {
          if (!old?.notifications) return old;
          return {
            ...old,
            notifications: old.notifications.filter(
              (n: Notification) => n.id !== notificationId
            ),
            total: old.total - 1,
          };
        }
      );

      // Optimistically update unread count if it was unread
      if (wasUnread) {
        queryClient.setQueryData(
          notificationKeys.unreadCount(),
          (old: UnreadCountResponse | undefined) => {
            if (!old) return { unreadCount: 0 };
            return {
              unreadCount: Math.max(0, old.unreadCount - 1),
            };
          }
        );
      }

      return { previousNotifications, previousUnreadCount };
    },
    onError: (error, notificationId, context) => {
      // Rollback on error
      if (context?.previousNotifications) {
        queryClient.setQueryData(
          notificationKeys.list(),
          context.previousNotifications
        );
      }
      if (context?.previousUnreadCount) {
        queryClient.setQueryData(
          notificationKeys.unreadCount(),
          context.previousUnreadCount
        );
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}
