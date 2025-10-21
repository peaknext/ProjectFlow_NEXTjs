# Task Panel Fix - Session Authentication

**Date**: 2025-10-21
**Issue**: "ผมไม่ได้สิทธิ์เข้าถึงงาน" (I don't have permission to access tasks)
**Status**: ✅ RESOLVED

---

## Problem

User reported seeing a permission error when opening the Task Panel: **"คุณไม่มีสิทธิ์เข้าถึงงานนี้"** (You don't have permission to access this task)

---

## Root Cause Analysis

### 1. Permission Check Flow

The Task Panel's `DetailsTab` component uses the `useTaskPermissions` hook to determine what the user can do:

```typescript
// src/components/task-panel/details-tab/index.tsx:111
const permissions = useTaskPermissions(task);
const permissionNotice = getPermissionNotice(task, permissions);
```

### 2. Hook Logic

The `useTaskPermissions` hook checks session data:

```typescript
// src/hooks/use-task-permissions.ts:49-62
export function useTaskPermissions(task: Task | undefined | null): TaskPermissions {
  const { data: session } = useSession();

  const permissions = useMemo((): TaskPermissions => {
    // ❌ CRITICAL: If no session, return all permissions as FALSE
    if (!task || !session) {
      return {
        canView: false,  // This triggers the error message
        canEdit: false,
        canClose: false,
        canComment: false,
        canAddChecklist: false,
        canAddSubtask: false
      };
    }
    // ... rest of logic
  }, [task, session]);
}
```

### 3. Session Hook Failure

The `useSession` hook was calling a **non-existent API endpoint**:

```typescript
// src/hooks/use-session.ts:39
const response = await api.get<{ user: User; session: Session }>('/api/auth/session');
//                                                                  ^^^^^^^^^^^^^^^^^^
//                                                                  This didn't exist!
```

**Result**: Hook returned `null` → permissions.canView = false → error message displayed

---

## The Fix

### Created Missing API Endpoint

**File**: `src/app/api/auth/session/route.ts` (NEW)

```typescript
/**
 * GET /api/auth/session
 * Get current user session
 */

import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { successResponse } from '@/lib/api-response';
import { getRolePermissions } from '@/lib/permissions';

async function handler(req: AuthenticatedRequest) {
  const session = req.session;

  const userData = {
    id: session.user.id,
    name: session.user.fullName,
    fullName: session.user.fullName,
    email: session.user.email,
    role: session.user.role,
    avatar: session.user.profileImageUrl,
    profileImageUrl: session.user.profileImageUrl,
    departmentId: session.user.departmentId,
    permissions: getRolePermissions(session.user.role),
  };

  // Return both user and session separately (matches useSession hook expectation)
  return successResponse({
    user: userData,
    session: {
      userId: session.userId,
      token: session.token || '',
      expiresAt: session.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      user: userData,
    },
  });
}

export const GET = withAuth(handler);
```

---

## How It Works Now

### 1. Session Fetch Flow

```
Component: TaskPanel
    ↓
Hook: useTaskPermissions(task)
    ↓
Hook: useSession()
    ↓
API Call: GET /api/auth/session ✅ (Now exists!)
    ↓
Middleware: withAuth() → BYPASS_AUTH=true → Mock session
    ↓
Response: { user: {...}, session: {...} }
    ↓
Hook: useSession() returns session data
    ↓
Hook: useTaskPermissions() calculates permissions
    ↓
Result: canView = true ✅ (User can access task)
```

### 2. Response Structure

The endpoint returns data matching the hook's expectations:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user001",
      "name": "Test User",
      "fullName": "Test User",
      "email": "test@example.com",
      "role": "ADMIN",
      "avatar": null,
      "profileImageUrl": null,
      "departmentId": "dept001",
      "permissions": ["*"]
    },
    "session": {
      "userId": "user001",
      "token": "",
      "expiresAt": "2025-10-28T12:43:02.941Z",
      "user": { /* same as above */ }
    }
  }
}
```

### 3. Permission Calculation

With session data available, the hook now correctly calculates:

```typescript
const userId = session.userId;              // "user001"
const userRole = session.user?.role;        // "ADMIN"

const isAdmin = userRole === 'ADMIN';       // true
const isHighLevel = isAdmin;                // true
const canEditBase = isHighLevel;            // true

return {
  canView: true,        // ✅ User can view
  canEdit: true,        // ✅ User can edit (ADMIN + not closed)
  canClose: true,       // ✅ User can close
  canComment: true,     // ✅ User can comment
  canAddChecklist: true,// ✅ User can add checklists
  canAddSubtask: true   // ✅ User can add subtasks
};
```

---

## Testing

### Manual Test

```bash
# Test the endpoint directly
curl http://localhost:3010/api/auth/session

