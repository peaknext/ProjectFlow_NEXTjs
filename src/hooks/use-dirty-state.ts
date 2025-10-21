import { useMemo } from 'react';

/**
 * useDirtyState Hook
 *
 * Compares initial data with current data to determine if form is "dirty".
 * Uses deep equality check via JSON serialization.
 *
 * @param initialData - The initial/original data
 * @param currentData - The current/modified data
 * @returns boolean - true if data has changed
 *
 * @example
 * const isDirty = useDirtyState(initialTaskData, currentTaskData);
 * <Button disabled={!isDirty}>Save Changes</Button>
 */
export function useDirtyState<T>(
  initialData: T | undefined | null,
  currentData: T | undefined | null
): boolean {
  const isDirty = useMemo(() => {
    if (initialData === undefined || initialData === null) return false;
    if (currentData === undefined || currentData === null) return false;

    try {
      const initial = JSON.stringify(initialData);
      const current = JSON.stringify(currentData);
      return initial !== current;
    } catch (error) {
      console.error('[useDirtyState] Serialization error:', error);
      return false;
    }
  }, [initialData, currentData]);

  return isDirty;
}

/**
 * useDirtyFields Hook
 *
 * Returns a set of field names that have changed from initial state.
 * Useful for partial updates or field-level dirty checking.
 *
 * @param initialData - The initial/original data (object)
 * @param currentData - The current/modified data (object)
 * @returns Set<string> - Set of changed field names
 *
 * @example
 * const dirtyFields = useDirtyFields(initialTask, currentTask);
 * if (dirtyFields.has('name')) {
 *   // Task name was changed
 * }
 */
export function useDirtyFields<T extends Record<string, any>>(
  initialData: T | undefined | null,
  currentData: T | undefined | null
): Set<string> {
  const dirtyFields = useMemo(() => {
    const fields = new Set<string>();

    if (!initialData || !currentData) return fields;

    // Get all keys from both objects
    const allKeys = new Set([
      ...Object.keys(initialData),
      ...Object.keys(currentData)
    ]);

    // Compare each field
    allKeys.forEach((key) => {
      const initialValue = initialData[key];
      const currentValue = currentData[key];

      // Deep comparison via JSON
      try {
        if (JSON.stringify(initialValue) !== JSON.stringify(currentValue)) {
          fields.add(key);
        }
      } catch (error) {
        // If serialization fails, use strict equality
        if (initialValue !== currentValue) {
          fields.add(key);
        }
      }
    });

    return fields;
  }, [initialData, currentData]);

  return dirtyFields;
}

/**
 * getChangedFields Utility
 *
 * Returns an object containing only the fields that have changed.
 * Useful for PATCH requests with partial updates.
 *
 * @param initialData - The initial/original data
 * @param currentData - The current/modified data
 * @returns Partial<T> - Object with only changed fields
 *
 * @example
 * const changes = getChangedFields(initialTask, currentTask);
 * // { name: 'New Name', priority: 1 }
 * await api.patch(`/api/tasks/${taskId}`, changes);
 */
export function getChangedFields<T extends Record<string, any>>(
  initialData: T | undefined | null,
  currentData: T | undefined | null
): Partial<T> {
  const changes: Partial<T> = {};

  if (!initialData || !currentData) return changes;

  // Get all keys from current data
  const keys = Object.keys(currentData) as Array<keyof T>;

  keys.forEach((key) => {
    const initialValue = initialData[key];
    const currentValue = currentData[key];

    // Deep comparison via JSON
    try {
      if (JSON.stringify(initialValue) !== JSON.stringify(currentValue)) {
        changes[key] = currentValue;
      }
    } catch (error) {
      // If serialization fails, use strict equality
      if (initialValue !== currentValue) {
        changes[key] = currentValue;
      }
    }
  });

  return changes;
}
