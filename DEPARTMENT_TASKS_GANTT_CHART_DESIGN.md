# Gantt Chart View - Design Extension

**Created:** 2025-10-23
**Status:** Enhanced Proposal
**Feature:** Gantt Chart Timeline View for Department Tasks
**Parent Document:** `DEPARTMENT_TASKS_VIEW_DESIGN.md`

---

## 📋 Overview

เพิ่ม **Gantt Chart View** เป็น view mode ที่ 4 ใน Department Tasks View เพื่อแสดง timeline ของงานทั้งหมดในแผนก พร้อมความสัมพันธ์ระหว่างงาน

---

## 🎯 Use Cases

### Use Case 1: วางแผนและดู Timeline
**Actor:** HEAD
**Goal:** เห็น timeline งานทั้งหมด วางแผนทรัพยากร และตรวจสอบความสัมพันธ์ระหว่างงาน

**Flow:**
1. เปลี่ยนจาก List/Table view → Gantt Chart view
2. เห็น timeline bar ของแต่ละงาน
3. ดูความสัมพันธ์ระหว่างงาน (dependencies)
4. Zoom in/out เพื่อดู timeline แบบต่างๆ (day/week/month)
5. Drag & drop task bar เพื่อเปลี่ยน start/due date
6. เห็นงานที่ overlap หรือ conflict
7. เห็นภาระงานของแต่ละคน

### Use Case 2: ตรวจสอบ Critical Path
**Actor:** HEAD
**Goal:** เห็นงานที่เป็น bottleneck และวางแผนให้ทัน deadline

**Flow:**
1. เปิด Gantt Chart view
2. เปิดโหมด "Show Critical Path"
3. เห็นงานสำคัญที่ต้องทำให้ทัน (highlighted เป็นสีแดง)
4. เห็นงานที่มี slack time (buffer)
5. ปรับแผนเพื่อลด risk

---

## 🎨 UI Design

### Layout Structure - Gantt View

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│ Navbar (Top)                                                                             │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│ ┌──────┐ ┌─────────────────────────────────────────────────────────────────────────┐   │
│ │      │ │ Department Tasks Header                                                  │   │
│ │      │ │                                                                           │   │
│ │      │ │ ┌──────────┐ ┌──────┐ ┌──────────────────────────────────────────────┐  │   │
│ │      │ │ │🔍 Search │ │Filter│ │ View: [Table] [Gantt] [Board] [Timeline]   │  │   │
│ │      │ │ └──────────┘ └──────┘ └──────────────────────────────────────────────┘  │   │
│ │Side- │ │                                                                           │   │
│ │bar   │ │ ┌────────────────────────────────────────────────────────────────────┐  │   │
│ │      │ │ │ Gantt Chart Controls                                                │  │   │
│ │      │ │ │ [Day] [Week] [Month] [Quarter] | Zoom: [-][====][+]                │  │   │
│ │      │ │ │ ☑ Show Dependencies | ☑ Show Critical Path | ☑ Show Today Line    │  │   │
│ │      │ │ └────────────────────────────────────────────────────────────────────┘  │   │
│ │      │ │                                                                           │   │
│ │      │ │ ┌──────────────┬────────────────────────────────────────────────────┐   │   │
│ │      │ │ │ Task List    │ Timeline (Oct - Nov - Dec)                         │   │   │
│ │      │ │ │              │                                                     │   │   │
│ │      │ │ ├──────────────┼────────────────────────────────────────────────────┤   │   │
│ │      │ │ │📁 Project A  │                                                     │   │   │
│ │      │ │ │  └ Task 1    │    [═══════════════]                     (Prio 1) │   │   │
│ │      │ │ │  └ Task 2    │              [══════════════]            (Prio 2) │   │   │
│ │      │ │ │  └ Task 3    │                      [═════════]         (Prio 3) │   │   │
│ │      │ │ │              │         ↓ dependency line                          │   │   │
│ │      │ │ │📁 Project B  │                                                     │   │   │
│ │      │ │ │  └ Task 4    │  [════════]                              (Prio 1) │   │   │
│ │      │ │ │  └ Task 5    │         [═══════════════════]            (Prio 2) │   │   │
│ │      │ │ │              │              ↓                                     │   │   │
│ │      │ │ │📁 Project C  │                                                     │   │   │
│ │      │ │ │  └ Task 6    │                   [════════════]         (Prio 3) │   │   │
│ │      │ │ │              │                                                     │   │   │
│ │      │ │ │              │    │← Today                                        │   │   │
│ │      │ │ └──────────────┴────────────────────────────────────────────────────┘   │   │
│ │      │ │                                                                           │   │
│ │      │ │ ┌────────────────────────────────────────────────────────────────────┐  │   │
│ │      │ │ │ Legend: 🔴 Critical Path | 🟢 On Track | 🔴 Overdue | 🟡 At Risk  │  │   │
│ │      │ │ └────────────────────────────────────────────────────────────────────┘  │   │
│ └──────┘ └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🎨 Visual Components

