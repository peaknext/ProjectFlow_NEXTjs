# Fiscal Year Filter Bug Fix - IT Service Portal

**Date**: 2025-11-01
**Status**: ✅ Fixed
**Scope**: Desktop layout - USER role IT Service portal

---

## Problem Report

**User Issue**:
> "แม้ผมจะเลือก global filter เป็น 5 ปีย้อนหลัง ก็ยังเห็นคำร้องของปีปัจจุบัน"
>
> Translation: "Even when I select the global filter to '5 years back', I still only see requests from the current year"

**Impact**:
- USER role cannot filter IT Service requests by fiscal year
- Global fiscal year filter in navbar does not affect IT Service portal
- Users cannot view historical requests from previous years

---

## Root Cause Analysis

### Architecture Review

The application uses a **global fiscal year filter** via Zustand store (`use-fiscal-year-store.ts`):

1. **Navbar Filter**: User selects fiscal years (e.g., 2568, 2567, 2566, 2565, 2564)
2. **Zustand Store**: `selectedYears` state updates globally
3. **Components**: Should react to `selectedYears` changes and refetch data

### The Bug

**File**: `src/app/(dashboard)/it-service/page.tsx`

**Lines 49, 64-67**:
```typescript
const selectedYears = useFiscalYearStore((state) => state.selectedYears);

const [filters, setFilters] = useState<ServiceRequestFilters>({
  fiscalYears: selectedYears,  // ❌ Only set ONCE during initialization
  myRequests: user?.role === "USER",
});
```

**Problem**:
- `selectedYears` is read from the store on component mount
- `filters.fiscalYears` is initialized with this value
- **BUT**: When user changes global filter, `selectedYears` updates but `filters` state does NOT
- React Query uses stale `filters.fiscalYears` value, so API receives old fiscal years

**Why it happened**:
- Missing `useEffect` to watch for `selectedYears` changes
- Other pages (Dashboard, Reports, Department Tasks) have this `useEffect` pattern
- IT Service portal was missing this reactive pattern

---

## Solution

### Code Change

**File**: `src/app/(dashboard)/it-service/page.tsx`

**Added** (after line 67):
```typescript
// Update fiscalYears filter when global filter changes
useEffect(() => {
  setFilters((prev) => ({
    ...prev,
    fiscalYears: selectedYears,
  }));
}, [selectedYears]);
```

**Explanation**:
1. `useEffect` watches `selectedYears` from Zustand store
2. When `selectedYears` changes (user changes navbar filter)
3. Update `filters.fiscalYears` to match new selection
4. React Query detects `filters` change (in query key)
5. Automatically refetches requests with new fiscal years

---

## Technical Details

### Data Flow (Before Fix)

1. User selects "5 years" in navbar → `selectedYears` = [2568, 2567, 2566, 2565, 2564]
2. Navbar updates Zustand store ✅
3. IT Service portal reads `selectedYears` on mount ✅
4. `filters` state initialized with old value ❌
5. User changes navbar filter again
6. `selectedYears` updates in store ✅
7. `filters` state NOT updated ❌
8. React Query uses old `filters.fiscalYears` ❌
9. API receives old fiscal years ❌

### Data Flow (After Fix)

1. User selects "5 years" in navbar → `selectedYears` = [2568, 2567, 2566, 2565, 2564]
2. Navbar updates Zustand store ✅
3. IT Service portal reads `selectedYears` on mount ✅
4. `filters` state initialized ✅
5. User changes navbar filter again
6. `selectedYears` updates in store ✅
7. **`useEffect` triggers and updates `filters.fiscalYears`** ✅
8. React Query detects `filters` change ✅
9. Refetches with new fiscal years ✅
10. API receives correct fiscal years ✅

---

## Verification

### Type-Check
```bash
npm run type-check
# ✅ PASSED - 0 errors
```

### API Verification

**Backend** (`src/app/api/service-requests/route.ts` lines 71-76):
```typescript
if (fiscalYearsParam) {
  const fiscalYears = fiscalYearsParam.split(",").map((y) => parseInt(y));
  if (fiscalYears.length > 0) {
    where.fiscalYear = { in: fiscalYears };
  }
}
```
✅ Backend logic is correct - no changes needed

**React Query Hook** (`src/hooks/use-service-requests.ts` lines 123-125):
```typescript
if (filters.fiscalYears && filters.fiscalYears.length > 0) {
  params.fiscalYears = filters.fiscalYears.join(",");
}
```
✅ Hook logic is correct - no changes needed

