# Department Tasks View - Design Document

**Created:** 2025-10-23
**Status:** Proposal
**Designer:** Claude AI Assistant
**Target User Roles:** HEAD, MEMBER (department-level users)

---

## 📋 Executive Summary

หน้า "Department Tasks View" เป็นหน้าที่แสดงภาพรวมงานทั้งหมดใน Department โดยจัดกลุ่มตาม Project เหมาะสำหรับ:
- **หัวหน้าแผนก (HEAD):** ดูภาพรวมงานทั้ง department
- **สมาชิกแผนก (MEMBER):** ดูงานที่เกี่ยวข้องกับตนเองและทีม

---

## 🎯 Use Cases

### Use Case 1: หัวหน้าแผนกต้องการดูภาพรวม
**Actor:** HEAD
**Goal:** เห็นงานทั้งหมดใน department จัดกลุ่มตาม project

**Flow:**
1. คลิกเมนู "งานในแผนก" หรือ "Department Tasks"
2. เห็นรายการ projects ทั้งหมดใน department
3. แต่ละ project แสดง:
   - จำนวนงานทั้งหมด
   - งานที่เสร็จแล้ว
   - งานที่เลยกำหนด
   - รายชื่องานด้านล่าง (แบบ table)
4. กรอง/เรียงลำดับงานได้
5. คลิกที่งานเพื่อดูรายละเอียด

### Use Case 2: สมาชิกต้องการเห็นงานในแผนก
**Actor:** MEMBER
**Goal:** เห็นงานที่ตนเองมีส่วนเกี่ยวข้องและงานอื่นๆ ในแผนก

**Flow:**
1. เข้าหน้า Department Tasks
2. เห็น projects ที่ตนเองมีงานอยู่ (highlighted)
3. เห็น projects อื่นๆ ในแผนก (dimmed)
4. สามารถกรองเพื่อดูเฉพาะงานของตนเอง

---

## 🎨 UI Design

### Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│ Navbar (Top)                                                     │
├─────────────────────────────────────────────────────────────────┤
│ ┌──────┐ ┌──────────────────────────────────────────────────┐  │
│ │      │ │ Department Tasks Header                           │  │
│ │      │ │                                                    │  │
│ │      │ │ ┌──────────────┐ ┌──────┐ ┌──────┐ ┌──────────┐ │  │
│ │Side- │ │ │ 🔍 Search    │ │Filter│ │ Sort │ │ View: □  │ │  │
│ │bar   │ │ └──────────────┘ └──────┘ └──────┘ └──────────┘ │  │
│ │      │ │                                                    │  │
│ │      │ │ ┌────────────────────────────────────────────┐   │  │
│ │      │ │ │ 📊 Department Overview Stats               │   │  │
│ │      │ │ │ Total: 45 | Completed: 12 | Overdue: 5     │   │  │
│ │      │ │ └────────────────────────────────────────────┘   │  │
│ │      │ │                                                    │  │
│ │      │ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │  │
│ │      │ │                                                    │  │
│ │      │ │ ▼ 📁 โครงการพัฒนา Hospital Information System  │  │
│ │      │ │    Progress: ████████░░ 80% | Tasks: 15/20      │  │
│ │      │ │    Overdue: 2 | Due Soon: 3                     │  │
│ │      │ │                                                    │  │
│ │      │ │    ┌─────────────────────────────────────────┐   │  │
│ │      │ │    │ Task Table (Expandable)                 │   │  │
│ │      │ │    │ ┌─┬────────┬──────┬─────┬──────┬──────┐ │   │  │
│ │      │ │    │ │✓│ Task   │ Prio │ Asn │Status│ Due  │ │   │  │
│ │      │ │    │ ├─┼────────┼──────┼─────┼──────┼──────┤ │   │  │
│ │      │ │    │ │ │Database│  1   │ 👤  │ Done │10/20 │ │   │  │
│ │      │ │    │ │ │API Dev │  2   │ 👤  │ Prog │10/25 │ │   │  │
│ │      │ │    │ └─┴────────┴──────┴─────┴──────┴──────┘ │   │  │
│ │      │ │    └─────────────────────────────────────────┘   │  │
│ │      │ │                                                    │  │
│ │      │ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │  │
│ │      │ │                                                    │  │
│ │      │ │ ▼ 📁 โครงการจัดซื้อเครื่องมือแพทย์           │  │
│ │      │ │    Progress: ████░░░░░░ 40% | Tasks: 8/20       │  │
│ │      │ │    Overdue: 1 | Due Soon: 2                     │  │
│ │      │ │                                                    │  │
│ │      │ │    [Collapsed - Click to expand]                 │  │
│ │      │ │                                                    │  │
│ │      │ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │  │
│ │      │ │                                                    │  │
│ │      │ │ ▼ 📁 โครงการปรับปรุงระบบเครือข่าย              │  │
│ │      │ │    Progress: ██░░░░░░░░ 20% | Tasks: 3/15       │  │
│ │      │ │    ...                                           │  │
│ └──────┘ └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎨 Visual Design Specifications

