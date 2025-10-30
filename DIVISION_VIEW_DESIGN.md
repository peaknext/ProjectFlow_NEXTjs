# Division View - Executive Dashboard Design Document

**Version**: 1.0.0
**Date**: 2025-10-30
**Status**: Planning Phase

---

## 📋 Executive Summary

Division View เป็นหน้าจอภาพรวมสำหรับผู้บริหารกลุ่มงาน (LEADER role) ที่ต้องดูแลหลายหน่วยงานภายใต้สังกัด ออกแบบตามหลักการบริหารงานสมัยใหม่ที่เน้น **Data-Driven Decision Making**, **Performance Monitoring**, และ **Resource Optimization**

---

## 🎯 Objectives

1. **Strategic Overview** - ภาพรวมความคืบหน้าของทุกหน่วยงานในกลุ่มงาน
2. **Performance Comparison** - เปรียบเทียบประสิทธิภาพระหว่างหน่วยงาน
3. **Risk Management** - ระบุและจัดการงานที่มีความเสี่ยง
4. **Resource Allocation** - ตรวจสอบการกระจายทรัพยากรและภาระงาน
5. **Quick Action** - เข้าถึงข้อมูลเชิงลึกของแต่ละหน่วยงานได้รวดเร็ว

---

## 👥 User Roles & Permissions

| Role | Access Level | Scope |
|------|-------------|-------|
| **ADMIN** | Full Access | ทุกกลุ่มงาน (เลือกได้จาก filter) |
| **CHIEF** | Full Access | กลุ่มงานในกลุ่มภารกิจของตนเอง |
| **LEADER** | Full Access | กลุ่มงานของตนเอง (default) |
| HEAD/MEMBER/USER | No Access | ใช้ Department Tasks View แทน |

---

## 🗺️ Navigation

### Access Points:
1. **Breadcrumb**: Dashboard → กลุ่มภารกิจ → **กลุ่มงาน** → หน่วยงาน
2. **Breadcrumb Menu**: คลิก `>` หลังชื่อกลุ่มภารกิจ → เลือกกลุ่มงาน
3. **Top Menu**: "งาน" → "กลุ่มงาน" (new menu item)

### URL Pattern:
```
/division/tasks?divisionId={divisionId}
```

---

## 📐 Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│ Division Toolbar                                            │
│ (Breadcrumb, Division Name, Filters)                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ [1] Stats Cards Section (4 cards)                          │
│     Total Departments | Projects | Tasks | Completion      │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ [2] Department Comparison Table                            │
│     (Overview of all departments with key metrics)         │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ [3] Performance Charts Section                             │
│     ┌──────────────────┬──────────────────┐               │
│     │ Completion Trend │ Workload Balance │               │
│     └──────────────────┴──────────────────┘               │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ [4] Critical Tasks Section                                 │
│     (Combined view of high-priority tasks across division) │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Section 1: Stats Cards

**Design Pattern**: Reuse `StatisticsCards` component from Reports page

### Cards Layout (4 cards):

```typescript
interface DivisionStats {
  totalDepartments: number;      // Card 1
  totalProjects: number;         // Card 2
  totalTasks: number;            // Card 3
  avgCompletionRate: number;     // Card 4 (%)

  // Additional metrics for cards
  activeDepartments: number;     // Card 1 subtitle
  activeProjects: number;        // Card 2 subtitle
  completedTasks: number;        // Card 3 subtitle
  trend: {                       // Card 4 subtitle
    direction: 'up' | 'down' | 'stable';
    value: number; // percentage change
  };
}
```

### Card Details:

| Card | Title | Value | Subtitle | Icon | Color |
|------|-------|-------|----------|------|-------|
| 1 | หน่วยงานทั้งหมด | X หน่วยงาน | Y หน่วยงานทำงานอยู่ | Building2 | Blue |
| 2 | โครงการทั้งหมด | X โครงการ | Y โครงการกำลังดำเนินการ | FolderKanban | Green |
| 3 | งานทั้งหมด | X งาน | Y งานเสร็จแล้ว | CheckSquare | Purple |
| 4 | อัตราความสำเร็จเฉลี่ย | X% | ↑/↓ Y% จากเดือนที่แล้ว | TrendingUp | Orange |

**Component**:
```typescript
<StatisticsCards statistics={divisionStats} />
```

---

