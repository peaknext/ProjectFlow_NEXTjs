# แผนงาน: Phase 2.2 - Calendar View

**เป้าหมาย**: สร้าง Calendar View แบบ FullCalendar พร้อม drag-and-drop สำหรับเปลี่ยนวันครบกำหนด

---

## 📋 Overview

### สิ่งที่ต้องทำ
1. ติดตั้ง FullCalendar dependencies
2. สร้าง Calendar component ด้วย FullCalendar
3. แสดงงานตาม priority (ส ี่แตกต่างกันสำหรับ light/dark mode)
4. รองรับ drag-and-drop เพื่อเปลี่ยน due date
5. คลิกงานเพื่อเปิด Task Panel
6. แสดง pin indicator บนงานที่ปักหมุด
7. ซ่อนงานที่ปิดแล้ว (isClosed = true)
8. สร้าง Calendar page route

---

## 🎨 Design Requirements (from GAS)

### Calendar Configuration
```javascript
{
  initialView: 'dayGridMonth',
  locale: 'th',
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay'
  },
  editable: true,
  height: '100%'
}
```

### Event Colors (Priority-based)

#### Light Mode
```typescript
CALENDAR_PRIORITY_COLORS = {
  1: '#FFCDD2', // Very Light Red - Urgent
  2: '#FFE0B2', // Very Light Orange - High
  3: '#BBDEFB', // Very Light Blue - Normal
  4: '#C8E6C9', // Very Light Green - Low
}
textColor: '#424242' // Default dark text
```

#### Dark Mode
```typescript
CALENDAR_PRIORITY_COLORS_DARK = {
  1: '#562424', // Dark Red
  2: '#512e20', // Dark Orange
  3: '#283262', // Dark Blue
  4: '#193928', // Dark Green
}

CALENDAR_TEXT_COLORS_DARK = {
  1: '#fecaca', // Light Red
  2: '#fed7aa', // Light Orange
  3: '#bfdbfe', // Light Blue
  4: '#bbf7d0', // Light Green
}
```

### Skeleton States
```typescript
// Creating/Closing tasks
{
  backgroundColor: '#e5e7eb',
  borderColor: '#e5e7eb',
  textColor: '#6b7280',
  editable: false,
  title: task.isClosing
    ? (task.closeType === 'Completed' ? 'กำลังปิดงาน...' : 'กำลังยกเลิกงาน...')
    : task.name
}
```

---

## 📦 Dependencies

### FullCalendar Packages
```bash
npm install @fullcalendar/react @fullcalendar/core @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction
```

### Localization
- FullCalendar มี built-in Thai locale
- หรือใช้ `date-fns` locale ที่ติดตั้งไว้แล้ว

---

## 🏗️ Component Structure

### 1. Calendar View Component
**File**: `src/components/views/calendar-view/index.tsx`

**Responsibilities**:
- Initialize FullCalendar instance
- Transform tasks to calendar events
- Handle event click → open task panel
- Handle event drop → update due date
- Apply colors based on priority and theme
- Show pin indicators
- Filter out closed tasks

**Props**:
```typescript
interface CalendarViewProps {
  projectId: string;
}
```

**Key Features**:
- ✅ Event rendering with priority colors
- ✅ Drag and drop to change due date
- ✅ Dark mode support
- ✅ Pin indicators
- ✅ Click to open task panel
- ✅ Loading/skeleton states
- ✅ Optimistic updates

### 2. Calendar Page
**File**: `src/app/(dashboard)/projects/[projectId]/calendar/page.tsx`

**Responsibilities**:
- Use ProjectToolbar (reuse from board)
- Render CalendarView component
- Handle view switching
- Manage project state

---

## 🔧 Technical Implementation

### Event Transformation
```typescript
const transformTaskToEvent = (task: Task, isDarkMode: boolean) => {
  // Skip closed tasks
  if (task.isClosed) return null;

  // Skip tasks without due date (unless creating/closing)
  if (!task.isCreating && !task.isClosing && !task.dueDate) {
    return null;
  }

  const priorityId = String(task.priority || 3);

  // Skeleton state for creating/closing
  if (task.isCreating || task.isClosing) {
    return {
      id: task.id,
      title: task.isClosing
        ? (task.closeType === 'COMPLETED' ? 'กำลังปิดงาน...' : 'กำลังยกเลิกงาน...')
        : task.name,
      start: task.startDate || task.dueDate,
      end: task.dueDate,
      backgroundColor: '#e5e7eb',
      borderColor: '#e5e7eb',
      textColor: '#6b7280',
      editable: false,
      extendedProps: { projectId: task.projectId }
    };
  }

  // Normal event with priority colors
  const eventColor = isDarkMode
    ? CALENDAR_PRIORITY_COLORS_DARK[priorityId]
    : CALENDAR_PRIORITY_COLORS[priorityId];

  const textColor = isDarkMode
    ? CALENDAR_TEXT_COLORS_DARK[priorityId]
    : '#424242';

  return {
    id: task.id,
    title: task.name,
    start: task.startDate || task.dueDate,
    end: task.dueDate,
    backgroundColor: eventColor,
    borderColor: eventColor,
    textColor: textColor,
    extendedProps: {
      projectId: task.projectId,
      isPinned: task.isPinned
    }
  };
};
```