### 1. Page Header

```tsx
┌────────────────────────────────────────────────────────────┐
│ งานในแผนก: แผนกเทคโนโลยีสารสนเทศ                         │
│ Department Tasks: IT Department                             │
│                                                              │
│ ┌──────────────────┐  ┌──────────────┐  ┌───────────────┐ │
│ │ 🔍 ค้นหางาน...  │  │ 🔽 กรอง     │  │ 🔽 เรียงลำดับ│ │
│ └──────────────────┘  └──────────────┘  └───────────────┘ │
│                                                              │
│ ┌─────────┐ ┌──────────┐ ┌──────────┐                     │
│ │□ Compact│ │□ Expanded│ │□ Detailed│  View Options       │
│ └─────────┘ └──────────┘ └──────────┘                     │
└────────────────────────────────────────────────────────────┘
```

**Features:**
- แสดงชื่อ department ที่ user อยู่
- Search box: ค้นหาชื่องาน, assignee, description
- Filter dropdown:
  - Status (All, In Progress, Completed, On Hold)
  - Priority (All, Urgent, High, Normal, Low)
  - Assignee (All, Me, Others)
  - Due Date (All, Overdue, This Week, This Month)
  - Project (All, specific projects)
- Sort dropdown:
  - Due Date (Asc/Desc)
  - Priority (High to Low)
  - Project Name (A-Z)
  - Status
  - Created Date
- View options:
  - Compact: หัวโปรเจคย่อ + รายการงานแบบย่อ
  - Expanded: หัวโปรเจคเต็ม + รายการงานแบบ table (default)
  - Detailed: แสดงรายละเอียดเยอะขึ้น (subtasks, comments count, etc.)

---

### 2. Department Overview Stats

```tsx
┌────────────────────────────────────────────────────────────┐
│ 📊 สรุปภาพรวม Department Overview                         │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                              │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│ │  📝 45  │ │  ✅ 12  │ │  🔥 5   │ │  ⏰ 8   │          │
│ │ ทั้งหมด │ │ เสร็จ   │ │ เลย Due │ │ ใกล้ Due│          │
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
│                                                              │
│ ┌──────────────────────────────────────────────┐           │
│ │ Progress: ████████████░░░░░░░░ 60%           │           │
│ └──────────────────────────────────────────────┘           │
└────────────────────────────────────────────────────────────┘
```

**Metrics:**
- งานทั้งหมด (Total Tasks)
- งานที่เสร็จแล้ว (Completed)
- งานที่เลยกำหนด (Overdue) - สีแดง
- งานที่ใกล้กำหนด (Due Soon: within 3 days) - สีส้ม
- Progress bar: % งานที่เสร็จแล้ว

---

### 3. Project Group Card (Expanded State)

```tsx
┌────────────────────────────────────────────────────────────┐
│ ▼ 📁 โครงการพัฒนา Hospital Information System            │
│                                                              │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ Progress: ████████░░ 80% (12/15 งาน)                 │   │
│ │                                                        │   │
│ │ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐  ┌──────────┐   │   │
│ │ │ 📝 15│ │ ✅ 12│ │ 🔥 2 │ │ ⏰ 3 │  │📅 10/30  │   │   │
│ │ │ Total│ │ Done │ │ Over │ │ Soon │  │Due Date  │   │   │
│ │ └──────┘ └──────┘ └──────┘ └──────┘  └──────────┘   │   │
│ │                                                        │   │
│ │ 👤 Assigned: 5 คน | 🏷️ Status: ACTIVE                │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ Task List - Table View                                │   │
│ │                                                        │   │
│ │ ┌─┬───────────────┬────┬────────┬───────┬─────────┐  │   │
│ │ │□│ งาน           │Prio│ผู้รับผิด│ Status│ Due Date│  │   │
│ │ ├─┼───────────────┼────┼────────┼───────┼─────────┤  │   │
│ │ │□│📌 Setup DB    │ 1  │ สมชาย  │✅ Done│ 10/20   │  │   │
│ │ │□│📄 API Dev     │ 2  │ สมหญิง │🔵 Prog│ 10/25 ⏰│  │   │
│ │ │□│🎨 UI Design   │ 3  │ สมศรี  │🔵 Prog│ 10/28   │  │   │
│ │ │□│🧪 Testing     │ 1  │ สมพร   │⚫ Todo│ 11/05 🔥│  │   │
│ │ │□│📚 Document    │ 4  │ สมหมาย │⚫ Todo│ 11/10   │  │   │
│ │ └─┴───────────────┴────┴────────┴───────┴─────────┘  │   │
│ │                                                        │   │
│ │ Showing 5 of 15 tasks                                 │   │
│ │ [Show All Tasks →]                                    │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│ ┌──────────────┐  ┌──────────────┐                        │
│ │ 📊 View Board│  │ 🔗 Go Project│                        │
│ └──────────────┘  └──────────────┘                        │
└────────────────────────────────────────────────────────────┘
```

**Features:**

