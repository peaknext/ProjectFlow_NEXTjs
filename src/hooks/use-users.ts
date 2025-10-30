/**
 * User Management Hooks
 * React Query hooks for user CRUD operations
 *
 * Features:
 * - User listing with filters, pagination, search
 * - Single user detail query
 * - Create, update, delete mutations
 * - Status toggle with optimistic updates
 * - Bulk operations support
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useSyncMutation } from '@/lib/use-sync-mutation';
import type { User } from '@/types/user';

// ============================================
// TYPES & INTERFACES
// ============================================

export interface UserFilters {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
  departmentId?: string;
}

export interface UserListResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CreateUserInput {
  email: string;
  titlePrefix?: string;  // คำนำหน้าชื่อ (optional)
  firstName: string;     // ชื่อ (required)
  lastName: string;      // นามสกุล (required)
  departmentId: string;
  role: 'ADMIN' | 'CHIEF' | 'LEADER' | 'HEAD' | 'MEMBER' | 'USER';
  jobTitleId?: string;   // Changed from jobTitle to jobTitleId
  jobLevel?: string;
  workLocation?: string;
  internalPhone?: string;
}

export interface UpdateUserInput {
  titlePrefix?: string;  // คำนำหน้าชื่อ (optional)
  firstName?: string;    // ชื่อ (optional for updates)
  lastName?: string;     // นามสกุล (optional for updates)
  departmentId?: string | null;
  role?: 'ADMIN' | 'CHIEF' | 'LEADER' | 'HEAD' | 'MEMBER' | 'USER';
  profileImageUrl?: string | null;
  jobTitleId?: string | null;
  jobLevel?: string;
  workLocation?: string;
  internalPhone?: string;
  notes?: string;
  additionalRoles?: Record<string, string> | null;
}

// ============================================
// QUERY KEYS
// ============================================

/**
 * Hierarchical query keys for user data
 * Pattern matches existing hooks (projects, tasks)
 */
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: UserFilters) => [...userKeys.lists(), filters] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
  stats: () => [...userKeys.all, 'stats'] as const,
};

// ============================================
// QUERY HOOKS
// ============================================

/**
 * useUsers - Fetch paginated user list with filters
 *
 * Features:
 * - Pagination support
 * - Search by name/email
 * - Filter by role, status, department
 * - Scope-based filtering (done by API)
 * - 5-minute stale time
 *
 * @param filters - Pagination, search, and filter options
 * @returns React Query result with users list
 */
export function useUsers(filters: UserFilters = {}) {
  return useQuery({
    queryKey: userKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters.page) params.set('page', filters.page.toString());
      if (filters.limit) params.set('limit', filters.limit.toString());
      if (filters.search) params.set('search', filters.search);
      if (filters.role && filters.role !== 'ALL') params.set('role', filters.role);
      if (filters.status && filters.status !== 'ALL') params.set('status', filters.status);
      if (filters.departmentId) params.set('departmentId', filters.departmentId);

      const response = await api.get<UserListResponse>(`/api/users?${params.toString()}`);
      return response; // API client already extracts .data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: true,
  });
}

/**
 * useUser - Fetch single user details
 *
 * @param userId - User ID to fetch (null to disable query)
 * @returns React Query result with user detail
 */
export function useUser(userId: string | null) {
  return useQuery({
    queryKey: userKeys.detail(userId || ''),
    queryFn: async () => {
      const response = await api.get<{ user: User }>(`/api/users/${userId}`);
      return response.user; // API client already extracts .data
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!userId,
  });
}

// ============================================
// MUTATION HOOKS
// ============================================

/**
 * useCreateUser - Create new user mutation
 *
 * Features:
 * - Sync animation on success
 * - Invalidates user list cache
 * - Adds user to detail cache
 * - Handles validation errors
 *
 * @returns Mutation object with mutateAsync function
 */
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useSyncMutation({
    mutationFn: async (data: CreateUserInput) => {
      const response = await api.post<{ user: User; message: string }>('/api/admin/users', data);
      return response; // API client already extracts .data
    },
    onSuccess: (data) => {
      // Invalidate all user lists to refetch
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });

      // Add newly created user to detail cache
      if (data.user) {
        queryClient.setQueryData(userKeys.detail(data.user.id), data.user);
      }
    },
  });
}

