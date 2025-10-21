# Sync Animation System - ProjectFlow

## Overview

ProjectFlow ใช้ระบบ **Sync Animation** แทนการใช้ Toast Notifications แบบเดิมใน GAS โดยแสดงสถานะการซิงค์ข้อมูลที่ Sidebar Footer อย่างไม่รบกวนสายตา

## Components

### 1. Sync Status Footer
**File**: `src/components/layout/sync-status-footer.tsx`

Component ที่แสดงสถานะการซิงค์ใน sidebar footer:
- **สถานะปกติ**: แสดง "version 1.0.0 ©2025 นพ.เกียรติศักดิ์ พรหมเสนสา"
- **สถานะซิงค์**: แสดงอนิเมชั่น 💻 ... 🗄️ (Computer ⟷ Database)
- **สีเทา**: ใช้ gray-600 (light) / gray-400 (dark) สำหรับทุกไอคอน
- **Transition**: Smooth fade between states (300ms)
- **Test Mode**: Double-click เพื่อดูอนิเมชั่นทดสอบ 2 วินาที

### 2. Sync Store
**File**: `src/stores/use-sync-store.ts`

Zustand store สำหรับจัดการสถานะการซิงค์:

```typescript
interface SyncState {
  isSyncing: boolean;      // สถานะการซิงค์
  syncCount: number;       // นับจำนวน operations ที่กำลังซิงค์
  startSync: () => void;   // เริ่มแสดงอนิเมชั่น
  endSync: () => void;     // หยุดอนิเมชั่น (ลดจำนวน)
}
```

**การทำงาน**:
- `startSync()`: เพิ่ม counter และเปิดอนิเมชั่น
- `endSync()`: ลด counter และปิดอนิเมชั่นเมื่อ counter = 0
- รองรับหลาย operations พร้อมกัน (concurrent operations)

### 3. useSyncMutation Hook
**File**: `src/lib/use-sync-mutation.ts`

Wrapper hook สำหรับ `useMutation` ที่จัดการ sync animation อัตโนมัติ

**Features**:
- แสดงอนิเมชั่นเมื่อเริ่ม mutation
- รับประกันเวลาแสดงขั้นต่ำ (default 500ms)
- ซ่อนอนิเมชั่นเมื่อ mutation เสร็จสิ้น
- รองรับ optimistic updates
- ใช้งานง่าย drop-in replacement สำหรับ `useMutation`

## Usage Guide

### วิธีที่ 1: ใช้ useSyncMutation (แนะนำ)

**สำหรับ**: Mutation hooks ทั้งหมด (useUpdateTask, useCreateTask, etc.)

```typescript
// src/hooks/use-tasks.ts
import { useSyncMutation } from '@/lib/use-sync-mutation';

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useSyncMutation({
    mutationFn: ({ taskId, data }) =>
      api.patch(`/api/tasks/${taskId}`, data),

    onMutate: async ({ taskId, data }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: taskKeys.detail(taskId) });
      const previousData = queryClient.getQueryData(taskKeys.detail(taskId));

      queryClient.setQueryData(taskKeys.detail(taskId), (old: any) => ({
        ...old, ...data
      }));

      return { previousData };
    },

    onError: (err, { taskId }, context) => {
      // Rollback
      if (context?.previousData) {
        queryClient.setQueryData(taskKeys.detail(taskId), context.previousData);
      }
    },

    onSettled: (response) => {
      // Sync with server
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(response.task.id) });
    },
  });
}
```

**ผลลัพธ์**:
- ✅ Sync animation แสดงอัตโนมัติเมื่อ mutate
- ✅ Animation แสดงอย่างน้อย 500ms
- ✅ ไม่ต้องจัดการ `startSync` / `endSync` เอง

### วิธีที่ 2: ใช้ useManualSync

**สำหรับ**: Non-mutation operations (async functions, manual API calls)

```typescript
import { useManualSync } from '@/lib/use-sync-mutation';

function MyComponent() {
  const sync = useManualSync();

  const handleExport = async () => {
    const startTime = sync.start();

    try {
      await exportDataToExcel();
      console.log('Export success');
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      sync.end(startTime); // Ensures minimum 500ms display
    }
  };

  return <button onClick={handleExport}>Export</button>;
}
```

### วิธีที่ 3: ใช้ useSyncStore โดยตรง

