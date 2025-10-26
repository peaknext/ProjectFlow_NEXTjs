# Deployment Preparation Checklist

**Date Created**: 2025-10-26
**Target Platform**: Render.com
**Status**: 🔄 IN PROGRESS

---

## 📊 Current Project Status

**Backend**: ✅ 100% Complete (78+ API endpoints)
**Frontend**: ~68% Complete (44+/55+ components)
**Development Phase**: Testing & Bug Fixing
**Next Milestone**: Production Deployment to Render.com

---

## 1️⃣ Code Refactoring & Optimization

### 1.1 Performance Optimization ✅ COMPLETE

- [x] **Dashboard API** - 72% faster (11 parallel queries)
- [x] **Department Tasks API** - 65% faster (4 parallel queries)
- [x] **Reports API** - 55% faster (3 parallel queries)
- [x] **Project Board API** - 25% faster (3 parallel queries)

**Result**: All critical endpoints optimized ✅

---

### 1.2 Code Quality Improvements 🔄 ONGOING

#### Backend Code Review

- [x] **Remove console.log statements** from production code
  - Check: `src/app/api/**/*.ts`
  - Tool: `grep -r "console.log" src/app/api --include="*.ts"`

- [ ] **Remove debug comments** and TODO that are complete
  - Search: `grep -r "TODO" src/app/api --include="*.ts"`
  - Search: `grep -r "FIXME" src/app/api --include="*.ts"`

- [ ] **Standardize error messages** (Thai language consistency)
  - Review all `errorResponse()` calls
  - Ensure consistent tone and terminology

#### Frontend Code Review

- [ ] **Remove unused imports**
  - Tool: Check IDE unused import warnings
  - Focus: All component files

- [ ] **Remove console.log statements**
  - Check: `src/components/**/*.tsx`, `src/hooks/**/*.ts`
  - Exception: Keep error logging for debugging

- [ ] **Optimize React Query staleTime**
  - Review all `useQuery` hooks
  - Ensure appropriate cache times

- [ ] **Check for memory leaks**
  - Review `useEffect` cleanup functions
  - Verify all event listeners are removed

---

### 1.3 Database Optimization

- [ ] **Review database indexes** (Prisma schema)
  - Check: All `@@index` declarations
  - Add missing indexes for frequently queried fields

- [ ] **Review N+1 query issues**
  - Check: All Prisma queries with `include`
  - Verify using `select` only when needed

- [ ] **Clean up test data** before production
  - Remove: Seeded test users/projects
  - Keep: Only organization structure (departments, etc.)

---

### 1.4 Security Hardening

- [ ] **Environment variables audit**
  - Verify: No hardcoded secrets in code
  - Check: All sensitive values in `.env`
  - Document: Required env vars in `.env.example`

- [ ] **BYPASS_AUTH must be false**
  - Check: `.env` has `BYPASS_AUTH=false`
  - Check: `.env` has `BYPASS_EMAIL=false`
  - Remove: `BYPASS_USER_ID` (or set empty)

- [ ] **Review permission checks**
  - Verify: All sensitive routes have `withAuth()`
  - Verify: All mutations check permissions
  - Check: `src/lib/permissions.ts` coverage

- [ ] **Rate limiting** (if not handled by Render)
  - Consider: API rate limiting middleware
  - Consider: Failed login attempt limits

- [ ] **Input validation**
  - Verify: All API routes use Zod schemas
  - Check: No SQL injection vulnerabilities
  - Check: No XSS vulnerabilities in user-generated content

---

## 2️⃣ Debugging & Testing

### 2.1 Critical Bug Fixes 🔄 ONGOING

#### Recently Fixed (Oct 26)

- [x] ✅ Notification creation bug (mentions & assignments)
- [x] ✅ Multi-assignee permission system
- [x] ✅ Dashboard optimistic UI lag
- [x] ✅ Date validation (400 errors)
- [x] ✅ Task panel Save button
- [x] ✅ Project progress backfill

#### Known Issues to Test

- [ ] **Activities API error** (Comment model field mismatch)
  - Error: `Unknown field 'user' for include statement on model Comment`
  - Location: `src/app/api/dashboard/activities/route.ts`
  - Priority: HIGH (blocking Dashboard Recent Activities widget)

- [ ] **Test notification polling** (user verification needed)
  - Test mentions create notifications
  - Test assignments create notifications
  - Test polling updates badge

- [ ] **Test all permission scenarios**
  - ADMIN can manage all users
  - LEADER can see division scope
  - HEAD can see department scope
  - MEMBER can only edit own tasks

---

