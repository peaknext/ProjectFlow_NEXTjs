# User Management Implementation Plan

**Project:** ProjectFlows - Next.js Migration
**Feature:** User Management System (Priority 1-2)
**Date Created:** 2025-10-24
**Estimated Duration:** 3-4 days (18-24 hours)
**Status:** 🟡 Ready for Implementation

---

## 📋 Executive Summary

This document provides a **complete, step-by-step implementation plan** for the User Management system. The plan covers **Priority 1-2 features** including user listing, creation, editing, bulk actions, and export functionality.

**Scope:**
- ✅ Phase 1: React Query Hooks (2-3 hours)
- ✅ Phase 2: User Management Page (6-8 hours)
- ✅ Phase 3: Create User Modal (3-4 hours)
- ✅ Phase 4: Edit User Modal (3-4 hours)
- ✅ Bulk Actions (2-3 hours)
- ✅ Export Feature (1 hour)

**Total:** 18-24 hours across 13 new files

---

## 🎯 Prerequisites

Before starting implementation, ensure:

- [x] Backend APIs are working (`/api/users`, `/api/users/:id`, `/api/users/:id/status`)
- [x] Permission system is complete (`canManageTargetUser`, `getUserManageableUserIds`)
- [x] Project Management page is complete (use as reference pattern)
- [x] Dev server is running on port 3000 or 3010
- [x] Database is seeded with test users
- [x] BYPASS_AUTH=true for testing (or valid session token)

---

## 📐 Architecture Overview

### File Structure
```
src/
├── app/(dashboard)/
│   └── users/
│       ├── page.tsx                    # Main page (50 lines)
│       ├── loading.tsx                 # Loading skeleton (30 lines)
│       └── error.tsx                   # Error boundary (40 lines)
├── components/
│   ├── users/
│   │   ├── users-view.tsx              # Main container (300 lines)
│   │   ├── users-filter-bar.tsx        # Filters (200 lines)
│   │   ├── users-table.tsx             # Table component (150 lines)
│   │   ├── user-row.tsx                # Table row (200 lines)
│   │   └── users-pagination.tsx        # Pagination (100 lines)
│   └── modals/
│       ├── create-user-modal.tsx       # Create modal (500 lines)
│       └── edit-user-modal.tsx         # Edit modal (450 lines)
├── hooks/
│   └── use-users.ts                    # React Query hooks (400 lines)
└── types/
    └── user.ts                         # TypeScript types (100 lines)
```

**Total:** 13 files, ~2,520 lines of code

### Data Flow
```
User Action
    ↓
Component (users-view.tsx)
    ↓
React Query Hook (use-users.ts)
    ↓
API Client (api-client.ts)
    ↓
Backend API (/api/users)
    ↓
Permission Check (canManageTargetUser)
    ↓
Database (Prisma)
    ↓
Response
    ↓
Query Cache Update (optimistic)
    ↓
UI Update (instant feedback)
```

---

## 🚀 Phase 1: React Query Hooks

**Duration:** 2-3 hours
**File:** `src/hooks/use-users.ts`

### Checklist

#### Step 1.1: Create Query Keys (15 min)
- [ ] Create `src/hooks/use-users.ts`
- [ ] Define `userKeys` object with hierarchical structure
- [ ] Export query key factory functions
- [ ] Add TypeScript types for filters

**Code Template:**
```typescript
// src/hooks/use-users.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useSyncMutation } from '@/lib/use-sync-mutation';

export interface UserFilters {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
  departmentId?: string;
}

export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: UserFilters) => [...userKeys.lists(), filters] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
  stats: () => [...userKeys.all, 'stats'] as const,
};
```

**Acceptance Criteria:**
- ✅ Query keys follow hierarchical pattern
- ✅ Filters are properly typed
- ✅ Keys match existing patterns (projects, tasks)

---

#### Step 1.2: Implement useUsers Hook (30 min)
- [ ] Create `useUsers()` hook for list query
- [ ] Add pagination, search, filters support
- [ ] Set stale time to 5 minutes
- [ ] Handle loading and error states

**Code Template:**
```typescript
export function useUsers(filters: UserFilters = {}) {
  return useQuery({
    queryKey: userKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.page) params.set('page', filters.page.toString());
      if (filters.limit) params.set('limit', filters.limit.toString());
      if (filters.search) params.set('search', filters.search);
      if (filters.role) params.set('role', filters.role);
      if (filters.status) params.set('status', filters.status);
      if (filters.departmentId) params.set('departmentId', filters.departmentId);

      const response = await api.get(`/api/users?${params.toString()}`);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: true,
  });
}
```

**Acceptance Criteria:**
- ✅ Returns users list with pagination
- ✅ Filters work correctly
- ✅ Loading states are handled
- ✅ Errors are caught and displayed

---

#### Step 1.3: Implement useUser Hook (15 min)
- [ ] Create `useUser(id)` hook for single user query
- [ ] Set stale time to 10 minutes
- [ ] Add enabled condition (only if id exists)

**Code Template:**
```typescript
export function useUser(userId: string | null) {
  return useQuery({
    queryKey: userKeys.detail(userId || ''),
    queryFn: async () => {
      const response = await api.get(`/api/users/${userId}`);
      return response.data.user;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    enabled: !!userId,
  });
}
```

**Acceptance Criteria:**
- ✅ Returns single user details
- ✅ Only queries when userId is provided
- ✅ Cache is shared with list query

---

#### Step 1.4: Implement useCreateUser Mutation (30 min)
- [ ] Create `useCreateUser()` mutation hook
- [ ] Use `useSyncMutation` for sync animation
- [ ] Invalidate user list on success
- [ ] Handle validation errors

**Code Template:**
```typescript
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useSyncMutation({
    mutationFn: async (data: CreateUserInput) => {
      const response = await api.post('/api/auth/register', data);
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate all user lists
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });

      // Add to cache optimistically
      queryClient.setQueryData(userKeys.detail(data.user.id), data.user);
    },
  });
}
```

