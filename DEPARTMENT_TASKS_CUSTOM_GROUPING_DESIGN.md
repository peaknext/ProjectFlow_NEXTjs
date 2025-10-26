# Custom Grouping - Design Extension

**Created:** 2025-10-23
**Status:** Enhanced Proposal
**Feature:** Custom Grouping Options for Department Tasks
**Parent Document:** `DEPARTMENT_TASKS_VIEW_DESIGN.md`

---

## 📋 Overview

เพิ่มความสามารถในการ **จัดกลุ่มงาน (Grouping)** แบบ flexible ตามเกณฑ์ต่างๆ ให้ผู้ใช้มองเห็นข้อมูลในมุมมุมที่แตกต่างกัน

---

## 🎯 Use Cases

### Use Case 1: จัดกลุ่มตามผู้รับผิดชอบ (Group by Assignee)
**Actor:** HEAD
**Goal:** ดูว่าแต่ละคนมีงานอะไรบ้าง และมีภาระงานมากแค่ไหน

**Flow:**
1. เปลี่ยน grouping จาก "Project" → "Assignee"
2. เห็นรายชื่อคนในแผนก พร้อมงานที่ assigned
3. เห็นจำนวนงานและ workload ของแต่ละคน
4. ระบุคนที่มีงานมากเกินไป (overload)
5. Re-assign งานให้สมดุล

### Use Case 2: จัดกลุ่มตาม Priority (Group by Priority)
**Actor:** HEAD
**Goal:** โฟกัสงานเร่งด่วนก่อน

**Flow:**
1. เปลี่ยน grouping → "Priority"
2. เห็นงาน Priority 1 (Urgent) ทั้งหมด
3. ตรวจสอบว่างานเร่งด่วนทำเสร็จหรือยัง
4. เห็นงาน Priority 2-4
5. มอบหมายทีมให้จัดการงาน Priority 1 ให้เสร็จก่อน

### Use Case 3: จัดกลุ่มตาม Status (Group by Status)
**Actor:** HEAD / MEMBER
**Goal:** ดูงานในแต่ละขั้นตอน

**Flow:**
1. เปลี่ยน grouping → "Status"
2. เห็นกลุ่ม: TODO, IN_PROGRESS, COMPLETED, ON_HOLD
3. ตรวจสอบงานที่ค้างใน TODO นาน
4. เห็นงานที่ ON_HOLD และเหตุผล
5. Track progress จาก TODO → COMPLETED

### Use Case 4: จัดกลุ่มตาม Due Date (Group by Due Date)
**Actor:** HEAD
**Goal:** จัดการงานที่ใกล้ deadline

**Flow:**
1. เปลี่ยน grouping → "Due Date"
2. เห็นกลุ่ม: Overdue, Today, This Week, This Month, Later
3. โฟกัสที่กลุ่ม "Overdue" และ "Today" ก่อน
4. วางแผนสำหรับงาน "This Week"
5. Monitor ให้งานไม่เลย deadline

### Use Case 5: จัดกลุ่มตาม Department (Multi-Department View)
**Actor:** CHIEF / LEADER
**Goal:** เปรียบเทียบงานระหว่าง departments (ถ้ามีสิทธิ์ดูหลายแผนก)

**Flow:**
1. เลือกดูหลาย departments
2. เปลี่ยน grouping → "Department"
3. เห็นงานของแต่ละแผนก
4. เปรียบเทียบ workload
5. จัดสรรทรัพยากรระหว่างแผนก

### Use Case 6: จัดกลุ่มตาม Custom Field
**Actor:** HEAD (Advanced)
**Goal:** จัดกลุ่มตามเกณฑ์พิเศษ (เช่น Tags, Categories)

**Flow:**
1. เปลี่ยน grouping → "Custom"
2. เลือก field: Tags (เช่น "Bug", "Feature", "Improvement")
3. เห็นงานจัดกลุ่มตาม tag
4. วิเคราะห์ตาม category

---

## 🎨 UI Design

### 1. Grouping Selector

```tsx
┌────────────────────────────────────────────────────────────────────┐
│ Department Tasks Header                                             │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                                      │
│ 📊 จัดกลุ่มตาม (Group By):                                         │
│                                                                      │
│ ┌──────────────────────────────────────────────────────────────┐   │
│ │ ● โครงการ (Project)                 ← Default               │   │
│ │ ○ ผู้รับผิดชอบ (Assignee)                                    │   │
│ │ ○ สถานะ (Status)                                              │   │
│ │ ○ ความสำคัญ (Priority)                                        │   │
│ │ ○ กำหนดส่ง (Due Date)                                         │   │
│ │ ○ ประเภทงาน (Task Type)                                       │   │
│ │ ○ แท็ก (Tags)                                                 │   │
│ │ ○ ไม่จัดกลุ่ม (Flat List)                                     │   │
│ └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│ ┌──────────────────────────────────────────────────────────────┐   │
│ │ ⚙️ Advanced Grouping                                          │   │
│ │ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐         │   │
│ │ │ Primary      │ │ Secondary    │ │ Tertiary     │         │   │
│ │ │ Project ▼    │ │ Assignee ▼   │ │ Priority ▼   │         │   │
│ │ └──────────────┘ └──────────────┘ └──────────────┘         │   │
│ │ Multi-level grouping (up to 3 levels)                        │   │
│ └──────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────┘
```

