# Optimistic Update Pattern - ProjectFlow Standard

## Overview
มาตรฐานการทำ Optimistic Update สำหรับทุก UI component ใน ProjectFlow เพื่อให้ผู้ใช้ได้รับประสบการณ์การใช้งานที่รวดเร็วและ responsive โดยอัปเดต UI ทันทีก่อนที่จะส่งข้อมูลไปยังเซิร์ฟเวอร์

## Core Principle
**ผู้ใช้ต้องเห็นผลลัพธ์ทันทีเมื่อทำการเปลี่ยนแปลงข้อมูล โดยไม่ต้องรอการตอบกลับจากเซิร์ฟเวอร์**

## Implementation Pattern

### 1. Import Required Dependencies
```typescript
import { useQueryClient } from '@tanstack/react-query';
import { useSyncMutation } from '@/lib/use-sync-mutation'; // Automatic sync animation
```

### 2. Standard Optimistic Update Flow

**Recommended Approach: Use `useSyncMutation` (Automatic)**

```typescript
// In your custom hook (e.g., use-tasks.ts)
import { useSyncMutation } from '@/lib/use-sync-mutation';

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useSyncMutation({
    mutationFn: ({ taskId, data }) => api.patch(`/api/tasks/${taskId}`, data),
    onMutate: async ({ taskId, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: taskKeys.detail(taskId) });

      // Snapshot previous value
      const previousData = queryClient.getQueryData(taskKeys.detail(taskId));

      // Optimistically update cache
      queryClient.setQueryData(taskKeys.detail(taskId), (old: any) => ({
        ...old,
        ...data,
      }));

      return { previousData };
    },
    onError: (error, { taskId }, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(taskKeys.detail(taskId), context.previousData);
      }
    },
    onSettled: (response) => {
      // Sync with server
      if (response?.task) {
        queryClient.invalidateQueries({ queryKey: taskKeys.detail(response.task.id) });
      }
    },
  });
}
```

**Manual Approach: Direct `useSyncStore` (For special cases)**

```typescript
import { useSyncStore } from '@/stores/use-sync-store';
import { useMutation } from '@tanstack/react-query';

const handleUpdate = (updateData) => {
  const { startSync, endSync } = useSyncStore();

  // Step 1: Show sync animation in sidebar
  startSync();
  const syncStartTime = Date.now();
  const MIN_SYNC_TIME = 500;

  // Step 2: Get query key and current data
  const queryKey = [relevantQueryKey];
  const previousData = queryClient.getQueryData(queryKey);

  // Step 3: Update cache optimistically (IMMEDIATELY)
  queryClient.setQueryData(queryKey, (old: any) => {
    if (!old) return old;
    return { ...old, /* Apply changes */ };
  });

  // Step 4: Send mutation to server in background
  mutation.mutate(updateData, {
    onError: (error) => {
      // Step 5a: ROLLBACK on error
      queryClient.setQueryData(queryKey, previousData);

      // Ensure minimum display time
      const elapsed = Date.now() - syncStartTime;
      setTimeout(() => endSync(), Math.max(0, MIN_SYNC_TIME - elapsed));
    },
    onSettled: () => {
      // Step 5b: SYNC with server
      queryClient.invalidateQueries({ queryKey });

      // Ensure minimum display time
      const elapsed = Date.now() - syncStartTime;
      setTimeout(() => endSync(), Math.max(0, MIN_SYNC_TIME - elapsed));
    },
  });
};
```

## Visual Feedback System

### Sync Status in Sidebar Footer
ProjectFlow uses a custom sync status indicator in the sidebar footer instead of traditional toast notifications. This provides a non-intrusive, always-visible status of data synchronization.

**Features:**
- **Normal State**: Shows copyright info and version number
- **Syncing State**: Animated computer-to-database connection (gray icons)
- **Theme-Aware**: Gray colors adapt to light/dark theme
- **Multi-Operation Support**: Handles concurrent sync operations
- **Automatic Hide**: Returns to normal state when all syncs complete
- **Minimum Display Time**: Shows for at least 500ms for visual feedback