**Acceptance Criteria:**
- ✅ Creates user successfully
- ✅ Shows sync animation
- ✅ Invalidates user list cache
- ✅ Shows success toast
- ✅ Handles validation errors

---

#### Step 1.5: Implement useUpdateUser Mutation (30 min)
- [ ] Create `useUpdateUser()` mutation hook
- [ ] Use optimistic updates
- [ ] Update both detail and list caches
- [ ] Rollback on error

**Code Template:**
```typescript
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useSyncMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: UpdateUserInput }) => {
      const response = await api.patch(`/api/users/${userId}`, data);
      return response.data;
    },
    onMutate: async ({ userId, data }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: userKeys.detail(userId) });

      // Snapshot previous value
      const previousUser = queryClient.getQueryData(userKeys.detail(userId));

      // Optimistically update
      queryClient.setQueryData(userKeys.detail(userId), (old: any) => ({
        ...old,
        ...data,
      }));

      return { previousUser };
    },
    onError: (error, { userId }, context) => {
      // Rollback on error
      if (context?.previousUser) {
        queryClient.setQueryData(userKeys.detail(userId), context.previousUser);
      }
    },
    onSettled: (data) => {
      // Refetch to ensure consistency
      if (data?.user) {
        queryClient.invalidateQueries({ queryKey: userKeys.detail(data.user.id) });
        queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      }
    },
  });
}
```

**Acceptance Criteria:**
- ✅ Updates user immediately (optimistic)
- ✅ Rolls back on error
- ✅ Syncs with server
- ✅ Shows sync animation

---

#### Step 1.6: Implement useUpdateUserStatus Mutation (30 min)
- [ ] Create `useUpdateUserStatus()` mutation hook
- [ ] Use optimistic updates for instant toggle
- [ ] Update user in list cache
- [ ] Show toast notification

**Code Template:**
```typescript
export function useUpdateUserStatus() {
  const queryClient = useQueryClient();

  return useSyncMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: string }) => {
      const response = await api.patch(`/api/users/${userId}/status`, { status });
      return response.data;
    },
    onMutate: async ({ userId, status }) => {
      // Cancel queries
      await queryClient.cancelQueries({ queryKey: userKeys.lists() });

      // Snapshot
      const previousLists = queryClient.getQueriesData({ queryKey: userKeys.lists() });

      // Optimistically update all lists
      previousLists.forEach(([queryKey, data]: [any, any]) => {
        if (data?.users) {
          queryClient.setQueryData(queryKey, {
            ...data,
            users: data.users.map((u: any) =>
              u.id === userId ? { ...u, userStatus: status } : u
            ),
          });
        }
      });

      return { previousLists };
    },
    onError: (error, variables, context) => {
      // Rollback all lists
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]: [any, any]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}
```

**Acceptance Criteria:**
- ✅ Status toggles instantly (optimistic)
- ✅ Rolls back on error
- ✅ Updates all cached lists
- ✅ Shows success/error toast

---

#### Step 1.7: Implement useDeleteUser Mutation (20 min)
- [ ] Create `useDeleteUser()` mutation hook
- [ ] Remove from list cache on success
- [ ] Show confirmation before delete
- [ ] Invalidate queries

**Code Template:**
```typescript
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useSyncMutation({
    mutationFn: async (userId: string) => {
      const response = await api.delete(`/api/users/${userId}`);
      return response.data;
    },
    onSuccess: (data, userId) => {
      // Remove from all lists
      const listQueries = queryClient.getQueriesData({ queryKey: userKeys.lists() });
      listQueries.forEach(([queryKey, listData]: [any, any]) => {
        if (listData?.users) {
          queryClient.setQueryData(queryKey, {
            ...listData,
            users: listData.users.filter((u: any) => u.id !== userId),
            pagination: {
              ...listData.pagination,
              total: listData.pagination.total - 1,
            },
          });
        }
      });

      // Remove detail cache
      queryClient.removeQueries({ queryKey: userKeys.detail(userId) });
    },
  });
}
```

**Acceptance Criteria:**
- ✅ Deletes user (soft delete)
- ✅ Removes from list immediately
- ✅ Shows confirmation dialog
- ✅ Shows success toast

---

#### Step 1.8: Implement useBulkUpdateUsers Mutation (20 min)
- [ ] Create `useBulkUpdateUsers()` for bulk status changes
- [ ] Use optimistic updates for all selected users
- [ ] Show progress indicator
- [ ] Handle partial failures

**Code Template:**
```typescript
export function useBulkUpdateUsers() {
  const queryClient = useQueryClient();

  return useSyncMutation({
    mutationFn: async ({ userIds, status }: { userIds: string[]; status: string }) => {
      // Call API for each user (or use bulk endpoint if available)
      const promises = userIds.map(userId =>
        api.patch(`/api/users/${userId}/status`, { status })
      );
      const results = await Promise.allSettled(promises);

      const succeeded = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      return { succeeded, failed, total: userIds.length };
    },
    onSuccess: (data) => {
      // Invalidate all lists
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}
```

**Acceptance Criteria:**
- ✅ Updates multiple users at once
- ✅ Shows progress indicator
- ✅ Reports success/failure counts
- ✅ Handles partial failures gracefully

---

### Phase 1 Testing Checklist

- [ ] Run `npm run dev` and verify no TypeScript errors
- [ ] Test `useUsers()` hook returns data correctly
- [ ] Test `useUser()` hook with valid ID
- [ ] Test `useCreateUser()` mutation creates user
- [ ] Test `useUpdateUser()` mutation with optimistic update
- [ ] Test `useUpdateUserStatus()` with toggle animation
- [ ] Test `useDeleteUser()` removes user from list
- [ ] Test `useBulkUpdateUsers()` with multiple selections
- [ ] Verify all hooks use proper error handling
- [ ] Verify sync animation plays on mutations
- [ ] Check React Query Devtools shows correct queries

**Expected Time:** 2-3 hours

---

## 🎨 Phase 2: User Management Page