## 📊 Section 2: Department Comparison Table

**Purpose**: แสดงภาพรวมของแต่ละหน่วยงาน เพื่อเปรียบเทียบประสิทธิภาพ

### Table Columns:

| Column | Type | Description | Width | Sortable |
|--------|------|-------------|-------|----------|
| **หน่วยงาน** | Text + Link | ชื่อหน่วยงาน (คลิกไปหน้า Department Tasks) | 200px | Yes |
| **โครงการ** | Number | จำนวนโครงการ (Active/Total) | 120px | Yes |
| **งานทั้งหมด** | Number | Total tasks | 100px | Yes |
| **กำลังดำเนินการ** | Number | In-progress tasks | 120px | Yes |
| **เสร็จแล้ว** | Number + Badge | Completed tasks (green badge) | 100px | Yes |
| **เกินกำหนด** | Number + Badge | Overdue tasks (red badge) | 110px | Yes |
| **ใกล้ครบ (0-3 วัน)** | Number + Badge | Due soon tasks (orange badge) | 130px | Yes |
| **อัตราความสำเร็จ** | Progress Bar | Completion rate (0-100%) | 150px | Yes |
| **บุคลากร** | Number + Avatars | Personnel count (max 3 avatars + +N) | 120px | Yes |
| **การดำเนินการ** | Button | "ดูรายละเอียด" → Department Tasks | 100px | No |

### Data Structure:

```typescript
interface DepartmentSummary {
  id: string;
  name: string;
  projectCount: {
    active: number;
    total: number;
  };
  taskStats: {
    total: number;
    inProgress: number;
    completed: number;
    overdue: number;
    dueSoon: number;
  };
  completionRate: number; // 0-100
  personnelCount: number;
  topPersonnel: User[]; // For avatar display (max 3)
  riskLevel: 'low' | 'medium' | 'high'; // Based on overdue %
}
```

### Features:

- **Sorting**: Click column header to sort
- **Color Coding**: Row background based on risk level
  - Low (< 10% overdue): Normal
  - Medium (10-20% overdue): Yellow tint
  - High (> 20% overdue): Red tint
- **Hover Effect**: Highlight row on hover
- **Click Row**: Navigate to Department Tasks view
- **Responsive**: Scroll horizontally on mobile

**Component Structure**:
```typescript
<Card>
  <CardHeader>
    <CardTitle>เปรียบเทียบหน่วยงาน</CardTitle>
  </CardHeader>
  <CardContent>
    <Table>
      <TableHeader>
        {/* Sortable headers */}
      </TableHeader>
      <TableBody>
        {departments.map((dept) => (
          <DepartmentRow key={dept.id} department={dept} />
        ))}
      </TableBody>
    </Table>
  </CardContent>
</Card>
```

---

## 📊 Section 3: Performance Charts

**Design Pattern**: Reuse `ReportsCharts` component structure

### Chart 1: Task Completion Trend (Line Chart)

**Purpose**: แสดงแนวโน้มความสำเร็จของงานในช่วง 30 วันที่ผ่านมา

**Data**:
```typescript
interface CompletionTrendData {
  date: string; // "2025-10-01"
  completed: number; // จำนวนงานที่เสร็จในวันนี้
  created: number; // จำนวนงานที่สร้างในวันนี้
  cumulative: number; // จำนวนงานสะสม
}
```

**Chart Config**:
- **Type**: Line Chart (Chart.js)
- **X-Axis**: Date (last 30 days)
- **Y-Axis**: Task Count
- **Lines**:
  - Line 1: Completed Tasks (green)
  - Line 2: Created Tasks (blue)
  - Line 3: Cumulative Progress (purple, dashed)
- **Tooltip**: Show date, values, and percentage
- **Legend**: Top-right position

### Chart 2: Workload Distribution (Horizontal Bar Chart)

**Purpose**: แสดงการกระจายงานระหว่างหน่วยงาน

**Data**:
```typescript
interface WorkloadData {
  departmentName: string;
  taskCount: number;
  completionRate: number;
  color: string; // Department color
}
```

**Chart Config**:
- **Type**: Horizontal Bar Chart
- **X-Axis**: Task Count
- **Y-Axis**: Department Names
- **Bar Colors**: Department-specific colors
- **Bar Labels**: Task count + completion rate (%)
- **Sorting**: Descending by task count
- **Max Bars**: 10 departments (show "Others" if more)