### 1. Gantt Chart Header Controls

```tsx
┌────────────────────────────────────────────────────────────────────┐
│ Gantt Chart Controls                                                │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                                      │
│ 📅 Time Scale:  [○ Day] [● Week] [○ Month] [○ Quarter]             │
│                                                                      │
│ 🔍 Zoom:  [-] [═══════●═══] [+]  (50% - 200%)                      │
│                                                                      │
│ 🎨 Display Options:                                                 │
│    ☑ แสดงเส้นความสัมพันธ์ (Show Dependencies)                      │
│    ☑ แสดงเส้นทางวิกฤติ (Show Critical Path)                        │
│    ☑ แสดงเส้นวันนี้ (Show Today Line)                              │
│    ☑ แสดงสัปดาห์สิ้นสุด (Show Weekends)                            │
│    ☐ แสดง Milestone เท่านั้น (Milestones Only)                    │
│                                                                      │
│ 👥 Group By:  [● Project] [○ Assignee] [○ Priority] [○ Status]     │
│                                                                      │
│ 📊 View:  [Table+Gantt] [Gantt Only] [Table Only]                  │
└────────────────────────────────────────────────────────────────────┘
```

**Features:**
- **Time Scale:** เลือกระดับ zoom (Day/Week/Month/Quarter)
- **Zoom Slider:** ซูมเข้า-ออกแบบ smooth
- **Display Options:** เปิด/ปิด features ต่างๆ
- **Grouping:** จัดกลุ่มงานแบบต่างๆ
- **View Mode:** ซ่อน/แสดง table หรือ gantt

---

### 2. Task List Panel (Left Side)

```tsx
┌──────────────────────────────────┐
│ Task List                         │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                   │
│ ▼ 📁 Project A (80%)             │
│    ┌─────────────────────────┐   │
│    │ 📌 Task 1               │   │
│    │ 🔴 Priority 1           │   │
│    │ 👤 สมชาย               │   │
│    │ 📅 10/20 - 10/30        │   │
│    │ ✅ COMPLETED            │   │
│    └─────────────────────────┘   │
│                                   │
│    ┌─────────────────────────┐   │
│    │ 📄 Task 2               │   │
│    │ 🟠 Priority 2           │   │
│    │ 👤 สมหญิง              │   │
│    │ 📅 10/25 - 11/05        │   │
│    │ 🔵 IN_PROGRESS (60%)    │   │
│    └─────────────────────────┘   │
│                                   │
│    ┌─────────────────────────┐   │
│    │ 🎨 Task 3               │   │
│    │ 🟡 Priority 3           │   │
│    │ 👤 สมศรี                │   │
│    │ 📅 11/01 - 11/15        │   │
│    │ ⚫ TODO                  │   │
│    └─────────────────────────┘   │
│                                   │
│ ▼ 📁 Project B (40%)             │
│    ...                            │
│                                   │
└──────────────────────────────────┘
```

