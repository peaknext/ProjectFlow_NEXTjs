# Dashboard Implementation Plan

**Version**: 1.0.0
**Start Date**: 2025-10-26
**Estimated Completion**: 2025-11-02 (1 week)

---

## 📋 Overview

แผนการพัฒนาหน้า User Dashboard ที่แสดงข้อมูลแบบ real-time จากฐานข้อมูล แทนการใช้ mock data

**สถานะปัจจุบัน**: Dashboard มี layout และ mock data แล้ว ต้องการ:
- เชื่อมต่อกับ API จริง
- สร้าง widgets ที่ครบถ้วน
- Permission-based data (แยกตาม Role)
- Interactive components

---

## 🎯 Requirements Summary

### 1. Stats Cards (4 Cards)
- **Design**: Option B - แยกตาม Role
- **Behavior**:
  - **ADMIN/CHIEF**: แสดงภาพรวมทั้งระบบ
  - **LEADER**: แสดงภาพรวม Division
  - **HEAD**: แสดงภาพรวม Department
  - **MEMBER/USER**: แสดงงานของตัวเอง
- **Cards**:
  1. งานทั้งหมด (Total Tasks)
  2. งานที่เสร็จแล้ว (Completed Tasks)
  3. งานเกินกำหนด (Overdue Tasks)
  4. งานสัปดาห์นี้ (This Week Tasks)

### 2. Overdue Tasks Alert
- แสดง**เฉพาะเมื่อมีงานเกินกำหนด**
- สี red background พร้อม icon warning
- แสดงรายการงานเกินกำหนด (คลิกเปิด Task Panel)

### 3. Pinned Tasks Widget
- แสดงงานที่ user pin ไว้ (จาก pinnedTasks array)
- คลิกเปิด Task Panel
- Empty state เมื่อไม่มีงาน

### 4. My Tasks Widget
- แสดง **10 งานล่าสุด** ที่ได้รับมอบหมาย
- เรียงตาม **due date ใกล้สุด**
- ปุ่ม **"แสดงเพิ่ม"** สำหรับโหลดทีละ 10 รายการ
- Filter tabs: **ทั้งหมด | กำลังทำ | เสร็จแล้ว**
- คลิกเปิด Task Panel

### 5. Dashboard Calendar Widget
- แสดงงานที่มี due date **ของฉัน**
- **ไม่มีสีแยกตาม priority** (ใช้สีเดียว)
- คลิกวันที่แสดง tasks ของวันนั้น
- เปิด Task Panel เมื่อคลิก task

### 6. Recent Activities Widget
- แสดง **5 activities ล่าสุด**
- Scope: **activities ของทีม** (department/project เดียวกัน)
- แสดง avatar, user name, action, timestamp

### 7. My Checklist Widget
- แสดง checklist items ของ tasks ที่ assigned ให้ user
- สามารถ toggle checkbox ได้ (optimistic update)
- แสดงชื่อ task ที่ checklist นั้นอยู่
- Empty state เมื่อไม่มี checklist

### 8. UI/UX Requirements
- ❌ ลบปุ่ม "ตัวกรอง" (ใกล้ปุ่มสร้างงาน)
- ✅ เพิ่มปุ่ม **"รีเฟรช"** แทน
- ✅ ปุ่ม "สร้างงานใหม่" เปิด CreateTaskModal ที่แสดง**ทุกโปรเจค**ที่มีสิทธิ์
- ✅ Loading skeleton ตอนโหลดข้อมูล
- ✅ Empty state ตอนไม่มีงาน
- ✅ คลิก task เพื่อเปิด Task Panel

---

## 🏗️ Architecture Design

### API Endpoint

**Endpoint**: `GET /api/dashboard`

**Query Parameters**:
```typescript
{
  limit?: number,    // Default: 10 (for My Tasks pagination)
  offset?: number    // Default: 0
}
```

**Response Structure**:
```typescript
{
  success: true,
  data: {
    // Stats Cards (permission-based)
    stats: {
      totalTasks: number,
      completedTasks: number,
      overdueTasks: number,
      thisWeekTasks: number
    },

    // Widgets
    overdueTasks: Task[],          // งานเกินกำหนด
    pinnedTasks: Task[],            // งานที่ pin ไว้
    myTasks: {                      // งานของฉัน
      tasks: Task[],
      total: number,
      hasMore: boolean
    },
    recentActivities: History[],    // ความเคลื่อนไหวของทีม
    calendarTasks: Task[],          // งานที่มี due date ของฉัน
    myChecklists: {                 // checklist ของฉัน
      taskId: string,
      taskName: string,
      items: Checklist[]
    }[]
  }
}
```