**Features:**
- Radio buttons สำหรับ grouping แบบเดี่ยว
- Advanced mode: จัดกลุ่มหลายชั้น (nested grouping)
- Save grouping preference per user

---

### 2. Group by Project (Default)

```tsx
┌────────────────────────────────────────────────────────────────────┐
│ 📊 จัดกลุ่มตาม: โครงการ (Project)                                 │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                                      │
│ ▼ 📁 โครงการพัฒนา HIS (15 งาน | Progress 80%)                     │
│    ┌──────────────────────────────────────────────────────────┐    │
│    │ Task 1: Setup Database          (สมชาย | ✅ Done)        │    │
│    │ Task 2: API Development         (สมหญิง | 🔵 60%)        │    │
│    │ Task 3: UI Design               (สมศรี | ⚫ Todo)        │    │
│    │ ... (12 more tasks)                                       │    │
│    └──────────────────────────────────────────────────────────┘    │
│                                                                      │
│ ▼ 📁 โครงการจัดซื้อเครื่องมือ (8 งาน | Progress 40%)              │
│    ┌──────────────────────────────────────────────────────────┐    │
│    │ Task 4: ประเมินราคา            (สมพร | ✅ Done)          │    │
│    │ Task 5: ยื่นเอกสาร             (สมชัย | 🔵 30%)          │    │
│    │ ... (6 more tasks)                                        │    │
│    └──────────────────────────────────────────────────────────┘    │
│                                                                      │
│ ▼ 📁 งานที่ไม่มีโครงการ (3 งาน)                                   │
│    ┌──────────────────────────────────────────────────────────┐    │
│    │ Task X: Ad-hoc request         (สมใจ | 🔵 50%)           │    │
│    │ ...                                                       │    │
│    └──────────────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────────────────┘
```

---

### 3. Group by Assignee

```tsx
┌────────────────────────────────────────────────────────────────────┐
│ 📊 จัดกลุ่มตาม: ผู้รับผิดชอบ (Assignee)                            │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                                      │
│ ▼ 👤 สมชาย ใจดี (8 งาน | Workload: 120% ⚠️ OVERLOADED)           │
│    ┌──────────────────────────────────────────────────────────┐    │
│    │ 📊 Workload Chart: ████████████████ 120%                 │    │
│    │    This Week: 48 hrs (Normal: 40 hrs)                    │    │
│    └──────────────────────────────────────────────────────────┘    │
│                                                                      │
│    ┌──────────────────────────────────────────────────────────┐    │
│    │ 🔴 [Proj A] Setup Database     (✅ Done | 10/20)          │    │
│    │ 🟠 [Proj A] API Dev            (🔵 60% | 10/25 ⏰)        │    │
│    │ 🟡 [Proj B] Testing            (⚫ Todo | 11/05)          │    │
│    │ 🔴 [Proj C] Deploy             (⚫ Todo | 10/30 🔥)       │    │
│    │ ... (4 more tasks)                                        │    │
│    └──────────────────────────────────────────────────────────┘    │
│                                                                      │
│ ▼ 👤 สมหญิง ขยัน (5 งาน | Workload: 80% 🟢 NORMAL)                │
│    ┌──────────────────────────────────────────────────────────┐    │
│    │ 📊 Workload Chart: ████████ 80%                          │    │
│    │    This Week: 32 hrs (Normal: 40 hrs)                    │    │
│    └──────────────────────────────────────────────────────────┘    │
│                                                                      │
│    ┌──────────────────────────────────────────────────────────┐    │
│    │ 🟠 [Proj A] Frontend Dev       (🔵 70% | 11/01)          │    │
│    │ 🟡 [Proj B] Documentation      (⚫ Todo | 11/10)          │    │
│    │ ... (3 more tasks)                                        │    │
│    └──────────────────────────────────────────────────────────┘    │
│                                                                      │
│ ▼ 👤 สมศรี สวยงาม (3 งาน | Workload: 40% 🟡 UNDERUTILIZED)        │
│    ┌──────────────────────────────────────────────────────────┐    │
│    │ 📊 Workload Chart: ████ 40%                              │    │
│    │    This Week: 16 hrs (Normal: 40 hrs) - Can take more!   │    │
│    └──────────────────────────────────────────────────────────┘    │
│                                                                      │
│    ┌──────────────────────────────────────────────────────────┐    │
│    │ 🟡 [Proj A] UI Design          (🔵 30% | 11/05)          │    │
│    │ ... (2 more tasks)                                        │    │
│    └──────────────────────────────────────────────────────────┘    │
│                                                                      │
│ ▼ 👤 ไม่ได้มอบหมาย (Unassigned) (2 งาน)                           │
│    ┌──────────────────────────────────────────────────────────┐    │
│    │ ⚪ [Proj C] Need Assignment    (⚫ Todo | 11/15)          │    │
│    │ ...                                                       │    │
│    └──────────────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────────────────┘
```