**Features:**
- Collapsible project groups
- Mini task cards with key info
- Visual indicators (priority, status)
- Progress bar for in-progress tasks
- Click to highlight on timeline
- Drag to reorder

---

### 3. Gantt Timeline Panel (Right Side)

```tsx
┌────────────────────────────────────────────────────────────────────┐
│ Timeline: October - November - December 2025                        │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│          Week 1   Week 2   Week 3   Week 4   Week 5   Week 6       │
│          │   │   │   │   │   │   │   │   │   │   │   │   │       │
│ Project A                                                           │
│   Task 1 [████████████████████]                        ✅          │
│   Task 2           [████████████████████████]          🔵 60%      │
│   Task 3                     [══════════════════]      ⚫          │
│          │   │   │   ╎   │   │   │   │   │   │                   │
│ Project B                                                           │
│   Task 4 [████████]                                    ✅          │
│   Task 5     [████████████████████████]                🔵 40%      │
│   Task 6              ╲                                             │
│                        ╲[══════════════════]           ⚫          │
│          │   │   │   │╎  │   │   │   │   │                        │
│          │   │   │   ││  │   │   │   │   │                        │
│                      TODAY                                          │
│                                                                      │
│ Legend:                                                              │
│ ████ Completed | ████ In Progress | ════ Todo | ──── Milestone    │
│ 🔴 Critical Path | 🟡 At Risk | 🟢 On Track | ╲ Dependency        │
└────────────────────────────────────────────────────────────────────┘
```

**Features:**

**Task Bars:**
- Color-coded by status
- Width = duration (start → due date)
- Fill pattern shows progress
- Hover to show tooltip with details

**Today Line:**
- Vertical line marking current date
- Auto-scroll to show today on initial load

**Dependencies:**
- Arrow lines connecting related tasks
- Start-to-Finish, Finish-to-Start, etc.
- Hover to highlight dependency chain

**Critical Path:**
- Tasks on critical path highlighted in red
- Shows tasks that can't be delayed

**Drag & Drop:**
- Drag bar left/right to change dates
- Drag edges to change duration
- Shows validation errors (e.g., dependency conflicts)

---

### 4. Task Bar Variants

```tsx
// Completed Task
[████████████████████] ✅
  Green solid fill, 100%

// In Progress Task (60%)
[████████████░░░░░░░░] 🔵 60%
  Blue fill, partial progress

// Todo Task
[════════════════════] ⚫
  Gray outline only

// Overdue Task
[████████████████████] 🔥
  Red solid fill, pulsing animation

// At Risk Task (due in 3 days, progress < 50%)
[████░░░░░░░░░░░░░░░░] ⚠️ 20%
  Orange fill, warning icon

// Critical Path Task
[████████████████████] 🔴
  Red border, bold

// Milestone (deadline, no duration)
  ◆
  Diamond shape at specific date

// Task with Dependencies
[════════════════════] ─→ [══════════]
  Arrow shows dependency
```

---

### 5. Hover Tooltip

```tsx
┌─────────────────────────────────┐
│ 📄 API Development              │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ Project: Hospital Info System   │
│ Assignee: 👤 สมหญิง ขยัน        │
│ Priority: 🟠 2 (High)           │
│ Status: 🔵 IN_PROGRESS (60%)    │
│                                  │
│ 📅 Duration:                    │
│   Start: Oct 25, 2025           │
│   Due: Nov 5, 2025              │
│   Days: 11 days                 │
│                                  │
│ 🔗 Dependencies:                │
│   Depends on: Task 1 (Setup DB) │
│   Blocks: Task 3 (UI Design)    │
│                                  │
│ 📊 Checklist: 6/10 items        │
│ 💬 Comments: 8                  │
│                                  │
│ [Open Task →]                   │
└─────────────────────────────────┘
```

---

### 6. Context Menu (Right-Click on Task Bar)

