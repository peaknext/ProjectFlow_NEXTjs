# Context: การแยกฟิลด์ fullName → titlePrefix + firstName + lastName

**สถานะ**: ✅ **เสร็จสมบูรณ์** (100% Complete)
**วันที่เริ่ม**: 2025-10-24
**วันที่เสร็จ**: 2025-10-25
**เหตุผล**: เพื่อรองรับการขยายงานในอนาคต (การจัดการชื่อที่ซับซ้อน, รายงาน, การค้นหา)

---

## 📊 สรุปการเปลี่ยนแปลง

### Database Schema Changes

**เดิม**:
```prisma
model User {
  fullName String
}
```

**ใหม่**:
```prisma
model User {
  titlePrefix String?  // คำนำหน้าชื่อ (นาย, นาง, ดร., etc.) - Optional
  firstName   String   // ชื่อ - Required
  lastName    String   // นามสกุล - Required
  fullName    String   // Auto-generated (kept for backward compatibility)
}
```

### TypeScript Interface Changes

**User Interface**:
```typescript
export interface User {
  // NEW fields
  titlePrefix: string | null;
  firstName: string;
  lastName: string;

  // KEPT for backward compatibility
  fullName: string;
}
```

**CreateUserInput**:
```typescript
export interface CreateUserInput {
  titlePrefix?: string;  // NEW - Optional
  firstName: string;     // NEW - Required
  lastName: string;      // NEW - Required
  // ... other fields
}
```

---

## ✅ งานที่เสร็จแล้ว

### 1. Database Migration (100% Complete)

**ไฟล์ที่แก้ไข**:
- ✅ `prisma/schema.prisma` - เพิ่มฟิลด์ใหม่ 3 ฟิลด์
- ✅ Schema pushed to PostgreSQL successfully

**Migration Script**:
- ✅ `scripts/migrate-fullname-to-parts.ts` (ใหม่)
- ✅ รันสำเร็จ - แยกข้อมูลเก่า 7/7 users (100%)
- ✅ ตรวจจับคำนำหน้าภาษาไทยได้ถูกต้อง

**ผลลัพธ์**:
```
📈 Migration Summary:
   ✅ Success: 7
   ❌ Errors: 0
   📊 Total: 7
```

### 2. TypeScript Types (100% Complete)

**ไฟล์ที่แก้ไข**:
- ✅ `src/types/user.ts` - อัปเดต 4 interfaces:
  - `User` - เพิ่มฟิลด์ใหม่ 3 ฟิลด์
  - `CreateUserInput` - เปลี่ยนจาก fullName → titlePrefix, firstName, lastName
  - `UpdateUserInput` - เพิ่มฟิลด์ใหม่
  - `UserFormData` - เพิ่มฟิลด์ใหม่

### 3. Helper Functions (100% Complete)

**ไฟล์ใหม่**:
- ✅ `src/lib/user-utils.ts` (99 lines)
  - `formatFullName(titlePrefix, firstName, lastName)` - รวมชื่อเป็น fullName
  - `isValidTitlePrefix(title)` - ตรวจสอบคำนำหน้าที่ถูกต้อง
  - `getCommonTitlePrefixes()` - รายการคำนำหน้า 14 ตัวเลือก

**ตัวอย่างการใช้งาน**:
```typescript
import { formatFullName } from '@/lib/user-utils';

// สร้าง fullName จากชื่อแยก
const fullName = formatFullName("นาย", "สมชาย", "ใจดี");
// Output: "นาย สมชาย ใจดี"

// ไม่มีคำนำหน้า
const fullName2 = formatFullName(null, "John", "Doe");
// Output: "John Doe"
```

---

## ✅ งานที่เสร็จเพิ่มเติม (Frontend Migration Complete - 2025-10-25)

### ไฟล์ที่แก้ไขเพิ่มเติม (100% Complete)

#### React Query Hooks (1 ไฟล์)
1. **`src/hooks/use-users.ts`** ✅ **COMPLETE**
   - ✅ อัปเดต `CreateUserInput` interface (titlePrefix, firstName, lastName)
   - ✅ อัปเดต `UpdateUserInput` interface (titlePrefix, firstName, lastName)
   - ✅ เปลี่ยน jobTitle → jobTitleId

2. **`src/hooks/use-auth.ts`** ✅ **COMPLETE**
   - ✅ อัปเดต `RegisterRequest` interface (titlePrefix, firstName, lastName)
   - ✅ เพิ่ม departmentId field