**Automatic Integration with `useSyncMutation`:**
```typescript
// In your custom hook (use-tasks.ts, use-projects.ts, etc.)
import { useSyncMutation } from '@/lib/use-sync-mutation';

export function useUpdateTask() {
  return useSyncMutation({
    mutationFn: (data) => api.patch('/api/tasks', data),
    // ... your optimistic update logic
  });
}

// That's it! Sync animation is automatic
```

**Manual Control (for non-mutation operations):**
```typescript
import { useManualSync } from '@/lib/use-sync-mutation';

const sync = useManualSync();

const handleAction = async () => {
  const startTime = sync.start();
  try {
    await someAsyncOperation();
  } finally {
    sync.end(startTime); // Ensures minimum 500ms display
  }
};
```

**Direct Store Access (advanced):**
```typescript
import { useSyncStore } from '@/stores/use-sync-store';

const { startSync, endSync } = useSyncStore();

startSync(); // Show animation
// ... do work
endSync();   // Hide animation
```

**How it works:**
- `startSync()` increments sync counter and shows animation
- `endSync()` decrements sync counter
- Animation hides when counter reaches 0
- Supports multiple concurrent operations
- `useSyncMutation` handles timing automatically

## Real-World Examples

### Example 1: Calendar View - Drag and Drop Task
**File**: `src/components/views/calendar-view/index.tsx`

```typescript
const handleEventDrop = (info: EventDropArg) => {
  const taskId = info.event.id;
  const newDueDate = info.event.end
    ? info.event.end.toISOString()
    : info.event.start.toISOString();

  // Validation
  const task = tasks.find((t) => t.id === taskId);
  if (!task || task.isClosed) {
    info.revert();
    return;
  }

  // Show sync animation
  startSync();

  // Optimistic update
  const queryKey = projectKeys.board(projectId);
  const previousData = queryClient.getQueryData(queryKey);

  queryClient.setQueryData(queryKey, (old: any) => {
    if (!old) return old;
    return {
      ...old,
      tasks: old.tasks.map((t: Task) =>
        t.id === taskId
          ? { ...t, dueDate: newDueDate }
          : t
      ),
    };
  });

  // Server update
  updateTaskMutation.mutate(
    { taskId, data: { dueDate: newDueDate } },
    {
      onError: (error) => {
        queryClient.setQueryData(queryKey, previousData);
        info.revert();
        console.error('Failed to update task due date:', error);
        endSync(); // Hide sync animation
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey });
        endSync(); // Hide sync animation
      },
    }
  );
};
```

### Example 2: Board View - Drag and Drop Between Columns
**Use Case**: ลาก task card ระหว่าง status columns

```typescript
const handleDragEnd = (result) => {
  const { source, destination, draggableId: taskId } = result;

  if (!destination) return;
  if (source.droppableId === destination.droppableId) return;

  const newStatusId = destination.droppableId;

  // Optimistic update
  const queryKey = projectKeys.board(projectId);
  const previousData = queryClient.getQueryData(queryKey);

  queryClient.setQueryData(queryKey, (old: any) => {
    if (!old) return old;
    return {
      ...old,
      tasks: old.tasks.map((t: Task) =>
        t.id === taskId
          ? { ...t, statusId: newStatusId }
          : t
      ),
    };
  });

  // Server update
  updateTaskMutation.mutate(
    { taskId, data: { statusId: newStatusId } },
    {
      onError: (error) => {
        queryClient.setQueryData(queryKey, previousData);
        console.error('Failed to move task:', error);
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey });
      },
    }
  );
};
```

### Example 3: Task Card - Toggle Pin
**Use Case**: กดปุ่ม pin/unpin task

```typescript
const handleTogglePin = (taskId: string, isPinned: boolean) => {
  const newPinnedState = !isPinned;

  // Optimistic update
  const queryKey = projectKeys.board(projectId);
  const previousData = queryClient.getQueryData(queryKey);

  queryClient.setQueryData(queryKey, (old: any) => {
    if (!old) return old;
    return {
      ...old,
      tasks: old.tasks.map((t: Task) =>
        t.id === taskId
          ? { ...t, isPinned: newPinnedState }
          : t
      ),
    };
  });

  // Server update
  updateTaskMutation.mutate(
    { taskId, data: { isPinned: newPinnedState } },
    {
      onError: (error) => {
        queryClient.setQueryData(queryKey, previousData);
        console.error('Failed to toggle pin:', error);
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey });
      },
    }
  );
};
```

