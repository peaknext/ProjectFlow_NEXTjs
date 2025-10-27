# Progress Report - October 26, 2025 (Session 2)

**Date**: 2025-10-26
**Session**: Evening Session
**Duration**: ~2 hours

---

## Summary

ปรับปรุงระบบ Permission, UI/UX ของ Modals, และฟังก์ชันการจัดการข้อมูลผู้ใช้

---

## Tasks Completed

### 1. ✅ Fixed MEMBER Permission Bug in List View

**Problem**: MEMBER ไม่สามารถแก้ไขงานของตัวเองใน List View และ Department Tasks ได้ เพราะ API ไม่ส่ง `creatorUserId` field

**Solution**:

- แก้ไข Board API ([src/app/api/projects/[projectId]/board/route.ts:221](src/app/api/projects/[projectId]/board/route.ts#L221))
  - เพิ่ม `creatorUserId: task.creatorUserId` ใน response
- แก้ไข Department Tasks API ([src/app/api/departments/[departmentId]/tasks/route.ts:323](src/app/api/departments/[departmentId]/tasks/route.ts#L323))
  - เพิ่ม `creatorUserId: task.creatorUserId` ใน response

**Result**: MEMBER สามารถแก้ไขงานของตัวเอง (creator/assignee) ได้แล้ว ตามที่กำหนดใน permission system

**Files Changed**:

- `src/app/api/projects/[projectId]/board/route.ts`
- `src/app/api/departments/[departmentId]/tasks/route.ts`

---

### 2. ✅ Added Project Info Button in Department Tasks View

**Feature**: เพิ่มปุ่ม "?" ข้างชื่อโปรเจกต์ในหน้า Department Tasks View

**Implementation**:

- เพิ่ม Info icon button ข้างชื่อโปรเจกต์ ([src/components/views/department-tasks/department-tasks-view.tsx:577-586](src/components/views/department-tasks/department-tasks-view.tsx#L577-L586))
  - Tooltip: "รายละเอียดโปรเจกต์"
  - เมื่อคลิก → เปิด Edit Project Modal
- เพิ่ม `<EditProjectModal />` ในหน้า Department Tasks ([src/app/(dashboard)/department/tasks/page.tsx:190](<src/app/(dashboard)/department/tasks/page.tsx#L190>))

**Result**: ผู้ใช้สามารถดูรายละเอียดโปรเจกต์ได้ง่ายขึ้น โดยไม่ต้องออกจากหน้า Department Tasks

**Files Changed**:

- `src/components/views/department-tasks/department-tasks-view.tsx`
- `src/app/(dashboard)/department/tasks/page.tsx`

---

### 3. ✅ Fixed Edit Project Modal Permission for MEMBER

**Problem**: MEMBER ไม่สามารถเปิด Edit Project Modal ได้ (403 Forbidden)

**Solution**:

- แก้ไข API permission ([src/app/api/projects/[projectId]/edit-details/route.ts:25-30](src/app/api/projects/[projectId]/edit-details/route.ts#L25-L30))
  - เปลี่ยนจาก `edit_projects` → `view_projects`
  - GET = ดูได้ทุกคน, PATCH = แก้ไขได้เฉพาะ ADMIN/CHIEF/LEADER/HEAD
- เพิ่ม Read-Only Mode ([src/components/modals/edit-project-modal.tsx:103-106](src/components/modals/edit-project-modal.tsx#L103-L106))
  - ตรวจสอบ role: ADMIN/CHIEF/LEADER/HEAD → `canEdit = true`
  - MEMBER/USER → `canEdit = false` (read-only)
  - แสดงข้อความ "คุณกำลังดูข้อมูลแบบอ่านอย่างเดียว"
  - ซ่อนปุ่ม Save, disable ทุก input field

**Result**:

- MEMBER สามารถเปิด modal ดูรายละเอียดโปรเจกต์ได้ (read-only)
- ADMIN/CHIEF/LEADER/HEAD สามารถแก้ไขได้ตามปกติ

**Files Changed**:

- `src/app/api/projects/[projectId]/edit-details/route.ts`
- `src/components/modals/edit-project-modal.tsx`

---

### 4. ✅ Updated FullName Format (Thai Convention)

**Change**: ปรับฟังก์ชันสร้าง fullName ให้คำนำหน้าชื่อติดกับชื่อโดยไม่มีวรรค

**Before**: `นาย สมชาย ใจดี`
**After**: `นายสมชาย ใจดี`

**Implementation**:

- แก้ไข `formatFullName()` function ([src/lib/user-utils.ts:25](src/lib/user-utils.ts#L25))
  - เปลี่ยนจาก: `${titlePrefix.trim()} ${firstName.trim()}`
  - เป็น: `${titlePrefix.trim()}${firstName.trim()}`
- อัพเดต API endpoints ให้ใช้ `formatFullName()`:
  - [src/app/api/users/[userId]/route.ts:154](src/app/api/users/[userId]/route.ts#L154)
  - [src/app/api/users/me/route.ts:121](src/app/api/users/me/route.ts#L121)
- อัพเดต Frontend toast messages:
  - [src/components/modals/create-user-modal.tsx:237](src/components/modals/create-user-modal.tsx#L237)
  - [src/components/modals/edit-user-modal.tsx:255](src/components/modals/edit-user-modal.tsx#L255)

**Result**:

- User ใหม่จะใช้ format ใหม่ทันที
- User เก่าจะถูกอัปเดตเมื่อมีการแก้ไขข้อมูล

**Files Changed**:

- `src/lib/user-utils.ts`
- `src/app/api/users/[userId]/route.ts`
- `src/app/api/users/me/route.ts`
- `src/components/modals/create-user-modal.tsx`
- `src/components/modals/edit-user-modal.tsx`

---

### 5. ✅ Edit Project Modal - Dirty Check & Unsaved Changes Warning

**Features**:

1. **Dirty Check**: ตรวจจับการเปลี่ยนแปลงอัตโนมัติ (react-hook-form `isDirty`)
2. **Disabled Save Button**: ปุ่มบันทึก disabled เมื่อไม่มีการเปลี่ยนแปลง
3. **Unsaved Changes Indicator**: แสดงจุดสีส้มกระพริบ + ข้อความเตือน
4. **Confirmation Dialog**: แจ้งเตือนก่อนปิด modal เมื่อมีการเปลี่ยนแปลงที่ยังไม่บันทึก
5. **Removed Cancel Button**: เหลือเพียง icon X บน header
6. **Auto-reset**: หลังบันทึกสำเร็จ → ปิด modal → reset dirty state

**Implementation** ([src/components/modals/edit-project-modal.tsx](src/components/modals/edit-project-modal.tsx)):

- เพิ่ม `formState: { isDirty }` จาก useForm
- เพิ่ม state `showUnsavedWarning` สำหรับ AlertDialog
- อัพเดต `handleClose()` ให้ check isDirty ก่อนปิด
- อัพเดต Footer:
  - แสดง unsaved indicator เมื่อ isDirty = true
  - ปุ่มบันทึก: `disabled={!isDirty || isPending || isLoading}`
- เพิ่ม AlertDialog สำหรับยืนยันการปิด

**Result**: UX ดีขึ้น, ป้องกันการสูญเสียข้อมูล

**Files Changed**:

- `src/components/modals/edit-project-modal.tsx`

---

### 6. ✅ Edit User Modal - Dirty Check & Unsaved Changes Warning

**Features**: (เหมือนกับ Edit Project Modal)

1. **Dirty Check**: ตรวจจับการเปลี่ยนแปลงอัตโนมัติ
2. **Disabled Save Button**: disabled เมื่อไม่มีการเปลี่ยนแปลง
3. **Unsaved Changes Indicator**: แสดงจุดสีส้มกระพริบ + ข้อความเตือน
4. **Confirmation Dialog**: แจ้งเตือนก่อนปิดเมื่อมีการเปลี่ยนแปลง
5. **Removed Cancel Button**: เหลือเพียง icon X
6. **Auto-reset**: หลังบันทึกสำเร็จ → reset dirty state

**Implementation** ([src/components/modals/edit-user-modal.tsx](src/components/modals/edit-user-modal.tsx)):

- เพิ่ม `formState: { isDirty }` จาก useForm
- เพิ่ม state `showUnsavedWarning` สำหรับ AlertDialog
- อัพเดต `handleClose()` ให้ check isDirty ก่อนปิด
- อัพเดต Footer: แสดง indicator + disabled save button
- เพิ่ม AlertDialog สำหรับยืนยันการปิด

**Result**: UX สอดคล้องกันกับ Edit Project Modal

**Files Changed**:

- `src/components/modals/edit-user-modal.tsx`

---

## Files Modified (Summary)

### Backend (API)

- `src/app/api/projects/[projectId]/board/route.ts` - เพิ่ม creatorUserId field
- `src/app/api/departments/[departmentId]/tasks/route.ts` - เพิ่ม creatorUserId field
- `src/app/api/projects/[projectId]/edit-details/route.ts` - เปลี่ยน permission เป็น view_projects
- `src/app/api/users/[userId]/route.ts` - ใช้ formatFullName()
- `src/app/api/users/me/route.ts` - ใช้ formatFullName()

### Frontend (Components)

- `src/components/views/department-tasks/department-tasks-view.tsx` - เพิ่มปุ่ม Info
- `src/app/(dashboard)/department/tasks/page.tsx` - เพิ่ม EditProjectModal
- `src/components/modals/edit-project-modal.tsx` - เพิ่ม dirty check + read-only mode
- `src/components/modals/edit-user-modal.tsx` - เพิ่ม dirty check
- `src/components/modals/create-user-modal.tsx` - อัพเดต fullName format
- `src/components/modals/edit-user-modal.tsx` - อัพเดต fullName format

### Utilities

- `src/lib/user-utils.ts` - แก้ไข formatFullName()

---

## Testing

✅ **All features tested manually**:

- MEMBER สามารถแก้ไขงานของตัวเองได้
- Info button เปิด Edit Project Modal ได้
- MEMBER เปิด modal แบบ read-only ได้
- fullName แสดงในรูปแบบใหม่
- Dirty check ทำงานถูกต้องใน Edit Project Modal
- Dirty check ทำงานถูกต้องใน Edit User Modal
- Unsaved changes warning แสดงเมื่อพยายามปิดโดยไม่บันทึก

---

## Next Steps

1. ทดสอบ Edit Project Modal และ Edit User Modal กับ user จริง
2. ตรวจสอบ permission system ทั้งหมดให้ครบถ้วน
3. ดำเนินการต่อกับ remaining components ตามแผน

---

## Notes

- ระบบ dirty check ใช้ `react-hook-form` built-in `isDirty` state
- AlertDialog ใช้ shadcn/ui component
- Permission check มี 2 ชั้น: Frontend (UX) + Backend (Security)
- fullName format ใหม่จะไม่ทำให้เกิด breaking change (user เก่ายังใช้ format เดิมจนกว่าจะมีการอัปเดต)

---

**Session Completed**: 2025-10-26 Evening