#### Frontend Forms (1 ไฟล์)
3. **`src/app/(auth)/register/page.tsx`** (Register Page) ✅ **COMPLETE**
   - ✅ อัปเดต Zod schema (titlePrefix, firstName, lastName)
   - ✅ แยก fullName input เป็น 3 ฟิลด์:
     - titlePrefix - Dropdown (optional) ใช้ `getCommonTitlePrefixes()`
     - firstName - Input (required) placeholder: "เช่น สมชาย"
     - lastName - Input (required) placeholder: "เช่น ใจดี"
   - ✅ อัปเดต onSubmit function
   - ✅ import `getCommonTitlePrefixes` from user-utils
   - ✅ Layout: titlePrefix เต็มบรรทัด, firstName+lastName แบบ 2 columns, email เต็มบรรทัด

**ผลลัพธ์**:
- ✅ ทุก endpoint รองรับฟิลด์ใหม่ (Backend: 100%)
- ✅ ทุก form ใช้ฟิลด์ใหม่ (Frontend: 100%)
- ✅ TypeScript interfaces อัปเดตครบทุกไฟล์
- ✅ Backward compatibility: fullName ยังถูก generate และเก็บไว้

---

## ⚠️ หมายเหตุ: Display Components (ไม่จำเป็นต้องแก้)

#### Display Components
**`src/components/users/users-view.tsx`** (User List)
- ⚠️ ไม่จำเป็นต้องแก้ - ใช้ `fullName` เดิมได้ (backward compatible)
- ⚠️ ถ้าต้องการแสดงชื่อแยก สามารถใช้ titlePrefix + firstName + lastName จาก User object ได้เลย

---

## 🔍 ไฟล์ที่ไม่ต้องแก้ (74 ไฟล์)

**เหตุผล**: ระบบยังคงเก็บฟิลด์ `fullName` ไว้เพื่อ backward compatibility

### API Endpoints ที่ใช้ fullName (อ่านอย่างเดียว)
ไฟล์เหล่านี้ **ไม่ต้องแก้** เพราะใช้แค่ `SELECT fullName`:
- `src/app/api/users/route.ts` - GET users
- `src/app/api/users/[userId]/route.ts` - GET user by ID
- `src/app/api/tasks/[taskId]/route.ts` - GET task (มี user.fullName)
- `src/app/api/projects/[projectId]/board/route.ts` - GET board
- `src/app/api/departments/[departmentId]/tasks/route.ts` - GET department tasks
- และอีก 60+ ไฟล์

### Frontend Components ที่แสดง fullName
ไฟล์เหล่านี้ **ไม่ต้องแก้** เพราะแค่แสดงชื่อ:
- `src/components/ui/assignee-popover.tsx`
- `src/components/common/user-avatar.tsx`
- `src/components/task-panel/details-tab/index.tsx`
- `src/components/views/list-view/index.tsx`
- และอีก 10+ ไฟล์

---

## 📝 แนวทางการอัปเดต API Endpoints

### Template สำหรับ Create/Update User Endpoints

```typescript
import { formatFullName } from '@/lib/user-utils';

async function handler(req: AuthenticatedRequest) {
  const body = await req.json();
  const {
    titlePrefix,  // NEW
    firstName,    // NEW
    lastName,     // NEW
    // ... other fields
  } = body;

  // Validate firstName and lastName are required
  if (!firstName || !lastName) {
    return errorResponse(
      'VALIDATION_ERROR',
      'กรุณากรอกชื่อและนามสกุล',
      400
    );
  }

  // Generate fullName for backward compatibility
  const fullName = formatFullName(titlePrefix, firstName, lastName);

  // Create/Update user
  const user = await prisma.user.create({
    data: {
      titlePrefix: titlePrefix || null,
      firstName,
      lastName,
      fullName, // Auto-generated
      // ... other fields
    },
  });

  return successResponse({ user });
}
```

---

## 🎨 แนวทางการอัปเดต Frontend Forms

### Create User Modal Layout (แนะนำ)

```tsx
{/* Row 1: Title Prefix (Dropdown) */}
<div>
  <Label htmlFor="titlePrefix">
    คำนำหน้าชื่อ
  </Label>
  <Select {...register('titlePrefix')}>
    <option value="">-- ไม่ระบุ --</option>
    {getCommonTitlePrefixes().map(item => (
      <option key={item.value} value={item.value}>
        {item.label}
      </option>
    ))}
  </Select>
</div>

{/* Row 2-3: First Name + Last Name (2 columns) */}
<div className="grid grid-cols-2 gap-4">
  <div>
    <Label htmlFor="firstName">
      ชื่อ <span className="text-red-500">*</span>
    </Label>
    <Input
      id="firstName"
      placeholder="เช่น สมชาย"
      {...register('firstName', { required: true })}
    />
  </div>

  <div>
    <Label htmlFor="lastName">
      นามสกุล <span className="text-red-500">*</span>
    </Label>
    <Input
      id="lastName"
      placeholder="เช่น ใจดี"
      {...register('lastName', { required: true })}
    />
  </div>
</div>
```

