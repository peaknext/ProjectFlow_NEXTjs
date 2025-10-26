# ProjectFlows Version 1.5 Roadmap

**เอกสารนี้บันทึกฟีเจอร์ที่วางแผนไว้สำหรับเวอร์ชั่น 1.5**

**สถานะ**: รอการพัฒนา (Pending Development)
**วันที่สร้างเอกสาร**: 2025-10-26
**ประมาณการเริ่มพัฒนา**: หลังจาก Version 1.0 เสร็จสมบูรณ์

---

## ฟีเจอร์ที่วางแผนไว้

### 1. ระบบค้นหา (Global Search)

**จุดประสงค์**: ค้นหาข้อมูลทั่วทั้งระบบด้วยคำค้นเดียว

**ขอบเขตการทำงาน**:
- ค้นหาข้ามหลาย entities (Tasks, Projects, Users)
- Advanced filters และ search syntax
- Search history และ suggestions
- Keyboard shortcut (Cmd/Ctrl + K)
- Search results pagination

**ตำแหน่งในระบบ**:
- Search bar ใน Navbar (ที่ถูก comment ไว้แล้วใน `src/components/layout/navbar.tsx`)
- Modal สำหรับแสดงผลการค้นหา

**เทคโนโลยี**:
- Full-text search ใน PostgreSQL
- หรือ Elasticsearch สำหรับการค้นหาที่ซับซ้อน

**หมายเหตุ**:
- TODO comment อยู่ที่ `src/components/layout/navbar.tsx` (lines 45-61)

---

### 2. ระบบ AuditLog Table

**จุดประสงค์**: บันทึก audit trail สำหรับ actions สำคัญทั้งหมดในระบบ

**ขอบเขตการทำงาน**:
- บันทึกการสร้าง/แก้ไข/ลบโปรเจค
- บันทึกการสร้าง/แก้ไข/ลบผู้ใช้
- บันทึกการเปลี่ยนแปลง permissions
- บันทึกการ login/logout
- บันทึก bulk operations
- Filter และ search logs
- Export audit logs

**Schema Design** (ตัวอย่าง):
```prisma
model AuditLog {
  id          String   @id @default(cuid())
  action      String   // CREATE, UPDATE, DELETE, LOGIN, etc.
  entityType  String   // PROJECT, TASK, USER, etc.
  entityId    String?  // ID of affected entity
  userId      String   // User who performed action
  changes     Json?    // Old and new values
  metadata    Json?    // Additional context
  ipAddress   String?
  userAgent   String?
  createdAt   DateTime @default(now())

  user User @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([entityType, entityId])
  @@index([createdAt])
  @@map("audit_logs")
}
```

**UI/UX**:
- หน้า Audit Logs (สำหรับ ADMIN/CHIEF)
- Filter by user, action, entity type, date range
- Export to CSV/Excel

**เหตุผล**:
- ปัจจุบัน `History` table เก็บได้เฉพาะ task activities
- ไม่มีการบันทึกการลบโปรเจคที่ไม่มีงาน
- ต้องการ compliance และ security audit trail

---

### 3. ระบบแสดงข้อความจากผู้บริหาร (Admin Announcement)

**จุดประสงค์**: ผู้บริหารสามารถส่งข้อความประกาศให้ผู้ใช้เห็นเมื่อล็อกอินครั้งแรก

**ขอบเขตการทำงาน**:
- ผู้บริหาร (ADMIN/CHIEF) สร้างข้อความประกาศ
- แสดง modal/banner เมื่อผู้ใช้ล็อกอินครั้งแรกในแต่ละวัน
- ผู้ใช้สามารถ "Mark as read" ได้
- ประกาศหมดอายุอัตโนมัติตามวันที่กำหนด
- Priority levels (URGENT, NORMAL, INFO)
- Rich text editor สำหรับข้อความ

**Schema Design** (ตัวอย่าง):
```prisma
model Announcement {
  id          String   @id @default(cuid())
  title       String
  message     String   @db.Text
  priority    String   // URGENT, NORMAL, INFO
  startDate   DateTime @default(now())
  endDate     DateTime?
  createdBy   String
  createdAt   DateTime @default(now())
  isActive    Boolean  @default(true)

  creator     User     @relation(fields: [createdBy], references: [id])
  readBy      AnnouncementRead[]

  @@index([startDate, endDate])
  @@index([isActive])
  @@map("announcements")
}

model AnnouncementRead {
  id              String   @id @default(cuid())
  announcementId  String
  userId          String
  readAt          DateTime @default(now())

  announcement    Announcement @relation(fields: [announcementId], references: [id], onDelete: Cascade)
  user            User @relation(fields: [userId], references: [id])

  @@unique([announcementId, userId])
  @@map("announcement_reads")
}
```

**UI/UX**:
- Modal แสดงประกาศเมื่อ login (ถ้ายังไม่ได้อ่าน)
- หน้าจัดการประกาศสำหรับ ADMIN/CHIEF
- Badge แสดงจำนวนประกาศที่ยังไม่ได้อ่านใน Navbar
- Notification center แสดงประกาศทั้งหมด

**Use Cases**:
- ประกาศหยุดระบบ maintenance
- ประกาศฟีเจอร์ใหม่
- ข้อความสำคัญจากผู้บริหาร
- แจ้งเตือนนโยบายใหม่

---

### 4. Gantt Chart

**จุดประสงค์**: แสดงแผนงานและ timeline ของ tasks/projects ในรูปแบบ Gantt Chart

**ขอบเขตการทำงาน**:
- แสดง tasks ตาม timeline (startDate - dueDate)
- Drag-and-drop เพื่อปรับ dates
- แสดง dependencies ระหว่าง tasks
- แสดง milestones และ phases
- Zoom in/out timeline (day, week, month, quarter)
- Filter by assignee, priority, status
- Export to PDF/PNG

**เทคโนโลยี**:
- `@dhtmlx/gantt` หรือ `frappe-gantt`
- React wrapper สำหรับ Gantt library
- Custom styling ให้เข้ากับ design system

**UI/UX**:
- เพิ่ม "Gantt" tab ในหน้า Project views
- Department Tasks view มี Gantt view ด้วย
- Responsive design สำหรับ mobile

**เอกสารอ้างอิง**:
- `DEPARTMENT_TASKS_GANTT_CHART_DESIGN.md` มีแผนเบื้องต้นไว้แล้ว

---

## ลำดับความสำคัญ (Suggested Priority)

1. **ระบบ AuditLog** (สูงสุด) - สำคัญสำหรับ security และ compliance
2. **ระบบค้นหา** (สูง) - ปรับปรุง UX อย่างมาก
3. **Gantt Chart** (ปานกลาง) - มีประโยชน์สำหรับ planning
4. **ระบบประกาศ** (ปานกลาง) - Nice to have

---

## ประมาณการเวลาพัฒนา

- **ระบบ AuditLog**: 1-2 สัปดาห์
- **ระบบค้นหา**: 2-3 สัปดาห์
- **Gantt Chart**: 2-3 สัปดาห์
- **ระบบประกาศ**: 1 สัปดาห์

**รวมประมาณ**: 6-9 สัปดาห์

---

## Dependencies

- Version 1.0 ต้องเสร็จสมบูรณ์ก่อน
- Production deployment ต้องสำเร็จ
- User feedback จาก Version 1.0

---

**หมายเหตุ**: เอกสารนี้เป็น roadmap เบื้องต้น อาจมีการปรับเปลี่ยนตามความต้องการจริงและ user feedback
