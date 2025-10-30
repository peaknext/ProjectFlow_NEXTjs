# Division View - Design Consistency Guidelines

**Version**: 1.0.0
**Date**: 2025-10-30
**Purpose**: Ensure Division View matches existing app design patterns

---

## 📐 Layout Patterns (from Department Tasks View)

### Toolbar Standard:
```tsx
// Pattern: DepartmentToolbar
<div className="bg-card border-b flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-6 py-4 flex-shrink-0">
  {/* Left: Breadcrumb + Title */}
  <div className="min-w-0">
    <Breadcrumb className="mb-1" workspace={workspaceData} projects={projects} />
    <h1 className="text-2xl font-bold">{title}</h1>
  </div>

  {/* Right: Action buttons */}
  <div className="flex items-center gap-2 sm:gap-4 w-full md:w-auto justify-end">
    {/* Buttons */}
  </div>
</div>
```

**Key Properties:**
- `bg-card border-b` - Card background with bottom border
- `flex-col md:flex-row` - Stack on mobile, row on desktop
- `px-6 py-4` - Consistent padding
- `gap-4` - Spacing between items
- `flex-shrink-0` - Prevent toolbar from shrinking

---

## 📊 Stats Cards Pattern (from Reports)

### Grid Layout:
```tsx
<div className="grid gap-2 md:gap-4 grid-cols-4">
  {cards.map((card) => (
    <Card key={card.title} className="overflow-hidden">
      {/* Card content */}
    </Card>
  ))}
</div>
```

### Card Structure:
```tsx
<Card className="overflow-hidden">
  <CardHeader className="pb-2 md:pb-3 px-3 md:px-6 pt-3 md:pt-6 min-h-[60px] md:min-h-[70px]">
    <div className="flex items-start justify-between gap-1">
      <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground leading-tight">
        {card.title}
      </CardTitle>
      <div className={`p-1 md:p-2 rounded-lg ${card.bgColor} ${card.darkBgColor} flex-shrink-0`}>
        <Icon className={`h-3 w-3 md:h-4 md:w-4 ${card.iconColor}`} />
      </div>
    </div>
  </CardHeader>
  <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
    <div className="text-xl md:text-3xl font-bold">{card.value}</div>
    <p className="text-xs text-muted-foreground mt-1">{card.subtitle}</p>
  </CardContent>
</Card>
```

**Key Properties:**
- `grid-cols-4` - Always 4 columns
- `gap-2 md:gap-4` - Responsive gaps
- `overflow-hidden` - Clip card content
- Icon background: `bg-{color}-500/10 dark:bg-{color}-500/20`
- Icon size: `h-3 w-3 md:h-4 md:w-4`
- Title: `text-xs md:text-sm font-medium text-muted-foreground`
- Value: `text-xl md:text-3xl font-bold`
- Subtitle: `text-xs text-muted-foreground mt-1`

---

## 🎨 Color System

### Standard Colors (from existing components):

| Purpose | Color Class | Usage |
|---------|-------------|-------|
| **Success** | `text-green-600`, `bg-green-500/10` | Completed, on-track |
| **Warning** | `text-orange-600`, `bg-orange-500/10` | Due soon, medium risk |
| **Danger** | `text-red-600`, `bg-red-500/10` | Overdue, high risk |
| **Info** | `text-blue-600`, `bg-blue-500/10` | In-progress, neutral |
| **Muted** | `text-muted-foreground`, `bg-muted` | Secondary info |
| **Primary** | `text-primary`, `bg-primary` | Main actions |

### Department/Division Colors:
```typescript
// Auto-generate colors based on index
const colors = [
  { bg: 'bg-blue-500/10', text: 'text-blue-600', border: 'border-blue-200' },
  { bg: 'bg-green-500/10', text: 'text-green-600', border: 'border-green-200' },
  { bg: 'bg-purple-500/10', text: 'text-purple-600', border: 'border-purple-200' },
  { bg: 'bg-orange-500/10', text: 'text-orange-600', border: 'border-orange-200' },
  { bg: 'bg-pink-500/10', text: 'text-pink-600', border: 'border-pink-200' },
];

const color = colors[departmentIndex % colors.length];
```