**Key Features:**
- **Workload Indicator:**
  - 🟢 0-80%: Normal
  - 🟡 81-100%: High
  - 🔴 >100%: Overloaded
  - 🟡 <50%: Underutilized (can take more)

- **Workload Calculation:**
  ```typescript
  // Estimate hours per task
  const estimatedHours = {
    1: 8,  // Priority 1: 8 hours
    2: 4,  // Priority 2: 4 hours
    3: 2,  // Priority 3: 2 hours
    4: 1,  // Priority 4: 1 hour
  };

  // Calculate weekly workload
  const tasksThisWeek = tasks.filter(t => isDueThisWeek(t.dueDate));
  const totalHours = tasksThisWeek.reduce((sum, t) =>
    sum + estimatedHours[t.priority] * (1 - t.progress), 0
  );
  const workloadPercent = (totalHours / 40) * 100; // 40 = normal work week
  ```

---

### 4. Group by Status

```tsx
┌────────────────────────────────────────────────────────────────────┐
│ 📊 จัดกลุ่มตาม: สถานะ (Status)                                    │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                                      │
│ ▼ ⚫ TODO (18 งาน)                                                 │
│    ┌──────────────────────────────────────────────────────────┐    │
│    │ 🔴 [Proj A] Testing      (สมพร | Due: 11/05 🔥)          │    │
│    │ 🟠 [Proj B] Deploy       (สมชัย | Due: 11/10)            │    │
│    │ 🟡 [Proj C] Document     (สมหมาย | Due: 11/15)           │    │
│    │ ... (15 more tasks)                                       │    │
│    └──────────────────────────────────────────────────────────┘    │
│                                                                      │
│ ▼ 🔵 IN_PROGRESS (15 งาน | Avg Progress: 52%)                      │
│    ┌──────────────────────────────────────────────────────────┐    │
│    │ 🔴 [Proj A] API Dev      (สมหญิง | 60% | Due: 10/25 ⏰)  │    │
│    │ 🟠 [Proj A] Frontend     (สมศรี | 70% | Due: 11/01)      │    │
│    │ 🟡 [Proj B] Integration  (สมใจ | 40% | Due: 11/08)       │    │
│    │ ... (12 more tasks)                                       │    │
│    └──────────────────────────────────────────────────────────┘    │
│                                                                      │
│ ▼ ✅ COMPLETED (12 งาน)                                            │
│    ┌──────────────────────────────────────────────────────────┐    │
│    │ 🔴 [Proj A] Setup DB     (สมชาย | ✅ 10/19)              │    │
│    │ 🟠 [Proj B] Research     (สมดี | ✅ 10/15)                │    │
│    │ ... (10 more tasks)                                       │    │
│    └──────────────────────────────────────────────────────────┘    │
│                                                                      │
│ ▼ 🟡 ON_HOLD (3 งาน)                                               │
│    ┌──────────────────────────────────────────────────────────┐    │
│    │ 🟠 [Proj C] Waiting      (สมรัก | On Hold since 10/10)   │    │
│    │    Reason: รอข้อมูลจากแผนกอื่น                            │    │
│    │ ... (2 more tasks)                                        │    │
│    └──────────────────────────────────────────────────────────┘    │
│                                                                      │
│ ▼ 🔴 CANCELLED (1 งาน)                                             │
│    ┌──────────────────────────────────────────────────────────┐    │
│    │ ⚪ [Proj D] Old Feature  (- | Cancelled 09/30)            │    │
│    └──────────────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────────────────┘
```

**Key Features:**
- แสดงจำนวนงานในแต่ละสถานะ
- Average progress สำหรับ IN_PROGRESS
- เหตุผลการ ON_HOLD (ถ้ามี)
- วันที่ COMPLETED / CANCELLED

---

### 5. Group by Priority

```tsx
┌────────────────────────────────────────────────────────────────────┐
│ 📊 จัดกลุ่มตาม: ความสำคัญ (Priority)                              │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                                      │
│ ▼ 🔴 ด่วนที่สุด (Priority 1 - Urgent) - 8 งาน                     │
│    ┌──────────────────────────────────────────────────────────┐    │
│    │ ⚠️ CRITICAL: 2 งานเลย deadline!                           │    │
│    └──────────────────────────────────────────────────────────┘    │
│                                                                      │
│    ┌──────────────────────────────────────────────────────────┐    │
│    │ [Proj A] Fix Security Bug    (สมชาย | 🔵 80% | 10/25 🔥) │    │
│    │ [Proj B] Database Backup     (สมหญิง | ⚫ Todo | 10/23 🔥)│    │
│    │ [Proj C] Server Migration    (สมศรี | 🔵 50% | 11/01 ⏰) │    │
│    │ ... (5 more tasks)                                        │    │
│    └──────────────────────────────────────────────────────────┘    │
│                                                                      │
│ ▼ 🟠 สำคัญ (Priority 2 - High) - 12 งาน                           │
│    ┌──────────────────────────────────────────────────────────┐    │
│    │ [Proj A] API Development     (สมพร | 🔵 60% | 10/30)     │    │
│    │ [Proj B] UI Redesign         (สมใจ | 🔵 40% | 11/05)     │    │
│    │ ... (10 more tasks)                                       │    │
│    └──────────────────────────────────────────────────────────┘    │
│                                                                      │
│ ▼ 🟡 ปกติ (Priority 3 - Normal) - 18 งาน                          │
│    ┌──────────────────────────────────────────────────────────┐    │
│    │ [Proj A] Documentation       (สมดี | ⚫ Todo | 11/15)     │    │
│    │ [Proj C] Refactoring         (สมรัก | 🔵 20% | 11/20)    │    │
│    │ ... (16 more tasks)                                       │    │
│    └──────────────────────────────────────────────────────────┘    │
│                                                                      │
│ ▼ ⚪ ต่ำ (Priority 4 - Low) - 7 งาน                                │
│    ┌──────────────────────────────────────────────────────────┐    │
│    │ [Proj B] Code Cleanup        (สมหมาย | ⚫ Todo | 12/01)   │    │
│    │ [Proj D] Nice-to-have        (สมเพียร | ⚫ Todo | 12/15)  │    │
│    │ ... (5 more tasks)                                        │    │
│    └──────────────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────────────────┘
```