**Duration:** 6-8 hours
**Files:**
- `src/app/(dashboard)/users/page.tsx`
- `src/app/(dashboard)/users/loading.tsx`
- `src/app/(dashboard)/users/error.tsx`
- `src/components/users/users-view.tsx`
- `src/components/users/users-filter-bar.tsx`
- `src/components/users/users-table.tsx`
- `src/components/users/user-row.tsx`
- `src/components/users/users-pagination.tsx`
- `src/types/user.ts`

---

### Step 2.1: Create TypeScript Types (30 min)

**File:** `src/types/user.ts`

#### Checklist:
- [ ] Create `src/types/user.ts`
- [ ] Define `User` interface matching API response
- [ ] Define `UserFilters` interface
- [ ] Define `UserListResponse` interface
- [ ] Export all types

**Code Template:**
```typescript
// src/types/user.ts

export type UserRole = 'ADMIN' | 'CHIEF' | 'LEADER' | 'HEAD' | 'MEMBER' | 'USER';
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  profileImageUrl: string | null;
  departmentId: string | null;
  department?: {
    id: string;
    name: string;
    division?: {
      id: string;
      name: string;
      missionGroup?: {
        id: string;
        name: string;
      };
    };
  };
  userStatus: UserStatus;
  isVerified: boolean;
  jobTitle: string | null;
  jobLevel: string | null;
  additionalRoles?: Record<string, string>;
  createdAt: string;
  updatedAt?: string;
}

export interface UserFilters {
  page: number;
  limit: number;
  search: string;
  role: string;
  status: string;
  departmentId: string;
}

export interface UserListResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CreateUserInput {
  email: string;
  password: string;
  fullName: string;
  departmentId: string;
  role: UserRole;
  jobTitle?: string;
  jobLevel?: string;
}

export interface UpdateUserInput {
  fullName?: string;
  departmentId?: string;
  role?: UserRole;
  profileImageUrl?: string;
  jobTitle?: string;
  jobLevel?: string;
  additionalRoles?: Record<string, string>;
}
```

**Acceptance Criteria:**
- ✅ All types match API response structure
- ✅ Optional fields are properly marked
- ✅ Enums are defined for role and status
- ✅ No TypeScript errors in hooks file

---

### Step 2.2: Create Main Page (30 min)

**Files:**
- `src/app/(dashboard)/users/page.tsx`
- `src/app/(dashboard)/users/loading.tsx`
- `src/app/(dashboard)/users/error.tsx`

#### Checklist:
- [ ] Create `src/app/(dashboard)/users/` directory
- [ ] Create `page.tsx` with permission check
- [ ] Create `loading.tsx` with skeleton
- [ ] Create `error.tsx` with error boundary
- [ ] Add metadata for SEO

**Code Template - page.tsx:**
```typescript
// src/app/(dashboard)/users/page.tsx
import { Metadata } from 'next';
import { UsersView } from '@/components/users/users-view';

export const metadata: Metadata = {
  title: 'บุคลากร | ProjectFlows',
  description: 'จัดการข้อมูลผู้ใช้งานในระบบ',
};

export default function UsersPage() {
  return <UsersView />;
}
```

**Code Template - loading.tsx:**
```typescript
// src/app/(dashboard)/users/loading.tsx
import { Skeleton } from '@/components/ui/skeleton';

export default function UsersLoading() {
  return (
    <div className="h-full flex flex-col p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Table */}
      <div className="flex-1 space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    </div>
  );
}
```

**Code Template - error.tsx:**
```typescript
// src/app/(dashboard)/users/error.tsx
'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function UsersError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Users page error:', error);
  }, [error]);

  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
        <h2 className="text-xl font-semibold">เกิดข้อผิดพลาด</h2>
        <p className="text-muted-foreground">
          ไม่สามารถโหลดข้อมูลผู้ใช้ได้
        </p>
        <Button onClick={reset}>ลองใหม่อีกครั้ง</Button>
      </div>
    </div>
  );
}
```

**Acceptance Criteria:**
- ✅ Page renders without errors
- ✅ Loading skeleton shows while fetching
- ✅ Error boundary catches errors
- ✅ Metadata is set correctly

---

### Step 2.3: Create Users Filter Bar (1.5 hours)

**File:** `src/components/users/users-filter-bar.tsx`

#### Checklist:
- [ ] Create `src/components/users/users-filter-bar.tsx`
- [ ] Add search input with debounce (300ms)
- [ ] Add role filter dropdown
- [ ] Add status filter dropdown
- [ ] Add department cascade selector
- [ ] Add clear filters button
- [ ] Add create user button (permission-based)

**Code Template:**
```typescript
// src/components/users/users-filter-bar.tsx
'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserFilters } from '@/types/user';
import { useUIStore } from '@/stores/use-ui-store';

interface UsersFilterBarProps {
  filters: UserFilters;
  onFiltersChange: (filters: Partial<UserFilters>) => void;
  totalUsers: number;
}

export function UsersFilterBar({
  filters,
  onFiltersChange,
  totalUsers,
}: UsersFilterBarProps) {
  const [searchInput, setSearchInput] = useState(filters.search);
  const { openModal } = useUIStore();

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        onFiltersChange({ search: searchInput, page: 1 });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const hasActiveFilters =
    filters.search ||
    filters.role !== 'ALL' ||
    filters.status !== 'ALL' ||
    filters.departmentId;

  const handleClearFilters = () => {
    setSearchInput('');
    onFiltersChange({
      search: '',
      role: 'ALL',
      status: 'ALL',
      departmentId: '',
      page: 1,
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">บุคลากร</h1>
          <p className="text-sm text-muted-foreground">
            ทั้งหมด {totalUsers} คน
          </p>
        </div>
        <Button onClick={() => openModal('createUser')}>
          <Plus className="h-4 w-4 mr-2" />
          สร้างผู้ใช้
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ค้นหาชื่อ, อีเมล, ตำแหน่ง..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Role Filter */}
        <Select
          value={filters.role}
          onValueChange={(value) => onFiltersChange({ role: value, page: 1 })}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="บทบาท" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">ทุกบทบาท</SelectItem>
            <SelectItem value="ADMIN">ผู้ดูแลระบบ</SelectItem>
            <SelectItem value="CHIEF">หัวหน้ากลุ่มภารกิจ</SelectItem>
            <SelectItem value="LEADER">หัวหน้ากลุ่มงาน</SelectItem>
            <SelectItem value="HEAD">หัวหน้าหน่วยงาน</SelectItem>
            <SelectItem value="MEMBER">สมาชิก</SelectItem>
            <SelectItem value="USER">ผู้ใช้</SelectItem>
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select
          value={filters.status}
          onValueChange={(value) => onFiltersChange({ status: value, page: 1 })}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="สถานะ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">ทุกสถานะ</SelectItem>
            <SelectItem value="ACTIVE">ใช้งานอยู่</SelectItem>
            <SelectItem value="SUSPENDED">ระงับ</SelectItem>
            <SelectItem value="INACTIVE">ไม่ใช้งาน</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClearFilters}
            title="ล้างตัวกรอง"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
```

