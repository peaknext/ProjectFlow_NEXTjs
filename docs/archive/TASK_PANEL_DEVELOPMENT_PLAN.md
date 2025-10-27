# Task Panel Development Plan - Phase 2.4
**เป้าหมาย: พัฒนา Task Panel ให้มี functionality และ UI/UX เหมือนระบบเดิม 95%+**

**วันที่สร้าง**: 2025-10-21
**สถานะ**: In Planning
**Priority**: High (Core Feature)

---

## 📋 สารบัญ

1. [Overview](#overview)
2. [Current State Analysis](#current-state-analysis)
3. [Feature Requirements](#feature-requirements)
4. [UI/UX Specifications](#uiux-specifications)
5. [Technical Architecture](#technical-architecture)
6. [Implementation Plan](#implementation-plan)
7. [Testing Checklist](#testing-checklist)
8. [Migration Strategy](#migration-strategy)

---

## Overview

Task Panel เป็น component หลักที่ใช้แสดงและแก้ไขรายละเอียดงาน มีความซับซ้อนสูงและเป็น critical user flow ที่ใช้บ่อยที่สุดในระบบ

### เป้าหมายหลัก
- ✅ **Functionality Match**: 95%+ เหมือนระบบเดิม
- ✅ **Performance**: โหลดภายใน 300ms, บันทึกภายใน 500ms
- ✅ **UX Consistency**: Animation, interaction patterns เหมือนเดิม
- ✅ **Accessibility**: Keyboard navigation, screen reader support
- ✅ **Mobile Responsive**: ใช้งานได้บนมือถือ

---

## Current State Analysis

### ✅ สิ่งที่มีอยู่แล้ว (Backend 100%)

#### API Endpoints (All Complete)
| Endpoint | Method | Status | Notes |
|----------|--------|--------|-------|
| `/api/tasks/:taskId` | GET | ✅ | รับข้อมูลงานพร้อม relations |
| `/api/tasks/:taskId` | PATCH | ✅ | อัพเดทงาน (partial update) |
| `/api/tasks/:taskId/close` | POST | ✅ | ปิดงาน (COMPLETED/ABORTED) |
| `/api/tasks/:taskId/comments` | GET/POST | ✅ | Comments + @ mentions |
| `/api/tasks/:taskId/checklists` | GET/POST | ✅ | Checklist items |
| `/api/tasks/:taskId/checklists/:itemId` | PATCH/DELETE | ✅ | Update/Delete item |
| `/api/tasks/:taskId/history` | GET | ✅ | Activity timeline |
| `/api/users/me/pinned-tasks` | GET/POST/DELETE | ✅ | Pin/Unpin tasks |

#### Type Definitions
```typescript
// src/hooks/use-tasks.ts
interface Task {
  id: string;
  name: string;
  description: string | null;
  projectId: string;
  statusId: string;
  priority: number;              // 1-4 (1=Urgent, 4=Low)
  difficulty: number | null;      // 1-3 (1=Easy, 3=Hard)
  startDate: string | null;
  dueDate: string | null;
  assigneeUserId: string | null;  // ⚠️ Single assignee (schema limitation)
  parentTaskId: string | null;
  isClosed: boolean;
  closeType: 'COMPLETED' | 'ABORTED' | null;
  closedAt: string | null;
  closedBy: string | null;
  dateCreated: string;
  dateModified: string;
  isPinned?: boolean;

  // Relations
  assignee?: User;
  status?: Status;
  project?: Project;
  creator?: User;
  subtasks?: Task[];
  _count?: {
    subtasks: number;
    comments: number;
    checklists: number;
  };
}

interface Comment {
  id: string;
  taskId: string;
  userId: string;
  text: string;
  mentions: string[];  // User IDs mentioned
  timestamp: string;
  user: User;
}

interface ChecklistItem {
  id: string;
  taskId: string;
  name: string;
  isChecked: boolean;
  order: number;
  dateCreated: string;
}

interface ActivityLog {
  id: string;
  taskId: string;
  userId: string;
  description: string;
  timestamp: string;
  user: User;
}
```

#### State Management
```typescript
// src/stores/use-ui-store.ts
interface UIStore {
  modals: {
    taskPanel: {
      isOpen: boolean;
      taskId?: string;
    };
    createTask: {
      isOpen: boolean;
      projectId?: string;
      defaultStatusId?: string;
    };
  };

  // Loading states
  closingTasks: Set<string>;
  closingTypes: Map<string, 'completing' | 'aborting'>;
  updatingTask: Set<string>;
}
```

#### React Query Mutations (Ready to Use)
```typescript
// src/hooks/use-tasks.ts
const { mutate: updateTask } = useUpdateTask();
const { mutate: closeTask } = useCloseTask();
const { mutate: createComment } = useCreateComment(taskId);
const { mutate: createChecklistItem } = useCreateChecklistItem(taskId);
const { mutate: updateChecklistItem } = useUpdateChecklistItem(taskId);
const { mutate: deleteChecklistItem } = useDeleteChecklistItem(taskId);
const { mutate: togglePin } = useTogglePinTask();
```

### ❌ สิ่งที่ยังไม่มี (Frontend ~0%)

- ❌ Task Panel UI Component (ไม่มีเลย)
- ❌ Create Task Modal (ไม่มีเลย)
- ❌ Assignee Multi-Select Component
- ❌ Priority Popover Component
- ❌ Difficulty Popover Component
- ❌ Date Picker Popover Component
- ❌ Status Slider Component
- ❌ Comments Section with @ Mentions
- ❌ Checklists Section with Inline Edit
- ❌ Subtasks Section with Navigation
- ❌ History Timeline Component
- ❌ Pin Button Integration
- ❌ Close Task Button Integration
- ❌ Dirty State Detection
- ❌ Permission-based Disabling
- ❌ Optimistic UI Updates

---

## Feature Requirements

### 1️⃣ Core Features (Must Have - 100% Match)

#### 1.1 Task Information Display & Edit
| Field | Type | Required | Editable | Validation | Notes |
|-------|------|----------|----------|------------|-------|
| **Task Name** | Text Input | ✅ Yes | ✅ Yes | Min 1 char, Max 500 chars | Large font (text-lg), prominent |
| **Description** | Textarea | ❌ No | ✅ Yes | Max 5000 chars | Min-height 120px, auto-expand |
| **Status** | Range Slider | ❌ No | ✅ Yes | Must select from project statuses | Dynamic gradient based on status colors |
| **Assignee(s)** | Multi-Select | ❌ No | ✅ Yes | ⚠️ Limited to 1 in Phase 2 | Stacked avatars, max 3 visible + overflow |
| **Priority** | Dropdown Popover | ❌ No | ✅ Yes | 1-4 (1=Urgent, 4=Low) | Icon + color + label |
| **Difficulty** | Dropdown Popover | ❌ No | ✅ Yes | 1-3 (1=Easy, 3=Hard) | Colored dot + label |
| **Start Date** | Date Picker | ❌ No | ✅ Yes | Valid date format | Click-to-open popover |
| **Due Date** | Date Picker | ❌ No | ✅ Yes | Valid date format | Click-to-open popover |
| **Parent Task** | Link Display | ❌ No | ❌ No | Read-only, clickable | Only shown if task is subtask |

**Behavior:**
- All fields disabled if `task.isClosed === true`
- All fields disabled if user lacks edit permission (`PermissionUtils.canEditTask()`)
- Show informative notice when editing is restricted
- Auto-enable "Save Changes" button when any field changes (dirty state detection)
- Save button shows loading spinner during save

#### 1.2 Subtasks Section
**Features:**
- List all subtasks with status color dot
- Show first assignee avatar
- Clickable to navigate to subtask (opens in same panel)
- "Add Subtask" button opens Create Task Modal with `defaultParentTaskId`
- Disabled for closed tasks

**Display Format:**
```
[Status Dot] Task Name                    [Avatar]
[Status Dot] Task Name with Long Text...  [Avatar]
```

**Interactions:**
- Click subtask → Opens Task Panel for that subtask (context-aware navigation)
- Click "Add Subtask" → Opens Create Task Modal with parent pre-filled
- Hover effect: Border highlight + background tint

#### 1.3 Checklists Section
**Features:**
- Checkbox toggle (immediate save with optimistic update)
- Completed items show line-through text
- Editable item names (future phase - read-only for now)
- Delete button (hidden until hover, confirmation dialog)
- "Add Checklist Item" button (inline input appears)
- Shows "X/Y completed" count in section header
- Disabled for closed tasks

**Display Format:**
```
☑️ Completed checklist item                    [🗑️]
☐ Pending checklist item                       [🗑️]
```

**Interactions:**
- Click checkbox → Toggle `isChecked` (optimistic update)
- Click delete → Show confirmation dialog → Delete
- Click "Add Item" → Show inline input field + save button

#### 1.4 Comments Section
**Features:**
- Rich text input with @ mention autocomplete (Tribute.js equivalent)
- Submit button (disabled until text entered)
- Comments sorted by newest first
- Shows commenter avatar + name + timestamp
- Mentions rendered as highlighted tags
- Current user avatar displayed in input area
- Disabled for closed tasks

**@ Mention Autocomplete:**
- Trigger: Type `@` character
- Shows dropdown list of mentionable users (project members)
- Filter by name as user types
- Select with Enter or Click
- Rendered as: `<strong class="mention">@Username</strong>`
- Backend extracts mentions and creates notifications

**Display Format:**
```
[Avatar] John Doe • 5 minutes ago
         This is a comment with @Jane mention

[Avatar] Jane Smith • 1 hour ago
         Another comment here
```

**Interactions:**
- Type in textarea → Enable submit button
- Submit → Optimistic add to list → API call → Replace with real data
- Show loading spinner on button during submit

#### 1.5 History Timeline
**Features:**
- Tab-switched view (Details ↔ History)
- Shows all activity logs sorted by newest first
- Activity types: Created, Updated, Closed, Reopened, Comment added, Checklist changed
- Shows user avatar + description + relative time

**Display Format:**
```
[Avatar] John Doe updated status to "In Progress" • 5 minutes ago
[Avatar] Jane Smith added a comment • 1 hour ago
[Avatar] John Doe created this task • 2 hours ago
```

#### 1.6 Pin Task Button
**Features:**
- Toggle pin state (star icon filled/outlined)
- Persists per user (not per project)
- Shows in header next to close button
- Visual feedback on click (icon color change)
- Updates pinned tasks list in sidebar

**Implementation:**
```typescript
const { mutate: togglePin } = useTogglePinTask();

const handlePinClick = () => {
  togglePin({ taskId }, {
    onSuccess: () => {
      // Icon updates automatically via React Query invalidation
    }
  });
};
```

#### 1.7 Close Task Button
**Features:**
- Context-aware label based on current status
- Dynamic icon based on close type (check_circle vs cancel)
- Shows in footer (bottom-left)
- Opens confirmation dialog with close type selection (Complete/Abort)
- Ghost button style (transparent background)
- Hidden if task already closed
- Disabled if user lacks permission

**Button States:**
| Current Status | Button Label | Close Type |
|----------------|--------------|------------|
| First Status (0%) | "ยกเลิกงาน" | ABORTED |
| Mid Status (1-99%) | "ปิดงาน" | User chooses |
| Last Status (100%) | "ทำสำเร็จ" | COMPLETED |

**Confirmation Dialog:**
```
ปิดงานนี้หรือไม่?

● ทำสำเร็จ (COMPLETED)
  งานนี้ถูกทำเสร็จสมบูรณ์

● ยกเลิก (ABORTED)
  งานนี้ถูกยกเลิกโดยไม่สำเร็จ

[ยกเลิก]  [ยืนยัน]
```

#### 1.8 Save Changes Button
**Features:**
- Initially disabled (dirty state detection)
- Enables when any field changes
- Shows loading spinner during save
- Fixed width to prevent layout shift
- Validates required fields before save
- Shows success/error toast after save
- Re-disables after successful save

**Validation:**
- Task name required (min 1 char)
- Status must be valid
- Dates must be valid format if provided
- Priority/Difficulty must be valid values

---

### 2️⃣ UI Components to Build

#### Component Hierarchy
```
TaskPanel (Main Container)
├── TaskPanelHeader
│   ├── Title
│   ├── PinButton
│   └── CloseButton
├── TabNavigation
│   ├── DetailsTab (default active)
│   └── HistoryTab
├── TaskPanelBody (Scrollable)
│   ├── DetailsContent
│   │   ├── ParentTaskBanner (conditional)
│   │   ├── TaskNameInput
│   │   ├── StatusSlider
│   │   │   ├── SliderInput
│   │   │   ├── StatusLabels
│   │   │   └── StatusFeedback
│   │   ├── FieldGrid (3 columns on desktop)
│   │   │   ├── AssigneeSelector
│   │   │   │   ├── AssigneeTrigger
│   │   │   │   └── AssigneePopover (portal)
│   │   │   ├── PrioritySelector
│   │   │   │   ├── PriorityTrigger
│   │   │   │   └── PriorityPopover (portal)
│   │   │   ├── DifficultySelector
│   │   │   │   ├── DifficultyTrigger
│   │   │   │   └── DifficultyPopover (portal)
│   │   │   ├── StartDatePicker
│   │   │   │   ├── DateInput
│   │   │   │   └── DatePickerPopover (portal)
│   │   │   └── DueDatePicker
│   │   │       ├── DateInput
│   │   │       └── DatePickerPopover (portal)
│   │   ├── DescriptionTextarea
│   │   ├── TaskMetadata (Creator, Date Created)
│   │   ├── SubtasksSection
│   │   │   ├── SectionHeader
│   │   │   ├── SubtaskList
│   │   │   │   └── SubtaskItem (clickable)
│   │   │   └── AddSubtaskButton
│   │   ├── ChecklistsSection
│   │   │   ├── SectionHeader (with count)
│   │   │   ├── ChecklistList
│   │   │   │   └── ChecklistItem
│   │   │   │       ├── Checkbox
│   │   │   │       ├── ItemName
│   │   │   │       └── DeleteButton (hover-visible)
│   │   │   ├── AddChecklistButton
│   │   │   └── InlineChecklistForm (conditional)
│   │   └── CommentsSection
│   │       ├── SectionHeader
│   │       ├── CommentForm
│   │       │   ├── CurrentUserAvatar
│   │       │   ├── CommentInput (with @ mentions)
│   │       │   └── SubmitButton
│   │       └── CommentsList
│   │           └── CommentItem
│   │               ├── UserAvatar
│   │               ├── UserName
│   │               ├── Timestamp
│   │               └── CommentText (with mentions)
│   └── HistoryContent (hidden by default)
│       └── HistoryTimeline
│           └── ActivityItem
│               ├── UserAvatar
│               ├── Description
│               └── Timestamp
└── TaskPanelFooter
    ├── CloseTaskButton (bottom-left)
    └── SaveChangesButton (bottom-right)
```

#### Reusable Sub-Components

##### 1. AssigneePopover
```typescript
<AssigneePopover
  users={projectUsers}
  selectedUserIds={selectedAssigneeIds}
  onSave={(newIds) => setSelectedAssigneeIds(newIds)}
  onCancel={() => {}}
/>
```

**Features:**
- Search/filter users by name
- Multi-select with checkboxes
- Shows user avatar + name
- Selected users shown with checkmark icon
- Save/Cancel buttons
- Max 3 avatars shown in trigger, rest as "+N"

##### 2. PriorityPopover
```typescript
<PriorityPopover
  currentValue={priority}
  onChange={(newPriority) => setPriority(newPriority)}
/>
```

**Options:**
| Value | Label | Icon | Color |
|-------|-------|------|-------|
| 1 | ด่วนที่สุด | flag | #ef4444 (red-500) |
| 2 | ด่วน | flag | #f97316 (orange-500) |
| 3 | ปกติ | flag | #eab308 (yellow-500) |
| 4 | ต่ำ | flag | #22c55e (green-500) |

##### 3. DifficultyPopover
```typescript
<DifficultyPopover
  currentValue={difficulty}
  onChange={(newDifficulty) => setDifficulty(newDifficulty)}
/>
```

**Options:**
| Value | Label | Color |
|-------|-------|-------|
| 1 | ง่าย | #22c55e (green-500) |
| 2 | ปกติ | #eab308 (yellow-500) |
| 3 | ยาก | #ef4444 (red-500) |

##### 4. DatePickerPopover
```typescript
<DatePickerPopover
  value={selectedDate}
  onChange={(newDate) => setSelectedDate(newDate)}
  onClear={() => setSelectedDate(null)}
/>
```

**Features:**
- Calendar grid view
- Month/Year navigation
- Today button
- Clear button
- Thai locale support
- Keyboard navigation

##### 5. StatusSlider
```typescript
<StatusSlider
  statuses={projectStatuses}
  value={statusId}
  onChange={(newStatusId) => setStatusId(newStatusId)}
  disabled={isClosed || !canEdit}
/>
```

**Features:**
- Range input (0 to statuses.length - 1)
- Dynamic gradient track (filled portion uses status colors)
- Thumb color matches current status
- Labels below slider (status names)
- Feedback text above slider (current status name)
- Focus ring matches status color

**Gradient Calculation:**
```typescript
const gradientStops = statuses
  .slice(0, currentIndex + 1)
  .map((status, i) => {
    const percent = (i / (statuses.length - 1)) * 100;
    return `${status.color} ${percent}%`;
  })
  .join(', ');

const gradient = currentIndex < statuses.length - 1
  ? `linear-gradient(to right, ${gradientStops}, #e5e7eb ${cutoffPercent}%, #e5e7eb 100%)`
  : `linear-gradient(to right, ${gradientStops})`;
```

---

### 3️⃣ User Interactions & Workflows

#### Workflow 1: Open Task Panel
```
User clicks task card/row
  → UIStore.setTaskPanelOpen(taskId)
  → TaskPanel component mounts
  → useTask(taskId) fetches data
  → Panel slides in from right (300ms animation)
  → Details tab active by default
  → All fields populated from task data
  → Dirty state initialized (disable save button)
  → Permission check runs (disable fields if needed)
  → Close button setup runs (determine label/icon)
```

#### Workflow 2: Edit Task Fields
```
User changes any field
  → onChange handler fires
  → Dirty state detector runs
  → Compare current values with initial values
  → Enable save button if different
  → Visual feedback (save button color change)
```

#### Workflow 3: Save Task Changes
```
User clicks "Save Changes"
  → Validate all fields
  → Show loading spinner on button
  → Disable button + all form fields
  → useUpdateTask mutation fires
  → OPTIMISTIC UPDATE: Update React Query cache immediately
  → Send PATCH /api/tasks/:taskId
  → On Success:
      → Invalidate queries (task detail, board data)
      → Show success toast
      → Re-enable form fields
      → Disable save button (reset dirty state)
      → Store new initial state
  → On Error:
      → Rollback cache to previous state
      → Show error toast
      → Re-enable form fields
      → Keep save button enabled
```

#### Workflow 4: Toggle Checklist Item
```
User clicks checkbox
  → OPTIMISTIC UPDATE: Toggle isChecked in cache
  → useUpdateChecklistItem mutation fires
  → Send PATCH /api/tasks/:taskId/checklists/:itemId
  → On Success:
      → Invalidate checklist query
      → Update count in header
  → On Error:
      → Rollback checkbox state
      → Show error toast
```

#### Workflow 5: Add Comment
```
User types in comment input
  → Enable submit button
  → User types @ character
  → Tribute.js shows user autocomplete
  → User selects mention
  → Mention inserted as styled tag
User clicks submit
  → Extract plain text + mention IDs
  → Show loading spinner
  → Disable input + button
  → useCreateComment mutation fires
  → OPTIMISTIC UPDATE: Add temp comment to list
  → Send POST /api/tasks/:taskId/comments
  → On Success:
      → Replace temp comment with real comment
      → Clear input
      → Re-enable input + button
      → Invalidate comments query
  → On Error:
      → Remove temp comment
      → Show error toast
      → Restore input text
```

#### Workflow 6: Close Task
```
User clicks "Close Task" button
  → Show confirmation dialog
  → User selects close type (COMPLETED/ABORTED)
  → User confirms
  → useCloseTask mutation fires
  → OPTIMISTIC UPDATE: Mark task as closed in cache
  → Send POST /api/tasks/:taskId/close
  → On Success:
      → Invalidate task detail query
      → Show success toast
      → Update task card in background view
      → Disable all form fields
      → Hide close button
      → Hide save button
  → On Error:
      → Rollback task state
      → Show error toast
```

#### Workflow 7: Switch to History Tab
```
User clicks "History" tab
  → Hide details content (add 'hidden' class)
  → Show history content (remove 'hidden' class)
  → Update tab styles (border + text color)
  → useTaskHistory query fetches if not cached
  → Render activity timeline
```

#### Workflow 8: Navigate to Subtask
```
User clicks subtask item
  → Store current taskId in context (for back navigation)
  → Update taskPanelOpen state with new taskId
  → TaskPanel re-renders with new task data
  → User can click parent task link to go back
```

---

### 4️⃣ Permission & Access Control

#### Permission Rules
```typescript
interface TaskPermissions {
  canView: boolean;      // Anyone in organization
  canEdit: boolean;      // Creator, Assignee, CHIEF+, Dept HEAD+
  canClose: boolean;     // Creator, Assignee, CHIEF+, Dept HEAD+
  canComment: boolean;   // Anyone in organization (unless closed)
  canAddChecklist: boolean; // Same as canEdit (unless closed)
  canAddSubtask: boolean;   // Same as canEdit (unless closed)
}
```

#### Closed Task Restrictions
When `task.isClosed === true`:
- ❌ Disable all form fields
- ❌ Disable save button (hide it)
- ❌ Disable close button (already closed)
- ❌ Disable comment input
- ❌ Disable add checklist button
- ❌ Disable add subtask button
- ✅ Allow viewing all data
- ✅ Show "งานนี้ถูกปิดแล้ว" notice

#### No Edit Permission Restrictions
When `!canEdit && !isClosed`:
- ❌ Disable task name, description, status, assignee, priority, difficulty, dates
- ❌ Disable save button (hide it)
- ✅ Allow commenting
- ✅ Allow adding checklists
- ✅ Allow adding subtasks
- ✅ Show "คุณสามารถเพิ่ม Subtask, Checklist และ Comment ได้ แต่ไม่สามารถแก้ไขข้อมูลหลักของงานได้" notice

---

### 5️⃣ Animation & Transitions

#### Panel Slide Animation
```css
/* Initial state (hidden) */
.task-panel {
  transform: translateX(100%);
  transition: transform 300ms ease-in-out;
}

/* Open state */
.task-panel.open {
  transform: translateX(0);
}
```

#### Overlay Fade Animation
```css
/* Initial state */
.task-panel-overlay {
  opacity: 0;
  pointer-events: none;
  transition: opacity 300ms ease-in-out;
}

/* Open state */
.task-panel-overlay.open {
  opacity: 1;
  pointer-events: auto;
}
```

#### Save Button Loading State
```typescript
<button disabled={isSaving || !isDirty}>
  {isSaving && <Spinner className="animate-spin" />}
  <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}</span>
</button>
```

---

## Technical Architecture

### File Structure
```
src/
├── components/
│   ├── task-panel/
│   │   ├── index.tsx                    # Main TaskPanel component
│   │   ├── task-panel-header.tsx        # Header with title, pin, close
│   │   ├── task-panel-footer.tsx        # Footer with close task + save buttons
│   │   ├── task-panel-tabs.tsx          # Details/History tab navigation
│   │   ├── details-tab/
│   │   │   ├── index.tsx                # DetailsTab container
│   │   │   ├── parent-task-banner.tsx   # Parent task link (for subtasks)
│   │   │   ├── task-name-input.tsx      # Task name field
│   │   │   ├── status-slider.tsx        # Status slider component
│   │   │   ├── field-grid.tsx           # 3-column grid container
│   │   │   ├── assignee-selector.tsx    # Assignee field + popover
│   │   │   ├── priority-selector.tsx    # Priority field + popover
│   │   │   ├── difficulty-selector.tsx  # Difficulty field + popover
│   │   │   ├── date-picker.tsx          # Start/Due date picker
│   │   │   ├── description-textarea.tsx # Description field
│   │   │   ├── task-metadata.tsx        # Creator, date created
│   │   │   ├── subtasks-section.tsx     # Subtasks list + add button
│   │   │   ├── checklists-section.tsx   # Checklists list + add button
│   │   │   └── comments-section.tsx     # Comments list + form
│   │   ├── history-tab/
│   │   │   ├── index.tsx                # HistoryTab container
│   │   │   ├── activity-timeline.tsx    # Timeline component
│   │   │   └── activity-item.tsx        # Single activity entry
│   │   └── hooks/
│   │       ├── use-task-panel.ts        # Panel state management
│   │       ├── use-dirty-state.ts       # Dirty state detection
│   │       └── use-task-permissions.ts  # Permission checks
│   └── ui/
│       ├── assignee-popover.tsx         # Reusable assignee selector
│       ├── priority-popover.tsx         # Reusable priority selector
│       ├── difficulty-popover.tsx       # Reusable difficulty selector
│       ├── date-picker-popover.tsx      # Reusable date picker
│       ├── status-slider.tsx            # Reusable status slider
│       └── mention-input.tsx            # Input with @ mentions
├── hooks/
│   └── use-tasks.ts                     # (Already exists) Task mutations
└── stores/
    └── use-ui-store.ts                  # (Already exists) Modal state
```

### State Management Strategy

#### 1. Server State (React Query)
```typescript
// All task data from backend
const { data: task, isLoading } = useTask(taskId);
const { data: comments } = useTaskComments(taskId);
const { data: checklists } = useTaskChecklists(taskId);
const { data: history } = useTaskHistory(taskId);
const { data: subtasks } = useTasks({ parentTaskId: taskId });
```

#### 2. UI State (Zustand)
```typescript
// Modal open/close state
const { taskPanel, setTaskPanelOpen, setTaskPanelClosed } = useUIStore();

// Loading states
const { closingTasks, updatingTask } = useUIStore();
```

#### 3. Form State (React Hook Form)
```typescript
const {
  register,
  handleSubmit,
  formState: { isDirty, errors },
  reset,
  watch
} = useForm<TaskFormData>({
  defaultValues: {
    name: task.name,
    description: task.description,
    statusId: task.statusId,
    priority: task.priority,
    difficulty: task.difficulty,
    startDate: task.startDate,
    dueDate: task.dueDate,
    assigneeUserIds: task.assigneeUserId ? [task.assigneeUserId] : []
  }
});
```

#### 4. Dirty State Detection
```typescript
// Custom hook for dirty state
const useDirtyState = (initialData: TaskFormData, currentData: TaskFormData) => {
  const isDirty = useMemo(() => {
    return JSON.stringify(initialData) !== JSON.stringify(currentData);
  }, [initialData, currentData]);

  return isDirty;
};
```

### Optimistic Update Pattern

**Standard Pattern (Used Throughout):**
```typescript
const mutation = useSyncMutation({
  mutationFn: ({ id, data }) => api.patch(`/api/tasks/${id}`, data),

  onMutate: async ({ id, data }) => {
    // 1. Cancel outgoing queries
    await queryClient.cancelQueries({ queryKey: taskKeys.detail(id) });

    // 2. Save previous state
    const previousTask = queryClient.getQueryData(taskKeys.detail(id));

    // 3. Update cache immediately (OPTIMISTIC)
    queryClient.setQueryData(taskKeys.detail(id), (old: any) => ({
      ...old,
      ...data
    }));

    return { previousTask };
  },

  onError: (error, { id }, context) => {
    // 4. Rollback on error
    if (context?.previousTask) {
      queryClient.setQueryData(taskKeys.detail(id), context.previousTask);
    }
  },

  onSettled: (response) => {
    // 5. Sync with server (refetch)
    if (response?.task) {
      queryClient.invalidateQueries({ queryKey: taskKeys.detail(response.task.id) });
    }
  }
});
```

### @ Mention Implementation

**Using Tribute.js (React Wrapper):**
```typescript
import Tribute from 'tributejs';
import { useEffect, useRef } from 'react';

const useMentions = (users: User[], onMention: (userId: string) => void) => {
  const inputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!inputRef.current) return;

    const tribute = new Tribute({
      trigger: '@',
      values: (text, cb) => {
        const filtered = users.filter(u =>
          u.name.toLowerCase().includes(text.toLowerCase())
        );
        cb(filtered.map(u => ({ key: u.name, value: u.name, ...u })));
      },
      lookup: 'name',
      fillAttr: 'name',
      menuItemTemplate: (item) => {
        return `
          <div class="flex items-center gap-3">
            <img class="w-8 h-8 rounded-full" src="${item.original.avatar}" />
            <span>${item.original.name}</span>
          </div>
        `;
      },
      selectTemplate: (item) => {
        onMention(item.original.id);
        return `<strong class="mention" data-user-id="${item.original.id}">@${item.original.name}</strong> `;
      }
    });

    tribute.attach(inputRef.current);

    return () => tribute.detach(inputRef.current);
  }, [users]);

  return inputRef;
};
```

---

## Implementation Plan

### Phase 1: Foundation Components (Week 1)
**Goal: Build reusable UI components**

#### Day 1-2: Core UI Components
- [ ] Create `src/components/ui/status-slider.tsx`
  - Range input with dynamic gradient
  - Status labels below slider
  - Feedback text above slider
  - Dark mode support
  - Disabled state

- [ ] Create `src/components/ui/priority-popover.tsx`
  - 4 priority options with icons + colors
  - Click-to-toggle popover
  - Auto-close on selection
  - Portal rendering

- [ ] Create `src/components/ui/difficulty-popover.tsx`
  - 3 difficulty options with colored dots
  - Same pattern as priority

- [ ] Create `src/components/ui/date-picker-popover.tsx`
  - Calendar grid view
  - Month/Year navigation
  - Thai locale
  - Clear button
  - Today button

#### Day 3-4: Advanced UI Components
- [ ] Create `src/components/ui/assignee-popover.tsx`
  - Multi-select with checkboxes
  - Search/filter by name
  - User avatar + name display
  - Selected state with checkmark
  - Save/Cancel buttons
  - Stacked avatars in trigger (max 3 + overflow)

- [ ] Create `src/components/ui/mention-input.tsx`
  - ContentEditable div with Tribute.js
  - @ mention autocomplete
  - User search dropdown
  - Mention rendering (styled tags)
  - Extract mentions on submit
  - Placeholder support

#### Day 5: Custom Hooks
- [ ] Create `src/hooks/use-dirty-state.ts`
  - Compare initial vs current form data
  - Deep equality check
  - Debounced comparison
  - Return `isDirty` boolean

- [ ] Create `src/hooks/use-task-permissions.ts`
  - Check `canEditTask(task)` from permissions lib
  - Check `task.isClosed` state
  - Return permission flags

- [ ] Create `src/components/task-panel/hooks/use-task-panel.ts`
  - Panel open/close state
  - Context-aware navigation (parent task tracking)
  - Tab switching logic

**Testing:**
- Storybook stories for all UI components
- Unit tests for hooks
- Visual regression tests

---

### Phase 2: Task Panel Structure (Week 2)
**Goal: Build panel layout and basic interactions**

#### Day 1-2: Panel Container & Header
- [ ] Create `src/components/task-panel/index.tsx`
  - Slide-in overlay panel
  - Fixed positioning (right side)
  - Max width 3xl
  - Backdrop blur + semi-transparent
  - Slide animation (300ms)
  - Dark mode support

- [ ] Create `src/components/task-panel/task-panel-header.tsx`
  - Title text
  - Pin button (toggle filled/outlined icon)
  - Close button (close panel)
  - Border bottom

- [ ] Create `src/components/task-panel/task-panel-footer.tsx`
  - Close Task button (bottom-left)
  - Save Changes button (bottom-right)
  - Loading states
  - Disabled states

- [ ] Create `src/components/task-panel/task-panel-tabs.tsx`
  - Details tab (default active)
  - History tab
  - Tab switching logic
  - Active state styling (border + color)

#### Day 3-4: Details Tab Structure
- [ ] Create `src/components/task-panel/details-tab/index.tsx`
  - Scrollable container
  - Section dividers
  - Spacing system

- [ ] Create `src/components/task-panel/details-tab/parent-task-banner.tsx`
  - Conditional display (only for subtasks)
  - Clickable link to parent
  - Icon + text

- [ ] Create `src/components/task-panel/details-tab/task-name-input.tsx`
  - Large font (text-lg)
  - Form validation
  - onChange handler

- [ ] Create `src/components/task-panel/details-tab/field-grid.tsx`
  - 3-column grid on desktop
  - 1-column on mobile
  - Responsive breakpoints

- [ ] Create `src/components/task-panel/details-tab/description-textarea.tsx`
  - Min-height 120px
  - Auto-expand on content
  - Character count (optional)

- [ ] Create `src/components/task-panel/details-tab/task-metadata.tsx`
  - Creator name
  - Date created
  - Small text, muted color

#### Day 5: Field Selectors Integration
- [ ] Create `src/components/task-panel/details-tab/assignee-selector.tsx`
  - Use AssigneePopover component
  - Trigger button with stacked avatars
  - onChange handler to update form state

- [ ] Create `src/components/task-panel/details-tab/priority-selector.tsx`
  - Use PriorityPopover component
  - Show current value in trigger

- [ ] Create `src/components/task-panel/details-tab/difficulty-selector.tsx`
  - Use DifficultyPopover component

- [ ] Create `src/components/task-panel/details-tab/date-picker.tsx`
  - Use DatePickerPopover component
  - Start date + Due date fields
  - Calendar icon

**Testing:**
- Integration tests for panel opening/closing
- Snapshot tests for layout
- Accessibility tests (keyboard navigation)

---

### Phase 3: Interactive Sections (Week 3)
**Goal: Implement subtasks, checklists, comments**

#### Day 1-2: Subtasks Section
- [ ] Create `src/components/task-panel/details-tab/subtasks-section.tsx`
  - Section header with title
  - Subtask list (clickable items)
  - Add subtask button
  - Empty state message

- [ ] Implement subtask item rendering
  - Status color dot
  - Task name (truncated if long)
  - First assignee avatar
  - Hover effect (border highlight)
  - Click handler (navigate to subtask)

- [ ] Integrate with Create Task Modal
  - Pass `defaultParentTaskId` when adding subtask
  - Refresh subtasks list after creation

#### Day 3-4: Checklists Section
- [ ] Create `src/components/task-panel/details-tab/checklists-section.tsx`
  - Section header with "X/Y completed" count
  - Checklist items list
  - Add checklist button
  - Inline add form (conditional)

- [ ] Implement checklist item component
  - Checkbox (toggle with optimistic update)
  - Item name (read-only for now)
  - Line-through styling for completed
  - Delete button (hover-visible)
  - Delete confirmation dialog

- [ ] Implement add checklist form
  - Inline text input
  - Save button
  - Cancel button
  - Form validation
  - useCreateChecklistItem mutation

- [ ] Implement checkbox toggle
  - useUpdateChecklistItem mutation
  - Optimistic update pattern
  - Loading state on checkbox

#### Day 5: Comments Section
- [ ] Create `src/components/task-panel/details-tab/comments-section.tsx`
  - Section header
  - Comment form (current user avatar + input)
  - Comments list (sorted newest first)
  - Empty state message

- [ ] Implement comment form
  - Use MentionInput component
  - Submit button (disabled until text entered)
  - Loading spinner on submit
  - Clear input after submit
  - useCreateComment mutation

- [ ] Implement comment rendering
  - User avatar
  - User name
  - Timestamp (relative time)
  - Comment text (with mentions highlighted)
  - Markdown support (optional)

**Testing:**
- E2E tests for adding/toggling checklists
- E2E tests for adding comments with mentions
- Unit tests for checklist count calculation

---

### Phase 4: History & Advanced Features (Week 4)
**Goal: Complete remaining features**

#### Day 1-2: History Tab
- [ ] Create `src/components/task-panel/history-tab/index.tsx`
  - Container with padding
  - Empty state message
  - useTaskHistory query

- [ ] Create `src/components/task-panel/history-tab/activity-timeline.tsx`
  - Vertical timeline layout
  - Border lines between items

- [ ] Create `src/components/task-panel/history-tab/activity-item.tsx`
  - User avatar
  - Activity description
  - Relative timestamp
  - Icon based on activity type (optional)

#### Day 3: Save & Close Functionality
- [ ] Implement Save Changes button
  - Dirty state detection
  - Form validation
  - useUpdateTask mutation
  - Optimistic update
  - Loading spinner
  - Success/error toasts

- [ ] Implement Close Task button
  - Context-aware label (based on current status)
  - Confirmation dialog
  - Close type selection (COMPLETED/ABORTED)
  - useCloseTask mutation
  - Update task state in cache
  - Disable form fields after close

#### Day 4: Pin Task Integration
- [ ] Implement Pin button
  - useTogglePinTask mutation
  - Icon toggle (filled/outlined)
  - Optimistic update
  - Update sidebar pinned list

#### Day 5: Permission & Access Control
- [ ] Implement permission checks
  - Use useTaskPermissions hook
  - Disable fields based on permissions
  - Show informative notices
  - Hide save button if no edit permission
  - Disable comments/checklists for closed tasks

- [ ] Implement closed task handling
  - Disable all form fields
  - Disable comment input
  - Show "งานนี้ถูกปิดแล้ว" notice
  - Hide close task button

**Testing:**
- E2E tests for save workflow
- E2E tests for close workflow
- Permission-based UI tests
- Closed task state tests

---

### Phase 5: Create Task Modal (Week 5)
**Goal: Build task creation interface**

#### Day 1-2: Modal Structure
- [ ] Create `src/components/create-task-modal/index.tsx`
  - Slide-in overlay modal (same as task panel)
  - Header with title + close button
  - Form container
  - Footer with save button

- [ ] Create form fields
  - Task name (required)
  - Status slider
  - Assignee selector
  - Priority selector
  - Difficulty selector
  - Start/Due date pickers
  - Project selector (dropdown)
  - Parent task selector (TomSelect equivalent)
  - Description textarea

- [ ] Implement parent task display
  - Banner when creating subtask (defaultParentTaskId)
  - Hide TomSelect, show parent task info
  - Clickable link to parent task

#### Day 3-4: Form Logic
- [ ] Implement form validation
  - Task name required
  - Project required
  - Field error display

- [ ] Implement project selector
  - Dropdown list of user's projects
  - Filter by department
  - Auto-select if opened from project view
  - Load project data (users, statuses) on selection

- [ ] Implement parent task selector
  - Search/autocomplete (like TomSelect)
  - Filter by project
  - Show task name only (no description)

#### Day 5: Optimistic Creation
- [ ] Implement save logic
  - Generate tempId
  - Create temp task object
  - Add to appState tasks
  - Close modal immediately
  - Render temp task in view (skeleton style)
  - useCreateTask mutation
  - Replace temp task with real task on success
  - Remove temp task on error

- [ ] Implement context-aware creation
  - Remember current project
  - Remember default dates (if provided)
  - Remember parent task (if subtask)
  - Callback after creation (optional)

**Testing:**
- E2E tests for task creation
- Validation tests
- Optimistic UI tests
- Subtask creation tests

---

### Phase 6: Polish & Optimization (Week 6)
**Goal: Refine UX and optimize performance**

#### Day 1-2: Performance Optimization
- [ ] Implement lazy loading
  - Comments load on demand (not on panel open)
  - History load on tab switch (not on panel open)
  - Checklists load on demand

- [ ] Optimize re-renders
  - Memoize expensive components
  - Use React.memo for list items
  - Debounce dirty state checks

- [ ] Optimize API calls
  - Batch requests where possible
  - Cache project data (users, statuses)
  - Use stale-while-revalidate strategy

#### Day 3-4: UX Refinements
- [ ] Add loading skeletons
  - Task panel loading state
  - Comments loading state
  - History loading state

- [ ] Add animations
  - Smooth transitions between states
  - Hover effects on interactive elements
  - Focus states for accessibility

- [ ] Add keyboard shortcuts
  - Esc to close panel
  - Cmd/Ctrl+S to save
  - Cmd/Ctrl+Enter to submit comment

- [ ] Add success/error feedback
  - Toast notifications
  - Inline validation messages
  - Loading indicators

#### Day 5: Mobile Responsiveness
- [ ] Optimize for mobile
  - Full-width panel on small screens
  - Adjusted field grid (1 column)
  - Touch-friendly buttons (min 44px)
  - Bottom sheet style (optional)

- [ ] Test on various screen sizes
  - Mobile (320px - 768px)
  - Tablet (768px - 1024px)
  - Desktop (1024px+)

**Testing:**
- Performance profiling
- Lighthouse audit
- Mobile device testing
- Accessibility audit (WCAG 2.1 AA)

---

## Testing Checklist

### Unit Tests
- [ ] StatusSlider component
- [ ] PriorityPopover component
- [ ] DifficultyPopover component
- [ ] DatePickerPopover component
- [ ] AssigneePopover component
- [ ] MentionInput component
- [ ] useDirtyState hook
- [ ] useTaskPermissions hook

### Integration Tests
- [ ] Task panel opening/closing
- [ ] Form field interactions
- [ ] Dirty state detection
- [ ] Permission-based disabling
- [ ] Tab switching
- [ ] Subtask navigation

### E2E Tests
- [ ] Complete edit workflow (open → edit → save → close)
- [ ] Add comment with mention
- [ ] Toggle checklist item
- [ ] Add checklist item
- [ ] Delete checklist item
- [ ] Close task (COMPLETED)
- [ ] Close task (ABORTED)
- [ ] Create new task
- [ ] Create subtask
- [ ] Pin/Unpin task
- [ ] Navigate to parent task
- [ ] Navigate to subtask
- [ ] View history timeline

### Accessibility Tests
- [ ] Keyboard navigation (Tab, Enter, Esc)
- [ ] Screen reader compatibility
- [ ] Focus management
- [ ] ARIA labels
- [ ] Color contrast (WCAG AA)

### Performance Tests
- [ ] Task panel load time < 300ms
- [ ] Save operation < 500ms
- [ ] Comment submit < 300ms
- [ ] Checklist toggle < 200ms
- [ ] No layout shift (CLS)
- [ ] No memory leaks

### Browser Compatibility
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS 14+)
- [ ] Mobile Chrome (Android 10+)

---

## Migration Strategy

### Schema Limitations (Phase 2)
**Current State:**
- `assigneeUserId` is single string (not array)
- Need to migrate to `assigneeUserIds: string[]` in Phase 3

**Workaround for Phase 2:**
```typescript
// Display only first assignee
const assigneeIds = task.assigneeUserId ? [task.assigneeUserId] : [];

// When saving, take first selected user
const assigneeUserId = selectedAssigneeIds[0] || null;
```

**Future Migration (Phase 3.2):**
1. Add `assigneeUserIds` column to database
2. Migrate data from `assigneeUserId` to `assigneeUserIds`
3. Update API endpoints to accept array
4. Update frontend to fully support multi-select
5. Remove `assigneeUserId` column

### Data Migration from Original System
**Not applicable** - Task Panel is frontend-only migration. All data already in PostgreSQL.

### Backward Compatibility
**Not required** - Original GAS system is deprecated. No need for backward compatibility.

---

## Success Metrics

### Functionality Match
- ✅ **95%+ Feature Parity**: All original features implemented
- ✅ **UI/UX Consistency**: Design matches original within 5% difference
- ✅ **Permission Logic**: Identical to original system

### Performance
- ✅ **Load Time**: Task panel opens in < 300ms
- ✅ **Save Time**: Changes saved in < 500ms
- ✅ **Responsive**: No janky scrolling (60fps)

### Quality
- ✅ **Test Coverage**: 80%+ code coverage
- ✅ **Accessibility**: WCAG 2.1 AA compliance
- ✅ **Browser Support**: Works on all modern browsers

### User Experience
- ✅ **Error Handling**: Clear error messages
- ✅ **Loading States**: Skeleton screens, spinners
- ✅ **Feedback**: Toast notifications for all actions
- ✅ **Keyboard Support**: All actions keyboard accessible

---

## Known Limitations & Future Work

### Phase 2 Limitations
1. **Single Assignee Only** - Multi-assignee requires schema change (Phase 3.2)
2. **No Real-time Updates** - Requires WebSocket implementation (Phase 4)
3. **No Attachment Upload** - Requires file storage setup (Phase 4)
4. **No Subtask Reordering** - Requires drag-and-drop implementation (Phase 4)
5. **No Checklist Reordering** - Requires drag-and-drop implementation (Phase 4)

### Future Enhancements
1. **Rich Text Editor** - Replace textarea with WYSIWYG editor
2. **Task Templates** - Pre-fill common task structures
3. **Bulk Operations** - Edit multiple tasks at once
4. **Custom Fields** - Per-project custom field definitions
5. **Automation Rules** - Auto-assign, auto-close, etc.
6. **Time Tracking** - Log hours spent on tasks
7. **Task Dependencies** - Block tasks until others complete
8. **Recurring Tasks** - Auto-create tasks on schedule

---

## Appendix

### A. Original GAS Implementation Reference
- **File**: `old_project/component.TaskPanel.html` (1,405 lines)
- **File**: `old_project/TaskDetailPanel.html` (108 lines)
- **File**: `old_project/component.CreateTaskModal.html` (632 lines)
- **File**: `old_project/CreateTaskModal.html` (245 lines)

### B. API Endpoint Documentation
See `PROGRESS_PHASE2.1_BOARD_VIEW.md` for complete API reference.

### C. Component Library
Using shadcn/ui for base components:
- Button
- Dialog
- Input
- Textarea
- Select
- Popover
- Calendar
- Badge
- Avatar
- Tabs
- ScrollArea

### D. Color Scheme Reference
**Priority Colors:**
- Urgent (1): `#ef4444` (red-500)
- High (2): `#f97316` (orange-500)
- Normal (3): `#eab308` (yellow-500)
- Low (4): `#22c55e` (green-500)

**Difficulty Colors:**
- Easy (1): `#22c55e` (green-500)
- Normal (2): `#eab308` (yellow-500)
- Hard (3): `#ef4444` (red-500)

**Status Colors:**
- Dynamic per project (stored in database)
- Gradient from start to current status

---

## Document Change Log

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-10-21 | 1.0 | Initial plan created | Claude |

---

**Next Steps:**
1. Review this plan with team
2. Set up Storybook for component development
3. Start with Phase 1 (Foundation Components)
4. Daily standups to track progress
5. Weekly demos to stakeholders
