# Fiscal Year Filter Implementation Plan

**Feature**: Global Fiscal Year Filter (ปีงบประมาณ)
**Date**: 2025-10-29
**Status**: In Progress - Phase 1
**Estimated Total Time**: 8-12 hours

---

## 📋 Overview

Implement a global fiscal year filter that allows users to scope all data in the application to specific fiscal years. This filter will be applied at the backend level for optimal performance.

### Business Requirements

**Fiscal Year Definition (Thai Government):**
- **Start**: October 1st (1 ตุลาคม)
- **End**: September 30th (30 กันยายน) of the following year
- **Example**: Fiscal Year 2568 = Oct 1, 2024 - Sep 30, 2025

**Available Years:**
- Current fiscal year + 4 previous years
- Example (if today is 2025-10-29): [2564, 2565, 2566, 2567, 2568]

**Task Inclusion Criteria (OR logic):**
A task is included if ANY of these conditions are true:
1. `createdAt` falls within selected fiscal year(s)
2. `startDate` falls within selected fiscal year(s)
3. `dueDate` falls within selected fiscal year(s)

**Default Behavior:**
- Default selection: Current fiscal year only
- User can select multiple years (multiselect)
- Selection persists in localStorage
- Must have at least 1 year selected

---

## 🎯 Design Decisions

### 1. **Backend Filter (Not Frontend)**
**Reason**: Performance
- ✅ Database handles filtering (indexed queries)
- ✅ Transfers less data over network
- ✅ Scales to large datasets
- ❌ Frontend filtering requires fetching all data first

### 2. **Hybrid State Management**
**Zustand + localStorage persist**
- Zustand: In-memory state for fast access
- localStorage: Persist selection across sessions
- Auto-sync with React Query

### 3. **Default = Current Year Only**
**Reason**: UX + Performance
- Most users care about current year tasks
- Reduces initial data load
- Clear default behavior

### 4. **Scope, Not Filter**
**Terminology**:
- "Fiscal Year Scope" = defines working context
- Better UX than "filter" which implies hiding data

---

## 🏗️ Architecture

### Backend Layer

```
User selects years → Zustand store → React Query → API
                                                    ↓
                                          Backend builds WHERE clause
                                                    ↓
                                          PostgreSQL executes (indexed)
                                                    ↓
                                          Returns filtered data
```

### State Flow

```
localStorage ←→ Zustand Store ←→ React Query (query keys include fiscalYears)
                      ↓
              FiscalYearFilter Component (UI)
```

---

## 📦 Implementation Phases

### **Phase 1: Backend Foundation** (3-4 hours)

**Goal**: Add fiscal year filtering to backend APIs

**Tasks**:
1. ✅ Create `src/lib/fiscal-year.ts` utility
   - `getCurrentFiscalYear()` - Get current Thai fiscal year
   - `getFiscalYearRange(year)` - Get start/end dates
   - `buildFiscalYearFilter(years)` - Build Prisma WHERE clause

2. ✅ Create database index (Prisma migration)
   ```sql
   CREATE INDEX idx_tasks_fiscal_year_active
   ON tasks (createdAt, startDate, dueDate)
   WHERE deletedAt IS NULL;
   ```

3. ✅ Update API endpoints:
   - `GET /api/projects/:projectId/tasks` - Board/List/Calendar views
   - `GET /api/dashboard` - Dashboard widgets
   - `GET /api/departments/:departmentId/tasks` - Department tasks view
   - `GET /api/reports/tasks` - Reports page

**Query Parameter Format**:
```
?fiscalYears=2567,2568
```

**Acceptance Criteria**:
- All 4 APIs accept `fiscalYears` parameter
- Empty/missing = no filter (backward compatible)
- Returns only tasks matching criteria
- Type-check passes

---

### **Phase 2: Frontend Store** (1-2 hours)

**Goal**: Create Zustand store with localStorage persistence

**Files**:
- `src/stores/use-fiscal-year-store.ts`