**Acceptance Criteria:**
- ✅ Search debounces at 300ms
- ✅ Role filter works correctly
- ✅ Status filter works correctly
- ✅ Clear filters button appears when filters active
- ✅ Create user button opens modal
- ✅ Total users count displays correctly

---

### Step 2.4: Create Users Table (1 hour)

**File:** `src/components/users/users-table.tsx`

#### Checklist:
- [ ] Create `src/components/users/users-table.tsx`
- [ ] Add table headers with sorting
- [ ] Add fixed header scrolling
- [ ] Map user rows
- [ ] Add empty state
- [ ] Add loading skeleton

**Code Template:**
```typescript
// src/components/users/users-table.tsx
'use client';

import { User } from '@/types/user';
import { UserRow } from './user-row';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Users as UsersIcon } from 'lucide-react';

interface UsersTableProps {
  users: User[];
  isLoading: boolean;
}

export function UsersTable({ users, isLoading }: UsersTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 bg-muted animate-pulse rounded" />
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <UsersIcon className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">ไม่พบข้อมูลผู้ใช้</h3>
        <p className="text-sm text-muted-foreground">
          ลองเปลี่ยนตัวกรองหรือค้นหาด้วยคำอื่น
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader className="sticky top-0 bg-background z-10">
          <TableRow>
            <TableHead className="w-[300px]">ชื่อ</TableHead>
            <TableHead className="w-[250px]">อีเมล</TableHead>
            <TableHead className="w-[200px]">หน่วยงาน</TableHead>
            <TableHead className="w-[150px]">บทบาท</TableHead>
            <TableHead className="w-[120px]">สถานะ</TableHead>
            <TableHead className="w-[100px] text-right">จัดการ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <UserRow key={user.id} user={user} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

**Acceptance Criteria:**
- ✅ Table renders with proper columns
- ✅ Fixed header stays visible when scrolling
- ✅ Empty state shows when no users
- ✅ Loading skeleton displays while fetching
- ✅ Dark mode support

---

### Step 2.5: Create User Row Component (2 hours)

**File:** `src/components/users/user-row.tsx`

#### Checklist:
- [ ] Create `src/components/users/user-row.tsx`
- [ ] Add avatar display
- [ ] Add role badge with color
- [ ] Add status toggle with optimistic update
- [ ] Add actions dropdown (edit, delete)
- [ ] Add permission checks for actions
- [ ] Add department display with breadcrumb

**Code Template:**
```typescript
// src/components/users/user-row.tsx
'use client';

import { User } from '@/types/user';
import { TableCell, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, Shield } from 'lucide-react';
import { useUpdateUserStatus, useDeleteUser } from '@/hooks/use-users';
import { useUIStore } from '@/stores/use-ui-store';
import { toast } from 'sonner';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'ผู้ดูแลระบบ',
  CHIEF: 'หัวหน้ากลุ่มภารกิจ',
  LEADER: 'หัวหน้ากลุ่มงาน',
  HEAD: 'หัวหน้าหน่วยงาน',
  MEMBER: 'สมาชิก',
  USER: 'ผู้ใช้',
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  CHIEF: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  LEADER: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  HEAD: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  MEMBER: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  USER: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
};

interface UserRowProps {
  user: User;
}