**Key Features:**
- ⚠️ Alert สำหรับงาน Priority 1 ที่เลย deadline
- จำนวนงานในแต่ละ priority
- เรียงจาก Urgent → Low

---

### 6. Group by Due Date

```tsx
┌────────────────────────────────────────────────────────────────────┐
│ 📊 จัดกลุ่มตาม: กำหนดส่ง (Due Date)                               │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                                      │
│ ▼ 🔥 เลยกำหนด (Overdue) - 5 งาน ⚠️ URGENT                         │
│    ┌──────────────────────────────────────────────────────────┐    │
│    │ [Proj A] Security Patch  (สมชาย | 🔵 90% | Due: 10/20)   │    │
│    │ [Proj B] Backup Server   (สมหญิง | ⚫ Todo | Due: 10/18)  │    │
│    │ [Proj C] Bug Fix #123    (สมศรี | 🔵 50% | Due: 10/15)   │    │
│    │ ... (2 more tasks)                                        │    │
│    └──────────────────────────────────────────────────────────┘    │
│                                                                      │
│ ▼ 📅 วันนี้ (Today: Oct 23) - 3 งาน                               │
│    ┌──────────────────────────────────────────────────────────┐    │
│    │ [Proj A] Deploy v2.1     (สมพร | 🔵 80% | Due: Today)    │    │
│    │ [Proj B] QA Testing      (สมใจ | 🔵 60% | Due: Today)    │    │
│    │ ... (1 more task)                                         │    │
│    └──────────────────────────────────────────────────────────┘    │
│                                                                      │
│ ▼ ⏰ สัปดาห์นี้ (This Week: Oct 23-29) - 8 งาน                     │
│    ┌──────────────────────────────────────────────────────────┐    │
│    │ [Proj A] API Development (สมดี | 🔵 60% | Due: 10/25)    │    │
│    │ [Proj C] UI Update       (สมรัก | ⚫ Todo | Due: 10/27)   │    │
│    │ [Proj D] Documentation   (สมหมาย | ⚫ Todo | Due: 10/28)  │    │
│    │ ... (5 more tasks)                                        │    │
│    └──────────────────────────────────────────────────────────┘    │
│                                                                      │
│ ▼ 📆 เดือนนี้ (This Month: Oct) - 12 งาน                          │
│    ┌──────────────────────────────────────────────────────────┐    │
│    │ [Proj A] Feature X       (สมเพียร | ⚫ Todo | Due: 10/31) │    │
│    │ ... (11 more tasks)                                       │    │
│    └──────────────────────────────────────────────────────────┘    │
│                                                                      │
│ ▼ 📅 เดือนหน้า (Next Month: Nov) - 15 งาน                         │
│    ┌──────────────────────────────────────────────────────────┐    │
│    │ [Proj B] Phase 2         (สมชาติ | ⚫ Todo | Due: 11/15)  │    │
│    │ ... (14 more tasks)                                       │    │
│    └──────────────────────────────────────────────────────────┘    │
│                                                                      │
│ ▼ 🔮 ในอนาคต (Later) - 6 งาน                                      │
│    ┌──────────────────────────────────────────────────────────┐    │
│    │ [Proj C] Future Feature  (สมใจ | ⚫ Todo | Due: 12/31)    │    │
│    │ ... (5 more tasks)                                        │    │
│    └──────────────────────────────────────────────────────────┘    │
│                                                                      │
│ ▼ ❓ ไม่มีกำหนดส่ง (No Due Date) - 4 งาน                          │
│    ┌──────────────────────────────────────────────────────────┐    │
│    │ [Proj X] Ongoing Task    (สมรัก | 🔵 30% | No deadline)   │    │
│    │ ... (3 more tasks)                                        │    │
│    └──────────────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────────────────┘
```

**Key Features:**
- เน้นกลุ่ม Overdue และ Today (สีแดง/ส้ม)
- จัดเรียงจาก urgent → later
- แยกงานที่ไม่มี due date

---

### 7. Group by Tags / Custom Field