**Project Header:**
- เปิด/ปิดแสดงงาน (▼/►)
- ไอคอน project (📁 หรือตามสถานะ)
- ชื่อ project
- Progress bar with percentage
- Quick stats: Total, Completed, Overdue, Due Soon
- Due date ของ project (ถ้ามี)
- จำนวนคนที่ถูก assign
- Status badge (ACTIVE, ON_HOLD, COMPLETED)

**Task Table:**
- Checkbox: เลือกหลายงานพร้อมกัน (สำหรับ bulk actions)
- Task name: คลิกเพื่อเปิด Task Panel
  - มี icon บ่งบอกประเภท (📌 pinned, 📄 normal, 🎨 design, etc.)
- Priority: 1-4 with colored dots
  - 🔴 1 (Urgent)
  - 🟠 2 (High)
  - 🟡 3 (Normal)
  - ⚪ 4 (Low)
- Assignee: ชื่อหรือ avatar
- Status:
  - ✅ COMPLETED (green)
  - 🔵 IN_PROGRESS (blue)
  - ⚫ TODO (gray)
  - 🟡 ON_HOLD (yellow)
  - 🔴 CANCELLED (red)
- Due Date:
  - แสดงวันที่
  - 🔥 ถ้าเลย due date (สีแดง)
  - ⏰ ถ้าใกล้ due date (สีส้ม)
  - สีเขียวถ้ายังไกล

**Actions:**
- "Show All Tasks" - ขยายดูงานทั้งหมด (ถ้ามีเยอะ)
- "View Board" - ไปหน้า Board view ของ project นี้
- "Go Project" - ไปหน้ารายละเอียด project

---

### 4. Project Group Card (Collapsed State)

```tsx
┌────────────────────────────────────────────────────────────┐
│ ► 📁 โครงการจัดซื้อเครื่องมือแพทย์                       │
│                                                              │
│ Progress: ████░░░░░░ 40% (8/20) | Overdue: 1 | Soon: 2    │
│ 👤 5 คน | 📅 Due: 11/30 | Status: ACTIVE                  │
│                                                              │
│ [Click to expand ⤵️]                                       │
└────────────────────────────────────────────────────────────┘
```

**Features:**
- แสดงข้อมูลสรุปแบบย่อ
- คลิกเพื่อขยาย
- เห็นภาพรวมได้รวดเร็ว

---

### 5. Compact View (Alternative Layout)

```tsx
┌────────────────────────────────────────────────────────────┐
│ 📁 โครงการพัฒนา HIS | ████████░░ 80% | 12/15 | 🔥2 ⏰3  │
│ ├─ 📌 Setup Database (สมชาย) ✅ 10/20                     │
│ ├─ 📄 API Development (สมหญิง) 🔵 10/25 ⏰               │
│ ├─ 🎨 UI Design (สมศรี) 🔵 10/28                         │
│ ├─ 🧪 Testing (สมพร) ⚫ 11/05 🔥                         │
│ └─ 📚 Documentation (สมหมาย) ⚫ 11/10                    │
│                                                              │
│ 📁 โครงการจัดซื้อ | ████░░░░░░ 40% | 8/20 | 🔥1 ⏰2     │
│ ├─ ...                                                      │
└────────────────────────────────────────────────────────────┘
```

**Features:**
- แสดงข้อมูลแบบกระทัดรัด
- เห็นได้เยอะในหน้าเดียว
- เหมาะกับการสแกนอย่างรวดเร็ว

---

### 6. Detailed View (Maximum Information)

```tsx
┌────────────────────────────────────────────────────────────┐
│ ▼ 📁 โครงการพัฒนา Hospital Information System            │
│                                                              │
│ Progress: ████████░░ 80% (12/15) | Created: 10/01          │
│ 👤 Team: สมชาย, สมหญิง, สมศรี, สมพร, สมหมาย (5 คน)       │
│ 🏷️ Status: ACTIVE | 📅 Start: 10/01 | Due: 12/31         │
│ 📝 Description: พัฒนาระบบสารสนเทศโรงพยาบาล...             │
│                                                              │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ Task: Setup Database                                  │   │
│ │ ├─ 🔴 Priority: 1 (Urgent)                            │   │
│ │ ├─ 👤 Assignee: สมชาย ใจดี                            │   │
│ │ ├─ ✅ Status: COMPLETED                               │   │
│ │ ├─ 📅 Due: 10/20 | Completed: 10/19                   │   │
│ │ ├─ 📊 Progress: 100%                                  │   │
│ │ ├─ 💬 Comments: 3                                     │   │
│ │ ├─ 📎 Attachments: 2                                  │   │
│ │ └─ ✓ Checklist: 5/5 items                             │   │
│ │                                                        │   │
│ │ Description: ติดตั้งและ config PostgreSQL database... │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ Task: API Development                                 │   │
│ │ ├─ 🟠 Priority: 2 (High)                              │   │
│ │ ├─ 👤 Assignee: สมหญิง ขยัน                           │   │
│ │ ├─ 🔵 Status: IN_PROGRESS                             │   │
│ │ ├─ 📅 Due: 10/25 ⏰ (2 days left)                     │   │
│ │ ├─ 📊 Progress: 60%                                   │   │
│ │ ├─ 💬 Comments: 8                                     │   │
│ │ ├─ 📎 Attachments: 0                                  │   │
│ │ └─ ✓ Checklist: 6/10 items                            │   │
│ │                                                        │   │
│ │ Subtasks:                                             │   │
│ │   ├─ ✅ Auth API (100%)                               │   │
│ │   ├─ 🔵 User API (80%)                                │   │
│ │   └─ ⚫ Project API (0%)                               │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│ [... more tasks ...]                                        │
└────────────────────────────────────────────────────────────┘
```

