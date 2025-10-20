# ProjectFlow Migration Scripts

This folder contains scripts for migrating data from Google Apps Script (Google Sheets) to PostgreSQL database on render.com.

## Files

- **migrate-data.ts** - Main migration script (21 tables)
- **types.ts** - TypeScript interfaces for export data
- **helpers.ts** - Helper functions for data transformation
- **README.md** - This file

## Prerequisites

Before running the migration, ensure you have:

1. ✅ **migration_data.json** - Exported data from Google Apps Script
   - Place this file in the project root directory
   - Use `export-script.gs` from `migration_plan/scripts/` to create this file

2. ✅ **PostgreSQL Database** - Database on render.com
   - Create a PostgreSQL instance on render.com
   - Copy the External Database URL

3. ✅ **.env file** - Environment variables
   - Copy `.env.example` to `.env`
   - Update `DATABASE_URL` with your render.com connection string

4. ✅ **Node.js & Dependencies** - Installed packages
   ```bash
   npm install
   ```

## Migration Process

### Step 1: Setup Database Connection

1. Go to render.com Dashboard
2. Create a new PostgreSQL database (if not exists)
3. Copy the **External Database URL**
4. Create `.env` file:

```bash
cp .env.example .env
```

5. Edit `.env` and paste your database URL:

```env
DATABASE_URL="postgresql://username:password@hostname.render.com:5432/database_name"
```

### Step 2: Generate Prisma Client

Generate the Prisma client from schema:

```bash
npm run prisma:generate
```

This will create the Prisma client in `src/generated/prisma/`.

### Step 3: Push Database Schema

Push the Prisma schema to your PostgreSQL database:

```bash
npm run prisma:push
```

This will:
- Create all 21 tables
- Add indexes
- Set up foreign key constraints
- Create enums

**Note:** This is a **non-destructive** operation if the database is empty.

### Step 4: Verify Schema

Open Prisma Studio to verify the database structure:

```bash
npm run prisma:studio
```

Browse to `http://localhost:5555` to see your empty tables.

### Step 5: Run Migration

Now run the main migration script:

```bash
npm run migrate
```

**What happens:**
1. Reads `migration_data.json` from project root
2. Validates all data
3. Transforms data (roles, dates, JSON fields)
4. Creates ID mappings (old IDs → new CUIDs)
5. Inserts data in correct order (21 tables)
6. Shows progress and summary

**Expected output:**
```
🚀 ProjectFlow Data Migration v2.0 Starting...

📂 Reading migration data...
✅ Loaded 21 tables
📊 Export version: 2.0
📅 Export date: 2025-10-20T...

📦 Migrating Users...
✅ Migrated 50 users

📦 Migrating Mission Groups...
✅ Migrated 3 mission groups

... (continues for all 21 tables)

========================================
📊 MIGRATION SUMMARY
========================================
✅ Users:              50
✅ Sessions:           10
✅ Mission Groups:     3
✅ Divisions:          8
✅ Departments:        15
✅ Projects:           25
✅ Tasks:              150
✅ Statuses:           40
✅ Comments:           75
✅ Checklists:         45
✅ History:            200
✅ Notifications:      30
✅ Holidays:           12
✅ Hospital Missions:  5
✅ IT Goals:           10
✅ Action Plans:       8
✅ Requests:           20
✅ Config:             15
✅ Permissions:        25
✅ Role Permissions:   60
✅ Phases:             30
========================================
📊 TOTAL RECORDS:      836
⏱️  DURATION:           45.3s
========================================

✅ Migration completed successfully! 🎉
```

### Step 6: Verify Data

After migration, verify the data:

```bash
npm run prisma:studio
```

Check:
- ✅ All tables have data
- ✅ Relationships are correct (foreign keys)
- ✅ User emails match
- ✅ Tasks assigned to correct projects
- ✅ Dates are valid

## Tables Migrated (21 Total)

### Core Tables (9)
1. Users
2. Sessions
3. MissionGroups
4. Divisions
5. Departments
6. Projects
7. Tasks
8. Statuses
9. Notifications

