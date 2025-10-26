# Create Task Modal - Implementation Plan

**Date**: 2025-10-23
**Status**: Planning
**Priority**: HIGH
**Estimated Time**: 4-6 hours

---

## Overview

Implement a comprehensive Create Task Modal matching the GAS implementation with modern Next.js patterns, optimistic updates, and shadcn/ui components.

### Goals

1. ✅ Full feature parity with GAS Create Task Modal
2. ✅ Modern UI with shadcn/ui Dialog component
3. ✅ Optimistic updates for instant feedback
4. ✅ Support for all contexts: Project view + Department view
5. ✅ Form validation with Zod
6. ✅ Integration with existing CreateTaskButton components

---

## GAS Implementation Analysis

### Key Features from GAS (component.CreateTaskModal.html)

**Form Fields:**
1. **Task Name** (required) - Text input
2. **Status** - Custom slider with visual feedback
3. **Assignee** - Popover with multi-select + avatars
4. **Priority** - Popover (ด่วนที่สุด/ด่วน/ปกติ/ต่ำ) with colored flags
5. **Difficulty** - Popover (ง่าย/ปกติ/ยาก) with colored dots
6. **Start Date** - Date picker popover
7. **Due Date** - Date picker popover
8. **Project** (required) - Selector (pre-filled if from project view)
9. **Parent Task** - TomSelect dropdown (for creating subtasks)
10. **Description** - Textarea

**Behavior Patterns:**

1. **Context-Aware Initialization:**
   - From Project View: Pre-fill project, load project-specific users/statuses/tasks
   - From Department View: Empty project, show project selector
   - For Subtask: Show parent task info, disable parent selector

2. **Data Loading Strategy:**
   ```javascript
   // Cache-first approach
   if (appState.currentProjectId === projectId && appState.users.length > 0) {
     // Use cached data (fast)
     projectData = { statuses: appState.statuses, users: appState.users, ... };
   } else {
     // Fetch from backend (slow)
     projectData = await runGoogleScript('getProjectData', projectId);
   }
   ```

3. **Optimistic UI Pattern:**
   ```javascript
   // 1. Create temporary task with tempId
   const tempTask = { ...formData, id: `temp_${Date.now()}`, isCreating: true };

   // 2. Close modal, add to state, re-render (instant UI update)
   CloseModal();
   appState.tasks.push(tempTask);
   rerenderView();

   // 3. Send to backend in background
   const response = await createTask(formData);

   // 4. Replace temp task with real task from server
   appState.tasks[index] = response.newTask;
   rerenderView();

   // 5. On error: remove temp task, show error
   ```

4. **Project Selection Dynamic Updates:**
   - When user changes project → Reload users, statuses, tasks for new project
   - Reset assignees, update status slider, update parent task selector

5. **Validation:**
   - Task name is required
   - Project is required
   - Show inline error messages

---

## Next.js Implementation Design

### Architecture

```
src/
├── components/
│   ├── modals/
│   │   └── create-task-modal.tsx       # Main modal component ⭐ NEW
│   ├── modals/
│   │   ├── task-form-fields.tsx        # Reusable form fields ⭐ NEW
│   │   ├── status-slider.tsx           # Status slider component ⭐ NEW
│   │   ├── priority-selector.tsx       # Priority button + popover ⭐ NEW
│   │   ├── difficulty-selector.tsx     # Difficulty button + popover ⭐ NEW
│   │   └── assignee-selector.tsx       # Assignee multi-select ⭐ NEW
│   └── common/
│       └── create-task-button.tsx      # ✅ Already exists
├── hooks/
│   └── use-tasks.ts                    # Add createTask mutation ⭐ UPDATE
├── stores/
│   └── use-ui-store.ts                 # Add createTaskModal state ⭐ UPDATE
└── lib/
    └── validations/
        └── task-schema.ts              # Zod schema for task form ⭐ NEW
```

---

## Component Specifications

### 1. CreateTaskModal Component

**File**: `src/components/modals/create-task-modal.tsx`

**Props**:
```typescript
interface CreateTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string | null;              // Pre-filled project (from project view)
  projectName?: string | null;            // Pre-filled project name
  parentTaskId?: string | null;           // For creating subtasks
  defaultStartDate?: string;              // Optional default start date
  defaultDueDate?: string;                // Optional default due date
  onSuccess?: (task: Task) => void;       // Callback after creation
}
```

