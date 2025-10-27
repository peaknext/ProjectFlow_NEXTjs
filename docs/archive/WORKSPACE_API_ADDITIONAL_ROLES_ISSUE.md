# Workspace API: Missing Additional Roles Support

**Date**: 2025-10-23
**Issue**: ADMIN/CHIEF users with `additionalRoles` cannot see all accessible Mission Groups
**Status**: 🔴 **CRITICAL BUG** - Permission system not matching GAS implementation
**Priority**: **HIGH** - Affects all users with multiple roles

---

## Problem Statement

The Next.js workspace API (`/api/workspace`) **does NOT support `additionalRoles`** field from the GAS system. This causes users with multiple roles across different departments to only see data from their primary role's scope.

### User Report

> "ผมเป็น admin แต่มองไม่เห็นทุกกลุ่มภารกิจใน workspace"
> Translation: "I'm admin but can't see all mission groups in workspace"

**Investigation Results:**
- Current user (user001) has role: **"LEADER"** (not ADMIN as user expected)
- Workspace API returned: **1 mission group** (user's division scope only)
- Database has: **No ADMIN users** (migration_data.json has no ADMIN role)

---

## Root Cause Analysis

### GAS Permission System (Original - CORRECT)

**From `util.PermissionUtils.html` and `DOCS_ORGANIZATION_HIERARCHY_PERMISSIONS.md`:**

```javascript
// GAS System: getUserAccessibleScope()
// Lines 211-308 in CreateProjectModal.html

// 1. Handle Admin special case
if (userRole === "admin") {
  return {
    isAdmin: true,
    missionGroupIds: [all MGs],
    divisionIds: [all divisions],
    departmentIds: [all departments]
  };
}

// 2. Build department → role mapping (PRIMARY + ADDITIONAL)
const departmentRoleMap = {};

// Add primary role
if (profile.departmentId) {
  departmentRoleMap[profile.departmentId] = userRole;
}

// Add additional roles ⭐ CRITICAL
if (profile.additionalRoles) {
  Object.entries(profile.additionalRoles).forEach(([role, deptId]) => {
    if (deptId) {
      departmentRoleMap[deptId] = role.toLowerCase();
    }
  });
}

// 3. Process EACH department with its SPECIFIC role
Object.entries(departmentRoleMap).forEach(([deptId, roleLevel]) => {
  const dept = orgData.departments.find(d => d.id === deptId);
  const division = orgData.divisions.find(d => d.id === dept.divisionId);

  if (roleLevel === 'chief') {
    // Add ENTIRE mission group
    accessibleMissionGroupIds.add(division.missionGroupId);
    // ... add all divisions and departments in MG
  } else if (roleLevel === 'leader') {
    // Add ENTIRE division
    accessibleDivisionIds.add(dept.divisionId);
    // ... add all departments in division
  } else if (roleLevel === 'head' || roleLevel === 'member') {
    // Add ONLY this department
    accessibleDepartmentIds.add(deptId);
  }
});

// 4. Return aggregated scope
return {
  isAdmin: false,
  missionGroupIds: Array.from(accessibleMissionGroupIds),
  divisionIds: Array.from(accessibleDivisionIds),
  departmentIds: Array.from(accessibleDepartmentIds)
};
```

**Example:**
```javascript
User Profile:
{
  role: "Chief",
  departmentId: "dept1",  // In MG A
  additionalRoles: {
    "Leader": "dept5",    // In MG A
    "Member": "dept9"     // In MG B ⭐
  }
}

Result:
{
  missionGroupIds: [MG A, MG B],  // ⭐ 2 MGs
  divisionIds: [Div 1, Div 2, Div 3],
  departmentIds: [dept1, dept2, dept3, dept4, dept5, dept6, dept9]
}
```

---

### Next.js System (Current - INCORRECT)

**From `src/app/api/workspace/route.ts`:**

```typescript
// Next.js System: /api/workspace
// Lines 18-94

async function handler(req: AuthenticatedRequest) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,           // ⭐ Only primary role
      departmentId: true,   // ⭐ Only primary department
      // ❌ NO additionalRoles field
      department: { ... }
    }
  });

  // Switch on PRIMARY role only ❌
  switch (user.role) {
    case 'ADMIN':
      return getAdminWorkspace();  // All MGs

    case 'CHIEF':
      return getChiefWorkspace(user);  // Only user's MG ❌

    case 'LEADER':
      return getLeaderWorkspace(user);  // Only user's Division ❌

    // ...
  }
}

// CHIEF workspace: Only returns user's own Mission Group
async function getChiefWorkspace(user: any) {
  const missionGroupId = user.department.division.missionGroupId;  // ❌ Only 1 MG

  const missionGroup = await prisma.missionGroup.findUnique({
    where: { id: missionGroupId }  // ❌ Single MG query
  });

  return {
    hierarchical: [missionGroup],  // ❌ Array with 1 MG only
  };
}
```

**Problem:**
- ❌ No support for `additionalRoles` field
- ❌ Only processes primary role and primary department
- ❌ CHIEF users with roles in multiple MGs only see their primary MG
- ❌ LEADER users with roles in multiple divisions only see their primary division

---

## Impact

### Affected Users

**Any user with `additionalRoles` field:**

| User Role | Primary Dept | Additional Roles | Expected Scope | Current Scope | Bug? |
|-----------|--------------|------------------|----------------|---------------|------|
| Chief (MG A) | dept1 | Member (MG B): dept9 | MG A + dept9 in MG B | **MG A only** | ✅ YES |
| Leader (Div 1) | dept2 | Leader (Div 2): dept5 | Div 1 + Div 2 | **Div 1 only** | ✅ YES |
| Head (dept3) | dept3 | Member (dept7): dept7 | dept3 + dept7 | **dept3 only** | ✅ YES |

**Single-role users (NO bug):**

| User Role | Primary Dept | Additional Roles | Expected Scope | Current Scope | Bug? |
|-----------|--------------|------------------|----------------|---------------|------|
| ADMIN | any | none | All MGs | All MGs | ❌ NO |
| Chief (MG A) | dept1 | none | MG A | MG A | ❌ NO |
| Leader (Div 1) | dept2 | none | Div 1 | Div 1 | ❌ NO |

---

## Database Schema

**Current Prisma Schema:**

```prisma
model User {
  id               String   @id
  email            String   @unique
  role             UserRole
  departmentId     String
  department       Department @relation(fields: [departmentId], ...)

  // ⚠️ This field EXISTS but is NOT used by workspace API
  additionalRoles  Json?

  // ...
}
```

**Expected `additionalRoles` format (from GAS):**

```json
{
  "Chief": "dept7",
  "Leader": "dept5",
  "Member": "dept9"
}
```

Or `null` if no additional roles.

---

## Solution

### Option 1: Full GAS Port (RECOMMENDED)

Implement complete `getUserAccessibleScope()` logic in workspace API.

**Implementation:**

1. **Update workspace API** (`src/app/api/workspace/route.ts`):
   - Add `additionalRoles` to user query
   - Create `getUserAccessibleScope()` function matching GAS logic
   - Use scope to build workspace hierarchy
   - Aggregate all accessible Mission Groups/Divisions/Departments

2. **Create new helper function**:

```typescript
// src/lib/permissions.ts or src/app/api/workspace/route.ts

interface AccessibleScope {
  isAdmin: boolean;
  missionGroupIds: string[];
  divisionIds: string[];
  departmentIds: string[];
}

async function getUserAccessibleScope(user: User): Promise<AccessibleScope> {
  // 1. Admin special case
  if (user.role === 'ADMIN') {
    const allMGs = await prisma.missionGroup.findMany({ where: { deletedAt: null } });
    const allDivs = await prisma.division.findMany({ where: { deletedAt: null } });
    const allDepts = await prisma.department.findMany({ where: { deletedAt: null } });

    return {
      isAdmin: true,
      missionGroupIds: allMGs.map(mg => mg.id),
      divisionIds: allDivs.map(d => d.id),
      departmentIds: allDepts.map(d => d.id),
    };
  }

  // 2. Build department → role map
  const departmentRoleMap: Record<string, string> = {};

  // Add primary role
  if (user.departmentId) {
    departmentRoleMap[user.departmentId] = user.role.toLowerCase();
  }

  // Add additional roles
  if (user.additionalRoles && typeof user.additionalRoles === 'object') {
    const additionalRoles = user.additionalRoles as Record<string, string>;
    Object.entries(additionalRoles).forEach(([role, deptId]) => {
      if (deptId) {
        departmentRoleMap[deptId] = role.toLowerCase();
      }
    });
  }

  // 3. Process each department with its role
  const accessibleMissionGroupIds = new Set<string>();
  const accessibleDivisionIds = new Set<string>();
  const accessibleDepartmentIds = new Set<string>();

  for (const [deptId, roleLevel] of Object.entries(departmentRoleMap)) {
    const dept = await prisma.department.findUnique({
      where: { id: deptId },
      include: {
        division: {
          include: {
            missionGroup: true,
            departments: true,
          },
        },
      },
    });

    if (!dept) continue;

    const division = dept.division;
    const missionGroup = division.missionGroup;

    if (roleLevel === 'chief') {
      // Chief: Add entire mission group
      accessibleMissionGroupIds.add(missionGroup.id);

      // Add all divisions in MG
      const divisionsInMG = await prisma.division.findMany({
        where: { missionGroupId: missionGroup.id, deletedAt: null },
      });
      divisionsInMG.forEach(d => accessibleDivisionIds.add(d.id));

      // Add all departments in MG
      const deptsInMG = await prisma.department.findMany({
        where: {
          division: { missionGroupId: missionGroup.id },
          deletedAt: null,
        },
      });
      deptsInMG.forEach(d => accessibleDepartmentIds.add(d.id));

    } else if (roleLevel === 'leader') {
      // Leader: Add entire division
      accessibleMissionGroupIds.add(missionGroup.id);
      accessibleDivisionIds.add(division.id);

      // Add all departments in division
      division.departments.forEach(d => accessibleDepartmentIds.add(d.id));

    } else if (roleLevel === 'head' || roleLevel === 'member') {
      // Head/Member: Add only this department
      accessibleMissionGroupIds.add(missionGroup.id);
      accessibleDivisionIds.add(division.id);
      accessibleDepartmentIds.add(deptId);
    }
  }

  return {
    isAdmin: false,
    missionGroupIds: Array.from(accessibleMissionGroupIds),
    divisionIds: Array.from(accessibleDivisionIds),
    departmentIds: Array.from(accessibleDepartmentIds),
  };
}
```

3. **Update workspace functions**:

```typescript
async function getChiefWorkspace(user: any) {
  const scope = await getUserAccessibleScope(user);

  // Fetch ALL accessible mission groups (not just primary)
  const missionGroups = await prisma.missionGroup.findMany({
    where: {
      id: { in: scope.missionGroupIds },
      deletedAt: null,
    },
    include: {
      divisions: {
        where: {
          id: { in: scope.divisionIds },
          deletedAt: null,
        },
        include: {
          departments: {
            where: {
              id: { in: scope.departmentIds },
              deletedAt: null,
            },
            include: {
              projects: {
                where: { dateDeleted: null },
                orderBy: { name: 'asc' },
              },
            },
            orderBy: { name: 'asc' },
          },
        },
        orderBy: { name: 'asc' },
      },
    },
    orderBy: { name: 'asc' },
  });

  return {
    viewType: 'hierarchical' as const,
    userRole: 'CHIEF' as const,
    hierarchical: missionGroups.map(mg => ({ ... })),
  };
}

// Same pattern for getLeaderWorkspace(), getDepartmentWorkspace()
```

---

### Option 2: Simple Fix (NOT RECOMMENDED)

Query all MGs/Divisions where user has ANY role, then filter.

**Pros:**
- Faster to implement
- Less code

**Cons:**
- ❌ Not matching GAS behavior exactly
- ❌ Doesn't respect per-department role levels
- ❌ May show wrong scope for mixed roles

---

## Testing Plan

### Test Case 1: Chief + Member (Different MGs)

**User Profile:**
```json
{
  "role": "CHIEF",
  "departmentId": "dept1",  // In MG A
  "additionalRoles": {
    "Member": "dept9"       // In MG B
  }
}
```

**Expected Result:**
```json
{
  "viewType": "hierarchical",
  "hierarchical": [
    {
      "id": "MG A",
      "name": "Mission Group A",
      "divisions": [
        // All divisions in MG A
      ]
    },
    {
      "id": "MG B",
      "name": "Mission Group B",
      "divisions": [
        {
          "id": "Div 3",
          "departments": [
            {
              "id": "dept9",  // Only this dept
              "projects": [...]
            }
          ]
        }
      ]
    }
  ]
}
```

### Test Case 2: Leader + Leader (Same MG, Different Divisions)

**User Profile:**
```json
{
  "role": "LEADER",
  "departmentId": "dept2",  // Div 1 in MG A
  "additionalRoles": {
    "Leader": "dept5"       // Div 2 in MG A
  }
}
```

**Expected Result:**
```json
{
  "viewType": "hierarchical",
  "hierarchical": [
    {
      "id": "MG A",
      "divisions": [
        {
          "id": "Div 1",
          "departments": [...]  // All in Div 1
        },
        {
          "id": "Div 2",
          "departments": [...]  // All in Div 2
        }
      ]
    }
  ]
}
```

### Test Case 3: Admin (Should NOT change)

**User Profile:**
```json
{
  "role": "ADMIN",
  "departmentId": "dept1",
  "additionalRoles": null
}
```

**Expected Result:**
- All mission groups (unchanged)

---

## Migration Notes

### Database Migration

**No schema changes needed!**

The `additionalRoles` field already exists in User model:

```sql
SELECT id, email, role, "departmentId", "additionalRoles"
FROM "User"
WHERE "additionalRoles" IS NOT NULL;
```

**Current data check:**

```bash
node -e "const { prisma } = require('./src/lib/db.js'); \
(async () => { \
  const users = await prisma.user.findMany({ \
    where: { additionalRoles: { not: null } } \
  }); \
  console.log('Users with additionalRoles:', users.length); \
  users.forEach(u => console.log(u.id, u.role, u.additionalRoles)); \
})();"
```

---

## Implementation Checklist

- [ ] Read and understand GAS permission system (util.PermissionUtils.html)
- [ ] Read GAS documentation (DOCS_ORGANIZATION_HIERARCHY_PERMISSIONS.md)
- [ ] Implement `getUserAccessibleScope()` function
- [ ] Update `getAdminWorkspace()` (no changes needed, already correct)
- [ ] Update `getChiefWorkspace()` to use scope
- [ ] Update `getLeaderWorkspace()` to use scope
- [ ] Update `getDepartmentWorkspace()` to use scope (HEAD/MEMBER)
- [ ] Update `getUserWorkspace()` (USER role - may need scope)
- [ ] Add TypeScript types for AccessibleScope
- [ ] Write unit tests for getUserAccessibleScope()
- [ ] Test with real data (Test Case 1-3)
- [ ] Update CLAUDE.md with new workspace API behavior
- [ ] Update PROJECT_STATUS.md

---

## Related Files

**Implementation:**
- `src/app/api/workspace/route.ts` - Main workspace API (NEEDS FIX)
- `src/lib/permissions.ts` - Permission utilities (ADD getUserAccessibleScope here)

**Reference (GAS):**
- `old_project/util.PermissionUtils.html` - Original permission logic
- `old_project/DOCS_ORGANIZATION_HIERARCHY_PERMISSIONS.md` - GAS permission docs
- `old_project/component.CreateProjectModal.html` - getUserAccessibleScope implementation
- `old_project/service.DataLoader.html` - Workspace loading logic

**Frontend:**
- `src/hooks/use-workspace.ts` - Workspace data hook (consumer)
- `src/components/navigation/workspace-navigation.tsx` - Workspace navigation UI

**Documentation:**
- `WORKSPACE_NAVIGATION_REDESIGN.md` - Frontend workspace navigation
- `BREADCRUMB_IMPLEMENTATION.md` - Breadcrumb navigation
- `CLAUDE.md` - Main project docs

---

## Conclusion

The workspace API **must be updated** to support `additionalRoles` field matching the GAS system. Without this fix:

- ✅ Single-role users work correctly
- ❌ Multi-role users see incomplete data
- ❌ Permission system does not match GAS behavior
- ❌ Users cannot access all their authorized resources

**Priority**: **HIGH**
**Effort**: ~2-3 hours implementation + testing
**Risk**: Low (additive change, doesn't break existing functionality)

---

**Last Updated**: 2025-10-23
