# Task Ownership System Implementation

**Version**: 1.0.0
**Implementation Date**: 2025-10-27
**Status**: ✅ Complete

---

## Overview

ระบบ Task Ownership เป็นการปรับปรุงครั้งใหญ่ที่เพิ่มความชัดเจนในการจัดการงาน โดยแยกบทบาทระหว่าง **ผู้สร้างงาน (Task Owner)** กับ **ผู้รับมอบหมาย (Assignee)** อย่างชัดเจน

---

## Core Concepts

### 1. Task Owner (ผู้สร้างงาน)
- คนที่สร้างงาน มี `creatorUserId` ในตาราง `tasks`
- มีสิทธิพิเศษในการควบคุมงานของตัวเอง
- ได้รับ notification ทุกครั้งที่มีการเปลี่ยนแปลงในงาน

### 2. Assignee (ผู้รับมอบหมาย)
- คนที่ได้รับมอบหมายให้ทำงาน
- อาจเป็นคนเดียวกับ Task Owner หรือคนอื่นก็ได้
- มีความรับผิดชอบในการดำเนินงาน

---

## Implementation Phases

### ✅ Phase 1: Delete Permission (Creator Only)

**Problem**: ก่อนหน้านี้ assignee สามารถลบงานได้ ทำให้เกิดช่องโหว่ด้านความปลอดภัย

**Attack Scenario**:
1. Member A ต้องการลบงานของ Member B
2. Member A assign ตัวเองไปในงานของ Member B
3. Member A ลบงานได้เพราะกลายเป็น assignee

**Solution**: แก้ไข `delete_own_tasks` permission ให้ check เฉพาะ creator

**ไฟล์ที่แก้ไข**:
- `src/lib/permissions.ts` (Lines 175-189)
- `PERMISSION_GUIDELINE.md` (Version 1.3.0)

**Code Changes**:
```typescript
// ❌ Before (SECURITY FLAW):
return task.creatorUserId === userId || isAssignee;

// ✅ After (SECURE):
return task.creatorUserId === userId; // Only creator
```

---

### ✅ Phase 2: Assignment Permission Check

**Problem**: ไม่มีการตรวจสอบว่าใครสามารถ assign/re-assign งานได้

**Solution**: เพิ่ม security check ใน PATCH `/api/tasks/:taskId`

**ผู้ที่สามารถ assign งานได้**:
1. **Task Creator** - ผู้สร้างงานสามารถมอบหมายให้ใครก็ได้
2. **Management Roles** - ADMIN, CHIEF, LEADER, HEAD (ภายใน scope)
3. **Current Assignee** - ผู้รับมอบหมายปัจจุบันสามารถส่งต่อความรับผิดชอบได้

**ไฟล์ที่แก้ไข**:
- `src/app/api/tasks/[taskId]/route.ts` (Lines 226-252)

**Code Changes**:
```typescript
// ✅ SECURITY: Check assignment permission
const isCreator = existingTask.creatorUserId === req.session.userId;
const isManagement = ['ADMIN', 'CHIEF', 'LEADER', 'HEAD'].includes(currentUser.role);
const isCurrentAssignee = /* check current assignees */;

if (!isCreator && !isManagement && !isCurrentAssignee) {
  return errorResponse('FORBIDDEN', 'Only task creator, management roles, or current assignees can assign this task', 403);
}
```

---

### ✅ Phase 3: Widget Separation

**Problem**: Dashboard widget "งานของฉัน" แสดงทั้งงานที่สร้างและงานที่ได้รับมอบหมายปนกัน ทำให้สับสน

**Solution**: แยกเป็น 2 widgets ที่แตกต่างกัน

#### Widget 1: งานที่ฉันสร้าง (My Created Tasks)
- **Query**: `WHERE creatorUserId = userId`
- **ไอคอน**: PenSquare (ปากกา) - สีน้ำเงิน 🔵
- **ความหมาย**: งานทั้งหมดที่ฉันเป็นคนสร้าง (ไม่ว่าจะ assign ให้ใครก็ตาม)