**State Management**:
```typescript
// Form state
const [taskName, setTaskName] = useState('');
const [description, setDescription] = useState('');
const [selectedProject, setSelectedProject] = useState<Project | null>(null);
const [selectedStatus, setSelectedStatus] = useState<Status | null>(null);
const [selectedPriority, setSelectedPriority] = useState(3); // Default: ปกติ
const [selectedDifficulty, setSelectedDifficulty] = useState(2); // Default: ปกติ
const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
const [startDate, setStartDate] = useState<Date | null>(null);
const [dueDate, setDueDate] = useState<Date | null>(null);
const [parentTask, setParentTask] = useState<Task | null>(null);

// Project-specific data
const [projectUsers, setProjectUsers] = useState<User[]>([]);
const [projectStatuses, setProjectStatuses] = useState<Status[]>([]);
const [projectTasks, setProjectTasks] = useState<Task[]>([]);

// UI state
const [errors, setErrors] = useState<Record<string, string>>({});
const [isLoadingProjectData, setIsLoadingProjectData] = useState(false);
```

**Data Loading**:
```typescript
// Load project-specific data when project is selected
useEffect(() => {
  if (selectedProject) {
    loadProjectData(selectedProject.id);
  }
}, [selectedProject]);

async function loadProjectData(projectId: string) {
  setIsLoadingProjectData(true);
  try {
    // Use React Query to fetch project board data (cached)
    const { data } = await queryClient.fetchQuery({
      queryKey: ['project-board', projectId],
      queryFn: () => api.get(`/api/projects/${projectId}/board`),
    });

    setProjectUsers(data.users || []);
    setProjectStatuses(data.statuses || []);
    setProjectTasks(data.tasks?.filter(t => !t.parentTaskId) || []);

    // Set default status to first status
    if (data.statuses && data.statuses.length > 0) {
      setSelectedStatus(data.statuses[0]);
    }
  } catch (error) {
    console.error('Failed to load project data:', error);
    toast.error('ไม่สามารถโหลดข้อมูลโปรเจคได้');
  } finally {
    setIsLoadingProjectData(false);
  }
}
```

**Form Submission**:
```typescript
const createTask = useCreateTask();

async function handleSubmit() {
  // 1. Validate form
  const validation = taskSchema.safeParse({ taskName, selectedProject, ... });
  if (!validation.success) {
    setErrors(validation.error.flatten().fieldErrors);
    return;
  }

  // 2. Prepare form data
  const formData = {
    projectId: selectedProject!.id,
    name: taskName,
    description,
    statusId: selectedStatus?.id,
    priority: selectedPriority,
    difficulty: selectedDifficulty,
    assigneeUserIds: selectedAssignees,
    startDate: startDate?.toISOString(),
    dueDate: dueDate?.toISOString(),
    parentTaskId: parentTask?.id,
  };

  // 3. Close modal immediately (optimistic)
  onOpenChange(false);

  // 4. Call mutation (handles optimistic update internally)
  createTask.mutate(formData, {
    onSuccess: (newTask) => {
      toast.success('สร้างงานสำเร็จ');
      onSuccess?.(newTask);
      resetForm();
    },
    onError: (error) => {
      toast.error(`ไม่สามารถสร้างงานได้: ${error.message}`);
      // Reopen modal on error? Or let user retry manually?
    },
  });
}
```