**Features:**
- แสดงข้อมูลแบบละเอียดที่สุด
- รวมถึง: Description, Comments count, Attachments, Checklist progress, Subtasks
- เหมาะสำหรับการวิเคราะห์เชิงลึก

---

## 🎨 Color Scheme & Visual Indicators

### Priority Colors
- 🔴 **Priority 1 (Urgent):** `bg-red-500` - ด่วนที่สุด
- 🟠 **Priority 2 (High):** `bg-orange-500` - สำคัญ
- 🟡 **Priority 3 (Normal):** `bg-yellow-500` - ปกติ
- ⚪ **Priority 4 (Low):** `bg-gray-400` - ต่ำ

### Status Colors
- ✅ **COMPLETED:** `bg-green-500 text-green-700` - เสร็จแล้ว
- 🔵 **IN_PROGRESS:** `bg-blue-500 text-blue-700` - กำลังทำ
- ⚫ **TODO:** `bg-gray-500 text-gray-700` - ยังไม่เริ่ม
- 🟡 **ON_HOLD:** `bg-yellow-500 text-yellow-700` - พักไว้
- 🔴 **CANCELLED:** `bg-red-500 text-red-700` - ยกเลิก

### Due Date Indicators
- 🔥 **Overdue:** `text-red-600 font-bold` - เลยกำหนด
- ⏰ **Due Soon (within 3 days):** `text-orange-600` - ใกล้กำหนด
- 📅 **Normal:** `text-gray-600` - ปกติ

### Project Status
- **ACTIVE:** สีเขียว
- **ON_HOLD:** สีเหลือง
- **COMPLETED:** สีน้ำเงิน
- **ARCHIVED:** สีเทา

---

## 🔧 Technical Features

### 1. Filtering System

```typescript
interface DepartmentTasksFilters {
  // Search
  searchQuery?: string;

  // Project filters
  projectIds?: string[]; // Filter by specific projects
  projectStatus?: 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED';

  // Task filters
  taskStatus?: TaskStatus[]; // Multiple status selection
  priority?: (1 | 2 | 3 | 4)[];
  assigneeIds?: string[]; // Filter by assignees
  showMyTasksOnly?: boolean; // Quick filter for current user

  // Date filters
  dueDateFilter?: 'all' | 'overdue' | 'today' | 'this_week' | 'this_month' | 'custom';
  customDateRange?: {
    start: Date;
    end: Date;
  };

  // Advanced filters
  hasComments?: boolean;
  hasAttachments?: boolean;
  hasSubtasks?: boolean;
  isPinned?: boolean;
}
```

### 2. Sorting Options

```typescript
interface DepartmentTasksSort {
  field:
    | 'projectName'
    | 'taskName'
    | 'dueDate'
    | 'priority'
    | 'status'
    | 'createdAt'
    | 'updatedAt'
    | 'assignee';
  direction: 'asc' | 'desc';
}
```

### 3. View State Management

```typescript
interface DepartmentTasksViewState {
  // View mode
  viewMode: 'compact' | 'expanded' | 'detailed';

  // Expanded projects (which projects are showing their tasks)
  expandedProjectIds: Set<string>;

  // Pagination
  projectsPerPage: number;
  tasksPerProject: number;
  showAllTasksForProjects: Set<string>; // Which projects show all tasks

  // Selection
  selectedTaskIds: Set<string>; // For bulk actions

  // UI state
  isLoading: boolean;
  error?: string;
}
```

### 4. Bulk Actions

เมื่อเลือกหลายงาน สามารถทำ:
- ✅ Mark as completed
- 📌 Pin/Unpin tasks
- 🗑️ Delete tasks
- 👤 Reassign tasks
- 🏷️ Change status
- ⚡ Change priority
- 📅 Change due date

---

## 🔌 API Requirements

### 1. New Endpoint: GET /api/departments/[departmentId]/tasks

**Purpose:** Fetch all tasks in department, grouped by projects

**Request:**
```typescript
GET /api/departments/DEPT-001/tasks?
  view=grouped&
  status=IN_PROGRESS,TODO&
  sortBy=dueDate&
  sortDir=asc&
  includeCompleted=false
```

