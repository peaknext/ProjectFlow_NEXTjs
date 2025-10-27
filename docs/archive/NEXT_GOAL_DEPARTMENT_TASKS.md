# 🎯 Next Goal: Department Tasks View

**Created:** 2025-10-23
**Status:** 📋 Designed & Ready for Implementation
**Priority:** ⭐⭐⭐ HIGH (MVP feature for department heads)
**Timeline:** 6-10 weeks (MVP in 8-12 days)

---

## 📋 Overview

Department-level task management view that shows **all tasks in a department**, grouped by projects with advanced filtering, custom grouping options, and optional Gantt chart timeline visualization.

**Target Users:** HEAD, MEMBER (department-level roles)

---

## ✨ Key Features Designed

### 1. Three View Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| **Compact** | Condensed info, see more tasks | Quick scanning |
| **Expanded** ⭐ | Balanced view (stats + table) | **DEFAULT** |
| **Detailed** | Full info (subtasks, comments) | Deep analysis |

### 2. Custom Grouping Options (8 types)

1. **By Project** (default) - Group tasks by project
2. **By Assignee** - View workload per person with % calculation
3. **By Status** - See tasks by stage (TODO → IN_PROGRESS → COMPLETED)
4. **By Priority** - Focus on urgent tasks (Priority 1-4)
5. **By Due Date** - Group by deadline (Overdue/Today/This Week/This Month/Later)
6. **By Tags** - Group by category (Bug/Feature/Improvement)
7. **Multi-level** - 3-level nested grouping (e.g., Project → Assignee → Priority)
8. **Flat List** - No grouping, simple table view

### 3. Gantt Chart View (Optional - Phase 8)

- 📊 Timeline visualization of all tasks
- 🔗 Task dependencies (4 types: FS, SS, FF, SF)
- 🎯 Critical path analysis
- 🖱️ Drag & drop to change dates
- 👥 Resource allocation view
- 📤 Export to PDF/Excel/MS Project

### 4. Additional Features

- 📈 Department overview stats (total, completed, overdue, due soon)
- 🔍 Advanced filtering & sorting (8+ filter types)
- ⚡ Bulk actions (status, assign, delete)
- 🎨 Workload indicators (overload/normal/underutilized)
- ⚡ Optimistic updates for instant feedback
- 📊 Export to Excel/PDF

---

## 🛠️ Implementation Phases

### Complete Timeline

| Phase | Feature | Time | Dependencies | Priority |
|-------|---------|------|--------------|----------|
| **1-6** | **MVP (Basic View)** | **8-12 days** | ✅ None | ⭐⭐⭐ MUST |
| 7 | Custom Grouping | 7-9 days | ✅ None | ⭐⭐ SHOULD |
| 8 | Gantt Chart | 11-16 days | ⚠️ dhtmlx-gantt ($500/yr) | ⭐⭐ SHOULD |
| 9 | Export & Analytics | 8-9 days | ✅ xlsx, jspdf (free) | ⭐ NICE |
| **TOTAL** | **Full Implementation** | **34-46 days** | **(6-10 weeks)** | |

### 🎯 MVP Scope (Phases 1-6) - RECOMMENDED START

**What's Included:**
- ✅ Basic view with project grouping
- ✅ Department overview stats
- ✅ Expanded view mode (default)
- ✅ Advanced filtering & sorting
- ✅ Task panel integration (already exists)
- ✅ Bulk actions
- ✅ Optimistic updates
- ✅ Responsive design
- ✅ Dark mode support

**What's Needed:**
- ✅ **NO new npm packages!** Uses existing dependencies
- ✅ 2 new API endpoints (see below)
- ✅ 8-12 days development time

**What's Deferred to v2:**
- ⏸️ Custom grouping (except Project)
- ⏸️ Gantt chart
- ⏸️ Export features
- ⏸️ Advanced analytics

---

## 🔌 API Requirements

### 1. Main Endpoint: Department Tasks