#### Widget 2: งานที่มอบหมายให้ฉัน (Assigned to Me)
- **Query**: `WHERE assignees contains userId AND creatorUserId != userId`
- **ไอคอน**: UserCheck (ผู้ใช้ + เครื่องหมายถูก) - สีเขียว 🟢
- **ความหมาย**: งานที่คนอื่นมอบหมายให้ฉัน (exclude งานที่ฉันสร้างเอง)

**ไฟล์ที่แก้ไข**:
- `src/app/api/dashboard/route.ts` - แยก query เป็น 2 อัน
- `src/types/dashboard.ts` - เพิ่ม `myCreatedTasks` และ `assignedToMeTasks`
- `src/components/dashboard/my-created-tasks-widget.tsx` - **NEW** component
- `src/components/dashboard/my-tasks-widget.tsx` - เปลี่ยนชื่อเป็น "งานที่มอบหมายให้ฉัน"
- `src/app/(dashboard)/dashboard/page.tsx` - แสดงทั้ง 2 widgets

**Benefits**:
- ✅ ไม่มีงานซ้ำระหว่าง 2 widgets
- ✅ แยกความรับผิดชอบชัดเจน (งานที่ฉันสร้าง vs งานที่รับมอบหมาย)
- ✅ ใช้ไอคอนและสีที่แตกต่างกันเพื่อความชัดเจน

---

### ✅ Phase 4: Task Owner Notifications (7 Cases)

**Principle**: Task owner ได้รับ notification **ทุกครั้ง** ที่มีคนอื่นทำการเปลี่ยนแปลงในงานของตัวเอง

#### 1. TASK_ASSIGNED - มอบหมาย/Re-assign งาน

**Trigger**: คนอื่น assign/re-assign งานของคุณให้กับใครบางคน

**Message Format**:
```
"{ชื่อผู้ใช้} ได้มอบหมายงาน "{ชื่องาน}" ของคุณให้กับ {ชื่อ assignee}"
```

**ไฟล์**: `src/app/api/tasks/[taskId]/route.ts`
- Lines 446-465 (Multi-assignee)
- Lines 522-538 (Legacy single-assignee - new assignment)
- Lines 565-581 (Legacy single-assignee - reassignment)

**Duplicate Prevention**:
- ❌ ไม่ส่งถ้า owner เป็นคนมอบหมายเอง
- ❌ ไม่ส่งถ้า owner อยู่ในรายชื่อ assignee ใหม่ (จะได้ notification แบบ assignee แทน)

---

#### 2. TASK_UPDATED - แก้ไขฟิลด์สำคัญ

**Trigger**: คนอื่นแก้ไขงานของคุณในฟิลด์สำคัญ:
- ชื่องาน (name)
- คำอธิบาย (description)
- สถานะ (statusId)
- ความสำคัญ (priority)
- ความยาก (difficulty)
- วันเริ่มต้น (startDate)
- วันครบกำหนด (dueDate)

**Message Format**:
```
"{ชื่อผู้ใช้} ได้อัปเดตงาน "{ชื่องาน}" ของคุณ"
```

**ไฟล์**: `src/app/api/tasks/[taskId]/route.ts` (Lines 700-725)

**Duplicate Prevention**:
- ❌ ไม่ส่งถ้า owner เป็นคนแก้ไขเอง
- ❌ ไม่ส่งถ้าเป็นการ assign เท่านั้น (จะได้ TASK_ASSIGNED แทน)

---

#### 3. TASK_CLOSED - ปิดงาน

**Trigger**: คนอื่นปิดงานของคุณ (COMPLETED หรือ ABORTED)

**Message Format**:
- **COMPLETED**: `"{ชื่อผู้ใช้} ได้ปิดงาน "{ชื่องาน}" ของคุณ (เสร็จสมบูรณ์)"`
- **ABORTED**: `"{ชื่อผู้ใช้} ได้ยกเลิกงาน "{ชื่องาน}" ของคุณ เหตุผล: {เหตุผล}"`