### Chart 3: Priority Distribution (Doughnut Chart)

**Purpose**: แสดงการกระจายความสำคัญของงานทั้งกลุ่มงาน

**Data**:
```typescript
interface PriorityDistribution {
  priority1: number; // ด่วนมาก (red)
  priority2: number; // สูง (orange)
  priority3: number; // ปานกลาง (yellow)
  priority4: number; // ต่ำ (green)
}
```

**Chart Config**:
- **Type**: Doughnut Chart
- **Colors**: Priority-specific (match PriorityBadge)
- **Center Text**: Total tasks
- **Legend**: Right side with percentages
- **Tooltip**: Show count and percentage

### Chart 4: Status Distribution (Stacked Bar Chart)

**Purpose**: แสดงสถานะงานแยกตามหน่วยงาน

**Data**:
```typescript
interface StatusDistribution {
  departmentName: string;
  notStarted: number;
  inProgress: number;
  done: number;
  overdue: number;
}
```

**Chart Config**:
- **Type**: Stacked Bar Chart
- **X-Axis**: Department Names
- **Y-Axis**: Task Count (%)
- **Segments**:
  - Not Started (gray)
  - In Progress (blue)
  - Done (green)
  - Overdue (red)
- **Show Percentage**: Convert to % for comparison
- **Tooltip**: Show count and percentage per status

**Layout**:
```typescript
<div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
  <Card>
    <CardHeader>
      <CardTitle>แนวโน้มความสำเร็จ (30 วัน)</CardTitle>
    </CardHeader>
    <CardContent>
      <CompletionTrendChart data={trendData} />
    </CardContent>
  </Card>

  <Card>
    <CardHeader>
      <CardTitle>การกระจายงานระหว่างหน่วยงาน</CardTitle>
    </CardHeader>
    <CardContent>
      <WorkloadDistributionChart data={workloadData} />
    </CardContent>
  </Card>

  <Card>
    <CardHeader>
      <CardTitle>การกระจายความสำคัญ</CardTitle>
    </CardHeader>
    <CardContent>
      <PriorityDistributionChart data={priorityData} />
    </CardContent>
  </Card>

  <Card>
    <CardHeader>
      <CardTitle>สถานะงานแยกตามหน่วยงาน</CardTitle>
    </CardHeader>
    <CardContent>
      <StatusDistributionChart data={statusData} />
    </CardContent>
  </Card>
</div>
```

---

## 📊 Section 4: Critical Tasks Section

**Purpose**: แสดงงานสำคัญที่ต้องให้ความสนใจทั้งกลุ่มงาน

### Tabs Layout:

| Tab | Title | Filter Criteria | Badge Color | Max Items |
|-----|-------|-----------------|-------------|-----------|
| 1 | งานเกินกำหนด | `!isClosed && dueDate < today` | Red | 20 |
| 2 | งานด่วนมาก (Priority 1) | `priority === 1 && !isClosed` | Red | 20 |
| 3 | งานใกล้ครบกำหนด (0-3 วัน) | `!isClosed && dueDate in [today, today+3]` | Orange | 20 |
| 4 | งานที่ไม่มีผู้รับผิดชอบ | `assigneeUserIds.length === 0 && !isClosed` | Gray | 20 |

### Task Card Design (Compact):

```typescript
interface CriticalTaskCard {
  task: Task;
  departmentBadge: {
    name: string;
    color: string;
  };
  projectName: string;
  priorityBadge: ReactNode;
  dueDateInfo: {
    date: string;
    overdueDays?: number;
    daysUntilDue?: number;
  };
  assignees: User[];
  actions: {
    openTaskPanel: () => void;
    assignUser: () => void; // Quick assign
  };
}
```

### Card Layout:

```
┌────────────────────────────────────────────────────────┐
│ [Dept Badge]  Task Name                    [Priority]  │
│ Project: XXX                                            │
│ Due: 2025-10-25 (เกิน 3 วัน) | Assignees: [Avatars]  │
│ [คลิกเพื่อดูรายละเอียด]                               │
└────────────────────────────────────────────────────────┘
```