### Example 4: Checklist - Toggle Checkbox
**Use Case**: เช็คหรือยกเลิกเช็ค checklist item

```typescript
const handleToggleCheckbox = (checklistId: string, isChecked: boolean) => {
  const newCheckedState = !isChecked;

  // Optimistic update
  const queryKey = taskKeys.detail(taskId);
  const previousData = queryClient.getQueryData(queryKey);

  queryClient.setQueryData(queryKey, (old: any) => {
    if (!old) return old;
    return {
      ...old,
      checklists: old.checklists.map((c: Checklist) =>
        c.id === checklistId
          ? { ...c, isChecked: newCheckedState }
          : c
      ),
    };
  });

  // Server update
  updateChecklistMutation.mutate(
    { checklistId, data: { isChecked: newCheckedState } },
    {
      onError: (error) => {
        queryClient.setQueryData(queryKey, previousData);
        console.error('Failed to toggle checklist:', error);
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey });
      },
    }
  );
};
```

### Example 5: Create New Item (Add to List)
**Use Case**: สร้าง task ใหม่หรือ comment ใหม่

```typescript
const handleCreateTask = (newTaskData) => {
  // Create temporary ID for optimistic update
  const tempId = `temp-${Date.now()}`;
  const optimisticTask = {
    id: tempId,
    ...newTaskData,
    isCreating: true, // Skeleton state
  };

  // Optimistic update - Add to list immediately
  const queryKey = projectKeys.board(projectId);
  const previousData = queryClient.getQueryData(queryKey);

  queryClient.setQueryData(queryKey, (old: any) => {
    if (!old) return old;
    return {
      ...old,
      tasks: [...old.tasks, optimisticTask],
    };
  });

  // Server update
  createTaskMutation.mutate(
    newTaskData,
    {
      onSuccess: (response) => {
        // Replace temporary task with real one
        queryClient.setQueryData(queryKey, (old: any) => {
          if (!old) return old;
          return {
            ...old,
            tasks: old.tasks.map((t: Task) =>
              t.id === tempId ? { ...response.task, isCreating: false } : t
            ),
          };
        });
      },
      onError: (error) => {
        queryClient.setQueryData(queryKey, previousData);
        console.error('Failed to create task:', error);
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey });
      },
    }
  );
};
```

### Example 6: Delete Item (Remove from List)
**Use Case**: ลบ task หรือ comment

```typescript
const handleDeleteTask = (taskId: string) => {
  // Optimistic update - Remove from list immediately
  const queryKey = projectKeys.board(projectId);
  const previousData = queryClient.getQueryData(queryKey);

  queryClient.setQueryData(queryKey, (old: any) => {
    if (!old) return old;
    return {
      ...old,
      tasks: old.tasks.filter((t: Task) => t.id !== taskId),
    };
  });

  // Server update
  deleteTaskMutation.mutate(
    taskId,
    {
      onError: (error) => {
        queryClient.setQueryData(queryKey, previousData);
        console.error('Failed to delete task:', error);
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey });
      },
    }
  );
};
```

## Best Practices

### ✅ DO
1. **Always save previousData** ก่อนทำ optimistic update เพื่อใช้ในการ rollback
2. **Validate before update** ตรวจสอบว่าข้อมูลถูกต้องก่อนทำ optimistic update
3. **Use skeleton states** สำหรับ items ที่กำลังสร้างใหม่ (isCreating, isDeleting)
4. **Handle errors gracefully** แสดง error message และ rollback UI
5. **Invalidate on settled** เพื่อให้ข้อมูล sync กับเซิร์ฟเวอร์เสมอ
6. **Use type safety** ใช้ TypeScript types เพื่อป้องกัน runtime errors

### ❌ DON'T
1. **Don't skip validation** อย่าทำ optimistic update โดยไม่ตรวจสอบข้อมูล
2. **Don't forget rollback** ต้องมี onError handler เสมอ
3. **Don't ignore server state** ต้อง invalidate เพื่อ sync กับเซิร์ฟเวอร์
4. **Don't update multiple queries inconsistently** ถ้ามีหลาย query ที่เกี่ยวข้อง ต้อง update ทั้งหมด
5. **Don't show loading spinners** ในกรณี optimistic update (แสดงผลทันที แทนที่จะรอ)