### React Query Hook

**File**: `src/hooks/use-dashboard.ts`

```typescript
export function useDashboard(options?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ["dashboard", options],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options?.limit) params.append("limit", options.limit.toString());
      if (options?.offset) params.append("offset", options.offset.toString());

      const response = await api.get(`/api/dashboard?${params}`);
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
```

---

## 📦 Implementation Phases

### **Phase 1: Foundation (API & Hook)** - 2 tasks ✅
- [x] 1.1: สร้าง API endpoint `GET /api/dashboard` ✅
- [x] 1.2: สร้าง hook `useDashboard` และ TypeScript types ✅

### **Phase 2: Stats Cards Widget** - 2 tasks ✅
- [x] 2.1: Design + Approve - Stats Cards component ✅
- [x] 2.2: Implement + Test in browser ✅

**Result**: Stats Cards แสดงผล 4 cards พร้อม animated numbers, loading skeleton, และ dark mode support

### **Phase 3: Overdue Tasks Alert** - 2 tasks
- [ ] 3.1: Design + Approve - Overdue Tasks Alert (conditional rendering)
- [ ] 3.2: Implement + Test in browser

### **Phase 4: Pinned Tasks Widget** - 2 tasks
- [ ] 4.1: Design + Approve - Pinned Tasks Widget
- [ ] 4.2: Implement + Test in browser

### **Phase 5: My Tasks Widget** - 2 tasks
- [ ] 5.1: Design + Approve - My Tasks Widget (with Load More)
- [ ] 5.2: Implement + Test in browser

### **Phase 6: Dashboard Calendar** - 2 tasks
- [ ] 6.1: Design + Approve - Calendar Widget
- [ ] 6.2: Implement + Test in browser

### **Phase 7: Recent Activities** - 2 tasks
- [ ] 7.1: Design + Approve - Recent Activities Widget
- [ ] 7.2: Implement + Test in browser

### **Phase 8: My Checklist Widget** - 2 tasks
- [ ] 8.1: Design + Approve - My Checklist Widget
- [ ] 8.2: Implement + Test in browser

### **Phase 9: Integration** - 1 task
- [ ] 9.1: Update Dashboard Page
  - รวม widgets ทั้งหมด
  - Loading skeletons
  - Empty states
  - Refresh button
  - CreateTaskModal integration

### **Phase 10: Documentation** - 1 task
- [ ] 10.1: สร้างเอกสาร `DASHBOARD_IMPLEMENTATION_COMPLETE.md`

**Total**: 18 tasks across 10 phases

---

## 📂 Files to Create/Modify

### New Files
```
src/
├── app/api/dashboard/
│   └── route.ts                           # API endpoint
├── components/dashboard/
│   ├── dashboard-stats-cards.tsx          # Stats Cards (4 cards)
│   ├── overdue-tasks-alert.tsx            # Overdue Alert
│   ├── pinned-tasks-widget.tsx            # Pinned Tasks
│   ├── my-tasks-widget.tsx                # My Tasks (with pagination)
│   ├── dashboard-calendar.tsx             # Calendar
│   ├── recent-activities-widget.tsx       # Activities
│   └── my-checklist-widget.tsx            # Checklists
├── hooks/
│   └── use-dashboard.ts                   # React Query hook
└── types/
    └── dashboard.ts                       # TypeScript types
```

### Modified Files
```
src/
├── app/(dashboard)/dashboard/page.tsx     # Main Dashboard page
└── stores/use-ui-store.ts                 # Add task panel control (if needed)
```

---

## 🎨 Component Structure

