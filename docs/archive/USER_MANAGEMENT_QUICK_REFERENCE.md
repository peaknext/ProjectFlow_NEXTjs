# User Management - Quick Reference Card

**For:** Developers implementing user management system
**Duration:** 3-4 days (18-24 hours)
**Files:** 13 new files, ~2,520 lines of code

---

## 📁 Files to Create

```
✅ Phase 1 (2-3h): Hooks
   └─ src/hooks/use-users.ts (400 lines)

✅ Phase 2 (6-8h): User Management Page
   ├─ src/types/user.ts (100 lines)
   ├─ src/app/(dashboard)/users/page.tsx (50 lines)
   ├─ src/app/(dashboard)/users/loading.tsx (30 lines)
   ├─ src/app/(dashboard)/users/error.tsx (40 lines)
   ├─ src/components/users/users-view.tsx (300 lines)
   ├─ src/components/users/users-filter-bar.tsx (200 lines)
   ├─ src/components/users/users-table.tsx (150 lines)
   ├─ src/components/users/user-row.tsx (200 lines)
   └─ src/components/users/users-pagination.tsx (100 lines)

✅ Phase 3 (3-4h): Create User Modal
   └─ src/components/modals/create-user-modal.tsx (500 lines)

✅ Phase 4 (3-4h): Edit User Modal
   └─ src/components/modals/edit-user-modal.tsx (450 lines)

✅ Bonus (3-4h): Bulk Actions + Export
   └─ src/components/users/bulk-action-bar.tsx (150 lines)
```

---

## ⚡ Implementation Checklist (Priority 1-2)

### Day 1 (8 hours)
- [ ] ✅ **Phase 1**: React Query Hooks (2-3h)
  - [ ] Create query keys
  - [ ] Implement useUsers, useUser
  - [ ] Implement useCreateUser, useUpdateUser
  - [ ] Implement useUpdateUserStatus, useDeleteUser
  - [ ] Test all hooks in React Query Devtools

- [ ] ✅ **Phase 2 Start**: Basic Setup (5-6h)
  - [ ] Create TypeScript types
  - [ ] Create page components (page, loading, error)
  - [ ] Create users-view main container
  - [ ] Create users-filter-bar

### Day 2 (8 hours)
- [ ] ✅ **Phase 2 Complete**: Table & Pagination (6-8h)
  - [ ] Create users-table component
  - [ ] Create user-row with optimistic status toggle
  - [ ] Create users-pagination
  - [ ] Test full user listing flow
  - [ ] Test search, filters, pagination

### Day 3 (6 hours)
- [ ] ✅ **Phase 3**: Create User Modal (3-4h)
  - [ ] Setup modal structure + form validation
  - [ ] Implement basic info form (email, password, name)
  - [ ] Implement organization selectors (MG → Div → Dept)
  - [ ] Test user creation flow

- [ ] ✅ **Phase 4 Start**: Edit Modal Setup (2-3h)
  - [ ] Setup modal structure with tabs
  - [ ] Implement profile tab
  - [ ] Test form pre-fill with user data

### Day 4 (6 hours)
- [ ] ✅ **Phase 4 Complete**: Edit Modal (2-3h)
  - [ ] Implement security tab
  - [ ] Test user editing flow
  - [ ] Test status changes

- [ ] ✅ **Bonus Features**: Bulk & Export (3-4h)
  - [ ] Add selection checkboxes
  - [ ] Create bulk action bar
  - [ ] Implement bulk status change
  - [ ] Implement CSV export
  - [ ] Final testing

---

## 🔑 Key Patterns

### 1. Query Keys Structure
```typescript
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters) => [...userKeys.lists(), filters] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id) => [...userKeys.details(), id] as const,
};
```