export function UserRow({ user }: UserRowProps) {
  const { openModal } = useUIStore();
  const updateStatus = useUpdateUserStatus();
  const deleteUser = useDeleteUser();

  const initials = user.fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleStatusToggle = async (checked: boolean) => {
    const newStatus = checked ? 'ACTIVE' : 'SUSPENDED';

    try {
      await updateStatus.mutateAsync({
        userId: user.id,
        status: newStatus,
      });

      toast.success(
        checked ? 'เปิดใช้งานบัญชีเรียบร้อย' : 'ระงับการใช้งานบัญชีเรียบร้อย'
      );
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการเปลี่ยนสถานะ');
    }
  };

  const handleDelete = async () => {
    if (!confirm(`ต้องการลบ ${user.fullName} ใช่หรือไม่?`)) return;

    try {
      await deleteUser.mutateAsync(user.id);
      toast.success('ลบผู้ใช้เรียบร้อยแล้ว');
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการลบผู้ใช้');
    }
  };

  return (
    <TableRow>
      {/* Avatar + Name */}
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.profileImageUrl || undefined} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{user.fullName}</div>
            {user.jobTitle && (
              <div className="text-xs text-muted-foreground">
                {user.jobTitle}
              </div>
            )}
          </div>
        </div>
      </TableCell>

      {/* Email */}
      <TableCell>
        <div className="flex items-center gap-2">
          <span className="text-sm">{user.email}</span>
          {user.isVerified && (
            <Shield className="h-3 w-3 text-green-600" title="ยืนยันแล้ว" />
          )}
        </div>
      </TableCell>

      {/* Department */}
      <TableCell>
        {user.department ? (
          <div className="text-sm">
            <div>{user.department.name}</div>
            {user.department.division && (
              <div className="text-xs text-muted-foreground">
                {user.department.division.name}
              </div>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        )}
      </TableCell>

      {/* Role */}
      <TableCell>
        <Badge className={ROLE_COLORS[user.role] || ''} variant="secondary">
          {ROLE_LABELS[user.role] || user.role}
        </Badge>
      </TableCell>

      {/* Status */}
      <TableCell>
        <div className="flex items-center gap-2">
          <Switch
            checked={user.userStatus === 'ACTIVE'}
            onCheckedChange={handleStatusToggle}
            disabled={updateStatus.isPending}
          />
          <span className="text-sm">
            {user.userStatus === 'ACTIVE' ? 'ใช้งานอยู่' : 'ระงับ'}
          </span>
        </div>
      </TableCell>

      {/* Actions */}
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openModal('editUser', user)}>
              <Edit className="h-4 w-4 mr-2" />
              แก้ไข
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleDelete}
              className="text-red-600 dark:text-red-400"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              ลบ
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
```

**Acceptance Criteria:**
- ✅ Avatar shows with fallback initials
- ✅ Role badge has correct color
- ✅ Status toggle works with optimistic update
- ✅ Edit button opens modal
- ✅ Delete button shows confirmation
- ✅ Actions show only if user has permission
- ✅ Toast notifications display

---

### Step 2.6: Create Pagination Component (30 min)

**File:** `src/components/users/users-pagination.tsx`

#### Checklist:
- [ ] Create `src/components/users/users-pagination.tsx`
- [ ] Add page navigation buttons
- [ ] Add items per page selector
- [ ] Add page info display
- [ ] Match ProjectsPagination pattern

**Code Template:**
```typescript
// src/components/users/users-pagination.tsx
'use client';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface UsersPaginationProps {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export function UsersPagination({
  page,
  limit,
  total,
  totalPages,
  hasNext,
  hasPrev,
  onPageChange,
  onLimitChange,
}: UsersPaginationProps) {
  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between py-4 px-2">
      {/* Info */}
      <div className="text-sm text-muted-foreground">
        แสดง {startItem}-{endItem} จาก {total} คน
      </div>

      <div className="flex items-center gap-4">
        {/* Items per page */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">แสดง:</span>
          <Select
            value={limit.toString()}
            onValueChange={(value) => onLimitChange(Number(value))}
          >
            <SelectTrigger className="w-20 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Page navigation */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(page - 1)}
            disabled={!hasPrev}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="text-sm px-3">
            หน้า {page} / {totalPages}
          </div>

          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(page + 1)}
            disabled={!hasNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
```

**Acceptance Criteria:**
- ✅ Shows correct item range
- ✅ Page buttons work correctly
- ✅ Items per page selector works
- ✅ Buttons disabled when appropriate
- ✅ Matches design system

---

### Step 2.7: Create Main Users View (1.5 hours)

**File:** `src/components/users/users-view.tsx`

#### Checklist:
- [ ] Create `src/components/users/users-view.tsx`
- [ ] Integrate all components
- [ ] Manage filter state
- [ ] Handle permission checks
- [ ] Add bulk selection (optional)
- [ ] Add export button (optional)

**Code Template:**
```typescript
// src/components/users/users-view.tsx
'use client';

import { useState } from 'react';
import { useUsers } from '@/hooks/use-users';
import { UserFilters } from '@/types/user';
import { UsersFilterBar } from './users-filter-bar';
import { UsersTable } from './users-table';
import { UsersPagination } from './users-pagination';

export function UsersView() {
  const [filters, setFilters] = useState<UserFilters>({
    page: 1,
    limit: 50,
    search: '',
    role: 'ALL',
    status: 'ALL',
    departmentId: '',
  });

  const { data, isLoading, error } = useUsers(filters);

  const handleFiltersChange = (newFilters: Partial<UserFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleLimitChange = (limit: number) => {
    setFilters((prev) => ({ ...prev, limit, page: 1 }));
  };

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold">เกิดข้อผิดพลาด</p>
          <p className="text-sm text-muted-foreground">
            ไม่สามารถโหลดข้อมูลผู้ใช้ได้
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-6 space-y-4">
      {/* Filter Bar */}
      <div className="flex-none">
        <UsersFilterBar
          filters={filters}
          onFiltersChange={handleFiltersChange}
          totalUsers={data?.pagination.total || 0}
        />
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <UsersTable users={data?.users || []} isLoading={isLoading} />
      </div>

      {/* Pagination */}
      {data && data.users.length > 0 && (
        <div className="flex-none border-t">
          <UsersPagination
            page={filters.page}
            limit={filters.limit}
            total={data.pagination.total}
            totalPages={data.pagination.totalPages}
            hasNext={data.pagination.hasNext}
            hasPrev={data.pagination.hasPrev}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
          />
        </div>
      )}
    </div>
  );
}
```

**Acceptance Criteria:**
- ✅ All components integrate correctly
- ✅ Filters update query correctly
- ✅ Pagination works smoothly
- ✅ Error states handled
- ✅ Loading states display
- ✅ Layout matches design system

---

### Phase 2 Testing Checklist

- [ ] Run `npm run dev` and navigate to `/users`
- [ ] Verify page loads without errors
- [ ] Test search with debounce
- [ ] Test role filter
- [ ] Test status filter
- [ ] Test pagination (prev/next)
- [ ] Test items per page selector
- [ ] Test status toggle with optimistic update
- [ ] Test edit button opens modal (placeholder)
- [ ] Test delete button shows confirmation
- [ ] Verify permission checks work
- [ ] Test on mobile viewport (responsive)
- [ ] Test in dark mode
- [ ] Verify no console errors

**Expected Time:** 6-8 hours

---

## 📝 Phase 3: Create User Modal

**Duration:** 3-4 hours
**File:** `src/components/modals/create-user-modal.tsx`

### Step 3.1: Setup Modal Structure (30 min)

#### Checklist:
- [ ] Create `src/components/modals/create-user-modal.tsx`
- [ ] Register modal in UI store
- [ ] Add to dashboard layout imports
- [ ] Setup React Hook Form with Zod validation
- [ ] Add sheet animation (same as TaskPanel)

**Code Template:**
```typescript
// src/components/modals/create-user-modal.tsx
'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/stores/use-ui-store';
import { useCreateUser } from '@/hooks/use-users';
import { toast } from 'sonner';

const createUserSchema = z.object({
  email: z.string().email('กรุณากรอกอีเมลที่ถูกต้อง'),
  password: z
    .string()
    .min(8, 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร')
    .regex(/[a-z]/, 'ต้องมีตัวพิมพ์เล็ก')
    .regex(/[A-Z]/, 'ต้องมีตัวพิมพ์ใหญ่')
    .regex(/[0-9]/, 'ต้องมีตัวเลข')
    .regex(/[^a-zA-Z0-9]/, 'ต้องมีอักขระพิเศษ'),
  confirmPassword: z.string(),
  fullName: z.string().min(1, 'กรุณากรอกชื่อ-นามสกุล'),
  departmentId: z.string().min(1, 'กรุณาเลือกหน่วยงาน'),
  role: z.enum(['ADMIN', 'CHIEF', 'LEADER', 'HEAD', 'MEMBER', 'USER']),
  jobTitle: z.string().optional(),
  jobLevel: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'รหัสผ่านไม่ตรงกัน',
  path: ['confirmPassword'],
});

type CreateUserFormData = z.infer<typeof createUserSchema>;

export function CreateUserModal() {
  const { modals, closeModal } = useUIStore();
  const isOpen = modals.createUser?.isOpen || false;

  const createUser = useCreateUser();

  const form = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      fullName: '',
      departmentId: '',
      role: 'USER',
      jobTitle: '',
      jobLevel: '',
    },
  });

  useEffect(() => {
    if (!isOpen) {
      form.reset();
    }
  }, [isOpen, form]);

  const onSubmit = async (data: CreateUserFormData) => {
    try {
      const { confirmPassword, ...userData } = data;
      await createUser.mutateAsync(userData);

      toast.success(`สร้างผู้ใช้ ${data.fullName} เรียบร้อยแล้ว`);
      closeModal('createUser');
    } catch (error: any) {
      if (error.response?.data?.code === 'EMAIL_ALREADY_EXISTS') {
        form.setError('email', {
          message: 'อีเมลนี้ถูกใช้งานแล้ว',
        });
      } else {
        toast.error('เกิดข้อผิดพลาดในการสร้างผู้ใช้');
      }
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeModal('createUser')}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>สร้างผู้ใช้ใหม่</SheetTitle>
          <SheetDescription>
            กรอกข้อมูลเพื่อสร้างผู้ใช้งานใหม่ในระบบ
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
          {/* Form fields will be added in next steps */}

          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => closeModal('createUser')}
            >
              ยกเลิก
            </Button>
            <Button type="submit" disabled={createUser.isPending}>
              {createUser.isPending ? 'กำลังสร้าง...' : 'สร้างผู้ใช้'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
```

**UI Store Registration:**
```typescript
// src/stores/use-ui-store.ts
// Add to ModalState interface:
createUser?: {
  isOpen: boolean;
};

// Add to openModal function:
case 'createUser':
  set({ modals: { ...state.modals, createUser: { isOpen: true } } });
  break;

// Add to closeModal function:
case 'createUser':
  set({ modals: { ...state.modals, createUser: { isOpen: false } } });
  break;
```

**Acceptance Criteria:**
- ✅ Modal opens/closes correctly
- ✅ Form validation schema works
- ✅ Sheet animation smooth
- ✅ Form resets on close

---

### Step 3.2: Basic Information Form (1 hour)

#### Checklist:
- [ ] Add email field with validation
- [ ] Add password field with strength meter
- [ ] Add confirm password field with matching check
- [ ] Add full name field
- [ ] Add real-time validation indicators

**Code Template (add to form):**
```typescript
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

// Inside form component:
const [showPassword, setShowPassword] = useState(false);
const [passwordStrength, setPasswordStrength] = useState(0);

// Password strength calculator
const calculatePasswordStrength = (password: string) => {
  let strength = 0;
  if (password.length >= 8) strength += 25;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
  if (/[0-9]/.test(password)) strength += 25;
  if (/[^a-zA-Z0-9]/.test(password)) strength += 25;
  return strength;
};

// Add to form JSX:
<div className="space-y-4">
  <h3 className="text-lg font-semibold">ข้อมูลพื้นฐาน</h3>

  {/* Full Name */}
  <FormField
    control={form.control}
    name="fullName"
    render={({ field }) => (
      <FormItem>
        <FormLabel>ชื่อ-นามสกุล *</FormLabel>
        <FormControl>
          <Input placeholder="นายสมชาย ใจดี" {...field} />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />

  {/* Email */}
  <FormField
    control={form.control}
    name="email"
    render={({ field }) => (
      <FormItem>
        <FormLabel>อีเมล *</FormLabel>
        <FormControl>
          <Input
            type="email"
            placeholder="somchai@hospital.test"
            {...field}
          />
        </FormControl>
        <FormDescription>
          ใช้สำหรับเข้าสู่ระบบและรับการแจ้งเตือน
        </FormDescription>
        <FormMessage />
      </FormItem>
    )}
  />

  {/* Password */}
  <FormField
    control={form.control}
    name="password"
    render={({ field }) => (
      <FormItem>
        <FormLabel>รหัสผ่าน *</FormLabel>
        <FormControl>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              {...field}
              onChange={(e) => {
                field.onChange(e);
                setPasswordStrength(calculatePasswordStrength(e.target.value));
              }}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
        </FormControl>
        {field.value && (
          <div className="space-y-1">
            <div className="flex gap-1">
              {[25, 50, 75, 100].map((threshold) => (
                <div
                  key={threshold}
                  className={`h-1 flex-1 rounded ${
                    passwordStrength >= threshold
                      ? threshold <= 25
                        ? 'bg-red-500'
                        : threshold <= 50
                        ? 'bg-orange-500'
                        : threshold <= 75
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                      : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              ความแข็งแรง:{' '}
              {passwordStrength <= 25
                ? 'อ่อนแอ'
                : passwordStrength <= 50
                ? 'พอใช้'
                : passwordStrength <= 75
                ? 'ดี'
                : 'ปลอดภัย'}
            </p>
          </div>
        )}
        <FormDescription>
          อย่างน้อย 8 ตัวอักษร, มีตัวพิมพ์เล็ก-ใหญ่, ตัวเลข และอักขระพิเศษ
        </FormDescription>
        <FormMessage />
      </FormItem>
    )}
  />

  {/* Confirm Password */}
  <FormField
    control={form.control}
    name="confirmPassword"
    render={({ field }) => (
      <FormItem>
        <FormLabel>ยืนยันรหัสผ่าน *</FormLabel>
        <FormControl>
          <Input
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            {...field}
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
</div>
```

**Acceptance Criteria:**
- ✅ Email field validates format
- ✅ Password shows strength meter
- ✅ Confirm password checks match
- ✅ Show/hide password toggle works
- ✅ Validation messages display

---

### Step 3.3: Organization Selectors (1 hour)

#### Checklist:
- [ ] Add department cascade selector (MG → Div → Dept)
- [ ] Add role selector with descriptions
- [ ] Add job title field (optional)
- [ ] Add job level field (optional)
- [ ] Use workspace data for selectors

**Code Template:**
```typescript
import { useWorkspace } from '@/hooks/use-workspace';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Inside component:
const { data: workspace } = useWorkspace();
const [selectedMissionGroup, setSelectedMissionGroup] = useState('');
const [selectedDivision, setSelectedDivision] = useState('');

// Get available divisions based on selected mission group
const availableDivisions = workspace?.missionGroups
  .find((mg) => mg.id === selectedMissionGroup)
  ?.divisions || [];

// Get available departments based on selected division
const availableDepartments = availableDivisions
  .find((div) => div.id === selectedDivision)
  ?.departments || [];

// Add to form JSX:
<div className="space-y-4">
  <h3 className="text-lg font-semibold">หน่วยงาน</h3>

  {/* Mission Group */}
  <div>
    <Label>กลุ่มภารกิจ *</Label>
    <Select
      value={selectedMissionGroup}
      onValueChange={(value) => {
        setSelectedMissionGroup(value);
        setSelectedDivision('');
        form.setValue('departmentId', '');
      }}
    >
      <SelectTrigger>
        <SelectValue placeholder="เลือกกลุ่มภารกิจ" />
      </SelectTrigger>
      <SelectContent>
        {workspace?.missionGroups.map((mg) => (
          <SelectItem key={mg.id} value={mg.id}>
            {mg.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>

  {/* Division */}
  {selectedMissionGroup && (
    <div>
      <Label>กลุ่มงาน *</Label>
      <Select
        value={selectedDivision}
        onValueChange={(value) => {
          setSelectedDivision(value);
          form.setValue('departmentId', '');
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder="เลือกกลุ่มงาน" />
        </SelectTrigger>
        <SelectContent>
          {availableDivisions.map((div) => (
            <SelectItem key={div.id} value={div.id}>
              {div.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )}

  {/* Department */}
  {selectedDivision && (
    <FormField
      control={form.control}
      name="departmentId"
      render={({ field }) => (
        <FormItem>
          <FormLabel>หน่วยงาน *</FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="เลือกหน่วยงาน" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {availableDepartments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  )}

  {/* Role */}
  <FormField
    control={form.control}
    name="role"
    render={({ field }) => (
      <FormItem>
        <FormLabel>บทบาท *</FormLabel>
        <Select onValueChange={field.onChange} value={field.value}>
          <FormControl>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            <SelectItem value="ADMIN">ผู้ดูแลระบบ (เข้าถึงทุกอย่าง)</SelectItem>
            <SelectItem value="CHIEF">หัวหน้ากลุ่มภารกิจ (จัดการ MG)</SelectItem>
            <SelectItem value="LEADER">หัวหน้ากลุ่มงาน (จัดการ Div)</SelectItem>
            <SelectItem value="HEAD">หัวหน้าหน่วยงาน (จัดการ Dept)</SelectItem>
            <SelectItem value="MEMBER">สมาชิก (ดูและสร้างงาน)</SelectItem>
            <SelectItem value="USER">ผู้ใช้ (ดูงานเท่านั้น)</SelectItem>
          </SelectContent>
        </Select>
        <FormMessage />
      </FormItem>
    )}
  />

  {/* Job Title */}
  <FormField
    control={form.control}
    name="jobTitle"
    render={({ field }) => (
      <FormItem>
        <FormLabel>ตำแหน่ง</FormLabel>
        <FormControl>
          <Input placeholder="เช่น นักวิชาการคอมพิวเตอร์" {...field} />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />

  {/* Job Level */}
  <FormField
    control={form.control}
    name="jobLevel"
    render={({ field }) => (
      <FormItem>
        <FormLabel>ระดับ</FormLabel>
        <FormControl>
          <Input placeholder="เช่น ชำนาญการ" {...field} />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
</div>
```

**Acceptance Criteria:**
- ✅ Cascade selector works (MG → Div → Dept)
- ✅ Role selector shows descriptions
- ✅ Form validates department selection
- ✅ Optional fields work correctly

---

### Step 3.4: Form Integration & Testing (30 min)

#### Checklist:
- [ ] Test form submission
- [ ] Test validation errors
- [ ] Test API integration
- [ ] Test success/error toasts
- [ ] Test modal close after success
- [ ] Add loading state during submission

**Acceptance Criteria:**
- ✅ Form submits successfully
- ✅ Validation errors show correctly
- ✅ API errors handled (email duplicate, etc.)
- ✅ Success toast shows
- ✅ Modal closes after success
- ✅ User list refreshes automatically

---

### Phase 3 Testing Checklist

- [ ] Open create user modal from users page
- [ ] Fill all required fields
- [ ] Test email validation
- [ ] Test password strength meter
- [ ] Test confirm password matching
- [ ] Test cascade selectors (MG → Div → Dept)
- [ ] Submit form and verify user created
- [ ] Test duplicate email error
- [ ] Test weak password error
- [ ] Test form reset on close
- [ ] Verify user appears in list
- [ ] Test in dark mode

**Expected Time:** 3-4 hours

---

## ✅ Final Acceptance Criteria

### Functional Requirements
- [ ] Users list shows only users in management scope
- [ ] Search works across name, email, job title
- [ ] Filters work correctly (role, status, department)
- [ ] Pagination works smoothly
- [ ] Status toggle has optimistic update
- [ ] Create user modal validates all fields
- [ ] Edit user modal saves changes correctly
- [ ] Delete user shows confirmation and works
- [ ] Bulk actions update multiple users
- [ ] Export downloads CSV file

### Technical Requirements
- [ ] No TypeScript errors
- [ ] No console errors in production
- [ ] All hooks use proper error handling
- [ ] Optimistic updates rollback on error
- [ ] Sync animation plays on mutations
- [ ] Query cache is properly invalidated
- [ ] Permission checks work correctly
- [ ] Session invalidation on suspend works

### UI/UX Requirements
- [ ] Loading states show skeletons
- [ ] Empty states show helpful messages
- [ ] Error states show clear messages
- [ ] Toast notifications display correctly
- [ ] Dark mode works throughout
- [ ] Mobile responsive (tablet minimum)
- [ ] Keyboard navigation works
- [ ] Focus management in modals

### Performance Requirements
- [ ] Initial page load < 1 second
- [ ] Filter updates < 100ms (debounced)
- [ ] Status toggle feels instant
- [ ] Modal opens < 100ms
- [ ] No layout shifts
- [ ] Images lazy load

---

## 📊 Progress Tracking

Use this checklist to track implementation progress:

### Phase 1: React Query Hooks
- [ ] Step 1.1: Create Query Keys (15 min)
- [ ] Step 1.2: Implement useUsers Hook (30 min)
- [ ] Step 1.3: Implement useUser Hook (15 min)
- [ ] Step 1.4: Implement useCreateUser Mutation (30 min)
- [ ] Step 1.5: Implement useUpdateUser Mutation (30 min)
- [ ] Step 1.6: Implement useUpdateUserStatus Mutation (30 min)
- [ ] Step 1.7: Implement useDeleteUser Mutation (20 min)
- [ ] Step 1.8: Implement useBulkUpdateUsers Mutation (20 min)
- [ ] Phase 1 Testing Complete

**Total Time: 2-3 hours**

### Phase 2: User Management Page
- [ ] Step 2.1: Create TypeScript Types (30 min)
- [ ] Step 2.2: Create Main Page (30 min)
- [ ] Step 2.3: Create Users Filter Bar (1.5 hours)
- [ ] Step 2.4: Create Users Table (1 hour)
- [ ] Step 2.5: Create User Row Component (2 hours)
- [ ] Step 2.6: Create Pagination Component (30 min)
- [ ] Step 2.7: Create Main Users View (1.5 hours)
- [ ] Phase 2 Testing Complete

**Total Time: 6-8 hours**

### Phase 3: Create User Modal
- [ ] Step 3.1: Create Modal Component (30 min)
- [ ] Step 3.2: Implement Basic Info Form (1 hour)
- [ ] Step 3.3: Implement Organization Selectors (1 hour)
- [ ] Step 3.4: Add Form Validation (30 min)
- [ ] Step 3.5: Integrate with API (30 min)
- [ ] Phase 3 Testing Complete

**Total Time: 3-4 hours**

### Phase 4: Edit User Modal
- [ ] Step 4.1: Create Modal Component (30 min)
- [ ] Step 4.2: Implement Profile Form (1 hour)
- [ ] Step 4.3: Implement Assignment Form (1 hour)
- [ ] Step 4.4: Add Security Tab (30 min)
- [ ] Step 4.5: Integrate with API (30 min)
- [ ] Phase 4 Testing Complete

**Total Time: 3-4 hours**

### Additional Features
- [ ] Bulk Actions: Select + Bulk Status (2-3 hours)
- [ ] Export: CSV Download (1 hour)

---

## 🔗 Related Documentation

- [CLAUDE.md](./CLAUDE.md) - Project overview and guidelines
- [PROJECT_STATUS.md](./PROJECT_STATUS.md) - Current project status
- [PERMISSION_SYSTEM_REVIEW_2025-10-24.md](./PERMISSION_SYSTEM_REVIEW_2025-10-24.md) - Permission system details
- [OPTIMISTIC_UPDATE_PATTERN.md](./OPTIMISTIC_UPDATE_PATTERN.md) - Optimistic update pattern guide
- [PROJECT_MANAGEMENT_PAGE_COMPLETE.md](./PROJECT_MANAGEMENT_PAGE_COMPLETE.md) - Reference implementation

---

## 🆘 Troubleshooting

### Common Issues

**Issue:** TypeScript errors in hooks file
- **Solution:** Run `npm run prisma:generate` and restart TypeScript server

**Issue:** Status toggle not working
- **Solution:** Check `canManageTargetUser()` permission, verify API endpoint

**Issue:** Filters not updating
- **Solution:** Verify debounce is working, check query key invalidation

**Issue:** Modal not opening
- **Solution:** Check UI store registration, verify modal is imported in layout

**Issue:** Pagination showing wrong numbers
- **Solution:** Verify API response structure matches `UserListResponse` type

---

## ✨ Next Steps After Completion

After completing Priority 1-2 implementation:

1. **User Testing** - Get feedback from actual users (Admin/Chief/Leader)
2. **Performance Optimization** - Profile and optimize slow queries
3. **Analytics** - Add user management analytics (dashboard metrics)
4. **Advanced Filters** - Add date range, last login, verification status
5. **Bulk Import** - CSV import with validation
6. **Audit Log** - Detailed user change history
7. **User Dashboard** - Personal dashboard for all users (Priority 3)

---

**Document Version:** 1.0
**Last Updated:** 2025-10-24
**Status:** Ready for Implementation