**Component Structure**:
```typescript
<Card>
  <CardHeader>
    <Tabs defaultValue="overdue">
      <TabsList>
        <TabsTrigger value="overdue">
          งานเกินกำหนด <Badge>{overdueTasks.length}</Badge>
        </TabsTrigger>
        <TabsTrigger value="urgent">
          งานด่วนมาก <Badge>{urgentTasks.length}</Badge>
        </TabsTrigger>
        <TabsTrigger value="dueSoon">
          ใกล้ครบกำหนด <Badge>{dueSoonTasks.length}</Badge>
        </TabsTrigger>
        <TabsTrigger value="unassigned">
          ไม่มีผู้รับผิดชอบ <Badge>{unassignedTasks.length}</Badge>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overdue">
        <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {overdueTasks.map((task) => (
            <CriticalTaskCard key={task.id} task={task} />
          ))}
        </div>
      </TabsContent>

      {/* Other tabs... */}
    </Tabs>
  </CardHeader>
</Card>
```

---

## 🎛️ Division Toolbar (Filters)

**Location**: Top of page, below breadcrumb

### Filter Controls:

| Filter | Type | Options | Default |
|--------|------|---------|---------|
| **กลุ่มงาน** | Select (ADMIN/CHIEF only) | All divisions in scope | Current user's division |
| **ช่วงเวลา** | Date Range | Custom range picker | Last 30 days |
| **ปีงบประมาณ** | Multi-select | Fiscal years | Current fiscal year |
| **สถานะโครงการ** | Select | ACTIVE, COMPLETED, ARCHIVED, ALL | ACTIVE |
| **ซ่อนงานที่ปิดแล้ว** | Switch | true/false | true |

**Component**:
```typescript
<DivisionToolbar
  divisionId={divisionId}
  filters={filters}
  onFiltersChange={setFilters}
/>
```

---

## 🔌 API Endpoints

### New Endpoint Required:

**GET** `/api/divisions/{divisionId}/overview`

**Response**:
```typescript
{
  success: true,
  data: {
    division: {
      id: string;
      name: string;
      missionGroup: {
        id: string;
        name: string;
      };
    };
    stats: DivisionStats;
    departments: DepartmentSummary[];
    charts: {
      completionTrend: CompletionTrendData[];
      workloadDistribution: WorkloadData[];
      priorityDistribution: PriorityDistribution;
      statusDistribution: StatusDistribution[];
    };
    criticalTasks: {
      overdue: Task[];
      urgent: Task[];
      dueSoon: Task[];
      unassigned: Task[];
    };
  }
}
```

**Query Parameters**:
- `startDate`: ISO date (optional)
- `endDate`: ISO date (optional)
- `fiscalYears`: comma-separated years (optional)
- `includeCompleted`: boolean (default: false)

**Performance Optimization**:
- Use `Promise.all()` for parallel queries
- Cache division hierarchy
- Pre-calculate stats at query time
- Use database aggregations where possible

---

## 🧩 Components Breakdown

### New Components to Create:

| Component | File Path | Lines | Description |
|-----------|-----------|-------|-------------|
| `DivisionView` | `src/components/views/division-tasks/division-view.tsx` | ~500 | Main container component |
| `DivisionToolbar` | `src/components/layout/division-toolbar.tsx` | ~150 | Filters and breadcrumb |
| `DepartmentComparisonTable` | `src/components/views/division-tasks/department-comparison-table.tsx` | ~250 | Department comparison table |
| `DepartmentRow` | `src/components/views/division-tasks/department-row.tsx` | ~100 | Single department row |
| `DivisionCharts` | `src/components/views/division-tasks/division-charts.tsx` | ~400 | All 4 charts container |
| `CompletionTrendChart` | `src/components/views/division-tasks/charts/completion-trend-chart.tsx` | ~150 | Line chart |
| `WorkloadDistributionChart` | `src/components/views/division-tasks/charts/workload-distribution-chart.tsx` | ~150 | Horizontal bar chart |
| `PriorityDistributionChart` | `src/components/views/division-tasks/charts/priority-distribution-chart.tsx` | ~150 | Doughnut chart |
| `StatusDistributionChart` | `src/components/views/division-tasks/charts/status-distribution-chart.tsx` | ~150 | Stacked bar chart |
| `CriticalTasksSection` | `src/components/views/division-tasks/critical-tasks-section.tsx` | ~300 | Tabs + critical task cards |
| `CriticalTaskCard` | `src/components/views/division-tasks/critical-task-card.tsx` | ~120 | Single task card |

