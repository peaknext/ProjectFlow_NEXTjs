# ActivityLog to History Migration Guide

## ⚠️ IMPORTANT: Database Model Name Correction

### The Issue
Early migration documentation incorrectly referenced a model called `ActivityLog`, but the actual Prisma schema uses `History`.

### Correct Model Name
- ❌ **WRONG**: `prisma.activityLog`
- ✅ **CORRECT**: `prisma.history`

---

## Database Schema

The correct model in `prisma/schema.prisma`:

```prisma
model History {
  id           String   @id @default(cuid())
  historyText  String
  historyDate  DateTime @default(now())
  taskId       String
  userId       String

  task Task @relation(fields: [taskId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id])

  @@index([taskId])
  @@index([userId])
  @@index([historyDate])
  @@map("histories")
}
```

**Key fields:**
- `taskId` - Required (History is always associated with a task)
- `userId` - User who performed the action
- `historyText` - Thai language description of the action
- `historyDate` - Auto-set to current timestamp

---

## How to Use

### ✅ Correct Usage

```typescript
// Create history log for task creation
await prisma.history.create({
  data: {
    taskId: task.id,
    userId: req.session.userId,
    historyText: `สร้างงาน "${task.name}"`,
  },
});

// Create history log for task update
await prisma.history.create({
  data: {
    taskId: task.id,
    userId: req.session.userId,
    historyText: `อัปเดต ${fieldName} จาก "${oldValue}" เป็น "${newValue}"`,
  },
});
```

### ❌ Incorrect Usage (Old Documentation)

```typescript
// DON'T USE - Model doesn't exist
await prisma.activityLog.create({
  data: {
    userId: req.session.userId,
    actionType: 'CREATE',
    entityType: 'Task',
    entityId: task.id,
    changes: { created: task },
  },
});
```

---

## Files Already Fixed

### API Routes ✅
1. `src/app/api/projects/[projectId]/tasks/route.ts` - Fixed (2025-10-23)
2. `src/app/api/batch/route.ts` - Variable names updated to `historyLog`
3. `src/app/api/users/[userId]/status/route.ts` - Commented TODO updated

### Documentation ✅
1. `CLAUDE.md` - Added to Common Pitfalls #8
2. `CLAUDE.md` - Added to Core Schema Patterns

---

## Migration Checklist

When working with task history:

- [ ] Always use `prisma.history` not `prisma.activityLog`
- [ ] Always include `taskId` in the data
- [ ] Always include `userId` (who performed the action)
- [ ] Use Thai language for `historyText`
- [ ] Don't try to log user-level activities (no taskId available)

---

## Why This Confusion Happened

The original migration documentation from Google Apps Script referred to "activity logs" conceptually, and some early code examples used `activityLog` as a model name. However, the actual Prisma schema was correctly implemented as `History` from the start.

**Lesson learned**: Always verify model names in `prisma/schema.prisma` before using them in code.

---

## Related Files

**Outdated documentation** (contains `ActivityLog` references - for historical context only):
- `migration_plan/01_DATABASE_MIGRATION.md`
- `migration_plan/02_API_MIGRATION.md`
- `migration_plan/06_BUSINESS_LOGIC_GUIDE.md`
- `.claude/context/architecture.md`

**Note**: These files are kept for migration reference but should NOT be used as API implementation guides.

---

**Last Updated**: 2025-10-23
**Status**: ✅ All API code fixed, documentation updated
