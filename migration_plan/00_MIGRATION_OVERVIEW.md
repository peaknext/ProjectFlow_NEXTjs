# ProjectFlow Migration Overview
## จาก Google Apps Script → Next.js + PostgreSQL

**เวอร์ชันเอกสาร:** 1.1
**วันที่สร้าง:** 2025-10-20
**วันที่อัพเดต:** 2025-10-20
**สถานะปัจจุบัน:** 90% ใช้งานได้บน GAS
**เป้าหมาย:** Full-stack modern web app พร้อม scalability (95%+ feature parity)

---

## 📋 สารบัญ

1. [Executive Summary](#executive-summary)
2. [Current Architecture Analysis](#current-architecture-analysis)
3. [Target Architecture](#target-architecture)
4. [Migration Strategy](#migration-strategy)
5. [Risk Assessment](#risk-assessment)
6. [Timeline Overview](#timeline-overview)
7. [Success Metrics](#success-metrics)

---

## 1. Executive Summary

### 1.1 วัตถุประสงค์การย้ายระบบ

- **Scalability:** รองรับการขยายตัวของทีมและข้อมูล
- **Performance:** ลดเวลาตอบสนอง ปรับปรุง UX
- **Maintainability:** โครงสร้างโค้ดที่ทันสมัย ง่ายต่อการพัฒนาต่อ
- **Feature Expansion:** เพิ่มฟีเจอร์ที่ GAS จำกัด (realtime, complex queries, webhooks)
- **Cost Optimization:** ลดข้อจำกัดของ GAS quotas
- **Modern DevOps:** CI/CD, testing, monitoring, version control

### 1.2 คุณค่าที่ได้รับ

| Benefit | Current (GAS) | Target (Next.js) | Impact |
|---------|---------------|------------------|--------|
| **Response Time** | 2-5s | < 500ms | 10x faster |
| **Concurrent Users** | ~30 | 500+ | 16x more |
| **Daily API Calls** | 20,000 limit | Unlimited | No quota |
| **Realtime Updates** | ❌ Manual refresh | ✅ WebSocket | Better UX |
| **Complex Queries** | ❌ Limited | ✅ Full SQL | More features |
| **Testing** | Manual only | ✅ Automated | Better quality |
| **Deployment** | Manual push | ✅ CI/CD | Faster iteration |

### 1.3 Technology Stack Comparison

```
┌─────────────────────────────────────────────────────────────┐
│                      CURRENT STACK                          │
├─────────────────────────────────────────────────────────────┤
│ Frontend:  Vanilla JS + HTML + Tailwind CSS                │
│ Backend:   Google Apps Script (JavaScript)                 │
│ Database:  Google Sheets                                   │
│ Hosting:   Google Apps Script Web App                      │
│ Auth:      Custom session-based (stored in Sheets)         │
└─────────────────────────────────────────────────────────────┘

                            ⬇️ MIGRATION

┌─────────────────────────────────────────────────────────────┐
│                      TARGET STACK                           │
├─────────────────────────────────────────────────────────────┤
│ Frontend:  Next.js 14 (App Router) + React 18 + TypeScript │
│ UI:        shadcn/ui + Tailwind CSS + Radix UI Primitives  │
│ Backend:   Next.js API Routes (RESTful) + Server Actions   │
│ Database:  PostgreSQL 15+ (with Prisma ORM 5.x)            │
│ Hosting:   render.com (Web Service + PostgreSQL)           │
│ Auth:      Custom session-based (JWT + HTTP-only cookies)  │
│ State:     Zustand + TanStack Query (server state)         │
│ Realtime:  Optional Phase 2 (WebSocket / SSE)              │
│ Cache:     Optional Phase 2 (Redis for sessions)           │
│ Storage:   Cloudinary (images) / URLs (attachments)        │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Current Architecture Analysis

### 2.1 File Structure Overview

**ไฟล์ทั้งหมด:** ~61 files (.html + .gs)

```
ProjectFlow (GAS)
├── Code.gs                          # Main backend logic (~5000+ lines)
├── index.html                       # Login page + App shell
├── main.js.html                     # Main application JavaScript
├── CSS.html                         # Global styles (Tailwind)
│
├── Modules (Core Logic)
│   ├── module.StateManager.html     # Central state management (AppState)
│   ├── module.ViewManager.html      # View routing and rendering
│   ├── module.AuthModule.html       # Authentication logic
│   ├── module.SyncManager.html      # Data synchronization
│   ├── module.FilterModule.html     # Task filtering
│   ├── module.NotificationModule.html
│   ├── module.ProgressCalculator.html
│   └── module.PinnedTaskManager.html
│
├── Services (Data Layer)
│   ├── service.APIService.html      # GAS backend calls
│   ├── service.DataLoader.html      # Data fetching orchestration
│   ├── service.ProjectCache.html    # Project-level cache
│   ├── service.ProjectListCache.html
│   ├── service.DepartmentCache.html
│   └── service.OrganizationDataCache.html
│
├── Components (UI)
│   ├── component.BoardView.html     # Kanban board view
│   ├── component.ListView.html      # Table view
│   ├── component.CalendarView.html  # Calendar view
│   ├── component.TaskPanel.html     # Task detail panel
│   ├── component.CreateTaskModal.html
│   ├── component.CreateProjectModal.html
│   ├── component.EditProjectModal.html
│   ├── component.UserManagement.html
│   ├── component.UserDashboard.html
│   ├── component.ReportsDashboard.html
│   ├── component.ProjectManagement.html
│   ├── component.DashboardView.html
│   ├── component.NotificationCenter.html
│   ├── component.FilterBar.html
│   ├── component.InlineEditor.html
│   ├── component.CloseTaskButton.html
│   ├── component.ColorPicker.html
│   ├── component.EditProfileModal.html
│   └── Selectors (Dropdowns)
│       ├── component.ProjectSelector.html
│       ├── component.MissionGroupSelector.html
│       ├── component.DivisionSelector.html
│       ├── component.DepartmentSelector.html
│       ├── component.HospMissionSelector.html
│       └── component.ActionPlanSelector.html
│
├── Utilities
│   ├── UIHelpers.js.html            # UI helper functions
│   ├── FormValidator.js.html        # Form validation
│   ├── util.DateUtils.html
│   ├── util.DOMUtils.html
│   ├── util.DataNormalizer.html
│   ├── util.PermissionUtils.html
│   ├── util.SecurityUtils.html
│   └── util.ValidationUtils.html
│
└── Constants
    └── const.AppConstants.html      # Priority maps, colors, patterns
```

### 2.2 Database Schema (Google Sheets)

**Current Tables (19 total):**

**Core Tables (14 tables):**
1. **Users** - 16 columns (includes pinned tasks, additional roles)
2. **UserSessions** - Session management
3. **MissionGroups** - Organization structure (top level)
4. **Divisions** - Organization structure (middle level)
5. **Departments** - Organization structure (bottom level)
6. **Projects** - 11 columns (project management)
7. **Tasks** - 17 columns (main entity)
8. **Statuses** - 6 columns (custom statuses per project)
9. **TaskComments** - Task discussions (deferred to v2)
10. **Attachments** - File references (deferred to v2)
11. **Tags** - 3 columns (task categorization)
12. **TaskTags** - Many-to-many relationship (Task ↔ Tag)
13. **ActivityLogs** - 7 columns (audit trail)
14. **Notifications** - 8 columns (user notifications)

**Additional Tables (5 tables - added during analysis):**
15. **ChecklistItems** - 7 columns (task checklists with toggle)
16. **Phases** - 8 columns (project phases)
17. **HospitalMissions** - 5 columns (hospital strategic missions)
18. **ITGoals** - 5 columns (IT goals linked to missions)
19. **ActionPlans** - 5 columns (action plans linked to IT goals)

**Note:** Tables 9-10 (TaskComments, Attachments) และ 16-19 (Phases, HospitalMissions, ITGoals, ActionPlans) เป็น optional features ที่อาจเลื่อนไป v2 ได้ เพื่อเน้นที่ core functionality ก่อน

### 2.3 Key Features Inventory

#### ✅ Core Features (Working)

- **Authentication & Authorization**
  - Email/password login
  - Session management
  - Role-based access control (6 roles)
  - Additional roles per user
  - Permission system (26 permissions)

- **Project Management**
  - Hierarchical organization (Mission Group > Division > Department > Project)
  - Custom statuses per project
  - Project templates
  - Project settings

- **Task Management**
  - Create/edit/delete tasks
  - Task assignment
  - Priority levels (4 levels)
  - Due dates
  - Parent-child tasks
  - Task closing (Completed/Aborted)
  - Pinned tasks per user
  - Task comments
  - Task attachments
  - Tags

- **Views**
  - Board View (Kanban)
  - List View (Table with sorting)
  - Calendar View
  - Dashboard View
  - User Dashboard
  - Reports Dashboard

- **Filtering & Search**
  - Filter by assignee, status, priority, due date
  - Sort in list view
  - Search functionality

- **User Management**
  - User CRUD
  - Profile editing
  - Profile image upload
  - Department assignment

- **Notifications**
  - In-app notifications
  - Notification center
  - Mark as read

- **UI/UX Features**
  - Dark mode
  - Responsive design
  - Optimistic UI updates
  - Inline editing
  - Drag-and-drop (board view)
  - Date picker popover
  - Color picker
  - Mentions in comments

### 2.4 Technical Patterns Used

#### State Management
- **Centralized AppState** (`module.StateManager.html`)
- Single source of truth
- Getters/setters pattern
- State lifecycle management

#### Caching Strategy
- **Multi-layer cache:**
  - Project cache (per-project data)
  - Organization data cache
  - Department cache
  - Project list cache
- **Cache invalidation:** Manual triggers

#### Data Flow
```
User Action → UI Component → Service Layer → GAS Backend (Code.gs)
                ↓                                      ↓
            Optimistic UI                        Google Sheets
                ↓                                      ↓
            AppState Update ←──────────────────── Response
                ↓
            Re-render UI
```

#### API Communication
- `google.script.run` for GAS calls
- `window.runGoogleScript()` wrapper with promise support
- Success/failure handlers

### 2.5 Current Limitations

#### Performance Issues
- ❌ **Slow initial load:** 3-5s (loading all data upfront)
- ❌ **API call latency:** 1-3s per request (GAS cold start)
- ❌ **No pagination:** Load all tasks at once
- ❌ **No lazy loading:** All components loaded upfront
- ❌ **Large payload:** Entire dataset sent to client

#### Scalability Constraints
- ❌ **GAS Quotas:**
  - 20,000 URL Fetch calls/day
  - 6 min script runtime limit
  - 50 MB response size limit
- ❌ **Google Sheets limitations:**
  - 10M cells per spreadsheet
  - Slow query performance (linear search)
  - No complex queries (JOIN, aggregation)
  - No transactions

#### Development Constraints
- ❌ **No TypeScript:** Harder to maintain
- ❌ **No testing:** Manual testing only
- ❌ **No CI/CD:** Manual deployment
- ❌ **No version control for backend:** GAS editor only
- ❌ **Limited debugging:** Logger.log only
- ❌ **No hot reload:** Must push and refresh

#### Feature Limitations
- ❌ **No realtime updates:** Must refresh manually
- ❌ **No WebSocket:** Can't do live collaboration
- ❌ **No background jobs:** Can't schedule tasks
- ❌ **No webhooks:** Can't integrate with external services
- ❌ **Limited file storage:** Google Drive API limitations

---

## 3. Target Architecture

### 3.1 Technology Stack Details

#### Frontend
```typescript
// Next.js 14+ (App Router)
- TypeScript strict mode
- React Server Components
- Client Components for interactivity
- Streaming SSR for performance

// UI Layer
- shadcn/ui (Radix UI primitives)
- Tailwind CSS (keep existing design system)
- Framer Motion (animations)
- Lucide Icons (replacing current icons)

// State Management
- Zustand (lightweight, similar to current StateManager)
- TanStack Query (server state, caching, invalidation)
- React Context (theme, auth)

// Forms & Validation
- React Hook Form
- Zod (schema validation)

// Date Handling
- date-fns (lightweight alternative to moment)
```

#### Backend
```typescript
// API Layer
- Next.js API Routes (REST endpoints)
- tRPC (type-safe API, optional)
- Server Actions (for mutations)

// Database
- PostgreSQL 15+
- Prisma ORM (type-safe queries)
- Prisma Migrate (schema management)

// Authentication
- NextAuth.js v5
- JWT + Session strategy
- Role-based access control
- Permission middleware

// Realtime
- Pusher / Ably (managed WebSocket)
- OR Server-Sent Events (simpler)

// Background Jobs (optional)
- BullMQ + Redis
- OR Inngest (serverless jobs)

// File Storage
- Cloudinary / UploadThing
- OR Render Disk Storage (simple)

// Email
- Resend / SendGrid
```

#### Infrastructure (render.com)
```yaml
Services:
  - Web Service (Next.js app)
    - Auto-deploy from GitHub
    - Environment variables
    - Health checks
    - Auto-scaling

  - PostgreSQL Database
    - Managed PostgreSQL
    - Automated backups
    - Connection pooling

  - Redis (optional)
    - Session store
    - Cache layer
    - Rate limiting

Monitoring:
  - Render built-in logs
  - Sentry (error tracking)
  - Vercel Analytics (optional)

CI/CD:
  - GitHub Actions
  - Automated tests
  - Database migrations
  - Staging environment
```

### 3.2 New Folder Structure

```
projectflow/
├── .github/
│   └── workflows/
│       ├── ci.yml              # Run tests on PR
│       └── deploy.yml          # Deploy to render
│
├── prisma/
│   ├── schema.prisma           # Database schema
│   ├── seed.ts                 # Seed data
│   └── migrations/             # Migration history
│
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Auth routes group
│   │   │   ├── login/
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/       # Protected routes
│   │   │   ├── projects/
│   │   │   │   └── [projectId]/
│   │   │   │       ├── board/
│   │   │   │       ├── list/
│   │   │   │       └── calendar/
│   │   │   ├── settings/
│   │   │   ├── users/
│   │   │   └── layout.tsx     # Dashboard layout
│   │   ├── api/               # API routes
│   │   │   ├── auth/
│   │   │   ├── projects/
│   │   │   ├── tasks/
│   │   │   └── users/
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home page
│   │
│   ├── components/            # React components
│   │   ├── ui/               # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   └── ...
│   │   ├── views/            # Main views
│   │   │   ├── board-view/
│   │   │   ├── list-view/
│   │   │   ├── calendar-view/
│   │   │   └── dashboard-view/
│   │   ├── modals/           # Modal components
│   │   │   ├── create-task-modal.tsx
│   │   │   ├── edit-project-modal.tsx
│   │   │   └── ...
│   │   ├── panels/           # Side panels
│   │   │   └── task-panel.tsx
│   │   ├── selectors/        # Dropdown selectors
│   │   │   ├── project-selector.tsx
│   │   │   ├── user-selector.tsx
│   │   │   └── ...
│   │   ├── layout/           # Layout components
│   │   │   ├── navbar.tsx
│   │   │   ├── sidebar.tsx
│   │   │   └── breadcrumb.tsx
│   │   └── common/           # Shared components
│   │       ├── date-picker.tsx
│   │       ├── color-picker.tsx
│   │       └── ...
│   │
│   ├── lib/                  # Utility libraries
│   │   ├── db.ts            # Prisma client
│   │   ├── auth.ts          # NextAuth config
│   │   ├── permissions.ts   # Permission checks
│   │   ├── utils.ts         # General utilities
│   │   └── validations.ts   # Zod schemas
│   │
│   ├── hooks/               # Custom React hooks
│   │   ├── use-projects.ts
│   │   ├── use-tasks.ts
│   │   ├── use-permissions.ts
│   │   └── use-theme.ts
│   │
│   ├── stores/              # Zustand stores
│   │   ├── use-app-store.ts
│   │   ├── use-filter-store.ts
│   │   └── use-ui-store.ts
│   │
│   ├── types/               # TypeScript types
│   │   ├── index.ts
│   │   ├── models.ts
│   │   └── api.ts
│   │
│   └── styles/
│       └── globals.css      # Global styles + Tailwind
│
├── public/                  # Static assets
│   ├── images/
│   └── fonts/
│
├── tests/                   # Test files
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── .env.example            # Environment variables template
├── .env.local              # Local environment
├── next.config.js          # Next.js config
├── tailwind.config.ts      # Tailwind config (keep current theme)
├── tsconfig.json           # TypeScript config
├── package.json
└── README.md
```

### 3.3 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT SIDE                          │
├─────────────────────────────────────────────────────────────┤
│  Next.js App (React)                                        │
│  ├── Server Components (SSR)                                │
│  │   └── Initial data fetching                             │
│  │                                                           │
│  └── Client Components (Interactive)                        │
│      ├── Zustand Store (UI state)                          │
│      ├── TanStack Query (Server state cache)               │
│      └── WebSocket Client (Realtime updates)               │
└─────────────────────────────────────────────────────────────┘
                            ⬇️ HTTP/WebSocket
┌─────────────────────────────────────────────────────────────┐
│                        SERVER SIDE                          │
├─────────────────────────────────────────────────────────────┤
│  Next.js Server (Node.js)                                   │
│  │                                                           │
│  ├── API Routes / Server Actions                           │
│  │   ├── Authentication (NextAuth.js)                      │
│  │   ├── Authorization Middleware                          │
│  │   └── Business Logic                                    │
│  │                                                           │
│  ├── Prisma ORM                                            │
│  │   ├── Type-safe queries                                │
│  │   ├── Migrations                                        │
│  │   └── Connection pooling                               │
│  │                                                           │
│  └── External Services                                     │
│      ├── File Storage (Cloudinary)                        │
│      ├── Email Service (Resend)                           │
│      ├── WebSocket Service (Pusher)                       │
│      └── Cache Layer (Redis) [optional]                   │
└─────────────────────────────────────────────────────────────┘
                            ⬇️ SQL
┌─────────────────────────────────────────────────────────────┐
│                     POSTGRESQL DATABASE                     │
├─────────────────────────────────────────────────────────────┤
│  Core Tables (15 tables):                                  │
│  - users                                                   │
│  - organizations (mission_groups, divisions, departments)  │
│  - projects, statuses                                      │
│  - tasks, task_assignments, checklist_items               │
│  - tags, task_tags                                         │
│  - notifications, activity_logs                            │
│                                                            │
│  Optional Tables (4 tables - can defer to v2):            │
│  - phases, hospital_missions, it_goals, action_plans      │
│                                                            │
│  Deferred to v2:                                           │
│  - task_comments, task_attachments, user_sessions          │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Migration Strategy

### 4.1 Migration Approach: **Parallel Development**

**ไม่ใช่ Big Bang Migration!**

เราจะใช้วิธี **Incremental Migration** คือ:
1. พัฒนาระบบใหม่ควบคู่ไปกับระบบเก่า
2. ย้ายข้อมูลและผู้ใช้ทีละส่วน
3. ใช้งานทั้งสองระบบพร้อมกันในช่วงเปลี่ยนผ่าน
4. ปิดระบบเก่าเมื่อระบบใหม่ stable

### 4.2 Migration Phases (6 Phases)

#### **Phase 0: Preparation (2 weeks)**
- Setup development environment
- Initialize Next.js project
- Setup render.com account and services
- Setup PostgreSQL database
- Configure CI/CD pipeline
- Setup Prisma ORM
- Create migration scripts for data

#### **Phase 1: Database & Core Infrastructure (2 weeks)**
- Design PostgreSQL schema
- Create Prisma schema
- Run migrations
- Setup seed data
- Implement data migration scripts (GAS → PostgreSQL)
- Test data integrity

#### **Phase 2: Authentication & Authorization (1 week)**
- Implement NextAuth.js
- Migrate user accounts
- Implement permission system
- Implement role-based access control
- Test authentication flow

#### **Phase 3: Core UI & Layout (2 weeks)**
- Setup shadcn/ui components
- Implement layout (navbar, sidebar, breadcrumb)
- Implement routing structure
- Implement theme system (dark mode)
- Implement responsive design
- Match existing design system 100%

#### **Phase 4: Task Management Features (3-4 weeks)**
- Implement Task CRUD operations
- Implement Board View (Kanban)
- Implement List View (Table)
- Implement Calendar View
- Implement Task Panel (detail view)
- Implement filtering and sorting
- Implement Create/Edit Task modals
- Implement task comments
- Implement task attachments
- Implement pinned tasks
- Test functionality parity with GAS version

#### **Phase 5: Project & User Management (2 weeks)**
- Implement Project CRUD
- Implement Custom Statuses
- Implement Project Settings
- Implement User Management
- Implement Organization Structure
- Implement Permission Management
- Implement User Dashboard
- Implement Reports Dashboard

#### **Phase 6: Advanced Features & Optimization (2 weeks)**
- Implement realtime updates (WebSocket/SSE)
- Implement notifications system
- Implement search functionality
- Implement background jobs (if needed)
- Performance optimization
- Security hardening
- Testing (unit, integration, e2e)

#### **Phase 7: Migration & Rollout (1-2 weeks)**
- Final data migration
- User acceptance testing (UAT)
- Soft launch (selected users)
- Monitor errors and performance
- Full rollout
- Decommission GAS app

### 4.3 Data Migration Strategy

#### Step 1: Export from Google Sheets
```javascript
// GAS Script to export data to JSON
function exportToJSON() {
  const data = {
    users: getAllUsersForExport(),
    projects: getAllProjectsForExport(),
    tasks: getAllTasksForExport(),
    // ... all tables
  };

  // Save to Google Drive as JSON
  const file = DriveApp.createFile(
    'migration_data.json',
    JSON.stringify(data, null, 2)
  );

  return file.getUrl();
}
```

#### Step 2: Transform & Validate
```typescript
// Transform GAS data structure to match Prisma schema
import { z } from 'zod';

const UserSchema = z.object({
  email: z.string().email(),
  fullName: z.string(),
  role: z.enum(['admin', 'chief', 'leader', 'head', 'member', 'user']),
  // ... all fields with validation
});

function transformUsers(gasUsers: any[]) {
  return gasUsers.map(user => {
    // Transform column-based structure to object
    const transformed = {
      email: user[0], // SCHEMA.USERS.USER_ID - 1
      fullName: user[1], // SCHEMA.USERS.FULL_NAME - 1
      // ...
    };

    // Validate
    return UserSchema.parse(transformed);
  });
}
```

#### Step 3: Import to PostgreSQL
```typescript
// Prisma transaction to ensure atomicity
import { PrismaClient } from '@prisma/client';

async function importData(data: MigrationData) {
  const prisma = new PrismaClient();

  await prisma.$transaction(async (tx) => {
    // Import in correct order (respect foreign keys)
    await tx.user.createMany({ data: data.users });
    await tx.missionGroup.createMany({ data: data.missionGroups });
    await tx.division.createMany({ data: data.divisions });
    await tx.department.createMany({ data: data.departments });
    await tx.project.createMany({ data: data.projects });
    await tx.task.createMany({ data: data.tasks });
    // ...
  });
}
```

#### Step 4: Verify Data Integrity
```typescript
// Compare record counts and checksums
async function verifyMigration() {
  const checks = [
    { table: 'users', gasCount: 150, pgCount: await prisma.user.count() },
    { table: 'tasks', gasCount: 5000, pgCount: await prisma.task.count() },
    // ...
  ];

  const mismatches = checks.filter(c => c.gasCount !== c.pgCount);

  if (mismatches.length > 0) {
    throw new Error(`Data mismatch: ${JSON.stringify(mismatches)}`);
  }
}
```

### 4.4 Rollback Plan

**ถ้าเกิดปัญหาร้ายแรง:**

1. **DNS Rollback:** เปลี่ยน URL กลับไปใช้ GAS app
2. **Database Snapshot:** Restore จาก backup ล่าสุด
3. **Code Rollback:** Revert to previous stable version
4. **Communication:** แจ้งผู้ใช้ทันที + timeline การแก้ไข

**Rollback Triggers:**
- Error rate > 5%
- Response time > 5s (P95)
- Data loss detected
- Critical feature broken
- User complaints > 20% of active users

---

## 5. Risk Assessment

### 5.1 High-Risk Areas

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Data Loss During Migration** | 🔴 Critical | 🟡 Medium | - Automated tests<br>- Multiple backups<br>- Dry-run migrations<br>- Rollback plan |
| **Feature Parity Gap** | 🟠 High | 🟡 Medium | - Detailed feature checklist<br>- User acceptance testing<br>- Side-by-side comparison |
| **Performance Degradation** | 🟠 High | 🟢 Low | - Load testing<br>- Performance monitoring<br>- Optimization before launch |
| **Authentication Issues** | 🔴 Critical | 🟢 Low | - Thorough auth testing<br>- Session migration script<br>- Fallback login method |
| **Downtime During Cutover** | 🟠 High | 🟡 Medium | - Gradual rollout<br>- Feature flags<br>- Parallel running period |
| **User Resistance to Change** | 🟡 Medium | 🟠 High | - Early user involvement<br>- Training materials<br>- Smooth UX transition |
| **Budget Overrun** | 🟡 Medium | 🟡 Medium | - Clear scope definition<br>- Phased approach<br>- Cost monitoring |
| **Third-party Service Failures** | 🟡 Medium | 🟢 Low | - Service redundancy<br>- Graceful degradation<br>- Local fallbacks |

### 5.2 Dependencies & Blockers

**External Dependencies:**
- render.com availability and performance
- PostgreSQL managed service uptime
- Third-party API availability (email, storage, realtime)
- GitHub Actions for CI/CD

**Internal Blockers:**
- Development team availability
- User feedback and approval
- Testing environment setup
- Data export permissions from GAS

---

## 6. Timeline Overview

### 6.1 Gantt Chart (High-Level)

```
Week →  1   2   3   4   5   6   7   8   9   10  11  12  13  14  15  16
Phase 0 [████████]
Phase 1     [████████████]
Phase 2             [████████]
Phase 3                 [████████████████]
Phase 4                         [████████████████████████]
Phase 5                                     [████████████████]
Phase 6                                             [████████████████]
Phase 7                                                     [████████████]
        │                                                           │
    Start Date                                                  Launch
```

**Total Estimated Time:** 18-20 weeks (~5 months)*

*หมายเหตุ: เพิ่มจาก 14-16 weeks เนื่องจาก:
- เพิ่ม 5 database tables (ChecklistItems, Phases, HospitalMissions, ITGoals, ActionPlans)
- เพิ่ม 35 API endpoints (รวม 65 endpoints จาก 97+ GAS functions)
- เพิ่ม 6 advanced frontend features (Checklists UI, Skeleton States, Pinned Tasks, etc.)
- ทดสอบ business logic ที่ซับซ้อน (Permissions, Progress Calculation)

สามารถลดเหลือ 16-18 weeks ได้ ถ้าเลื่อน optional features (Phases, HospitalMissions, ITGoals, ActionPlans, Offline Support) ไป v2

### 6.2 Milestones

| Milestone | Target Date | Deliverables |
|-----------|-------------|--------------|
| **M1: Infrastructure Ready** | Week 2 | - Next.js project setup<br>- render.com configured<br>- PostgreSQL database created |
| **M2: Database Migrated (19 tables)** | Week 4 | - Schema created (15 core + 4 optional)<br>- Data migrated<br>- Data integrity verified |
| **M3: Authentication + Permissions** | Week 6 | - Users can log in<br>- 6-level permission system working<br>- Role-based access enforced |
| **M4: Core UI Complete** | Week 9 | - Layout matches GAS app<br>- Navigation working<br>- shadcn/ui theme working |
| **M5: Task Management Complete** | Week 13 | - All views working (List, Board, Calendar, Gantt)<br>- CRUD + Checklists<br>- Pinned tasks, Batch operations |
| **M6: Full Feature Parity (95%+)** | Week 15 | - All 65 API endpoints working<br>- User/Project management<br>- Progress calculation accurate |
| **M7: Production Ready** | Week 18 | - 70%+ test coverage<br>- Performance optimized (p95 < 200ms)<br>- Security audit passed |
| **M8: Live! 🚀** | Week 20 | - Soft launch complete<br>- Monitoring in place<br>- Users migrated successfully |

---

## 7. Success Metrics

### 7.1 Technical Metrics

**Performance:**
- ✅ Initial page load < 1s
- ✅ API response time < 500ms (P95)
- ✅ Time to Interactive (TTI) < 2s
- ✅ Lighthouse score > 90

**Reliability:**
- ✅ Uptime > 99.9%
- ✅ Error rate < 0.5%
- ✅ Zero data loss
- ✅ Successful deployments > 95%

**Scalability:**
- ✅ Support 500+ concurrent users
- ✅ Handle 10K+ tasks per project
- ✅ Database query time < 100ms (P95)

### 7.2 User Metrics

**Adoption:**
- ✅ 100% user migration within 2 weeks of launch
- ✅ < 5% users requesting GAS app access
- ✅ User satisfaction score > 4/5

**Productivity:**
- ✅ Task creation time reduced by 50%
- ✅ Page load time perceived as "fast" by > 90% users
- ✅ Zero critical bugs reported in first week

### 7.3 Business Metrics

**Cost:**
- ✅ Monthly hosting cost < $100 (for initial scale)
- ✅ Zero GAS quota exceeded errors
- ✅ Infrastructure cost predictable and scalable

**Development:**
- ✅ New feature development time reduced by 30%
- ✅ Bug fix time reduced by 50%
- ✅ Test coverage > 80%

---

## 8. Next Steps

### Immediate Actions (This Week)

1. **Review this document** with stakeholders
2. **Get approval** for migration approach and timeline
3. **Setup render.com account** and explore services
4. **Create GitHub repository** for new project
5. **Document current GAS app** (API endpoints, data flows)
6. **Start Phase 0:** Development environment setup

### Questions to Answer Before Starting

- [ ] Budget approved for render.com hosting? (~$14-65/month initial)
- [ ] Team availability confirmed for 5-month timeline (18-20 weeks)?
- [ ] Stakeholder approval for parallel running period?
- [ ] User testing group identified (10-20 users)?
- [ ] Rollback acceptable window defined? (e.g., 24 hours)
- [ ] Data export permissions confirmed from GAS?
- [ ] Priority confirmed: Full feature parity or faster launch with deferred features?

---

## 9. Related Documents

See migration_plan/ folder for detailed documentation:

1. `01_DATABASE_MIGRATION.md` - Database schema mapping and migration scripts (19 tables)
2. `02_API_MIGRATION.md` - API endpoint migration guide (65 endpoints from 97+ GAS functions)
3. `03_FRONTEND_MIGRATION.md` - Component-by-component migration plan (28 core + 6 enhancements)
4. `04_DEPLOYMENT_GUIDE.md` - render.com deployment and configuration
5. `05_ROLLOUT_PLAN.md` - Phased rollout, testing strategy, and user communication
6. `06_BUSINESS_LOGIC_GUIDE.md` - Core business logic implementation guide (Permissions, Progress, etc.)

**Note:** Authentication & authorization details are in `02_API_MIGRATION.md`. Testing strategy is in `05_ROLLOUT_PLAN.md`.

---

**Document Status:** ✅ Updated (v1.1) - Ready for Implementation
**Last Updated:** 2025-10-20
**Next Review:** After Phase 1 completion