---

## 📋 Table Pattern (from Department Tasks View)

### Table Structure:
```tsx
<Card>
  <CardHeader className="pb-4">
    <div className="flex items-center justify-between">
      <CardTitle className="text-base flex items-center gap-2">
        {title}
        <Badge variant="secondary">{count}</Badge>
      </CardTitle>
      {/* Optional: Stats or actions */}
    </div>
  </CardHeader>
  <CardContent className="p-0">
    <div className="border-t">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="cursor-pointer select-none" onClick={handleSort}>
              <div className="flex items-center">
                Column Name
                <ArrowUpDown className="ml-1 h-3 w-3 opacity-30" />
              </div>
            </TableHead>
            {/* More columns */}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.id} className="cursor-pointer hover:bg-accent/30">
              <TableCell>{item.value}</TableCell>
              {/* More cells */}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  </CardContent>
</Card>
```

**Key Properties:**
- CardContent: `p-0` - No padding (table fills card)
- Table wrapper: `border-t` - Top border separates from header
- TableHead: `cursor-pointer select-none` for sortable columns
- TableRow: `cursor-pointer hover:bg-accent/30` for interactive rows
- Sort icon: `h-3 w-3 opacity-30` (increases opacity when active)

---

## 📊 Chart Pattern (from Reports)

### Chart Container:
```tsx
<div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
  <Card>
    <CardHeader>
      <CardTitle className="text-base">{chartTitle}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="h-[300px] md:h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            {/* Chart config */}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </CardContent>
  </Card>
</div>
```

**Key Properties:**
- Grid: `grid-cols-1 lg:grid-cols-2` - 1 column mobile, 2 on desktop
- Chart height: `h-[300px] md:h-[350px]` - Responsive height
- CardTitle: `text-base` - Standard title size
- Always use `ResponsiveContainer` for charts

---

## 🏷️ Badge Pattern

### Priority Badges (existing PriorityBadge component):
```tsx
<PriorityBadge priority={task.priority} size="sm" />
```

### Status Badges:
```tsx
<Badge
  style={{
    backgroundColor: status.color + '20',
    borderColor: status.color,
    color: status.color,
  }}
  variant="outline"
>
  {status.name}
</Badge>
```

### Count Badges:
```tsx
<Badge variant="secondary" className="ml-2">
  {count}
</Badge>
```

**Key Properties:**
- Use `variant="outline"` for custom colors
- Use `variant="secondary"` for count badges
- Apply opacity `20` to backgroundColor for subtle effect

---

## 👤 Avatar Pattern (existing UserAvatar component)

### Single Avatar:
```tsx
<UserAvatar user={user} size="md" />
```

### Stacked Avatars (from AssigneePopover):
```tsx
<div className="flex items-center">
  {visibleUsers.map((user, index) => (
    <div
      key={user.id}
      className={cn(index > 0 && '-ml-2')}
      style={{ zIndex: visibleUsers.length - index }}
    >
      <UserAvatar
        user={user}
        size="sm"
        className="border-2 border-white dark:border-background"
      />
    </div>
  ))}
  {remainingCount > 0 && (
    <div className="flex items-center justify-center rounded-full bg-muted h-8 w-8 -ml-2 border-2 border-white dark:border-background text-xs font-semibold text-muted-foreground">
      +{remainingCount}
    </div>
  )}
</div>
```

---

## 🎯 Filter Pattern (from Reports Toolbar)

### Select Filters:
```tsx
<div className="flex items-center gap-4 flex-wrap">
  <div className="flex-shrink-0">
    <Label className="text-sm font-medium mb-2 block">
      กลุ่มงาน
    </Label>
    <Select
      value={filters.divisionId || "all"}
      onValueChange={handleDivisionChange}
    >
      <SelectTrigger className="w-[200px] h-10">
        <SelectValue placeholder="ทั้งหมด" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">ทั้งหมด</SelectItem>
        {divisions.map((div) => (
          <SelectItem key={div.id} value={div.id}>
            {div.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
</div>
```