**Features**:
- `selectedYears: number[]` - Array of selected fiscal years
- `setSelectedYears(years)` - Update selection
- `resetToCurrentYear()` - Reset to current year only
- `selectAllYears()` - Select all 5 available years
- localStorage persistence with key `fiscal-year-filter`

**Default State**:
```typescript
{
  selectedYears: [getCurrentFiscalYear()] // e.g., [2568]
}
```

**Acceptance Criteria**:
- State persists across page refresh
- Default is current year
- Cannot select empty array (min 1 year)

---

### **Phase 3: UI Component** (2-3 hours)

**Goal**: Create multiselect dropdown component

**Files**:
- `src/components/filters/fiscal-year-filter.tsx`

**Design**:
```
┌─────────────────────────────────────┐
│ [Filter Icon] ปีงบ 2568  [▼]       │ ← Trigger Button
└─────────────────────────────────────┘
         ↓ Click
┌─────────────────────────────────────┐
│ ปีงบประมาณ              [รีเซ็ต] │ ← Header
├─────────────────────────────────────┤
│ ☑ 2568 (ปีปัจจุบัน)     [✓]      │
│ ☐ 2567                             │
│ ☐ 2566                             │
│ ☐ 2565                             │
│ ☐ 2564                             │
├─────────────────────────────────────┤
│ [ทุกปี]  [ปีปัจจุบัน]             │ ← Footer
└─────────────────────────────────────┘
```

**Badge Display Logic**:
- 1 year: "2568"
- 2-3 years: "2567, 2568"
- 4-5 years: "5 ปี" or "ทุกปี"

**Position**: Navbar (after workspace selector, before search)

**Acceptance Criteria**:
- Multiselect with checkboxes
- Visual feedback for selected years
- Minimum 1 year required
- Responsive design

---

### **Phase 4: Integration** (1-2 hours)

**Goal**: Connect store to React Query hooks

**Files to Update**:
- `src/hooks/use-tasks.ts`
- `src/hooks/use-dashboard.ts`
- `src/hooks/use-department-tasks.ts`
- `src/hooks/use-reports.ts`

**Pattern**:
```typescript
export function useTasks(projectId: string) {
  const selectedYears = useFiscalYearStore(state => state.selectedYears);

  return useQuery({
    queryKey: taskKeys.list(projectId, { fiscalYears: selectedYears }),
    queryFn: async () => {
      const yearsParam = selectedYears.join(',');
      const response = await api.get(
        `/api/projects/${projectId}/tasks?fiscalYears=${yearsParam}`
      );
      return response.tasks;
    },
  });
}
```

**Query Key Updates**:
```typescript
// Include fiscalYears in query keys for proper caching
taskKeys.list(projectId, { fiscalYears: [2567, 2568] })
```

**Cache Invalidation**:
```typescript
// When user changes year selection → invalidate all queries
setSelectedYears(newYears);
queryClient.invalidateQueries({ queryKey: taskKeys.all });
```

**Acceptance Criteria**:
- Changing years triggers data refetch
- Query keys include fiscal years
- No duplicate requests
- Smooth transitions

---

### **Phase 5: Testing & Refinement** (1 hour)

**Goal**: Verify correctness and performance

**Test Cases**:

1. **Edge Cases**:
   - Task with null startDate/dueDate
   - Task spanning multiple years
   - Task created in one year, due in another
   - Switching from single year to multiple years
   - Switching from multiple years to single year

2. **Performance**:
   - Dashboard load time with 1 year vs 5 years
   - Verify database index is used (EXPLAIN query)
   - Network payload size comparison

3. **UX**:
   - localStorage persistence works
   - Default year is current fiscal year
   - Cannot deselect all years
   - Badge text updates correctly

4. **Integration**:
   - Board view respects filter
   - List view respects filter
   - Calendar view respects filter
   - Department tasks view respects filter
   - Dashboard widgets respect filter
   - Reports respect filter

**Performance Targets**:
- Dashboard load < 500ms (1 year)
- API response < 200ms (1 year)
- No N+1 queries

---

## 🗂️ File Structure