```tsx
┌─────────────────────────────┐
│ 📄 API Development          │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ 🔍 View Details             │
│ ✏️ Edit Task                │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ 📅 Change Dates             │
│ 👤 Reassign                 │
│ 🏷️ Change Status            │
│ ⚡ Change Priority          │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ 🔗 Add Dependency           │
│ ◆ Convert to Milestone      │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━ │
│ 📌 Pin Task                 │
│ 🗑️ Delete Task              │
└─────────────────────────────┘
```

---

## 🎨 Gantt Chart Features

### 1. Task Dependencies

**Types:**
- **Finish-to-Start (FS):** งาน A ต้องเสร็จก่อน งาน B จะเริ่มได้
- **Start-to-Start (SS):** งาน A เริ่ม → งาน B เริ่มได้
- **Finish-to-Finish (FF):** งาน A เสร็จ → งาน B เสร็จ
- **Start-to-Finish (SF):** งาน A เริ่ม → งาน B เสร็จได้

**Visual:**
```
Task A  [████████████]
            ╲_______________
                             ╲
Task B                        [════════════]
         (Finish-to-Start dependency)
```

**Validation:**
- ไม่อนุญาตให้สร้าง circular dependencies
- แสดงคำเตือนถ้า dependency conflict
- Auto-adjust dates เมื่อ dependency change

---

### 2. Critical Path Analysis

**Algorithm:**
- คำนวณ longest path จาก start → finish
- Tasks บน critical path = tasks ที่ delay ไม่ได้
- แสดงด้วยสีแดงหรือ bold border

**Visual:**
```
Project Start
   │
   ├─ Task A [████] (Critical) 🔴
   │     │
   │     └─ Task B [████████] (Critical) 🔴
   │           │
   │           └─ Task D [████] (Critical) 🔴
   │                 │
   ├─ Task C [════]  (Has Slack) 🟢
   │     │
   └─────┴─ Project End
```

**Info Display:**
- Total project duration: 45 days
- Critical path duration: 45 days
- Slack time per task
- Risk assessment

---

### 3. Milestones

**Definition:**
- เหตุการณ์สำคัญที่ไม่มี duration
- เช่น: Project kickoff, Phase completion, Delivery date

**Visual:**
```
Timeline:
   │   │   │   │   │   │   │
   ◆ Start        ◆ Phase 1   ◆ Launch
                  Complete
```

**Features:**
- Diamond shape (◆)
- Vertical line across chart
- Label above/below
- Can have dependencies

---

### 4. Progress Tracking

**Visual Progress:**
```
Task (60% complete):
[████████████░░░░░░░░] 60%
 ←─ Done ─→ ←─ Todo ─→
```

**Color Coding:**
- 🟢 On Track: Progress ≥ Expected
- 🟡 At Risk: Progress < Expected, but recoverable
- 🔴 Behind: Progress << Expected

**Expected Progress Calculation:**
```typescript
const today = new Date();
const start = task.startDate;
const due = task.dueDate;
const totalDays = daysBetween(start, due);
const elapsedDays = daysBetween(start, today);
const expectedProgress = elapsedDays / totalDays;

if (task.progress >= expectedProgress) return 'on-track';
else if (task.progress >= expectedProgress * 0.8) return 'at-risk';
else return 'behind';
```

---

### 5. Resource Allocation View

**Grouped by Assignee:**
```
👤 สมชาย ใจดี
  │ [████] Task A
  │       [══════] Task D
  │                    [════] Task G

👤 สมหญิง ขยัน
  │ [██████████] Task B
  │             [████████] Task E

👤 สมศรี สวยงาม
  │   [════════] Task C
  │                [══════] Task F
```

**Features:**
- See workload per person
- Identify overallocation (tasks overlap)
- Balance resources

---

### 6. Baseline Comparison

**Show Original Plan vs Actual:**
```
Task A (Original Plan):
[════════════════════] (Planned)
  [████████████]       (Actual) ✅ Early!

Task B (Delayed):
  [════════════════════] (Planned)
      [████████████████████] (Actual) 🔴 Late
```

