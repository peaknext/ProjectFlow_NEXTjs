# Phase 1: Backend API Testing Instructions

## ⚠️ Server Status
Server ต้อง restart เพื่อให้โค้ดใหม่ทำงาน

## การ Restart Dev Server

```bash
# Kill server ปัจจุบัน (กด Ctrl+C ใน terminal ที่รัน npm run dev)

# Start server ใหม่
PORT=3000 npm run dev

# หรือ
npm run dev
```

---

## 🧪 คำสั่งทดสอบ

### Test 1: POST /api/auth/register (ฟิลด์ใหม่)

**ทดสอบการสร้าง user ด้วยฟิลด์ titlePrefix, firstName, lastName:**

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d @test-register.json
```

**Expected Result:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "email": "test.fullname.split@example.com",
      "fullName": "นาย ทดสอบ ระบบใหม่",  // ← ควรถูก generate จาก titlePrefix + firstName + lastName
      "role": "USER",
      "isVerified": false
    },
    "message": "Registration successful. Please check your email to verify your account."
  }
}
```

**สิ่งที่ต้องตรวจสอบ:**
- ✅ `fullName` = "นาย ทดสอบ ระบบใหม่" (auto-generated)
- ✅ Status 201 Created
- ✅ Email verification sent (ถ้า BYPASS_EMAIL=false)

---

### Test 2: POST /api/admin/users (ADMIN creates user)

**ทดสอบการสร้าง user โดย ADMIN ด้วยฟิลด์ใหม่:**

**⚠️ ต้อง login ก่อนเพื่อเอา session token (ถ้าไม่ใช้ BYPASS_AUTH):**

```bash
# Login as ADMIN
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hospital.test","password":"SecurePass123!"}'
```

**จากนั้นใช้ token ที่ได้:**

```bash
# Replace {TOKEN} with actual token from login response
curl -X POST http://localhost:3000/api/admin/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TOKEN}" \
  -d @test-admin-create-user.json
```

**หรือถ้าใช้ BYPASS_AUTH=true:**

```bash
curl -X POST http://localhost:3000/api/admin/users \
  -H "Content-Type: application/json" \
  -d @test-admin-create-user.json
```

**Expected Result:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "email": "test.admin.fullname@example.com",
      "fullName": "นางสาว ทดสอบAdmin ระบบใหม่Admin",  // ← auto-generated
      "role": "MEMBER",
      "isVerified": true,  // ← ADMIN creates = auto-verified
      "userStatus": "ACTIVE",
      "workLocation": "อาคาร 1 ชั้น 2",
      "internalPhone": "1234"
    },
    "message": "สร้างผู้ใช้สำเร็จ อีเมลสำหรับตั้งรหัสผ่านได้ถูกส่งไปยังผู้ใช้แล้ว"
  }
}
```

**สิ่งที่ต้องตรวจสอบ:**
- ✅ `fullName` = "นางสาว ทดสอบAdmin ระบบใหม่Admin" (auto-generated)
- ✅ `isVerified` = true (ADMIN created)
- ✅ `userStatus` = "ACTIVE"
- ✅ Password reset email sent
- ✅ Status 201 Created

---

## 🔍 ตรวจสอบข้อมูลใน Database

```bash
# Open Prisma Studio
npm run prisma:studio

# ดูที่ตาราง User
# ตรวจสอบว่า user ใหม่มีฟิลด์ทั้ง 4:
# - titlePrefix
# - firstName
# - lastName
# - fullName (auto-generated)
```

---

## ✅ Checklist

- [ ] Server restarted สำเร็จ
- [ ] Test 1: Register with new fields (titlePrefix, firstName, lastName)
- [ ] Test 2: Admin create user with new fields
- [ ] Verified fullName is auto-generated correctly
- [ ] Verified email is sent (or shown in console if BYPASS_EMAIL=true)
- [ ] Checked database has all 4 fields populated

---

## 🐛 Troubleshooting

### Error: "Unknown argument `departmentId`"
**Fixed!** แก้โดยใช้ `department: { connect: { id: departmentId } }` แทน `departmentId: departmentId`

### Error: Validation failed
ตรวจสอบว่า JSON มี firstName และ lastName (required fields)

### Server not responding
Restart dev server:
```bash
# Kill process (Ctrl+C)
PORT=3000 npm run dev
```

---

**Last Updated**: 2025-10-24
**Status**: ✅ Backend API completed - Ready for testing after server restart