```
src/
├── lib/
│   └── fiscal-year.ts                    # NEW - Backend utilities
├── stores/
│   └── use-fiscal-year-store.ts          # NEW - Zustand store
├── components/
│   └── filters/
│       └── fiscal-year-filter.tsx        # NEW - UI component
├── hooks/
│   ├── use-tasks.ts                      # MODIFY - Add fiscalYears
│   ├── use-dashboard.ts                  # MODIFY - Add fiscalYears
│   ├── use-department-tasks.ts           # MODIFY - Add fiscalYears
│   └── use-reports.ts                    # MODIFY - Add fiscalYears
└── app/api/
    ├── projects/[projectId]/tasks/       # MODIFY - Accept fiscalYears
    ├── dashboard/                        # MODIFY - Accept fiscalYears
    ├── departments/[id]/tasks/           # MODIFY - Accept fiscalYears
    └── reports/tasks/                    # MODIFY - Accept fiscalYears
```

**Total**:
- 3 new files
- ~8 modified files

---

## 🔍 Technical Details

### Fiscal Year Calculation (Thai Buddhist Calendar)

```typescript
// Current date: 2024-10-29 (Christian)
// Current year (Buddhist): 2024 + 543 = 2567
// Current month: October (index 9)

// Fiscal year logic:
// If month >= October (9) → Next year
// If month < October → Current year

// Example:
// 2024-10-29 → Fiscal Year 2568 (Oct 1, 2024 - Sep 30, 2025)
// 2024-09-30 → Fiscal Year 2567 (Oct 1, 2023 - Sep 30, 2024)
```

### Database Query Example

```sql
-- Single year (2568)
SELECT * FROM tasks
WHERE deletedAt IS NULL
AND (
  (createdAt >= '2024-10-01' AND createdAt <= '2025-09-30')
  OR (startDate >= '2024-10-01' AND startDate <= '2025-09-30')
  OR (dueDate >= '2024-10-01' AND dueDate <= '2025-09-30')
);

-- Multiple years (2567, 2568)
SELECT * FROM tasks
WHERE deletedAt IS NULL
AND (
  -- Year 2567
  (createdAt >= '2023-10-01' AND createdAt <= '2024-09-30')
  OR (startDate >= '2023-10-01' AND startDate <= '2024-09-30')
  OR (dueDate >= '2023-10-01' AND dueDate <= '2024-09-30')
  -- Year 2568
  OR (createdAt >= '2024-10-01' AND createdAt <= '2025-09-30')
  OR (startDate >= '2024-10-01' AND startDate <= '2025-09-30')
  OR (dueDate >= '2024-10-01' AND dueDate <= '2025-09-30')
);
```

### Prisma WHERE Clause Example

```typescript
// buildFiscalYearFilter([2567, 2568]) returns:
{
  OR: [
    // Year 2567
    { createdAt: { gte: new Date('2023-10-01'), lte: new Date('2024-09-30T23:59:59') } },
    { startDate: { gte: new Date('2023-10-01'), lte: new Date('2024-09-30T23:59:59') } },
    { dueDate: { gte: new Date('2023-10-01'), lte: new Date('2024-09-30T23:59:59') } },
    // Year 2568
    { createdAt: { gte: new Date('2024-10-01'), lte: new Date('2025-09-30T23:59:59') } },
    { startDate: { gte: new Date('2024-10-01'), lte: new Date('2025-09-30T23:59:59') } },
    { dueDate: { gte: new Date('2024-10-01'), lte: new Date('2025-09-30T23:59:59') } },
  ]
}
```

---

## ⚠️ Potential Issues & Solutions

### Issue 1: Query Performance with Multiple Years

**Problem**: Selecting 5 years = 15 OR conditions (3 fields × 5 years)

**Solution**:
1. Database index on (createdAt, startDate, dueDate)
2. Limit to 5 years max (already enforced in UI)
3. Use EXPLAIN to verify index usage

### Issue 2: Confusing UX When Filtered

**Problem**: User forgets filter is active, wonders why data is missing

**Solutions**:
1. ✅ Visual indicator: Badge shows "กรองตามปีงบ 2567, 2568"
2. ✅ Highlight filter button when non-default selection
3. ✅ Show selected years in badge
4. ✅ Easy reset button

