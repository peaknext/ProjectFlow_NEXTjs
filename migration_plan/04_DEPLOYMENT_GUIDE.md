# Deployment Guide
## render.com Infrastructure Setup

**Version:** 1.0
**Date:** 2025-10-20

---

## Table of Contents

1. [render.com Overview](#rendercom-overview)
2. [Service Configuration](#service-configuration)
3. [Environment Setup](#environment-setup)
4. [CI/CD Pipeline](#cicd-pipeline)
5. [Monitoring & Logging](#monitoring--logging)
6. [Scaling Strategy](#scaling-strategy)

---

## 1. render.com Overview

### 1.1 Why render.com?

**Advantages:**
- ✅ **Simple deployment:** Git push = auto deploy
- ✅ **Managed PostgreSQL:** Automated backups, scaling
- ✅ **Free SSL:** Automatic HTTPS certificates
- ✅ **Reasonable pricing:** ~$25-50/month for starter
- ✅ **Zero DevOps:** No server management
- ✅ **Good performance:** Fast cold starts vs. serverless

**Pricing (Estimated):**
| Service | Tier | Cost | Specs |
|---------|------|------|-------|
| Web Service | Starter | $7/month | 512 MB RAM, 0.5 CPU |
| PostgreSQL | Starter | $7/month | 256 MB RAM, 1 GB storage |
| **Total** | | **~$14/month** | For initial launch |
| | | | |
| Web Service | Standard | $25/month | 2 GB RAM, 1 CPU |
| PostgreSQL | Standard | $20/month | 1 GB RAM, 10 GB storage |
| Redis (optional) | - | $10/month | 256 MB |
| **Total (Production)** | | **~$55/month** | For 100-500 users |

**Compare to GAS:**
- GAS: Free (with quotas)
- render.com: $14-55/month (no quotas, better performance)

---

## 2. Service Configuration

### 2.1 Web Service (Next.js App)

**render.yaml:**
```yaml
# render.yaml - Infrastructure as Code

services:
  # Next.js Web Service
  - type: web
    name: projectflow-web
    runtime: node
    env: node
    region: singapore # Choose closest to users
    plan: starter # Upgrade to standard for production
    branch: main
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: projectflow-db
          property: connectionString
      - key: NEXTAUTH_SECRET
        generateValue: true
      - key: NEXTAUTH_URL
        value: https://projectflow.onrender.com
    healthCheckPath: /api/health
    autoDeploy: true

  # PostgreSQL Database
databases:
  - name: projectflow-db
    databaseName: projectflow
    user: projectflow_user
    plan: starter # Upgrade to standard for production
    region: singapore
    postgresMajorVersion: 15
```

### 2.2 Environment Variables

Create `.env.production`:

```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/projectflow?schema=public"
DATABASE_POOL_SIZE=10

# NextAuth.js
NEXTAUTH_URL="https://projectflow.onrender.com"
NEXTAUTH_SECRET="<generate-with-openssl-rand-base64-32>"

# App Settings
APP_NAME="ProjectFlow"
APP_URL="https://projectflow.onrender.com"

# Email (for notifications, password reset)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="app-password"
SMTP_FROM="ProjectFlow <noreply@projectflow.com>"

# File Storage (Cloudinary or UploadThing)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Optional: Redis (for caching, rate limiting)
REDIS_URL="redis://user:password@host:6379"

# Optional: Sentry (error tracking)
SENTRY_DSN="https://xxx@sentry.io/xxx"

# Optional: Pusher (realtime)
PUSHER_APP_ID="your-app-id"
PUSHER_KEY="your-key"
PUSHER_SECRET="your-secret"
PUSHER_CLUSTER="ap1"
```

### 2.3 Build Configuration

**package.json scripts:**
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "prisma generate && next build",
    "start": "next start -p $PORT",
    "postinstall": "prisma generate",
    "db:migrate": "prisma migrate deploy",
    "db:seed": "prisma db seed"
  },
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

### 2.4 Health Check Endpoint

```typescript
// src/app/api/health/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected',
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}
```

---

## 3. Environment Setup

### 3.1 Initial Setup Steps

**Step 1: Create render.com Account**
```bash
1. Go to https://render.com
2. Sign up with GitHub account
3. Grant access to your GitHub repository
```

**Step 2: Create PostgreSQL Database**
```bash
1. Dashboard → New → PostgreSQL
2. Name: projectflow-db
3. Region: Singapore (or closest to users)
4. Plan: Starter ($7/month)
5. PostgreSQL Version: 15
6. Click "Create Database"
7. Copy "Internal Database URL" for later
```

**Step 3: Create Web Service**
```bash
1. Dashboard → New → Web Service
2. Connect to GitHub repository
3. Branch: main
4. Runtime: Node
5. Build Command: npm install && npm run build
6. Start Command: npm start
7. Plan: Starter ($7/month)
8. Add environment variables (see section 2.2)
9. Click "Create Web Service"
```

**Step 4: Run Database Migrations**
```bash
# Locally, connect to production DB
export DATABASE_URL="<render-postgres-url>"

# Run migrations
npx prisma migrate deploy

# Seed initial data (admin user, default statuses, etc.)
npx prisma db seed
```

**Step 5: Verify Deployment**
```bash
# Check health endpoint
curl https://projectflow.onrender.com/api/health

# Should return:
{
  "status": "ok",
  "database": "connected"
}
```

### 3.2 Custom Domain Setup (Optional)

**If you have a domain (e.g., projectflow.hospital.go.th):**

```bash
1. Dashboard → projectflow-web → Settings
2. Custom Domain → Add Custom Domain
3. Enter: projectflow.hospital.go.th
4. Add CNAME record to your DNS:
   - Name: projectflow
   - Value: projectflow.onrender.com
5. Wait for SSL certificate (automatic, ~5 minutes)
6. Update NEXTAUTH_URL to new domain
```

---

## 4. CI/CD Pipeline

### 4.1 GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml

name: Deploy to Render

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    name: Run Tests
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run database migrations
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test
        run: npx prisma migrate deploy

      - name: Run tests
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test
        run: npm test

      - name: Build
        run: npm run build

  deploy:
    name: Deploy to Render
    runs-on: ubuntu-latest
    needs: test
    if: github.ref == 'refs/heads/main'

    steps:
      - name: Trigger Render Deploy
        run: |
          curl -X POST ${{ secrets.RENDER_DEPLOY_HOOK_URL }}

      - name: Wait for deployment
        run: sleep 60

      - name: Health check
        run: |
          curl -f https://projectflow.onrender.com/api/health || exit 1
```

### 4.2 Automated Database Backups

```yaml
# .github/workflows/backup.yml

name: Database Backup

on:
  schedule:
    - cron: '0 2 * * *' # Daily at 2 AM UTC
  workflow_dispatch: # Manual trigger

jobs:
  backup:
    runs-on: ubuntu-latest

    steps:
      - name: Backup PostgreSQL
        run: |
          pg_dump ${{ secrets.DATABASE_URL }} > backup-$(date +%Y%m%d).sql

      - name: Upload to GitHub Releases
        uses: actions/upload-artifact@v3
        with:
          name: database-backup
          path: backup-*.sql
          retention-days: 30
```

---

## 5. Monitoring & Logging

### 5.1 render.com Built-in Monitoring

**Available Metrics:**
- CPU usage
- Memory usage
- Response time (P50, P95, P99)
- Error rate
- Request rate

**Accessing Logs:**
```bash
# Via Dashboard
1. Dashboard → projectflow-web → Logs
2. Real-time streaming
3. Filter by keyword
4. Download log archive

# Via CLI (optional)
render logs -s projectflow-web -n 100
```

### 5.2 Sentry Integration (Error Tracking)

```typescript
// src/lib/sentry.ts

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // 10% of transactions
  beforeSend(event, hint) {
    // Filter out non-critical errors
    if (event.level === 'info') return null;
    return event;
  },
});
```

```typescript
// pages/api/error-test.ts (for testing)

export default function handler(req, res) {
  throw new Error('Test error for Sentry');
}
```

### 5.3 Logging Best Practices

```typescript
// src/lib/logger.ts

import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  ...(process.env.NODE_ENV === 'production'
    ? {}
    : {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
          },
        },
      }),
});

