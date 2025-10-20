# ProjectFlow Migration Plan
## จาก Google Apps Script สู่ Next.js + PostgreSQL

**สถานะ:** 📋 Planning Phase
**เวอร์ชัน:** 1.1
**วันที่สร้าง:** 2025-10-20
**วันที่อัพเดต:** 2025-10-20
**เวลาที่คาดการณ์:** 18-20 สัปดาห์ (~5 เดือน)*

*หมายเหตุ: สามารถลดเหลือ 16-18 สัปดาห์ ถ้าเลื่อน optional features (Offline Support, Advanced Planning) ไปทำใน v2

---

## 📚 เอกสารทั้งหมด

### 🎯 [00_MIGRATION_OVERVIEW.md](./00_MIGRATION_OVERVIEW.md)
**ภาพรวมการย้ายระบบ**
- Executive Summary
- Current vs Target Architecture
- Technology Stack Comparison
- Migration Strategy
- Risk Assessment
- Timeline Overview

**อ่านเอกสารนี้ก่อน** เพื่อเข้าใจภาพรวมทั้งหมด

---

### 🗄️ [01_DATABASE_MIGRATION.md](./01_DATABASE_MIGRATION.md)
**การย้ายฐานข้อมูล: Google Sheets → PostgreSQL**
- Schema Mapping (Sheets → Prisma)
- Complete Prisma Schema Design
- Data Types Transformation
- Migration Scripts (Export + Import)
- Data Integrity Checks
- Performance Optimization (Indexes)

**ใช้สำหรับ:** Database Engineers, Backend Developers

**Timeline:** Week 1-4 (Phase 0-1)

---

### 🔌 [02_API_MIGRATION.md](./02_API_MIGRATION.md)
**การย้าย API: GAS Functions → Next.js API Routes**
- API Endpoints Inventory (65 endpoints from 97+ GAS functions)
- RESTful API Design
- Endpoint Migration Map
- Authentication Middleware
- Permissions System Implementation
- Error Handling Strategy
- Code Examples (Login, CRUD, Batch Operations, etc.)

**ใช้สำหรับ:** Backend Developers

**Timeline:** Week 3-7 (Phase 2-3) - เพิ่ม 1 สัปดาห์

---

### 🎨 [03_FRONTEND_MIGRATION.md](./03_FRONTEND_MIGRATION.md)
**การย้าย Frontend: GAS HTML/JS → Next.js + shadcn/ui**
- Component Inventory & Mapping (28 core components + 6 feature enhancements)
- Design System Migration (Tailwind config)
- State Management (Zustand + TanStack Query)
- Component Migration Examples
- Routing Migration
- Advanced Features (Checklists, Pinned Tasks, Skeleton States, etc.)

**ใช้สำหรับ:** Frontend Developers, UI/UX Designers

**Timeline:** Week 5-12 (Phase 3-5) - เพิ่ม 1 สัปดาห์

---

### 🧠 [06_BUSINESS_LOGIC_GUIDE.md](./06_BUSINESS_LOGIC_GUIDE.md) **[NEW]**
**คู่มือ Business Logic สำคัญที่ต้องทำให้ถูกต้อง**
- Permission System Architecture (6-level role hierarchy)
- Progress Calculation Algorithm (weighted formula)
- Task Lifecycle State Machine (CREATED → CLOSING → CLOSED)
- History Recording Strategy (Activity Logs)
- Notification Triggering Logic
- Sync Queue & Offline Support (Optional)

**ใช้สำหรับ:** Full-Stack Developers, Technical Lead

**Timeline:** Week 3-13 (Continuous) - Implement alongside API/Frontend

---

### 🚀 [04_DEPLOYMENT_GUIDE.md](./04_DEPLOYMENT_GUIDE.md)
**คู่มือการ Deploy บน render.com**
- Service Configuration
- Environment Variables Setup
- CI/CD Pipeline (GitHub Actions)
- Monitoring & Logging
- Scaling Strategy
- Cost Optimization

**ใช้สำหรับ:** DevOps, System Administrators

**Timeline:** Week 2-16 (Continuous)

---

### ✅ [05_ROLLOUT_PLAN.md](./05_ROLLOUT_PLAN.md)
**แผนการเปิดตัวและทดสอบ**
- Testing Strategy (Unit, Integration, E2E, Load)
- Phased Rollout (Beta → Pilot → Soft Launch → Full Launch)
- User Communication Plan
- Training Materials
- Rollback Procedures
- Success Criteria