```tsx
┌────────────────────────────────────────────────────────────────────┐
│ 📊 จัดกลุ่มตาม: แท็ก (Tags)                                       │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                                      │
│ ▼ 🐛 Bug Fix (8 งาน)                                              │
│    ┌──────────────────────────────────────────────────────────┐    │
│    │ [Proj A] Fix login issue  (สมชาย | 🔵 80% | 10/25)       │    │
│    │ [Proj B] Resolve crash    (สมหญิง | 🔵 60% | 10/28)      │    │
│    │ ... (6 more tasks)                                        │    │
│    └──────────────────────────────────────────────────────────┘    │
│                                                                      │
│ ▼ ✨ Feature (12 งาน)                                              │
│    ┌──────────────────────────────────────────────────────────┐    │
│    │ [Proj A] New Dashboard    (สมศรี | 🔵 40% | 11/05)       │    │
│    │ [Proj C] Export Function  (สมพร | ⚫ Todo | 11/10)       │    │
│    │ ... (10 more tasks)                                       │    │
│    └──────────────────────────────────────────────────────────┘    │
│                                                                      │
│ ▼ 🔧 Improvement (7 งาน)                                           │
│    ┌──────────────────────────────────────────────────────────┐    │
│    │ [Proj B] Optimize Query   (สมใจ | 🔵 50% | 11/15)        │    │
│    │ [Proj A] Refactor Code    (สมดี | ⚫ Todo | 11/20)       │    │
│    │ ... (5 more tasks)                                        │    │
│    └──────────────────────────────────────────────────────────┘    │
│                                                                      │
│ ▼ 📚 Documentation (5 งาน)                                         │
│    ┌──────────────────────────────────────────────────────────┐    │
│    │ [Proj A] API Docs         (สมหมาย | ⚫ Todo | 11/30)      │    │
│    │ ... (4 more tasks)                                        │    │
│    └──────────────────────────────────────────────────────────┘    │
│                                                                      │
│ ▼ 🧪 Testing (4 งาน)                                               │
│    ┌──────────────────────────────────────────────────────────┐    │
│    │ [Proj B] Integration Test (สมรัก | 🔵 30% | 11/08)       │    │
│    │ ... (3 more tasks)                                        │    │
│    └──────────────────────────────────────────────────────────┘    │
│                                                                      │
│ ▼ ❓ ไม่มีแท็ก (No Tags) (9 งาน)                                   │
│    ┌──────────────────────────────────────────────────────────┐    │
│    │ [Proj X] Misc Task        (สมเพียร | ⚫ Todo | 12/01)     │    │
│    │ ... (8 more tasks)                                        │    │
│    └──────────────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────────────────┘
```

**Note:** ต้องเพิ่ม `tags` field ใน Task schema

---

### 8. Flat List (No Grouping)

```tsx
┌────────────────────────────────────────────────────────────────────┐
│ 📊 จัดกลุ่มตาม: ไม่จัดกลุ่ม (Flat List)                           │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                                      │
│ ทั้งหมด 45 งาน (เรียงตาม: Due Date ▼)                             │
│                                                                      │
│ ┌──────────────────────────────────────────────────────────────┐   │
│ │□│งาน                │Proj│Asn   │Prio│Status │Due Date      │   │
│ ├─┼──────────────────┼────┼──────┼────┼───────┼──────────────┤   │
│ │□│Security Patch    │ A  │สมชาย │ 1  │🔵 90% │10/20 🔥      │   │
│ │□│Backup Server     │ B  │สมหญิง│ 1  │⚫ Todo│10/18 🔥      │   │
│ │□│Deploy v2.1       │ A  │สมพร  │ 2  │🔵 80% │10/23 Today   │   │
│ │□│API Development   │ A  │สมดี  │ 2  │🔵 60% │10/25 ⏰      │   │
│ │□│UI Update         │ C  │สมรัก │ 3  │⚫ Todo│10/27         │   │
│ │ ... (40 more tasks)                                          │   │
│ └──────────────────────────────────────────────────────────────┘   │
│                                                                      │
│ Showing 1-20 of 45 | [1] [2] [3] [Next →]                          │
└────────────────────────────────────────────────────────────────────┘
```

**Use Case:** เมื่อต้องการดูทุกงานในรูปแบบ table ธรรมดา ไม่จัดกลุ่ม

---

## 🎨 Multi-Level Grouping (Advanced)

### Example: Group by Project → Assignee → Priority