**ไฟล์**: `src/app/api/tasks/[taskId]/close/route.ts` (Lines 123-144)

**Duplicate Prevention**:
- ❌ ไม่ส่งถ้า owner เป็นคนปิดเอง
- ❌ ไม่ส่งถ้า owner เป็น assignee (จะได้ notification แบบ assignee แทน)

---

#### 4. COMMENT - คอมเมนต์ใหม่

**Trigger**: มีคนแสดงความคิดเห็นในงานของคุณ (ไม่จำเป็นต้องแท็ก @ คุณ)

**Message Format**:
```
"{ชื่อผู้ใช้} แสดงความคิดเห็นในงาน "{ชื่องาน}" ของคุณ"
```

**ไฟล์**: `src/app/api/tasks/[taskId]/comments/route.ts` (Lines 169-185)

**Duplicate Prevention**:
- ❌ ไม่ส่งถ้า owner เป็นคนคอมเมนต์เอง
- ❌ ไม่ส่งถ้า owner ถูกแท็ก @ ในคอมเมนต์ (จะได้ COMMENT_MENTION แทน)

---

#### 5. CHECKLIST_CREATE - เพิ่ม Checklist Item

**Trigger**: คนอื่นเพิ่ม checklist item ในงานของคุณ

**Message Format**:
```
"{ชื่อผู้ใช้} เพิ่มรายการ "{ชื่อ item}" ในงาน "{ชื่องาน}" ของคุณ"
```

**ไฟล์**: `src/app/api/tasks/[taskId]/checklists/route.ts` (Lines 128-139)

**Duplicate Prevention**:
- ❌ ไม่ส่งถ้า owner เป็นคนเพิ่มเอง

---

#### 6. CHECKLIST_UPDATE - แก้ไข/ติ๊ก Checklist Item

**Trigger**: คนอื่นแก้ไขชื่อหรือติ๊ก/ยกเลิกติ๊กเครื่องหมาย checklist item

**Message Format**:
- **แก้ไขชื่อ**: `"{ชื่อผู้ใช้} แก้ไขรายการ "{ชื่อ item เดิม}" ในงาน "{ชื่องาน}" ของคุณ"`
- **ทำเครื่องหมาย**: `"{ชื่อผู้ใช้} ทำเครื่องหมาย "{ชื่อ item}" ในงาน "{ชื่องาน}" ของคุณ"`
- **ยกเลิกเครื่องหมาย**: `"{ชื่อผู้ใช้} ยกเลิกการทำเครื่องหมาย "{ชื่อ item}" ในงาน "{ชื่องาน}" ของคุณ"`

**ไฟล์**: `src/app/api/tasks/[taskId]/checklists/[itemId]/route.ts`
- Lines 99-110 (Name change)
- Lines 124-136 (Checkbox toggle)

**Duplicate Prevention**:
- ❌ ไม่ส่งถ้า owner เป็นคนแก้ไขเอง

---

#### 7. CHECKLIST_DELETE - ลบ Checklist Item

**Trigger**: คนอื่นลบ checklist item จากงานของคุณ

**Message Format**:
```
"{ชื่อผู้ใช้} ลบรายการ "{ชื่อ item}" จากงาน "{ชื่องาน}" ของคุณ"
```

**ไฟล์**: `src/app/api/tasks/[taskId]/checklists/[itemId]/route.ts` (Lines 208-219)

**Duplicate Prevention**:
- ❌ ไม่ส่งถ้า owner เป็นคนลบเอง

---

## Notification Type Usage

ทุก notification ใช้ existing types ไม่ต้องสร้าง type ใหม่:

| Use Case | Notification Type | Icon | Color |
|----------|-------------------|------|-------|
| มอบหมาย/Re-assign | `TASK_ASSIGNED` | UserPlus | Blue 🔵 |
| แก้ไขฟิลด์สำคัญ | `TASK_UPDATED` | RefreshCw | Green 🟢 |
| ปิดงาน | `TASK_CLOSED` | CheckCircle | Emerald 🟢 |
| คอมเมนต์ | `COMMENT_MENTION` | AtSign | Purple 🟣 |
| Checklist (ทุกการกระทำ) | `TASK_UPDATED` | RefreshCw | Green 🟢 |