```typescript
GET /api/departments/[departmentId]/tasks

Query Parameters:
  view?: 'grouped' | 'gantt' | 'flat'        // Default: 'grouped'
  groupBy?: 'project' | 'assignee' | ...     // Default: 'project'
  status?: string                             // Comma-separated
  priority?: string                           // Comma-separated
  assigneeId?: string
  search?: string
  sortBy?: string
  sortDir?: 'asc' | 'desc'
  includeCompleted?: boolean                  // Default: false

Response:
{
  success: true,
  data: {
    department: {
      id: "DEPT-001",
      name: "แผนกเทคโนโลยีสารสนเทศ"
    },
    stats: {
      totalTasks: 45,
      completedTasks: 12,
      overdueTasks: 5,
      dueSoonTasks: 8,
      totalProjects: 8,
      completionRate: 0.27
    },
    projects: [
      {
        id: "proj001",
        name: "โครงการพัฒนา HIS",
        status: "ACTIVE",
        dueDate: "2025-12-31",
        progress: 0.80,
        stats: {
          totalTasks: 15,
          completedTasks: 12,
          overdueTasks: 2,
          dueSoonTasks: 3
        },
        assignedUsers: [
          { id: "user001", fullName: "สมชาย ใจดี", avatar: "..." }
        ],
        tasks: [
          {
            id: "task001",
            name: "Setup Database",
            description: "...",
            priority: 1,
            status: "COMPLETED",
            dueDate: "2025-10-20",
            assignee: { id, fullName, avatar },
            progress: 1.0,
            isPinned: true,
            commentsCount: 3,
            attachmentsCount: 2,
            checklistProgress: { completed: 5, total: 5 },
            isOverdue: false,
            isDueSoon: false
          }
          // ... more tasks
        ]
      }
      // ... more projects
    ]
  }
}
```

### 2. Bulk Actions Endpoint

```typescript
POST /api/tasks/bulk-update

Request:
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

Response:
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

## 📁 File Structure

```
src/
├── app/
│   ├── (dashboard)/
│   │   └── department/
│   │       └── tasks/
│   │           └── page.tsx                   # Main page (NEW)
│   └── api/
│       ├── departments/
│       │   └── [departmentId]/
│       │       └── tasks/
│       │           └── route.ts               # GET endpoint (NEW)
│       └── tasks/
│           └── bulk-update/
│               └── route.ts                   # POST endpoint (NEW)
│
├── components/
│   └── views/
│       └── department-tasks/                  # NEW directory
│           ├── department-tasks-view.tsx      # Main container
│           ├── department-header.tsx          # Header with stats
│           ├── department-toolbar.tsx         # Filters, sort, view switcher
│           ├── project-group-card.tsx         # Project card (collapsible)
│           ├── task-table.tsx                 # Task table (reuse from list view)
│           ├── bulk-actions-bar.tsx           # Bulk actions
│           └── index.ts                       # Exports
│
├── hooks/
│   ├── use-department-tasks.ts                # React Query hook (NEW)
│   └── use-bulk-actions.ts                    # Bulk mutations (NEW)
│
└── lib/
    └── task-grouping.ts                       # Grouping logic (NEW - Phase 7)
```

---

## 🚀 Quick Start Guide

### Step 1: Create Route

```bash
mkdir -p src/app/(dashboard)/department/tasks
touch src/app/(dashboard)/department/tasks/page.tsx
```

### Step 2: Create API Endpoints

```bash
# Department tasks endpoint
mkdir -p src/app/api/departments/[departmentId]/tasks
touch src/app/api/departments/[departmentId]/tasks/route.ts

# Bulk update endpoint
mkdir -p src/app/api/tasks/bulk-update
touch src/app/api/tasks/bulk-update/route.ts
```

### Step 3: Create Components

```bash
mkdir -p src/components/views/department-tasks
cd src/components/views/department-tasks