**Total New Code**: ~2,470 lines

### Reusable Components:

- `Card`, `CardHeader`, `CardContent`, `CardTitle` (shadcn/ui)
- `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell` (shadcn/ui)
- `Badge` (shadcn/ui)
- `Progress` (shadcn/ui)
- `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` (shadcn/ui)
- `Select` (shadcn/ui)
- `Switch` (shadcn/ui)
- `Button` (shadcn/ui)
- `StatisticsCards` (from Reports page)
- `PriorityBadge` (existing)
- `UserAvatar` (existing)
- Chart.js library (already installed)

---

## 🎨 Design Principles

### 1. **Data Density vs Readability**
- Balance between showing comprehensive data and maintaining readability
- Use progressive disclosure (expand/collapse sections)
- Prioritize most important metrics at the top

### 2. **Color Coding System**
- **Green**: Success, completion, on-track
- **Orange/Yellow**: Warning, due soon, medium risk
- **Red**: Danger, overdue, high risk
- **Blue**: Neutral information, in-progress
- **Gray**: Inactive, unassigned, low priority

### 3. **Responsive Design**
- Desktop (> 1024px): Full 2-column chart layout
- Tablet (768-1024px): Stacked charts, scrollable table
- Mobile (< 768px): Single column, compact cards
- All touch targets minimum 44x44px

### 4. **Performance Considerations**
- Lazy load charts (render only visible charts)
- Virtualize long lists (department table, task cards)
- Debounce filter changes (300ms)
- Cache division data (5 minutes stale time)
- Show loading skeletons during data fetch

### 5. **Accessibility**
- Semantic HTML structure
- ARIA labels for charts and interactive elements
- Keyboard navigation support
- High contrast mode compatible
- Screen reader friendly

---

## 🔗 Integration Points

### 1. **Navigation Integration**
```typescript
// src/components/layout/navbar.tsx
// Add "กลุ่มงาน" to menu (between Dashboard and Department Tasks)
{
  name: "กลุ่มงาน",
  href: `/division/tasks?divisionId=${user.divisionId}`,
  icon: Building2,
  permission: ["ADMIN", "CHIEF", "LEADER"],
}
```

### 2. **Breadcrumb Integration**
```typescript
// src/stores/use-navigation-store.ts
// Add division state
divisionId: string | null;
divisionName: string | null;

// Add setter
setDivision: (divisionId: string, divisionName: string) => void;
```

### 3. **Permission Integration**
```typescript
// src/lib/permissions.ts
// Add division-level permissions
export async function canAccessDivision(
  userId: string,
  divisionId: string
): Promise<boolean> {
  const scope = await getUserAccessibleScope(userId);
  return scope.isAdmin || scope.divisionIds.includes(divisionId);
}
```

### 4. **React Query Integration**
```typescript
// src/hooks/use-division-overview.ts
export function useDivisionOverview(
  divisionId: string,
  filters: DivisionFilters,
  options?: UseQueryOptions
) {
  return useQuery({
    queryKey: divisionKeys.overview(divisionId, filters),
    queryFn: () => api.get(`/api/divisions/${divisionId}/overview`, { params: filters }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

export const divisionKeys = {
  all: ['divisions'] as const,
  overview: (divisionId: string, filters: DivisionFilters) =>
    [...divisionKeys.all, 'overview', divisionId, filters] as const,
};
```

---

## 📱 Mobile Considerations

### Mobile-Specific Adjustments:

1. **Stats Cards**: Stack vertically (1 column)
2. **Department Table**:
   - Convert to card list view
   - Show key metrics only
   - Tap card to expand details
3. **Charts**:
   - Stack vertically
   - Reduce height (200px → 180px)
   - Simplify legends
4. **Critical Tasks**:
   - Single column cards
   - Swipe to see more tabs
5. **Filters**:
   - Collapsible drawer
   - Touch-friendly controls

---

## 🚀 Implementation Phases

### Phase 1: Foundation (2-3 days)
- [ ] Create API endpoint `/api/divisions/{divisionId}/overview`
- [ ] Create React Query hook `use-division-overview.ts`
- [ ] Create page file `src/app/(dashboard)/division/tasks/page.tsx`
- [ ] Create `DivisionView` main component
- [ ] Create `DivisionToolbar` component
- [ ] Add navigation menu item
- [ ] Add breadcrumb integration