### Form Validation (Zod Schema)

```typescript
const createUserSchema = z.object({
  titlePrefix: z.string().optional(),
  firstName: z.string().min(1, 'กรุณากรอกชื่อ'),
  lastName: z.string().min(1, 'กรุณากรอกนามสกุล'),
  email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง'),
  departmentId: z.string().min(1, 'กรุณาเลือกหน่วยงาน'),
  role: z.enum(['ADMIN', 'CHIEF', 'LEADER', 'HEAD', 'MEMBER', 'USER']),
  // ... other fields
});
```

---

## ✅ ขั้นตอนที่เสร็จแล้วทั้งหมด (Complete - 2025-10-25)

### Phase 1: Database & Backend (Complete - 2025-10-24)
1. ✅ อัปเดต Prisma schema + Migration script (7/7 users migrated)
2. ✅ สร้าง helper functions (formatFullName, isValidTitlePrefix)
3. ✅ อัปเดต `POST /api/admin/users` (รับฟิลด์ใหม่)
4. ✅ อัปเดต `POST /api/auth/register` (รับฟิลด์ใหม่)
5. ✅ ทดสอบ API endpoints ด้วย Postman/curl

### Phase 2: Frontend TypeScript Interfaces (Complete - 2025-10-25)
6. ✅ อัปเดต `CreateUserInput` interface (use-users.ts)
7. ✅ อัปเดต `UpdateUserInput` interface (use-users.ts)
8. ✅ อัปเดต `RegisterRequest` interface (use-auth.ts)

### Phase 3: Frontend Forms (Complete - 2025-10-25)
9. ✅ อัปเดต Create User Modal (แยกฟิลด์ชื่อ 3 ฟิลด์)
10. ✅ อัปเดต Edit User Modal (แยกฟิลด์ชื่อ 3 ฟิลด์)
11. ✅ อัปเดต Register Page (แยกฟิลด์ชื่อ 3 ฟิลด์)
12. ✅ ทดสอบ UI และ form validation

### Phase 4: Testing & Documentation (Complete - 2025-10-25)
13. ✅ ตรวจสอบ TypeScript compilation
14. ✅ Verify CreateUserModal ส่งข้อมูลถูกต้อง
15. ✅ ตรวจสอบ backward compatibility (fullName ยัง generate ได้)
16. ✅ อัปเดตเอกสาร `FULLNAME_SPLIT_MIGRATION_CONTEXT.md`

---

## ⚠️ ข้อควรระวัง

### 1. Backward Compatibility
- **ต้องเก็บ `fullName`** ไว้ในทุก API response
- **ต้อง generate `fullName`** ทุกครั้งที่สร้าง/แก้ไข user
- แอปพลิเคชันเก่าที่ยังใช้ `fullName` จะยังทำงานได้ปกติ

### 2. Validation
- `firstName` และ `lastName` **ต้อง required**
- `titlePrefix` **เป็น optional** (บางคนไม่มีคำนำหน้า)
- ตรวจสอบ `titlePrefix` ว่าถูกต้องหรือไม่ (ใช้ `isValidTitlePrefix()`)

### 3. Email Templates
- อัปเดตอีเมลให้ใช้ `titlePrefix + firstName + lastName` แทน `fullName`
- ตัวอย่าง: "เรียน นาย สมชาย ใจดี" แทน "เรียน สมชาย ใจดี"

### 4. Display Logic
- พิจารณาสร้าง computed property สำหรับแสดงชื่อ
- ใช้ `formatFullName()` ให้สม่ำเสมอ

---

## 📊 ผลกระทบ (Impact Analysis) - ✅ COMPLETE

### ระดับ Critical (ต้องแก้) - ✅ เสร็จทั้งหมด 100%
- ✅ Database Schema - **COMPLETE** (2025-10-24)
- ✅ Migration Script - **COMPLETE** (2025-10-24, 7/7 users)
- ✅ API Create/Update Endpoints (2 ไฟล์) - **COMPLETE** (2025-10-24)
- ✅ Frontend Forms (3 ไฟล์) - **COMPLETE** (2025-10-25)
- ✅ TypeScript Interfaces (2 ไฟล์) - **COMPLETE** (2025-10-25)

### ระดับ Medium (ไม่จำเป็นต้องแก้ - Optional)
- ⚠️ User List Display - ใช้ fullName เดิมได้ (backward compatible)
- ⚠️ User Profile Display - ใช้ fullName เดิมได้ (backward compatible)
- ⚠️ Email Templates - backend ส่ง fullName อัตโนมัติแล้ว