## Visual Feedback Patterns

### 1. Skeleton State (การสร้างใหม่)
```typescript
// While creating
{
  id: 'temp-123',
  name: taskName,
  isCreating: true, // ← Use this flag
}

// In UI
{task.isCreating && <div className="opacity-50 animate-pulse">...</div>}
```

### 2. Deleting State (การลบ)
```typescript
// While deleting
{
  id: 'task-123',
  isDeleting: true, // ← Use this flag
}

// In UI
{task.isDeleting && <div className="opacity-30 pointer-events-none">...</div>}
```

### 3. Error State (เกิด error)
```typescript
onError: (error) => {
  // Rollback
  queryClient.setQueryData(queryKey, previousData);

  // Show toast/alert
  toast.error('ไม่สามารถอัปเดตได้ กรุณาลองใหม่อีกครั้ง');
}
```

## Query Key Patterns

### Standard Query Keys
```typescript
// Projects
export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (filters: any) => [...projectKeys.lists(), filters] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
  board: (id: string) => [...projectKeys.detail(id), 'board'] as const,
};

// Tasks
export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (filters: any) => [...taskKeys.lists(), filters] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
};
```

## Testing Optimistic Updates

### Test Cases
1. **Success case**: อัปเดต UI ทันที และ sync กับเซิร์ฟเวอร์
2. **Error case**: Rollback UI และแสดง error message
3. **Network delay**: UI อัปเดตทันทีแม้ network ช้า
4. **Concurrent updates**: หลาย user อัปเดตพร้อมกัน
5. **Offline scenario**: ทำงานได้เมื่อ offline (ถ้า support)

## Performance Considerations

### 1. Debouncing for Rapid Changes
```typescript
const debouncedUpdate = useMemo(
  () => debounce((value) => {
    // Optimistic update logic
  }, 300),
  []
);
```

### 2. Batch Updates
```typescript
// Instead of multiple setQueryData calls
queryClient.setQueryData(queryKey, (old: any) => {
  return {
    ...old,
    // Update multiple fields at once
    field1: newValue1,
    field2: newValue2,
    field3: newValue3,
  };
});
```

## Common Use Cases in ProjectFlow

| Feature | Pattern | Priority |
|---------|---------|----------|
| Drag & Drop Tasks | Update + Rollback | High |
| Toggle Pin | Update + Rollback | High |
| Toggle Checklist | Update + Rollback | High |
| Edit Task Name | Debounce + Update | Medium |
| Create Task | Skeleton + Replace | High |
| Delete Task | Remove + Rollback | High |
| Add Comment | Skeleton + Replace | Medium |
| Update Status | Update + Rollback | High |
| Reorder Items | Update + Rollback | Medium |

## Migration Guide

### Before (Without Optimistic Update)
```typescript
const handleUpdate = () => {
  setLoading(true);
  updateMutation.mutate(data, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setLoading(false);
    },
  });
};
```

### After (With Optimistic Update)
```typescript
const handleUpdate = () => {
  const previousData = queryClient.getQueryData(queryKey);

  queryClient.setQueryData(queryKey, (old: any) => ({
    ...old,
    // Apply changes
  }));

  updateMutation.mutate(data, {
    onError: () => {
      queryClient.setQueryData(queryKey, previousData);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
};
```

## Related Files
- `src/hooks/use-tasks.ts` - Task mutations
- `src/hooks/use-projects.ts` - Project mutations and query keys
- `src/components/views/calendar-view/index.tsx` - Calendar drag & drop example
- `src/components/views/board-view/index.tsx` - Board drag & drop (to be updated)

## References
- [TanStack Query - Optimistic Updates](https://tanstack.com/query/latest/docs/react/guides/optimistic-updates)
- [React Query Best Practices](https://tkdodo.eu/blog/react-query-best-practices)

---

**Last Updated**: 2025-10-21
**Author**: Claude (AI Assistant)
**Status**: Active Standard - Apply to all new components