**Key Properties:**
- Wrapper: `flex items-center gap-4 flex-wrap`
- Each filter: `flex-shrink-0`
- Label: `text-sm font-medium mb-2 block`
- SelectTrigger: `w-[200px] h-10` (consistent sizing)
- Always include "ทั้งหมด" (All) option with value="all"

---

## 📱 Responsive Patterns

### Breakpoints (Tailwind standard):
- `sm:` - 640px (mobile landscape)
- `md:` - 768px (tablet)
- `lg:` - 1024px (desktop)
- `xl:` - 1280px (large desktop)

### Common Responsive Classes:

| Element | Mobile | Desktop |
|---------|--------|---------|
| Stats Grid | `grid-cols-1 sm:grid-cols-2` | `lg:grid-cols-4` |
| Chart Grid | `grid-cols-1` | `lg:grid-cols-2` |
| Text | `text-xs` | `md:text-sm` |
| Padding | `px-3 py-2` | `md:px-6 md:py-4` |
| Gap | `gap-2` | `md:gap-4` |
| Button Size | `h-8` | `md:h-10` |

---

## 🔗 Integration Consistency

### Import Paths (always use aliases):
```typescript
import { Component } from "@/components/...";  // ✅ Correct
import { Component } from "../../components/...";  // ❌ Wrong
```

### Component Naming:
```typescript
// Page components: PascalCase + "Page"
export default function DivisionTasksPage() { }

// View components: PascalCase + "View"
export function DivisionView() { }

// Toolbar components: PascalCase + "Toolbar"
export function DivisionToolbar() { }

// Hook files: kebab-case with "use-" prefix
// use-division-overview.ts
export function useDivisionOverview() { }
```

### File Structure:
```
src/
├── app/(dashboard)/division/tasks/
│   └── page.tsx                           # Route file
├── components/
│   ├── views/division-tasks/
│   │   ├── division-view.tsx              # Main view
│   │   ├── department-comparison-table.tsx
│   │   ├── department-row.tsx
│   │   ├── division-charts.tsx
│   │   └── critical-tasks-section.tsx
│   └── layout/
│       └── division-toolbar.tsx           # Toolbar
├── hooks/
│   └── use-division-overview.ts           # Data fetching
└── types/
    └── division.ts                        # Type definitions
```

---

## ✅ Division View Specific Adjustments

### Stats Cards for Division:
```tsx
// Use 4 cards matching existing pattern
const cards = [
  {
    title: "หน่วยงานทั้งหมด",
    value: stats.totalDepartments,
    subtitle: `${stats.activeDepartments} ทำงานอยู่`,
    icon: Building2,
    bgColor: "bg-blue-500/10",
    iconColor: "text-blue-500",
    darkBgColor: "dark:bg-blue-500/20",
  },
  {
    title: "โครงการทั้งหมด",
    value: stats.totalProjects,
    subtitle: `${stats.activeProjects} กำลังดำเนินการ`,
    icon: FolderKanban,
    bgColor: "bg-green-500/10",
    iconColor: "text-green-500",
    darkBgColor: "dark:bg-green-500/20",
  },
  {
    title: "งานทั้งหมด",
    value: stats.totalTasks,
    subtitle: `${stats.completedTasks} เสร็จแล้ว`,
    icon: CheckSquare,
    bgColor: "bg-purple-500/10",
    iconColor: "text-purple-500",
    darkBgColor: "dark:bg-purple-500/20",
  },
  {
    title: "อัตราความสำเร็จเฉลี่ย",
    value: `${Math.round(stats.avgCompletionRate)}%`,
    subtitle: `${stats.trend.direction === 'up' ? '↑' : '↓'} ${stats.trend.value}% จากเดือนก่อน`,
    icon: TrendingUp,
    bgColor: "bg-orange-500/10",
    iconColor: "text-orange-500",
    darkBgColor: "dark:bg-orange-500/20",
  },
];
```