**Features:**
- Original planned dates (gray)
- Actual dates (colored)
- Variance indicators

---

## 📊 Gantt Chart Library Options

### Option 1: dhtmlx-gantt ⭐ (Recommended)

**Pros:**
- ✅ Full-featured Gantt chart library
- ✅ Dependencies, critical path, baselines
- ✅ Drag & drop, zoom, scroll
- ✅ Multiple views (day/week/month)
- ✅ Export to PDF/Excel
- ✅ React wrapper available

**Cons:**
- ⚠️ Commercial license for some features (~$500/year)
- ⚠️ Large bundle size (~300kb)

**Installation:**
```bash
npm install dhtmlx-gantt
npm install @types/dhtmlx-gantt
```

**Basic Usage:**
```tsx
import { Gantt } from 'dhtmlx-gantt';
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css';

<Gantt
  tasks={tasks}
  zoom="week"
  onTaskDrag={handleTaskDrag}
  onLinkAdd={handleDependencyAdd}
/>
```

---

### Option 2: frappe-gantt

**Pros:**
- ✅ Open source (MIT license)
- ✅ Lightweight (~15kb)
- ✅ Simple, clean design
- ✅ Drag & drop
- ✅ Dependencies

**Cons:**
- ❌ No critical path calculation
- ❌ Limited customization
- ❌ No baseline comparison

**Installation:**
```bash
npm install frappe-gantt
```

---

### Option 3: react-gantt-chart

**Pros:**
- ✅ Built for React
- ✅ TypeScript support
- ✅ Modern, responsive
- ✅ Virtual scrolling

**Cons:**
- ❌ No dependencies feature
- ❌ Limited advanced features

---

### Option 4: Custom Implementation with vis-timeline

**Pros:**
- ✅ Full control
- ✅ Lightweight
- ✅ Flexible customization

**Cons:**
- ⚠️ Need to implement all features from scratch
- ⚠️ Time-consuming

---

### 🏆 Recommendation: dhtmlx-gantt

**Why?**
- Most feature-complete
- Handles complex dependencies
- Critical path calculation built-in
- Export functionality
- Proven, stable library
- Good documentation

**Cost Justification:**
- ~$500/year for Pro license
- Saves 2-4 weeks of development time
- Professional features out-of-the-box

---

## 🔧 Technical Implementation

### 1. Data Structure for Gantt

```typescript
interface GanttTask {
  id: string;
  text: string; // Task name
  start_date: Date;
  end_date: Date;
  duration: number; // In days
  progress: number; // 0 to 1
  parent?: string; // Parent task/project ID

  // Visual
  color?: string;
  textColor?: string;

  // Metadata
  priority: 1 | 2 | 3 | 4;
  status: TaskStatus;
  assignee: {
    id: string;
    name: string;
    avatar?: string;
  };

  // Task type
  type?: 'task' | 'milestone' | 'project';

  // Dependencies
  dependencies?: string[]; // Array of task IDs

  // Custom fields
  custom?: {
    projectId: string;
    projectName: string;
    isPinned: boolean;
    commentsCount: number;
    checklistProgress: { completed: number; total: number };
  };
}

interface GanttLink {
  id: string;
  source: string; // Task ID
  target: string; // Task ID
  type: 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish';
  lag?: number; // Delay in days
}

interface GanttData {
  tasks: GanttTask[];
  links: GanttLink[];
}
```

---

### 2. API Response Format

```typescript
// GET /api/departments/[id]/tasks?view=gantt

{
  success: true,
  data: {
    department: { id, name },
    gantt: {
      tasks: [
        {
          id: "task001",
          text: "Setup Database",
          start_date: "2025-10-20",
          end_date: "2025-10-30",
          duration: 10,
          progress: 1.0,
          parent: "proj001",
          type: "task",
          priority: 1,
          status: "COMPLETED",
          assignee: { id: "user001", name: "สมชาย ใจดี" },
          custom: {
            projectId: "proj001",
            projectName: "HIS Development",
            isPinned: true,
            commentsCount: 3
          }
        },
        {
          id: "proj001",
          text: "📁 HIS Development",
          start_date: "2025-10-20",
          end_date: "2025-12-31",
          duration: 72,
          progress: 0.8,
          type: "project"
        }
        // ... more tasks
      ],
      links: [
        {
          id: "link001",
          source: "task001",
          target: "task002",
          type: "finish_to_start",
          lag: 0
        }
        // ... more links
      ]
    }
  }
}
```

