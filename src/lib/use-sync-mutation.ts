/**
 * useSyncMutation - Wrapper hook for mutations with automatic sync animation
 * Ensures consistent sync status display across all mutations in the app
 */

import { useSyncStore } from '@/stores/use-sync-store';
import { useMutation, UseMutationOptions, UseMutationResult } from '@tanstack/react-query';

const MIN_SYNC_DISPLAY_MS = 500; // Minimum time to show sync animation

interface SyncMutationOptions<TData, TError, TVariables, TContext>
  extends UseMutationOptions<TData, TError, TVariables, TContext> {
  minSyncTime?: number; // Optional: override minimum sync display time
}

/**
 * Enhanced useMutation that automatically shows sync animation in sidebar
 *
 * Usage:
 * ```typescript
 * const mutation = useSyncMutation({
 *   mutationFn: async (data) => api.post('/endpoint', data),
 *   onSuccess: (data) => { ... },
 * });
 * ```
 */
export function useSyncMutation<TData = unknown, TError = unknown, TVariables = void, TContext = unknown>(
  options: SyncMutationOptions<TData, TError, TVariables, TContext>
): UseMutationResult<TData, TError, TVariables, TContext> {
  const { startSync, endSync } = useSyncStore();
  const minSyncTime = options.minSyncTime ?? MIN_SYNC_DISPLAY_MS;

  const { onMutate, onSuccess, onError, onSettled, ...restOptions } = options;

  return useMutation<TData, TError, TVariables, TContext>({
    ...restOptions,
    onMutate: async (variables) => {
      // Start sync animation
      startSync();

      // Track start time for minimum display duration
      const syncStartTime = Date.now();

      // Call original onMutate if provided
      let userContext: TContext | undefined;
      if (onMutate) {
        userContext = await onMutate(variables);
      }

      // Return context with sync metadata
      return {
        ...(userContext && typeof userContext === 'object' ? userContext : {}),
        __syncStartTime: syncStartTime,
      } as TContext;
    },
    onSuccess: (data, variables, context) => {
      // Call original onSuccess if provided
      if (onSuccess) {
        onSuccess(data, variables, context);
      }
    },
    onError: (error, variables, context) => {
      // Call original onError if provided
      if (onError) {
        onError(error, variables, context);
      }
    },
    onSettled: (data, error, variables, context) => {
      // Ensure minimum display time
      const contextWithSync = context as (TContext & { __syncStartTime?: number }) | undefined;
      const syncStartTime = contextWithSync?.__syncStartTime ?? Date.now();
      const elapsed = Date.now() - syncStartTime;
      const delay = Math.max(0, minSyncTime - elapsed);

      setTimeout(() => {
        endSync();
      }, delay);

      // Call original onSettled if provided
      if (onSettled) {
        onSettled(data, error, variables, context);
      }
    },
  });
}

/**
 * Helper function for manual sync control (for non-mutation operations)
 *
 * Usage:
 * ```typescript
 * const sync = useManualSync();
 *
 * const handleAction = async () => {
 *   sync.start();
 *   try {
 *     await someAsyncOperation();
 *   } finally {
 *     sync.end();
 *   }
 * };
 * ```
 */
export function useManualSync(minSyncTime: number = MIN_SYNC_DISPLAY_MS) {
  const { startSync, endSync } = useSyncStore();

  return {
    start: () => {
      startSync();
      return Date.now();
    },
    end: (startTime?: number) => {
      if (startTime) {
        const elapsed = Date.now() - startTime;
        const delay = Math.max(0, minSyncTime - elapsed);
        setTimeout(() => endSync(), delay);
      } else {
        endSync();
      }
    },
    startSync,
    endSync,
  };
}