### 2. Optimistic Update Pattern
```typescript
const mutation = useSyncMutation({
  mutationFn: async (data) => api.patch(`/api/users/${id}`, data),
  onMutate: async (variables) => {
    await queryClient.cancelQueries({ queryKey });
    const previous = queryClient.getQueryData(queryKey);
    queryClient.setQueryData(queryKey, (old) => ({ ...old, ...variables }));
    return { previous };
  },
  onError: (err, variables, context) => {
    if (context?.previous) {
      queryClient.setQueryData(queryKey, context.previous);
    }
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey });
  },
});
```

### 3. Role Colors
```typescript
const ROLE_COLORS = {
  ADMIN: 'bg-purple-100 text-purple-800 dark:bg-purple-900',
  CHIEF: 'bg-red-100 text-red-800 dark:bg-red-900',
  LEADER: 'bg-orange-100 text-orange-800 dark:bg-orange-900',
  HEAD: 'bg-blue-100 text-blue-800 dark:bg-blue-900',
  MEMBER: 'bg-green-100 text-green-800 dark:bg-green-900',
  USER: 'bg-gray-100 text-gray-800 dark:bg-gray-700',
};
```

### 4. Form Validation Schema
```typescript
const createUserSchema = z.object({
  email: z.string().email('กรุณากรอกอีเมลที่ถูกต้อง'),
  password: z.string()
    .min(8, 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร')
    .regex(/[a-z]/, 'ต้องมีตัวพิมพ์เล็ก')
    .regex(/[A-Z]/, 'ต้องมีตัวพิมพ์ใหญ่')
    .regex(/[0-9]/, 'ต้องมีตัวเลข')
    .regex(/[^a-zA-Z0-9]/, 'ต้องมีอักขระพิเศษ'),
  confirmPassword: z.string(),
  fullName: z.string().min(1, 'กรุณากรอกชื่อ-นามสกุล'),
  departmentId: z.string().min(1, 'กรุณาเลือกหน่วยงาน'),
  role: z.enum(['ADMIN', 'CHIEF', 'LEADER', 'HEAD', 'MEMBER', 'USER']),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'รหัสผ่านไม่ตรงกัน',
  path: ['confirmPassword'],
});
```

---

## 🧪 Testing Checklist

### Phase 1: Hooks
- [ ] All hooks return data correctly
- [ ] Mutations show sync animation
- [ ] Optimistic updates work
- [ ] Error handling works
- [ ] React Query Devtools shows correct queries

### Phase 2: User Management Page
- [ ] Page loads without errors
- [ ] Search works with 300ms debounce
- [ ] Role filter works
- [ ] Status filter works
- [ ] Pagination works (prev/next)
- [ ] Status toggle works (optimistic)
- [ ] Edit button opens modal
- [ ] Delete shows confirmation
- [ ] Permission checks work
- [ ] Dark mode works
- [ ] Mobile responsive

### Phase 3: Create User Modal
- [ ] Modal opens/closes correctly
- [ ] Email validation works
- [ ] Password strength meter shows
- [ ] Confirm password validates
- [ ] Cascade selectors work (MG → Div → Dept)
- [ ] Form submission creates user
- [ ] Duplicate email error shows
- [ ] Success toast displays
- [ ] User list refreshes

### Phase 4: Edit User Modal
- [ ] Modal opens with user data
- [ ] Form pre-fills correctly
- [ ] Profile tab edits work
- [ ] Security tab shows status
- [ ] Status change works with confirmation
- [ ] Role change shows warning
- [ ] Form saves correctly
- [ ] User list updates

### Bulk Actions & Export
- [ ] Checkboxes work
- [ ] Select all works
- [ ] Bulk action bar appears
- [ ] Bulk status change works
- [ ] CSV export downloads
- [ ] Thai encoding works (UTF-8 BOM)

---

## 🚨 Common Issues & Solutions

### Issue: TypeScript errors in hooks
**Solution:** Run `npm run prisma:generate` and restart TS server

### Issue: Status toggle not working
**Solution:** Check `canManageTargetUser()` permission in API

### Issue: Filters not updating
**Solution:** Verify query key invalidation, check debounce timer

