/**
 * Sync Status Store - Global state for optimistic update sync status
 * Shows visual feedback in sidebar footer when data is being synced
 */

import { create } from 'zustand';

interface SyncState {
  isSyncing: boolean;
  syncCount: number;
  startSync: () => void;
  endSync: () => void;
}

export const useSyncStore = create<SyncState>((set) => ({
  isSyncing: false,
  syncCount: 0,

  startSync: () =>
    set((state) => ({
      syncCount: state.syncCount + 1,
      isSyncing: true,
    })),

  endSync: () =>
    set((state) => {
      const newCount = Math.max(0, state.syncCount - 1);
      return {
        syncCount: newCount,
        isSyncing: newCount > 0,
      };
    }),
}));