**UI Structure**:
```tsx
<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>สร้างงานใหม่</DialogTitle>
    </DialogHeader>

    {/* Parent Task Info (when creating subtask) */}
    {parentTaskId && (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <CornerDownRight className="h-4 w-4" />
        <span>เป็นงานย่อยของ:</span>
        <span className="font-semibold">{parentTask?.name}</span>
      </div>
    )}

    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Task Name (required) */}
      <div>
        <Label htmlFor="task-name">
          ชื่องาน <span className="text-destructive">*</span>
        </Label>
        <Input
          id="task-name"
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
          placeholder="ชื่องานของคุณ..."
          className="text-lg font-semibold"
        />
        {errors.taskName && (
          <p className="text-sm text-destructive mt-1">{errors.taskName}</p>
        )}
      </div>

      {/* Status Slider */}
      <StatusSlider
        statuses={projectStatuses}
        value={selectedStatus}
        onChange={setSelectedStatus}
      />

      {/* Grid: Assignee, Priority, Difficulty, Dates, Project */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AssigneeSelector
          users={projectUsers}
          value={selectedAssignees}
          onChange={setSelectedAssignees}
        />
        <PrioritySelector
          value={selectedPriority}
          onChange={setSelectedPriority}
        />
        <DifficultySelector
          value={selectedDifficulty}
          onChange={setSelectedDifficulty}
        />
        <DatePicker
          label="วันเริ่มงาน"
          value={startDate}
          onChange={setStartDate}
        />
        <DatePicker
          label="วันสิ้นสุด"
          value={dueDate}
          onChange={setDueDate}
        />
        <ProjectSelector
          value={selectedProject}
          onChange={handleProjectChange}
          required
          disabled={!!projectId} // Disable if pre-filled
          error={errors.selectedProject}
        />
      </div>

      {/* Parent Task Selector (unless creating subtask) */}
      {!parentTaskId && (
        <div>
          <Label>งานหลัก (Parent Task)</Label>
          <Select value={parentTask?.id} onValueChange={handleParentTaskChange}>
            <SelectTrigger>
              <SelectValue placeholder="ค้นหางานหลัก..." />
            </SelectTrigger>
            <SelectContent>
              {projectTasks.map((task) => (
                <SelectItem key={task.id} value={task.id}>
                  {task.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Description */}
      <div>
        <Label htmlFor="description">คำอธิบาย</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="เพิ่มรายละเอียดเกี่ยวกับงานนี้..."
          rows={4}
        />
      </div>
    </form>

    <DialogFooter>
      <Button variant="outline" onClick={() => onOpenChange(false)}>
        ยกเลิก
      </Button>
      <Button onClick={handleSubmit} disabled={createTask.isPending}>
        {createTask.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        สร้างงาน
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

### 2. Supporting Components

#### StatusSlider Component

**File**: `src/components/modals/status-slider.tsx`

```tsx
interface StatusSliderProps {
  statuses: Status[];
  value: Status | null;
  onChange: (status: Status) => void;
}