### Issue: Modal not opening
**Solution:** Check UI store registration, verify modal imported in layout

### Issue: Form validation not working
**Solution:** Check Zod schema, verify React Hook Form setup

### Issue: Optimistic update not reverting on error
**Solution:** Check `onError` callback returns correct context

---

## 📊 Progress Tracking

Mark each item when complete:

```
Phase 1: React Query Hooks
  [_] Query Keys (15 min)
  [_] useUsers Hook (30 min)
  [_] useUser Hook (15 min)
  [_] useCreateUser Mutation (30 min)
  [_] useUpdateUser Mutation (30 min)
  [_] useUpdateUserStatus Mutation (30 min)
  [_] useDeleteUser Mutation (20 min)
  [_] useBulkUpdateUsers Mutation (20 min)
  [_] Testing (30 min)

Phase 2: User Management Page
  [_] TypeScript Types (30 min)
  [_] Main Page (30 min)
  [_] Users Filter Bar (1.5h)
  [_] Users Table (1h)
  [_] User Row Component (2h)
  [_] Pagination Component (30 min)
  [_] Main Users View (1.5h)
  [_] Testing (1h)

Phase 3: Create User Modal
  [_] Modal Structure (30 min)
  [_] Basic Info Form (1h)
  [_] Organization Selectors (1h)
  [_] Form Integration (30 min)
  [_] Testing (30 min)

Phase 4: Edit User Modal
  [_] Modal Structure (30 min)
  [_] Profile Tab (1h)
  [_] Security Tab (1h)
  [_] Testing (30 min)

Bonus: Bulk & Export
  [_] Selection Checkbox (30 min)
  [_] Bulk Action Bar (1h)
  [_] Integration (30 min)
  [_] Export Button (1h)
  [_] Final Testing (1h)
```

**Total Progress: [__] / 23 steps**

---

## 🎯 Final Acceptance Criteria

**Before marking complete, verify:**

✅ **Functional**
- [ ] All CRUD operations work
- [ ] Search, filters, pagination work
- [ ] Status toggle instant with rollback
- [ ] Bulk actions work correctly
- [ ] CSV export works with Thai encoding

✅ **Technical**
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] Optimistic updates rollback on error
- [ ] Sync animation plays
- [ ] Query cache properly invalidated
- [ ] Permission checks enforced

✅ **UI/UX**
- [ ] Loading states show skeletons
- [ ] Empty states show messages
- [ ] Error states show clear messages
- [ ] Toast notifications display
- [ ] Dark mode works
- [ ] Mobile responsive (tablet minimum)
- [ ] Keyboard navigation works

✅ **Performance**
- [ ] Page load < 1 second
- [ ] Filter updates < 100ms (debounced)
- [ ] Status toggle feels instant
- [ ] Modal opens < 100ms
- [ ] No layout shifts

---

## 📖 Full Documentation

For detailed implementation steps, code examples, and troubleshooting:

1. **Main Plan**: `USER_MANAGEMENT_IMPLEMENTATION_PLAN.md` (Phase 1-3)
2. **Extended Plan**: `USER_MANAGEMENT_PHASE4_BULK_EXPORT.md` (Phase 4 + Bonus)
3. **Project Guide**: `CLAUDE.md` (Architecture overview)
4. **Reference**: `PROJECT_MANAGEMENT_PAGE_COMPLETE.md` (Similar implementation)

---

## 🚀 Quick Commands

```bash
# Start development
PORT=3010 npm run dev

# Visit user management page
http://localhost:3010/users

# Test user
Email: admin@hospital.test
Password: SecurePass123!

# Generate Prisma client (after schema changes)
npm run prisma:generate

# Open database GUI
npm run prisma:studio

# Check TypeScript errors
npx tsc --noEmit --skipLibCheck
```

---

**Document Version:** 1.0
**Created:** 2025-10-24
**Status:** Ready for Implementation