**Query Parameters:**
```typescript
{
  view?: 'flat' | 'grouped'; // Default: 'grouped'
  status?: string; // Comma-separated status list
  priority?: string; // Comma-separated priority list
  assigneeId?: string;
  search?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  includeCompleted?: boolean; // Default: false
  page?: number;
  limit?: number;
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    department: {
      id: "DEPT-001",
      name: "แผนกเทคโนโลยีสารสนเทศ",
      divisionId: "DIV-001"
    },
    stats: {
      totalTasks: 45,
      completedTasks: 12,
      overdueTasks: 5,
      dueSoonTasks: 8,
      totalProjects: 8,
      activeProjects: 6,
      completionRate: 0.27 // 27%
    },
    projects: [
      {
        id: "proj001",
        name: "โครงการพัฒนา Hospital Information System",
        status: "ACTIVE",
        dueDate: "2025-12-31T00:00:00Z",
        progress: 0.80,
        stats: {
          totalTasks: 15,
          completedTasks: 12,
          overdueTasks: 2,
          dueSoonTasks: 3
        },
        assignedUsers: [
          { id: "user001", fullName: "สมชาย ใจดี", avatar: "..." },
          // ... more users
        ],
        tasks: [
          {
            id: "task001",
            name: "Setup Database",
            description: "ติดตั้งและ config PostgreSQL database",
            priority: 1,
            status: "COMPLETED",
            dueDate: "2025-10-20T00:00:00Z",
            completedAt: "2025-10-19T14:30:00Z",
            assignee: {
              id: "user001",
              fullName: "สมชาย ใจดี",
              avatar: "..."
            },
            progress: 1.0,
            isPinned: true,
            commentsCount: 3,
            attachmentsCount: 2,
            checklistProgress: { completed: 5, total: 5 },
            subtasksCount: 0,
            isOverdue: false,
            isDueSoon: false
          },
          // ... more tasks
        ]
      },
      // ... more projects
    ],
    pagination: {
      page: 1,
      limit: 10,
      totalProjects: 8,
      totalPages: 1
    }
  }
}
```

### 2. Enhance Existing: GET /api/tasks/[taskId]

Already exists - use for task detail panel

### 3. Enhance Existing: PATCH /api/tasks/[taskId]

Already exists - use for quick updates

### 4. New Endpoint: POST /api/tasks/bulk-update

**Purpose:** Update multiple tasks at once

**Request:**
```typescript
POST /api/tasks/bulk-update
{
  taskIds: ["task001", "task002", "task003"],
  updates: {
    status?: TaskStatus,
    priority?: 1 | 2 | 3 | 4,
    assigneeId?: string,
    dueDate?: string,
    isPinned?: boolean
  }
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    updated: 3,
    failed: 0,
    tasks: [/* updated tasks */]
  }
}
```

---

## 📱 Responsive Design

### Desktop (>= 1024px)
- แสดง sidebar + content
- Project cards แบบเต็มความกว้าง
- Table แสดงทุกคอลัมน์

### Tablet (768px - 1023px)
- Sidebar ซ่อนได้
- Project cards ปรับขนาด
- Table อาจซ่อนบางคอลัมน์ (เช่น Created Date)

### Mobile (< 768px)
- Sidebar เป็น drawer
- Project cards แบบ stack
- Table เปลี่ยนเป็น card list แนวตั้ง
- Filter/Sort เป็น modal

---

## 🎯 User Interactions

### 1. Project Card Interactions
- **Click project header:** Expand/collapse tasks
- **Click "View Board":** Navigate to project board view
- **Click "Go Project":** Navigate to project detail page
- **Hover project card:** Show quick actions (pin, favorite, etc.)

### 2. Task Row Interactions
- **Click task name:** Open task detail panel (slide from right)
- **Click checkbox:** Select task for bulk actions
- **Click assignee:** Filter by that assignee
- **Click status badge:** Quick status change menu
- **Click priority dot:** Quick priority change menu
- **Right-click task:** Context menu (pin, delete, etc.)

### 3. Bulk Actions Bar
```tsx
┌────────────────────────────────────────────────────────────┐
│ ✓ 3 tasks selected                                          │
│ [Mark Complete] [Change Status] [Assign] [Delete] [Cancel] │
└────────────────────────────────────────────────────────────┘
```

Appears when tasks are selected

---

## 🚀 Performance Considerations

### 1. Virtual Scrolling
- Use `react-window` or `react-virtual` for large lists
- Render only visible project cards + tasks

### 2. Pagination
- Load projects in batches (10-20 per page)
- Load tasks per project (default: show 5, expand to show all)

### 3. Optimistic Updates
- Use same pattern as List View
- Instant feedback for all actions
- Rollback on error

### 4. Caching Strategy
```typescript
// React Query cache times
queryKeys.departmentTasks(departmentId, filters)
// staleTime: 2 minutes
// cacheTime: 5 minutes
```

### 5. Data Fetching
- Initial load: Fetch overview stats + first 10 projects
- Lazy load: Fetch task details when project is expanded
- Prefetch: Fetch next page when user scrolls near bottom

---

## 🎨 Animation & Transitions