---

## Example Scenarios

### Scenario 1: Basic Task Creation and Assignment
```
1. Member A สร้างงาน "Setup Server"
2. Member B assign งานให้ Member C
   → Member A ได้: "Member B ได้มอบหมายงาน 'Setup Server' ของคุณให้กับ Member C"
   → Member C ได้: "Member B ได้มอบหมายงาน 'Setup Server' ให้กับคุณ"
```

### Scenario 2: Self-Assignment (No Duplicate)
```
1. Member A สร้างงาน "Setup Server"
2. Member A assign งานให้ตัวเอง
   → ❌ Member A ไม่ได้ notification (เพราะเป็นทั้ง owner และคนทำการ assign)
```

### Scenario 3: Comment with Mention
```
1. Member A สร้างงาน assign ให้ Member B
2. Member C คอมเมนต์แท็ก @A
   → Member A ได้: "Member C ได้แท็กคุณในความคิดเห็น" (COMMENT_MENTION)
   → ❌ ไม่ได้อีก 1 ฉบับจากการเป็น task owner (ป้องกันซ้ำ)
```

### Scenario 4: Comment without Mention
```
1. Member A สร้างงาน assign ให้ Member B
2. Member C คอมเมนต์โดยไม่แท็ก
   → Member A ได้: "Member C แสดงความคิดเห็นในงาน 'Setup Server' ของคุณ"
   → ❌ Member B ไม่ได้ notification (เพราะไม่ได้ถูกแท็ก และไม่ใช่ owner)
```

### Scenario 5: Checklist Operations
```
1. Member A สร้างงาน "Setup Server"
2. Member B เพิ่ม checklist "ตรวจสอบเอกสาร"
   → Member A ได้: "Member B เพิ่มรายการ 'ตรวจสอบเอกสาร' ในงาน 'Setup Server' ของคุณ"
3. Member C ทำเครื่องหมาย checklist
   → Member A ได้: "Member C ทำเครื่องหมาย 'ตรวจสอบเอกสาร' ในงาน 'Setup Server' ของคุณ"
4. Member D ลบ checklist
   → Member A ได้: "Member D ลบรายการ 'ตรวจสอบเอกสาร' จากงาน 'Setup Server' ของคุณ"
```

---

## Files Modified

### Backend API (7 files)
1. `src/lib/permissions.ts` - Delete permission fix
2. `src/app/api/tasks/[taskId]/route.ts` - Assignment permission + ASSIGNED/UPDATED notifications
3. `src/app/api/tasks/[taskId]/close/route.ts` - CLOSED notification
4. `src/app/api/tasks/[taskId]/comments/route.ts` - COMMENT notification
5. `src/app/api/tasks/[taskId]/checklists/route.ts` - CHECKLIST_CREATE notification
6. `src/app/api/tasks/[taskId]/checklists/[itemId]/route.ts` - CHECKLIST_UPDATE/DELETE notifications
7. `src/app/api/dashboard/route.ts` - Widget separation queries

### Frontend Components (4 files)
1. `src/types/dashboard.ts` - Type definitions
2. `src/components/dashboard/my-created-tasks-widget.tsx` - **NEW** component
3. `src/components/dashboard/my-tasks-widget.tsx` - Updated title and icon
4. `src/app/(dashboard)/dashboard/page.tsx` - Display both widgets

### Documentation (2 files)
1. `PERMISSION_GUIDELINE.md` - Updated to v1.3.0
2. `TASK_OWNERSHIP_SYSTEM.md` - **NEW** (this file)

**Total**: 13 files modified/created

---

## Testing Checklist

### Phase 1: Delete Permission
- [ ] Task creator สามารถลบงานของตัวเองได้
- [ ] Assignee ไม่สามารถลบงานที่ไม่ใช่ของตัวเองได้
- [ ] ADMIN สามารถลบงานใดๆ ก็ได้