**ใช้สำหรับ:** Project Managers, QA, Support Team

**Timeline:** Week 7-20 (Phase 6-7)

---

## 📊 What's New in v1.1

**เมื่อ:** 2025-10-20

**สรุปการอัพเดต:**
หลังจากวิเคราะห์โค้ดเดิมอย่างละเอียด พบว่าแผนเดิมครอบคลุมเพียง **83%** ของ functionality ทั้งหมด จึงได้อัพเดตแผนให้สมบูรณ์ขึ้นเพื่อให้ได้ **95%+ feature parity**

**สิ่งที่เพิ่มเติม:**
- ✅ **Database:** +5 tables (ChecklistItem, Phase, HospitalMission, ITGoal, ActionPlan)
- ✅ **API Endpoints:** +35 endpoints (รวมเป็น 65 แทน ~30) - Permissions API, Checklists API, Batch Operations API
- ✅ **Frontend Features:** +6 enhancements (Checklists UI, Skeleton States, Pinned Tasks, Dark Mode Calendar, etc.)
- ✅ **Business Logic Guide:** เอกสารใหม่ที่อธิบาย Permission System, Progress Calculation, Task Lifecycle, Notifications
- ⏱️ **Timeline:** 18-20 weeks แทน 14-16 weeks (+4 weeks, แต่มี phase overlap)

**ผลกระทบ:**
- ✅ เพิ่มความสมบูรณ์จาก 83% → 95%+
- ✅ ครอบคลุม 97+ GAS functions ทั้งหมด
- ✅ รองรับ advanced features ที่มีในระบบเดิม
- ⚠️ ใช้เวลาเพิ่ม 4-6 สัปดาห์ (แต่ได้ระบบที่ครบถ้วน)

---

## 🗓️ Timeline Snapshot

```
Phase 0: Preparation              [Week 1-2]   ████████
Phase 1: Database Migration       [Week 3-4]   ████████████
Phase 2: API Migration            [Week 5-7]   ████████████ (+1 week)
Phase 3: Core UI                  [Week 8-9]   ████████████████
Phase 4: Task Management          [Week 10-13] ████████████████████████████ (+1 week)
Phase 5: Advanced Features        [Week 14-15] ████████████████
Phase 6: Testing & Optimization   [Week 16-18] ████████████████████ (+1 week)
Phase 7: Rollout & Launch         [Week 19-20] ████████████████
```

**สาเหตุที่เพิ่มเวลา:**
- **API Migration +1 week**: เพิ่มจาก ~30 เป็น 65 endpoints (Permissions, Batch Ops, Checklists APIs)
- **Frontend +1 week**: เพิ่ม 6 advanced features (Checklists UI, Skeleton States, Pinned Tasks, etc.)
- **Testing +1 week**: ทดสอบ business logic ที่ซับซ้อน (Permissions, Progress Calculation)
- **Phase Overlap**: บาง phases ทำงานพร้อมกัน ทำให้ไม่เพิ่ม +4 weeks เต็ม

---

## 🎯 Milestones

| # | Milestone | Target Week | Status |
|---|-----------|-------------|--------|
| M1 | Infrastructure Ready | Week 2 | ⏳ Pending |
| M2 | Database Migrated (15 tables) | Week 4 | ⏳ Pending |
| M3 | Authentication + Permissions Working | Week 6 | ⏳ Pending |
| M4 | Core UI Complete | Week 9 | ⏳ Pending |
| M5 | Task Management Complete | Week 13 | ⏳ Pending |
| M6 | Full Feature Parity (95%+) | Week 15 | ⏳ Pending |
| M7 | Production Ready (All Tests Pass) | Week 18 | ⏳ Pending |
| M8 | **LIVE! 🚀** | Week 20 | ⏳ Pending |

---

## 💰 Cost Estimate

### Initial Setup (< 50 users)
```
render.com Web Service (Starter):    $7/month
render.com PostgreSQL (Starter):     $7/month
Domain & SSL:                         FREE
────────────────────────────────────────────
Total:                              $14/month
```

