# หลักการปิดงาน (Task Closing Logic)

**เอกสารนี้อธิบายหลักการทำงานของระบบสถานะงานและการปิดงานใน ProjectFlows**

**เวอร์ชัน**: 1.0.0
**วันที่อัปเดต**: 2025-10-28
**วัตถุประสงค์**: บันทึกความเข้าใจเกี่ยวกับความแตกต่างระหว่าง Status Type และ Close Type

---

## 📌 หลักการพื้นฐาน

### 1. ชุดสถานะงาน (Project Statuses)

- **ชุดสถานะจะถูกกำหนดระดับโปรเจกต์** - งานทุกงานในโปรเจกต์เดียวกันจะใช้ชุดสถานะเดียวกัน
- **แต่ละชุดสถานะมี 3 องค์ประกอบหลัก**:
  1. `name` - ชื่อสถานะ (เช่น "รอดำเนินการ", "กำลังดำเนินการ", "เสร็จสิ้น")
  2. `order` - ลำดับที่ (1, 2, 3, ..., max)
  3. `type` - ชนิดของสถานะ (`NOT_STARTED`, `IN_PROGRESS`, `DONE`)

**ตัวอย่าง**:

```
โปรเจกต์ A:
- รับงาน (order: 1, type: NOT_STARTED)
- กำลังดำเนินการ (order: 2, type: IN_PROGRESS)
- เสร็จสิ้น (order: 3, type: DONE)

โปรเจกต์ B:
- รออนุมัติ (order: 1, type: NOT_STARTED)
- จัดหาครุภัณฑ์ (order: 2, type: IN_PROGRESS)
- ตรวจรับ (order: 3, type: IN_PROGRESS)
- ส่งมอบ (order: 4, type: DONE)
```

---

## 📐 กฎการกำหนด Status Type

**Status Type จะถูกกำหนดโดยอัตโนมัติตามลำดับ (order)**:

| ลำดับ (order) | Status Type | หมายเหตุ |
|---------------|-------------|----------|
| `order = 1` | `NOT_STARTED` | สถานะแรกเสมอ - งานยังไม่เริ่ม |
| `1 < order < max` | `IN_PROGRESS` | สถานะระหว่างดำเนินการ |
| `order = max` | `DONE` | สถานะสุดท้ายเสมอ - งานเสร็จสมบูรณ์ |

**กฎสำคัญ**:
- ✅ **ต้องมี `NOT_STARTED` แค่ 1 สถานะ** - อยู่ที่ order=1 เสมอ
- ✅ **ต้องมี `DONE` แค่ 1 สถานะ** - อยู่ที่ order=max เสมอ
- ✅ **`IN_PROGRESS` มีได้มากกว่า 1 สถานะ** - อยู่ระหว่าง 1 กับ max
- ✅ **การเพิ่ม/ลบสถานะ ต้อง recalculate `type` ใหม่** - เพื่อให้สอดคล้องกับกฎข้างต้น

**ตัวอย่างการ recalculate**:

```
เดิม (3 สถานะ):
[order:1, type:NOT_STARTED] → [order:2, type:IN_PROGRESS] → [order:3, type:DONE]

เพิ่มสถานะใหม่ (4 สถานะ):
[order:1, type:NOT_STARTED] → [order:2, type:IN_PROGRESS] → [order:3, type:IN_PROGRESS] → [order:4, type:DONE]
                                                             ↑ เดิมเป็น DONE → เปลี่ยนเป็น IN_PROGRESS
                                                                                                  ↑ ใหม่กลายเป็น DONE

ลบสถานะสุดท้าย (3 สถานะ):
[order:1, type:NOT_STARTED] → [order:2, type:IN_PROGRESS] → [order:3, type:DONE]
                                                             ↑ เดิมเป็น IN_PROGRESS → เปลี่ยนเป็น DONE
```

---

## 🔒 การปิดงาน (Task Closing)

**การปิดงาน คือการบอกระบบว่าผู้ใช้จะไม่มีการกระทำกับงานนั้นอีกแล้ว**

### 2 ประเภทการปิดงาน:

#### 1. **ปิดงาน (แล้วเสร็จ)** - `COMPLETED`
- งานสำเร็จตามวัตถุประสงค์
- `task.isClosed = true`
- `task.closeType = 'COMPLETED'`
- `task.closedAt = DateTime`
- `task.closedBy = userId`

#### 2. **ยกเลิกงาน** - `ABORTED`
- งานไม่สามารถทำต่อได้ / ถูกยกเลิก
- `task.isClosed = true`
- `task.closeType = 'ABORTED'`
- `task.closedAt = DateTime`
- `task.closedBy = userId`
- **ต้องระบุเหตุผล** (reason field)

---

## ⚠️ ความแตกต่างที่สำคัญ

### Status Type vs Close Type

| | Status Type | Close Type |
|---|-------------|------------|
| **ใช้กับ** | ตาราง `statuses` | ตาราง `tasks` |
| **ความหมาย** | **ความก้าวหน้าของงาน** (แสดงงานอยู่ขั้นตอนไหน) | **สถานะปิดงาน** (งานจบแล้วหรือยัง) |
| **ค่าที่เป็นไปได้** | `NOT_STARTED`, `IN_PROGRESS`, `DONE` | `COMPLETED`, `ABORTED` |
| **กำหนดโดย** | โปรเจกต์ (เซ็ตตอนสร้างโปรเจกต์) | ผู้ใช้ (ปิดงานตอนทำเสร็จหรือยกเลิก) |
| **Lifecycle** | มีตลอดชีวิตงาน - เปลี่ยนได้ตามความคืบหน้า | มีเมื่อปิดงานแล้วเท่านั้น |

**ตัวอย่างที่ถูกต้อง**:

```typescript
// ✅ CORRECT - งานที่กำลังดำเนินการ และยังไม่ปิด
{
  statusId: "status002",  // สถานะ "กำลังดำเนินการ" (type: IN_PROGRESS)
  isClosed: false,
  closeType: null
}

// ✅ CORRECT - งานที่เสร็จสิ้นและปิดแล้ว (สำเร็จ)
{
  statusId: "status003",  // สถานะ "เสร็จสิ้น" (type: DONE)
  isClosed: true,
  closeType: "COMPLETED"
}

// ✅ CORRECT - งานที่ยังไม่เสร็จแต่ถูกยกเลิก
{
  statusId: "status002",  // สถานะ "กำลังดำเนินการ" (type: IN_PROGRESS)
  isClosed: true,
  closeType: "ABORTED"
}
```

**ตัวอย่างที่ผิด**:

```typescript
// ❌ WRONG - Status type ไม่มีค่า ABORTED
{
  name: "งานถูกยกเลิก",
  type: "ABORTED"  // ❌ ABORTED เป็น closeType ไม่ใช่ statusType
}

// ❌ WRONG - Status type ไม่มีค่า COMPLETED
{
  name: "งานเสร็จสมบูรณ์",
  type: "COMPLETED"  // ❌ COMPLETED เป็น closeType ไม่ใช่ statusType
}
```

---

## 📊 Database Schema

### ตาราง `statuses`

```prisma
model Status {
  id        String     @id @default(cuid())
  name      String
  color     String
  order     Int
  type      StatusType  // ✅ NOT_STARTED, IN_PROGRESS, DONE
  projectId String

  project Project @relation(...)
  tasks   Task[]
}

enum StatusType {
  NOT_STARTED
  IN_PROGRESS
  DONE
  // ❌ ไม่มี ABORTED, COMPLETED, CANCELED
}
```

### ตาราง `tasks`

```prisma
model Task {
  id         String     @id @default(cuid())
  name       String
  projectId  String
  statusId   String
  isClosed   Boolean    @default(false)
  closeType  CloseType?  // ✅ COMPLETED, ABORTED
  closedAt   DateTime?
  closedBy   String?

  status     Status     @relation(...)
}

enum CloseType {
  COMPLETED
  ABORTED
  // ❌ ไม่มี NOT_STARTED, IN_PROGRESS, DONE
}
```

---