### Department Comparison Table Row Colors:
```tsx
// Risk-based row coloring
const getRiskColor = (overdueTasks: number, totalTasks: number) => {
  const overduePercentage = (overdueTasks / totalTasks) * 100;

  if (overduePercentage < 10) {
    return ""; // Normal (no color)
  } else if (overduePercentage < 20) {
    return "bg-yellow-50 dark:bg-yellow-950/20"; // Medium risk
  } else {
    return "bg-red-50 dark:bg-red-950/20"; // High risk
  }
};

<TableRow className={cn(
  "cursor-pointer hover:bg-accent/30",
  getRiskColor(dept.taskStats.overdue, dept.taskStats.total)
)}>
  {/* Cells */}
</TableRow>
```

---

## 📝 Code Style Guidelines

### TypeScript:
```typescript
// Always define interfaces for props
interface DivisionViewProps {
  divisionId: string;
  // ...
}

// Use explicit return types for functions
export function DivisionView({ divisionId }: DivisionViewProps): JSX.Element {
  // ...
}

// Use const for components
export const DepartmentRow = ({ department }: { department: Department }) => {
  // ...
};
```

### React Patterns:
```typescript
// Use useMemo for expensive computations
const sortedDepartments = useMemo(() => {
  return departments.sort((a, b) => a.name.localeCompare(b.name, 'th'));
}, [departments]);

// Use useCallback for event handlers passed to children
const handleDepartmentClick = useCallback((deptId: string) => {
  router.push(`/department/tasks?departmentId=${deptId}`);
}, [router]);

// Destructure props at function signature
export function Component({ prop1, prop2 }: Props) {
  // Not: const { prop1, prop2 } = props;
}
```

### JSX Formatting:
```tsx
// Use semantic HTML
<nav>...</nav>
<main>...</main>
<section>...</section>

// Self-closing tags
<Component />

// Multi-line attributes (3+ props)
<Component
  prop1={value1}
  prop2={value2}
  prop3={value3}
/>

// Conditional rendering - use &&
{isVisible && <Component />}

// Conditional classes - use cn() from utils
<div className={cn(
  "base-class",
  isActive && "active-class",
  variant === "primary" && "primary-class"
)}>
```

---

## 🎯 Key Takeaways

### DO:
✅ Follow existing component patterns exactly
✅ Use consistent spacing (gap-2 md:gap-4)
✅ Use consistent colors (bg-{color}-500/10)
✅ Use consistent responsive breakpoints
✅ Reuse existing components (Card, Badge, Table, etc.)
✅ Match existing toolbar structure
✅ Match existing stats card structure
✅ Use Thai language for all UI text
✅ Use consistent icon sizes (h-3 w-3 md:h-4 md:w-4)
✅ Use consistent padding (px-3 md:px-6)

### DON'T:
❌ Create new layout patterns
❌ Use different color schemes
❌ Use different spacing values
❌ Use absolute positioning (use flex/grid)
❌ Hardcode colors (use Tailwind classes)
❌ Use English in UI (only Thai)
❌ Mix icon sizes
❌ Forget responsive classes

---

## ✅ Pre-Implementation Checklist

Before writing code, verify:
- [ ] Reviewed existing component patterns
- [ ] Understood color system
- [ ] Understood responsive breakpoints
- [ ] Reviewed table pattern
- [ ] Reviewed stats cards pattern
- [ ] Reviewed toolbar pattern
- [ ] Understand avatar stacking
- [ ] Understand badge variants
- [ ] Know import path aliases
- [ ] Know file naming conventions

---

**End of Design Consistency Guidelines**

**Version**: 1.0.0
**Status**: Ready for Implementation
**Next**: Start Phase 1 - API Endpoint + Foundation