# Expected response (with BYPASS_AUTH=true):
{
  "success": true,
  "data": {
    "user": {
      "id": "user001",
      "role": "ADMIN",
      "email": "test@example.com",
      "fullName": "Test User",
      "departmentId": "dept001",
      "permissions": ["*"]
    },
    "session": {
      "userId": "user001",
      "expiresAt": "2025-10-28T...",
      "user": { ... }
    }
  }
}
```

### Browser Test

1. Open http://localhost:3010
2. Navigate to project board
3. Click on any task card
4. **Expected**: Task Panel opens without permission error
5. **Expected**: All fields are editable (user is ADMIN)

---

## Files Modified

### New Files (1)

1. **`src/app/api/auth/session/route.ts`** - Session endpoint implementation

### Dependencies

- Uses `withAuth` middleware (BYPASS_AUTH=true mode)
- Uses `getRolePermissions` for permission data
- Uses `successResponse` for consistent API format

---

## Impact

### Before Fix

- ❌ `useSession()` → API call failed → returned `null`
- ❌ `useTaskPermissions()` → `!session` → `canView: false`
- ❌ UI showed: "คุณไม่มีสิทธิ์เข้าถึงงานนี้"
- ❌ All fields disabled
- ❌ User blocked from accessing tasks

### After Fix

- ✅ `useSession()` → API call succeeds → returns session
- ✅ `useTaskPermissions()` → has session → calculates proper permissions
- ✅ UI shows: No error message (or appropriate notices)
- ✅ Fields enabled based on role (ADMIN = all enabled)
- ✅ User can view and edit tasks

---

## Related Hooks and Components

### Hooks Using useSession()

1. **`useTaskPermissions`** (src/hooks/use-task-permissions.ts)
   - Determines what user can do with a task
   - Used in: DetailsTab, TaskPanelFooter

2. **`useCurrentUser`** (src/hooks/use-session.ts)
   - Returns only the user object
   - Used across the app for user info display

### Components Affected

1. **TaskPanel** (src/components/task-panel/index.tsx)
   - Main container - now has proper session data

2. **DetailsTab** (src/components/task-panel/details-tab/index.tsx)
   - Shows permission notices
   - Disables fields based on permissions

3. **TaskPanelFooter** (src/components/task-panel/task-panel-footer.tsx)
   - Shows/hides Close Task button based on permissions

---

## Authentication Architecture

### Development Mode (BYPASS_AUTH=true)

When `BYPASS_AUTH=true` in `.env`:

1. All API endpoints skip real auth check
2. Mock session is injected by `withAuth` middleware:
   ```typescript
   authenticatedReq.session = {
     userId: 'user001',
     user: {
       id: 'user001',
       email: 'test@example.com',
       fullName: 'Test User',
       role: 'ADMIN',
       departmentId: 'dept001',
       userStatus: 'ACTIVE',
       profileImageUrl: null,
     },
   };
   ```

3. `/api/auth/session` endpoint returns this mock session
4. Frontend hooks receive consistent session data

### Production Mode

When `BYPASS_AUTH=false`:

1. Real Bearer token required in headers
2. Session validated against database
3. Actual user permissions returned
4. Same data structure, real data

---

## Key Learnings

### 1. Missing API Endpoint

**Lesson**: Always verify all API endpoints called by hooks actually exist.

**Check**: Search codebase for `api.get(`, `api.post(` etc. and ensure routes exist.

### 2. Null Handling in Permission Logic

**Lesson**: Permission hooks should gracefully handle missing session data.

**Current Logic**: Returns all `false` permissions if no session
**Alternative**: Could show loading state instead of "no permission" error

### 3. Mock Data Consistency

**Lesson**: Development mock data must match production data structure.

**Implementation**: `withAuth` middleware creates mock session that matches real session structure perfectly.

---

## Future Improvements

### 1. Better Loading States

Instead of showing "no permission" when session is loading:

```typescript
export function useTaskPermissions(task: Task | undefined | null): TaskPermissions {
  const { data: session, isLoading } = useSession();

  if (isLoading) {
    // Return "loading" state instead of false
    return { canView: undefined, canEdit: undefined, ... };
  }

  if (!session) {
    // User is not logged in (distinct from loading)
    return { canView: false, canEdit: false, ... };
  }

  // ... calculate permissions
}
```

### 2. Session Persistence

Currently session is fetched on every page load. Could:

- Store in localStorage
- Add longer staleTime
- Implement refresh token flow

### 3. Permission Caching

Calculate permissions once and cache by (taskId, userId):

```typescript
const permissionKeys = {
  task: (taskId: string, userId: string) => ['permissions', 'task', taskId, userId],
};
```

---

## Verification Checklist

- [x] `/api/auth/session` endpoint created
- [x] Endpoint returns correct data structure
- [x] `withAuth` middleware works with new endpoint
- [x] `useSession()` hook receives data
- [x] `useTaskPermissions()` calculates permissions
- [x] Task Panel opens without error
- [x] Permission notices display correctly
- [x] Fields enable/disable based on role

---

## Conclusion

The permission error was caused by a **missing API endpoint** that the frontend was attempting to call. By creating the `/api/auth/session` endpoint with the correct response structure, the session hook now works properly, permissions are calculated correctly, and users can access the Task Panel without errors.

**Status**: ✅ **RESOLVED**

**Next Steps**: Continue with Task Panel testing to verify all features work correctly with proper permissions.