/**
 * useUpdateUser - Update user mutation with optimistic updates
 *
 * Features:
 * - Optimistic update for instant UI feedback
 * - Rollback on error
 * - Updates both detail and list caches
 * - Sync animation
 *
 * @returns Mutation object with mutateAsync function
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useSyncMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: UpdateUserInput }) => {
      const response = await api.patch<{ user: User }>(`/api/users/${userId}`, data);
      return response; // API client already extracts .data
    },
    onMutate: async ({ userId, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: userKeys.detail(userId) });

      // Snapshot the previous value
      const previousUser = queryClient.getQueryData(userKeys.detail(userId));

      // Optimistically update detail cache
      queryClient.setQueryData(userKeys.detail(userId), (old: any) => ({
        ...old,
        ...data,
      }));

      // Optimistically update in all list caches
      const listQueries = queryClient.getQueriesData({ queryKey: userKeys.lists() });
      listQueries.forEach(([queryKey, listData]: [any, any]) => {
        if (listData?.users) {
          queryClient.setQueryData(queryKey, {
            ...listData,
            users: listData.users.map((u: User) =>
              u.id === userId ? { ...u, ...data } : u
            ),
          });
        }
      });

      return { previousUser };
    },
    onError: (error, { userId }, context) => {
      // Rollback to previous value on error
      if (context?.previousUser) {
        queryClient.setQueryData(userKeys.detail(userId), context.previousUser);
      }
    },
    onSettled: (data) => {
      // Refetch to ensure consistency with server
      if (data?.user) {
        queryClient.invalidateQueries({ queryKey: userKeys.detail(data.user.id) });
        queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      }
    },
  });
}

/**
 * useUpdateUserStatus - Toggle user status (ACTIVE/SUSPENDED) with optimistic updates
 *
 * Features:
 * - Instant UI feedback (optimistic)
 * - Rollback on error
 * - Updates all list caches
 * - Session invalidation on suspend (handled by API)
 *
 * @returns Mutation object with mutateAsync function
 */
export function useUpdateUserStatus() {
  const queryClient = useQueryClient();

  return useSyncMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: string }) => {
      const response = await api.patch<{ user: User; sessionsInvalidated: boolean }>(
        `/api/users/${userId}/status`,
        { status }
      );
      return response; // API client already extracts .data
    },
    onMutate: async ({ userId, status }) => {
      // Cancel queries
      await queryClient.cancelQueries({ queryKey: userKeys.lists() });

      // Snapshot all list queries
      const previousLists = queryClient.getQueriesData({ queryKey: userKeys.lists() });

      // Optimistically update status in all lists
      previousLists.forEach(([queryKey, data]: [any, any]) => {
        if (data?.users) {
          queryClient.setQueryData(queryKey, {
            ...data,
            users: data.users.map((u: User) =>
              u.id === userId ? { ...u, userStatus: status } : u
            ),
          });
        }
      });

      // Also update detail cache if exists
      const previousDetail = queryClient.getQueryData(userKeys.detail(userId));
      if (previousDetail) {
        queryClient.setQueryData(userKeys.detail(userId), (old: any) => ({
          ...old,
          userStatus: status,
        }));
      }

      return { previousLists, previousDetail };
    },
    onError: (error, variables, context) => {
      // Rollback all list caches
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]: [any, any]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      // Rollback detail cache
      if (context?.previousDetail) {
        queryClient.setQueryData(userKeys.detail(variables.userId), context.previousDetail);
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}

/**
 * useDeleteUser - Soft delete user mutation
 *
 * Features:
 * - Removes user from list caches immediately
 * - Updates pagination total count
 * - Removes detail cache
 * - Session invalidation (handled by API)
 *
 * @returns Mutation object with mutateAsync function
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useSyncMutation({
    mutationFn: async (userId: string) => {
      const response = await api.delete<{ message: string; userId: string }>(
        `/api/users/${userId}`
      );
      return response; // API client already extracts .data
    },
    onSuccess: (data, userId) => {
      // Remove from all list caches
      const listQueries = queryClient.getQueriesData({ queryKey: userKeys.lists() });
      listQueries.forEach(([queryKey, listData]: [any, any]) => {
        if (listData?.users) {
          queryClient.setQueryData(queryKey, {
            ...listData,
            users: listData.users.filter((u: User) => u.id !== userId),
            pagination: {
              ...listData.pagination,
              total: Math.max(0, listData.pagination.total - 1),
            },
          });
        }
      });

      // Remove detail cache
      queryClient.removeQueries({ queryKey: userKeys.detail(userId) });
    },
  });
}

/**
 * useBulkUpdateUsers - Bulk status change mutation
 *
 * Features:
 * - Updates multiple users at once
 * - Shows progress (via sync animation)
 * - Handles partial failures gracefully
 * - Returns success/failure counts
 *
 * @returns Mutation object with mutateAsync function
 */
export function useBulkUpdateUsers() {
  const queryClient = useQueryClient();

  return useSyncMutation({
    mutationFn: async ({ userIds, status }: { userIds: string[]; status: string }) => {
      // Call API for each user
      // Note: Could be optimized with a dedicated bulk endpoint in future
      const promises = userIds.map((userId) =>
        api.patch(`/api/users/${userId}/status`, { status })
      );

      const results = await Promise.allSettled(promises);

      const succeeded = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;

      return {
        succeeded,
        failed,
        total: userIds.length,
      };
    },
    onSuccess: () => {
      // Invalidate all user lists to refetch
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.details() });
    },
  });
}

// ============================================
// UTILITY HOOKS (Future)
// ============================================

/**
 * useUserStats - Fetch user statistics (placeholder for future)
 *
 * Example usage:
 * - Total users count
 * - Active/Suspended counts by role
 * - Users created this month
 *
 * @returns React Query result with stats
 */
export function useUserStats() {
  return useQuery({
    queryKey: userKeys.stats(),
    queryFn: async () => {
      // TODO: Implement stats endpoint
      // const response = await api.get('/api/users/stats');
      // return response.data;
      return {
        total: 0,
        active: 0,
        suspended: 0,
        byRole: {},
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: false, // Disabled until endpoint is ready
  });
}