## 🔧 Implementation Guidelines

### 1. การสร้างโปรเจกต์ใหม่

**ใน CreateProjectModal.tsx**:

```typescript
// ✅ CORRECT - Auto-calculate statusType
const statusesData = data.statuses.map((status, index, array) => ({
  name: status.name.trim(),
  color: status.color,
  order: index + 1,
  statusType:
    index === 0 ? "NOT_STARTED" :
    index === array.length - 1 ? "DONE" :
    "IN_PROGRESS"
}));
```

**ใน API route**:

```typescript
// ✅ CORRECT - Validation schema
statuses: z.array(z.object({
  name: z.string(),
  color: z.string(),
  order: z.number(),
  statusType: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'DONE']),  // ไม่มี ABORTED, CANCELED
}))
```

### 2. การปิดงาน

**API Endpoint**: `POST /api/tasks/:taskId/close`

```typescript
// ✅ CORRECT - Close as completed
{
  "type": "COMPLETED"
}

// ✅ CORRECT - Close as aborted (requires reason)
{
  "type": "ABORTED",
  "reason": "Requirements changed - no longer needed"
}
```

**Frontend Usage**:

```typescript
// ✅ CORRECT
import { useCloseTask } from "@/hooks/use-tasks";

const closeTaskMutation = useCloseTask(projectId);

// ปิดงาน (แล้วเสร็จ)
closeTaskMutation.mutate({
  taskId: "task001",
  type: "COMPLETED",
});

// ยกเลิกงาน
closeTaskMutation.mutate({
  taskId: "task002",
  type: "ABORTED",
  reason: "เปลี่ยนแปลง requirements - ไม่จำเป็นต้องทำแล้ว",
});
```

---

## 📝 Common Mistakes

### ❌ Mistake 1: ใช้ ABORTED ใน Status Type
```typescript
// ❌ WRONG
interface Status {
  statusType: "NOT_STARTED" | "IN_PROGRESS" | "DONE" | "ABORTED";  // ABORTED ไม่ควรอยู่ที่นี่
}
```

### ❌ Mistake 2: ใช้ CANCELED แทน ABORTED
```typescript
// ❌ WRONG - CANCELED ไม่มีใน schema
statusType: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'DONE', 'CANCELED'])
```

### ❌ Mistake 3: ไม่ recalculate statusType เมื่อเพิ่ม/ลบสถานะ
```typescript
// ❌ WRONG - ใช้ค่าเดิมจาก form
const statusesData = data.statuses.map((status, index) => ({
  ...status,
  statusType: status.statusType  // ไม่ recalculate!
}));
```

---

## ✅ Best Practices

1. **ใช้ Auto-calculate** - ให้ระบบคำนวณ `statusType` อัตโนมัติตาม `order`
2. **แยกแยะ Type** - เข้าใจความแตกต่างระหว่าง `StatusType` และ `CloseType`
3. **Validate ตาม Schema** - ใช้ค่าที่มีใน Prisma schema เท่านั้น
4. **Recalculate เสมอ** - เมื่อมีการเพิ่ม/ลบ/เรียงใหม่ ต้อง recalculate `statusType`
5. **Comment ให้ชัด** - ระบุใน comment ว่า field ไหนเป็น `StatusType` หรือ `CloseType`

---

## 📚 Related Files

- `src/components/modals/create-project-modal.tsx` - สร้างโปรเจกต์และสถานะ
- `src/app/api/projects/route.ts` - API สร้างโปรเจกต์
- `src/app/api/tasks/[taskId]/close/route.ts` - API ปิดงาน
- `src/hooks/use-tasks.ts` - Hook สำหรับปิดงาน
- `prisma/schema.prisma` - Database schema (StatusType, CloseType enums)

---

**สรุป**: Status Type แสดง**ความก้าวหน้า**ของงาน (NOT_STARTED → IN_PROGRESS → DONE) ขณะที่ Close Type แสดง**การสิ้นสุด**ของงาน (COMPLETED หรือ ABORTED) - ทั้งสองไม่เกี่ยวข้องกันและไม่ควรนำมาปนกัน
