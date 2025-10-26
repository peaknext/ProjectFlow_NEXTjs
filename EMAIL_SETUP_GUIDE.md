# Email Setup Guide - ProjectFlow

## ปัญหาที่พบ: ไม่ได้รับอีเมลรีเซ็ตรหัสผ่าน

### สาเหตุ

Resend API ในโหมดทดสอบ (testing mode) มีข้อจำกัด:
- สามารถส่งอีเมลได้เฉพาะไปยังอีเมลที่ลงทะเบียนบัญชี Resend เท่านั้น
- ในกรณีนี้คือ: `peaknext@gmail.com`

### การแก้ไขปัญหา

## วิธีที่ 1: ทดสอบในโหมดพัฒนา (Development Mode)

**สำหรับทดสอบระบบเท่านั้น:**

1. ส่งอีเมลรีเซ็ตรหัสผ่านไปที่ `peaknext@gmail.com`
2. ตรวจสอบกล่องจดหมายที่ peaknext@gmail.com
3. คลิกลิงก์รีเซ็ตรหัสผ่าน

**หรือ:** ใช้ Development Mode (bypass email)

ใน `.env` เพิ่ม:
```bash
BYPASS_EMAIL=true
```

จากนั้นแก้ไขโค้ดใน `src/lib/email.ts` เพื่อแสดงลิงก์ในคอนโซลแทน:

```typescript
export async function sendPasswordResetEmail(
  email: string,
  userName: string,
  resetToken: string
) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010';
  const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

  // Development mode - show link in console
  if (process.env.BYPASS_EMAIL === 'true') {
    console.log('='.repeat(60));
    console.log('PASSWORD RESET EMAIL (DEV MODE)');
    console.log('='.repeat(60));
    console.log('To:', email);
    console.log('Reset URL:', resetUrl);
    console.log('='.repeat(60));
    return { success: true, messageId: 'dev-mode' };
  }

  // Production mode - send real email
  // ... existing code ...
}
```

## วิธีที่ 2: ติดตั้ง Domain สำหรับ Production

**สำหรับใช้งานจริง (Production):**

### ขั้นตอนที่ 1: เพิ่ม Domain ใน Resend

1. ไปที่ [resend.com/domains](https://resend.com/domains)
2. คลิก "Add Domain"
3. กรอกชื่อ domain ของคุณ (เช่น `yourdomain.com`)
4. คลิก "Add"

### ขั้นตอนที่ 2: ตั้งค่า DNS Records

Resend จะให้ DNS records ที่ต้องเพิ่มใน domain registrar ของคุณ:

```
Type: TXT
Name: @
Value: v=spf1 include:spf.resend.com ~all

Type: TXT
Name: resend._domainkey
Value: [คีย์ที่ Resend ให้มา]

Type: CNAME
Name: resend
Value: resend.io
```

### ขั้นตอนที่ 3: รอการยืนยัน

- ใช้เวลาประมาณ 24-48 ชั่วโมง
- Resend จะตรวจสอบ DNS records โดยอัตโนมัติ
- เมื่อยืนยันแล้วสถานะจะเป็น "Verified"

### ขั้นตอนที่ 4: อัพเดท Environment Variables

แก้ไขไฟล์ `.env`:

```bash
# เปลี่ยนจาก
RESEND_FROM_EMAIL=onboarding@resend.dev

# เป็น (ใช้ domain ของคุณเอง)
RESEND_FROM_EMAIL=noreply@yourdomain.com
# หรือ
RESEND_FROM_EMAIL=no-reply@yourdomain.com
```

### ขั้นตอนที่ 5: Restart Server

```bash
# หยุด dev server (Ctrl+C)
# เริ่มใหม่
npm run dev
```

## วิธีที่ 3: ใช้บริการอีเมลอื่น (ทางเลือก)

ถ้าไม่มี domain หรือไม่ต้องการใช้ Resend สามารถใช้บริการอื่นได้:

### Option A: SendGrid

```bash
npm install @sendgrid/mail
```

### Option B: Nodemailer + Gmail

```bash
npm install nodemailer
```

### Option C: AWS SES

```bash
npm install @aws-sdk/client-ses
```

## การทดสอบ

### ทดสอบการส่งอีเมล

```bash
# Test with cURL
curl -X POST http://localhost:3010/api/auth/request-reset \
  -H "Content-Type: application/json" \
  -d '{"email":"peaknext@gmail.com"}'
```

### ตรวจสอบ Console Log

เปิด terminal ที่รัน `npm run dev` และดูข้อความ:
- ✅ `Password reset email sent successfully:` = สำเร็จ
- ❌ `Failed to send password reset email:` = ล้มเหลว

### ตรวจสอบ Database

```bash
npm run prisma:studio
```

ไปที่ตาราง `User` → ดูคอลัมน์:
- `resetToken` - ต้องมีค่า (ประมาณ 64 ตัวอักษร)
- `resetTokenExpiry` - ต้องเป็นเวลาในอนาคต (1 ชั่วโมงจากตอนนี้)

## สถานะปัจจุบัน

- ✅ API Endpoint: `/api/auth/request-reset` - ทำงานได้
- ✅ API Endpoint: `/api/auth/reset-password` - ทำงานได้
- ✅ Email Template: HTML template พร้อมใช้งาน
- ✅ Database: บันทึก reset token แล้ว
- ✅ Frontend Pages: Forgot Password & Reset Password - ครบถ้วน
- ✅ Development Mode: `BYPASS_EMAIL=true` - แสดงลิงก์ใน console
- ⚠️ Email Sending: จำกัดเฉพาะ `peaknext@gmail.com` (Resend testing mode)

## คำแนะนำ

### สำหรับการพัฒนา (Development)
→ ใช้ **วิธีที่ 1** (BYPASS_EMAIL หรือส่งไปที่ peaknext@gmail.com)

### สำหรับการใช้งานจริง (Production)
→ ใช้ **วิธีที่ 2** (ติดตั้ง Domain)

## ข้อมูลเพิ่มเติม

- [Resend Documentation](https://resend.com/docs)
- [Resend Domain Setup](https://resend.com/docs/dashboard/domains/introduction)
- [Resend API Limits](https://resend.com/docs/dashboard/api-keys#rate-limits)

---

**หมายเหตุ:** ไฟล์นี้สร้างขึ้นเพื่ออธิบายปัญหาและวิธีแก้ไขเรื่องการส่งอีเมลใน ProjectFlow