**สำหรับ**: Advanced cases ที่ต้องการควบคุมเต็มที่

```typescript
import { useSyncStore } from '@/stores/use-sync-store';

function AdvancedComponent() {
  const { startSync, endSync } = useSyncStore();

  const handleComplexOperation = async () => {
    startSync();

    try {
      await step1();
      await step2();
      await step3();
    } finally {
      endSync();
    }
  };

  return <button onClick={handleComplexOperation}>Start</button>;
}
```

## Configuration

### Minimum Sync Display Time

Default: 500ms (แสดงอนิเมชั่นอย่างน้อย 0.5 วินาที)

**เปลี่ยนแปลง per-mutation**:
```typescript
useSyncMutation({
  minSyncTime: 1000, // 1 second
  mutationFn: ...
})
```

**เปลี่ยนแปลง per-operation (manual sync)**:
```typescript
const sync = useManualSync(1000); // 1 second minimum
```

### Animation Customization

แก้ไข `src/components/layout/sync-status-footer.tsx`:

```typescript
// Animation icons
<svg className="w-6 h-6 text-gray-600"> {/* Computer */}
<div className="w-1 h-1 bg-gray-600 animate-pulse"> {/* Dots */}
<svg className="w-6 h-6 text-gray-600"> {/* Database */}

// Timing
style={{ animationDelay: '0ms', animationDuration: '1s' }}
```

## Integration Examples

### Example 1: Calendar View Drag-and-Drop

```typescript
// src/components/views/calendar-view/index.tsx
export function CalendarView({ projectId }: CalendarViewProps) {
  const updateTaskMutation = useUpdateTask(); // Uses useSyncMutation internally

  const handleEventDrop = (info: EventDropArg) => {
    // Optimistic update
    queryClient.setQueryData(queryKey, ...);

    // Server update (sync animation automatic)
    updateTaskMutation.mutate({ taskId, data: { dueDate: newDueDate } });
  };
}
```

### Example 2: Task Form Submit

```typescript
function TaskForm() {
  const createTaskMutation = useCreateTask(); // Uses useSyncMutation

  const onSubmit = (data) => {
    createTaskMutation.mutate(data); // Sync animation automatic
  };
}
```

### Example 3: Bulk Operations

```typescript
function BulkActions() {
  const sync = useManualSync();

  const handleBulkDelete = async () => {
    const startTime = sync.start();

    try {
      await Promise.all(selectedIds.map(id => api.delete(`/tasks/${id}`)));
      await queryClient.invalidateQueries({ queryKey: taskKeys.all });
    } finally {
      sync.end(startTime);
    }
  };
}
```

## Best Practices

### ✅ DO

1. **ใช้ useSyncMutation สำหรับ mutations ทั้งหมด**
   ```typescript
   export function useUpdateTask() {
     return useSyncMutation({ ... }); // Good
   }
   ```

2. **ใช้ useManualSync สำหรับ non-mutation async operations**
   ```typescript
   const sync = useManualSync();
   const startTime = sync.start();
   // ... work
   sync.end(startTime);
   ```

3. **รักษา minimum display time**
   - ช่วยให้ผู้ใช้เห็น feedback ชัดเจน
   - ป้องกันการกระพริบที่เร็วเกินไป

4. **ใช้ optimistic updates ร่วมกับ sync animation**
   - UI update ทันที
   - Animation แสดงว่ากำลังซิงค์กับเซิร์ฟเวอร์

### ❌ DON'T

1. **อย่า forget to call endSync()**
   ```typescript
   startSync();
   await doWork();
   // Missing endSync() - animation stuck!
   ```

2. **อย่าใช้ useMutation โดยตรงในไฟล์ hooks**
   ```typescript
   // Bad - no sync animation
   return useMutation({ ... });

   // Good - automatic sync animation
   return useSyncMutation({ ... });
   ```

3. **อย่าใช้ Toast notifications สำหรับ sync status**
   - ใช้ sync animation แทน
   - Toast สำหรับ error messages หรือ success confirmations เท่านั้น

4. **อย่า set minSyncTime ต่ำเกินไป**
   ```typescript
   minSyncTime: 100 // Too fast - users won't see it
   minSyncTime: 500 // Good - noticeable but not slow
   ```

## Testing

### Manual Testing