### Layout Grid
```
┌─────────────────────────────────────────────────────────┐
│  Header: "แดชบอร์ดของฉัน" + [รีเฟรช] [สร้างงานใหม่]   │
├─────────────────────────────────────────────────────────┤
│  Stats Cards (4 columns - equal width)                  │
│  [งานทั้งหมด] [เสร็จแล้ว] [เกินกำหนด] [สัปดาห์นี้]    │
├─────────────────────────────────────────────────────────┤
│  Left Column (2/3)          │  Right Column (1/3)       │
│  ┌──────────────────────┐   │  ┌───────────────────┐   │
│  │ Overdue Alert        │   │  │ Calendar          │   │
│  │ (conditional)        │   │  │                   │   │
│  └──────────────────────┘   │  └───────────────────┘   │
│  ┌──────────────────────┐   │  ┌───────────────────┐   │
│  │ Pinned Tasks         │   │  │ Recent Activities │   │
│  │                      │   │  │                   │   │
│  └──────────────────────┘   │  └───────────────────┘   │
│  ┌──────────────────────┐   │  ┌───────────────────┐   │
│  │ My Tasks (10 items)  │   │  │ My Checklist      │   │
│  │ [แสดงเพิ่ม]          │   │  │                   │   │
│  └──────────────────────┘   │  └───────────────────┘   │
└─────────────────────────────┴──────────────────────────┘
```

---

## 🔒 Permission Logic

### Stats Calculation

```typescript
// ADMIN/CHIEF: All tasks in system/mission group
const scope = await getUserAccessibleScope(userId);

// LEADER: Tasks in divisions they manage
const tasks = await prisma.task.findMany({
  where: {
    project: {
      department: {
        divisionId: { in: scope.divisionIds }
      }
    }
  }
});

// HEAD: Tasks in their department
const tasks = await prisma.task.findMany({
  where: {
    project: {
      departmentId: user.departmentId
    }
  }
});

// MEMBER/USER: Only their assigned tasks
const tasks = await prisma.task.findMany({
  where: {
    assignees: {
      some: { userId }
    }
  }
});
```

---

## ⏱️ Estimated Timeline

| Phase | Task | Time | Total |
|-------|------|------|-------|
| 1 | API + Hook | 2h | 2h |
| 2 | Stats Cards | 1.5h | 1.5h |
| 3 | Overdue Alert | 1h | 1h |
| 4 | Pinned Tasks | 1h | 1h |
| 5 | My Tasks | 2h | 2h |
| 6 | Calendar | 2h | 2h |
| 7 | Recent Activities | 1.5h | 1.5h |
| 8 | My Checklist | 1.5h | 1.5h |
| 9 | Integration | 1.5h | 1.5h |
| 10 | Documentation | 1h | 1h |
| **Total** | | | **15h** |

**Estimated**: 15 hours (2-3 days with testing)

---

## 🧪 Testing Checklist

### Functional Testing
- [ ] Stats cards แสดงตัวเลขถูกต้องตาม role
- [ ] Overdue alert ปรากฏเฉพาะเมื่อมีงานเกินกำหนด
- [ ] Pinned tasks แสดงงานที่ pin ไว้
- [ ] My Tasks pagination ทำงาน (Load More)
- [ ] Calendar แสดง tasks ที่มี due date
- [ ] คลิกวันใน calendar แสดง tasks ของวันนั้น
- [ ] Recent activities แสดง activities ของทีม
- [ ] My Checklist toggle ทำงาน (optimistic update)
- [ ] คลิก task เปิด Task Panel
- [ ] Refresh button โหลดข้อมูลใหม่
- [ ] CreateTaskModal แสดงทุกโปรเจคที่มีสิทธิ์

### Role-Based Testing
- [ ] ADMIN: เห็นภาพรวมทั้งระบบ
- [ ] CHIEF: เห็นภาพรวม mission group
- [ ] LEADER: เห็นภาพรวม division
- [ ] HEAD: เห็นภาพรวม department
- [ ] MEMBER/USER: เห็นเฉพาะงานตัวเอง

### UI/UX Testing
- [ ] Loading skeleton แสดงขณะโหลด
- [ ] Empty state แสดงเมื่อไม่มีข้อมูล
- [ ] Dark mode ทำงานถูกต้อง
- [ ] Responsive layout (mobile/tablet/desktop)

---

## 📝 Notes

- ใช้ **optimistic updates** สำหรับ checklist toggle
- ใช้ **React Query** stale time 2 minutes
- **Pagination** สำหรับ My Tasks เท่านั้น
- **Task Panel** ใช้ existing component จาก `useUIStore`
- **Permission system** ใช้ `getUserAccessibleScope()` จาก `src/lib/permissions.ts`

---

**End of DASHBOARD_IMPLEMENTATION_PLAN.md**