// Usage:
logger.info({ userId: user.id }, 'User logged in');
logger.error({ error, taskId }, 'Failed to update task');
```

---

## 6. Scaling Strategy

### 6.1 Horizontal Scaling (More Instances)

**When to scale:**
- CPU usage > 80% consistently
- Response time P95 > 2 seconds
- Concurrent users > 300

**How to scale on render.com:**
```bash
1. Dashboard → projectflow-web → Settings
2. Scaling → Increase instance count
3. Recommended: 2-3 instances for 500+ users
4. Cost: $7/instance (Starter) or $25/instance (Standard)
```

### 6.2 Vertical Scaling (Bigger Instances)

**Plan Comparison:**
| Plan | RAM | CPU | Cost | Recommended For |
|------|-----|-----|------|-----------------|
| Starter | 512 MB | 0.5 | $7/mo | < 50 users |
| Standard | 2 GB | 1 | $25/mo | 50-300 users |
| Pro | 4 GB | 2 | $85/mo | 300-1000 users |

### 6.3 Database Scaling

**When to scale:**
- Storage > 80% capacity
- Connection pool exhausted
- Query time > 500ms consistently

**How to scale:**
```bash
1. Dashboard → projectflow-db → Settings
2. Upgrade plan:
   - Starter: 1 GB storage, 25 connections
   - Standard: 10 GB storage, 100 connections
   - Pro: 100 GB storage, 200 connections
