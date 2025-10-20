# Frontend Migration Guide
## GAS HTML/JS → Next.js + shadcn/ui

**Version:** 1.0
**Date:** 2025-10-20

---

## Table of Contents

1. [Component Inventory & Mapping](#component-inventory--mapping)
2. [Design System Migration](#design-system-migration)
3. [State Management Strategy](#state-management-strategy)
4. [Component Migration Examples](#component-migration-examples)
5. [Routing Migration](#routing-migration)

---

## 1. Component Inventory & Mapping

### 1.1 Current GAS Components → Next.js Components

| GAS Component | Type | Next.js Equivalent | shadcn/ui Components | Priority |
|---------------|------|-------------------|---------------------|----------|
| **Views** |
| `component.BoardView.html` | View | `src/components/views/board-view/index.tsx` | - | HIGH |
| `component.ListView.html` | View | `src/components/views/list-view/index.tsx` | Table, DataTable | HIGH |
| `component.CalendarView.html` | View | `src/components/views/calendar-view/index.tsx` | Calendar | HIGH |
| `component.DashboardView.html` | View | `src/components/views/dashboard-view/index.tsx` | Card, Chart | MEDIUM |
| `component.UserDashboard.html` | View | `src/app/(dashboard)/user-dashboard/page.tsx` | Card, Badge | MEDIUM |
| `component.ReportsDashboard.html` | View | `src/app/(dashboard)/reports/page.tsx` | Card, Chart, DateRangePicker | MEDIUM |
| **Modals** |
| `component.CreateTaskModal.html` | Modal | `src/components/modals/create-task-modal.tsx` | Dialog, Form, Input, Select | HIGH |
| `component.CreateProjectModal.html` | Modal | `src/components/modals/create-project-modal.tsx` | Dialog, Form | HIGH |
| `component.EditProjectModal.html` | Modal | `src/components/modals/edit-project-modal.tsx` | Dialog, Form | MEDIUM |
| `component.EditProfileModal.html` | Modal | `src/components/modals/edit-profile-modal.tsx` | Dialog, Form, Avatar | MEDIUM |
| **Panels** |
| `component.TaskPanel.html` | Panel | `src/components/panels/task-panel/index.tsx` | Sheet, Tabs, Textarea | HIGH |
| **Selectors** |
| `component.ProjectSelector.html` | Dropdown | `src/components/selectors/project-selector.tsx` | Combobox, Command | HIGH |
| `component.DepartmentSelector.html` | Dropdown | `src/components/selectors/department-selector.tsx` | Select | MEDIUM |
| `component.DivisionSelector.html` | Dropdown | `src/components/selectors/division-selector.tsx` | Select | MEDIUM |
| `component.MissionGroupSelector.html` | Dropdown | `src/components/selectors/mission-group-selector.tsx` | Select | MEDIUM |
| **UI Components** |
| `component.FilterBar.html` | Toolbar | `src/components/common/filter-bar.tsx` | Popover, Select, DatePicker | HIGH |
| `component.ColorPicker.html` | Picker | `src/components/common/color-picker.tsx` | Popover, custom | MEDIUM |
| `component.InlineEditor.html` | Editor | `src/components/common/inline-editor.tsx` | Input (contentEditable) | LOW |
| `component.CloseTaskButton.html` | Button | `src/components/common/close-task-button.tsx` | Button, Dropdown | MEDIUM |
| `component.NotificationCenter.html` | Popover | `src/components/layout/notification-center.tsx` | Popover, ScrollArea | MEDIUM |
| **Management** |
| `component.ProjectManagement.html` | Page | `src/app/(dashboard)/projects/page.tsx` | DataTable, Dialog | MEDIUM |
| `component.UserManagement.html` | Page | `src/app/(dashboard)/users/page.tsx` | DataTable, Dialog | MEDIUM |
| **Utilities** |
| `UIHelpers.js.html` | Utilities | `src/lib/ui-utils.ts` | - | HIGH |
| `util.DateUtils.html` | Utilities | `src/lib/date-utils.ts` | date-fns | HIGH |
| `util.DOMUtils.html` | Utilities | `src/lib/dom-utils.ts` | React utils | LOW |

**Total Components:** ~28 main components

---

## 2. Design System Migration

### 2.1 Tailwind Config - Keep Existing Theme

```typescript
// tailwind.config.ts

import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'], // Keep dark mode toggle
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ✅ Keep exact colors from GAS app (from CSS.html)
        primary: 'var(--primary)',
        'primary-dark': 'var(--primary-dark)',

        background: {
          light: 'var(--background-light)',
          dark: 'var(--background-dark)',
        },
        foreground: {
          light: 'var(--foreground-light)',
          dark: 'var(--foreground-dark)',
        },
        border: {
          light: 'var(--border-light)',
          dark: 'var(--border-dark)',
        },
        muted: {
          light: 'var(--muted-light)',
          dark: 'var(--muted-dark)',
        },
        subtle: {
          light: 'var(--subtle-light)',
          dark: 'var(--subtle-dark)',
        },

        // Priority colors (from AppConstants)
        urgent: {
          50: '#fef2f2',
          600: '#dc2626',
        },
        high: {
          50: '#fff7ed',
          500: '#f97316',
        },
        normal: {
          50: '#fefce8',
          500: '#eab308',
        },
        low: {
          50: '#f0fdf4',
          500: '#22c55e',
        },
      },
      fontFamily: {
        display: ['Sukhumvit Set', 'Noto Sans Thai', 'sans-serif'],
      },
      boxShadow: {
        // Keep existing shadows
        'card-light': '0 1px 3px rgba(0, 0, 0, 0.1)',
        'card-dark': '0 1px 3px rgba(0, 0, 0, 0.5)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
```

```css
/* src/styles/globals.css */

@tailwind base;
@tailwind components;
@tailwind utilities;

/* ✅ Keep exact CSS variables from GAS CSS.html */
:root {
  --primary: #3b82f6;
  --primary-dark: #2563eb;

  --background-light: #f3f4f6;
  --background-dark: #1f2937;

  --foreground-light: #111827;
  --foreground-dark: #f9fafb;

  --border-light: #e5e7eb;
  --border-dark: #374151;

  --muted-light: #6b7280;
  --muted-dark: #9ca3af;

  --subtle-light: #d1d5db;
  --subtle-dark: #4b5563;
}

/* Dark mode */
.dark {
  color-scheme: dark;
}

/* Keep existing utility classes */
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
```

### 2.2 shadcn/ui Component Setup

```bash
# Install shadcn/ui CLI
npx shadcn-ui@latest init

# Install required components
npx shadcn-ui@latest add button
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add input
npx shadcn-ui@latest add select
npx shadcn-ui@latest add textarea
npx shadcn-ui@latest add popover
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add table
npx shadcn-ui@latest add card
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add calendar
npx shadcn-ui@latest add sheet
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add scroll-area
npx shadcn-ui@latest add command
npx shadcn-ui@latest add form
```

---

## 3. State Management Strategy

### 3.1 Zustand Store (Replaces StateManager)

```typescript
// src/stores/use-app-store.ts

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  profileImageUrl?: string;
  permissions: string[];
}

interface Project {
  id: string;
  name: string;
  color: string;
  // ...
}

interface Task {
  id: string;
  name: string;
  statusId: string;
  priority: number;
  // ...
}

interface AppState {
  // Session
  currentUser: User | null;
  sessionToken: string | null;

  // Current view context
  currentProjectId: string | null;
  currentProjectDetails: Project | null;

  // Data
  tasks: Task[];
  statuses: Status[];
  projects: Project[];

  // UI State
  filterState: {
    assignees: string[];
    statuses: string[];
    priorities: number[];
    dueDate: string | null;
  };
  listSortState: {
    column: string;
    direction: 'asc' | 'desc';
  };

  // Actions
  setCurrentUser: (user: User | null) => void;
  setSessionToken: (token: string | null) => void;
  setCurrentProject: (projectId: string, details: Project) => void;
  setTasks: (tasks: Task[]) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  setFilterState: (filters: Partial<AppState['filterState']>) => void;
  reset: () => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        currentUser: null,
        sessionToken: null,
        currentProjectId: null,
        currentProjectDetails: null,
        tasks: [],
        statuses: [],
        projects: [],
        filterState: {
          assignees: [],
          statuses: [],
          priorities: [],
          dueDate: null,
        },
        listSortState: {
          column: 'dateCreated',
          direction: 'desc',
        },

        // Actions
        setCurrentUser: (user) => set({ currentUser: user }),

        setSessionToken: (token) => set({ sessionToken: token }),

        setCurrentProject: (projectId, details) =>
          set({
            currentProjectId: projectId,
            currentProjectDetails: details,
          }),

        setTasks: (tasks) => set({ tasks }),

        updateTask: (taskId, updates) =>
          set((state) => ({
            tasks: state.tasks.map((task) =>
              task.id === taskId ? { ...task, ...updates } : task
            ),
          })),

        setFilterState: (filters) =>
          set((state) => ({
            filterState: { ...state.filterState, ...filters },
          })),

        reset: () =>
          set({
            currentUser: null,
            sessionToken: null,
            currentProjectId: null,
            currentProjectDetails: null,
            tasks: [],
            statuses: [],
            projects: [],
            filterState: {
              assignees: [],
              statuses: [],
              priorities: [],
              dueDate: null,
            },
          }),
      }),
      {
        name: 'projectflow-storage',
        partialize: (state) => ({
          sessionToken: state.sessionToken,
          currentUser: state.currentUser,
        }),
      }
    )
  )
);
```

### 3.2 TanStack Query for Server State

```typescript
// src/hooks/use-projects.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get('/api/projects'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useProject(projectId: string) {
  return useQuery({
    queryKey: ['projects', projectId],
    queryFn: () => api.get(`/api/projects/${projectId}/board`),
    enabled: !!projectId,
  });
}

export function useCreateTask(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTaskInput) =>
      api.post(`/api/projects/${projectId}/tasks`, data),
    onSuccess: () => {
      // Invalidate project data to refetch
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: Partial<Task> }) =>
      api.patch(`/api/tasks/${taskId}`, data),
    onMutate: async ({ taskId, data }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['tasks'] });

      const previousTasks = queryClient.getQueryData(['tasks']);

      queryClient.setQueryData(['tasks'], (old: any) =>
        old.map((task: Task) =>
          task.id === taskId ? { ...task, ...data } : task
        )
      );

      return { previousTasks };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      queryClient.setQueryData(['tasks'], context?.previousTasks);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
```

---

## 4. Component Migration Examples

### 4.1 Board View (Kanban)

```tsx
// src/components/views/board-view/index.tsx

'use client';

import { useProject } from '@/hooks/use-projects';
import { useAppStore } from '@/stores/use-app-store';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { TaskCard } from './task-card';
import { CreateTaskButton } from './create-task-button';

export function BoardView() {
  const currentProjectId = useAppStore((state) => state.currentProjectId);
  const { data: projectData, isLoading } = useProject(currentProjectId!);

  if (isLoading) return <BoardSkeleton />;
  if (!projectData) return <div>No project selected</div>;

  const { statuses, tasks } = projectData.data;

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const taskId = result.draggableId;
    const newStatusId = result.destination.droppableId;

    // Optimistic update
    updateTaskMutation.mutate({
      taskId,
      data: { statusId: newStatusId },
    });
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex h-full gap-4 overflow-x-auto p-6">
        {statuses.map((status) => {
          const statusTasks = tasks.filter(
            (task) => task.statusId === status.id && !task.isClosed
          );

          return (
            <Droppable key={status.id} droppableId={status.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={cn(
                    'flex w-80 flex-shrink-0 flex-col rounded-lg bg-white dark:bg-gray-800',
                    snapshot.isDraggingOver && 'bg-blue-50 dark:bg-blue-900/20'
                  )}
                >
                  {/* Status Header */}
                  <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: status.color }}
                      />
                      <h3 className="font-medium">{status.name}</h3>
                      <span className="text-sm text-muted-light dark:text-muted-dark">
                        {statusTasks.length}
                      </span>
                    </div>
                    <CreateTaskButton statusId={status.id} />
                  </div>

                  {/* Task List */}
                  <div className="flex-1 space-y-2 overflow-y-auto p-4">
                    {statusTasks.map((task, index) => (
                      <Draggable
                        key={task.id}
                        draggableId={task.id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <TaskCard
                              task={task}
                              isDragging={snapshot.isDragging}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          );
        })}
      </div>
    </DragDropContext>
  );
}
```

### 4.2 Create Task Modal

```tsx
// src/components/modals/create-task-modal.tsx

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useCreateTask } from '@/hooks/use-projects';
import { UserSelector } from '@/components/selectors/user-selector';
import { PrioritySelector } from '@/components/selectors/priority-selector';
import { DatePicker } from '@/components/common/date-picker';

const createTaskSchema = z.object({
  name: z.string().min(1, 'กรุณากรอกชื่องาน').max(255),
  description: z.string().optional(),
  assigneeUserId: z.string().optional(),
  statusId: z.string(),
  priority: z.number().int().min(1).max(4).default(3),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  difficulty: z.number().int().min(1).max(5).optional(),
});

type CreateTaskForm = z.infer<typeof createTaskSchema>;

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  defaultStatusId?: string;
}

export function CreateTaskModal({
  isOpen,
  onClose,
  projectId,
  defaultStatusId,
}: CreateTaskModalProps) {
  const createTaskMutation = useCreateTask(projectId);

  const form = useForm<CreateTaskForm>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      name: '',
      description: '',
      statusId: defaultStatusId || '',
      priority: 3,
    },
  });

  const onSubmit = async (data: CreateTaskForm) => {
    try {
      await createTaskMutation.mutateAsync(data);
      form.reset();
      onClose();
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>สร้างงานใหม่</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ชื่องาน *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="กรอกชื่องาน"
                      {...field}
                      autoFocus
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>รายละเอียด</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="กรอกรายละเอียดงาน"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="assigneeUserId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ผู้รับผิดชอบ</FormLabel>
                    <FormControl>
                      <UserSelector
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ความสำคัญ</FormLabel>
                    <FormControl>
                      <PrioritySelector
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>วันที่เริ่ม</FormLabel>
                    <FormControl>
                      <DatePicker
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>กำหนดส่ง</FormLabel>
                    <FormControl>
                      <DatePicker
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                ยกเลิก
              </Button>
              <Button
                type="submit"
                disabled={createTaskMutation.isPending}
              >
                {createTaskMutation.isPending ? 'กำลังสร้าง...' : 'สร้างงาน'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

### 4.3 Task Panel (Side Panel)

```tsx
// src/components/panels/task-panel/index.tsx

'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TaskDetails } from './task-details';
import { TaskComments } from './task-comments';
import { TaskHistory } from './task-history';
import { useTask } from '@/hooks/use-tasks';

interface TaskPanelProps {
  taskId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function TaskPanel({ taskId, isOpen, onClose }: TaskPanelProps) {
  const { data: task, isLoading } = useTask(taskId!);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        {isLoading ? (
          <div>Loading...</div>
        ) : task ? (
          <>
            <SheetHeader>
              <SheetTitle>{task.name}</SheetTitle>
            </SheetHeader>

            <Tabs defaultValue="details" className="mt-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">รายละเอียด</TabsTrigger>
                <TabsTrigger value="comments">
                  ความคิดเห็น ({task.commentCount})
                </TabsTrigger>
                <TabsTrigger value="history">ประวัติ</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="mt-4">
                <TaskDetails task={task} />
              </TabsContent>

              <TabsContent value="comments" className="mt-4">
                <TaskComments taskId={task.id} />
              </TabsContent>

              <TabsContent value="history" className="mt-4">
                <TaskHistory taskId={task.id} />
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <div>Task not found</div>
        )}
      </SheetContent>
    </Sheet>
  );
}
```

---

## 5. Routing Migration

### 5.1 Route Structure

```
GAS Navigation → Next.js App Router

navigateToLevel('dashboard')
  → /dashboard

navigateToLevel('project', projectId, 'board')
  → /projects/[projectId]/board

navigateToLevel('project', projectId, 'list')
  → /projects/[projectId]/list

navigateToLevel('project', projectId, 'calendar')
  → /projects/[projectId]/calendar

navigateToLevel('users')
  → /users

navigateToLevel('settings')
  → /settings
```

### 5.2 Layout Structure

```tsx
// src/app/(dashboard)/layout.tsx

import { Navbar } from '@/components/layout/navbar';
import { Sidebar } from '@/components/layout/sidebar';
import { AuthGuard } from '@/components/auth/auth-guard';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark">
        <Sidebar />
        <div className="flex flex-1 flex-col">
          <Navbar />
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
```

---

## 6. NEW Component Features (Added 2025-10-20)

### 6.1 Checklists Section (HIGH PRIORITY)

โค้ดเดิมมี checklist system ที่แยกจาก subtasks - ต้อง implement ใน Task Panel

```tsx
// src/components/panels/task-panel/checklist-section.tsx

'use client';

import { useState } from 'react';
import { Plus, Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useChecklists } from '@/hooks/use-checklists';
import { cn } from '@/lib/utils';

interface ChecklistSectionProps {
  taskId: string;
  canEdit: boolean;
}

export function ChecklistSection({ taskId, canEdit }: ChecklistSectionProps) {
  const [newItemName, setNewItemName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const {
    items,
    isLoading,
    addItem,
    updateItem,
    deleteItem,
  } = useChecklists(taskId);

  const handleAdd = async () => {
    if (!newItemName.trim()) return;

    try {
      await addItem({ name: newItemName, order: items.length });
      setNewItemName('');
      setIsAdding(false);
    } catch (error) {
      console.error('Failed to add checklist item:', error);
    }
  };

  const handleToggle = async (itemId: string, isChecked: boolean) => {
    try {
      await updateItem({ itemId, isChecked });
    } catch (error) {
      console.error('Failed to toggle checklist item:', error);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('ต้องการลบรายการนี้?')) return;

    try {
      await deleteItem(itemId);
    } catch (error) {
      console.error('Failed to delete checklist item:', error);
    }
  };

  const completedCount = items.filter((item) => item.isChecked).length;
  const totalCount = items.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="space-y-3">
      {/* Header with progress */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium">รายการตรวจสอบ</h3>
          <span className="text-xs text-muted-foreground">
            {completedCount}/{totalCount}
          </span>
        </div>
        {canEdit && !isAdding && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            เพิ่มรายการ
          </Button>
        )}
      </div>

      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Checklist items */}
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-start gap-2 group p-2 rounded-md hover:bg-muted/50"
          >
            <Checkbox
              id={`checklist-${item.id}`}
              checked={item.isChecked}
              onCheckedChange={(checked) =>
                handleToggle(item.id, checked as boolean)
              }
              disabled={!canEdit}
              className="mt-0.5"
            />
            <label
              htmlFor={`checklist-${item.id}`}
              className={cn(
                'flex-1 text-sm cursor-pointer',
                item.isChecked && 'line-through text-muted-foreground'
              )}
            >
              {item.name}
            </label>
            {canEdit && (
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                onClick={() => handleDelete(item.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        ))}

        {/* Add new item form */}
        {isAdding && (
          <div className="flex items-center gap-2 p-2">
            <Checkbox disabled className="mt-0.5" />
            <Input
              placeholder="ชื่อรายการ..."
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd();
                if (e.key === 'Escape') {
                  setIsAdding(false);
                  setNewItemName('');
                }
              }}
              autoFocus
              className="h-8"
            />
            <Button size="sm" onClick={handleAdd}>
              <Check className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setIsAdding(false);
                setNewItemName('');
              }}
            >
              ยกเลิก
            </Button>
          </div>
        )}
      </div>

      {/* Empty state */}
      {totalCount === 0 && !isAdding && (
        <div className="text-center py-6 text-sm text-muted-foreground">
          ยังไม่มีรายการตรวจสอบ
        </div>
      )}
    </div>
  );
}
```

**Integration in Task Panel:**

```tsx
// src/components/panels/task-panel/index.tsx

import { ChecklistSection } from './checklist-section';

export function TaskPanel({ taskId }: { taskId: string }) {
  const { task, canEdit } = useTask(taskId);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <Tabs defaultValue="details">
          <TabsList>
            <TabsTrigger value="details">รายละเอียด</TabsTrigger>
            <TabsTrigger value="comments">ความคิดเห็น</TabsTrigger>
            <TabsTrigger value="history">ประวัติ</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            {/* ... existing task details ... */}

            {/* Checklists Section - NEW */}
            <div className="border-t pt-6">
              <ChecklistSection taskId={taskId} canEdit={canEdit} />
            </div>

            {/* ... subtasks, attachments, etc. ... */}
          </TabsContent>

          {/* ... other tabs ... */}
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
```

### 6.2 Skeleton Loading States (CRITICAL FOR UX)

โค้ดเดิมแสดง "กำลังปิดงาน..." / "กำลังยกเลิกงาน..." ขณะ close task

```tsx
// src/components/views/board-view/task-card-skeleton.tsx

interface TaskCardSkeletonProps {
  message?: string;
}

export function TaskCardSkeleton({ message }: TaskCardSkeletonProps) {
  return (
    <div className="relative">
      {/* Original card with opacity */}
      <div className="opacity-30 pointer-events-none">
        {/* Task card content */}
      </div>

      {/* Skeleton overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <p className="text-sm font-medium">{message || 'กำลังดำเนินการ...'}</p>
        </div>
      </div>
    </div>
  );
}
```

**Usage in Board View:**

```tsx
// src/components/views/board-view/task-card.tsx

interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
  isClosing?: boolean;
  closingType?: 'completing' | 'aborting';
}

export function TaskCard({
  task,
  isDragging,
  isClosing,
  closingType,
}: TaskCardProps) {
  if (isClosing) {
    return (
      <TaskCardSkeleton
        message={
          closingType === 'completing'
            ? 'กำลังปิดงาน...'
            : 'กำลังยกเลิกงาน...'
        }
      />
    );
  }

  // Check if task is closed - make it non-draggable
  const isDraggable = !task.isClosed;

  return (
    <div
      className={cn(
        'bg-card border rounded-lg p-3 space-y-2',
        'hover:shadow-md transition-shadow cursor-pointer',
        isDragging && 'shadow-lg rotate-2',
        task.isClosed && 'opacity-60 cursor-not-allowed'
      )}
      onClick={() => onTaskClick(task.id)}
    >
      {/* Pin indicator */}
      {task.isPinned && (
        <div className="absolute top-2 right-2">
          <Pin className="h-4 w-4 text-primary fill-primary" />
        </div>
      )}

      {/* Task content */}
      <div className="font-medium text-sm">{task.name}</div>

      {/* Priority badge */}
      <PriorityBadge priority={task.priority} />

      {/* Due date */}
      {task.dueDate && (
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {formatDate(task.dueDate)}
        </div>
      )}

      {/* Assignee avatar */}
      {task.assignee && (
        <Avatar className="h-6 w-6">
          <AvatarImage src={task.assignee.profileImageUrl} />
          <AvatarFallback>{task.assignee.fullName[0]}</AvatarFallback>
        </Avatar>
      )}

      {/* Closed badge */}
      {task.isClosed && (
        <Badge variant="secondary" className="text-xs">
          {task.closeType === 'COMPLETED' ? 'ปิดงาน' : 'ยกเลิก'}
        </Badge>
      )}
    </div>
  );
}
```

**State Management:**

```tsx
// src/stores/use-ui-store.ts

import { create } from 'zustand';

interface UIState {
  closingTasks: Set<string>;
  closingTypes: Map<string, 'completing' | 'aborting'>;
  creatingTask: boolean;

  setTaskClosing: (taskId: string, type: 'completing' | 'aborting') => void;
  setTaskClosingComplete: (taskId: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  closingTasks: new Set(),
  closingTypes: new Map(),
  creatingTask: false,

  setTaskClosing: (taskId, type) =>
    set((state) => ({
      closingTasks: new Set(state.closingTasks).add(taskId),
      closingTypes: new Map(state.closingTypes).set(taskId, type),
    })),

  setTaskClosingComplete: (taskId) =>
    set((state) => {
      const newClosing = new Set(state.closingTasks);
      const newTypes = new Map(state.closingTypes);
      newClosing.delete(taskId);
      newTypes.delete(taskId);
      return {
        closingTasks: newClosing,
        closingTypes: newTypes,
      };
    }),
}));
```

### 6.3 Pinned Tasks Handling

```tsx
// src/components/views/list-view/index.tsx

export function ListView({ tasks }: ListViewProps) {
  const { pinnedTaskIds } = usePinnedTasks();

  // Sort: pinned tasks always on top
  const sortedTasks = useMemo(() => {
    const pinned = tasks.filter((t) => pinnedTaskIds.includes(t.id));
    const unpinned = tasks.filter((t) => !pinnedTaskIds.includes(t.id));

    // Apply sorting to unpinned only
    const sortedUnpinned = sortTasks(unpinned, sortColumn, sortDirection);

    return [...pinned, ...sortedUnpinned];
  }, [tasks, pinnedTaskIds, sortColumn, sortDirection]);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">
            <Pin className="h-4 w-4" />
          </TableHead>
          <TableHead>
            <SortableHeader column="name">ชื่องาน</SortableHeader>
          </TableHead>
          {/* ... other headers ... */}
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedTasks.map((task) => (
          <TableRow
            key={task.id}
            className={cn(
              pinnedTaskIds.includes(task.id) && 'bg-primary/5'
            )}
          >
            <TableCell>
              <PinCheckbox taskId={task.id} />
            </TableCell>
            <TableCell>{task.name}</TableCell>
            {/* ... other cells ... */}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

```tsx
// src/components/common/pin-checkbox.tsx

export function PinCheckbox({ taskId }: { taskId: string }) {
  const { pinnedTaskIds, togglePin } = usePinnedTasks();
  const isPinned = pinnedTaskIds.includes(taskId);

  return (
    <Checkbox
      checked={isPinned}
      onCheckedChange={() => togglePin(taskId)}
      className="data-[state=checked]:bg-primary"
    />
  );
}
```

### 6.4 Offline Indicator (OPTIONAL - NICE TO HAVE)

```tsx
// src/components/layout/offline-indicator.tsx

'use client';

import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { useSyncQueue } from '@/stores/use-sync-queue';

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  const { pendingActions } = useSyncQueue();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Alert variant="warning" className="max-w-sm">
        <WifiOff className="h-4 w-4" />
        <AlertDescription>
          <div className="font-medium">โหมดออฟไลน์</div>
          {pendingActions.length > 0 && (
            <div className="text-xs mt-1">
              มี {pendingActions.length} รายการรอซิงค์
            </div>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
}
```

### 6.5 User Dashboard Mini Components

```tsx
// src/components/dashboard/quick-stats.tsx

interface QuickStat {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

export function QuickStats({ stats }: { stats: QuickStat[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
              </div>
              <div className={cn('p-3 rounded-full', stat.color)}>
                {stat.icon}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

```tsx
// src/components/dashboard/mini-calendar.tsx

import { Calendar } from '@/components/ui/calendar';
import { useTasks } from '@/hooks/use-tasks';

export function MiniCalendar() {
  const { tasks } = useTasks();

  // Mark dates with tasks
  const tasksDateMap = useMemo(() => {
    const map = new Map<string, number>();
    tasks.forEach((task) => {
      if (task.dueDate) {
        const dateKey = format(new Date(task.dueDate), 'yyyy-MM-dd');
        map.set(dateKey, (map.get(dateKey) || 0) + 1);
      }
    });
    return map;
  }, [tasks]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">ปฏิทิน</CardTitle>
      </CardHeader>
      <CardContent>
        <Calendar
          mode="single"
          modifiers={{
            hasTasks: (date) => {
              const dateKey = format(date, 'yyyy-MM-dd');
              return tasksDateMap.has(dateKey);
            },
          }}
          modifiersClassNames={{
            hasTasks: 'bg-primary/10 font-bold',
          }}
        />
      </CardContent>
    </Card>
  );
}
```

### 6.6 Dark Mode Calendar Colors

```tsx
// src/components/views/calendar-view/index.tsx

const getPriorityColor = (priority: number, isDark: boolean) => {
  if (isDark) {
    // Dark mode palette
    return {
      1: '#ef4444', // red-500
      2: '#f97316', // orange-500
      3: '#eab308', // yellow-500
      4: '#22c55e', // green-500
    }[priority] || '#6b7280'; // gray-500
  }

  // Light mode palette
  return {
    1: '#dc2626', // red-600
    2: '#ea580c', // orange-600
    3: '#ca8a04', // yellow-600
    4: '#16a34a', // green-600
  }[priority] || '#4b5563'; // gray-600
};

export function CalendarView({ tasks }: CalendarViewProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const events = tasks
    .filter((task) => !task.isClosed && task.dueDate)
    .map((task) => ({
      id: task.id,
      title: task.name,
      start: new Date(task.dueDate),
      end: new Date(task.dueDate),
      backgroundColor: getPriorityColor(task.priority, isDark),
      borderColor: getPriorityColor(task.priority, isDark),
      extendedProps: {
        task,
        isPinned: task.isPinned,
      },
    }));

  return (
    <FullCalendar
      plugins={[dayGridPlugin, interactionPlugin]}
      initialView="dayGridMonth"
      events={events}
      eventContent={(arg) => {
        const isPinned = arg.event.extendedProps.isPinned;
        return (
          <div className="flex items-center gap-1 text-xs p-1">
            {isPinned && <Pin className="h-3 w-3" />}
            <span className="truncate">{arg.event.title}</span>
          </div>
        );
      }}
      // ... other props
    />
  );
}
```

---

## 7. Migration Priority (UPDATED 2025-10-20)

### Phase 1 (Week 1-2): Core UI
- [ ] Layout (Navbar, Sidebar)
- [ ] Routing setup
- [ ] Theme system (dark mode)
- [ ] Authentication pages
- [ ] **Skeleton loading components (NEW)**

### Phase 2 (Week 3-4): Task Management
- [ ] Board View
  - [ ] **Drag-and-drop (with closed task restrictions) (NEW)**
  - [ ] **Skeleton states for closing tasks (NEW)**
  - [ ] **Pin indicators (NEW)**
- [ ] List View
  - [ ] **Pinned tasks sorting logic (NEW)**
  - [ ] **Pin checkbox column (NEW)**
- [ ] Create Task Modal
- [ ] Task Panel
  - [ ] **Checklists section (NEW - HIGH PRIORITY)**
- [ ] Filter Bar

### Phase 3 (Week 4-5): Advanced Features
- [ ] Calendar View
  - [ ] **Dark mode color palette (NEW)**
  - [ ] **Pin indicators on events (NEW)**
  - [ ] **Closed tasks filtering (NEW)**
- [ ] Dashboard Views
  - [ ] **Quick stats cards (NEW)**
  - [ ] **Mini calendar with task indicators (NEW)**
  - [ ] **Pinned tasks section (NEW)**
  - [ ] **Recent activities feed (NEW)**
  - [ ] **Recent comments feed (NEW)**
- [ ] Project Management
- [ ] User Management

### Phase 4 (Week 6): UI Polish & State Management
- [ ] **UI Store for skeleton states (NEW)**
- [ ] **Pinned tasks store and hooks (NEW)**
- [ ] **Offline indicator (OPTIONAL) (NEW)**
- [ ] **Task closing workflows (NEW)**
- [ ] Notification center
- [ ] Responsive design testing
- [ ] Accessibility improvements

### Phase 5 (Week 7): Testing & Refinement
- [ ] Component unit tests
- [ ] Integration tests for complex interactions
- [ ] E2E tests for critical paths (drag-drop, task close, checklists)
- [ ] Cross-browser testing
- [ ] Performance optimization
- [ ] Final UI/UX polish

---

**Component Priority Matrix:**

| Component | Priority | Complexity | Dependencies | Estimated Time |
|-----------|----------|------------|--------------|----------------|
| **Checklists Section** | 🔴 CRITICAL | Medium | API, hooks | 1-2 days |
| **Skeleton States** | 🔴 CRITICAL | Low | UI Store | 0.5 day |
| **Pinned Task Handling** | 🔴 CRITICAL | Medium | API, Store | 1 day |
| **Board View (enhanced)** | 🟡 HIGH | Medium | Drag-drop lib | 2 days |
| **List View (enhanced)** | 🟡 HIGH | Low | Sorting logic | 0.5 day |
| **Calendar Dark Colors** | 🟢 MEDIUM | Low | Theme | 0.5 day |
| **Dashboard Mini Components** | 🟢 MEDIUM | Medium | Data hooks | 1-2 days |
| **Offline Indicator** | ⚪ LOW | Low | Online detection | 0.5 day |

**Total Additional Time:** ~1 week

---

**SUMMARY OF CHANGES:**
- **Original plan:** ~28 components
- **Updated plan:** ~28 components + **6 new feature enhancements**
- **Critical additions:** Checklists (must have), Skeleton states, Pinned handling
- **Nice-to-have:** Offline indicator, Enhanced dashboard
- **Estimated additional time:** +1 week

---

**Document Status:** ✅ UPDATED (2025-10-20)
**Next:** [04_DEPLOYMENT_GUIDE.md](./04_DEPLOYMENT_GUIDE.md)