### Additional Tables (12)
10. Comments
11. Checklists
12. History
13. Holidays
14. HospitalMissions
15. ITGoals
16. ActionPlans
17. Requests
18. Config
19. Permissions
20. RolePermissions
21. Phases

## Migration Order

The script migrates tables in this order to respect foreign key dependencies:

```
1. Users (no dependencies)
2. Organization Structure:
   - MissionGroups
   - Divisions (→ MissionGroups)
   - Departments (→ Divisions)
3. Update Users.departmentId (→ Departments)
4. Update org leaders (→ Users)
5. Strategic Planning:
   - HospitalMissions
   - ITGoals (→ HospitalMissions)
   - ActionPlans (→ HospitalMissions)
6. Projects (→ Departments, ActionPlans, Users)
7. Statuses (→ Projects)
8. Tasks (→ Projects, Statuses, Users)
9. Task Details:
   - Comments (→ Tasks, Users)
   - Checklists (→ Tasks, Users)
   - History (→ Tasks, Users)
10. Notifications (→ Users, Tasks)
11. Sessions (→ Users)
12. Phases (→ Projects)
13. Standalone Tables:
    - Holidays
    - Requests (→ Users, Tasks)
    - Config
    - Permissions
    - RolePermissions (→ Permissions)
```

## Troubleshooting

### Error: "Migration file not found"
- Make sure `migration_data.json` exists in project root
- Check the file path in the error message

### Error: "Connection refused"
- Check your `DATABASE_URL` in `.env`
- Make sure render.com database is running
- Verify you're using the **External** connection string (not Internal)

### Error: "Foreign key constraint violation"
- This shouldn't happen if migration runs normally
- If it does, check the migration order in `migrate-data.ts`

### Error: "Duplicate key value"
- Some records may already exist (if re-running)
- Use `npm run prisma:reset` to clear database and start over
- **WARNING:** This will delete ALL data!

### Partial Migration
If migration fails partway through:
1. Check the logs to see which table failed
2. Fix the data in `migration_data.json` if needed
3. Reset database: `npm run prisma:reset`
4. Run migration again: `npm run migrate`

### Performance Issues
- Large datasets (>10,000 records) may take 5-10 minutes
- This is normal due to transaction safety
- Do not interrupt the migration process

## Data Transformations

The migration script performs these transformations:

### Role Mapping
```
GAS → Prisma
"Admin" → "ADMIN"
"Chief" → "CHIEF"
"Leader" → "LEADER"
"Head" → "HEAD"
"Member" → "MEMBER"
"User" → "USER"
```

### Status Type Mapping
```
"Not Started" → "NOT_STARTED"
"In Progress" → "IN_PROGRESS"
"Done" → "DONE"
```

### ID Mapping
- **Old:** Email addresses (for users) or sequential IDs
- **New:** CUIDs (Collision-resistant Unique IDentifiers)
- All foreign keys updated automatically

### Date Parsing
- Handles ISO 8601 strings
- Handles Google Sheets date formats
- Invalid dates → `null`

### JSON Fields
- `User.pinnedTasks` - Array of task IDs
- `User.additionalRoles` - Object with role mappings
- `Comment.mentions` - Array of mentioned user IDs
- `ActionPlan.itGoalIds` - Array of IT Goal IDs

## Next Steps

After successful migration:

1. ✅ Verify data in Prisma Studio
2. ✅ Test database queries
3. ✅ Update connection string for production app
4. ✅ Backup database (render.com dashboard)
5. ➡️ Continue with Next.js app development

## Rollback

If you need to start over:

```bash
# WARNING: This deletes ALL data!
npm run prisma:reset

# Then re-run migration
npm run migrate
```

## Support

For issues or questions:
- Check `migration_plan/01_DATABASE_MIGRATION.md`
- Review Prisma docs: https://www.prisma.io/docs
- render.com PostgreSQL docs: https://render.com/docs/databases

---

**Version:** 2.0
**Last Updated:** 2025-10-20
**Tables:** 21 (Complete Schema)