### Drag and Drop Handler
```typescript
const handleEventDrop = (info: EventDropInfo) => {
  const taskId = info.event.id;
  const newDueDate = info.event.end?.toISOString() || info.event.start.toISOString();

  // Find task
  const task = tasks.find(t => t.id === taskId);
  if (!task) {
    info.revert();
    return;
  }

  // Check if closed
  if (task.isClosed) {
    info.revert();
    toast.error('งานนี้ถูกปิดแล้ว ไม่สามารถแก้ไขได้');
    return;
  }

  // Check if actually changed
  if (newDueDate === task.dueDate) {
    return;
  }

  // Optimistic update
  updateTaskMutation.mutate(
    { taskId, data: { dueDate: newDueDate } },
    {
      onError: () => {
        info.revert();
      }
    }
  );
};
```

### Pin Indicator
```typescript
const handleEventDidMount = (info: EventMountArg) => {
  const isPinned = info.event.extendedProps.isPinned;

  if (isPinned) {
    const pinIcon = document.createElement('span');
    pinIcon.className = 'material-symbols-outlined';
    pinIcon.style.fontSize = '12px';
    pinIcon.style.marginRight = '2px';
    pinIcon.textContent = 'keep';
    pinIcon.title = 'ปักหมุดแล้ว';

    const titleEl = info.el.querySelector('.fc-event-title');
    if (titleEl) {
      titleEl.insertBefore(pinIcon, titleEl.firstChild);
    }
  }
};
```

---

## 📁 File Structure

```
src/
├── app/(dashboard)/projects/[projectId]/
│   └── calendar/
│       └── page.tsx (Calendar page with toolbar)
├── components/views/
│   └── calendar-view/
│       └── index.tsx (FullCalendar component)
├── lib/
│   └── calendar-colors.ts (Priority color constants)
└── hooks/
    └── use-tasks.ts (Already has updateTask mutation)
```

---

## ✅ Step-by-Step Implementation

### Step 1: Install Dependencies
```bash
npm install @fullcalendar/react @fullcalendar/core @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction
```

### Step 2: Create Color Constants
**File**: `src/lib/calendar-colors.ts`
- Export priority color maps for light/dark modes
- Export helper function to get color by priority

### Step 3: Create CalendarView Component
**File**: `src/components/views/calendar-view/index.tsx`
- Setup FullCalendar with Thai locale
- Transform tasks to events
- Implement drag-and-drop handler
- Implement event click handler
- Add pin indicators
- Handle skeleton states

### Step 4: Create Calendar Page
**File**: `src/app/(dashboard)/projects/[projectId]/calendar/page.tsx`
- Reuse ProjectToolbar
- Integrate CalendarView
- Handle view state

### Step 5: Update ProjectToolbar Integration
- Ensure calendar button routes to correct path
- Update breadcrumb to work with calendar view

---

## 🎯 Testing Checklist

### Display
- [ ] Calendar renders correctly
- [ ] Thai locale works
- [ ] Shows only non-closed tasks
- [ ] Tasks without due date are hidden
- [ ] Priority colors match specification

### Interaction
- [ ] Drag task to new date updates due date
- [ ] Click task opens task panel
- [ ] Toolbar navigation works
- [ ] View switcher highlights calendar view

### Dark Mode
- [ ] Dark mode colors apply correctly
- [ ] Text contrast is readable
- [ ] Theme switching works

### Edge Cases
- [ ] Closed tasks don't show
- [ ] Creating tasks show skeleton
- [ ] Closing tasks show skeleton
- [ ] Pinned tasks show pin icon
- [ ] Drag is prevented for closed tasks

---

## 🚀 Expected Output

### URL
```
http://localhost:3010/projects/proj001/calendar
```

### UI Features
- ✅ FullCalendar with Thai language
- ✅ Month/Week/Day view toggle
- ✅ Today/Prev/Next navigation
- ✅ Color-coded events by priority
- ✅ Pin indicators on pinned tasks
- ✅ Drag-and-drop to change date
- ✅ Click to open task details
- ✅ Dark mode support
- ✅ Project toolbar with breadcrumb

---

## 📝 Notes

### FullCalendar License
- Using @fullcalendar packages (MIT license for basic features)
- Interaction plugin for drag-and-drop

### Performance
- Use React Query cache for tasks
- FullCalendar handles its own rendering optimization
- Only re-render calendar when tasks change

### Accessibility
- FullCalendar has built-in ARIA support
- Keyboard navigation works out of the box

---

## 🎓 Key Differences from Board View

| Feature | Board View | Calendar View |
|---------|-----------|---------------|
| Main Library | @hello-pangea/dnd | FullCalendar |
| Data Filter | Filter by status | Filter by date + priority |
| Colors | Status-based | Priority-based |
| Drag Target | Status column | Calendar date |
| Update Field | `statusId` | `dueDate` |
| Show Closed | Optional | Always hide |

---

## ⏱️ Estimated Time
- **Setup & Dependencies**: 15 min
- **Color Constants**: 10 min
- **CalendarView Component**: 60 min
- **Calendar Page**: 20 min
- **Testing & Refinement**: 30 min
- **Total**: ~2-2.5 hours

---

## 🔗 Dependencies on Previous Work
- ✅ ProjectToolbar (reuse)
- ✅ CreateTaskButton (reuse)
- ✅ use-tasks hook (reuse updateTask mutation)
- ✅ use-projects hook (reuse for data fetching)
- ✅ useUIStore (reuse for task panel)
- ✅ Task type definitions

---

**พร้อมเริ่มทำได้เลย!** 🚀
