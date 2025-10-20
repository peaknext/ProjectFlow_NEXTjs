# Rollout & Testing Strategy
## Production Migration Plan

**Version:** 1.0
**Date:** 2025-10-20

---

## Table of Contents

1. [Testing Strategy](#testing-strategy)
2. [Phased Rollout Plan](#phased-rollout-plan)
3. [User Communication](#user-communication)
4. [Training Materials](#training-materials)
5. [Rollback Procedures](#rollback-procedures)
6. [Success Criteria](#success-criteria)

---

## 1. Testing Strategy

### 1.1 Testing Pyramid

```
                 /\
                /  \
               / E2E \              10 tests
              /------\
             /        \
            / Integration\          50 tests
           /------------\
          /              \
         /  Unit Tests    \        200+ tests
        /------------------\
```

### 1.2 Unit Testing (Jest + React Testing Library)

```typescript
// tests/unit/utils/date-utils.test.ts

import { formatDate, isOverdue } from '@/lib/date-utils';

describe('Date Utils', () => {
  describe('formatDate', () => {
    it('should format date to Thai locale', () => {
      const date = new Date('2025-10-20');
      expect(formatDate(date, 'th')).toBe('20 ต.ค. 2568');
    });

    it('should handle null values', () => {
      expect(formatDate(null)).toBe('-');
    });
  });

  describe('isOverdue', () => {
    it('should return true for past dates', () => {
      const pastDate = new Date('2025-01-01');
      expect(isOverdue(pastDate)).toBe(true);
    });

    it('should return false for future dates', () => {
      const futureDate = new Date('2026-01-01');
      expect(isOverdue(futureDate)).toBe(false);
    });
  });
});
```

```typescript
// tests/unit/components/task-card.test.tsx

import { render, screen } from '@testing-library/react';
import { TaskCard } from '@/components/views/board-view/task-card';

describe('TaskCard', () => {
  const mockTask = {
    id: 'task-1',
    name: 'Test Task',
    priority: 1,
    dueDate: new Date('2025-10-25'),
    assignee: {
      fullName: 'John Doe',
      profileImageUrl: 'https://example.com/avatar.jpg',
    },
  };

  it('should render task name', () => {
    render(<TaskCard task={mockTask} />);
    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });

  it('should show priority badge', () => {
    render(<TaskCard task={mockTask} />);
    expect(screen.getByText('ด่วนที่สุด')).toBeInTheDocument();
  });

  it('should display assignee avatar', () => {
    render(<TaskCard task={mockTask} />);
    const avatar = screen.getByRole('img');
    expect(avatar).toHaveAttribute('src', expect.stringContaining('avatar.jpg'));
  });
});
```

**Coverage Goals:**
- Overall: > 80%
- Critical paths: > 95%
- Utilities: 100%

### 1.3 Integration Testing (API Routes)

```typescript
// tests/integration/api/tasks.test.ts

import { POST } from '@/app/api/tasks/route';
import { createMockSession } from '@/tests/helpers';
import { prisma } from '@/lib/db';

describe('POST /api/tasks', () => {
  let mockSession: any;

  beforeAll(async () => {
    // Setup test database
    await prisma.$connect();
    mockSession = await createMockSession('test@example.com');
  });

  afterAll(async () => {
    // Cleanup
    await prisma.task.deleteMany();
    await prisma.$disconnect();
  });

  it('should create a task', async () => {
    const req = new Request('http://localhost/api/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mockSession.token}`,
      },
      body: JSON.stringify({
        name: 'New Task',
        projectId: 'project-1',
        statusId: 'status-1',
        priority: 3,
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.task.name).toBe('New Task');

    // Verify in database
    const task = await prisma.task.findUnique({
      where: { id: data.data.task.id },
    });
    expect(task).toBeTruthy();
  });

  it('should return 401 without auth', async () => {
    const req = new Request('http://localhost/api/tasks', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('should validate required fields', async () => {
    const req = new Request('http://localhost/api/tasks', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mockSession.token}`,
      },
      body: JSON.stringify({
        // Missing required fields
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });
});
```

### 1.4 End-to-End Testing (Playwright)

```typescript
// tests/e2e/task-management.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Task Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@hospital.go.th');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should create a new task', async ({ page }) => {
    // Navigate to project
    await page.click('text=Test Project');
    await expect(page).toHaveURL(/\/projects\/\w+\/board/);

    // Open create task modal
    await page.click('button:has-text("เพิ่มงาน")');
    await expect(page.locator('dialog')).toBeVisible();

    // Fill form
    await page.fill('input[name="name"]', 'E2E Test Task');
    await page.fill('textarea[name="description"]', 'Created by E2E test');
    await page.selectOption('select[name="priority"]', '1');

    // Submit
    await page.click('button:has-text("สร้างงาน")');

    // Verify task appears
    await expect(page.locator('text=E2E Test Task')).toBeVisible();
  });

  test('should update task status via drag and drop', async ({ page }) => {
    await page.goto('/projects/test-project/board');

    // Drag task from "To Do" to "In Progress"
    const task = page.locator('[data-testid="task-card"]').first();
    const targetColumn = page.locator('[data-status-id="in-progress"]');

    await task.dragTo(targetColumn);

    // Verify status updated
    await expect(
      page.locator('[data-status-id="in-progress"] >> text=E2E Test Task')
    ).toBeVisible();
  });

  test('should filter tasks by assignee', async ({ page }) => {
    await page.goto('/projects/test-project/list');

    // Open filter
    await page.click('button:has-text("ตัวกรอง")');

    // Select assignee
    await page.click('text=ผู้รับผิดชอบ');
    await page.click('text=John Doe');

    // Apply filter
    await page.click('button:has-text("ใช้ตัวกรอง")');

    // Verify filtered results
    const tasks = await page.locator('[data-testid="task-row"]').all();
    for (const task of tasks) {
      await expect(task.locator('text=John Doe')).toBeVisible();
    }
  });
});
```

**Run E2E Tests:**
```bash
# Run in headless mode
npx playwright test

# Run in UI mode (interactive)
npx playwright test --ui

# Run specific test
npx playwright test tests/e2e/task-management.spec.ts
```

### 1.5 Load Testing (k6)

```javascript
// tests/load/api-load.js

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 50 },  // Ramp up to 50 users
    { duration: '5m', target: 50 },  // Stay at 50 users
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests < 500ms
    http_req_failed: ['rate<0.01'],   // Error rate < 1%
  },
};

const BASE_URL = 'https://projectflow.onrender.com';
let sessionToken;

export function setup() {
  // Login once to get session token
  const loginRes = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    email: 'loadtest@hospital.go.th',
    password: 'password123',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  return { token: loginRes.json('data.sessionToken') };
}

export default function (data) {
  const headers = {
    'Authorization': `Bearer ${data.token}`,
    'Content-Type': 'application/json',
  };

  // Get projects (most common request)
  let res = http.get(`${BASE_URL}/api/projects`, { headers });
  check(res, {
    'get projects status 200': (r) => r.status === 200,
    'get projects < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);

  // Get project board data
  res = http.get(`${BASE_URL}/api/projects/project-1/board`, { headers });
  check(res, {
    'get board data status 200': (r) => r.status === 200,
    'get board data < 1000ms': (r) => r.timings.duration < 1000,
  });

  sleep(2);
}
```

**Run Load Test:**
```bash
k6 run tests/load/api-load.js
```

---

## 2. Phased Rollout Plan

### 2.1 Phase 0: Pre-Launch Prep (Week -2)

**Objectives:**
- Finalize testing
- Prepare documentation
- Setup monitoring

**Tasks:**
- [ ] All tests passing (unit, integration, e2e)
- [ ] Load testing completed (100 concurrent users)
- [ ] Security audit passed
- [ ] User documentation complete
- [ ] Training videos recorded
- [ ] Rollback plan tested
- [ ] Monitoring dashboards configured
- [ ] Support team briefed

**Go/No-Go Criteria:**
- ✅ Test coverage > 80%
- ✅ Load test passing (P95 < 500ms)
- ✅ Zero critical bugs
- ✅ Database migration tested

### 2.2 Phase 1: Internal Beta (Week 0-1)

**Participants:** 5-10 internal users (IT team, project managers)

**Objectives:**
- Validate functionality
- Identify critical bugs
- Refine UX

**Tasks:**
- [ ] Deploy to production
- [ ] Migrate test data
- [ ] Create beta user accounts
- [ ] Send beta invitation emails
- [ ] Daily check-ins with beta users
- [ ] Monitor logs and errors
- [ ] Fix critical bugs immediately

**Success Criteria:**
- ✅ Zero data loss
- ✅ All core features working
- ✅ < 5 bugs reported
- ✅ User satisfaction > 4/5

### 2.3 Phase 2: Pilot Group (Week 2-3)

**Participants:** 20-30 users (1-2 departments)

**Objectives:**
- Test with real workload
- Validate migration process
- Gather feedback

**Tasks:**
- [ ] Migrate pilot users' data from GAS
- [ ] Send onboarding emails with tutorial
- [ ] Host training session (1 hour)
- [ ] Daily monitoring of usage patterns
- [ ] Weekly feedback sessions
- [ ] Fix bugs and improve UX

**Success Criteria:**
- ✅ 90% of users actively using
- ✅ Task creation rate > GAS app
- ✅ Error rate < 1%
- ✅ User satisfaction > 4/5

### 2.4 Phase 3: Soft Launch (Week 4-5)

**Participants:** 50-100 users (half of organization)

**Objectives:**
- Scale testing
- Validate performance
- Parallel run with GAS

**Tasks:**
- [ ] Migrate half of users' data
- [ ] Send announcement to organization
- [ ] Offer optional training sessions
- [ ] Keep GAS app running (read-only)
- [ ] Daily sync GAS → Next.js (one-way)
- [ ] Monitor performance metrics
- [ ] Scale infrastructure if needed

**Success Criteria:**
- ✅ < 2s page load time (P95)
- ✅ < 500ms API response (P95)
- ✅ Uptime > 99.5%
- ✅ 80% of users migrated voluntarily

### 2.5 Phase 4: Full Launch (Week 6)

**Participants:** All users

**Objectives:**
- Complete migration
- Decommission GAS app

**Tasks:**
- [ ] Migrate remaining users' data
- [ ] Send final announcement
- [ ] Mandatory training for remaining users
- [ ] Monitor system closely (24/7 for first week)
- [ ] Set GAS app to read-only
- [ ] Final data sync GAS → Next.js
- [ ] Archive GAS app (keep backup)

**Success Criteria:**
- ✅ 100% users migrated
- ✅ Zero critical issues
- ✅ User satisfaction > 4/5
- ✅ Uptime > 99.9%

### 2.6 Phase 5: Post-Launch (Week 7+)

**Objectives:**
- Stabilize system
- Collect feedback
- Plan v2 features

**Tasks:**
- [ ] Weekly feedback surveys
- [ ] Monthly usage analytics review
- [ ] Prioritize feature requests
- [ ] Decommission GAS app (after 1 month)
- [ ] Celebrate success! 🎉

---

## 3. User Communication

### 3.1 Communication Timeline

**Week -4:**
- 📧 Email: "Exciting News: ProjectFlow is Getting an Upgrade!"
- 📄 Announce upcoming migration
- 📹 Teaser video (30 seconds)

**Week -2:**
- 📧 Email: "What to Expect: New ProjectFlow Preview"
- 🎥 Demo video (3 minutes)
- 📚 FAQ document
- 📅 Beta program invitation

**Week 0 (Beta Launch):**
- 📧 Email to beta users: "You're invited to test the new ProjectFlow!"
- 🔗 Beta access link + tutorial

**Week 2 (Pilot):**
- 📧 Email to pilot group: "Join the ProjectFlow Pilot Program"
- 📅 Training session invitation
- 📄 Quick start guide

**Week 4 (Soft Launch):**
- 📧 Organization-wide email: "New ProjectFlow is Now Available!"
- 🎥 Tutorial series (5 videos × 2 minutes)
- 📚 User documentation site

**Week 6 (Full Launch):**
- 📧 Final announcement: "Welcome to the New ProjectFlow!"
- 🗓️ GAS app retirement date
- 📞 Support hotline info

### 3.2 Email Templates

**Beta Invitation Email:**
```
Subject: 🎉 You're invited to test the new ProjectFlow!

สวัสดีครับ/ค่ะ [Name],

ขอเชิญคุณเป็น Beta Tester สำหรับระบบ ProjectFlow เวอร์ชันใหม่!

ระบบใหม่นี้ได้รับการปรับปรุงใหม่ทั้งหมด พร้อมด้วย:
✨ ความเร็วที่มากกว่าเดิม 10 เท่า
🎨 ดีไซน์ที่สวยงามและใช้งานง่ายยิ่งขึ้น
🚀 ฟีเจอร์ใหม่ๆ ที่คุณจะชื่นชอบ

วิธีเข้าใช้งาน:
1. เข้าสู่ระบบที่: https://projectflow.onrender.com
2. ใช้ email และ password เดิมของคุณ
3. ดูวิดีโอสอนใช้งาน (3 นาที): [YouTube Link]

หากพบปัญหาหรือมีข้อเสนอแนะ กรุณาแจ้ง:
📧 support@projectflow.com
💬 Line: @projectflow

ขอบคุณที่ร่วมทดสอบครับ/ค่ะ!

ทีมพัฒนา ProjectFlow
```

### 3.3 Tutorial Videos (Storyboard)

**Video 1: "Getting Started" (2 min)**
1. Login page
2. Dashboard overview
3. Navigation basics
4. Dark mode toggle

**Video 2: "Creating Your First Task" (2 min)**
1. Select project
2. Click "Add Task"
3. Fill form (name, assignee, due date)
4. Submit and view on board

**Video 3: "Managing Tasks" (2 min)**
1. Drag and drop to change status
2. Edit task details
3. Add comments
4. Close task

**Video 4: "Filters and Views" (2 min)**
1. Board vs List vs Calendar
2. Apply filters
3. Sort tasks
4. Pin important tasks

**Video 5: "Reports and Analytics" (2 min)**
1. User dashboard
2. Reports dashboard
3. Export data
4. Tips and tricks

---

## 4. Training Materials

### 4.1 Quick Start Guide (PDF)

```markdown
# ProjectFlow Quick Start Guide

## 1. เข้าสู่ระบบ
- URL: https://projectflow.onrender.com
- ใช้ email และ password เดิม

## 2. เลือกโปรเจค
- คลิกที่ชื่อโปรเจคด้านซ้ายบน
- หรือใช้ Cmd/Ctrl + K เพื่อค้นหา

## 3. สร้างงานใหม่
- คลิกปุ่ม "+ เพิ่มงาน"
- กรอกชื่องาน, ผู้รับผิดชอบ, กำหนดส่ง
- คลิก "สร้างงาน"

## 4. จัดการงาน
- **เปลี่ยนสถานะ:** ลากไปวางในคอลัมน์ใหม่ (Board View)
- **แก้ไข:** คลิกที่การ์ดงาน
- **เพิ่มความคิดเห็น:** เปิดงาน → แท็บ "ความคิดเห็น"

## 5. ตัวกรอง
- คลิก "ตัวกรอง" ที่มุมขวาบน
- เลือกผู้รับผิดชอบ, สถานะ, ความสำคัญ
- คลิก "ใช้ตัวกรอง"

## 6. Tips
- ใช้ Cmd/Ctrl + K เพื่อค้นหาอะไรก็ได้
- ปักหมุดงานสำคัญด้วยไอคอนหมุดหมาย
- เปลี่ยนมุมมอง: Board / List / Calendar
```

### 4.2 FAQs

**Q: ข้อมูลเดิมจะหายไหม?**
A: ไม่หายครับ เราจะย้ายข้อมูลทั้งหมดจากระบบเก่ามาให้

**Q: ต้องสร้าง account ใหม่ไหม?**
A: ไม่ต้องครับ ใช้ email และ password เดิมได้เลย

**Q: ระบบเก่ายังใช้ได้อยู่ไหม?**
A: ใช้ได้ครับ จนกว่าทุกคนจะย้ายเสร็จ (ประมาณ 1-2 เดือน)

**Q: พบปัญหาติดต่อที่ไหน?**
A: ส่งอีเมลมาที่ support@projectflow.com หรือโทร xxx-xxxx

---

## 5. Rollback Procedures

### 5.1 Rollback Triggers

**Critical Issues (Immediate Rollback):**
- Data loss detected
- Authentication system failure
- Error rate > 5%
- Downtime > 30 minutes
- Database corruption

**Major Issues (24-hour window):**
- Performance degradation (> 5s load time)
- Feature not working for > 20% users
- User complaints > 30%

### 5.2 Rollback Steps

**Step 1: Announcement (5 minutes)**
```
Subject: [URGENT] ระบบ ProjectFlow กำลังกลับไปใช้เวอร์ชันเดิมชั่วคราว

เรียนผู้ใช้งานทุกท่าน

เนื่องจากพบปัญหา [ระบุปัญหา] ในระบบใหม่
เราจึงต้องกลับไปใช้ระบบเก่าชั่วคราว

กรุณาเข้าใช้งานที่: [GAS App URL]

เราจะแจ้งให้ทราบเมื่อระบบใหม่พร้อมใช้งานอีกครั้ง

ขออภัยในความไม่สะดวกครับ
```

**Step 2: DNS Switch (10 minutes)**
```bash
# Revert DNS to point to GAS app
# OR set maintenance page on render.com
```

**Step 3: Revert Last Known Good Deployment (15 minutes)**
```bash
# Via render.com dashboard
1. Go to Events
2. Find last successful deploy
3. Click "Redeploy"

# OR via Git
git revert HEAD
git push origin main
```

**Step 4: Verify GAS App (10 minutes)**
```bash
# Test critical paths
- Login
- View projects
- Create task
- Update task
```

**Step 5: Post-Mortem (24 hours)**
```markdown
## Incident Report: [Date]

### Issue
[Describe what went wrong]

### Impact
- Duration: X hours
- Affected users: Y%
- Data loss: Yes/No

### Root Cause
[Technical explanation]

### Fix Applied
[What we did to fix it]

### Prevention
[How we'll prevent this in future]
```

---

## 6. Success Criteria

### 6.1 Technical Metrics

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Uptime | > 99.9% | - | - |
| Page Load Time (P95) | < 2s | - | - |
| API Response (P95) | < 500ms | - | - |
| Error Rate | < 0.5% | - | - |
| Test Coverage | > 80% | - | - |

### 6.2 User Adoption Metrics

| Milestone | Target Date | Target % | Actual % | Status |
|-----------|-------------|----------|----------|--------|
| Beta Users | Week 1 | 5% | - | - |
| Pilot Group | Week 3 | 20% | - | - |
| Soft Launch | Week 5 | 50% | - | - |
| Full Launch | Week 6 | 100% | - | - |

### 6.3 User Satisfaction

**Survey Questions (1-5 scale):**
1. ความเร็วของระบบ (Speed)
2. ความง่ายในการใช้งาน (Usability)
3. ความสวยงามของดีไซน์ (Design)
4. ความครบถ้วนของฟีเจอร์ (Features)
5. โอกาสแนะนำให้คนอื่น (NPS)

**Target:** Average score > 4.0/5.0

---

## 7. Post-Launch Monitoring

### 7.1 Week 1: Intensive Monitoring

**Daily Tasks:**
- [ ] Check error logs (morning, afternoon, evening)
- [ ] Review performance metrics
- [ ] Respond to user feedback within 2 hours
- [ ] Fix critical bugs same day
- [ ] Daily standup with team

**Dashboard Alerts:**
- Error rate > 1% → Slack notification
- Response time > 2s → Email alert
- Downtime detected → SMS + Call

### 7.2 Week 2-4: Regular Monitoring

**Every 2 days:**
- [ ] Review metrics
- [ ] Prioritize bug fixes
- [ ] User feedback analysis

**Weekly:**
- [ ] Team retrospective
- [ ] Update roadmap
- [ ] User communication

### 7.3 Month 2+: Steady State

**Weekly:**
- [ ] Performance review
- [ ] Bug triage

**Monthly:**
- [ ] Usage analytics
- [ ] User satisfaction survey
- [ ] Feature prioritization

---

## 8. Contingency Plans

### 8.1 If Migration Takes Longer

**Plan B: Extended Parallel Run**
- Keep GAS app running for extra month
- Daily sync GAS → Next.js
- Gradual migration department by department

### 8.2 If Critical Feature Missing

**Plan C: Feature Freeze**
- Delay full launch until feature ready
- Extend pilot phase
- Communicate transparently with users

### 8.3 If Performance Issues

**Plan D: Infrastructure Upgrade**
- Scale up render.com plan
- Add Redis caching
- Optimize database queries
- Enable CDN

---

**Document Status:** ✅ COMPLETE
**Owner:** Development Team
**Review Date:** Every 2 weeks during rollout