### 1. Project Expand/Collapse
```css
.project-tasks {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease-in-out;
}

.project-tasks.expanded {
  max-height: 1000px; /* or auto with different approach */
}
```

### 2. Task Panel Slide-in
- Same as current Task Panel
- Slide from right: 300ms ease-in-out
- Overlay fade: 200ms

### 3. Stats Update
- Number increment animation (countup.js)
- Progress bar fill animation

---

## 📊 Analytics & Tracking

Track user actions:
- Page view: Department Tasks
- Filter applied: {filterType, value}
- Sort changed: {field, direction}
- View mode changed: {mode}
- Project expanded: {projectId}
- Task opened: {taskId}
- Bulk action: {action, taskCount}

---

## 🔐 Permissions & Access Control

### HEAD Role
- ✅ View all projects in department
- ✅ View all tasks
- ✅ Edit tasks
- ✅ Assign tasks
- ✅ Bulk actions
- ✅ Create new tasks
- ✅ Delete tasks (own department)

### MEMBER Role
- ✅ View all projects in department
- ✅ View all tasks (but highlights own tasks)
- ✅ Edit own tasks
- ⚠️ Edit others' tasks (if assigned as collaborator)
- ❌ Delete others' tasks
- ⚠️ Bulk actions (own tasks only)
- ⚠️ Create tasks (if project member)

### Permission Check
```typescript
// In component
const canEditTask = (task: Task) => {
  if (userRole === 'HEAD') return true;
  if (userRole === 'ADMIN') return true;
  if (task.assigneeId === currentUserId) return true;
  if (task.collaboratorIds?.includes(currentUserId)) return true;
  return false;
};
```

---

## 🎯 Success Metrics

### User Experience Metrics
- Time to find a task: < 10 seconds
- Page load time: < 2 seconds
- Interaction response time: < 100ms (optimistic updates)

### Functional Metrics
- % of users using filters: > 60%
- % of users using bulk actions: > 30%
- Average tasks viewed per session: > 15

### Technical Metrics
- API response time: < 500ms
- Client-side rendering: < 100ms
- Virtual scroll FPS: > 50fps

---

## 🛠️ Implementation Phases

### 🎯 MVP (Minimum Viable Product) - 8-12 days

#### Phase 1: Basic View (2-3 days)
- [ ] Create route: `/department/tasks` or `/departments/[departmentId]/tasks`
- [ ] Basic page layout (header + sidebar)
- [ ] Department overview stats (4 metrics + progress bar)
- [ ] Project cards (collapsed by default)
- [ ] Simple task list (no table yet)
- [ ] API endpoint: GET /api/departments/[id]/tasks
- [ ] React Query integration
- [ ] Loading states

#### Phase 2: Filtering & Sorting (1-2 days)
- [ ] Filter panel component
- [ ] Sort dropdown
- [ ] Search functionality
- [ ] URL state management (filters in URL)
- [ ] Clear filters button

#### Phase 3: Table View & Interactions (2-3 days)
- [ ] Task table component (Expanded view mode)
- [ ] Expand/collapse animation
- [ ] Click task → open panel
- [ ] Checkbox selection
- [ ] Priority/status quick change
- [ ] Optimistic updates

#### Phase 4: Bulk Actions (1 day)
- [ ] Bulk actions bar
- [ ] Bulk status change
- [ ] Bulk assign
- [ ] Bulk delete with confirmation
- [ ] API: POST /api/tasks/bulk-update

#### Phase 5: View Modes (1 day)
- [ ] Compact view
- [ ] Expanded view (default) ⭐
- [ ] Detailed view
- [ ] View mode switcher
- [ ] Save preference

#### Phase 6: Polish & Performance (1-2 days)
- [ ] Virtual scrolling (for 100+ tasks)
- [ ] Pagination
- [ ] Skeleton loading
- [ ] Error states
- [ ] Empty states
- [ ] Animations (expand/collapse, transitions)
- [ ] Dark mode support
- [ ] Mobile responsive

**MVP Total Time:** 8-12 days

---

### 🚀 Enhanced Features - Additional 26-34 days

#### Phase 7: Custom Grouping (7-9 days)
See: `DEPARTMENT_TASKS_CUSTOM_GROUPING_DESIGN.md`

**Sub-Phases:**
- [ ] Phase 7.1: Basic single-level grouping (2-3 days)
  - [ ] Group by Project (default) ✅
  - [ ] Group by Assignee
  - [ ] Group by Status
  - [ ] Group by Priority
  - [ ] Group by Due Date
  - [ ] Grouping selector UI
  - [ ] Expand/collapse functionality

- [ ] Phase 7.2: Advanced grouping (2 days)
  - [ ] Group by Tags (need schema update)
  - [ ] Flat list (no grouping)
  - [ ] Multi-level grouping (3 levels max)
  - [ ] Advanced grouping UI

- [ ] Phase 7.3: Stats & Indicators (1 day)
  - [ ] Calculate group stats
  - [ ] Workload calculation (assignee)
  - [ ] Visual indicators
  - [ ] Progress bars
  - [ ] Alert badges