# Create component files
touch department-tasks-view.tsx
touch department-header.tsx
touch department-toolbar.tsx
touch project-group-card.tsx
touch task-table.tsx
touch bulk-actions-bar.tsx
touch index.ts
```

### Step 4: Create Hooks

```bash
cd src/hooks
touch use-department-tasks.ts
touch use-bulk-actions.ts
```

### Step 5: Follow Phase 1 Checklist

See [DEPARTMENT_TASKS_VIEW_DESIGN.md](DEPARTMENT_TASKS_VIEW_DESIGN.md) for detailed implementation checklist.

---

## 📦 Dependencies

### For MVP (Phases 1-6)

```bash
# NO new packages needed! ✅
# Uses existing dependencies:
# - @tanstack/react-query
# - zustand
# - date-fns
# - lucide-react
```

### For Custom Grouping (Phase 7)

```bash
# NO new packages needed! ✅
# Pure TypeScript grouping logic
```

### For Gantt Chart (Phase 8)

```bash
npm install dhtmlx-gantt @types/dhtmlx-gantt
# Cost: ~$500/year for Pro license
# Can test with free version first
```

### For Export Features (Phase 9)

```bash
npm install xlsx jspdf jspdf-autotable
npm install -D @types/xlsx @types/jspdf
# All FREE (MIT licensed) ✅
```

---

## 💰 Cost Analysis

### Development Time

| Scope | Days | Cost (@ $50-100/hr) |
|-------|------|---------------------|
| MVP (Phases 1-6) | 8-12 | $4,800 - $9,600 |
| + Custom Grouping | 7-9 | $3,500 - $7,200 |
| + Gantt Chart | 11-16 | $5,500 - $12,800 |
| + Export Features | 8-9 | $4,000 - $7,200 |
| **Full Implementation** | **34-46** | **$18,400 - $36,800** |

### Third-Party Costs

| Item | Cost | When Needed |
|------|------|-------------|
| dhtmlx-gantt Pro | $500/year | Phase 8 only |
| All other libraries | $0 (MIT) | Phases 1-7, 9 |

### ROI Calculation

**Time Saved:**
- 10 department heads × 3 hours/week × 50 weeks = **1,500 hours/year**

**Value:**
- At $20-40/hour = **$30,000 - $60,000/year**

**Break-even:**
- MVP cost: $9,600
- Time to break-even: **< 1 month!** 🎉

**ROI:**
- First year: **3-6x return**
- Following years: **60-120x return** (only $500/year maintenance)

---

## 📚 Design Documents

All specifications are complete and ready for implementation:

### Main Documents (4 files, ~2,000 lines total)

1. **[DEPARTMENT_TASKS_VIEW_DESIGN.md](DEPARTMENT_TASKS_VIEW_DESIGN.md)** (900+ lines)
   - Complete UI/UX design
   - 3 view modes
   - API specifications
   - Implementation phases
   - Technical details

2. **[DEPARTMENT_TASKS_GANTT_CHART_DESIGN.md](DEPARTMENT_TASKS_GANTT_CHART_DESIGN.md)** (600+ lines)
   - Gantt chart design
   - Dependencies system
   - Critical path analysis
   - dhtmlx-gantt integration

3. **[DEPARTMENT_TASKS_CUSTOM_GROUPING_DESIGN.md](DEPARTMENT_TASKS_CUSTOM_GROUPING_DESIGN.md)** (500+ lines)
   - 8 grouping options
   - Multi-level grouping
   - Workload calculation
   - Visual indicators

4. **[DEPARTMENT_TASKS_DEPENDENCIES.md](DEPARTMENT_TASKS_DEPENDENCIES.md)** (400+ lines)
   - npm package requirements
   - License costs
   - Bundle size analysis
   - Installation guide

---

## ✅ Implementation Checklist

### Pre-Development

- [ ] Review all 4 design documents
- [ ] Get stakeholder approval
- [ ] Get budget approval (if including Gantt: $500/year)
- [ ] Decide on MVP vs full scope
- [ ] Assign developer(s)

### Phase 1: Basic View (2-3 days)

- [ ] Create route: `/department/tasks`
- [ ] Create API: `GET /api/departments/[id]/tasks`
- [ ] Department header with stats
- [ ] Project group cards (collapsed)
- [ ] Basic task list
- [ ] React Query integration
- [ ] Loading states

### Phase 2: Filtering & Sorting (1-2 days)

- [ ] Filter component (status, priority, assignee, date)
- [ ] Sort dropdown
- [ ] Search functionality
- [ ] URL state management
- [ ] Clear filters button

### Phase 3: Table View (2-3 days)

- [ ] Task table component (reuse from list view)
- [ ] Expand/collapse animation
- [ ] Click task → open panel
- [ ] Checkbox selection
- [ ] Quick actions (status, priority)
- [ ] Optimistic updates

### Phase 4: Bulk Actions (1 day)

- [ ] Bulk actions bar
- [ ] API: `POST /api/tasks/bulk-update`
- [ ] Bulk status change
- [ ] Bulk assign
- [ ] Bulk delete with confirmation

### Phase 5: View Modes (1 day)

- [ ] Compact view
- [ ] Expanded view (default)
- [ ] Detailed view
- [ ] View mode switcher
- [ ] Save preference (localStorage)

### Phase 6: Polish (1-2 days)

- [ ] Virtual scrolling (if needed)
- [ ] Pagination
- [ ] Skeleton loading
- [ ] Error states
- [ ] Empty states
- [ ] Animations
- [ ] Dark mode
- [ ] Responsive design
- [ ] Testing

**MVP Complete!** 🎉

### Phase 7: Custom Grouping (7-9 days) - OPTIONAL

See [DEPARTMENT_TASKS_CUSTOM_GROUPING_DESIGN.md](DEPARTMENT_TASKS_CUSTOM_GROUPING_DESIGN.md)

### Phase 8: Gantt Chart (11-16 days) - OPTIONAL

See [DEPARTMENT_TASKS_GANTT_CHART_DESIGN.md](DEPARTMENT_TASKS_GANTT_CHART_DESIGN.md)

### Phase 9: Export & Analytics (8-9 days) - OPTIONAL

- [ ] Export to Excel
- [ ] Export to PDF
- [ ] Print view
- [ ] Analytics dashboard

---

## 🎯 Success Metrics

### User Experience Metrics

- Time to find a task: **< 10 seconds**
- Page load time: **< 2 seconds**
- Interaction response time: **< 100ms** (optimistic updates)

### Adoption Metrics

- % department heads using view daily: **> 90%**
- % using custom grouping: **> 60%**
- % using Gantt chart: **> 40%** (if implemented)

### Technical Metrics

- API response time: **< 500ms**
- Support **100+ tasks** without lag
- Virtual scroll FPS: **> 50fps**

---

## 📅 Recommended Timeline

### Sprint 1 (Weeks 1-2): MVP ⭐ START HERE

**Goal:** Deploy basic department tasks view

**Tasks:**
1. Implement Phases 1-6
2. Deploy to staging
3. Test with 2-3 department heads
4. Gather feedback
5. Fix critical bugs

**Deliverable:** Working MVP on staging

### Sprint 2 (Weeks 3-4): Custom Grouping (Based on Feedback)

**Goal:** Add most-requested grouping options

**Tasks:**
1. Implement grouping infrastructure
2. Add Group by Assignee (likely most requested)
3. Add Group by Due Date
4. Add Group by Status
5. Test with users

**Deliverable:** Flexible grouping system

### Sprint 3-4 (Weeks 5-8): Gantt Chart (IF users want timeline)

**Goal:** Add timeline visualization

**Pre-requisites:**
- Get budget approval for dhtmlx-gantt ($500/year)

**Tasks:**
1. Install dhtmlx-gantt
2. Implement basic Gantt (Phase 8.1-8.2)
3. Add dependencies (Phase 8.3)
4. Add critical path (Phase 8.4)
5. Polish and test (Phase 8.5-8.6)

**Deliverable:** Full Gantt chart with dependencies

### Sprint 5 (Weeks 9-10): Polish & Export

**Goal:** Production-ready features

**Tasks:**
1. Export to Excel/PDF
2. Analytics dashboard
3. Performance optimizations
4. User acceptance testing
5. Production deployment

**Deliverable:** Production-ready Department Tasks View

---

## 🚦 Next Steps

### Immediate (This Week)

1. **Review design documents** (all 4 files)
2. **Schedule stakeholder meeting** to present design
3. **Get approval** for MVP scope and timeline
4. **Assign developer** or team

### Short Term (Next 2 Weeks)

1. **Start MVP development** (Phases 1-6)
2. **Create API endpoints** (2 new endpoints)
3. **Build core components** (6 main components)
4. **Set up React Query** hooks

### Mid Term (Weeks 3-4)

1. **Complete MVP**
2. **Deploy to staging**
3. **User testing** with department heads
4. **Gather feedback**
5. **Iterate**

### Long Term (Weeks 5-10)

1. **Add custom grouping** (if requested)
2. **Add Gantt chart** (if budget approved)
3. **Polish and optimize**
4. **Production deployment**

---

## ✨ Key Benefits

### For Department Heads (HEAD role)

- 📊 **See all department tasks** in one place
- 👥 **Manage workload** across team members
- 🎯 **Identify bottlenecks** and risks early
- ⏰ **Track deadlines** with due date grouping
- 📈 **Monitor progress** with stats and charts
- ⚡ **Quick actions** with bulk operations

### For Team Members (MEMBER role)

- 👀 **Visibility** into department priorities
- 📋 **See own tasks** highlighted
- 🤝 **Understand** team context
- 🔍 **Find information** quickly

### For Organization

- 💰 **Save time**: 1,500+ hours/year
- 💵 **Save money**: $30,000-60,000/year
- 📊 **Better planning** with Gantt charts
- 🎯 **Resource optimization** with workload view
- ✅ **Higher completion rates**

---

## 🎓 References

Similar features in:
- **Asana:** Portfolio view with grouping
- **Jira:** Project list with epic grouping
- **Monday.com:** Department dashboard
- **ClickUp:** Everything view with custom grouping
- **MS Project:** Gantt chart with critical path

---

## 📞 Contact & Support

**When ready to start:**
1. Read [DEPARTMENT_TASKS_VIEW_DESIGN.md](DEPARTMENT_TASKS_VIEW_DESIGN.md) for full specs
2. Follow Phase 1 checklist
3. Reference other design docs as needed

**Questions?**
- Check design documents first
- Review API specifications
- Look at implementation examples in docs

---

**Document Status:** ✅ Complete & Ready
**Last Updated:** 2025-10-23
**Next Action:** Review → Approve → Implement MVP

---

**END OF NEXT GOAL DOCUMENT**
