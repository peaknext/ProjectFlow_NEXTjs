# ProjectFlow Migration Skills

## Project Context

This file defines specialized skills and workflows for migrating ProjectFlow from Google Apps Script to Next.js + PostgreSQL. The migration must achieve 95%+ feature parity while improving performance 10x and supporting 500+ concurrent users.

## Core Requirements

- **Original System**: Google Apps Script + Google Sheets (60+ files, 19 data models)
- **Target System**: Next.js 14 + TypeScript + Prisma + PostgreSQL + shadcn/ui
- **Critical Features**: 6-level permission system, offline sync, optimistic UI, task management
- **Deployment**: render.com with CI/CD
- **Timeline**: 18-20 weeks phased approach

## Development Principles

1. **Security First**: All code must prevent XSS, SQL injection, and CSRF attacks
2. **Type Safety**: Full TypeScript coverage with strict mode
3. **Error Prevention**: Comprehensive validation, error boundaries, and defensive coding
4. **Performance**: Optimize for <500ms API response times
5. **Token Efficiency**: Use subagents proactively, batch operations, minimize redundant reads
6. **Testing**: Write tests before implementation (TDD approach)

---

## Specialized Skills

### 1. Database Schema Design

**When to use**: Designing or modifying Prisma schemas, migrations, or data models

**Guidelines**:

- Always reference [01_DATABASE_MIGRATION.md](../migration_plan/01_DATABASE_MIGRATION.md) for schema definitions
- Use CUID for all IDs (not auto-increment integers)
- Include proper indexes for foreign keys and frequently queried fields
- Add `createdAt` and `updatedAt` timestamps to all tables
- Use `@db.Text` for long strings, `@db.VarChar(255)` for short strings
- Implement soft deletes with `deletedAt` nullable DateTime
- Add validation at schema level: `@db.VarChar(255)`, unique constraints
- Document all relations with proper cascade rules

**Example workflow**:

```typescript
// 1. Define model with proper types
model Task {
  id          String   @id @default(cuid())
  name        String   @db.VarChar(255)
  description String?  @db.Text
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([projectId])
  @@index([assigneeId])
}

// 2. Run migration
// npx prisma migrate dev --name add_task_table

// 3. Generate client
// npx prisma generate
```

**Error prevention**:

- Validate all foreign key relationships exist
- Check for circular dependencies
- Test migrations with seed data before production
- Always create backup before migration

---

### 2. Permission System Implementation

**When to use**: Implementing access control, checking permissions, or role-based features

**Guidelines**:

- Reference [06_BUSINESS_LOGIC_GUIDE.md](../migration_plan/06_BUSINESS_LOGIC_GUIDE.md) for permission matrix
- Implement 6-level hierarchy: ADMIN > CHIEF > LEADER > HEAD > MEMBER > USER
- Use middleware for route protection
- Check permissions at both API and UI levels
- Cache permission checks to avoid repeated database queries
- Log permission denials for security auditing

**Permission levels**:

```typescript
enum Role {
  ADMIN = 6, // Full system access
  CHIEF = 5, // Mission group level
  LEADER = 4, // Division level
  HEAD = 3, // Department level
  MEMBER = 2, // Task execution
  USER = 1, // View only
}
```

**Example workflow**:

```typescript
// 1. Define permission checker utility
export async function checkPermission(
  userId: string,
  action: string,
  resource: any
): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  // Check role level
  if (user.role === "ADMIN") return true;

  // Check ownership
  if (resource.ownerId === userId) return true;

  // Check department scope
  if (action === "VIEW" && resource.departmentId === user.departmentId) {
    return true;
  }

  return false;
}

// 2. Apply in API route
export async function PATCH(
  req: Request,
  { params }: { params: { taskId: string } }
) {
  const session = await getSession(req);
  const task = await prisma.task.findUnique({ where: { id: params.taskId } });

  const hasPermission = await checkPermission(session.userId, "EDIT", task);
  if (!hasPermission) {
    return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 403 });
  }

  // Proceed with update
}

// 3. Apply in UI component
if (canEditTask(user, task)) {
  return <EditButton />;
}
```

**Error prevention**:

- Never trust client-side permission checks
- Always verify on server
- Return generic "ไม่มีสิทธิ์" message (don't leak system info)
- Log failed permission attempts

---

### 3. API Route Development

**When to use**: Creating Next.js API routes or server actions

**Guidelines**:

- Reference [02_API_MIGRATION.md](../migration_plan/02_API_MIGRATION.md) for endpoint specifications
- Use Next.js 14 App Router convention: `app/api/[route]/route.ts`
- Implement proper HTTP methods: GET, POST, PATCH, DELETE
- Validate all inputs with Zod schemas
- Return consistent response format: `{ success, data?, error?, message? }`
- Handle errors with try-catch and proper status codes
- Use Prisma transactions for multi-step operations
- Implement rate limiting for expensive operations

**Standard API structure**:

```typescript
// app/api/tasks/[taskId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { checkPermission } from "@/lib/permissions";

// Input validation schema
const updateTaskSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).optional(),
  assigneeId: z.string().cuid().optional(),
  statusId: z.string().cuid().optional(),
  priority: z.enum(["1", "2", "3", "4"]).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    // 1. Authenticate
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Validate input
    const body = await req.json();
    const validated = updateTaskSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validated.error },
        { status: 400 }
      );
    }

    // 3. Check permissions
    const task = await prisma.task.findUnique({
      where: { id: params.taskId },
      include: { project: true },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const hasPermission = await checkPermission(session.userId, "EDIT", task);
    if (!hasPermission) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์" }, { status: 403 });
    }

    // 4. Update in transaction
    const updated = await prisma.$transaction(async (tx) => {
      // Record activity log
      await tx.activityLog.create({
        data: {
          action: "UPDATE",
          entityType: "TASK",
          entityId: task.id,
          userId: session.userId,
          changes: JSON.stringify({
            before: task,
            after: validated.data,
          }),
        },
      });

      // Update task
      return await tx.task.update({
        where: { id: params.taskId },
        data: validated.data,
      });
    });

    // 5. Return success
    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error("[PATCH /api/tasks/:taskId]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

**Error prevention**:

- Always validate input with Zod
- Use TypeScript strict mode
- Handle all error cases (404, 403, 500)
- Use Prisma transactions for data integrity
- Log errors for debugging
- Return user-friendly error messages

---

### 4. React Component Development

**When to use**: Building UI components with shadcn/ui and Tailwind CSS

**Guidelines**:

- Reference [03_FRONTEND_MIGRATION.md](../migration_plan/03_FRONTEND_MIGRATION.md) for component specs
- Use TypeScript with proper prop types
- Implement loading and error states
- Use TanStack Query for data fetching
- Optimize re-renders with React.memo and useMemo
- Use shadcn/ui components as base (Button, Dialog, Select, etc.)
- Keep components small and focused (single responsibility)
- Write unit tests with React Testing Library

**Component structure**:

```typescript
// components/task-panel.tsx
"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface TaskPanelProps {
  taskId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function TaskPanel({ taskId, isOpen, onClose }: TaskPanelProps) {
  const queryClient = useQueryClient();

  // Fetch task data
  const {
    data: task,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["task", taskId],
    queryFn: async () => {
      const res = await fetch(`/api/tasks/${taskId}`);
      if (!res.ok) throw new Error("Failed to fetch task");
      return res.json();
    },
    enabled: isOpen && !!taskId,
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: Partial<Task>) => {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", taskId] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("อัพเดทสำเร็จ");
    },
    onError: (error) => {
      toast.error("เกิดข้อผิดพลาด");
      console.error(error);
    },
  });

  // Loading state
  if (isLoading) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="w-[600px]">
          <Skeleton className="h-8 w-3/4 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
        </SheetContent>
      </Sheet>
    );
  }

  // Error state
  if (error) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent>
          <p className="text-destructive">ไม่สามารถโหลดข้อมูลได้</p>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[600px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{task.name}</SheetTitle>
        </SheetHeader>

        {/* Task details */}
        <div className="mt-6 space-y-4">
          {/* Editable fields */}
          {/* Comments section */}
          {/* Activity history */}
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

**Error prevention**:

- Always show loading states
- Handle error states gracefully
- Validate props with TypeScript
- Use React error boundaries
- Test edge cases (empty data, long text, etc.)

---

### 5. State Management with Zustand & TanStack Query

**When to use**: Managing global UI state or server state

**Guidelines**:

- Use Zustand for UI state (filters, current view, theme)
- Use TanStack Query for server state (tasks, projects, users)
- Never duplicate server state in Zustand
- Implement optimistic updates for better UX
- Use query invalidation for cache updates
- Persist important state to localStorage

**Zustand store example**:

```typescript
// stores/ui-store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  currentView: "board" | "list" | "calendar";
  filters: {
    assignees: string[];
    statuses: string[];
    priorities: string[];
  };
  setView: (view: UIState["currentView"]) => void;
  setFilters: (filters: Partial<UIState["filters"]>) => void;
  clearFilters: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      currentView: "board",
      filters: {
        assignees: [],
        statuses: [],
        priorities: [],
      },
      setView: (view) => set({ currentView: view }),
      setFilters: (filters) =>
        set((state) => ({
          filters: { ...state.filters, ...filters },
        })),
      clearFilters: () =>
        set({
          filters: { assignees: [], statuses: [], priorities: [] },
        }),
    }),
    { name: "ui-state" }
  )
);
```

**TanStack Query usage**:

```typescript
// hooks/use-tasks.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useTasks(projectId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["tasks", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/tasks`);
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return res.json();
    },
    staleTime: 30000, // 30 seconds
  });

  const createTask = useMutation({
    mutationFn: async (data: CreateTaskInput) => {
      const res = await fetch(`/api/projects/${projectId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create task");
      return res.json();
    },
    onMutate: async (newTask) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ["tasks", projectId] });
      const previous = queryClient.getQueryData(["tasks", projectId]);

      queryClient.setQueryData(["tasks", projectId], (old: any) => {
        return [...old, { ...newTask, id: "temp-" + Date.now() }];
      });

      return { previous };
    },
    onError: (err, newTask, context) => {
      // Rollback on error
      queryClient.setQueryData(["tasks", projectId], context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
    },
  });

  return {
    tasks: query.data,
    isLoading: query.isLoading,
    error: query.error,
    createTask: createTask.mutate,
  };
}
```

---

### 6. Form Validation & Error Handling

**When to use**: Building forms with validation

**Guidelines**:

- Use Zod for schema validation (same schemas for client and server)
- Use react-hook-form for form state management
- Show inline validation errors
- Disable submit during validation or submission
- Show success feedback with toast notifications
- Handle server errors gracefully

**Example form**:

```typescript
// components/create-task-form.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";

// Shared validation schema
const createTaskSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่องาน").max(255, "ชื่องานยาวเกินไป"),
  description: z.string().max(2000, "คำอธิบายยาวเกินไป").optional(),
  assigneeId: z.string().cuid("รูปแบบ ID ไม่ถูกต้อง").optional(),
  priority: z.enum(["1", "2", "3", "4"], {
    errorMap: () => ({ message: "กรุณาเลือกระดับความสำคัญ" }),
  }),
  dueDate: z.string().datetime("รูปแบบวันที่ไม่ถูกต้อง").optional(),
});

type CreateTaskFormData = z.infer<typeof createTaskSchema>;

export function CreateTaskForm({ projectId, onSuccess }: CreateTaskFormProps) {
  const form = useForm<CreateTaskFormData>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      name: "",
      description: "",
      priority: "3",
    },
  });

  const onSubmit = async (data: CreateTaskFormData) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create task");
      }

      toast.success("สร้างงานสำเร็จ");
      form.reset();
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "เกิดข้อผิดพลาด");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ชื่องาน *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="ระบุชื่องาน" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Other fields */}

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "กำลังบันทึก..." : "สร้างงาน"}
        </Button>
      </form>
    </Form>
  );
}
```

**Error prevention**:

- Never submit invalid data
- Show clear error messages in Thai
- Disable form during submission
- Handle network errors
- Validate on both client and server

---

### 7. Data Migration & Testing

**When to use**: Migrating data from Google Sheets to PostgreSQL

**Guidelines**:

- Reference [01_DATABASE_MIGRATION.md](../migration_plan/01_DATABASE_MIGRATION.md) for migration strategy
- Export data to JSON first
- Validate data structure before import
- Use Prisma transactions for atomic operations
- Create rollback scripts
- Test with subset of data first
- Verify data integrity after migration

**Migration script structure**:

```typescript
// scripts/migrate-data.ts
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import { z } from "zod";

const prisma = new PrismaClient();

// Validation schema
const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  fullName: z.string(),
  role: z.enum(["ADMIN", "CHIEF", "LEADER", "HEAD", "MEMBER", "USER"]),
  departmentId: z.string().optional(),
});

async function migrateUsers() {
  console.log("Starting user migration...");

  // 1. Load exported data
  const rawData = readFileSync("./exported-data/users.json", "utf-8");
  const users = JSON.parse(rawData);

  console.log(`Found ${users.length} users to migrate`);

  // 2. Validate data
  const validated = users.map((user: any, index: number) => {
    try {
      return userSchema.parse(user);
    } catch (error) {
      console.error(`Validation failed for user at index ${index}:`, error);
      throw error;
    }
  });

  // 3. Migrate in transaction
  await prisma.$transaction(async (tx) => {
    let count = 0;

    for (const user of validated) {
      await tx.user.create({
        data: {
          id: user.id, // Keep original ID for relationships
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          departmentId: user.departmentId,
          // Other fields...
        },
      });

      count++;
      if (count % 100 === 0) {
        console.log(`Migrated ${count} users...`);
      }
    }
  });

  console.log("User migration completed!");
}

// Verification
async function verifyMigration() {
  const totalUsers = await prisma.user.count();
  console.log(`Total users in database: ${totalUsers}`);

  // Check for orphaned records
  const orphanedTasks = await prisma.task.findMany({
    where: {
      project: null,
    },
  });

  if (orphanedTasks.length > 0) {
    console.error(`Found ${orphanedTasks.length} orphaned tasks!`);
  }
}

async function main() {
  try {
    await migrateUsers();
    // await migrateDepartments()
    // await migrateProjects()
    // await migrateTasks()
    await verifyMigration();
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
```

**Error prevention**:

- Always validate before importing
- Use transactions for atomicity
- Create backups before migration
- Test with small dataset first
- Verify data after migration
- Log all errors for debugging

---

### 8. Performance Optimization

**When to use**: Optimizing slow queries, large datasets, or rendering performance

**Guidelines**:

- Add database indexes for frequently queried fields
- Use pagination for large lists (cursor-based for infinite scroll)
- Implement lazy loading for images and components
- Use React.memo for expensive components
- Optimize Prisma queries (select only needed fields, include relations efficiently)
- Enable caching with TanStack Query
- Use server-side rendering for initial page load

**Database optimization**:

```typescript
// Bad: N+1 query problem
const tasks = await prisma.task.findMany();
for (const task of tasks) {
  const assignee = await prisma.user.findUnique({
    where: { id: task.assigneeId },
  });
}

// Good: Include relation
const tasks = await prisma.task.findMany({
  include: {
    assignee: true,
    project: true,
    status: true,
  },
});

// Better: Select only needed fields
const tasks = await prisma.task.findMany({
  select: {
    id: true,
    name: true,
    dueDate: true,
    assignee: {
      select: {
        id: true,
        fullName: true,
        profileImage: true,
      },
    },
  },
  where: {
    projectId: projectId,
    isClosed: false,
  },
  orderBy: {
    createdAt: "desc",
  },
  take: 50, // Pagination
});
```

**Pagination**:

```typescript
// Cursor-based pagination (better for real-time data)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");
  const limit = 50;

  const tasks = await prisma.task.findMany({
    take: limit + 1, // Fetch one extra to check if there's more
    cursor: cursor ? { id: cursor } : undefined,
    skip: cursor ? 1 : 0,
    orderBy: { createdAt: "desc" },
  });

  const hasMore = tasks.length > limit;
  const items = hasMore ? tasks.slice(0, -1) : tasks;

  return NextResponse.json({
    items,
    nextCursor: hasMore ? items[items.length - 1].id : null,
  });
}
```

---

### 9. Testing Strategy

**When to use**: Writing tests for new features

**Guidelines**:

- Reference [05_ROLLOUT_PLAN.md](../migration_plan/05_ROLLOUT_PLAN.md) for testing strategy
- Write unit tests for utilities and hooks
- Write integration tests for API routes
- Write E2E tests for critical user flows
- Aim for >80% overall coverage, >95% for critical paths
- Use TDD approach when possible (write test first)

**Unit test example**:

```typescript
// lib/permissions.test.ts
import { describe, it, expect } from "vitest";
import { checkPermission } from "./permissions";

describe("checkPermission", () => {
  it("should allow ADMIN to do anything", async () => {
    const user = { id: "1", role: "ADMIN", departmentId: "dept1" };
    const resource = { ownerId: "2", departmentId: "dept2" };

    const result = await checkPermission(user, "DELETE", resource);
    expect(result).toBe(true);
  });

  it("should allow owner to edit their own task", async () => {
    const user = { id: "1", role: "MEMBER", departmentId: "dept1" };
    const resource = { ownerId: "1", departmentId: "dept1" };

    const result = await checkPermission(user, "EDIT", resource);
    expect(result).toBe(true);
  });

  it("should deny USER role from editing", async () => {
    const user = { id: "1", role: "USER", departmentId: "dept1" };
    const resource = { ownerId: "2", departmentId: "dept1" };

    const result = await checkPermission(user, "EDIT", resource);
    expect(result).toBe(false);
  });
});
```

**Integration test example**:

```typescript
// app/api/tasks/[taskId]/route.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { PATCH } from "./route";
import { prisma } from "@/lib/db";

describe("PATCH /api/tasks/:taskId", () => {
  beforeEach(async () => {
    // Setup test data
    await prisma.task.create({
      data: {
        id: "test-task-1",
        name: "Test Task",
        projectId: "test-project-1",
        // ...
      },
    });
  });

  it("should update task name", async () => {
    const req = new Request("http://localhost/api/tasks/test-task-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Updated Name" }),
    });

    const res = await PATCH(req, { params: { taskId: "test-task-1" } });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.name).toBe("Updated Name");
  });

  it("should return 403 if no permission", async () => {
    // Test with user who doesn't have permission
  });
});
```

---

### 10. Security Best Practices

**When to use**: Implementing any user input, authentication, or data access

**Guidelines**:

- Sanitize all user input (use Zod validation)
- Prevent XSS attacks (escape HTML, use dangerouslySetInnerHTML carefully)
- Prevent SQL injection (use Prisma parameterized queries)
- Implement CSRF protection (NextAuth.js handles this)
- Use HTTP-only cookies for session tokens
- Implement rate limiting on sensitive endpoints
- Log security events (failed logins, permission denials)
- Never expose sensitive data in error messages

**Input sanitization**:

```typescript
import DOMPurify from "isomorphic-dompurify";

// For rich text (allow some HTML)
function sanitizeHTML(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "a", "p", "br"],
    ALLOWED_ATTR: ["href"],
  });
}

// For plain text (strip all HTML)
function sanitizeText(text: string): string {
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });
}

// Use in API
export async function POST(req: Request) {
  const { comment } = await req.json();

  const sanitized = sanitizeHTML(comment);

  await prisma.comment.create({
    data: {
      text: sanitized,
      // ...
    },
  });
}
```

**Rate limiting**:

```typescript
// middleware.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"), // 10 requests per 10 seconds
});

export async function middleware(req: NextRequest) {
  // Apply to sensitive endpoints
  if (req.nextUrl.pathname.startsWith("/api/auth")) {
    const ip = req.ip ?? "127.0.0.1";
    const { success } = await ratelimit.limit(ip);

    if (!success) {
      return new Response("Too many requests", { status: 429 });
    }
  }

  return NextResponse.next();
}
```

---

## Workflow Patterns

### 1. Feature Development Workflow

When implementing a new feature:

1. **Read specification** from migration_plan docs
2. **Design database schema** if needed (add to schema.prisma)
3. **Create migration** (`npx prisma migrate dev`)
4. **Implement API route** with validation and permissions
5. **Write API tests** (integration tests)
6. **Implement UI component** with loading/error states
7. **Write component tests** (unit tests)
8. **Test manually** in development environment
9. **Update documentation** if needed

### 2. Bug Fix Workflow

When fixing a bug:

1. **Reproduce bug** in development or test environment
2. **Write failing test** that captures the bug
3. **Fix the bug** with minimal changes
4. **Verify test passes**
5. **Check for regressions** (run full test suite)
6. **Document fix** in commit message

### 3. Refactoring Workflow

When refactoring code:

1. **Ensure tests exist** for the code being refactored
2. **Refactor incrementally** (small changes)
3. **Run tests after each change**
4. **Verify no behavior changes**
5. **Update tests** if interfaces change

---

## Common Pitfalls & Solutions

### 1. Performance Issues

**Problem**: Slow API responses, UI lag

**Solutions**:

- Add database indexes
- Optimize Prisma queries (select only needed fields)
- Implement pagination
- Use React.memo for expensive components
- Enable TanStack Query caching
- Use Next.js server components where possible

### 2. Permission Bugs

**Problem**: Users can access data they shouldn't

**Solutions**:

- Always check permissions on server (never trust client)
- Test permission edge cases (ownership, department scope, role hierarchy)
- Log permission denials for auditing
- Use middleware for route-level protection

### 3. Data Inconsistency

**Problem**: Data gets out of sync between UI and database

**Solutions**:

- Use Prisma transactions for multi-step operations
- Implement optimistic updates with rollback on error
- Invalidate TanStack Query cache after mutations
- Use database constraints (foreign keys, unique indexes)

### 4. Type Safety Issues

**Problem**: Runtime errors due to type mismatches

**Solutions**:

- Enable TypeScript strict mode
- Generate Prisma client after schema changes
- Use Zod for runtime validation
- Avoid `any` type (use `unknown` instead)
- Write tests for type edge cases

### 5. Security Vulnerabilities

**Problem**: XSS, SQL injection, or authentication bypass

**Solutions**:

- Sanitize all user input with DOMPurify
- Use Prisma (prevents SQL injection)
- Validate input with Zod on both client and server
- Use HTTP-only cookies for session tokens
- Implement rate limiting on sensitive endpoints
- Never expose sensitive data in error messages

---

## Code Quality Checklist

Before submitting code, verify:

- [ ] TypeScript strict mode passes (no `any` types)
- [ ] All inputs validated with Zod schemas
- [ ] Permissions checked on server
- [ ] Loading and error states implemented
- [ ] User-facing messages in Thai language
- [ ] Database queries optimized (no N+1 queries)
- [ ] Tests written and passing (unit + integration)
- [ ] Security best practices followed (sanitization, rate limiting)
- [ ] Accessibility considerations (keyboard navigation, ARIA labels)
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Error logging implemented
- [ ] Documentation updated if needed

---

## Token Optimization Strategies

1. **Use subagents proactively**:

   - Delegate large refactoring tasks to specialized agents
   - Use Explore agent for codebase navigation
   - Use Task agent for multi-step implementations

2. **Batch operations**:

   - Group related file reads together
   - Use Glob to find files before reading
   - Minimize redundant file reads

3. **Efficient tool usage**:

   - Use Grep instead of reading entire files for search
   - Use Edit instead of Write for file modifications
   - Use Task tool for complex multi-step tasks

4. **Focus on essentials**:
   - Reference existing documentation instead of recreating
   - Skip obvious implementations (focus on complex logic)
   - Prioritize critical features over nice-to-haves

---

## Reference Documentation

Key files to reference during development:

- [Migration Overview](../migration_plan/00_MIGRATION_OVERVIEW.md) - Project goals and architecture
- [Database Migration](../migration_plan/01_DATABASE_MIGRATION.md) - Schema definitions and migration strategy
- [API Migration](../migration_plan/02_API_MIGRATION.md) - API endpoint specifications (65 endpoints)
- [Frontend Migration](../migration_plan/03_FRONTEND_MIGRATION.md) - Component inventory and UI requirements
- [Deployment Guide](../migration_plan/04_DEPLOYMENT_GUIDE.md) - render.com setup and CI/CD
- [Rollout Plan](../migration_plan/05_ROLLOUT_PLAN.md) - Testing strategy and phased rollout
- [Business Logic Guide](../migration_plan/06_BUSINESS_LOGIC_GUIDE.md) - Permission system and core algorithms

---

## Quick Reference

### Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Prisma ORM, PostgreSQL
- **Auth**: NextAuth.js v5
- **State**: Zustand (UI), TanStack Query (server)
- **Validation**: Zod
- **Testing**: Vitest, React Testing Library, Playwright
- **Deployment**: render.com, GitHub Actions CI/CD

### Key Commands

```bash
# Database
npx prisma migrate dev --name <name>  # Create migration
npx prisma generate                   # Generate Prisma client
npx prisma studio                     # Open database GUI

# Development
npm run dev                           # Start dev server
npm run build                         # Build for production
npm run test                          # Run tests
npm run test:e2e                      # Run E2E tests

# Deployment
git push origin main                  # Auto-deploy to render.com
```

### File Conventions

- API routes: `app/api/[route]/route.ts`
- Pages: `app/[page]/page.tsx`
- Components: `components/[name].tsx`
- Utilities: `lib/[name].ts`
- Tests: `[file].test.ts` or `[file].test.tsx`
- Schemas: `lib/schemas/[name].ts`

---

## Success Metrics

Track these metrics throughout development:

- **Feature Parity**: 95%+ of original features implemented
- **Performance**: API response time <500ms (P95)
- **Test Coverage**: >80% overall, >95% critical paths
- **Error Rate**: <0.5% in production
- **User Satisfaction**: >4/5 stars
- **Migration Success**: 100% data migrated without loss

---

# Optimistic Update Pattern - ProjectFlow Standard

## Overview

มาตรฐานการทำ Optimistic Update สำหรับทุก UI component ใน ProjectFlow เพื่อให้ผู้ใช้ได้รับประสบการณ์การใช้งานที่รวดเร็วและ responsive โดยอัปเดต UI ทันทีก่อนที่จะส่งข้อมูลไปยังเซิร์ฟเวอร์

## Core Principle

**ผู้ใช้ต้องเห็นผลลัพธ์ทันทีเมื่อทำการเปลี่ยนแปลงข้อมูล โดยไม่ต้องรอการตอบกลับจากเซิร์ฟเวอร์**

## Implementation Pattern

### 1. Import Required Dependencies

```typescript
import { useQueryClient } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { useSyncStore } from "@/stores/use-sync-store";
```

### 2. Standard Optimistic Update Flow

```typescript
const handleUpdate = (updateData) => {
  const { startSync, endSync } = useSyncStore();

  // Step 1: Show sync animation in sidebar
  startSync();

  // Step 2: Get query key and current data
  const queryKey = [relevantQueryKey];
  const previousData = queryClient.getQueryData(queryKey);

  // Step 3: Update cache optimistically (IMMEDIATELY)
  queryClient.setQueryData(queryKey, (old: any) => {
    if (!old) return old;

    // Transform old data with new changes
    return {
      ...old,
      // Apply your changes here
    };
  });

  // Step 4: Send mutation to server in background
  mutation.mutate(updateData, {
    onError: (error) => {
      // Step 5a: ROLLBACK on error
      queryClient.setQueryData(queryKey, previousData);

      // Revert UI changes if needed
      if (revertFunction) {
        revertFunction();
      }

      console.error("Update failed:", error);
      endSync(); // Hide sync animation
    },
    onSettled: () => {
      // Step 5b: SYNC with server after completion
      queryClient.invalidateQueries({ queryKey });
      endSync(); // Hide sync animation
    },
  });
};
```

## Visual Feedback System

### Sync Status in Sidebar Footer

ProjectFlow uses a custom sync status indicator in the sidebar footer instead of traditional toast notifications. This provides a non-intrusive, always-visible status of data synchronization.

**Features:**

- **Normal State**: Shows copyright info and version number
- **Syncing State**: Animated computer-to-database connection icon
- **Theme-Aware**: Blue/green colors adapt to light/dark theme
- **Multi-Operation Support**: Handles concurrent sync operations
- **Automatic Hide**: Returns to normal state when all syncs complete

**Implementation:**

```typescript
// In your component
import { useSyncStore } from "@/stores/use-sync-store";

const { startSync, endSync } = useSyncStore();

// Start sync before mutation
startSync();

// End sync in onError and onSettled
mutation.mutate(data, {
  onError: () => endSync(),
  onSettled: () => endSync(),
});
```

**How it works:**

- `startSync()` increments sync counter and shows animation
- `endSync()` decrements sync counter
- Animation hides when counter reaches 0
- Supports multiple concurrent operations

## Real-World Examples

### Example 1: Calendar View - Drag and Drop Task

**File**: `src/components/views/calendar-view/index.tsx`

```typescript
const handleEventDrop = (info: EventDropArg) => {
  const taskId = info.event.id;
  const newDueDate = info.event.end
    ? info.event.end.toISOString()
    : info.event.start.toISOString();

  // Validation
  const task = tasks.find((t) => t.id === taskId);
  if (!task || task.isClosed) {
    info.revert();
    return;
  }

  // Show sync animation
  startSync();

  // Optimistic update
  const queryKey = projectKeys.board(projectId);
  const previousData = queryClient.getQueryData(queryKey);

  queryClient.setQueryData(queryKey, (old: any) => {
    if (!old) return old;
    return {
      ...old,
      tasks: old.tasks.map((t: Task) =>
        t.id === taskId ? { ...t, dueDate: newDueDate } : t
      ),
    };
  });

  // Server update
  updateTaskMutation.mutate(
    { taskId, data: { dueDate: newDueDate } },
    {
      onError: (error) => {
        queryClient.setQueryData(queryKey, previousData);
        info.revert();
        console.error("Failed to update task due date:", error);
        endSync(); // Hide sync animation
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey });
        endSync(); // Hide sync animation
      },
    }
  );
};
```

### Example 2: Board View - Drag and Drop Between Columns

**Use Case**: ลาก task card ระหว่าง status columns

```typescript
const handleDragEnd = (result) => {
  const { source, destination, draggableId: taskId } = result;

  if (!destination) return;
  if (source.droppableId === destination.droppableId) return;

  const newStatusId = destination.droppableId;

  // Optimistic update
  const queryKey = projectKeys.board(projectId);
  const previousData = queryClient.getQueryData(queryKey);

  queryClient.setQueryData(queryKey, (old: any) => {
    if (!old) return old;
    return {
      ...old,
      tasks: old.tasks.map((t: Task) =>
        t.id === taskId ? { ...t, statusId: newStatusId } : t
      ),
    };
  });

  // Server update
  updateTaskMutation.mutate(
    { taskId, data: { statusId: newStatusId } },
    {
      onError: (error) => {
        queryClient.setQueryData(queryKey, previousData);
        console.error("Failed to move task:", error);
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey });
      },
    }
  );
};
```

### Example 3: Task Card - Toggle Pin

**Use Case**: กดปุ่ม pin/unpin task

```typescript
const handleTogglePin = (taskId: string, isPinned: boolean) => {
  const newPinnedState = !isPinned;

  // Optimistic update
  const queryKey = projectKeys.board(projectId);
  const previousData = queryClient.getQueryData(queryKey);

  queryClient.setQueryData(queryKey, (old: any) => {
    if (!old) return old;
    return {
      ...old,
      tasks: old.tasks.map((t: Task) =>
        t.id === taskId ? { ...t, isPinned: newPinnedState } : t
      ),
    };
  });

  // Server update
  updateTaskMutation.mutate(
    { taskId, data: { isPinned: newPinnedState } },
    {
      onError: (error) => {
        queryClient.setQueryData(queryKey, previousData);
        console.error("Failed to toggle pin:", error);
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey });
      },
    }
  );
};
```

### Example 4: Checklist - Toggle Checkbox

**Use Case**: เช็คหรือยกเลิกเช็ค checklist item

```typescript
const handleToggleCheckbox = (checklistId: string, isChecked: boolean) => {
  const newCheckedState = !isChecked;

  // Optimistic update
  const queryKey = taskKeys.detail(taskId);
  const previousData = queryClient.getQueryData(queryKey);

  queryClient.setQueryData(queryKey, (old: any) => {
    if (!old) return old;
    return {
      ...old,
      checklists: old.checklists.map((c: Checklist) =>
        c.id === checklistId ? { ...c, isChecked: newCheckedState } : c
      ),
    };
  });

  // Server update
  updateChecklistMutation.mutate(
    { checklistId, data: { isChecked: newCheckedState } },
    {
      onError: (error) => {
        queryClient.setQueryData(queryKey, previousData);
        console.error("Failed to toggle checklist:", error);
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey });
      },
    }
  );
};
```

### Example 5: Create New Item (Add to List)

**Use Case**: สร้าง task ใหม่หรือ comment ใหม่

```typescript
const handleCreateTask = (newTaskData) => {
  // Create temporary ID for optimistic update
  const tempId = `temp-${Date.now()}`;
  const optimisticTask = {
    id: tempId,
    ...newTaskData,
    isCreating: true, // Skeleton state
  };

  // Optimistic update - Add to list immediately
  const queryKey = projectKeys.board(projectId);
  const previousData = queryClient.getQueryData(queryKey);

  queryClient.setQueryData(queryKey, (old: any) => {
    if (!old) return old;
    return {
      ...old,
      tasks: [...old.tasks, optimisticTask],
    };
  });

  // Server update
  createTaskMutation.mutate(newTaskData, {
    onSuccess: (response) => {
      // Replace temporary task with real one
      queryClient.setQueryData(queryKey, (old: any) => {
        if (!old) return old;
        return {
          ...old,
          tasks: old.tasks.map((t: Task) =>
            t.id === tempId ? { ...response.task, isCreating: false } : t
          ),
        };
      });
    },
    onError: (error) => {
      queryClient.setQueryData(queryKey, previousData);
      console.error("Failed to create task:", error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
};
```

### Example 6: Delete Item (Remove from List)

**Use Case**: ลบ task หรือ comment

```typescript
const handleDeleteTask = (taskId: string) => {
  // Optimistic update - Remove from list immediately
  const queryKey = projectKeys.board(projectId);
  const previousData = queryClient.getQueryData(queryKey);

  queryClient.setQueryData(queryKey, (old: any) => {
    if (!old) return old;
    return {
      ...old,
      tasks: old.tasks.filter((t: Task) => t.id !== taskId),
    };
  });

  // Server update
  deleteTaskMutation.mutate(taskId, {
    onError: (error) => {
      queryClient.setQueryData(queryKey, previousData);
      console.error("Failed to delete task:", error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
};
```

## Best Practices

### ✅ DO

1. **Always save previousData** ก่อนทำ optimistic update เพื่อใช้ในการ rollback
2. **Validate before update** ตรวจสอบว่าข้อมูลถูกต้องก่อนทำ optimistic update
3. **Use skeleton states** สำหรับ items ที่กำลังสร้างใหม่ (isCreating, isDeleting)
4. **Handle errors gracefully** แสดง error message และ rollback UI
5. **Invalidate on settled** เพื่อให้ข้อมูล sync กับเซิร์ฟเวอร์เสมอ
6. **Use type safety** ใช้ TypeScript types เพื่อป้องกัน runtime errors

### ❌ DON'T

1. **Don't skip validation** อย่าทำ optimistic update โดยไม่ตรวจสอบข้อมูล
2. **Don't forget rollback** ต้องมี onError handler เสมอ
3. **Don't ignore server state** ต้อง invalidate เพื่อ sync กับเซิร์ฟเวอร์
4. **Don't update multiple queries inconsistently** ถ้ามีหลาย query ที่เกี่ยวข้อง ต้อง update ทั้งหมด
5. **Don't show loading spinners** ในกรณี optimistic update (แสดงผลทันที แทนที่จะรอ)

## Visual Feedback Patterns

### 1. Skeleton State (การสร้างใหม่)

```typescript
// While creating
{
  id: 'temp-123',
  name: taskName,
  isCreating: true, // ← Use this flag
}

// In UI
{task.isCreating && <div className="opacity-50 animate-pulse">...</div>}
```

### 2. Deleting State (การลบ)

```typescript
// While deleting
{
  id: 'task-123',
  isDeleting: true, // ← Use this flag
}

// In UI
{task.isDeleting && <div className="opacity-30 pointer-events-none">...</div>}
```

### 3. Error State (เกิด error)

```typescript
onError: (error) => {
  // Rollback
  queryClient.setQueryData(queryKey, previousData);

  // Show toast/alert
  toast.error("ไม่สามารถอัปเดตได้ กรุณาลองใหม่อีกครั้ง");
};
```

## Query Key Patterns

### Standard Query Keys

```typescript
// Projects
export const projectKeys = {
  all: ["projects"] as const,
  lists: () => [...projectKeys.all, "list"] as const,
  list: (filters: any) => [...projectKeys.lists(), filters] as const,
  details: () => [...projectKeys.all, "detail"] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
  board: (id: string) => [...projectKeys.detail(id), "board"] as const,
};

// Tasks
export const taskKeys = {
  all: ["tasks"] as const,
  lists: () => [...taskKeys.all, "list"] as const,
  list: (filters: any) => [...taskKeys.lists(), filters] as const,
  details: () => [...taskKeys.all, "detail"] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
};
```

## Testing Optimistic Updates

### Test Cases

1. **Success case**: อัปเดต UI ทันที และ sync กับเซิร์ฟเวอร์
2. **Error case**: Rollback UI และแสดง error message
3. **Network delay**: UI อัปเดตทันทีแม้ network ช้า
4. **Concurrent updates**: หลาย user อัปเดตพร้อมกัน
5. **Offline scenario**: ทำงานได้เมื่อ offline (ถ้า support)

## Performance Considerations

### 1. Debouncing for Rapid Changes

```typescript
const debouncedUpdate = useMemo(
  () =>
    debounce((value) => {
      // Optimistic update logic
    }, 300),
  []
);
```

### 2. Batch Updates

```typescript
// Instead of multiple setQueryData calls
queryClient.setQueryData(queryKey, (old: any) => {
  return {
    ...old,
    // Update multiple fields at once
    field1: newValue1,
    field2: newValue2,
    field3: newValue3,
  };
});
```

## Common Use Cases in ProjectFlow

| Feature           | Pattern            | Priority |
| ----------------- | ------------------ | -------- |
| Drag & Drop Tasks | Update + Rollback  | High     |
| Toggle Pin        | Update + Rollback  | High     |
| Toggle Checklist  | Update + Rollback  | High     |
| Edit Task Name    | Debounce + Update  | Medium   |
| Create Task       | Skeleton + Replace | High     |
| Delete Task       | Remove + Rollback  | High     |
| Add Comment       | Skeleton + Replace | Medium   |
| Update Status     | Update + Rollback  | High     |
| Reorder Items     | Update + Rollback  | Medium   |

## Migration Guide

### Before (Without Optimistic Update)

```typescript
const handleUpdate = () => {
  setLoading(true);
  updateMutation.mutate(data, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setLoading(false);
    },
  });
};
```

### After (With Optimistic Update)

```typescript
const handleUpdate = () => {
  const previousData = queryClient.getQueryData(queryKey);

  queryClient.setQueryData(queryKey, (old: any) => ({
    ...old,
    // Apply changes
  }));

  updateMutation.mutate(data, {
    onError: () => {
      queryClient.setQueryData(queryKey, previousData);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
};
```

## Related Files

- `src/hooks/use-tasks.ts` - Task mutations
- `src/hooks/use-projects.ts` - Project mutations and query keys
- `src/components/views/calendar-view/index.tsx` - Calendar drag & drop example
- `src/components/views/board-view/index.tsx` - Board drag & drop (to be updated)

## References

- [TanStack Query - Optimistic Updates](https://tanstack.com/query/latest/docs/react/guides/optimistic-updates)
- [React Query Best Practices](https://tkdodo.eu/blog/react-query-best-practices)

---

**Last Updated**: 2025-10-21
**Version**: 1.0
**Status**: Ready for development