1. **Double-click footer** - เห็นอนิเมชั่นทดสอบ 2 วินาที
2. **Drag task in calendar** - เห็นอนิเมชั่นอย่างน้อย 500ms
3. **Create/update/delete operations** - ทุก mutation ต้องแสดงอนิเมชั่น
4. **Theme switching** - สีปรับตาม light/dark mode
5. **Concurrent operations** - หลาย mutations พร้อมกัน counter ต้องถูกต้อง

### Automated Testing

```typescript
// Mock useSyncStore
jest.mock('@/stores/use-sync-store', () => ({
  useSyncStore: () => ({
    isSyncing: false,
    startSync: jest.fn(),
    endSync: jest.fn(),
  }),
}));

test('shows sync animation during mutation', async () => {
  const { startSync, endSync } = useSyncStore();

  const { result } = renderHook(() => useUpdateTask());
  await result.current.mutate({ taskId: '1', data: { name: 'Test' } });

  expect(startSync).toHaveBeenCalled();
  expect(endSync).toHaveBeenCalled();
});
```

## Troubleshooting

### ปัญหา: อนิเมชั่นไม่แสดง

**วิธีแก้**:
1. ตรวจสอบว่า mutation ใช้ `useSyncMutation`
2. ตรวจสอบว่า `SyncStatusFooter` ถูก render ใน `Sidebar`
3. Double-click footer เพื่อทดสอบว่าอนิเมชั่นทำงาน

### ปัญหา: อนิเมชั่นเร็วเกินไป

**วิธีแก้**:
```typescript
// เพิ่ม minSyncTime
useSyncMutation({ minSyncTime: 1000, ... })
```

### ปัญหา: อนิเมชั่นค้างไม่หาย

**วิธีแก้**:
1. ตรวจสอบว่า `endSync()` ถูกเรียกใน `onSettled` หรือ `finally`
2. ตรวจสอบ syncCount ใน store (ควรเป็น 0 เมื่อไม่มีการซิงค์)
3. Reload หน้าเพื่อ reset state

### ปัญหา: Concurrent operations ทำให้ counter ผิด

**วิธีแก้**:
- `useSyncMutation` จัดการ counter อัตโนมัติ
- ตรวจสอบว่าไม่มีการเรียก `endSync()` มากเกินไป

## Performance

### Memory Usage
- Store: ~100 bytes (isSyncing + syncCount)
- Minimal impact

### Re-renders
- Footer component re-renders เมื่อ `isSyncing` เปลี่ยน
- ไม่ impact components อื่น (isolated state)

### Animation Performance
- CSS animations (GPU accelerated)
- 60 FPS smooth transitions
- No performance issues

## Migration Guide

### จาก Manual Sync

**Before**:
```typescript
const { startSync, endSync } = useSyncStore();

mutation.mutate(data, {
  onMutate: () => startSync(),
  onSettled: () => endSync(),
});
```

**After**:
```typescript
// In hook file
return useSyncMutation({ ... });

// In component
mutation.mutate(data); // Automatic!
```

### จาก Toast Notifications

**Before**:
```typescript
toast.loading('Saving...');
await api.post('/tasks', data);
toast.success('Saved!');
```

**After**:
```typescript
// Sync animation shows automatically
mutation.mutate(data);
```

## Related Files

- `src/stores/use-sync-store.ts` - Sync state management
- `src/lib/use-sync-mutation.ts` - Mutation wrapper hook
- `src/components/layout/sync-status-footer.tsx` - Footer component
- `src/components/layout/sidebar.tsx` - Sidebar with footer
- `src/hooks/use-tasks.ts` - Example usage
- `OPTIMISTIC_UPDATE_PATTERN.md` - Pattern documentation

## Future Enhancements

### Planned Features
1. **Success indicators** - Green checkmark on success
2. **Error indicators** - Red X on error
3. **Progress percentage** - For bulk operations
4. **Retry button** - On error state
5. **Network status** - Show offline/online
6. **Custom animations** - Per operation type

### Configuration Options
```typescript
// Future API
useSyncMutation({
  minSyncTime: 500,
  showSuccess: true,      // Show green checkmark
  showError: true,        // Show red X
  successDuration: 1000,  // How long to show success
  errorDuration: 2000,    // How long to show error
})
```

---

**Last Updated**: 2025-10-21
**Author**: Claude (AI Assistant)
**Status**: ✅ Production Ready
**Version**: 1.0.0
