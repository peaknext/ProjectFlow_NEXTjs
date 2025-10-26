# Render.com Deployment Guide

**Version**: 1.0.0
**Date**: 2025-10-26
**Platform**: Render.com
**Estimated Time**: 30-45 minutes

---

## 🎯 Deployment Overview

**What we're deploying:**

- Next.js 15 web application (Node.js 18+)
- PostgreSQL database (Render managed)
- Environment: Production

**Render.com Plan:**

- Web Service: Free tier or Starter ($7/mo)
- PostgreSQL: Free tier (1GB) or Starter ($7/mo)

---

## 📋 Pre-Deployment Checklist

### ✅ Code Ready

- [x] All console.log removed (140+ statements)
- [x] TypeScript check passed (no new errors)
- [x] Environment variables verified
- [x] BYPASS_AUTH=false
- [x] BYPASS_EMAIL=false
- [x] Git repository clean (no uncommitted changes)
- [x] Latest code pushed to GitHub/GitLab

### ✅ Accounts Ready

- [x] GitHub/GitLab account (for repo)
- [x] Render.com account (create at https://render.com)
- [x] Resend.com account (for emails) - already have API key

### ✅ Database Preparation

- [x] Decide: Fresh database OR migrate existing data
- [x] Prepare seed SQL (organization structure only)

---

## 🚀 Step 1: Prepare Git Repository

### 1.1 Create .env.example (if not exists)

```bash
# Create example env file for documentation
cat > .env.example << 'EOF'
# Database
DATABASE_URL="postgresql://user:password@host:port/database"

# Authentication (MUST BE FALSE IN PRODUCTION)
BYPASS_AUTH=false
BYPASS_EMAIL=false

# Email Service (Resend)
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=noreply@yourdomain.com

# Application URL
NEXT_PUBLIC_APP_URL=https://your-app.onrender.com

# Node Environment
NODE_ENV=production
EOF
```

### 1.2 Verify .gitignore

```bash
# Check .env is ignored
grep -q "^\.env$" .gitignore && echo "✓ .env ignored" || echo "⚠ Add .env to .gitignore"

# Check sensitive files ignored
cat >> .gitignore << 'EOF'
.env
.env.local
.env.*.local
node_modules
.next
*.log
.DS_Store
EOF
```

### 1.3 Commit & Push

```bash
# Check git status
git status

# Add all changes
git add .

# Commit
git commit -m "chore: Prepare for production deployment

- Remove all console.log statements
- Verify environment variables
- Update documentation
- Ready for Render.com deployment"

# Push to main/master branch
git push origin main  # or master
```

---

## 🗄️ Step 2: Create PostgreSQL Database on Render

### 2.1 Login to Render.com

1. Go to https://dashboard.render.com
2. Click "New +" → "PostgreSQL"

### 2.2 Configure Database

**Settings:**

```yaml
Name: projectflows-db
Database: projectflowdb
User: projectflowdb_user
Region: Singapore (closest to your users)
PostgreSQL Version: 15
Plan: Free (1GB) or Starter ($7/mo - 10GB)
```

Click **"Create Database"**

### 2.3 Save Database Credentials

**IMPORTANT:** Render will show you the connection details **once**. Save them:

```
Internal Database URL: postgresql://projectflowdb_user:...@dpg-xxx-a/projectflowdb
External Database URL: postgresql://projectflowdb_user:...@dpg-xxx-a.singapore-postgres.render.com/projectflowdb

Host: dpg-xxx-a.singapore-postgres.render.com
Port: 5432
Database: projectflowdb
Username: projectflowdb_user
Password: [SAVE THIS - shown once]
```

**Copy the "Internal Database URL"** - we'll use this for the web service.

### 2.4 (Optional) Test Connection Locally

```bash
# Install psql if needed
# Windows: Download from https://www.postgresql.org/download/
# Mac: brew install postgresql
# Linux: sudo apt install postgresql-client

# Test connection (use External URL for local testing)
psql "postgresql://projectflowdb_user:PASSWORD@dpg-xxx-a.singapore-postgres.render.com/projectflowdb"

# If connected successfully:
# \dt - list tables (should be empty)
# \q - quit
```

---

## 🌐 Step 3: Create Web Service on Render

### 3.1 Create New Web Service

1. Dashboard → "New +" → "Web Service"
2. Connect your GitHub/GitLab repository
3. Select repository: `ProjectFlow_NEXTjs`

### 3.2 Configure Web Service

**Basic Settings:**

```yaml
Name: projectflows-web
Region: Singapore (same as database)
Branch: main (or master)
Root Directory: (leave empty)
Runtime: Node
Build Command: npm install && npx prisma generate && npm run build
Start Command: npm start
```

**Advanced Settings:**

```yaml
Auto-Deploy: Yes (deploy on git push)
Health Check Path: /api/health (if you have it, otherwise /)
```

### 3.3 Choose Plan

- **Free**: 750 hours/month, sleeps after 15 min inactivity
- **Starter ($7/mo)**: Always on, better performance
- **Recommendation**: Start with Free, upgrade if needed

**Click "Create Web Service"** (don't deploy yet - we need env vars first)

---

## ⚙️ Step 4: Configure Environment Variables

### 4.1 Add Environment Variables

In Render dashboard → Your web service → "Environment"

Add these variables **one by one**:

```bash
# 1. Database
DATABASE_URL
Internal Database URL from Step 2.3
Example: postgresql://projectflowdb_user:xxx@dpg-xxx-a/projectflowdb

# 2. Authentication (CRITICAL!)
BYPASS_AUTH
false

# 3. Email Bypass (CRITICAL!)
BYPASS_EMAIL
false

# 4. Resend API (Email Service)
RESEND_API_KEY
re_EnC4vJrK_22SnBNu7kGoJKLHtnWHhbDSF

# 5. Resend From Email
RESEND_FROM_EMAIL
noreply@projectflows.app

# 6. Application URL
NEXT_PUBLIC_APP_URL
https://projectflows-web.onrender.com
(⚠️ Use YOUR Render URL - check in dashboard)

# 7. Node Environment
NODE_ENV
production
```

**Double-check:**

- [ ] `BYPASS_AUTH=false` ⚠️ **CRITICAL**
- [ ] `BYPASS_EMAIL=false` ⚠️ **CRITICAL**
- [ ] `DATABASE_URL` uses **Internal** URL (not External)
- [ ] `NEXT_PUBLIC_APP_URL` matches your Render URL

Click **"Save Changes"**

---

## 📦 Step 5: Database Migration

### 5.1 Option A: Fresh Database (Recommended for First Deploy)

**What this does:**

- Creates all tables from Prisma schema
- Seeds with organization structure only (no test data)

**Steps:**

1. **Install Render CLI** (optional, or use Render Shell):

```bash
npm install -g @render/cli
render login
```

2. **Connect to database via Render Shell:**
   - Dashboard → Your PostgreSQL database → "Shell" tab
   - Or use: `render shell projectflows-db`

3. **Run Prisma migration:**

```bash
# In Render Shell or via psql
# This will be done automatically on first deploy by build command
# But you can do it manually if needed:

# Option 1: Via Render Shell
cd /opt/render/project/src
npx prisma db push --schema ./prisma/schema.prisma

# Option 2: Via local terminal (using External URL)
DATABASE_URL="postgresql://..." npx prisma db push
```

4. **Seed Organization Structure:**

Create a production seed file: `prisma/seed-production.sql`

```sql
-- Insert Mission Groups
INSERT INTO mission_groups (id, name, "missionGroupCode", "chiefUserId", "createdAt", "updatedAt")
VALUES
  ('MISSION-2024-001', 'กลุ่มภารกิจด้านบริการ', 'SVC', NULL, NOW(), NOW()),
  ('MISSION-2024-002', 'กลุ่มภารกิจด้านบริหาร', 'ADM', NULL, NOW(), NOW());

-- Insert Divisions (update with your actual data)
INSERT INTO divisions (id, name, code, "missionGroupId", "leaderUserId", "createdAt", "updatedAt")
VALUES
  ('DIV-037', 'กลุ่มงานเทคโนโลยีสารสนเทศ', 'IT', 'MISSION-2024-002', NULL, NOW(), NOW());

-- Insert Departments (update with your actual data)
INSERT INTO departments (id, name, code, "divisionId", "headUserId", "createdAt", "updatedAt")
VALUES
  ('DEPT-058', 'ฝ่ายเทคโนโลยีสารสนเทศ', 'IT-DEPT', 'DIV-037', NULL, NOW(), NOW()),
  ('DEPT-059', 'ฝ่ายพัฒนาระบบ', 'DEV', 'DIV-037', NULL, NOW(), NOW());

-- Insert Job Titles (update with your actual data)
INSERT INTO job_titles (id, name, level, "createdAt", "updatedAt")
VALUES
  ('JOB-001', 'ผู้อำนวยการ', 'EXECUTIVE', NOW(), NOW()),
  ('JOB-002', 'หัวหน้าแผนก', 'MANAGER', NOW(), NOW()),
  ('JOB-003', 'เจ้าหน้าที่', 'STAFF', NOW(), NOW());
```

**Upload and run:**

```bash
# Copy file to server or paste in Render Shell
psql $DATABASE_URL -f prisma/seed-production.sql
```

### 5.2 Option B: Migrate Existing Data (Advanced)

**If you have production data from old system:**

1. **Export from old database:**

```bash
# From old GAS or existing DB
# Export to SQL dump file
```

2. **Transform data:**

```bash
# Convert to match Prisma schema
# Handle ID formats, field names, etc.
```

3. **Import to Render:**

```bash
psql $DATABASE_URL -f production_data.sql
```

---

## 🚀 Step 6: Deploy Application

### 6.1 Trigger Deployment

**Method 1: Auto-deploy (if enabled)**

- Just push to main branch
- Render auto-deploys

**Method 2: Manual deploy**

- Dashboard → Your web service → "Manual Deploy" → "Deploy latest commit"

### 6.2 Monitor Build Process

Watch the logs in Render dashboard:

```
Cloning repository...
Installing dependencies... (npm install)
Generating Prisma client... (npx prisma generate)
Building Next.js... (npm run build)
Starting server... (npm start)

==> Your service is live 🎉
```

**Expected build time:** 3-5 minutes

### 6.3 Check Deployment Status

- **Green**: Deployment successful ✅
- **Yellow**: Building... ⏳
- **Red**: Build failed ❌ (check logs)

**Common build errors:**

- Missing env vars → Add in Environment tab
- Prisma client error → Check `npx prisma generate` in build command
- TypeScript errors → Fix and push

---

## ✅ Step 7: Post-Deployment Verification

### 7.1 Health Check

```bash
# Replace with your Render URL
curl https://projectflows-web.onrender.com

# Should return HTML or "OK"
```

### 7.2 Test Login

1. Open browser: `https://projectflows-web.onrender.com`
2. Should redirect to `/login`
3. Try to login (but you need a user first!)

### 7.3 Create First ADMIN User

**Two options:**

**Option A: Via Render Shell**

```sql
-- Connect to database
psql $DATABASE_URL

-- Create admin user (update with your info)
INSERT INTO users (
  id, email, "firstName", "lastName", "fullName", "passwordHash", salt,
  role, "departmentId", "userStatus", "isVerified", "createdAt", "updatedAt"
)
VALUES (
  'admin001',
  'admin@yourdomain.com',
  'Admin',
  'User',
  'Admin User',
  -- Password hash for 'ChangeMe123!' (you should change this)
  encode(digest('ChangeMe123!tempSalt', 'sha256'), 'hex'),
  'tempSalt',
  'ADMIN',
  'DEPT-058',
  'ACTIVE',
  true,
  NOW(),
  NOW()
);
```

**Option B: Via API (if you have user creation endpoint)**

```bash
# Use Postman or curl
curl -X POST https://projectflows-web.onrender.com/api/admin/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@yourdomain.com",
    "firstName": "Admin",
    "lastName": "User",
    "password": "ChangeMe123!",
    "role": "ADMIN",
    "departmentId": "DEPT-058"
  }'
```

### 7.4 Test Core Features

Login with admin account and test:

- [ ] Dashboard loads
- [ ] Can create project
- [ ] Can create task
- [ ] Can create user
- [ ] Email sending works (check inbox)

### 7.5 Monitor Logs

```bash
# Watch logs in real-time
render logs -t projectflows-web

# Or in dashboard: Your service → "Logs" tab
```

**Look for:**

- No errors (red)
- Successful DB connections
- API requests working

---

## 🔧 Step 8: Post-Deployment Configuration

### 8.1 Custom Domain (Optional)

**If you have a custom domain:**

1. Dashboard → Your web service → "Settings" → "Custom Domain"
2. Add domain: `app.yourdomain.com`
3. Add CNAME record in your DNS:
   ```
   CNAME app.yourdomain.com → projectflows-web.onrender.com
   ```
4. Wait for SSL certificate (auto-generated, ~5 min)
5. Update `NEXT_PUBLIC_APP_URL` env var to new domain

### 8.2 Enable HTTPS Redirect

- Render automatically redirects HTTP → HTTPS
- Verify by visiting `http://` version

### 8.3 Setup Monitoring (Optional)

**External Monitoring:**

- [UptimeRobot](https://uptimerobot.com) - Free uptime monitoring
- [Better Uptime](https://betteruptime.com) - Uptime + status page
- Monitor URL: `https://projectflows-web.onrender.com`
- Check interval: 5 minutes

**Error Tracking:**

- [Sentry](https://sentry.io) - Free tier available
- Add to `next.config.js`:

```js
const { withSentryConfig } = require("@sentry/nextjs");
// ... sentry configuration
```

---

## 🐛 Troubleshooting

### Issue 1: Build Fails - "Cannot find module '@prisma/client'"

**Solution:**

```bash
# Ensure build command includes:
npm install && npx prisma generate && npm run build
```

### Issue 2: Database Connection Error

**Check:**

- [ ] DATABASE_URL uses **Internal** URL (not External)
- [ ] Database is in same region as web service
- [ ] Firewall rules allow connection

**Test connection:**

```bash
# In Render Shell
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.$connect().then(() => console.log('Connected!')).catch(e => console.error(e))"
```

### Issue 3: 502 Bad Gateway

**Causes:**

- App not listening on correct port
- App crashed on startup
- Health check failing

**Check logs:**

```bash
render logs -t projectflows-web
# Look for: "Listening on port 3000" or errors
```

**Verify port:**

```js
// Make sure app listens on process.env.PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT);
```

### Issue 4: Environment Variables Not Working

**Check:**

- [ ] Variables saved in Render dashboard
- [ ] Service redeployed after adding vars
- [ ] No typos in variable names

**Test:**

```bash
# In Render Shell
echo $DATABASE_URL
echo $BYPASS_AUTH
```

### Issue 5: Free Tier Sleeps

**Behavior:**

- Free tier sleeps after 15 min inactivity
- First request after sleep takes ~30 seconds

**Solutions:**

- Upgrade to Starter plan ($7/mo)
- Use cron job to ping every 14 min (free tier workaround)
- Accept the limitation for testing

### Issue 6: Email Not Sending

**Check:**

- [ ] RESEND_API_KEY is correct
- [ ] RESEND_FROM_EMAIL is verified in Resend dashboard
- [ ] BYPASS_EMAIL=false
- [ ] Check Resend logs: https://resend.com/logs

---

## 🔄 Continuous Deployment

### Auto-Deploy on Git Push

**Already enabled if you selected "Auto-Deploy: Yes"**

```bash
# Make changes locally
git add .
git commit -m "feat: add new feature"
git push origin main

# Render automatically:
# 1. Detects push
# 2. Pulls latest code
# 3. Runs build
# 4. Deploys new version
# 5. Zero-downtime deployment
```

**Monitor:** Dashboard → "Events" tab shows all deployments

---

## 📊 Performance Optimization

### 1. Enable Caching

```js
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};
```

### 2. Database Connection Pooling

```env
# Add to DATABASE_URL
DATABASE_URL="postgresql://...?connection_limit=10&pool_timeout=20"
```

### 3. Prisma Query Optimization

```ts
// Already done in your APIs (parallel queries)
const [users, projects] = await Promise.all([
  prisma.user.findMany(),
  prisma.project.findMany(),
]);
```

---

## 📝 Rollback Plan

### If Deployment Fails

**Option 1: Rollback via Dashboard**

1. Dashboard → Your service → "Deploys" tab
2. Find previous successful deploy
3. Click "Rollback" button

**Option 2: Revert Git Commit**

```bash
git revert HEAD
git push origin main
# Render auto-deploys previous version
```

**Option 3: Redeploy Specific Commit**

1. Dashboard → "Manual Deploy"
2. Select specific commit hash
3. Deploy

---

## ✅ Deployment Checklist

### Pre-Deploy

- [x] Code cleaned (no console.log)
- [x] Environment variables verified
- [x] BYPASS_AUTH=false
- [x] BYPASS_EMAIL=false
- [ ] Git pushed to main
- [ ] Database backup (if migrating data)

### During Deploy

- [ ] PostgreSQL database created
- [ ] Web service created
- [ ] Environment variables configured
- [ ] Build successful
- [ ] Service is "Live"

### Post-Deploy

- [ ] Health check passes
- [ ] Can login
- [ ] Dashboard loads
- [ ] Can create project/task
- [ ] Email sending works
- [ ] No errors in logs

### Production Ready

- [ ] Custom domain configured (optional)
- [ ] Monitoring setup (optional)
- [ ] Backup strategy in place
- [ ] Documentation updated
- [ ] Team trained on production URL

---

## 🎉 Success!

Your ProjectFlows application is now live on Render.com!

**Production URL:** `https://projectflows-web.onrender.com`

**Next Steps:**

1. Share URL with team
2. Create user accounts
3. Import/create projects
4. Monitor for issues
5. Collect feedback
6. Iterate and improve

**Support:**

- Render Docs: https://render.com/docs
- Render Community: https://community.render.com
- Next.js Deployment: https://nextjs.org/docs/deployment

---

**Congratulations on deploying to production! 🚀**