```

### 6.4 Caching Strategy (Redis)

**Add Redis for:**
- Session storage (reduce DB queries)
- API response caching
- Rate limiting

```typescript
// src/lib/redis.ts

import { Redis } from 'ioredis';

export const redis = new Redis(process.env.REDIS_URL);

// Cache API response
export async function getCached<T>(
  key: string,
  ttl: number,
  fetchFn: () => Promise<T>
): Promise<T> {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);

  const data = await fetchFn();
  await redis.setex(key, ttl, JSON.stringify(data));
  return data;
}

// Usage:
const projects = await getCached(
  `user:${userId}:projects`,
  300, // 5 minutes
  () => prisma.project.findMany({ where: { ... } })
);
```

---

## 7. Disaster Recovery

### 7.1 Backup Strategy

**Automated Backups (render.com):**
- Daily backups (last 7 days)
- Point-in-time recovery (Standard plan and above)

**Manual Backups:**
```bash
# Export database
pg_dump $DATABASE_URL > backup.sql

# Import to local
psql local_db < backup.sql
```

### 7.2 Rollback Plan

**If deployment breaks:**

```bash
1. Dashboard → projectflow-web → Events
2. Find last successful deploy
3. Click "Redeploy" on that commit
4. Wait 3-5 minutes for rollback
```

**Via Git:**
```bash
# Revert to previous commit
git revert HEAD
git push origin main

# render.com will auto-deploy the revert
```

---

## 8. Cost Optimization

### 8.1 Cost Breakdown (Estimated)

**Initial Launch (< 50 users):**
```
Web Service (Starter):        $7/month
PostgreSQL (Starter):         $7/month
SSL Certificate:              FREE
---
Total:                       $14/month
```

**Production (100-500 users):**
```
Web Service (Standard):      $25/month
PostgreSQL (Standard):       $20/month
Redis (optional):            $10/month
---
Total:                       $55/month
```

### 8.2 Free Tier Consideration

**render.com Free Tier:**
- 750 hours/month free (1 service = 24/7 = 720 hours)
- Auto-sleep after 15 minutes inactivity
- Cold start delay ~30 seconds

**Recommendation:**
- ❌ **Don't use free tier for production** (cold starts = bad UX)
- ✅ **Use for staging/testing** environments

---

## 9. Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] Health check endpoint working
- [ ] Error tracking configured (Sentry)

### Initial Deployment
- [ ] Create PostgreSQL database on render.com
- [ ] Create web service on render.com
- [ ] Configure environment variables
- [ ] Run database migrations
- [ ] Seed initial data (admin user, etc.)
- [ ] Verify health check

### Post-Deployment
- [ ] Test login functionality
- [ ] Test create/update/delete operations
- [ ] Check logs for errors
- [ ] Monitor performance metrics
- [ ] Setup custom domain (if applicable)
- [ ] Configure automated backups

### Production Readiness
- [ ] Load testing completed
- [ ] Security audit passed
- [ ] SSL certificate active
- [ ] Monitoring alerts configured
- [ ] Rollback plan documented
- [ ] User documentation updated

---

**Document Status:** ✅ DRAFT
**Next:** [05_TESTING_STRATEGY.md](./05_TESTING_STRATEGY.md)