---

### 3. Component Structure

```tsx
// File: src/components/views/gantt-view/gantt-view.tsx

import { Gantt } from 'dhtmlx-gantt';
import { useGanttTasks } from '@/hooks/use-gantt-tasks';

export function GanttView({ departmentId }: { departmentId: string }) {
  const { data, isLoading } = useGanttTasks(departmentId);
  const [zoom, setZoom] = useState<'day' | 'week' | 'month'>('week');
  const [showCriticalPath, setShowCriticalPath] = useState(true);
  const [showDependencies, setShowDependencies] = useState(true);

  return (
    <div className="gantt-container">
      <GanttControls
        zoom={zoom}
        onZoomChange={setZoom}
        showCriticalPath={showCriticalPath}
        onToggleCriticalPath={setShowCriticalPath}
        showDependencies={showDependencies}
        onToggleDependencies={setShowDependencies}
      />

      <Gantt
        tasks={data?.gantt}
        zoom={zoom}
        config={{
          show_critical_path: showCriticalPath,
          show_links: showDependencies,
          readonly: false, // Allow editing
          drag_links: true, // Create dependencies by dragging
          drag_progress: true, // Update progress by dragging
          drag_resize: true, // Change duration by dragging edges
          drag_move: true, // Move task by dragging bar
        }}
        onTaskDrag={handleTaskDateChange}
        onProgressDrag={handleProgressChange}
        onLinkAdd={handleDependencyAdd}
        onLinkDelete={handleDependencyDelete}
        onTaskClick={handleTaskClick}
      />
    </div>
  );
}
```

---

### 4. Optimistic Updates for Gantt

```typescript
// Hook: use-gantt-tasks.ts

export function useGanttTasks(departmentId: string) {
  const queryClient = useQueryClient();

  // Fetch gantt data
  const query = useQuery({
    queryKey: ganttKeys.department(departmentId),
    queryFn: () => api.get(`/api/departments/${departmentId}/tasks?view=gantt`),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Update task dates (drag & drop)
  const updateTaskDates = useSyncMutation({
    mutationFn: ({ taskId, start, end }) =>
      api.patch(`/api/tasks/${taskId}`, {
        startDate: start,
        dueDate: end,
      }),
    onMutate: async ({ taskId, start, end }) => {
      await queryClient.cancelQueries(ganttKeys.department(departmentId));

      const previous = queryClient.getQueryData(ganttKeys.department(departmentId));

      // Update task in cache
      queryClient.setQueryData(ganttKeys.department(departmentId), (old: any) => ({
        ...old,
        gantt: {
          ...old.gantt,
          tasks: old.gantt.tasks.map((task: GanttTask) =>
            task.id === taskId
              ? { ...task, start_date: start, end_date: end }
              : task
          ),
        },
      }));

      return { previous };
    },
    onError: (err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          ganttKeys.department(departmentId),
          context.previous
        );
      }
    },
  });

  return {
    ...query,
    updateTaskDates,
  };
}
```

---

## 🎨 Color Scheme for Gantt

### Task Bar Colors (by Status)