### Phase 2: Stats & Table (2-3 days)
- [ ] Implement Stats Cards section
- [ ] Create `DepartmentComparisonTable` component
- [ ] Create `DepartmentRow` component
- [ ] Add sorting functionality
- [ ] Add color-coded risk levels
- [ ] Add responsive table handling

### Phase 3: Charts (3-4 days)
- [ ] Create `DivisionCharts` container
- [ ] Implement `CompletionTrendChart` (Line chart)
- [ ] Implement `WorkloadDistributionChart` (Bar chart)
- [ ] Implement `PriorityDistributionChart` (Doughnut chart)
- [ ] Implement `StatusDistributionChart` (Stacked bar)
- [ ] Add chart interactions (tooltips, legends)
- [ ] Add responsive chart sizing

### Phase 4: Critical Tasks (2 days)
- [ ] Create `CriticalTasksSection` component
- [ ] Create `CriticalTaskCard` component
- [ ] Implement 4 tabs (Overdue, Urgent, Due Soon, Unassigned)
- [ ] Add task filtering logic
- [ ] Add click-to-open Task Panel
- [ ] Add quick assign functionality

### Phase 5: Polish & Testing (2 days)
- [ ] Add loading states and skeletons
- [ ] Add error handling and empty states
- [ ] Mobile responsiveness testing
- [ ] Performance optimization
- [ ] Accessibility audit
- [ ] Type-check validation
- [ ] Integration testing

**Total Estimated Time**: 11-14 days

---

## 📝 Success Metrics

### Performance Targets:
- Initial page load: < 2 seconds
- Chart render time: < 500ms
- Filter change response: < 300ms
- Table sort: < 100ms

### User Experience:
- Zero accessibility violations
- 100% keyboard navigable
- Mobile-friendly (all features work on touch devices)
- No layout shifts (CLS < 0.1)

### Data Accuracy:
- Stats match sum of department data
- Charts accurately represent data
- Real-time updates via React Query
- Consistent with Department Tasks View data

---

## 🔮 Future Enhancements (Version 2.0)

1. **Export Functionality**
   - Export division report to PDF
   - Export table data to Excel
   - Schedule automatic reports

2. **Advanced Analytics**
   - Predictive completion dates
   - Trend analysis with ML
   - Anomaly detection
   - Benchmark against industry standards

3. **Resource Planning**
   - Workload forecasting
   - Personnel allocation recommendations
   - Project prioritization suggestions
   - Budget tracking integration

4. **Real-time Updates**
   - WebSocket integration for live data
   - Push notifications for critical changes
   - Collaborative indicators (who's viewing)

5. **Custom Views**
   - Save filter presets
   - Custom dashboard layouts
   - Personal KPI tracking
   - Team performance comparisons

---

## 📚 References

### Existing Patterns to Follow:
1. **Department Tasks View** (`src/components/views/department-tasks/`) - Table layout, filters
2. **Reports Page** (`src/app/(dashboard)/reports/`) - Charts, stats cards
3. **Dashboard** (`src/app/(dashboard)/dashboard/`) - Widget layout, cards
4. **List View** (`src/components/views/list-view/`) - Task display, inline editing

### External Inspirations:
1. **Monday.com** - Executive dashboard design
2. **Asana** - Portfolio overview
3. **Jira** - Multi-project view
4. **ClickUp** - Hierarchy navigation
5. **Notion** - Data visualization

---

## ✅ Checklist for Implementation

### Before Starting:
- [ ] Review existing codebase patterns
- [ ] Understand permission system
- [ ] Study API response structures
- [ ] Set up development environment
- [ ] Review CLAUDE.md guidelines

### During Development:
- [ ] Follow TypeScript strict mode
- [ ] Use existing components where possible
- [ ] Implement optimistic updates
- [ ] Add loading states
- [ ] Handle error cases
- [ ] Write comprehensive type definitions
- [ ] Test on different screen sizes
- [ ] Verify accessibility

### Before Completion:
- [ ] Run `npm run type-check`
- [ ] Run `npm run build`
- [ ] Test all user interactions
- [ ] Verify permission checks
- [ ] Update CLAUDE.md with new features
- [ ] Document API endpoints
- [ ] Add integration tests

---

**End of Design Document**

**Version**: 1.0.0
**Last Updated**: 2025-10-30
**Status**: Ready for Implementation