- [ ] Phase 7.4: Persistence (1 day)
  - [ ] Save grouping preference (localStorage)
  - [ ] Save to backend (optional)
  - [ ] URL state management
  - [ ] Restore on page load

- [ ] Phase 7.5: Polish (1 day)
  - [ ] Animations (expand/collapse)
  - [ ] Empty states
  - [ ] Loading states
  - [ ] Responsive design
  - [ ] Dark mode

**Phase 7 Total:** 7-9 days

#### Phase 8: Gantt Chart View (11-16 days)
See: `DEPARTMENT_TASKS_GANTT_CHART_DESIGN.md`

**Sub-Phases:**
- [ ] Phase 8.1: Basic Gantt (3-4 days)
  - [ ] Install dhtmlx-gantt library (~$500/year license)
  - [ ] Create GanttView component
  - [ ] API endpoint: GET /api/departments/[id]/tasks?view=gantt
  - [ ] Transform task data to gantt format
  - [ ] Basic timeline rendering (week view)
  - [ ] Task bars with colors by status
  - [ ] Today line
  - [ ] Loading states

- [ ] Phase 8.2: Interactions (2-3 days)
  - [ ] Drag & drop to change dates
  - [ ] Drag edges to change duration
  - [ ] Drag progress bar
  - [ ] Click task → open panel
  - [ ] Hover tooltip
  - [ ] Optimistic updates
  - [ ] Zoom controls (day/week/month)

- [ ] Phase 8.3: Dependencies (2 days)
  - [ ] Display dependency links
  - [ ] Create dependency by dragging
  - [ ] Delete dependency
  - [ ] Validate circular dependencies
  - [ ] Dependency types (FS, SS, FF, SF)
  - [ ] Auto-adjust dates

- [ ] Phase 8.4: Advanced Features (2-3 days)
  - [ ] Critical path calculation
  - [ ] Critical path highlighting
  - [ ] Milestone support
  - [ ] Progress tracking indicators
  - [ ] At-risk task detection
  - [ ] Weekend highlighting

- [ ] Phase 8.5: Grouping & Views (1-2 days)
  - [ ] Group by project (default)
  - [ ] Group by assignee (resource view)
  - [ ] Group by priority
  - [ ] Resource allocation view
  - [ ] Baseline comparison (optional)

- [ ] Phase 8.6: Export & Polish (1-2 days)
  - [ ] Export to PDF
  - [ ] Export to Excel
  - [ ] Export to MS Project (optional)
  - [ ] Print view
  - [ ] Responsive design
  - [ ] Dark mode support
  - [ ] Keyboard shortcuts

**Phase 8 Total:** 11-16 days

#### Phase 9: Additional Features (8-9 days)
- [ ] Export to Excel/PDF (Table view) (1 day)
- [ ] Print optimized view (1 day)
- [ ] Department analytics dashboard (2-3 days)
- [ ] Task dependencies visualization (outside Gantt) (2 days)
- [ ] Workload balancing tools (1-2 days)
- [ ] Timeline view (alternative to Gantt) (1 day)

**Phase 9 Total:** 8-9 days

---

### 📊 Complete Timeline Summary

| Phase | Feature | Time | Cumulative | Priority |
|-------|---------|------|------------|----------|
| 1-6 | **MVP (Basic Department Tasks)** | 8-12 days | 8-12 days | ⭐⭐⭐ MUST |
| 7 | Custom Grouping | 7-9 days | 15-21 days | ⭐⭐ SHOULD |
| 8 | Gantt Chart View | 11-16 days | 26-37 days | ⭐⭐ SHOULD |
| 9 | Additional Features | 8-9 days | 34-46 days | ⭐ NICE |

**Recommended Approach:**
1. **Sprint 1 (Weeks 1-2):** Implement MVP (Phases 1-6)
2. **Sprint 2 (Weeks 3-4):** Add Custom Grouping (Phase 7)
3. **Sprint 3-4 (Weeks 5-8):** Add Gantt Chart (Phase 8)
4. **Sprint 5 (Weeks 9-10):** Polish + Additional Features (Phase 9)

**Total Time:** 6-10 weeks (1.5-2.5 months)

---

### 🎯 Recommended MVP Scope

For fastest time-to-market, implement **Phases 1-6 only** first:

✅ **Include in MVP:**
- Basic view with project grouping
- Department stats
- Table view (Expanded mode as default)
- Filtering & sorting
- Task panel integration
- Bulk actions
- Optimistic updates
- Responsive design

⏸️ **Defer to v2:**
- Custom grouping (except Project)
- Gantt chart
- Export features
- Advanced analytics

**MVP Launch:** 8-12 days → Get user feedback → Iterate

---

### 🔄 Iterative Development Strategy

**Week 1-2:** MVP
- Deploy to staging
- Gather feedback from HEAD users
- Identify most-used features

**Week 3-4:** Based on feedback
- If users need workload view → Prioritize Grouping by Assignee
- If users need timeline → Prioritize Gantt Chart
- If users want more filters → Enhance filtering