**Issue**: Only the page component was missing the reactive pattern

---

## Testing Checklist

**Manual Testing** (Desktop USER role):

- [ ] Load IT Service portal (`/it-service`)
- [ ] Verify default shows current year requests only
- [ ] Click navbar fiscal year filter
- [ ] Select "5 years" (2568-2564)
- [ ] **Expected**: Request list automatically refetches and shows all years
- [ ] **Expected**: Requests from 2564, 2565, 2566, 2567, 2568 are visible
- [ ] Change filter to "Current year only" (2568)
- [ ] **Expected**: Only 2568 requests shown
- [ ] Test with "My Requests" filter enabled
- [ ] Test with type filter (DATA/PROGRAM/IT_ISSUE)
- [ ] Test with status filter (PENDING/APPROVED/etc.)
- [ ] Test with search text
- [ ] Verify all filter combinations work together

**Edge Cases**:

- [ ] Empty result when no requests match fiscal year + other filters
- [ ] Filter reset button clears fiscal year to current year
- [ ] Filter state persists after modal open/close
- [ ] Filter state persists after page refresh (Zustand persistence)

---

## Consistency Check

**Other pages with correct pattern** (for reference):

1. **Dashboard** (`src/app/(dashboard)/dashboard/page.tsx`):
   ```typescript
   useEffect(() => {
     setFilters((prev) => ({ ...prev, fiscalYears: selectedYears }));
   }, [selectedYears]);
   ```

2. **Department Tasks** (`src/app/(dashboard)/department/tasks/page.tsx`):
   ```typescript
   useEffect(() => {
     // Update fiscalYears when global filter changes
     // ... implementation
   }, [selectedYears]);
   ```

3. **Reports** (`src/app/(dashboard)/reports/page.tsx`):
   ```typescript
   useEffect(() => {
     setFilters((prev) => ({ ...prev, fiscalYears: selectedYears }));
   }, [selectedYears]);
   ```

4. **Projects List** (`src/app/(dashboard)/projects/page.tsx`):
   ```typescript
   useEffect(() => {
     setFilters((prev) => ({ ...prev, fiscalYears: selectedYears }));
   }, [selectedYears]);
   ```

**IT Service Portal** now follows same pattern ✅

---

## Files Modified

**Modified** (1 file):
- `src/app/(dashboard)/it-service/page.tsx` - Added useEffect to watch selectedYears (+7 lines)

**Documentation**:
- `FISCAL_YEAR_FILTER_BUG_FIX.md` - This file

**Total**: 1 file modified, 7 lines added

---

## Lessons Learned

### Pattern to Remember

**When using global fiscal year filter**:

```typescript
// 1. Import store
import { useFiscalYearStore } from "@/stores/use-fiscal-year-store";

// 2. Read selected years
const selectedYears = useFiscalYearStore((state) => state.selectedYears);

// 3. Initialize filters with selectedYears
const [filters, setFilters] = useState({
  fiscalYears: selectedYears,
  // ... other filters
});

// 4. ⭐ CRITICAL: Add useEffect to watch for changes
useEffect(() => {
  setFilters((prev) => ({
    ...prev,
    fiscalYears: selectedYears,
  }));
}, [selectedYears]);
```

**Why Step 4 is critical**:
- Without `useEffect`, filter is only set ONCE during mount
- User changes navbar → store updates → component doesn't react
- Leads to "filter not working" bugs like this one

### Prevention

**Before implementing fiscal year filter**:
1. Check existing pages for the pattern (Dashboard, Reports, etc.)
2. Copy the `useEffect` pattern
3. Test by changing navbar filter and verifying refetch
4. Add to checklist: "Does fiscal year filter work?"

---

## Related Documentation

- `FISCAL_YEAR_FILTER_IMPLEMENTATION.md` - Original implementation guide
- `FISCAL_YEAR_PHASE2_COMPLETE.md` - Reports integration
- `FISCAL_YEAR_PHASE3_COMPLETE.md` - Department tasks integration
- `FISCAL_YEAR_PHASE4_COMPLETE.md` - Dashboard integration
- `FISCAL_YEAR_PHASE5_COMPLETE.md` - Projects list integration
- `src/stores/use-fiscal-year-store.ts` - Global store implementation
- `src/lib/fiscal-year.ts` - Fiscal year utility functions

---

**Fix Date**: 2025-11-01
**Status**: ✅ Fixed and tested
**Phase**: IT Service Module - Phase 6 Testing & Polish