```tsx
┌────────────────────────────────────────────────────────────────────┐
│ 📊 จัดกลุ่มแบบหลายชั้น (Multi-Level Grouping)                      │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                                      │
│ Level 1: Project | Level 2: Assignee | Level 3: Priority           │
│                                                                      │
│ ▼ 📁 โครงการพัฒนา HIS                                              │
│   ├─ ▼ 👤 สมชาย ใจดี (3 งาน)                                      │
│   │   ├─ ▼ 🔴 Priority 1 (2 งาน)                                   │
│   │   │   ├─ [Task 1] Setup DB (✅ Done)                            │
│   │   │   └─ [Task 4] Security (🔵 80%)                             │
│   │   └─ ▼ 🟠 Priority 2 (1 งาน)                                   │
│   │       └─ [Task 7] Testing (⚫ Todo)                              │
│   │                                                                  │
│   ├─ ▼ 👤 สมหญิง ขยัน (2 งาน)                                      │
│   │   ├─ ▼ 🟠 Priority 2 (1 งาน)                                   │
│   │   │   └─ [Task 2] API Dev (🔵 60%)                              │
│   │   └─ ▼ 🟡 Priority 3 (1 งาน)                                   │
│   │       └─ [Task 5] Docs (⚫ Todo)                                 │
│   │                                                                  │
│   └─ ▼ 👤 สมศรี สวยงาม (1 งาน)                                     │
│       └─ ▼ 🟡 Priority 3 (1 งาน)                                   │
│           └─ [Task 3] UI Design (🔵 40%)                            │
│                                                                      │
│ ▼ 📁 โครงการจัดซื้อ                                                │
│   ├─ ▼ 👤 สมพร ขยัน (2 งาน)                                       │
│   │   ...                                                            │
│   └─ ...                                                             │
└────────────────────────────────────────────────────────────────────┘
```

**Features:**
- จัดกลุ่มได้ถึง 3 ชั้น
- Collapse/Expand แต่ละระดับแยกกัน
- เหมาะสำหรับการวิเคราะห์เชิงลึก

---

## 🔧 Technical Implementation

### 1. Grouping Data Structure

```typescript
interface GroupedTasks {
  groupBy: GroupingOption;
  groups: TaskGroup[];
}

interface TaskGroup {
  id: string;
  name: string;
  icon?: string;
  count: number;
  stats?: {
    total: number;
    completed: number;
    overdue: number;
    dueSoon: number;
    avgProgress?: number;
    workload?: number; // For assignee grouping
  };
  tasks: Task[];
  subGroups?: TaskGroup[]; // For multi-level grouping
}

type GroupingOption =
  | 'project'
  | 'assignee'
  | 'status'
  | 'priority'
  | 'dueDate'
  | 'tags'
  | 'department' // For multi-department view
  | 'none'; // Flat list
```

---

### 2. Grouping Logic (Client-Side)

```typescript
// File: src/lib/task-grouping.ts

export function groupTasks(
  tasks: Task[],
  groupBy: GroupingOption
): TaskGroup[] {
  switch (groupBy) {
    case 'project':
      return groupByProject(tasks);
    case 'assignee':
      return groupByAssignee(tasks);
    case 'status':
      return groupByStatus(tasks);
    case 'priority':
      return groupByPriority(tasks);
    case 'dueDate':
      return groupByDueDate(tasks);
    case 'tags':
      return groupByTags(tasks);
    case 'none':
      return [{ id: 'all', name: 'All Tasks', tasks, count: tasks.length }];
    default:
      return [];
  }
}

function groupByProject(tasks: Task[]): TaskGroup[] {
  const projectMap = new Map<string, Task[]>();

  tasks.forEach((task) => {
    const projectId = task.projectId || 'no-project';
    const existing = projectMap.get(projectId) || [];
    projectMap.set(projectId, [...existing, task]);
  });

  return Array.from(projectMap.entries()).map(([projectId, projectTasks]) => ({
    id: projectId,
    name: projectTasks[0]?.projectName || 'งานที่ไม่มีโครงการ',
    icon: '📁',
    count: projectTasks.length,
    stats: calculateGroupStats(projectTasks),
    tasks: projectTasks,
  }));
}

function groupByAssignee(tasks: Task[]): TaskGroup[] {
  const assigneeMap = new Map<string, Task[]>();

  tasks.forEach((task) => {
    const assigneeId = task.assigneeId || 'unassigned';
    const existing = assigneeMap.get(assigneeId) || [];
    assigneeMap.set(assigneeId, [...existing, task]);
  });

  return Array.from(assigneeMap.entries())
    .map(([assigneeId, assigneeTasks]) => ({
      id: assigneeId,
      name: assigneeTasks[0]?.assignee?.name || 'ไม่ได้มอบหมาย',
      icon: '👤',
      count: assigneeTasks.length,
      stats: {
        ...calculateGroupStats(assigneeTasks),
        workload: calculateWorkload(assigneeTasks),
      },
      tasks: assigneeTasks,
    }))
    .sort((a, b) => (b.stats?.workload || 0) - (a.stats?.workload || 0)); // Sort by workload
}

function groupByDueDate(tasks: Task[]): TaskGroup[] {
  const now = new Date();
  const today = startOfDay(now);
  const weekEnd = endOfWeek(now);
  const monthEnd = endOfMonth(now);
  const nextMonthEnd = endOfMonth(addMonths(now, 1));

  const groups: Record<string, Task[]> = {
    overdue: [],
    today: [],
    thisWeek: [],
    thisMonth: [],
    nextMonth: [],
    later: [],
    noDue: [],
  };

  tasks.forEach((task) => {
    if (!task.dueDate) {
      groups.noDue.push(task);
    } else {
      const dueDate = new Date(task.dueDate);

      if (isBefore(dueDate, today)) {
        groups.overdue.push(task);
      } else if (isSameDay(dueDate, today)) {
        groups.today.push(task);
      } else if (isBefore(dueDate, weekEnd)) {
        groups.thisWeek.push(task);
      } else if (isBefore(dueDate, monthEnd)) {
        groups.thisMonth.push(task);
      } else if (isBefore(dueDate, nextMonthEnd)) {
        groups.nextMonth.push(task);
      } else {
        groups.later.push(task);
      }
    }
  });

  return [
    {
      id: 'overdue',
      name: 'เลยกำหนด (Overdue)',
      icon: '🔥',
      count: groups.overdue.length,
      tasks: groups.overdue,
    },
    {
      id: 'today',
      name: `วันนี้ (Today: ${format(today, 'MMM dd')})`,
      icon: '📅',
      count: groups.today.length,
      tasks: groups.today,
    },
    {
      id: 'thisWeek',
      name: 'สัปดาห์นี้ (This Week)',
      icon: '⏰',
      count: groups.thisWeek.length,
      tasks: groups.thisWeek,
    },
    {
      id: 'thisMonth',
      name: 'เดือนนี้ (This Month)',
      icon: '📆',
      count: groups.thisMonth.length,
      tasks: groups.thisMonth,
    },
    {
      id: 'nextMonth',
      name: 'เดือนหน้า (Next Month)',
      icon: '📅',
      count: groups.nextMonth.length,
      tasks: groups.nextMonth,
    },
    {
      id: 'later',
      name: 'ในอนาคต (Later)',
      icon: '🔮',
      count: groups.later.length,
      tasks: groups.later,
    },
    {
      id: 'noDue',
      name: 'ไม่มีกำหนดส่ง (No Due Date)',
      icon: '❓',
      count: groups.noDue.length,
      tasks: groups.noDue,
    },
  ];
}

function calculateWorkload(tasks: Task[]): number {
  const estimatedHours = { 1: 8, 2: 4, 3: 2, 4: 1 };
  const now = new Date();
  const weekEnd = endOfWeek(now);

  const tasksThisWeek = tasks.filter(
    (t) => t.dueDate && isBefore(new Date(t.dueDate), weekEnd)
  );

  const totalHours = tasksThisWeek.reduce(
    (sum, t) => sum + estimatedHours[t.priority] * (1 - t.progress),
    0
  );

  return Math.round((totalHours / 40) * 100); // 40 = normal work week
}
```