```typescript
const GANTT_COLORS = {
  // Status colors
  COMPLETED: {
    bar: '#10b981', // green-500
    progress: '#059669', // green-600
    border: '#047857', // green-700
  },
  IN_PROGRESS: {
    bar: '#3b82f6', // blue-500
    progress: '#2563eb', // blue-600
    border: '#1d4ed8', // blue-700
  },
  TODO: {
    bar: '#e5e7eb', // gray-200
    progress: '#d1d5db', // gray-300
    border: '#9ca3af', // gray-400
  },
  ON_HOLD: {
    bar: '#fbbf24', // yellow-400
    progress: '#f59e0b', // yellow-500
    border: '#d97706', // yellow-600
  },

  // Priority overlays (border/accent)
  PRIORITY_1: '#ef4444', // red-500
  PRIORITY_2: '#f97316', // orange-500
  PRIORITY_3: '#eab308', // yellow-500
  PRIORITY_4: '#94a3b8', // slate-400

  // Special states
  OVERDUE: '#dc2626', // red-600 (pulsing)
  AT_RISK: '#ea580c', // orange-600
  CRITICAL_PATH: '#991b1b', // red-800 (bold border)

  // Project bars
  PROJECT: '#6366f1', // indigo-500
};
```

---

### Critical Path Styling

```css
.gantt_task_line.critical {
  border: 3px solid #991b1b !important;
  box-shadow: 0 0 8px rgba(153, 27, 27, 0.5);
  z-index: 10;
}

.gantt_task_line.critical::after {
  content: '🔴';
  position: absolute;
  right: -20px;
  top: 50%;
  transform: translateY(-50%);
}
```

---

## 📱 Responsive Gantt Chart

### Desktop (>= 1024px)
- Task list: 300px width
- Timeline: Remaining width
- Show all columns
- Full controls

### Tablet (768px - 1023px)
- Task list: 250px width
- Timeline: Remaining width
- Hide some task list columns
- Compact controls

### Mobile (< 768px)
- Stack layout: Task list on top, timeline below
- Swipe to scroll timeline
- Minimal task list (name + status only)
- Controls in drawer/modal

---

## 🚀 Performance Optimizations

### 1. Virtual Rendering
```typescript
// Only render visible tasks in viewport
gantt.config.smart_rendering = true;
gantt.config.static_background = true;
```

### 2. Lazy Loading
```typescript
// Load tasks for visible date range only
gantt.config.dynamic_loading = true;
gantt.load(`/api/departments/${id}/tasks/gantt?from=${startDate}&to=${endDate}`);
```

### 3. Debounced Updates
```typescript
// Debounce drag operations
const debouncedUpdate = useDebouncedCallback(
  (taskId, dates) => updateTaskDates.mutate({ taskId, ...dates }),
  500
);
```

### 4. Memoization
```typescript
const ganttConfig = useMemo(() => ({
  show_critical_path: showCriticalPath,
  show_links: showDependencies,
  // ... other configs
}), [showCriticalPath, showDependencies]);
```

---

## 📊 Export Functionality

### Export Options

```typescript
interface ExportOptions {
  format: 'pdf' | 'png' | 'excel' | 'msp'; // MS Project format
  name?: string;
  dateRange?: { start: Date; end: Date };
  includeTaskList?: boolean;
  orientation?: 'portrait' | 'landscape';
}

// Export to PDF
gantt.exportToPDF({
  name: `department-gantt-${date}.pdf`,
  header: '<h1>Department Tasks Timeline</h1>',
  footer: `<div>Exported on ${new Date().toLocaleDateString('th-TH')}</div>`,
  orientation: 'landscape',
});

// Export to Excel
gantt.exportToExcel({
  name: `department-tasks-${date}.xlsx`,
  visual: true, // Include Gantt chart as image
  cellColors: true,
});

// Export to MS Project
gantt.exportToMSProject({
  name: `project-plan.xml`,
});
```

---

## 🎯 User Interactions Summary

### Mouse Interactions
- **Click task bar:** Open task detail panel
- **Drag task bar:** Change start/due dates
- **Drag task edges:** Change duration
- **Drag progress:** Update completion percentage
- **Right-click task:** Context menu
- **Click & drag from task:** Create dependency link
- **Hover task:** Show tooltip
- **Double-click task:** Edit modal

