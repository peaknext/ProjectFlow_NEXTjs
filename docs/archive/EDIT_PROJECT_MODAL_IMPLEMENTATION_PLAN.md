# Edit Project Modal - Implementation Plan

**Date**: 2025-10-24
**Status**: 📋 **PLANNING**
**Phase**: Phase 6 - Project Management Modals
**Estimated Time**: 2-3 days

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [GAS Implementation Analysis](#gas-implementation-analysis)
3. [UI/UX Specifications](#uiux-specifications)
4. [Technical Architecture](#technical-architecture)
5. [Implementation Plan](#implementation-plan)
6. [API Integration](#api-integration)
7. [Testing Strategy](#testing-strategy)

---

## Overview

### Purpose

Edit Project Modal allows users to modify specific project attributes while keeping core identifiers (name, department, hierarchy) read-only. Based on the GAS `component.EditProjectModal.html` implementation.

### Scope - What CAN Be Edited

- ✅ **Description** - Project description text
- ✅ **Phase Dates** - Start/End dates for each phase
- ✅ **Status Colors** - Color codes for each status

### Scope - What CANNOT Be Edited (Read-Only)

- ❌ **Project Name** - Cannot rename projects
- ❌ **Department** - Cannot move to different department
- ❌ **Division** - Cannot change division
- ❌ **Mission Group** - Cannot change mission group
- ❌ **Phase Names** - Phase names are fixed
- ❌ **Status Names** - Status names are fixed
- ❌ **Phase/Status Order** - Order cannot be changed

### User Roles with Edit Access

- ✅ **ADMIN** - Can edit all projects
- ✅ **CHIEF** - Can edit projects in their Mission Group
- ✅ **LEADER** - Can edit projects in their department
- ✅ **HEAD** - Can edit projects in their department
- ❌ **MEMBER** - No edit access
- ❌ **USER** - No edit access

---

## GAS Implementation Analysis

### File Structure (Old System)

```
old_project/
├── component.EditProjectModal.html   # JavaScript logic (772 lines)
└── EditProjectModal.html              # HTML template (166 lines)
```

### Key Features from GAS

#### 1. **Skeleton Loading Pattern** ⚡

**Performance**: < 50ms instant UI

```javascript
// STEP 1: Show skeleton immediately (< 50ms)
modalContainer.innerHTML = this.getSkeletonHTML();

// STEP 2: Load real HTML in background
const htmlTemplate = await this.loadModalHTML();

// STEP 3: Wait minimum 350ms for animation
if (loadDuration < MINIMUM_SKELETON_TIME) {
  await new Promise((resolve) => setTimeout(resolve, remainingTime));
}

// STEP 4: Replace skeleton with real content
modalContainer.innerHTML = htmlTemplate;
```

**Analysis**:

- ✅ Instant perceived performance
- ✅ Smooth UX even with slow network
- ✅ User sees immediate feedback
- ⚠️ In Next.js: Use React Suspense + loading states instead

#### 2. **Caching System** 💾

**Cache Duration**: 5 minutes

```javascript
getFromCache(projectId) {
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  if (cached.lastLoaded && now - cached.lastLoaded < CACHE_DURATION) {
    return cached.details;
  }
  return null;
}
```

**Analysis**:

- ✅ Reduces API calls
- ✅ Faster subsequent opens
- ⚠️ In Next.js: React Query handles this automatically (staleTime: 5 minutes)

#### 3. **UI Components**

**a) Side Panel Animation**

- Slides in from right
- Max width: 48rem (max-w-3xl)
- Backdrop blur + dark overlay
- 300ms transition duration

**b) Layout Structure**

```
┌─────────────────────────────────────┐
│ Fixed Header                         │
│ - "แก้ไขโปรเจกต์"                     │
│ - Close button (X)                   │
├─────────────────────────────────────┤
│ Scrollable Body                      │
│                                      │
│ ┌─────────────────────────────────┐ │
│ │ Read-Only Info Box (Blue bg)    │ │
│ │ - Project Name                   │ │
│ │ - Department                     │ │
│ │ - Division                       │ │
│ │ - Mission Group                  │ │
│ └─────────────────────────────────┘ │
│                                      │
│ ┌─────────────────────────────────┐ │
│ │ Description (Editable Textarea) │ │
│ └─────────────────────────────────┘ │
│                                      │
│ ── Phases Section ──                │
│ ┌─────────────────────────────────┐ │
│ │ Phase 1: วางแผน                 │ │
│ │ - Name (read-only)               │ │
│ │ - Start Date (date picker)       │ │
│ │ - End Date (date picker)         │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ Phase 2: ดำเนินงาน              │ │
│ │ - Name (read-only)               │ │
│ │ - Start Date (date picker)       │ │
│ │ - End Date (date picker)         │ │
│ └─────────────────────────────────┘ │
│                                      │
│ ── Statuses Section ──              │
│ ┌─────────────────────────────────┐ │
│ │ Status 1: ยังไม่เริ่ม           │ │
│ │ - Name (read-only)               │ │
│ │ - Color (color picker button)    │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ Status 2: กำลังดำเนินการ        │ │
│ │ - Name (read-only)               │ │
│ │ - Color (color picker button)    │ │
│ └─────────────────────────────────┘ │
│                                      │
├─────────────────────────────────────┤
│ Fixed Footer                         │
│ - [บันทึกการเปลี่ยนแปลง] Button    │
│   (with loading state)               │
└─────────────────────────────────────┘
```

**c) Color Scheme**

- Info box: Blue (`bg-blue-50 dark:bg-blue-950/20`)
- Phase rows: Black/5 (`bg-black/5 dark:bg-white/5`)
- Status rows: Black/5 (`bg-black/5 dark:bg-white/5`)
- Borders: Slate (`border-slate-200 dark:border-slate-800`)

#### 4. **Form Validation** ✅

- Description: Optional (can be empty)
- Phase dates: Optional (can be null)
- Status colors: Required (default: #808080)

#### 5. **Save Flow** 💾

```javascript
async handleSave() {
  // 1. Show loading state
  saveBtn.disabled = true;
  saveBtn.innerHTML = '<spinner> กำลังบันทึก...';

  // 2. Call API
  await this.updateProjectAPI(projectId, updates);

  // 3. Update cache
  this.updateCache(projectId, updates);

  // 4. Invalidate other caches
  ProjectCache.invalidate();
  ProjectListCache.invalidate();

  // 5. Reload project list
  await ProjectManagement.loadProjects();

  // 6. Show success notification
  notify.toastSuccess(`แก้ไขโปรเจกต์ "${name}" สำเร็จ`);

  // 7. Close modal
  this.close();
}
```

---

## UI/UX Specifications

### Design System Alignment

**Match Current Next.js Components:**

- ✅ Use shadcn/ui components (Dialog, Button, Input, Textarea)
- ✅ Follow TaskPanel slide-in pattern
- ✅ Use same animations as other modals
- ✅ Consistent with CreateTaskModal style
- ✅ Dark mode support (next-themes)

### Visual Style Guide

#### Colors (Match GAS Implementation)

**Info Box (Read-Only Section):**

```tsx
className =
  "bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4";
```

**Phase/Status Rows:**

```tsx
className =
  "bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700";
```

**Section Headers:**

```tsx
className = "text-lg font-semibold text-foreground border-t border-border pt-6";
```

#### Typography

**Labels:**

```tsx
className = "text-sm font-medium text-muted-foreground";
```

**Read-Only Values:**

```tsx
className = "text-sm font-medium text-foreground";
```

**Hints:**

```tsx
className = "text-xs text-muted-foreground";
```

#### Spacing

**Sections**: `space-y-6` (24px vertical gap)
**Fields**: `space-y-2` (8px label-to-input gap)
**Rows**: `space-y-3` (12px row-to-row gap)

#### Icons

**Material Symbols** (same as GAS):

- Close: `X` (lucide-react)
- Save: `Save` (lucide-react)
- Date Picker: `Calendar` (lucide-react)
- Color Picker: `Palette` (lucide-react)
- Loading: `Loader2` (lucide-react with spin animation)

---

## Technical Architecture

### Component Structure

```
src/components/modals/
└── edit-project-modal.tsx       # Main modal component (new)
```

### Component Dependencies

```tsx
// UI Components (shadcn/ui)
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

// Custom Components
import { DatePickerPopover } from "@/components/ui/date-picker-popover";
import { ColorPickerPopover } from "@/components/ui/color-picker-popover";

// Icons
import { X, Save, Loader2, Calendar, Palette } from "lucide-react";

// Hooks
import { useEditProject } from "@/hooks/use-projects";
import { useAuth } from "@/hooks/use-auth";
import { useUIStore } from "@/stores/use-ui-store";

// Utils
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";

// Form
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
```

### TypeScript Interfaces

```typescript
interface EditProjectModalProps {
  projectId: string;
  open: boolean;
  onClose: () => void;
}

interface ProjectEditFormData {
  description: string;
  phases: Array<{
    id: string;
    name: string; // read-only, for display
    startDate: string | null;
    endDate: string | null;
  }>;
  statuses: Array<{
    id: string;
    name: string; // read-only, for display
    color: string;
  }>;
}

interface ProjectDetailsResponse {
  id: string;
  name: string;
  description: string;
  departmentName: string;
  divisionName: string;
  missionGroupName: string;
  phases: Array<{
    id: string;
    name: string;
    startDate: string | null;
    endDate: string | null;
    phaseOrder: number;
  }>;
  statuses: Array<{
    id: string;
    name: string;
    color: string;
    order: number;
  }>;
}
```

### State Management

**UI Store (Zustand):**

```typescript
// src/stores/use-ui-store.ts
interface UIStore {
  editProjectModal: {
    isOpen: boolean;
    projectId: string | null;
  };
  openEditProjectModal: (projectId: string) => void;
  closeEditProjectModal: () => void;
}
```

**React Query Hook:**

```typescript
// src/hooks/use-projects.ts

export const projectKeys = {
  all: ["projects"] as const,
  lists: () => [...projectKeys.all, "list"] as const,
  list: (filters: any) => [...projectKeys.lists(), filters] as const,
  details: () => [...projectKeys.all, "detail"] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
  editDetails: (id: string) =>
    [...projectKeys.all, "edit-details", id] as const, // NEW
};

// Fetch project details for editing
export function useProjectEditDetails(projectId: string) {
  return useQuery({
    queryKey: projectKeys.editDetails(projectId),
    queryFn: async () => {
      const response = await api.get<{ project: ProjectDetailsResponse }>(
        `/api/projects/${projectId}/edit-details`
      );
      return response.project;
    },
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000, // 5 minutes (match GAS cache)
  });
}

// Edit project mutation
export function useEditProject() {
  const queryClient = useQueryClient();

  return useSyncMutation({
    mutationFn: async ({
      projectId,
      updates,
    }: {
      projectId: string;
      updates: ProjectEditFormData;
    }) => {
      const response = await api.patch(`/api/projects/${projectId}`, updates);
      return response;
    },
    onSuccess: (data, { projectId }) => {
      // Invalidate all project-related queries
      queryClient.invalidateQueries({
        queryKey: projectKeys.detail(projectId),
      });
      queryClient.invalidateQueries({
        queryKey: projectKeys.editDetails(projectId),
      });
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}
```

### Form Validation (Zod)

```typescript
const editProjectSchema = z.object({
  description: z.string().optional(),
  phases: z.array(
    z.object({
      id: z.string(),
      name: z.string(), // for display only
      startDate: z.string().nullable(),
      endDate: z.string().nullable(),
    })
  ),
  statuses: z.array(
    z.object({
      id: z.string(),
      name: z.string(), // for display only
      color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format"),
    })
  ),
});

type EditProjectFormData = z.infer<typeof editProjectSchema>;
```

---

## Implementation Plan

### Phase 1: Setup & Structure (4 hours)

**Tasks:**

1. ✅ Create `edit-project-modal.tsx` component file
2. ✅ Setup Zustand store methods (open/close)
3. ✅ Create basic modal structure with shadcn Dialog
4. ✅ Add slide-in animation (match TaskPanel)
5. ✅ Setup React Hook Form with Zod validation

**Files to Create/Modify:**

- `src/components/modals/edit-project-modal.tsx` (NEW)
- `src/stores/use-ui-store.ts` (ADD: editProjectModal state)
- `src/hooks/use-projects.ts` (ADD: useProjectEditDetails, useEditProject)

### Phase 2: UI Implementation (6 hours)

**Tasks:**

1. ✅ Build read-only info box (blue background)
2. ✅ Build description textarea section
3. ✅ Build phases section with date pickers
4. ✅ Build statuses section with color pickers
5. ✅ Add empty states for missing phases/statuses
6. ✅ Add loading skeleton state
7. ✅ Add error state handling
8. ✅ Style with dark mode support

**Components to Build:**

```tsx
// Main sections
<ReadOnlyInfoSection data={project} />
<DescriptionSection control={control} />
<PhasesSection phases={project.phases} control={control} />
<StatusesSection statuses={project.statuses} control={control} />
```

### Phase 3: Data Integration (4 hours)

**Tasks:**

1. ✅ Create API endpoint: `GET /api/projects/[id]/edit-details`
2. ✅ Create API endpoint: `PATCH /api/projects/[id]`
3. ✅ Implement React Query hooks
4. ✅ Wire up form submission
5. ✅ Add permission checks (ADMIN/CHIEF/LEADER/HEAD)
6. ✅ Handle API errors

**API Routes to Create:**

- `src/app/api/projects/[projectId]/edit-details/route.ts` (NEW)
- `src/app/api/projects/[projectId]/route.ts` (UPDATE: add PATCH handler)

### Phase 4: Integration & Polish (2 hours)

**Tasks:**

1. ✅ Add "Edit" button to ProjectRow component
2. ✅ Wire up modal open/close in Projects page
3. ✅ Add success/error toast notifications
4. ✅ Test with real data
5. ✅ Verify dark mode
6. ✅ Verify responsive design

**Files to Modify:**

- `src/components/projects/project-row.tsx` (ADD: Edit button click handler)
- `src/components/projects/projects-view.tsx` (ADD: EditProjectModal)

### Phase 5: Testing & Documentation (2 hours)

**Tasks:**

1. ✅ Manual testing (all scenarios)
2. ✅ Permission testing (all roles)
3. ✅ Error handling testing
4. ✅ Dark mode testing
5. ✅ Update CLAUDE.md
6. ✅ Create testing documentation

---

## API Integration

### Endpoint 1: Get Project Edit Details

**Route**: `GET /api/projects/[projectId]/edit-details`

**Request:**

```typescript
// Headers
Authorization: Bearer {sessionToken}
```

**Response:**

```typescript
{
  "success": true,
  "data": {
    "project": {
      "id": "proj001",
      "name": "โครงการพัฒนาระบบ ERP",
      "description": "ระบบบริหารจัดการทรัพยากรองค์กร...",
      "departmentName": "หน่วยงานพัฒนาระบบ",
      "divisionName": "กลุ่มงานเทคโนโลยีสารสนเทศ",
      "missionGroupName": "กลุ่มภารกิจบริหาร",
      "phases": [
        {
          "id": "phase001",
          "name": "วางแผน",
          "startDate": "2025-01-01",
          "endDate": "2025-02-28",
          "phaseOrder": 1
        },
        {
          "id": "phase002",
          "name": "ดำเนินงาน",
          "startDate": "2025-03-01",
          "endDate": "2025-08-31",
          "phaseOrder": 2
        }
      ],
      "statuses": [
        {
          "id": "status001",
          "name": "ยังไม่เริ่ม",
          "color": "#94a3b8",
          "order": 1
        },
        {
          "id": "status002",
          "name": "กำลังดำเนินการ",
          "color": "#3b82f6",
          "order": 2
        }
      ]
    }
  }
}
```

**Backend Implementation:**

```typescript
// src/app/api/projects/[projectId]/edit-details/route.ts
import { withAuth } from "@/lib/api-middleware";
import { successResponse, errorResponse } from "@/lib/api-response";
import { checkPermission } from "@/lib/permissions";
import { prisma } from "@/lib/db";

async function handler(
  req: AuthenticatedRequest,
  { params }: { params: { projectId: string } }
) {
  const userId = req.session.userId;
  const { projectId } = params;

  // Check permissions (must have project.update permission)
  const hasAccess = await checkPermission(userId, "project.update", {
    projectId,
  });
  if (!hasAccess) {
    return errorResponse(
      "FORBIDDEN",
      "No permission to edit this project",
      403
    );
  }

  // Fetch project with phases and statuses
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      description: true,
      department: {
        select: {
          name: true,
          division: {
            select: {
              name: true,
              missionGroup: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
      phases: {
        where: { deletedAt: null },
        orderBy: { phaseOrder: "asc" },
        select: {
          id: true,
          name: true,
          startDate: true,
          endDate: true,
          phaseOrder: true,
        },
      },
      statuses: {
        where: { dateDeleted: null },
        orderBy: { order: "asc" },
        select: {
          id: true,
          name: true,
          color: true,
          order: true,
        },
      },
    },
  });

  if (!project) {
    return errorResponse("NOT_FOUND", "Project not found", 404);
  }

  return successResponse({
    project: {
      ...project,
      departmentName: project.department.name,
      divisionName: project.department.division.name,
      missionGroupName: project.department.division.missionGroup.name,
    },
  });
}

export const GET = withAuth(handler);
```

### Endpoint 2: Update Project

**Route**: `PATCH /api/projects/[projectId]`

**Request:**

```typescript
// Headers
Authorization: Bearer {sessionToken}
Content-Type: application/json

// Body
{
  "description": "Updated description...",
  "phases": [
    {
      "id": "phase001",
      "startDate": "2025-01-15", // can be null
      "endDate": "2025-03-15"    // can be null
    },
    {
      "id": "phase002",
      "startDate": null,
      "endDate": null
    }
  ],
  "statuses": [
    {
      "id": "status001",
      "color": "#ef4444"
    },
    {
      "id": "status002",
      "color": "#22c55e"
    }
  ]
}
```

**Response:**

```typescript
{
  "success": true,
  "data": {
    "project": {
      "id": "proj001",
      "name": "โครงการพัฒนาระบบ ERP",
      "description": "Updated description...",
      // ... other fields
    }
  },
  "message": "Project updated successfully"
}
```

**Backend Implementation:**

```typescript
// src/app/api/projects/[projectId]/route.ts (add PATCH handler)
async function patchHandler(
  req: AuthenticatedRequest,
  { params }: { params: { projectId: string } }
) {
  const userId = req.session.userId;
  const { projectId } = params;
  const body = await req.json();

  // Check permissions
  const hasAccess = await checkPermission(userId, "project.update", {
    projectId,
  });
  if (!hasAccess) {
    return errorResponse(
      "FORBIDDEN",
      "No permission to edit this project",
      403
    );
  }

  // Validate project exists
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    return errorResponse("NOT_FOUND", "Project not found", 404);
  }

  // Update project description
  await prisma.project.update({
    where: { id: projectId },
    data: {
      description: body.description,
    },
  });

  // Update phases
  if (body.phases && Array.isArray(body.phases)) {
    for (const phaseUpdate of body.phases) {
      await prisma.phase.update({
        where: { id: phaseUpdate.id },
        data: {
          startDate: phaseUpdate.startDate
            ? new Date(phaseUpdate.startDate)
            : null,
          endDate: phaseUpdate.endDate ? new Date(phaseUpdate.endDate) : null,
        },
      });
    }
  }

  // Update statuses
  if (body.statuses && Array.isArray(body.statuses)) {
    for (const statusUpdate of body.statuses) {
      await prisma.status.update({
        where: { id: statusUpdate.id },
        data: {
          color: statusUpdate.color,
        },
      });
    }
  }

  // Create history entry
  await prisma.history.create({
    data: {
      projectId,
      userId,
      action: "PROJECT_UPDATED",
      description: "แก้ไขรายละเอียดโปรเจกต์",
    },
  });

  // Return updated project
  const updatedProject = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      phases: { where: { deletedAt: null }, orderBy: { phaseOrder: "asc" } },
      statuses: { where: { dateDeleted: null }, orderBy: { order: "asc" } },
    },
  });

  return successResponse({
    project: updatedProject,
  });
}

export const PATCH = withAuth(patchHandler);
```

---

## Testing Strategy

### Manual Testing Checklist

#### 1. **Modal Behavior**

- [ ] Modal opens when clicking "Edit" button in ProjectRow
- [ ] Modal closes when clicking X button
- [ ] Modal closes when clicking outside (overlay)
- [ ] Modal closes after successful save
- [ ] Modal shows loading state while fetching data
- [ ] Modal shows error state if fetch fails

#### 2. **Permission Checks**

- [ ] ADMIN can edit all projects
- [ ] CHIEF can edit projects in their Mission Group
- [ ] LEADER can edit projects in their department
- [ ] HEAD can edit projects in their department
- [ ] MEMBER cannot see Edit button
- [ ] USER cannot see Edit button

#### 3. **Read-Only Section**

- [ ] Project name displays correctly
- [ ] Department displays correctly
- [ ] Division displays correctly
- [ ] Mission Group displays correctly
- [ ] Info box has blue background
- [ ] Text is not editable

#### 4. **Description Section**

- [ ] Description textarea shows current value
- [ ] Can edit description
- [ ] Can clear description (empty is valid)
- [ ] Multi-line text works
- [ ] Thai text displays correctly

#### 5. **Phases Section**

- [ ] All phases display in correct order
- [ ] Phase names are read-only (greyed out)
- [ ] Start date picker opens on click
- [ ] End date picker opens on click
- [ ] Can set dates
- [ ] Can clear dates (null is valid)
- [ ] Dates display in correct format
- [ ] Empty state shows when no phases

#### 6. **Statuses Section**

- [ ] All statuses display in correct order
- [ ] Status names are read-only (greyed out)
- [ ] Color picker opens on click
- [ ] Color preview updates when color changes
- [ ] Can select from color presets
- [ ] Can enter custom hex color
- [ ] Invalid colors show validation error
- [ ] Empty state shows when no statuses

#### 7. **Save Functionality**

- [ ] Save button disabled during loading
- [ ] Loading spinner shows while saving
- [ ] Success toast shows after save
- [ ] Project list refreshes after save
- [ ] Modal closes after successful save
- [ ] Error toast shows if save fails
- [ ] Form stays open if save fails (can retry)

#### 8. **Dark Mode**

- [ ] All sections readable in dark mode
- [ ] Colors adjust correctly
- [ ] Borders visible
- [ ] Hover states work
- [ ] Date picker works in dark mode
- [ ] Color picker works in dark mode

#### 9. **Responsive Design**

- [ ] Modal scales on small screens
- [ ] All fields accessible on mobile
- [ ] Scroll works on long forms
- [ ] Buttons accessible

### Integration Testing

**Test with real data:**

1. Project with 3 phases, 5 statuses
2. Project with 0 phases (empty state)
3. Project with 0 statuses (empty state)
4. Project with null dates
5. Project with null description
6. Project with very long description (500+ chars)

**Test error scenarios:**

1. Network timeout
2. 403 Forbidden (wrong permissions)
3. 404 Not found (deleted project)
4. 500 Server error
5. Invalid phase ID
6. Invalid status ID
7. Invalid color format

---

## Code Examples

### Main Component Structure

```tsx
// src/components/modals/edit-project-modal.tsx

"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { DatePickerPopover } from "@/components/ui/date-picker-popover";
import { ColorPickerPopover } from "@/components/ui/color-picker-popover";
import { useProjectEditDetails, useEditProject } from "@/hooks/use-projects";
import { useUIStore } from "@/stores/use-ui-store";
import { X, Save, Loader2, Palette, Calendar } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const editProjectSchema = z.object({
  description: z.string().optional(),
  phases: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      startDate: z.string().nullable(),
      endDate: z.string().nullable(),
    })
  ),
  statuses: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color"),
    })
  ),
});

type EditProjectFormData = z.infer<typeof editProjectSchema>;

export function EditProjectModal() {
  const { editProjectModal, closeEditProjectModal } = useUIStore();
  const { projectId, isOpen } = editProjectModal;

  const {
    data: project,
    isLoading,
    error,
  } = useProjectEditDetails(projectId || "");

  const editProject = useEditProject();

  const form = useForm<EditProjectFormData>({
    resolver: zodResolver(editProjectSchema),
  });

  // Populate form when data loads
  useEffect(() => {
    if (project) {
      form.reset({
        description: project.description || "",
        phases: project.phases || [],
        statuses: project.statuses || [],
      });
    }
  }, [project, form]);

  const onSubmit = async (data: EditProjectFormData) => {
    if (!projectId) return;

    try {
      await editProject.mutateAsync({
        projectId,
        updates: data,
      });

      toast.success(`แก้ไขโปรเจกต์ "${project?.name}" สำเร็จ`);
      closeEditProjectModal();
    } catch (error: any) {
      toast.error(
        `ไม่สามารถบันทึกการเปลี่ยนแปลงได้: ${error.message || "เกิดข้อผิดพลาด"}`
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={closeEditProjectModal}>
      <DialogContent className="max-w-3xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
          <DialogTitle className="text-lg font-semibold">
            แก้ไขโปรเจกต์
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6">
          {isLoading && <LoadingSkeleton />}
          {error && <ErrorState error={error} />}
          {project && (
            <form className="space-y-6 py-6">
              <ReadOnlyInfoSection project={project} />
              <DescriptionSection control={form.control} />
              <Separator />
              <PhasesSection phases={project.phases} control={form.control} />
              <Separator />
              <StatusesSection
                statuses={project.statuses}
                control={form.control}
              />
            </form>
          )}
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t flex-shrink-0">
          <Button
            onClick={form.handleSubmit(onSubmit)}
            disabled={editProject.isPending}
            className="gap-2"
          >
            {editProject.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>กำลังบันทึก...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>บันทึกการเปลี่ยนแปลง</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### Read-Only Info Section

```tsx
function ReadOnlyInfoSection({ project }: { project: ProjectDetailsResponse }) {
  return (
    <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-muted-foreground">ชื่อโปรเจกต์:</span>
          <span className="ml-2 font-medium text-foreground">
            {project.name}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">หน่วยงาน:</span>
          <span className="ml-2 font-medium text-foreground">
            {project.departmentName}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">กลุ่มงาน:</span>
          <span className="ml-2 font-medium text-foreground">
            {project.divisionName}
          </span>
        </div>
        <div>
          <span className="text-muted-foreground">กลุ่มภารกิจ:</span>
          <span className="ml-2 font-medium text-foreground">
            {project.missionGroupName}
          </span>
        </div>
      </div>
    </div>
  );
}
```

### Phases Section

```tsx
function PhasesSection({ phases, control }: { phases: any[]; control: any }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">
          ห้วงเวลาดำเนินงาน
          <span className="text-sm font-normal text-muted-foreground ml-2">
            แก้ไขวันที่เริ่มต้นและสิ้นสุดของแต่ละ Phase
          </span>
        </h3>
      </div>

      {phases.length === 0 ? (
        <EmptyState message="โปรเจกต์นี้ยังไม่มีข้อมูล Phase" />
      ) : (
        <div className="space-y-3">
          {phases.map((phase, index) => (
            <div
              key={phase.id}
              className="flex items-end gap-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700"
            >
              {/* Read-only Phase Name */}
              <div className="flex-1">
                <Label className="text-sm font-medium mb-2">ชื่อ</Label>
                <Input
                  value={phase.name}
                  disabled
                  className="bg-slate-100 dark:bg-slate-800 text-muted-foreground cursor-not-allowed"
                />
              </div>

              {/* Editable Start Date */}
              <div className="flex-1">
                <Label className="text-sm font-medium mb-2">
                  วันที่เริ่มต้น
                </Label>
                <Controller
                  name={`phases.${index}.startDate`}
                  control={control}
                  render={({ field }) => (
                    <DatePickerPopover
                      date={field.value}
                      onSelect={(date) => field.onChange(date)}
                    />
                  )}
                />
              </div>

              {/* Editable End Date */}
              <div className="flex-1">
                <Label className="text-sm font-medium mb-2">
                  วันที่สิ้นสุด
                </Label>
                <Controller
                  name={`phases.${index}.endDate`}
                  control={control}
                  render={({ field }) => (
                    <DatePickerPopover
                      date={field.value}
                      onSelect={(date) => field.onChange(date)}
                    />
                  )}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## Timeline & Effort

**Total Estimated Time**: 18 hours (2-3 days)

| Phase     | Tasks                   | Hours  |
| --------- | ----------------------- | ------ |
| 1         | Setup & Structure       | 4      |
| 2         | UI Implementation       | 6      |
| 3         | Data Integration        | 4      |
| 4         | Integration & Polish    | 2      |
| 5         | Testing & Documentation | 2      |
| **Total** |                         | **18** |

**Dependencies:**

- ✅ Project Management Page (Phases 1-4) - COMPLETE
- ✅ shadcn/ui components installed
- ✅ React Hook Form installed
- ✅ React Query configured
- ⚠️ ColorPickerPopover component - NEEDED (can reuse from CreateProjectModal)
- ⚠️ DatePickerPopover component - EXISTS (src/components/ui/date-picker-popover.tsx)

---

## Next Steps

**After Edit Modal Complete:**

1. ✅ Phase 6B: Delete Project Modal (1 day)
2. ✅ Phase 7: Optimistic UI updates (1-2 days)
3. ✅ Integration testing
4. ✅ User acceptance testing

**Files That Will Be Created:**

- `src/components/modals/edit-project-modal.tsx`
- `src/app/api/projects/[projectId]/edit-details/route.ts`
- `EDIT_PROJECT_MODAL_COMPLETE.md` (summary doc)

**Files That Will Be Modified:**

- `src/stores/use-ui-store.ts`
- `src/hooks/use-projects.ts`
- `src/app/api/projects/[projectId]/route.ts`
- `src/components/projects/project-row.tsx`
- `src/components/projects/projects-view.tsx`
- `CLAUDE.md`

---

## Success Criteria

**Functional Requirements:**

- ✅ Modal opens from ProjectRow Edit button
- ✅ Loads project details correctly
- ✅ Shows read-only fields (name, department, division, mission group)
- ✅ Allows editing description
- ✅ Allows editing phase dates (with date picker)
- ✅ Allows editing status colors (with color picker)
- ✅ Saves changes to backend
- ✅ Shows success/error notifications
- ✅ Refreshes project list after save
- ✅ Respects user permissions

**Non-Functional Requirements:**

- ✅ Smooth animations (300ms transitions)
- ✅ Responsive design (mobile to desktop)
- ✅ Dark mode support
- ✅ Accessible (keyboard navigation, screen readers)
- ✅ Performance (loads in < 500ms with cache)
- ✅ Error handling (all edge cases covered)

---

**Document Version**: 1.0
**Last Updated**: 2025-10-24
**Author**: Claude Code
**Status**: Ready for Implementation