### 2.2 End-to-End Testing Checklist

#### Authentication Flow

- [ ] Register new user (with all required fields)
- [ ] Verify email link (if email enabled)
- [ ] Login with correct credentials
- [ ] Login with wrong password (should fail)
- [ ] Request password reset
- [ ] Reset password with valid token
- [ ] Session expiry (after 7 days)

#### Dashboard

- [ ] All 7 widgets load without errors
- [ ] Stats cards show correct counts
- [ ] Pinned tasks can be unpinned
- [ ] My Tasks filter tabs work
- [ ] Calendar shows tasks on correct dates
- [ ] Recent Activities loads (fix API error first)
- [ ] My Checklist toggle works

#### Project Management

- [ ] Create new project (with all fields)
- [ ] Edit project details
- [ ] View project in Board/Calendar/List views
- [ ] All 3 views switch without errors
- [ ] Create task in project
- [ ] Drag task between statuses (Board view)
- [ ] Edit task details
- [ ] Assign multiple users to task
- [ ] Add comments with @mentions
- [ ] Add checklists to task
- [ ] Close task (COMPLETED/ABORTED)

#### Department Tasks View

- [ ] LEADER sees all division tasks
- [ ] HEAD sees only department tasks
- [ ] Tasks grouped by project
- [ ] Expand/collapse project groups
- [ ] Task counts accurate

#### User Management

- [ ] ADMIN can create users
- [ ] ADMIN can edit users (except other ADMIN)
- [ ] ADMIN can suspend users
- [ ] HEAD/LEADER can toggle user status
- [ ] MEMBER/USER cannot access Users page

#### Reports

- [ ] ADMIN can filter all organizations
- [ ] LEADER can only see division
- [ ] Charts render without errors
- [ ] Date range filters work
- [ ] Export CSV works

#### Notifications

- [ ] Bell shows unread count
- [ ] Dropdown shows all notifications
- [ ] Click notification opens task panel
- [ ] Auto-mark as read after 2.5s
- [ ] Polling updates every 60s

---

### 2.3 Browser Compatibility Testing

- [ ] **Chrome** (latest) - Primary browser
- [ ] **Firefox** (latest)
- [ ] **Safari** (latest) - macOS/iOS
- [ ] **Edge** (latest)
- [ ] **Mobile Chrome** (Android)
- [ ] **Mobile Safari** (iOS)

**Test**: All major features work in each browser

---

### 2.4 Performance Testing

- [ ] **Lighthouse Score** (target: >90)
  - Performance: >80
  - Accessibility: >90
  - Best Practices: >90
  - SEO: >80

- [ ] **Load Testing** (optional)
  - Use: Apache Bench or similar
  - Test: 100 concurrent users
  - Target: <2s response time

- [ ] **Bundle Size Analysis**
  - Run: `npm run build`
  - Check: `.next/analyze` (if analyzer enabled)
  - Target: <500KB initial JS bundle

---

## 3️⃣ Deployment Preparation (Render.com)

### 3.1 Pre-Deployment Configuration

#### Environment Variables (Render Dashboard)