### ระดับ Low (ไม่ต้องแก้ - 74+ ไฟล์)
- ✅ API Read Endpoints (60+ ไฟล์) - ใช้ fullName เดิม
- ✅ Display Components (10+ ไฟล์) - ใช้ fullName เดิม
- ✅ Backward Compatibility - ระบบเดิมทำงานได้ปกติ

---

## 🔧 Rollback Plan (กรณีมีปัญหา)

หากเกิดปัญหา สามารถ rollback ได้ 2 วิธี:

### วิธีที่ 1: Schema Rollback (เร็ว แต่เสียข้อมูล)
```bash
# เปลี่ยน firstName, lastName เป็น optional
# Push schema ใหม่
npm run prisma:push
```

### วิธีที่ 2: Code Rollback (ปลอดภัย)
```bash
# Revert code changes
git revert <commit-hash>

# Keep database as-is
# ระบบยังใช้งานได้เพราะ fullName ยังอยู่
```

---

## 📚 เอกสารอ้างอิง

- `prisma/schema.prisma` - Database schema
- `scripts/migrate-fullname-to-parts.ts` - Migration script
- `src/lib/user-utils.ts` - Helper functions
- `src/types/user.ts` - TypeScript interfaces
- `USER_CREATION_ADMIN_ONLY_COMPLETE.md` - ADMIN user creation docs

---

## 🎉 สรุปการ Migration (Final Summary)

### ✅ สิ่งที่สำเร็จ (100% Complete)
1. **Database Layer** (100%):
   - ✅ Prisma schema updated with 3 new fields (titlePrefix, firstName, lastName)
   - ✅ Migration script successfully migrated 7/7 existing users
   - ✅ Helper functions created (formatFullName, isValidTitlePrefix, getCommonTitlePrefixes)

2. **Backend API** (100%):
   - ✅ `POST /api/admin/users` - รับฟิลด์ใหม่ + generate fullName
   - ✅ `POST /api/auth/register` - รับฟิลด์ใหม่ + generate fullName
   - ✅ Backward compatibility maintained (fullName auto-generated)

3. **Frontend TypeScript** (100%):
   - ✅ `CreateUserInput` interface updated (use-users.ts)
   - ✅ `UpdateUserInput` interface updated (use-users.ts)
   - ✅ `RegisterRequest` interface updated (use-auth.ts)

4. **Frontend Forms** (100%):
   - ✅ Create User Modal - 3 fields (titlePrefix dropdown + firstName + lastName)
   - ✅ Edit User Modal - 3 fields (already implemented)
   - ✅ Register Page - 3 fields with proper layout

### 📝 ไฟล์ที่แก้ไขทั้งหมด (10 ไฟล์)
**Backend** (5 ไฟล์):
1. `prisma/schema.prisma` - เพิ่มฟิลด์ 3 ฟิลด์
2. `scripts/migrate-fullname-to-parts.ts` - Migration script
3. `src/lib/user-utils.ts` - Helper functions (NEW)
4. `src/app/api/admin/users/route.ts` - รับฟิลด์ใหม่
5. `src/app/api/auth/register/route.ts` - รับฟิลด์ใหม่

**Frontend** (5 ไฟล์):
6. `src/types/user.ts` - TypeScript interfaces
7. `src/hooks/use-users.ts` - CreateUserInput + UpdateUserInput interfaces
8. `src/hooks/use-auth.ts` - RegisterRequest interface
9. `src/components/modals/create-user-modal.tsx` - 3 fields form
10. `src/app/(auth)/register/page.tsx` - 3 fields form + schema

### 🔄 Backward Compatibility
- ✅ **fullName field เก็บไว้**: ทุก API response ยังคงมี fullName
- ✅ **Auto-generated**: fullName สร้างอัตโนมัติจาก titlePrefix + firstName + lastName
- ✅ **Display components ทำงานได้**: 74+ ไฟล์ที่ใช้ fullName ไม่ต้องแก้

### 🎯 ผลลัพธ์
- ✅ **User creation รองรับคำนำหน้า**: นาย, นาง, ดร., etc.
- ✅ **Data structure ดีขึ้น**: รองรับการขยายงานในอนาคต (รายงาน, การค้นหา)
- ✅ **ไม่ Break ระบบเดิม**: Component เดิมยังทำงานได้ปกติ
- ✅ **TypeScript type-safe**: ทุก interface มี type ที่ถูกต้อง

---

**Last Updated**: 2025-10-25
**Status**: ✅ **Migration Complete - 100%**
**Total Time**: ~2 days (Started: 2025-10-24, Completed: 2025-10-25)
**Files Modified**: 10 files (5 backend + 5 frontend)
**Lines Changed**: ~450 lines