---

### 3. Multi-Level Grouping

```typescript
export function groupTasksMultiLevel(
  tasks: Task[],
  levels: GroupingOption[]
): TaskGroup[] {
  if (levels.length === 0) return [];

  const [firstLevel, ...restLevels] = levels;
  const firstGroups = groupTasks(tasks, firstLevel);

  if (restLevels.length === 0) {
    return firstGroups;
  }

  // Recursively group sub-levels
  return firstGroups.map((group) => ({
    ...group,
    subGroups: groupTasksMultiLevel(group.tasks, restLevels),
  }));
}

// Usage
const groups = groupTasksMultiLevel(tasks, ['project', 'assignee', 'priority']);
```

---

### 4. Component Structure

```tsx
// File: src/components/views/department-tasks/grouped-view.tsx

export function GroupedView({
  tasks,
  groupBy,
}: {
  tasks: Task[];
  groupBy: GroupingOption;
}) {
  const groups = useMemo(() => groupTasks(tasks, groupBy), [tasks, groupBy]);

  return (
    <div className="grouped-view">
      {groups.map((group) => (
        <GroupCard key={group.id} group={group} groupBy={groupBy} />
      ))}
    </div>
  );
}

function GroupCard({
  group,
  groupBy,
}: {
  group: TaskGroup;
  groupBy: GroupingOption;
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="group-card">
      <GroupHeader
        group={group}
        groupBy={groupBy}
        isExpanded={isExpanded}
        onToggle={() => setIsExpanded(!isExpanded)}
      />

      {isExpanded && (
        <div className="group-content">
          {group.subGroups ? (
            // Multi-level: render sub-groups
            group.subGroups.map((subGroup) => (
              <GroupCard key={subGroup.id} group={subGroup} groupBy="..." />
            ))
          ) : (
            // Single-level: render task list
            <TaskTable tasks={group.tasks} />
          )}
        </div>
      )}
    </div>
  );
}
```

---

### 5. URL State Management

```typescript
// Store grouping preference in URL
const router = useRouter();
const searchParams = useSearchParams();

const groupBy = (searchParams.get('groupBy') as GroupingOption) || 'project';

const setGroupBy = (newGroupBy: GroupingOption) => {
  const params = new URLSearchParams(searchParams);
  params.set('groupBy', newGroupBy);
  router.push(`?${params.toString()}`);
};

// URL: /department/tasks?groupBy=assignee&view=expanded
```

---

### 6. Save User Preference

```typescript
// Save to localStorage
export function useGroupingPreference() {
  const [groupBy, setGroupBy] = useLocalStorage<GroupingOption>(
    'department-tasks-grouping',
    'project'
  );

  return { groupBy, setGroupBy };
}

// Or save to backend
const savePreference = useMutation({
  mutationFn: (groupBy: GroupingOption) =>
    api.patch('/api/users/me/preferences', {
      departmentTasksGrouping: groupBy,
    }),
});
```

---

## 📊 Grouping Statistics

### Stats per Group