- [ ] `DATABASE_URL` - PostgreSQL connection string (from Render)
- [ ] `BYPASS_AUTH=false` ⚠️ **CRITICAL**
- [ ] `BYPASS_EMAIL=false` ⚠️ **CRITICAL**
- [ ] `RESEND_API_KEY` - Email service API key
- [ ] `RESEND_FROM_EMAIL` - Verified sender email
- [ ] `NEXT_PUBLIC_APP_URL` - Production URL (https://your-app.onrender.com)
- [ ] `NODE_ENV=production`

#### Build Configuration (render.yaml or Dashboard)

```yaml
services:
  - type: web
    name: projectflows
    runtime: node
    buildCommand: npm install && npm run prisma:generate && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
```

---

### 3.2 Database Migration Strategy

#### Option 1: Fresh Database (Recommended for first deploy)

```bash
# 1. Create PostgreSQL database on Render
# 2. Get DATABASE_URL from Render dashboard
# 3. Run migrations locally first (test)
npx prisma db push --schema ./prisma/schema.prisma

# 4. Seed organization structure (NOT test data)
# Create SQL file with only:
# - mission_groups
# - divisions
# - departments
# - job_titles
# - statuses (default project statuses)

# 5. Deploy app to Render
# 6. Let Prisma migrate on first start
```

#### Option 2: Migrate Existing Data

- [ ] Export production data from current database
- [ ] Transform to match Prisma schema
- [ ] Import to Render PostgreSQL
- [ ] Test data integrity

---

### 3.3 Render.com Specific Setup

#### Create Services

- [ ] **Web Service** (Next.js app)
  - Name: `projectflows-web`
  - Environment: Node 18+
  - Build Command: `npm install && npx prisma generate && npm run build`
  - Start Command: `npm start`
  - Auto-Deploy: Yes (from main branch)

- [ ] **PostgreSQL Database**
  - Name: `projectflows-db`
  - Plan: Free tier (for testing) or Starter ($7/mo)
  - Copy DATABASE_URL to web service env vars

#### Custom Domain (Optional)

- [ ] Add custom domain in Render dashboard
- [ ] Update DNS records (CNAME)
- [ ] SSL certificate (auto-generated by Render)
- [ ] Update `NEXT_PUBLIC_APP_URL` env var

---

### 3.4 Post-Deployment Verification

#### Health Checks

- [ ] `/api/health` returns 200 OK
- [ ] Can login with test account
- [ ] Can create new user (ADMIN only)
- [ ] Dashboard loads without errors
- [ ] Database queries work
- [ ] Email sending works (test with real email)

#### Monitoring Setup

- [ ] Check Render logs for errors
- [ ] Set up uptime monitoring (e.g., UptimeRobot)
- [ ] Set up error tracking (e.g., Sentry - optional)
- [ ] Monitor database usage (Render dashboard)

---

### 3.5 Rollback Plan

**If deployment fails:**

```bash
# Option 1: Rollback in Render dashboard
# - Go to Deploys tab
# - Click "Rollback" on previous successful deploy

# Option 2: Revert git commit
git revert HEAD
git push origin main
# Render auto-deploys previous version
```

---

## 4️⃣ Documentation Updates

### Update CLAUDE.md

- [ ] Change status to "Production Ready"
- [ ] Update deployment section with Render.com details
- [ ] Remove development-only notes
- [ ] Add production URL
- [ ] Update "Known Issues" section

### Create Production README

- [ ] Deployment guide for Render.com
- [ ] Environment variables documentation
- [ ] Backup/restore procedures
- [ ] Monitoring setup guide
- [ ] Common troubleshooting

### User Documentation (Optional)

- [ ] Admin guide (user management, permissions)
- [ ] User guide (how to use dashboard, create tasks)
- [ ] Video tutorials (optional)

---

## 5️⃣ Final Pre-Launch Checklist

### Code Quality ✅

- [ ] All console.log removed (except error logging)
- [ ] All TODO comments resolved or documented
- [ ] All tests passing (if tests exist)
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] No ESLint errors (`npm run lint`)

### Security ✅

- [ ] BYPASS_AUTH=false in production
- [ ] BYPASS_EMAIL=false in production
- [ ] All API routes protected with withAuth()
- [ ] Permission system tested thoroughly
- [ ] No secrets in git history
- [ ] `.env` is in `.gitignore`

### Performance ✅

- [ ] Lighthouse score >80
- [ ] All critical APIs <500ms response time
- [ ] Images optimized
- [ ] Bundle size reasonable (<500KB)

### Testing ✅

- [ ] All major features tested manually
- [ ] Authentication flow tested
- [ ] Permission system tested
- [ ] Cross-browser tested
- [ ] Mobile responsive tested

### Deployment ✅

- [ ] Render.com account created
- [ ] PostgreSQL database provisioned
- [ ] Environment variables configured
- [ ] Build successful on Render
- [ ] Health check passing
- [ ] Can login and use app

---

## 📊 Progress Tracker

**Total Tasks**: ~80
**Completed**: ~25 (31%)
**In Progress**: ~10
**Pending**: ~45

**Estimated Time to Production**: 2-3 weeks

- Week 1: Code refactoring, debugging, testing
- Week 2: Production setup, deployment, verification
- Week 3: Buffer for issues, documentation

---

## 🚀 Quick Commands

### Development

```bash
# Start dev server (port 3010)
PORT=3010 npm run dev

# Check TypeScript errors
npx tsc --noEmit

# Run linter
npm run lint

# Find console.log
grep -r "console.log" src --include="*.ts" --include="*.tsx"

# Find TODO comments
grep -r "TODO" src --include="*.ts" --include="*.tsx"
```

### Database

```bash
# Generate Prisma client
npm run prisma:generate

# Push schema changes
npm run prisma:push

# Open Prisma Studio
npm run prisma:studio

# Seed database
npm run seed
```

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start

# Test production build locally
npm run build && npm start
```

---

**Last Updated**: 2025-10-26
**Next Review**: After completing Section 1 (Refactoring)

---

**End of Checklist**