### Phase 2: Assignment Permission
- [ ] Task creator สามารถ assign งานของตัวเองได้
- [ ] Management roles สามารถ assign งานใน scope ได้
- [ ] Current assignee สามารถ re-assign งานได้
- [ ] MEMBER ที่ไม่เกี่ยวข้องไม่สามารถ assign งานได้ (403 Forbidden)

### Phase 3: Widget Separation
- [ ] Widget "งานที่ฉันสร้าง" แสดงเฉพาะงานที่ฉันสร้าง
- [ ] Widget "งานที่มอบหมายให้ฉัน" แสดงเฉพาะงานที่คนอื่นมอบหมาย (exclude งานที่สร้างเอง)
- [ ] ไม่มีงานซ้ำระหว่าง 2 widgets
- [ ] ไอคอนและสีแสดงถูกต้อง (น้ำเงิน vs เขียว)

### Phase 4: Task Owner Notifications
- [ ] TASK_ASSIGNED: Owner ได้รับ notification เมื่อคนอื่น assign งาน
- [ ] TASK_UPDATED: Owner ได้รับ notification เมื่อคนอื่นแก้ไขงาน
- [ ] TASK_CLOSED: Owner ได้รับ notification เมื่อคนอื่นปิดงาน
- [ ] COMMENT: Owner ได้รับ notification เมื่อมีคนคอมเมนต์
- [ ] CHECKLIST_CREATE: Owner ได้รับ notification เมื่อมีคนเพิ่ม checklist
- [ ] CHECKLIST_UPDATE: Owner ได้รับ notification เมื่อมีคนแก้ไข/ติ๊ก checklist
- [ ] CHECKLIST_DELETE: Owner ได้รับ notification เมื่อมีคนลบ checklist
- [ ] Owner ไม่ได้รับ notification ซ้ำซ้อนเมื่อทำการเปลี่ยนแปลงเอง

---

## Known Limitations

1. **Subtask Notifications**: ยังไม่ได้ implement (เก็บไว้ Version ถัดไป)
2. **Bulk Operations**: Notification อาจถูกส่งมากเกินไปถ้ามีการ bulk assign หลายงานพร้อมกัน
3. **Email Notifications**: ยังส่งแค่ใน-app notification ยังไม่ส่ง email

---

## Future Enhancements (Version 2.0+)

1. **Subtask Notifications**: เพิ่ม notification เมื่อมีการเพิ่ม/ลบ/แก้ไข subtask
2. **Notification Grouping**: รวม notification ที่เกิดจากการกระทำเดียวกัน (เช่น bulk assign)
3. **Email Digest**: ส่ง email สรุป notification ประจำวัน/สัปดาห์
4. **Notification Preferences**: ให้ user เลือกได้ว่าต้องการได้รับ notification แบบไหน
5. **Push Notifications**: ส่ง push notification แบบ real-time
6. **Task Watchers**: ให้คนที่สนใจสามารถ "watch" งานและได้รับ notification แม้ไม่ใช่ owner/assignee

---

## Migration Notes

**Breaking Changes**: ไม่มี
**Database Changes**: ไม่มี (ใช้ field `creatorUserId` ที่มีอยู่แล้ว)
**API Changes**: Backward compatible (เพิ่ม notification เท่านั้น)

---

## Conclusion

Task Ownership System ช่วยให้การจัดการงานมีความชัดเจนมากขึ้น โดย:
- ✅ แยกบทบาท owner และ assignee ชัดเจน
- ✅ ป้องกันช่องโหว่ด้านความปลอดภัย (delete, assignment)
- ✅ Task owner ติดตามการเปลี่ยนแปลงในงานของตัวเองได้ทันที
- ✅ UI แยกแสดงงานที่สร้างและงานที่ได้รับมอบหมายชัดเจน

ระบบนี้เป็นรากฐานสำคัญสำหรับการพัฒนา collaborative features ในอนาคต เช่น task delegation, workflow automation, และ team analytics.