export function StatusSlider({ statuses, value, onChange }: StatusSliderProps) {
  const [sliderValue, setSliderValue] = useState(0);

  const handleSliderChange = (values: number[]) => {
    const index = values[0];
    setSliderValue(index);
    if (statuses[index]) {
      onChange(statuses[index]);
    }
  };

  return (
    <div className="space-y-4 px-10 py-8">
      <div className="flex items-center justify-between">
        <Label>สถานะ</Label>
        <span className="text-sm font-semibold" style={{ color: value?.color }}>
          {value?.name}
        </span>
      </div>

      <div className="status-slider-container">
        <Slider
          value={[sliderValue]}
          onValueChange={handleSliderChange}
          max={statuses.length - 1}
          step={1}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-2 px-1">
          {statuses.map((status) => (
            <span key={status.id}>{status.name}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
```

#### PrioritySelector Component

**File**: `src/components/modals/priority-selector.tsx`

```tsx
interface PrioritySelectorProps {
  value: number;
  onChange: (priority: number) => void;
}

const PRIORITIES = [
  { id: 1, name: 'ด่วนที่สุด', color: '#ef4444', icon: Flag },
  { id: 2, name: 'ด่วน', color: '#f97316', icon: Flag },
  { id: 3, name: 'ปกติ', color: '#eab308', icon: Flag },
  { id: 4, name: 'ต่ำ', color: '#22c55e', icon: Flag },
];

export function PrioritySelector({ value, onChange }: PrioritySelectorProps) {
  const selected = PRIORITIES.find((p) => p.id === value) || PRIORITIES[2];

  return (
    <div>
      <Label>ความเร่งด่วน</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start gap-2 mt-1 h-[46px]"
          >
            <selected.icon className="h-4 w-4" style={{ color: selected.color }} />
            <span>{selected.name}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-2">
          <div className="space-y-1">
            {PRIORITIES.map((priority) => (
              <Button
                key={priority.id}
                variant={value === priority.id ? 'default' : 'ghost'}
                className="w-full justify-start gap-2"
                onClick={() => onChange(priority.id)}
              >
                <priority.icon className="h-4 w-4" style={{ color: priority.color }} />
                {priority.name}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
```

#### AssigneeSelector Component

**File**: `src/components/modals/assignee-selector.tsx`

```tsx
interface AssigneeSelectorProps {
  users: User[];
  value: string[];
  onChange: (userIds: string[]) => void;
}

export function AssigneeSelector({ users, value, onChange }: AssigneeSelectorProps) {
  const selectedUsers = users.filter((u) => value.includes(u.id));

  const toggleUser = (userId: string) => {
    if (value.includes(userId)) {
      onChange(value.filter((id) => id !== userId));
    } else {
      onChange([...value, userId]);
    }
  };

  return (
    <div>
      <Label>ผู้รับผิดชอบ</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start gap-2 mt-1 h-[46px]"
          >
            {selectedUsers.length > 0 ? (
              <div className="flex -space-x-2">
                {selectedUsers.slice(0, 3).map((user) => (
                  <Avatar key={user.id} className="h-6 w-6 border-2 border-background">
                    <AvatarImage src={user.profileImageUrl} />
                    <AvatarFallback>{user.fullName.charAt(0)}</AvatarFallback>
                  </Avatar>
                ))}
                {selectedUsers.length > 3 && (
                  <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs">
                    +{selectedUsers.length - 3}
                  </div>
                )}
              </div>
            ) : (
              <span className="text-muted-foreground">มอบหมายผู้รับผิดชอบ</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2">
          <ScrollArea className="h-72">
            <div className="space-y-1">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-2 p-2 rounded-md hover:bg-accent cursor-pointer"
                  onClick={() => toggleUser(user.id)}
                >
                  <Checkbox checked={value.includes(user.id)} />
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={user.profileImageUrl} />
                    <AvatarFallback>{user.fullName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{user.fullName}</span>
                </div>
              ))}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );
}
```

---

### 3. React Query Hook

**File**: `src/hooks/use-tasks.ts` (add to existing file)

```typescript
export function useCreateTask() {
  const queryClient = useQueryClient();
  const { triggerSync } = useSyncStore();

  return useSyncMutation({
    mutationFn: async (data: CreateTaskData) => {
      return api.post(`/api/projects/${data.projectId}/tasks`, data);
    },

    onMutate: async (data) => {
      const projectId = data.projectId;

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['project-board', projectId] });

      // Get previous data
      const previousData = queryClient.getQueryData(['project-board', projectId]);

      // Create temporary task for optimistic update
      const tempTask = {
        id: `temp_${Date.now()}`,
        ...data,
        assignees: [],
        dateCreated: new Date().toISOString(),
        dateUpdated: new Date().toISOString(),
        creatorUserId: 'current-user', // TODO: Get from session
        isCreating: true, // Flag for UI
      };

      // Optimistically update cache
      queryClient.setQueryData(['project-board', projectId], (old: any) => ({
        ...old,
        tasks: [...(old?.tasks || []), tempTask],
      }));

      return { previousData, tempTask };
    },

    onSuccess: (response, variables, context) => {
      const projectId = variables.projectId;
      const tempTask = context?.tempTask;

      // Replace temp task with real task from server
      queryClient.setQueryData(['project-board', projectId], (old: any) => ({
        ...old,
        tasks: old.tasks.map((t: any) =>
          t.id === tempTask?.id ? response.task : t
        ),
      }));

      // Invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['project-board', projectId] });
    },

    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(
          ['project-board', variables.projectId],
          context.previousData
        );
      }
    },

    onSettled: (response) => {
      triggerSync();
    },
  });
}
```

---

### 4. UI Store Update

**File**: `src/stores/use-ui-store.ts` (add to existing store)

```typescript
interface UIStore {
  // ... existing state ...

  // Create Task Modal
  createTaskModal: {
    isOpen: boolean;
    projectId: string | null;
    projectName: string | null;
    parentTaskId: string | null;
    defaultStartDate: string | null;
    defaultDueDate: string | null;
  };

  openCreateTaskModal: (options?: {
    projectId?: string;
    projectName?: string;
    parentTaskId?: string;
    defaultStartDate?: string;
    defaultDueDate?: string;
  }) => void;

  closeCreateTaskModal: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  // ... existing state ...

  createTaskModal: {
    isOpen: false,
    projectId: null,
    projectName: null,
    parentTaskId: null,
    defaultStartDate: null,
    defaultDueDate: null,
  },

  openCreateTaskModal: (options = {}) =>
    set({
      createTaskModal: {
        isOpen: true,
        projectId: options.projectId || null,
        projectName: options.projectName || null,
        parentTaskId: options.parentTaskId || null,
        defaultStartDate: options.defaultStartDate || null,
        defaultDueDate: options.defaultDueDate || null,
      },
    }),

  closeCreateTaskModal: () =>
    set({
      createTaskModal: {
        isOpen: false,
        projectId: null,
        projectName: null,
        parentTaskId: null,
        defaultStartDate: null,
        defaultDueDate: null,
      },
    }),
}));
```

---

### 5. Form Validation Schema

**File**: `src/lib/validations/task-schema.ts`

```typescript
import { z } from 'zod';

export const createTaskSchema = z.object({
  name: z.string().min(1, 'กรุณากรอกชื่องาน').max(500, 'ชื่องานยาวเกินไป'),
  description: z.string().optional(),
  projectId: z.string().min(1, 'กรุณาเลือกโปรเจค'),
  statusId: z.string().optional(),
  priority: z.number().int().min(1).max(4).default(3),
  difficulty: z.number().int().min(1).max(3).default(2),
  assigneeUserIds: z.array(z.string()).default([]),
  startDate: z.string().datetime().optional(),
  dueDate: z.string().datetime().optional(),
  parentTaskId: z.string().optional(),
});

export type CreateTaskData = z.infer<typeof createTaskSchema>;
```

---

## Integration Points

### 1. Update CreateTaskButton

**File**: `src/components/common/create-task-button.tsx`

```tsx
'use client';

import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/use-ui-store';
import { useParams } from 'next/navigation';
import { useProjectBoard } from '@/hooks/use-projects';

interface CreateTaskButtonProps {
  className?: string;
  fullWidth?: boolean;
  projectId?: string; // Optional: for department view
  projectName?: string; // Optional: for department view
}

export function CreateTaskButton({
  className,
  fullWidth = false,
  projectId: propProjectId,
  projectName: propProjectName,
}: CreateTaskButtonProps) {
  const params = useParams();
  const projectId = propProjectId || (params?.projectId as string);

  // Get project name if in project view
  const { data } = useProjectBoard(projectId);
  const projectName = propProjectName || data?.project?.name;

  const openCreateTaskModal = useUIStore((state) => state.openCreateTaskModal);

  const handleClick = () => {
    openCreateTaskModal({
      projectId,
      projectName,
    });
  };

  return (
    <Button
      onClick={handleClick}
      size="lg"
      className={cn(
        'h-12 text-primary-foreground',
        fullWidth && 'w-full',
        className
      )}
    >
      <Plus className="h-5 w-5 mr-2" />
      <span className="font-medium text-base">สร้างงานใหม่</span>
    </Button>
  );
}
```

### 2. Add Modal to Layout

**File**: `src/app/(dashboard)/layout.tsx` (add to existing layout)

```tsx
import { CreateTaskModal } from '@/components/modals/create-task-modal';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      {/* ... existing layout ... */}

      {/* Global Modals */}
      <CreateTaskModal />
    </div>
  );
}
```

### 3. Update Subtask Creation in TaskPanel

**File**: `src/components/task-panel/details-tab/subtasks-section.tsx`

```tsx
import { useUIStore } from '@/stores/use-ui-store';

export function SubtasksSection({ task }: { task: Task }) {
  const openCreateTaskModal = useUIStore((state) => state.openCreateTaskModal);

  const handleCreateSubtask = () => {
    openCreateTaskModal({
      projectId: task.projectId,
      parentTaskId: task.id,
    });
  };

  return (
    <div>
      {/* ... existing subtasks list ... */}

      <Button onClick={handleCreateSubtask} variant="outline" className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        เพิ่มงานย่อย
      </Button>
    </div>
  );
}
```

---

## Testing Plan

### Test Scenarios

**1. Create Task from Project Board View**
- ✅ Modal opens with project pre-filled
- ✅ Users, statuses, tasks loaded from cache
- ✅ All form fields work correctly
- ✅ Task created with optimistic update
- ✅ Task appears in board immediately
- ✅ Real task replaces temp task after server response

**2. Create Task from Department View**
- ✅ Modal opens with empty project
- ✅ User selects project from list
- ✅ Project data loads (users, statuses, tasks)
- ✅ Task created in selected project

**3. Create Subtask**
- ✅ Modal opens with parent task info shown
- ✅ Parent task selector disabled
- ✅ Subtask created under parent
- ✅ TaskPanel refreshes to show new subtask

**4. Form Validation**
- ✅ Task name required
- ✅ Project required
- ✅ Error messages displayed
- ✅ Form cannot submit with validation errors

**5. Project Switching**
- ✅ Change project in modal
- ✅ Users list updates
- ✅ Statuses list updates
- ✅ Parent tasks list updates
- ✅ Assignees reset

**6. Error Handling**
- ✅ Backend error removes temp task
- ✅ Error toast displayed
- ✅ User can retry

**7. Multiple Views**
- ✅ Works from Board View
- ✅ Works from Calendar View
- ✅ Works from List View
- ✅ Works from Dashboard

---

## Implementation Checklist

### Phase 1: Core Components (2 hours)
- [ ] Create CreateTaskModal component with Dialog
- [ ] Implement StatusSlider component
- [ ] Implement PrioritySelector component
- [ ] Implement DifficultySelector component
- [ ] Implement AssigneeSelector component
- [ ] Create task form validation schema (Zod)

### Phase 2: Integration (1 hour)
- [ ] Add createTaskModal state to useUIStore
- [ ] Implement useCreateTask mutation hook
- [ ] Update CreateTaskButton to use modal
- [ ] Add modal to dashboard layout
- [ ] Connect subtask creation in TaskPanel

### Phase 3: Data Loading (1 hour)
- [ ] Implement project data loading logic
- [ ] Handle cache-first approach with React Query
- [ ] Implement project switching updates
- [ ] Add loading states and skeletons

### Phase 4: Testing & Polish (2 hours)
- [ ] Test all form fields
- [ ] Test validation
- [ ] Test optimistic updates
- [ ] Test from all views (Board/Calendar/List)
- [ ] Test subtask creation
- [ ] Test error handling
- [ ] Fix any bugs
- [ ] Add loading states
- [ ] Polish UI/UX

---

## Files to Create/Modify

### New Files (7)
1. `src/components/modals/create-task-modal.tsx`
2. `src/components/modals/status-slider.tsx`
3. `src/components/modals/priority-selector.tsx`
4. `src/components/modals/difficulty-selector.tsx`
5. `src/components/modals/assignee-selector.tsx`
6. `src/lib/validations/task-schema.ts`
7. `CREATE_TASK_MODAL_IMPLEMENTATION_LOG.md` (track progress)

### Modified Files (4)
1. `src/hooks/use-tasks.ts` - Add useCreateTask mutation
2. `src/stores/use-ui-store.ts` - Add createTaskModal state
3. `src/components/common/create-task-button.tsx` - Connect to modal
4. `src/app/(dashboard)/layout.tsx` - Add modal to layout

---

## Dependencies

**shadcn/ui components needed:**
- ✅ Dialog (already installed)
- ✅ Button (already installed)
- ✅ Input (already installed)
- ✅ Textarea (already installed)
- ✅ Label (already installed)
- ✅ Select (already installed)
- ✅ Popover (already installed)
- ✅ Avatar (already installed)
- ✅ Checkbox (already installed)
- ✅ ScrollArea (already installed)
- ⚠️ Slider (need to check)

**Check slider installation:**
```bash
npx shadcn@latest add slider
```

---

## Notes

1. **Match GAS Behavior**: Keep form fields, layout, and flow identical to GAS for user familiarity
2. **Optimistic Updates**: Critical for perceived performance - modal closes immediately
3. **Cache Strategy**: Use React Query cache first, then fetch if needed
4. **Project Context**: Handle both project view (pre-filled) and department view (empty)
5. **Subtask Support**: Show parent task info, disable parent selector
6. **Validation**: Client-side (Zod) + Server-side (API)
7. **Error Recovery**: Remove temp task on error, allow retry

---

**Last Updated**: 2025-10-23