**Week 5+:** Advanced features
- Implement based on actual usage data
- A/B test features
- Optimize performance

---

### 💰 Budget Considerations

**Development Time:**
- Developer cost: ~$50-100/hour
- MVP (12 days): $4,800 - $9,600
- Full implementation (46 days): $18,400 - $36,800

**Third-Party Costs:**
- dhtmlx-gantt Pro license: $500/year (for Gantt chart)
- Total first year: $500

**ROI:**
- Time saved for department heads: ~2-4 hours/week
- 10 department heads × 3 hours/week × 50 weeks = 1,500 hours/year
- Value: $30,000 - $60,000/year (at $20-40/hour)

**Break-even:** < 1 month

---

## 📝 Notes & Considerations

### Design Decisions

1. **Why group by projects?**
   - Tasks ใน department มักจัดตาม project อยู่แล้ว
   - ง่ายต่อการมองภาพรวมแต่ละโครงการ
   - สามารถเปรียบเทียบ progress ระหว่าง projects

2. **Why collapsible?**
   - Department อาจมี 10-20+ projects
   - Collapse ช่วยให้เห็นภาพรวมได้เร็ว
   - Expand เฉพาะที่สนใจ

3. **Why 3 view modes?**
   - Compact: สำหรับเห็นภาพรวมเยอะๆ
   - Expanded: ดูแบบ balanced (default)
   - Detailed: วิเคราะห์เชิงลึก

4. **Why show stats per project?**
   - ช่วยให้เห็นว่า project ไหนมีปัญหา (overdue เยอะ)
   - เห็น progress ได้ชัดเจน

### Alternative Designs Considered

1. **Flat List (All Tasks):**
   - ❌ ยาก scan เพราะงานปนกัน
   - ✅ ใช้ได้ถ้ามีงานน้อย (<50 tasks)

2. **Kanban Board (All Tasks):**
   - ❌ ไม่เห็นรายละเอียด
   - ✅ เหมาะกับการดู flow

3. **Calendar View:**
   - ❌ ไม่เห็นข้อมูลอื่นๆ นอกจากวันที่
   - ✅ เหมาะกับการดู timeline

**→ Grouping by project เป็นตัวเลือกที่ดีที่สุดสำหรับ department-level view**

---

## 🔮 Future Enhancements

### Phase 7+ (Future)
- [ ] Export to Excel/PDF
- [ ] Print view
- [ ] Gantt chart view
- [ ] Department analytics dashboard
- [ ] Task dependencies visualization
- [ ] Workload balancing view
- [ ] Timeline view
- [ ] Custom grouping (by assignee, status, priority)
- [ ] Saved filter presets
- [ ] Email digest (daily/weekly summary)
- [ ] Real-time updates (WebSocket)

---

## 📚 References

- Similar features in:
  - Asana: Portfolio view
  - Jira: Project list with epic grouping
  - Trello: Board list view
  - Monday.com: Department dashboard
  - ClickUp: Everything view with grouping

---

## ✅ Acceptance Criteria

### Must Have (MVP)
- [x] แสดงงานทั้งหมดใน department จัดกลุ่มตาม project
- [x] แสดง stats: total, completed, overdue, due soon
- [x] กรองตาม: status, priority, assignee, due date
- [x] เรียงลำดับตาม: project, task, priority, due date
- [x] คลิกงานเพื่อเปิด task panel
- [x] Expand/collapse project groups
- [x] Responsive design (desktop, tablet, mobile)
- [x] Dark mode support
- [x] Loading & error states

### Should Have
- [x] Bulk actions (status, assign, delete)
- [x] 3 view modes (compact, expanded, detailed)
- [x] Search functionality
- [x] Virtual scrolling for performance
- [x] Optimistic updates
- [x] Empty states with helpful messages

### Nice to Have
- [ ] Export functionality
- [ ] Saved filter presets
- [ ] Custom grouping options
- [ ] Analytics dashboard
- [ ] Real-time updates

---

## 🎨 Mockup Summary

**Page Name:** Department Tasks
**Route:** `/department/tasks` or `/departments/[departmentId]/tasks`
**Main Components:**
1. Page Header (search, filter, sort, view switcher)
2. Department Overview Stats (4 metrics + progress)
3. Project Group Cards (collapsible, with task table)
4. Task Detail Panel (slide-in, same as current)
5. Bulk Actions Bar (when tasks selected)

**Key Features:**
- Group tasks by project
- Multiple view modes
- Advanced filtering
- Bulk actions
- Responsive design
- Optimistic updates
- Performance optimized

---

**END OF DESIGN DOCUMENT**

**Ready for:**
- ✅ Developer review
- ✅ Stakeholder approval
- ✅ Implementation planning
- ✅ API development
- ✅ Frontend development

**Next Steps:**
1. Review this design with team
2. Get feedback and iterate
3. Create API endpoints
4. Implement Phase 1 (Basic View)
5. Iterate through phases 2-6