### Issue 3: Tasks Without Dates

**Problem**: Tasks with null startDate and dueDate

**Solution**:
- Still included if `createdAt` is in range
- All tasks have `createdAt` (NOT NULL in schema)

### Issue 4: Multi-Year Tasks

**Problem**: Task starts in 2567, ends in 2568

**Solution**:
- OR logic ensures it appears in both years
- Expected behavior: selecting 2567 OR 2568 shows the task

---

## 🎨 UI/UX Considerations

### Visual Design

**Button States**:
```typescript
// Default (current year only)
[Filter] ปีงบ 2568 ▼
         ^^^^^^^^^^^
         border-border (normal)

// Filtered (non-default selection)
[Filter] ปีงบ 2567, 2568 ▼
         ^^^^^^^^^^^^^^^^^
         border-primary text-primary (highlighted)
```

**Badge Text Examples**:
- 1 year: "ปีงบ 2568"
- 2 years: "ปีงบ 2567, 2568"
- 3 years: "ปีงบ 2566, 2567, 2568"
- 5 years: "ปีงบ ทุกปี" or "ปีงบ 5 ปี"

### Accessibility

- Keyboard navigation support
- Screen reader friendly
- Clear focus states
- Logical tab order

---

## 📊 Success Metrics

### Performance
- ✅ Dashboard loads in < 500ms (1 year selected)
- ✅ API responses < 200ms
- ✅ Database queries use index (verify with EXPLAIN)

### UX
- ✅ Default is current year (intuitive)
- ✅ Selection persists across sessions
- ✅ Visual feedback for active filter
- ✅ Easy to reset to default

### Correctness
- ✅ All test cases pass
- ✅ Edge cases handled correctly
- ✅ No duplicate data
- ✅ Consistent across all views

---

## 🔄 Future Enhancements (Post-MVP)

### Phase 6: Additional Features (Optional)

1. **Quick Presets**:
   - "ปีนี้" (current year)
   - "ปีที่แล้ว" (previous year)
   - "2 ปีล่าสุด" (last 2 years)

2. **Custom Date Range**:
   - Allow selecting arbitrary date ranges
   - Not tied to fiscal year boundaries

3. **URL Sync**:
   - Add fiscal years to URL query params
   - Shareable filtered views

4. **Analytics**:
   - Track which years users view most
   - Inform data retention policies

---

## 📝 Notes

### Migration Strategy

**Backward Compatibility**:
- APIs work without `fiscalYears` parameter
- Missing parameter = no filter (show all data)
- Gradual rollout: Backend → Store → UI

**Data Migration**:
- No database schema changes required
- Only need to add index
- All existing data compatible

### Testing Strategy

1. **Unit Tests**:
   - `fiscal-year.ts` utilities
   - `buildFiscalYearFilter()` edge cases

2. **Integration Tests**:
   - API endpoints with various fiscalYears params
   - Store persistence

3. **E2E Tests**:
   - User selects year → data updates
   - Refresh page → selection persists

---

## 🚀 Deployment Checklist

**Before Deploy**:
- [ ] All phases completed
- [ ] Type-check passes
- [ ] Build succeeds locally
- [ ] Manual testing on dev server
- [ ] Performance benchmarks meet targets
- [ ] Documentation updated

**After Deploy**:
- [ ] Monitor API response times
- [ ] Check database query performance
- [ ] User feedback collection
- [ ] Analytics tracking enabled

---

## 📚 References

- Thai Fiscal Year: October 1 - September 30
- Buddhist Calendar: Christian Year + 543
- Prisma Docs: [Filtering and Sorting](https://www.prisma.io/docs/concepts/components/prisma-client/filtering-and-sorting)
- Zustand Persist: [Persist Middleware](https://github.com/pmndrs/zustand#persist-middleware)

---

**Last Updated**: 2025-10-29
**Current Phase**: Phase 1 - Backend Foundation
**Next Milestone**: Complete fiscal-year.ts utility