### Keyboard Shortcuts
- `Ctrl + Z`: Undo
- `Ctrl + Y`: Redo
- `Ctrl + F`: Focus search
- `+/-`: Zoom in/out
- `←/→`: Scroll timeline
- `Delete`: Delete selected task
- `Ctrl + C/V`: Copy/paste task

---

## ✅ Implementation Checklist

### Phase 1: Basic Gantt (3-4 days)
- [ ] Install dhtmlx-gantt library
- [ ] Create GanttView component
- [ ] API endpoint: GET /api/departments/[id]/tasks?view=gantt
- [ ] Transform task data to gantt format
- [ ] Basic timeline rendering (week view)
- [ ] Task bars with colors by status
- [ ] Today line
- [ ] Loading states

### Phase 2: Interactions (2-3 days)
- [ ] Drag & drop to change dates
- [ ] Drag edges to change duration
- [ ] Drag progress bar
- [ ] Click task → open panel
- [ ] Hover tooltip
- [ ] Optimistic updates
- [ ] Zoom controls (day/week/month)

### Phase 3: Dependencies (2 days)
- [ ] Display dependency links
- [ ] Create dependency by dragging
- [ ] Delete dependency
- [ ] Validate circular dependencies
- [ ] Dependency types (FS, SS, FF, SF)
- [ ] Auto-adjust dates

### Phase 4: Advanced Features (2-3 days)
- [ ] Critical path calculation
- [ ] Critical path highlighting
- [ ] Milestone support
- [ ] Progress tracking indicators
- [ ] At-risk task detection
- [ ] Weekend highlighting

### Phase 5: Grouping & Views (1-2 days)
- [ ] Group by project (default)
- [ ] Group by assignee
- [ ] Group by priority
- [ ] Resource allocation view
- [ ] Baseline comparison (optional)

### Phase 6: Export & Polish (1-2 days)
- [ ] Export to PDF
- [ ] Export to Excel
- [ ] Export to MS Project (optional)
- [ ] Print view
- [ ] Responsive design
- [ ] Dark mode support
- [ ] Keyboard shortcuts

**Total Estimated Time:** 11-16 days

---

## 🔮 Future Enhancements

- [ ] Resource leveling (auto-balance workload)
- [ ] Capacity planning (show overallocation)
- [ ] What-if scenario planning
- [ ] Automated scheduling (auto-adjust based on dependencies)
- [ ] Risk analysis (Monte Carlo simulation)
- [ ] Budget tracking on timeline
- [ ] Integration with calendar apps (iCal export)
- [ ] Real-time collaboration (multi-user editing)
- [ ] Version history / snapshots
- [ ] AI suggestions for task scheduling

---

## 📚 References

- [dhtmlx-gantt Documentation](https://docs.dhtmlx.com/gantt/)
- [Gantt Chart Best Practices](https://www.projectmanager.com/gantt-chart)
- [Critical Path Method](https://en.wikipedia.org/wiki/Critical_path_method)
- [PERT Chart](https://en.wikipedia.org/wiki/Program_evaluation_and_review_technique)

---

**END OF GANTT CHART DESIGN EXTENSION**

**Status:** Ready for implementation
**Recommended Library:** dhtmlx-gantt
**Estimated Time:** 11-16 days
**License Cost:** ~$500/year (Pro license)

---

## 💡 Quick Start Guide

### For Developers:

1. **Install Library:**
   ```bash
   npm install dhtmlx-gantt @types/dhtmlx-gantt
   ```

2. **Create API Endpoint:**
   - Transform task data to gantt format
   - Include dependencies
   - Calculate critical path (backend)

3. **Build Component:**
   - Follow structure in Technical Implementation section
   - Start with basic rendering
   - Add interactions incrementally

4. **Test Thoroughly:**
   - Drag & drop
   - Dependencies
   - Date validation
   - Performance with 100+ tasks

5. **Deploy:**
   - Consider license activation
   - Test on different screen sizes
   - Gather user feedback

**Next:** See [DEPARTMENT_TASKS_CUSTOM_GROUPING_DESIGN.md] for custom grouping features