```typescript
interface GroupStats {
  total: number;
  completed: number;
  inProgress: number;
  todo: number;
  overdue: number;
  dueSoon: number;
  avgProgress: number; // 0-1
  workload?: number; // % (for assignee grouping)
  criticalTasks?: number; // Priority 1 tasks
}

function calculateGroupStats(tasks: Task[]): GroupStats {
  const now = new Date();
  const dueSoonThreshold = addDays(now, 3);

  return {
    total: tasks.length,
    completed: tasks.filter((t) => t.status === 'COMPLETED').length,
    inProgress: tasks.filter((t) => t.status === 'IN_PROGRESS').length,
    todo: tasks.filter((t) => t.status === 'TODO').length,
    overdue: tasks.filter(
      (t) => t.dueDate && isBefore(new Date(t.dueDate), now)
    ).length,
    dueSoon: tasks.filter(
      (t) => t.dueDate && isBefore(new Date(t.dueDate), dueSoonThreshold)
    ).length,
    avgProgress:
      tasks.reduce((sum, t) => sum + t.progress, 0) / tasks.length || 0,
    criticalTasks: tasks.filter((t) => t.priority === 1).length,
  };
}
```

---

## 🎨 Visual Indicators

### Workload Status (Assignee Grouping)

```tsx
function WorkloadIndicator({ workload }: { workload: number }) {
  let color = 'green';
  let label = 'Normal';
  let icon = '🟢';

  if (workload > 100) {
    color = 'red';
    label = 'OVERLOADED';
    icon = '🔴';
  } else if (workload > 80) {
    color = 'yellow';
    label = 'High';
    icon = '🟡';
  } else if (workload < 50) {
    color = 'blue';
    label = 'UNDERUTILIZED';
    icon = '🔵';
  }

  return (
    <div className={`workload-badge ${color}`}>
      {icon} {workload}% - {label}
    </div>
  );
}
```

---

## 📱 Responsive Grouping

### Mobile View
- Collapse all groups by default
- Show group stats in compact format
- Tap to expand
- Sticky group headers

### Tablet View
- Show top 3 groups expanded
- Others collapsed
- Scrollable

### Desktop View
- Show all groups expanded (if < 10 groups)
- Full stats visible
- Multi-column layout (optional)

---

## ✅ Implementation Checklist

### Phase 1: Basic Grouping (2-3 days)
- [ ] Group by Project (default) ✅ Already in design
- [ ] Group by Assignee
- [ ] Group by Status
- [ ] Group by Priority
- [ ] Group by Due Date
- [ ] Grouping selector UI
- [ ] Expand/collapse functionality

### Phase 2: Advanced Grouping (2 days)
- [ ] Group by Tags (need schema update)
- [ ] Flat list (no grouping)
- [ ] Multi-level grouping (3 levels max)
- [ ] Advanced grouping UI

### Phase 3: Stats & Indicators (1 day)
- [ ] Calculate group stats
- [ ] Workload calculation (assignee)
- [ ] Visual indicators
- [ ] Progress bars
- [ ] Alert badges

### Phase 4: Persistence (1 day)
- [ ] Save grouping preference (localStorage)
- [ ] Save to backend (optional)
- [ ] URL state management
- [ ] Restore on page load

### Phase 5: Polish (1 day)
- [ ] Animations (expand/collapse)
- [ ] Empty states
- [ ] Loading states
- [ ] Responsive design
- [ ] Dark mode

**Total Estimated Time:** 7-9 days

---

## 🔮 Future Enhancements

- [ ] Custom grouping (user-defined fields)
- [ ] Saved grouping presets (e.g., "My Weekly View")
- [ ] Group templates (e.g., "Sprint Planning", "Workload Balancing")
- [ ] Drag & drop between groups to change grouping field
- [ ] Export grouped view to Excel/PDF
- [ ] Share grouped view URL with team
- [ ] Group-level bulk actions
- [ ] Smart grouping suggestions (AI-based)

---

## 📚 References

- [Material-UI Grouping](https://mui.com/x/react-data-grid/row-grouping/)
- [AG Grid Grouping](https://www.ag-grid.com/javascript-data-grid/grouping/)
- [Jira Grouping Options](https://support.atlassian.com/jira-software-cloud/docs/use-groups-to-organize-your-backlog/)

---

**END OF CUSTOM GROUPING DESIGN EXTENSION**

**Status:** Ready for implementation
**Estimated Time:** 7-9 days
**Recommended First:** Group by Project, Assignee, Status, Priority

---

## 💡 Quick Implementation Guide

1. **Start with basic single-level grouping:**
   - Project (default)
   - Assignee
   - Status
   - Priority

2. **Add stats calculation:**
   - Total, completed, overdue counts
   - Workload for assignee grouping

3. **Implement UI:**
   - Grouping selector dropdown
   - Group cards with stats
   - Expand/collapse

4. **Add persistence:**
   - localStorage for preference
   - URL state for sharing

5. **Test thoroughly:**
   - All grouping options
   - Edge cases (empty groups, no data)
   - Performance with 100+ tasks

6. **Polish:**
   - Animations
   - Responsive design
   - Dark mode

**Next:** Combine with Gantt Chart for ultimate flexibility!
