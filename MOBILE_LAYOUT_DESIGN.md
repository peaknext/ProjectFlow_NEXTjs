# Mobile Layout Design - ProjectFlows

**Version**: 1.1.0
**Date**: 2025-10-29
**Last Update**: Additional Features (Calendar, Swipe, Navigation, Animations, Build Fix)
**Approach**: Hybrid (Separate Layout, Shared Components)
**Target**: < 768px (Mobile devices)
**Inspiration**: Facebook, ClickUp mobile patterns

---

## 📋 Table of Contents

1. [Design Goals](#design-goals)
2. [User Personas & Use Cases](#user-personas--use-cases)
3. [Mobile UI Architecture](#mobile-ui-architecture)
4. [Component Breakdown](#component-breakdown)
5. [Wireframes](#wireframes)
6. [Implementation Roadmap](#implementation-roadmap)
7. [Technical Specifications](#technical-specifications)

---

## 🎯 Design Goals

### Primary Goals
1. **Speed First** - Fast load, smooth animations, optimized bundle size
2. **User-Centric** - Focus on individual user's tasks and notifications
3. **Familiar UX** - Facebook-like bottom nav + hamburger menu pattern
4. **Full Feature Parity** - All desktop features accessible on mobile (ไม่ซ่อน features)

### Performance Targets
- Initial Load: < 2 seconds on 3G
- Bottom Nav Switch: < 100ms
- Task Panel Open: < 200ms with smooth animation
- Pull-to-Refresh: < 500ms response time

---

## 👥 User Personas & Use Cases

### Primary Users (80% of mobile usage)

**1. MEMBER/USER (ผู้ปฏิบัติงาน)**
- **Daily Tasks**: เช็คงานของตัวเอง, update status, add comments, check checklists
- **Pain Points**: ต้องเข้าถึงงานเร็ว, ต้องการ notification ทันที
- **Mobile Behavior**: เปิดบ่อย ๆ ตลอดวัน, session สั้น (1-3 นาที/ครั้ง)

**2. HEAD/LEADER (หัวหน้าทีม)**
- **Daily Tasks**: ติดตามความคืบหน้าทีม, approve/assign tasks, ดู dashboard
- **Pain Points**: ต้องเห็น big picture, ต้องการตอบกลับงานเร็ว
- **Mobile Behavior**: เช็ค overview หลายครั้งต่อวัน

### Use Cases Priority (High → Low)

| Priority | Use Case | Frequency | Component |
|----------|----------|-----------|-----------|
| 🔴 Critical | เช็ค notifications → เปิด Task Panel | สูงมาก | Bottom Nav → Task Panel |
| 🔴 Critical | ดู/Update งานของตัวเอง (My Tasks) | สูงมาก | My Tasks Page |
| 🟡 High | Add comment/checklist ใน Task | สูง | Task Panel (Full-screen) |
| 🟡 High | สร้าง Task ด่วน | ปานกลาง | Create Task Modal (Full-screen) |
| 🟢 Medium | ดู Dashboard | ปานกลาง | Dashboard Page |
| 🟢 Medium | สร้างโปรเจกต์ (HEAD+) | ต่ำ | Create Project Modal |
| 🟢 Medium | เลือก Workspace/Project | ต่ำ | Hamburger Menu |

---

## 🏗️ Mobile UI Architecture

### Hybrid Strategy

```
┌─────────────────────────────────────────┐
│         SEPARATE COMPONENTS             │
├─────────────────────────────────────────┤
│ • MobileLayout (< 768px)                │
│ • BottomNavigation (5 tabs)             │
│ • MobileTopBar (back, title, actions)   │
│ • MobileMenu (hamburger, workspace)     │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│      SHARED COMPONENTS + RESPONSIVE     │
├─────────────────────────────────────────┤
│ • TaskPanel → Full-screen on mobile     │
│ • Modals → Full-screen on mobile        │
│ • Views (Board/List/Calendar) → Adapt   │
│ • UI Components → Responsive classes    │
│ • Business Logic (hooks) → Same         │
└─────────────────────────────────────────┘
```

### File Structure

```
src/
├── app/
│   └── (dashboard)/
│       └── layout.tsx              # ✨ NEW: Responsive wrapper
│
├── components/
│   ├── layout/
│   │   ├── desktop-layout.tsx     # 🔄 REFACTOR: Existing code
│   │   ├── mobile-layout.tsx      # ✨ NEW: Mobile layout
│   │   ├── mobile-top-bar.tsx     # ✨ NEW: Mobile header
│   │   ├── bottom-navigation.tsx  # ✨ NEW: 5-tab bottom nav
│   │   └── mobile-menu.tsx        # ✨ NEW: Hamburger menu
│   │
│   ├── task-panel/
│   │   └── index.tsx              # 🔄 UPDATE: Add mobile styles
│   │
│   ├── modals/
│   │   ├── create-task-modal.tsx  # 🔄 UPDATE: Full-screen mobile
│   │   └── ...                    # 🔄 UPDATE: All modals
│   │
│   └── views/
│       ├── board-view/            # 🔄 UPDATE: Touch gestures
│       ├── list-view/             # 🔄 UPDATE: Mobile layout
│       └── calendar-view/         # 🔄 UPDATE: Mobile calendar
│
└── hooks/
    └── use-media-query.ts         # ✨ NEW: Breakpoint detection
```

---

## 📦 Component Breakdown

### 1. Mobile Layout (`mobile-layout.tsx`)

**Purpose**: Main layout wrapper for mobile devices

**Structure**:
```tsx
<div className="flex flex-col h-screen">
  {/* Top Bar */}
  <MobileTopBar />

  {/* Main Content - Scrollable */}
  <main className="flex-1 overflow-y-auto pb-16">
    {children}
  </main>

  {/* Bottom Navigation - Fixed */}
  <BottomNavigation />

  {/* Global Modals */}
  <TaskPanel />
  <CreateTaskModal />
  {/* ... other modals */}
</div>
```

**Key Features**:
- Fixed bottom nav (64px height)
- Content padding-bottom to prevent overlap
- Pull-to-refresh support
- No sidebar

---

### 2. Bottom Navigation (`bottom-navigation.tsx`)

**5 Tabs - User-Centric**:

```
┌─────────────────────────────────────────────────────────┐
│ [🏠]     [📋]      [➕]      [🔔]     [☰]              │
│ หน้าหลัก  งานของฉัน  สร้าง   แจ้งเตือน  เมนู              │
└─────────────────────────────────────────────────────────┘
```

**Tab Details**:

| Icon | Label | Route | Description |
|------|-------|-------|-------------|
| 🏠 Home | หน้าหลัก | `/dashboard` | Dashboard widgets (stats, overdue, pinned, my tasks) |
| 📋 Tasks | งานของฉัน | `/my-tasks` | **NEW PAGE**: Personal task list (created by me + assigned to me) |
| ➕ Create | สร้าง | *modal* | Opens Create Task Modal (or action sheet with options) |
| 🔔 Notifications | แจ้งเตือน | `/notifications` | **NEW PAGE**: Notification center |
| ☰ Menu | เมนู | *drawer* | Hamburger menu (Workspace, Projects, Reports, Users, Settings) |

**Active State**:
- Primary color fill on icon
- Primary color text
- Bottom border indicator (2px)

**Specs**:
- Height: 64px
- Icon size: 24px
- Tap target: 48x48px (minimum)
- Position: fixed bottom-0
- Background: bg-card with border-top

---

### 3. Mobile Top Bar (`mobile-top-bar.tsx`)

**Dynamic based on route**:

```
┌─────────────────────────────────────────┐
│ [←]  Page Title              [⋮] [?]   │
└─────────────────────────────────────────┘
```

**Components**:
- **Left**: Back button (when applicable) or Hamburger menu icon
- **Center**: Page title (truncate)
- **Right**: Context actions (search, filter, info)

**Specs**:
- Height: 56px
- Sticky top-0
- z-index: 40
- Background: bg-card with border-bottom

**Route-based behavior**:

| Route | Left | Center | Right |
|-------|------|--------|-------|
| `/dashboard` | ☰ Menu | ProjectFlows | 🔍 Search |
| `/my-tasks` | ☰ Menu | งานของฉัน | 🔍 Filter |
| `/projects/[id]/board` | ← Back | [Project Name] | ⋮ Actions |
| Task Panel | ← Back | [Task Name] | ⋮ Actions |

---

### 4. Mobile Menu (`mobile-menu.tsx`)

**Drawer from left** (Sheet component):

```
┌────────────────────────────┐
│ ☰  MENU                    │
├────────────────────────────┤
│ 👤 [User Avatar]           │
│    John Doe                │
│    LEADER                  │
├────────────────────────────┤
│ 🏢 WORKSPACE               │
│   ▼ [Current Project]      │
│   ─────────────────        │
│   • Project A              │
│   • Project B              │
│   • Project C              │
│   + สร้างโปรเจกต์ใหม่        │
├────────────────────────────┤
│ 📊 รายงาน                   │
│ 👥 บุคลากร                  │
│ ⚙️  ตั้งค่า                 │
│ 🌙 Dark Mode [switch]      │
│ 🚪 ออกจากระบบ               │
└────────────────────────────┘
```

**Features**:
- Workspace/Project selector (collapsible tree)
- Quick access to Reports, Users
- Profile & Settings
- Dark mode toggle
- Logout

**Specs**:
- Width: 280px (80% max-width on small devices)
- Slide from left
- Overlay backdrop
- Swipe to close

---

### 5. Task Panel (Mobile Adaptation)

**Desktop**: 600px slide-in panel from right
**Mobile**: Full-screen modal with header

```
┌─────────────────────────────┐
│ [←] Task Name            [⋮] │ ← Header (fixed)
├─────────────────────────────┤
│                             │
│  [Details Tab] [History]    │ ← Tabs (sticky)
│                             │
├─────────────────────────────┤
│                             │
│  Task content...            │ ← Scrollable content
│                             │
│                             │
│                             │
├─────────────────────────────┤
│ [Cancel] [Save Changes]     │ ← Footer (fixed)
└─────────────────────────────┘
```

**Changes for Mobile**:
- `className`: Add `w-screen h-screen` when `< 768px`
- Header: Add back button (← arrow)
- Tabs: Make sticky with `sticky top-0`
- Footer: Keep fixed at bottom
- Close: Swipe down gesture (optional nice-to-have)

---

### 6. Modals (Mobile Adaptation)

**All modals full-screen on mobile**:

- CreateTaskModal
- CreateProjectModal
- CreateUserModal
- EditProjectModal
- EditUserModal

**Pattern**:
```tsx
<Dialog open={isOpen} onOpenChange={onClose}>
  <DialogContent
    className={cn(
      // Desktop: modal size
      "md:max-w-2xl",
      // Mobile: full screen
      "max-md:w-screen max-md:h-screen max-md:max-w-none max-md:rounded-none"
    )}
  >
    {/* Mobile: Add top bar */}
    <div className="md:hidden flex items-center border-b pb-3 mb-4">
      <Button variant="ghost" onClick={onClose}>
        ← Back
      </Button>
      <h2 className="flex-1 text-center font-semibold">Create Task</h2>
      <div className="w-10" /> {/* Spacer */}
    </div>

    {/* Content */}
  </DialogContent>
</Dialog>
```

---

## 🎨 Wireframes

### Home Screen (Dashboard)

```
┌─────────────────────────────────────────┐
│ ☰  ProjectFlows              🔍         │
├─────────────────────────────────────────┤
│                                         │
│  📊 STATS                               │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐  │
│  │ 145  │ │  32  │ │  89  │ │  24  │  │
│  │ Tasks│ │Active│ │Done  │ │Late  │  │
│  └──────┘ └──────┘ └──────┘ └──────┘  │
│                                         │
│  🚨 OVERDUE TASKS (3)                   │
│  ┌─────────────────────────────────┐   │
│  │ ⚠️  Setup server environment    │   │
│  │     Due: 2 days ago             │   │
│  └─────────────────────────────────┘   │
│                                         │
│  📌 PINNED TASKS (2)          [Expand] │
│  ┌─────────────────────────────────┐   │
│  │ ⭐ Design mobile mockups        │   │
│  │ ⭐ Review code PR #123          │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ✅ MY TASKS (12)                       │
│  [All] [Todo] [In Progress] [Review]   │
│  ┌─────────────────────────────────┐   │
│  │ □ Implement login API           │   │
│  │   Project A · High               │   │
│  ├─────────────────────────────────┤   │
│  │ □ Fix navigation bug            │   │
│  │   Project B · Normal             │   │
│  └─────────────────────────────────┘   │
│                                         │
├─────────────────────────────────────────┤
│ [🏠]   [📋]    [➕]    [🔔]    [☰]     │
│ หน้าหลัก งานของฉัน สร้าง แจ้งเตือน เมนู  │
└─────────────────────────────────────────┘
```

### My Tasks Screen (NEW)

```
┌─────────────────────────────────────────┐
│ ☰  งานของฉัน              🔍 Filter     │
├─────────────────────────────────────────┤
│                                         │
│  [งานที่สร้าง (8)] [งานที่ได้รับ (12)] │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ □ HIGH · Implement mobile UI    │   │
│  │   📁 Project Alpha              │   │
│  │   👤 Assigned to: 3 people      │   │
│  │   📅 Due: Oct 30                │   │
│  ├─────────────────────────────────┤   │
│  │ □ NORMAL · Review documentation │   │
│  │   📁 Project Beta               │   │
│  │   👤 Assigned to: Me            │   │
│  │   📅 Due: Nov 2                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [Pull to refresh...]                   │
│                                         │
├─────────────────────────────────────────┤
│ [🏠]   [📋]    [➕]    [🔔]    [☰]     │
└─────────────────────────────────────────┘
       ▲ Active
```

### Task Panel (Full-screen)

```
┌─────────────────────────────────────────┐
│ [←]  Setup Development Env         [⋮]  │
├─────────────────────────────────────────┤
│ [Details]  [History]                    │
├─────────────────────────────────────────┤
│                                         │
│  Status:  [🟢 In Progress ▼]           │
│  Priority: [🔴 High ▼]                 │
│  Assignee: [👤 3 people ▼]             │
│                                         │
│  Description:                           │
│  ┌─────────────────────────────────┐   │
│  │ Setup Node.js environment...    │   │
│  └─────────────────────────────────┘   │
│                                         │
│  📅 Dates                               │
│  Start: Oct 25 | Due: Oct 30            │
│                                         │
│  ✅ Checklist (2/5)                     │
│  [✓] Install Node.js                    │
│  [✓] Install dependencies               │
│  [ ] Setup database                     │
│  [ ] Configure environment              │
│  [ ] Test API endpoints                 │
│                                         │
│  💬 Comments (3)                        │
│  ─────────────────                      │
│  [Type a comment...]           [Send]   │
│                                         │
├─────────────────────────────────────────┤
│              [Save Changes]             │
└─────────────────────────────────────────┘
```

### Create Task (Full-screen Modal)

```
┌─────────────────────────────────────────┐
│ [Cancel]     Create Task        [Save]  │
├─────────────────────────────────────────┤
│                                         │
│  Task Name *                            │
│  ┌─────────────────────────────────┐   │
│  │ Enter task name...              │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Project *                              │
│  [📁 Select Project ▼]                  │
│                                         │
│  Description                            │
│  ┌─────────────────────────────────┐   │
│  │ Enter description...            │   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Status                                 │
│  [━━━━━○━━━━] In Progress               │
│                                         │
│  Priority / Difficulty                  │
│  [🔴 High ▼]  [⭐⭐⭐ Medium ▼]         │
│                                         │
│  Assignee                               │
│  [👤 Select people ▼]                   │
│                                         │
│  📅 Dates                               │
│  [Start: Oct 25 ▼] [Due: Oct 30 ▼]     │
│                                         │
│  Parent Task (Optional)                 │
│  [🔗 Link to parent... ▼]              │
│                                         │
├─────────────────────────────────────────┤
│              [Create Task]              │
└─────────────────────────────────────────┘
```

### Hamburger Menu

```
┌─────────────────────────────┐
│ ☰  MENU                     │
├─────────────────────────────┤
│                             │
│ ┌─────────────────────────┐ │
│ │ 👤 [Avatar]             │ │
│ │    John Doe             │ │
│ │    LEADER               │ │
│ │    กลุ่มงานทดสอบ         │ │
│ └─────────────────────────┘ │
│                             │
│ ─────────────────────────── │
│                             │
│ 🏢 WORKSPACE                │
│   ▼ โปรเจกต์ปัจจุบัน          │
│   ─────────────────         │
│   📁 Project Alpha          │
│   📁 Project Beta           │
│   📁 Project Gamma          │
│   ─────────────────         │
│   + สร้างโปรเจกต์ใหม่         │
│                             │
│ ─────────────────────────── │
│                             │
│ 📊 รายงาน                    │
│ 👥 บุคลากร (LEADER+)        │
│ ⚙️  ตั้งค่าโปรไฟล์           │
│                             │
│ 🌙 Dark Mode    [toggle]    │
│                             │
│ ─────────────────────────── │
│                             │
│ 🚪 ออกจากระบบ                │
│                             │
└─────────────────────────────┘
```

---

## 🚀 Implementation Roadmap

**Total Phases**: 8 (originally 11, merged Phases 4-6 into Phase 2)
**Completed**: 5 / 8 phases (62.5%) + Additional features
**Estimated Time**: 14-22 hours (10-14 hours completed, 4-8 hours remaining)
**Additional Features**: 6 mobile enhancements completed (2025-10-29)

### Phase 1: Foundation (2-3 hours) ✅ **COMPLETE**

**Status**: ✅ Complete (2025-10-28)
**Commit**: `bd21b24`

**Goal**: Setup responsive infrastructure

**Tasks**:
1. ✅ Create `use-media-query.ts` hook (163 lines)
2. ✅ Create `mobile-layout.tsx` skeleton (67 lines)
3. ✅ Create `desktop-layout.tsx` (refactor existing) (61 lines)
4. ✅ Create `bottom-navigation.tsx` basic version (202 lines)
5. ✅ Create `mobile-top-bar.tsx` basic version (94 lines)
6. ✅ Update `(dashboard)/layout.tsx` with responsive wrapper (39 lines)
7. ✅ Test breakpoint switching
8. ✅ Type-check passed (0 errors)

**Deliverable**: ✅ Layout switches between desktop/mobile at 768px

**What Works**:
- Responsive layout switching at 768px breakpoint
- Bottom navigation with Home tab working
- Create button opens CreateTaskModal
- Notifications badge showing unread count
- Mobile top bar with back button logic
- Touch-friendly tap targets (48x48px)

**What's Disabled** (to be completed in Phase 2-11):
- My Tasks tab (needs page creation)
- Notifications tab (needs page creation)
- Hamburger menu (needs drawer implementation)

---

### Phase 2: Bottom Navigation Features (1-2 hours) ✅ **COMPLETE**

**Status**: ✅ Complete (2025-10-28)
**Commit**: `e7070ab`

**Goal**: Enable all bottom nav tabs + implement hamburger menu

**Tasks**:
1. ✅ Create `/my-tasks` page (201 lines) - Personal task management with 2 tabs:
   - "งานที่ได้รับ" (Assigned to Me) - tasks user is assigned to
   - "งานที่สร้าง" (Created by Me) - tasks user created
   - Touch-friendly cards with click to open task panel
   - Shows project name, priority badge, due date, assignee avatars
2. ✅ Create `/notifications` page (199 lines) - Dedicated notifications center:
   - 2 tabs: "ทั้งหมด" (All) and "ยังไม่ได้อ่าน" (Unread)
   - Badge counts for each tab
   - Mark all as read button
   - Click notification to open task panel
3. ✅ Implement `mobile-menu.tsx` hamburger drawer (280 lines):
   - User profile section (avatar, name, role, department)
   - Workspace selector (collapsible project tree)
   - Navigation links (Reports, Users, Settings)
   - Dark mode toggle with switch
   - Logout button
4. ✅ Enable My Tasks tab in bottom-navigation.tsx
5. ✅ Enable Notifications tab in bottom-navigation.tsx
6. ✅ Integrate mobile menu in both bottom nav and top bar
7. ✅ Fix all TypeScript type errors (4 errors → 0 errors)

**Deliverable**: ✅ Fully functional bottom nav with all 5 tabs working

**What Works**:
- All 5 tabs in bottom navigation working
- My Tasks page displays user's created and assigned tasks
- Notifications page shows all notifications with filter tabs
- Hamburger menu opens from Menu tab or top bar icon
- Workspace selector with collapsible project list
- Dark mode toggle in hamburger menu
- Navigation links with permission-based visibility
- Touch-friendly interactions throughout

---

### Phase 3: Mobile Top Bar Enhancement (1 hour) ✅ **COMPLETE**

**Status**: ✅ Complete (2025-10-28)
**Commit**: `8628624`

**Goal**: Enhanced top bar with context-specific features

**Tasks**:
1. ✅ Add dynamic page titles for all routes (10+ routes):
   - Main pages: Dashboard, My Tasks, Notifications
   - Management: Users, Reports, Settings, Profile
   - Department: Department Tasks
   - Projects: Board View, List View, Calendar View
2. ✅ Implement context-specific action buttons:
   - Dashboard: Search button
   - My Tasks: Filter button
   - Projects: View switcher button
   - Department Tasks: Filter button
   - Users: Filter button
3. ✅ Add search functionality (state & button ready, modal in future phase)
4. ✅ Improve back button logic (6 main pages with hamburger, others with back)
5. ✅ Add animations:
   - Backdrop blur effect
   - Slide-in animation on mount
   - Button press animations (active:scale-95)
   - Smooth opacity transitions
   - Logo fade-in

**Deliverable**: ✅ Polished top bar with full features

**What Works**:
- All route titles display correctly
- Context-specific actions render per page
- Smooth animations and transitions
- Back button logic improved
- Touch-friendly tap targets (36x36px)

**Note**: Phases 4, 5, 6 have been merged into Phase 2 and completed.

---

### Phase 4 (formerly 7): Task Panel Mobile (1-2 hours) ✅ **COMPLETE**

**Status**: ✅ Complete (2025-10-28)
**Commit**: (pending)

**Goal**: Full-screen task panel on mobile

**Tasks**:
1. ✅ Update `task-panel/index.tsx` with responsive classes
   - Desktop: `md:max-w-3xl md:rounded-l-xl` (600px slide from right)
   - Mobile: `w-full max-md:max-w-none max-md:rounded-none` (full-screen)
2. ✅ Update `task-panel-header.tsx` with mobile back button
   - Mobile: ArrowLeft icon (← กลับ)
   - Desktop: X icon (ปิด)
   - Removed rounded corner on mobile: `md:rounded-tl-xl`
3. ✅ Make tabs sticky on mobile
   - Added `max-md:sticky max-md:top-0 max-md:z-10 max-md:bg-background`
   - Desktop remains static
4. ✅ Type-check passed (0 errors)
5. ⏳ Test on mobile viewport (user to test)
6. ⏳ Add swipe-to-close (optional - deferred to future)

**Deliverable**: ✅ Full-screen task panel with mobile-optimized header and sticky tabs

**What Works**:
- Task Panel opens full-screen on mobile devices (< 768px)
- Back button (←) appears on mobile instead of close X
- Tabs stick to top when scrolling content on mobile
- All content remains scrollable
- Desktop layout unchanged (600px slide-in panel)

**Files Modified**:
- `src/components/task-panel/index.tsx` (responsive panel classes)
- `src/components/task-panel/task-panel-header.tsx` (back button, conditional icon)
- `src/components/task-panel/task-panel-tabs.tsx` (sticky tabs on mobile)

---

### Phase 5 (formerly 8): Modals Mobile (2-3 hours) ✅ **COMPLETE**

**Status**: ✅ Complete (2025-10-28)
**Commit**: (pending)

**Goal**: All modals full-screen on mobile

**Tasks**:
1. ✅ Update `create-task-modal.tsx` - Full-screen on mobile, back button
2. ✅ Update `create-project-modal.tsx` - Full-screen on mobile, back button
3. ✅ Update `edit-project-modal.tsx` - Full-screen on mobile, back button
4. ✅ Update `create-user-modal.tsx` - Full-screen on mobile, back button
5. ✅ Update `edit-user-modal.tsx` - Full-screen on mobile, back button
6. ✅ Type-check passed (0 errors)
7. ⏳ Test on mobile viewport (user to test)

**Deliverable**: ✅ All 5 modals responsive and mobile-optimized

**What Works**:
- All slide panel modals open full-screen on mobile (< 768px)
- Back button (←) appears on mobile instead of close X button
- Desktop layout unchanged (slide from right with max-width)
- Smooth animations maintained
- No rounded corners on mobile, rounded on desktop

**Files Modified** (5 modals):
- `src/components/modals/create-task-modal.tsx`
- `src/components/modals/create-project-modal.tsx`
- `src/components/modals/edit-project-modal.tsx`
- `src/components/modals/create-user-modal.tsx`
- `src/components/modals/edit-user-modal.tsx`

**Pattern Applied**:
1. Import `ArrowLeft` from lucide-react
2. Import `useIsMobile` hook
3. Add `isMobile` variable in component
4. Update slide panel classes:
   - Desktop: `md:max-w-3xl md:rounded-l-xl` (or max-w-2xl for user modals)
   - Mobile: `w-full max-md:max-w-none max-md:rounded-none`
5. Update header: `md:rounded-tl-xl` (desktop only)
6. Update close button: Conditional `isMobile ? <ArrowLeft/> : <X/>`

---

### Additional Features (2025-10-29) ✅ **COMPLETE**

**Status**: ✅ Complete (2025-10-29)
**Commit**: (pending)

**Goal**: Additional mobile navigation enhancements + build fix

**Features Implemented**:
1. ✅ **Calendar Page** (`src/app/(dashboard)/calendar/page.tsx` - 324 lines)
   - Dedicated page with DashboardCalendarWidget at top
   - Task list below that syncs with selected month
   - Grouped by date with due date badge
   - Touch-friendly task cards
   - Click to open Task Panel

2. ✅ **Swipe Navigation** (`src/components/layout/swipeable-pages.tsx` - 93 lines)
   - Horizontal swipe gestures between 4 main pages
   - Pages: งานของฉัน ⟷ เช็คลิสต์ ⟷ ปฏิทิน ⟷ แจ้งเตือน
   - 50px threshold + velocity detection
   - Desktop mode unaffected (no swipe)
   - Smooth transitions with framer-motion
   - Rubber band effect (dragElastic: 0.2)

3. ✅ **Navigation Reorganization**
   - Moved Calendar from top nav to bottom nav (position 4)
   - Moved Activities from bottom nav to top nav
   - Added X button on Activities page for router.back()
   - Bottom nav: Home, My Tasks, Create, Calendar, Notifications (5 tabs)

4. ✅ **Workspace Menu Animation** (`mobile-menu.tsx`)
   - Smooth collapse/expand with framer-motion
   - ChevronDown rotation animation (0 → -90 degrees)
   - Height/opacity transition (duration: 0.2s, ease-out)
   - Default expanded state on app open
   - AnimatePresence for mount/unmount

5. ✅ **Controlled Calendar Component** (`dashboard-calendar-widget.tsx`)
   - Added currentMonth and onMonthChange props
   - Allows parent to manage month state
   - Maintains backward compatibility (uncontrolled mode)
   - Syncs calendar and task list perfectly

6. ✅ **Mobile-Friendly Modal Buttons**
   - "สร้างโปรเจกต์" button full-width on mobile
   - "สร้างงาน" button full-width on mobile
   - Responsive classes: `w-full md:w-auto`
   - Responsive heights: `h-10 md:h-[46px]`
   - Responsive text: `text-sm md:text-base`

**Build Fix**:
- ✅ **Windows EPERM Error** - Resolved "operation not permitted, scandir Application Data"
- Updated `package.json` build script to use Turbopack: `"build": "npx prisma generate && next build --turbo"`
- Build succeeds in ~6 seconds vs webpack failure
- All 62 pages generated successfully

**Files Created** (5):
- `src/app/(dashboard)/activities/page.tsx`
- `src/app/(dashboard)/calendar/page.tsx`
- `src/app/(dashboard)/checklist/page.tsx`
- `src/app/(dashboard)/projects/[projectId]/mobile/page.tsx`
- `src/components/layout/swipeable-pages.tsx`

**Files Modified** (8):
- `package.json` (build script with --turbo)
- `src/components/dashboard/dashboard-calendar-widget.tsx` (controlled component)
- `src/components/layout/bottom-navigation.tsx` (Calendar tab)
- `src/components/layout/mobile-top-bar.tsx` (Activities button + X button)
- `src/components/layout/mobile-menu.tsx` (animations)
- `src/components/modals/create-project-modal.tsx` (mobile button)
- `src/components/modals/create-task-modal.tsx` (mobile button)
- `src/app/(dashboard)/my-tasks/page.tsx` + `notifications/page.tsx` (SwipeablePages wrapper)

**Testing**:
- ✅ Type-check passed (0 errors)
- ✅ Production build successful (62 pages)
- ⏳ User testing on mobile devices (pending)

---

### Phase 6 (formerly 9): Views Mobile (3-4 hours)

**Status**: ⏳ Pending

**Goal**: Optimize Board/List/Calendar for mobile

**Tasks**:
1. ⏳ Update `board-view` - Horizontal scroll columns
2. ⏳ Update `list-view` - Stack layout, larger tap targets
3. ⏳ Update `calendar-view` - Mobile calendar component
4. ⏳ Add touch gestures (swipe between views)
5. ⏳ Test all views on mobile

**Deliverable**: All views mobile-optimized

---

### Phase 7 (formerly 10): Pull-to-Refresh (1 hour)

**Status**: ⏳ Pending

**Goal**: Native-like pull-to-refresh

**Tasks**:
1. ⏳ Install/create pull-to-refresh library
2. ⏳ Add to Dashboard
3. ⏳ Add to My Tasks
4. ⏳ Add to Notifications
5. ⏳ Add to all list views

**Deliverable**: Working pull-to-refresh

---

### Phase 8 (formerly 11): Testing & Polish (2-3 hours)

**Status**: ⏳ Pending

**Goal**: Production-ready mobile experience

**Tasks**:
1. ⏳ Test all user flows on mobile (iPhone, Android simulators)
2. ⏳ Test breakpoint transitions (resize browser)
3. ⏳ Optimize bundle size (lazy load mobile components)
4. ⏳ Add loading skeletons
5. ⏳ Performance audit (Lighthouse)
6. ⏳ Fix any bugs

**Deliverable**: Production-ready mobile layout

---

## 📐 Technical Specifications

### Breakpoints

```typescript
// Tailwind breakpoints (mobile-first)
const breakpoints = {
  sm: '640px',   // Small devices
  md: '768px',   // Medium devices (MOBILE CUTOFF)
  lg: '1024px',  // Large devices
  xl: '1280px',  // Extra large devices
  '2xl': '1536px' // 2X Extra large devices
};

// Our strategy:
// < 768px: Mobile Layout (bottom nav, no sidebar)
// >= 768px: Desktop Layout (sidebar, top nav)
```

### Use Media Query Hook

```typescript
// src/hooks/use-media-query.ts
import { useState, useEffect } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);

    // Set initial value
    setMatches(media.matches);

    // Listen for changes
    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener('change', listener);

    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
}

// Usage:
const isMobile = useMediaQuery('(max-width: 768px)');
```

### Responsive Class Patterns

```typescript
// Full-screen modal on mobile
className={cn(
  "md:max-w-2xl md:h-auto",           // Desktop: normal modal
  "max-md:w-screen max-md:h-screen max-md:max-w-none max-md:rounded-none" // Mobile: full-screen
)}

// Hide on mobile
className="hidden md:block"

// Show only on mobile
className="md:hidden"

// Different padding
className="p-2 md:p-6"

// Touch-friendly tap targets
className="h-12 md:h-10" // Larger on mobile
```

### Bottom Navigation Specs

```typescript
// Fixed positioning
className="fixed bottom-0 left-0 right-0 z-50"

// Height
className="h-16" // 64px

// Tab item
className="flex-1 flex flex-col items-center justify-center gap-1"

// Icon size
className="h-6 w-6" // 24px

// Tap target
className="min-h-[48px] min-w-[48px]" // 48x48px minimum
```

### Animation Specs

```typescript
// Bottom nav slide up on mount
className="animate-in slide-in-from-bottom-4 duration-300"

// Task panel slide from right (mobile)
className="animate-in slide-in-from-right duration-300"

// Menu drawer slide from left
className="animate-in slide-in-from-left duration-300"

// Pull-to-refresh spinner
className="animate-spin duration-700"
```

### Touch Gesture Support

```typescript
// Pull-to-refresh
import { useGesture } from '@use-gesture/react';

const bind = useGesture({
  onDrag: ({ movement: [, my], last }) => {
    if (my > 80 && last) {
      // Trigger refresh
      refetch();
    }
  }
});
```

### Performance Optimization

```typescript
// Lazy load mobile components
const MobileLayout = lazy(() => import('@/components/layout/mobile-layout'));
const DesktopLayout = lazy(() => import('@/components/layout/desktop-layout'));

// Code splitting by route
export const dynamic = 'force-dynamic';

// Optimize images
<Image
  src={avatar}
  width={40}
  height={40}
  loading="lazy"
  placeholder="blur"
/>
```

---

## 🎨 Design Tokens (Mobile-Specific)

### Spacing

```typescript
const spacing = {
  bottomNavHeight: '64px',    // 4rem
  topBarHeight: '56px',       // 3.5rem
  tabBarHeight: '48px',       // 3rem
  contentPadding: '16px',     // 1rem (mobile), 24px (desktop)
  touchTarget: '48px',        // 3rem minimum
};
```

### Typography (Mobile)

```typescript
const typography = {
  pageTitle: 'text-lg font-semibold',      // 18px
  sectionTitle: 'text-base font-semibold', // 16px
  bodyText: 'text-sm',                     // 14px
  caption: 'text-xs',                      // 12px
  tabLabel: 'text-xs font-medium',         // 12px
};
```

### Colors (Inherit from existing theme)

```typescript
// Use existing Tailwind theme
// Primary: hsl(var(--primary))
// Accent: hsl(var(--accent))
// Muted: hsl(var(--muted))

// Bottom nav active state
className="text-primary"

// Bottom nav inactive state
className="text-muted-foreground"
```

---

## 🧪 Testing Checklist

### Functional Testing

- [ ] Bottom nav switches routes correctly
- [ ] Back button works in all contexts
- [ ] Hamburger menu opens/closes
- [ ] Task panel opens full-screen
- [ ] Modals open full-screen
- [ ] Pull-to-refresh triggers refetch
- [ ] All forms submittable on mobile
- [ ] All buttons have proper tap targets (48px min)

### Visual Testing

- [ ] Layout looks good on iPhone SE (375px)
- [ ] Layout looks good on iPhone 12/13/14 (390px)
- [ ] Layout looks good on iPhone 14 Plus (428px)
- [ ] Layout looks good on Android (360px - 412px)
- [ ] No horizontal scroll
- [ ] No overlapping elements
- [ ] Text is readable (not too small)
- [ ] Active states are clear

### Performance Testing

- [ ] Lighthouse Mobile score > 90
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 3s
- [ ] No layout shifts (CLS < 0.1)
- [ ] Smooth 60fps animations
- [ ] Bundle size increase < 50kb

### Breakpoint Testing

- [ ] Switches to mobile at 767px
- [ ] Switches to desktop at 768px
- [ ] No glitches during resize
- [ ] State persists across breakpoints

---

## 📚 References

### External Resources

- [Tailwind Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [Material Design - Bottom Navigation](https://m1.material.io/components/bottom-navigation.html)
- [iOS Human Interface Guidelines - Tab Bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars)
- [Facebook Mobile Design Patterns](https://www.mobile-patterns.com/facebook)

### Internal Documentation

- `CLAUDE.md` - Project overview and architecture
- `OPTIMISTIC_UPDATE_PATTERN.md` - Optimistic UI updates
- `PERMISSION_GUIDELINE.md` - Permission system

---

**End of Mobile Layout Design Document**

Version 1.0.0 - 2025-10-28
