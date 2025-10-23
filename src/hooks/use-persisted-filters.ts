/**
 * usePersistedFilters - จัดการ filter state พร้อม localStorage persistence
 * ใช้สำหรับ Board View, Calendar View, และ List View
 */

import { useState, useEffect } from 'react';
import { TaskFilters } from '@/components/views/common/task-filter-bar';

const STORAGE_KEY = 'projectflow_task_filters';

interface PersistedFilters {
  hideClosed: boolean;
}

const DEFAULT_FILTERS: TaskFilters = {
  search: '',
  statusId: '',
  priorityId: '',
  assigneeId: '',
  hideClosed: true, // Default to hiding closed tasks
};

/**
 * Custom hook สำหรับจัดการ filter state พร้อม localStorage
 * - hideClosed จะถูก persist ไว้ใน localStorage
 * - filters อื่นๆ จะ reset ทุกครั้งที่ refresh
 */
export function usePersistedFilters() {
  const [filters, setFilters] = useState<TaskFilters>(() => {
    // Initialize with default filters
    const defaultFilters = { ...DEFAULT_FILTERS };

    // Try to load hideClosed from localStorage
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const persisted: PersistedFilters = JSON.parse(stored);
          defaultFilters.hideClosed = persisted.hideClosed;
        }
      } catch (error) {
        console.error('Failed to load persisted filters:', error);
      }
    }

    return defaultFilters;
  });

  // Persist hideClosed to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const toStore: PersistedFilters = {
          hideClosed: filters.hideClosed,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
      } catch (error) {
        console.error('Failed to persist filters:', error);
      }
    }
  }, [filters.hideClosed]);

  return [filters, setFilters] as const;
}