### Production (100-500 users)
```
render.com Web Service (Standard):  $25/month
render.com PostgreSQL (Standard):   $20/month
Redis Cache (Optional):             $10/month
File Storage (Cloudinary):           $0-10/month
────────────────────────────────────────────
Total:                              $55-65/month
```

**Compare to GAS:** Free (but limited by quotas)

---

## 👥 Team Requirements

### Core Team
- **1x Project Manager** - Overall coordination, timeline management
- **2x Full-Stack Developers** - Migration implementation
- **1x DevOps Engineer** (Part-time) - Infrastructure setup
- **1x QA Engineer** - Testing strategy, test execution
- **1x Technical Writer** (Part-time) - Documentation, training materials

### Support Team
- **1x Product Owner** - Requirements, user feedback
- **2-3x Beta Users** - Early testing, feedback
- **IT Support** - User onboarding, troubleshooting

---

## ⚠️ Key Risks & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Data Loss | Medium | Critical | - Multiple backups<br>- Dry-run migrations<br>- Rollback plan |
| Performance Issues | Medium | High | - Load testing<br>- Performance monitoring<br>- Scalable infrastructure |
| User Resistance | High | Medium | - Early user involvement<br>- Training materials<br>- Gradual rollout |
| Timeline Delay | Medium | Medium | - Buffer time in schedule<br>- Phased approach<br>- Clear priorities |

---

## 📋 Pre-Migration Checklist

**Before Starting:**
- [/] Stakeholder approval received
- [/] Budget approved (~$500-1000 initial, $55/month ongoing)
- [/] Team availability confirmed (4 months)
- [/] render.com account created
- [/] GitHub repository created
- [/] User testing group identified (10-20 users)
- [/] Backup of current GAS app data
- [/] Communication plan approved

---

## 🚦 Next Steps

### Week 1 (This Week)
1. ✅ Review all migration documents
2. ⏳ Get stakeholder sign-off
3. ⏳ Setup render.com account
4. ⏳ Create GitHub repository
5. ⏳ Initialize Next.js project

### Week 2
1. Setup PostgreSQL database on render.com
2. Design Prisma schema
3. Write data export script (GAS)
4. Test data export with sample data

### Week 3-4
1. Implement data transformation script
2. Run migration dry-run
3. Verify data integrity
4. Setup CI/CD pipeline

**See each document for detailed phase plans.**

---

## 📞 Questions?

**Technical Questions:**
- Review relevant document above
- Check [CLAUDE.md](../CLAUDE.md) for project context

**Process Questions:**
- Refer to [00_MIGRATION_OVERVIEW.md](./00_MIGRATION_OVERVIEW.md)
- Contact Project Manager

---

## 📝 Document Status

| Document | Version | Last Updated | Status |
|----------|---------|--------------|--------|
| README (this file) | 1.1 | 2025-10-20 | ✅ Updated |
| 00_MIGRATION_OVERVIEW | 1.0 | 2025-10-20 | ✅ Complete |
| 01_DATABASE_MIGRATION | 1.1 | 2025-10-20 | ✅ Updated (+5 tables) |
| 02_API_MIGRATION | 1.1 | 2025-10-20 | ✅ Updated (+35 endpoints) |
| 03_FRONTEND_MIGRATION | 1.1 | 2025-10-20 | ✅ Updated (+6 features) |
| 04_DEPLOYMENT_GUIDE | 1.0 | 2025-10-20 | ✅ Complete |
| 05_ROLLOUT_PLAN | 1.0 | 2025-10-20 | ✅ Complete |
| 06_BUSINESS_LOGIC_GUIDE | 1.0 | 2025-10-20 | ✅ Complete (NEW) |

---

## 🎉 Success Vision

**After migration, we will have:**

✅ **10x Faster** - Page loads < 1s (vs 3-5s now)
✅ **Unlimited Scale** - No GAS quotas, 500+ concurrent users
✅ **Modern Stack** - TypeScript, React, PostgreSQL, CI/CD
✅ **Better UX** - Realtime updates, smooth interactions, beautiful UI
✅ **Easier Maintenance** - Clean code, automated tests, clear documentation
✅ **Room to Grow** - Easy to add new features, integrate with other systems

**We're building the future of ProjectFlow! 🚀**

---

**Prepared by:** Claude (AI Assistant)
**For:** ProjectFlow Team
**Date:** October 20, 2025
