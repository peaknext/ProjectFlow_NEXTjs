# Database Migration Plan

## Google Sheets → PostgreSQL

**Version:** 1.0
**Date:** 2025-10-20
**Dependencies:** 00_MIGRATION_OVERVIEW.md

---

## Table of Contents

1. [Schema Mapping](#schema-mapping)
2. [Prisma Schema Design](#prisma-schema-design)
3. [Data Types Mapping](#data-types-mapping)
4. [Migration Scripts](#migration-scripts)
5. [Data Integrity Checks](#data-integrity-checks)
6. [Indexes and Performance](#indexes-and-performance)

---

## 1. Schema Mapping

### 1.1 Current Google Sheets Schema

**From Code.gs (lines 25-150):**

```javascript
const SCHEMA = {
  USERS: {
    NAME: "Users",
    USER_ID: 1, // Email (PRIMARY KEY)
    FULL_NAME: 2,
    PASSWORD_HASH: 3,
    SALT: 4,
    ROLE: 5, // Admin, Chief, Leader, Head, Member, User
    PROFILE_IMAGE_URL: 6,
    DEPARTMENT_ID: 7, // FK to Departments
    IS_VERIFIED: 8,
    VERIFICATION_TOKEN: 9,
    RESET_TOKEN: 10,
    RESET_TOKEN_EXPIRY: 11,
    USER_STATUS: 12, // Active, Suspended
    USER_JOB_TITLE: 13,
    USER_JOB_LEVEL: 14,
    PINNED_TASKS: 15, // JSON array of task IDs
    ADDITIONAL_ROLE: 16, // JSON object: {"Role1": "BranchId1", ...}
  },

  USER_SESSIONS: {
    NAME: "UserSessions",
    SESSION_TOKEN: 1, // PRIMARY KEY
    USER_ID: 2, // FK to Users
    EXPIRY_TIMESTAMP: 3,
  },

  MISSION_GROUPS: {
    NAME: "MissionGroups",
    ID: 1, // Generated unique ID (PRIMARY KEY)
    NAME_COL: 2,
    CHIEF_USER_ID: 3, // FK to Users
  },

  DIVISIONS: {
    NAME: "Divisions",
    ID: 1, // PRIMARY KEY
    NAME_COL: 2,
    MISSION_GROUP_ID: 3, // FK to MissionGroups
    LEADER_USER_ID: 4, // FK to Users
  },

  DEPARTMENTS: {
    NAME: "Departments",
    ID: 1, // PRIMARY KEY
    NAME_COL: 2,
    DIVISION_ID: 3, // FK to Divisions
    HEAD_USER_ID: 4, // FK to Users
    DEPARTMENT_TEL: 5,
  },

  PROJECTS: {
    NAME: "Projects",
    ID: 1, // PRIMARY KEY
    NAME_COL: 2,
    DESCRIPTION: 3,
    DEPARTMENT_ID: 4, // FK to Departments
    START_DATE: 5,
    END_DATE: 6,
    STATUS: 7, // Active, Completed, On Hold
    COLOR: 8,
    OWNER_USER_ID: 9, // FK to Users
    DATE_CREATED: 10,
    CREATOR_USER_ID: 11, // FK to Users
  },

  TASKS: {
    NAME: "Tasks",
    ID: 1, // PRIMARY KEY
    NAME_COL: 2,
    PROJECT_ID: 3, // FK to Projects
    DESCRIPTION: 4,
    ASSIGNEE_USER_ID: 5, // FK to Users
    STATUS_ID: 6, // FK to Statuses
    PRIORITY: 7, // 1-4
    START_DATE: 8,
    DUE_DATE: 9,
    PARENT_TASK_ID: 10, // FK to Tasks (self-reference)
    DATE_CREATED: 11,
    CREATOR_USER_ID: 12, // FK to Users
    CLOSE_DATE: 13,
    DIFFICULTY: 14, // 1-5
    IS_CLOSED: 15, // Boolean
    CLOSE_TYPE: 16, // "Completed", "Aborted"
    USER_CLOSED_ID: 17, // FK to Users
  },

  STATUSES: {
    NAME: "Statuses",
    ID: 1, // PRIMARY KEY
    NAME_COL: 2,
    COLOR: 3,
    ORDER: 4,
    TYPE: 5, // "Not Started", "In Progress", "Done"
    PROJECT_ID: 6, // FK to Projects
  },

  TASK_COMMENTS: {
    NAME: "TaskComments",
    ID: 1, // PRIMARY KEY
    TASK_ID: 2, // FK to Tasks
    USER_ID: 3, // FK to Users
    COMMENT_TEXT: 4,
    DATE_CREATED: 5,
  },

  ATTACHMENTS: {
    NAME: "Attachments",
    ID: 1, // PRIMARY KEY
    TASK_ID: 2, // FK to Tasks
    FILE_NAME: 3,
    FILE_URL: 4,
    FILE_SIZE: 5,
    UPLOADED_BY: 6, // FK to Users
    DATE_UPLOADED: 7,
  },

  TAGS: {
    NAME: "Tags",
    ID: 1, // PRIMARY KEY
    NAME_COL: 2,
    COLOR: 3,
  },

  TASK_TAGS: {
    NAME: "TaskTags",
    ID: 1, // PRIMARY KEY
    TASK_ID: 2, // FK to Tasks
    TAG_ID: 3, // FK to Tags
  },

  ACTIVITY_LOGS: {
    NAME: "ActivityLogs",
    ID: 1, // PRIMARY KEY
    USER_ID: 2, // FK to Users
    ACTION_TYPE: 3, // "CREATE", "UPDATE", "DELETE"
    ENTITY_TYPE: 4, // "Task", "Project", "User"
    ENTITY_ID: 5,
    CHANGES: 6, // JSON object
    DATE_CREATED: 7,
  },

  NOTIFICATIONS: {
    NAME: "Notifications",
    ID: 1, // PRIMARY KEY
    USER_ID: 2, // FK to Users
    TYPE: 3, // "task_assigned", "comment_mention", etc.
    TITLE: 4,
    MESSAGE: 5,
    LINK: 6,
    IS_READ: 7, // Boolean
    DATE_CREATED: 8,
  },

  // ============================================
  // NEW TABLES (Added during analysis)
  // ============================================

  CHECKLIST_ITEMS: {
    NAME: "ChecklistItems",
    ID: 1, // PRIMARY KEY
    TASK_ID: 2, // FK to Tasks
    NAME_COL: 3,
    IS_CHECKED: 4, // Boolean
    ORDER: 5, // Display order
    CREATOR_USER_ID: 6, // FK to Users
    DATE_CREATED: 7,
  },

  PHASES: {
    NAME: "Phases",
    ID: 1, // PRIMARY KEY
    NAME_COL: 2,
    PROJECT_ID: 3, // FK to Projects
    START_DATE: 4,
    END_DATE: 5,
    ORDER: 6,
    DESCRIPTION: 7,
    DATE_CREATED: 8,
  },

  HOSPITAL_MISSIONS: {
    NAME: "HospitalMissions",
    ID: 1, // PRIMARY KEY
    NAME_COL: 2,
    DESCRIPTION: 3,
    YEAR: 4,
    ORDER: 5,
  },

  IT_GOALS: {
    NAME: "ITGoals",
    ID: 1, // PRIMARY KEY
    NAME_COL: 2,
    HOSPITAL_MISSION_ID: 3, // FK to HospitalMissions
    DESCRIPTION: 4,
    ORDER: 5,
  },

  ACTION_PLANS: {
    NAME: "ActionPlans",
    ID: 1, // PRIMARY KEY
    NAME_COL: 2,
    IT_GOAL_ID: 3, // FK to ITGoals
    DESCRIPTION: 4,
    ORDER: 5,
  },
};
```

**Note:** เพิ่ม 5 ตารางใหม่จากการวิเคราะห์โค้ดเดิม:

- ChecklistItems - รายการ checklist ในงาน (ใช้โดย addChecklistItem(), updateChecklistItemAndRecordHistory())
- Phases - ระยะของโปรเจกต์ (ใช้โดย createPhase(), createPhasesBatch())
- HospitalMissions - พันธกิจโรงพยาบาล (ใช้โดย getHospMissions())
- ITGoals - เป้าหมาย IT (ใช้โดย getITGoals())
- ActionPlans - แผนปฏิบัติการ (ใช้โดย getActionPlans())

### 1.2 Enhanced PostgreSQL Schema

We'll improve the schema with:

- Proper data types (not just TEXT)
- Indexes for performance
- Foreign key constraints with CASCADE rules
- Timestamps (created_at, updated_at)
- Soft deletes (deleted_at)
- UUID for IDs (more secure than sequential integers)

---

## 2. Prisma Schema Design

### 2.1 Complete Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// USERS & AUTHENTICATION
// ============================================

model User {
  id                String    @id @default(cuid())
  email             String    @unique
  fullName          String
  passwordHash      String
  salt              String
  role              UserRole  @default(USER)
  profileImageUrl   String?
  departmentId      String?
  isVerified        Boolean   @default(false)
  verificationToken String?   @unique
  resetToken        String?   @unique
  resetTokenExpiry  DateTime?
  userStatus        UserStatus @default(ACTIVE)
  jobTitle          String?
  jobLevel          String?
  pinnedTasks       Json?     // Array of task IDs
  additionalRoles   Json?     // {"Role1": "BranchId1"}
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  deletedAt         DateTime? // Soft delete

  // Relations
  department            Department?         @relation("UserDepartment", fields: [departmentId], references: [id])
  sessions              Session[]
  createdTasks          Task[]              @relation("TaskCreator")
  assignedTasks         Task[]              @relation("TaskAssignee")
  closedTasks           Task[]              @relation("TaskCloser")
  comments              TaskComment[]
  attachments           Attachment[]
  activityLogs          ActivityLog[]
  notifications         Notification[]
  createdProjects       Project[]           @relation("ProjectCreator")
  ownedProjects         Project[]           @relation("ProjectOwner")
  ledDivisions          Division[]          @relation("DivisionLeader")
  headedDepartments     Department[]        @relation("DepartmentHead")
  chiefMissionGroups    MissionGroup[]      @relation("MissionGroupChief")
  createdChecklists     ChecklistItem[]     @relation("ChecklistCreator")

  @@index([email])
  @@index([departmentId])
  @@index([role])
  @@index([userStatus])
  @@map("users")
}

enum UserRole {
  ADMIN
  CHIEF
  LEADER
  HEAD
  MEMBER
  USER
}

enum UserStatus {
  ACTIVE
  SUSPENDED
  INACTIVE
}

model Session {
  id             String   @id @default(cuid())
  sessionToken   String   @unique
  userId         String
  expiresAt      DateTime
  createdAt      DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([sessionToken])
  @@index([expiresAt])
  @@map("sessions")
}

// ============================================
// ORGANIZATION STRUCTURE
// ============================================

model MissionGroup {
  id            String    @id @default(cuid())
  name          String
  chiefUserId   String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  deletedAt     DateTime?

  chief     User?      @relation("MissionGroupChief", fields: [chiefUserId], references: [id])
  divisions Division[]

  @@index([chiefUserId])
  @@map("mission_groups")
}

model Division {
  id              String    @id @default(cuid())
  name            String
  missionGroupId  String
  leaderUserId    String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  deletedAt       DateTime?

  missionGroup MissionGroup @relation(fields: [missionGroupId], references: [id], onDelete: Cascade)
  leader       User?        @relation("DivisionLeader", fields: [leaderUserId], references: [id])
  departments  Department[]

  @@index([missionGroupId])
  @@index([leaderUserId])
  @@map("divisions")
}

model Department {
  id          String    @id @default(cuid())
  name        String
  divisionId  String
  headUserId  String?
  tel         String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deletedAt   DateTime?

  division Division  @relation(fields: [divisionId], references: [id], onDelete: Cascade)
  head     User?     @relation("DepartmentHead", fields: [headUserId], references: [id])
  projects Project[]
  users    User[]    @relation("UserDepartment")

  @@index([divisionId])
  @@index([headUserId])
  @@map("departments")
}

// ============================================
// PROJECTS & TASKS
// ============================================

model Project {
  id            String        @id @default(cuid())
  name          String
  description   String?
  departmentId  String
  actionPlanId  String?       // NEW: Link to ActionPlan
  startDate     DateTime?
  endDate       DateTime?
  status        ProjectStatus @default(ACTIVE)
  color         String?
  ownerUserId   String
  creatorUserId String
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  deletedAt     DateTime?

  department Department  @relation(fields: [departmentId], references: [id], onDelete: Cascade)
  owner      User        @relation("ProjectOwner", fields: [ownerUserId], references: [id])
  creator    User        @relation("ProjectCreator", fields: [creatorUserId], references: [id])
  actionPlan ActionPlan? @relation("ProjectActionPlan", fields: [actionPlanId], references: [id])
  tasks      Task[]
  statuses   Status[]
  phases     Phase[]     @relation("ProjectPhases")

  @@index([departmentId])
  @@index([ownerUserId])
  @@index([actionPlanId])
  @@index([status])
  @@map("projects")
}

enum ProjectStatus {
  ACTIVE
  COMPLETED
  ON_HOLD
  ARCHIVED
}

model Status {
  id        String     @id @default(cuid())
  name      String
  color     String
  order     Int
  type      StatusType
  projectId String
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  tasks   Task[]

  @@unique([projectId, name]) // Unique status names per project
  @@index([projectId])
  @@map("statuses")
}

enum StatusType {
  NOT_STARTED
  IN_PROGRESS
  DONE
}

model Task {
  id              String    @id @default(cuid())
  name            String
  projectId       String
  description     String?
  assigneeUserId  String?
  statusId        String
  priority        Int       @default(3) // 1-4
  startDate       DateTime?
  dueDate         DateTime?
  parentTaskId    String?
  creatorUserId   String
  closeDate       DateTime?
  difficulty      Int?      // 1-5
  isClosed        Boolean   @default(false)
  closeType       CloseType?
  userClosedId    String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  deletedAt       DateTime?

  project       Project         @relation(fields: [projectId], references: [id], onDelete: Cascade)
  assignee      User?           @relation("TaskAssignee", fields: [assigneeUserId], references: [id])
  status        Status          @relation(fields: [statusId], references: [id])
  creator       User            @relation("TaskCreator", fields: [creatorUserId], references: [id])
  closedBy      User?           @relation("TaskCloser", fields: [userClosedId], references: [id])
  parentTask    Task?           @relation("SubTasks", fields: [parentTaskId], references: [id])
  subtasks      Task[]          @relation("SubTasks")
  comments      TaskComment[]
  attachments   Attachment[]
  tags          TaskTag[]
  activityLogs  ActivityLog[]
  checklistItems ChecklistItem[] @relation("TaskChecklists")

  @@index([projectId])
  @@index([assigneeUserId])
  @@index([statusId])
  @@index([priority])
  @@index([dueDate])
  @@index([isClosed])
  @@index([parentTaskId])
  @@map("tasks")
}

enum CloseType {
  COMPLETED
  ABORTED
}

model TaskComment {
  id        String   @id @default(cuid())
  taskId    String
  userId    String
  text      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?

  task Task @relation(fields: [taskId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id])

  @@index([taskId])
  @@index([userId])
  @@map("task_comments")
}

model Attachment {
  id         String   @id @default(cuid())
  taskId     String
  fileName   String
  fileUrl    String
  fileSize   Int?
  uploadedBy String
  createdAt  DateTime @default(now())
  deletedAt  DateTime?

  task   Task @relation(fields: [taskId], references: [id], onDelete: Cascade)
  uploader User @relation(fields: [uploadedBy], references: [id])

  @@index([taskId])
  @@map("attachments")
}

model Tag {
  id        String    @id @default(cuid())
  name      String    @unique
  color     String?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  tasks TaskTag[]

  @@map("tags")
}

model TaskTag {
  id        String   @id @default(cuid())
  taskId    String
  tagId     String
  createdAt DateTime @default(now())

  task Task @relation(fields: [taskId], references: [id], onDelete: Cascade)
  tag  Tag  @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@unique([taskId, tagId])
  @@index([taskId])
  @@index([tagId])
  @@map("task_tags")
}

// ============================================
// ACTIVITY & NOTIFICATIONS
// ============================================

model ActivityLog {
  id         String         @id @default(cuid())
  userId     String
  actionType ActivityAction
  entityType String // "Task", "Project", "User", etc.
  entityId   String
  changes    Json? // Store before/after values
  createdAt  DateTime       @default(now())

  user User  @relation(fields: [userId], references: [id])
  task Task? @relation(fields: [entityId], references: [id])

  @@index([userId])
  @@index([entityType, entityId])
  @@index([createdAt])
  @@map("activity_logs")
}

enum ActivityAction {
  CREATE
  UPDATE
  DELETE
  CLOSE
  REOPEN
  ASSIGN
  COMMENT
}

model Notification {
  id        String           @id @default(cuid())
  userId    String
  type      NotificationType
  title     String
  message   String?
  link      String?
  isRead    Boolean          @default(false)
  createdAt DateTime         @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([isRead])
  @@index([createdAt])
  @@map("notifications")
}

enum NotificationType {
  TASK_ASSIGNED
  TASK_UPDATED
  TASK_CLOSED
  COMMENT_MENTION
  PROJECT_UPDATED
  DEADLINE_APPROACHING
  OVERDUE_TASK
  SYSTEM_ANNOUNCEMENT
}

// ============================================
// CHECKLISTS & PHASES (NEW - Added 2025-10-20)
// ============================================

model ChecklistItem {
  id            String   @id @default(cuid())
  taskId        String
  name          String
  isChecked     Boolean  @default(false)
  order         Int
  creatorUserId String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  deletedAt     DateTime?

  task    Task @relation("TaskChecklists", fields: [taskId], references: [id], onDelete: Cascade)
  creator User @relation("ChecklistCreator", fields: [creatorUserId], references: [id])

  @@index([taskId])
  @@index([creatorUserId])
  @@map("checklist_items")
}

model Phase {
  id          String   @id @default(cuid())
  name        String
  projectId   String
  startDate   DateTime?
  endDate     DateTime?
  order       Int
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  deletedAt   DateTime?

  project Project @relation("ProjectPhases", fields: [projectId], references: [id], onDelete: Cascade)

  @@index([projectId])
  @@map("phases")
}

// ============================================
// ORGANIZATIONAL PLANNING (NEW - Added 2025-10-20)
// ============================================

model HospitalMission {
  id          String   @id @default(cuid())
  name        String
  description String?
  year        Int?
  order       Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  deletedAt   DateTime?

  itGoals ITGoal[]

  @@map("hospital_missions")
}

model ITGoal {
  id                 String   @id @default(cuid())
  name               String
  hospitalMissionId  String
  description        String?
  order              Int      @default(0)
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
  deletedAt          DateTime?

  hospitalMission HospitalMission @relation(fields: [hospitalMissionId], references: [id], onDelete: Cascade)
  actionPlans     ActionPlan[]

  @@index([hospitalMissionId])
  @@map("it_goals")
}

model ActionPlan {
  id          String   @id @default(cuid())
  name        String
  itGoalId    String
  description String?
  order       Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  deletedAt   DateTime?

  itGoal   ITGoal    @relation(fields: [itGoalId], references: [id], onDelete: Cascade)
  projects Project[] @relation("ProjectActionPlan")

  @@index([itGoalId])
  @@map("action_plans")
}
```

**Note:** เพิ่ม 5 ตารางใหม่:

1. **ChecklistItem** - รายการ checklist ใน tasks (แยกจาก subtasks)
2. **Phase** - ระยะของโปรเจกต์
3. **HospitalMission** - พันธกิจโรงพยาบาล
4. **ITGoal** - เป้าหมาย IT ที่เชื่อมโยงกับพันธกิจ
5. **ActionPlan** - แผนปฏิบัติการที่เชื่อมโยงกับเป้าหมาย IT และโปรเจกต์

---

## 3. Data Types Mapping

### 3.1 Google Sheets → PostgreSQL Type Mapping

| Google Sheets  | GAS Type | PostgreSQL | Prisma Type                 | Notes                        |
| -------------- | -------- | ---------- | --------------------------- | ---------------------------- |
| Text           | String   | TEXT       | String                      | General text fields          |
| Number         | Number   | INTEGER    | Int                         | Counters, IDs, priority      |
| Date           | Date     | TIMESTAMP  | DateTime                    | All date/time fields         |
| Boolean        | Boolean  | BOOLEAN    | Boolean                     | TRUE/FALSE flags             |
| JSON (as text) | String   | JSONB      | Json                        | pinnedTasks, additionalRoles |
| Email          | String   | TEXT       | String @unique              | With validation              |
| ID (generated) | String   | TEXT       | String @id @default(cuid()) | Using CUID instead of UUID   |

### 3.2 Special Field Transformations

#### User.pinnedTasks

```javascript
// GAS (Google Sheets): Stored as JSON string in one cell
"[\"task123\", \"task456\", \"task789\"]"

// PostgreSQL: JSONB array
["task123", "task456", "task789"]

// Prisma Type
pinnedTasks Json?
```

#### User.additionalRoles

```javascript
// GAS: JSON string
"{\"Leader\":\"DEPT001\", \"Head\":\"DEPT002\"}"

// PostgreSQL: JSONB object
{"Leader": "DEPT001", "Head": "DEPT002"}

// Prisma Type
additionalRoles Json?
```

#### Task.priority

```javascript
// GAS: Number 1-4 (stored as string in Sheets)
"3"

// PostgreSQL: INTEGER with constraint
3

// Prisma Type
priority Int @default(3)

// Add constraint in migration:
@CHECK(priority >= 1 AND priority <= 4)
```

---

## 4. Migration Scripts

### 4.1 Export Script (Google Apps Script)

```javascript
// Code.gs - Add this function

/**
 * Export all data to JSON for migration to PostgreSQL
 * @returns {string} JSON string of all data
 */
function exportAllDataForMigration() {
  const data = {
    users: exportUsers(),
    sessions: exportSessions(),
    missionGroups: exportMissionGroups(),
    divisions: exportDivisions(),
    departments: exportDepartments(),
    projects: exportProjects(),
    statuses: exportStatuses(),
    tasks: exportTasks(),
    taskComments: exportTaskComments(),
    attachments: exportAttachments(),
    tags: exportTags(),
    taskTags: exportTaskTags(),
    activityLogs: exportActivityLogs(),
    notifications: exportNotifications(),
    // NEW: Added during migration plan update
    checklistItems: exportChecklistItems(),
    phases: exportPhases(),
    hospitalMissions: exportHospitalMissions(),
    itGoals: exportITGoals(),
    actionPlans: exportActionPlans(),
  };

  return JSON.stringify(data, null, 2);
}

function exportUsers() {
  const sheet = ss.getSheetByName(SCHEMA.USERS.NAME);
  const data = sheet.getDataRange().getValues();

  // Skip header row
  return data
    .slice(1)
    .map((row, index) => ({
      // Keep original IDs for data integrity
      originalRowNumber: index + 2,

      email: row[SCHEMA.USERS.USER_ID - 1],
      fullName: row[SCHEMA.USERS.FULL_NAME - 1],
      passwordHash: row[SCHEMA.USERS.PASSWORD_HASH - 1],
      salt: row[SCHEMA.USERS.SALT - 1],
      role: row[SCHEMA.USERS.ROLE - 1],
      profileImageUrl: row[SCHEMA.USERS.PROFILE_IMAGE_URL - 1],
      departmentId: row[SCHEMA.USERS.DEPARTMENT_ID - 1],
      isVerified:
        row[SCHEMA.USERS.IS_VERIFIED - 1] === true ||
        row[SCHEMA.USERS.IS_VERIFIED - 1] === "TRUE",
      verificationToken: row[SCHEMA.USERS.VERIFICATION_TOKEN - 1],
      resetToken: row[SCHEMA.USERS.RESET_TOKEN - 1],
      resetTokenExpiry: row[SCHEMA.USERS.RESET_TOKEN_EXPIRY - 1],
      userStatus: row[SCHEMA.USERS.USER_STATUS - 1] || "Active",
      jobTitle: row[SCHEMA.USERS.USER_JOB_TITLE - 1],
      jobLevel: row[SCHEMA.USERS.USER_JOB_LEVEL - 1],
      pinnedTasks: parseJSONField(row[SCHEMA.USERS.PINNED_TASKS - 1]),
      additionalRoles: parseJSONField(row[SCHEMA.USERS.ADDITIONAL_ROLE - 1]),
    }))
    .filter((user) => user.email); // Remove empty rows
}

function exportTasks() {
  const sheet = ss.getSheetByName(SCHEMA.TASKS.NAME);
  const data = sheet.getDataRange().getValues();

  return data
    .slice(1)
    .map((row, index) => ({
      originalId: row[SCHEMA.TASKS.ID - 1], // Keep original ID
      originalRowNumber: index + 2,

      name: row[SCHEMA.TASKS.NAME_COL - 1],
      projectId: row[SCHEMA.TASKS.PROJECT_ID - 1],
      description: row[SCHEMA.TASKS.DESCRIPTION - 1],
      assigneeUserId: row[SCHEMA.TASKS.ASSIGNEE_USER_ID - 1],
      statusId: row[SCHEMA.TASKS.STATUS_ID - 1],
      priority: parseInt(row[SCHEMA.TASKS.PRIORITY - 1]) || 3,
      startDate: row[SCHEMA.TASKS.START_DATE - 1],
      dueDate: row[SCHEMA.TASKS.DUE_DATE - 1],
      parentTaskId: row[SCHEMA.TASKS.PARENT_TASK_ID - 1],
      dateCreated: row[SCHEMA.TASKS.DATE_CREATED - 1],
      creatorUserId: row[SCHEMA.TASKS.CREATOR_USER_ID - 1],
      closeDate: row[SCHEMA.TASKS.CLOSE_DATE - 1],
      difficulty: parseInt(row[SCHEMA.TASKS.DIFFICULTY - 1]) || null,
      isClosed:
        row[SCHEMA.TASKS.IS_CLOSED - 1] === true ||
        row[SCHEMA.TASKS.IS_CLOSED - 1] === "TRUE",
      closeType: row[SCHEMA.TASKS.CLOSE_TYPE - 1],
      userClosedId: row[SCHEMA.TASKS.USER_CLOSED_ID - 1],
    }))
    .filter((task) => task.originalId); // Remove empty rows
}

// Helper function
function parseJSONField(value) {
  if (!value || value === "") return null;
  try {
    return JSON.parse(value);
  } catch (e) {
    Logger.log("JSON parse error: " + e + ", value: " + value);
    return null;
  }
}

// Similar export functions for other tables...
// exportProjects(), exportStatuses(), exportComments(), etc.

// ============================================
// NEW EXPORT FUNCTIONS (Added 2025-10-20)
// ============================================

function exportChecklistItems() {
  const sheet = ss.getSheetByName(SCHEMA.CHECKLIST_ITEMS.NAME);
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  return data.slice(1).map((row, index) => ({
    originalRowNumber: index + 2,
    id: row[SCHEMA.CHECKLIST_ITEMS.ID - 1],
    taskId: row[SCHEMA.CHECKLIST_ITEMS.TASK_ID - 1],
    name: row[SCHEMA.CHECKLIST_ITEMS.NAME_COL - 1],
    isChecked:
      row[SCHEMA.CHECKLIST_ITEMS.IS_CHECKED - 1] === true ||
      row[SCHEMA.CHECKLIST_ITEMS.IS_CHECKED - 1] === "TRUE",
    order: parseInt(row[SCHEMA.CHECKLIST_ITEMS.ORDER - 1]) || 0,
    creatorUserId: row[SCHEMA.CHECKLIST_ITEMS.CREATOR_USER_ID - 1],
    dateCreated: row[SCHEMA.CHECKLIST_ITEMS.DATE_CREATED - 1],
  }));
}

function exportPhases() {
  const sheet = ss.getSheetByName(SCHEMA.PHASES.NAME);
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  return data.slice(1).map((row, index) => ({
    originalRowNumber: index + 2,
    id: row[SCHEMA.PHASES.ID - 1],
    name: row[SCHEMA.PHASES.NAME_COL - 1],
    projectId: row[SCHEMA.PHASES.PROJECT_ID - 1],
    startDate: row[SCHEMA.PHASES.START_DATE - 1],
    endDate: row[SCHEMA.PHASES.END_DATE - 1],
    order: parseInt(row[SCHEMA.PHASES.ORDER - 1]) || 0,
    description: row[SCHEMA.PHASES.DESCRIPTION - 1],
    dateCreated: row[SCHEMA.PHASES.DATE_CREATED - 1],
  }));
}

function exportHospitalMissions() {
  const sheet = ss.getSheetByName(SCHEMA.HOSPITAL_MISSIONS.NAME);
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  return data.slice(1).map((row, index) => ({
    originalRowNumber: index + 2,
    id: row[SCHEMA.HOSPITAL_MISSIONS.ID - 1],
    name: row[SCHEMA.HOSPITAL_MISSIONS.NAME_COL - 1],
    description: row[SCHEMA.HOSPITAL_MISSIONS.DESCRIPTION - 1],
    year: parseInt(row[SCHEMA.HOSPITAL_MISSIONS.YEAR - 1]) || null,
    order: parseInt(row[SCHEMA.HOSPITAL_MISSIONS.ORDER - 1]) || 0,
  }));
}

function exportITGoals() {
  const sheet = ss.getSheetByName(SCHEMA.IT_GOALS.NAME);
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  return data.slice(1).map((row, index) => ({
    originalRowNumber: index + 2,
    id: row[SCHEMA.IT_GOALS.ID - 1],
    name: row[SCHEMA.IT_GOALS.NAME_COL - 1],
    hospitalMissionId: row[SCHEMA.IT_GOALS.HOSPITAL_MISSION_ID - 1],
    description: row[SCHEMA.IT_GOALS.DESCRIPTION - 1],
    order: parseInt(row[SCHEMA.IT_GOALS.ORDER - 1]) || 0,
  }));
}

function exportActionPlans() {
  const sheet = ss.getSheetByName(SCHEMA.ACTION_PLANS.NAME);
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  return data.slice(1).map((row, index) => ({
    originalRowNumber: index + 2,
    id: row[SCHEMA.ACTION_PLANS.ID - 1],
    name: row[SCHEMA.ACTION_PLANS.NAME_COL - 1],
    itGoalId: row[SCHEMA.ACTION_PLANS.IT_GOAL_ID - 1],
    description: row[SCHEMA.ACTION_PLANS.DESCRIPTION - 1],
    order: parseInt(row[SCHEMA.ACTION_PLANS.ORDER - 1]) || 0,
  }));
}
```

### 4.2 Transform & Import Script (Node.js/TypeScript)

```typescript
// scripts/migrate-data.ts

import { PrismaClient } from "@prisma/client";
import fs from "fs";
import { z } from "zod";

const prisma = new PrismaClient();

// Validation schemas
const UserSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(1),
  passwordHash: z.string().min(1),
  salt: z.string().min(1),
  role: z.enum(["Admin", "Chief", "Leader", "Head", "Member", "User"]),
  profileImageUrl: z.string().url().nullable().optional(),
  departmentId: z.string().nullable().optional(),
  isVerified: z.boolean(),
  userStatus: z.string().default("Active"),
  jobTitle: z.string().nullable().optional(),
  jobLevel: z.string().nullable().optional(),
  pinnedTasks: z.any(), // JSON
  additionalRoles: z.any(), // JSON
});

async function main() {
  console.log("🚀 Starting data migration...\n");

  // Read exported data
  const rawData = fs.readFileSync("./migration_data.json", "utf-8");
  const data = JSON.parse(rawData);

  // Create ID mapping (old ID → new ID)
  const idMaps = {
    users: new Map<string, string>(),
    projects: new Map<string, string>(),
    tasks: new Map<string, string>(),
    statuses: new Map<string, string>(),
    departments: new Map<string, string>(),
    divisions: new Map<string, string>(),
    missionGroups: new Map<string, string>(),
    // NEW: Added during migration plan update
    hospitalMissions: new Map<string, string>(),
    itGoals: new Map<string, string>(),
    actionPlans: new Map<string, string>(),
    phases: new Map<string, string>(),
    checklistItems: new Map<string, string>(),
  };

  try {
    await prisma.$transaction(async (tx) => {
      console.log("📦 Migrating Users...");
      for (const user of data.users) {
        // Validate
        const validated = UserSchema.parse(user);

        // Transform role enum
        const role = mapUserRole(validated.role);

        const created = await tx.user.create({
          data: {
            email: validated.email,
            fullName: validated.fullName,
            passwordHash: validated.passwordHash,
            salt: validated.salt,
            role: role,
            profileImageUrl: validated.profileImageUrl || null,
            isVerified: validated.isVerified,
            userStatus: mapUserStatus(validated.userStatus),
            jobTitle: validated.jobTitle || null,
            jobLevel: validated.jobLevel || null,
            pinnedTasks: validated.pinnedTasks || null,
            additionalRoles: validated.additionalRoles || null,
            // departmentId will be set later after departments are created
          },
        });

        // Map old email (ID) to new cuid
        idMaps.users.set(user.email, created.id);
      }
      console.log(`✅ Migrated ${data.users.length} users\n`);

      console.log("📦 Migrating Mission Groups...");
      for (const mg of data.missionGroups) {
        const created = await tx.missionGroup.create({
          data: {
            name: mg.name,
            // chiefUserId will be set later
          },
        });
        idMaps.missionGroups.set(mg.originalId, created.id);
      }
      console.log(`✅ Migrated ${data.missionGroups.length} mission groups\n`);

      console.log("📦 Migrating Divisions...");
      for (const div of data.divisions) {
        const created = await tx.division.create({
          data: {
            name: div.name,
            missionGroupId: idMaps.missionGroups.get(div.missionGroupId)!,
            // leaderUserId will be set later
          },
        });
        idMaps.divisions.set(div.originalId, created.id);
      }
      console.log(`✅ Migrated ${data.divisions.length} divisions\n`);

      console.log("📦 Migrating Departments...");
      for (const dept of data.departments) {
        const created = await tx.department.create({
          data: {
            name: dept.name,
            divisionId: idMaps.divisions.get(dept.divisionId)!,
            tel: dept.tel || null,
            // headUserId will be set later
          },
        });
        idMaps.departments.set(dept.originalId, created.id);
      }
      console.log(`✅ Migrated ${data.departments.length} departments\n`);

      // Update Users with departmentId (now that departments exist)
      console.log("📦 Updating user departments...");
      for (const user of data.users) {
        if (user.departmentId) {
          await tx.user.update({
            where: { email: user.email },
            data: {
              departmentId: idMaps.departments.get(user.departmentId) || null,
            },
          });
        }
      }
      console.log(`✅ Updated user departments\n`);

      console.log("📦 Migrating Projects...");
      for (const proj of data.projects) {
        const created = await tx.project.create({
          data: {
            name: proj.name,
            description: proj.description || null,
            departmentId: idMaps.departments.get(proj.departmentId)!,
            startDate: proj.startDate ? new Date(proj.startDate) : null,
            endDate: proj.endDate ? new Date(proj.endDate) : null,
            status: mapProjectStatus(proj.status),
            color: proj.color || null,
            ownerUserId: idMaps.users.get(proj.ownerUserId)!,
            creatorUserId: idMaps.users.get(proj.creatorUserId)!,
            createdAt: proj.dateCreated
              ? new Date(proj.dateCreated)
              : new Date(),
          },
        });
        idMaps.projects.set(proj.originalId, created.id);
      }
      console.log(`✅ Migrated ${data.projects.length} projects\n`);

      console.log("📦 Migrating Statuses...");
      for (const status of data.statuses) {
        const created = await tx.status.create({
          data: {
            name: status.name,
            color: status.color,
            order: parseInt(status.order) || 0,
            type: mapStatusType(status.type),
            projectId: idMaps.projects.get(status.projectId)!,
          },
        });
        idMaps.statuses.set(status.originalId, created.id);
      }
      console.log(`✅ Migrated ${data.statuses.length} statuses\n`);

      console.log("📦 Migrating Tasks...");
      for (const task of data.tasks) {
        const created = await tx.task.create({
          data: {
            name: task.name,
            projectId: idMaps.projects.get(task.projectId)!,
            description: task.description || null,
            assigneeUserId: task.assigneeUserId
              ? idMaps.users.get(task.assigneeUserId)
              : null,
            statusId: idMaps.statuses.get(task.statusId)!,
            priority: task.priority,
            startDate: task.startDate ? new Date(task.startDate) : null,
            dueDate: task.dueDate ? new Date(task.dueDate) : null,
            parentTaskId: task.parentTaskId
              ? idMaps.tasks.get(task.parentTaskId)
              : null,
            creatorUserId: idMaps.users.get(task.creatorUserId)!,
            closeDate: task.closeDate ? new Date(task.closeDate) : null,
            difficulty: task.difficulty,
            isClosed: task.isClosed,
            closeType: task.closeType ? mapCloseType(task.closeType) : null,
            userClosedId: task.userClosedId
              ? idMaps.users.get(task.userClosedId)
              : null,
            createdAt: task.dateCreated
              ? new Date(task.dateCreated)
              : new Date(),
          },
        });
        idMaps.tasks.set(task.originalId, created.id);
      }
      console.log(`✅ Migrated ${data.tasks.length} tasks\n`);

      // ... Continue for comments, attachments, tags, etc.

      console.log("📦 Migrating Task Comments...");
      console.log("📦 Migrating Attachments...");
      console.log("📦 Migrating Tags...");
      console.log("📦 Migrating Activity Logs...");
      console.log("📦 Migrating Notifications...");

      // ============================================
      // NEW TABLES MIGRATION (Added 2025-10-20)
      // ============================================

      console.log("📦 Migrating Hospital Missions...");
      for (const mission of data.hospitalMissions || []) {
        const created = await tx.hospitalMission.create({
          data: {
            name: mission.name,
            description: mission.description || null,
            year: mission.year || null,
            order: mission.order || 0,
          },
        });
        idMaps.hospitalMissions.set(mission.id, created.id);
      }
      console.log(
        `✅ Migrated ${data.hospitalMissions?.length || 0} hospital missions\n`
      );

      console.log("📦 Migrating IT Goals...");
      for (const goal of data.itGoals || []) {
        const created = await tx.iTGoal.create({
          data: {
            name: goal.name,
            hospitalMissionId: idMaps.hospitalMissions.get(
              goal.hospitalMissionId
            )!,
            description: goal.description || null,
            order: goal.order || 0,
          },
        });
        idMaps.itGoals.set(goal.id, created.id);
      }
      console.log(`✅ Migrated ${data.itGoals?.length || 0} IT goals\n`);

      console.log("📦 Migrating Action Plans...");
      for (const plan of data.actionPlans || []) {
        const created = await tx.actionPlan.create({
          data: {
            name: plan.name,
            itGoalId: idMaps.itGoals.get(plan.itGoalId)!,
            description: plan.description || null,
            order: plan.order || 0,
          },
        });
        idMaps.actionPlans.set(plan.id, created.id);
      }
      console.log(
        `✅ Migrated ${data.actionPlans?.length || 0} action plans\n`
      );

      console.log("📦 Migrating Phases...");
      for (const phase of data.phases || []) {
        const created = await tx.phase.create({
          data: {
            name: phase.name,
            projectId: idMaps.projects.get(phase.projectId)!,
            startDate: phase.startDate ? new Date(phase.startDate) : null,
            endDate: phase.endDate ? new Date(phase.endDate) : null,
            order: phase.order || 0,
            description: phase.description || null,
            createdAt: phase.dateCreated
              ? new Date(phase.dateCreated)
              : new Date(),
          },
        });
        idMaps.phases.set(phase.id, created.id);
      }
      console.log(`✅ Migrated ${data.phases?.length || 0} phases\n`);

      console.log("📦 Migrating Checklist Items...");
      for (const item of data.checklistItems || []) {
        const created = await tx.checklistItem.create({
          data: {
            taskId: idMaps.tasks.get(item.taskId)!,
            name: item.name,
            isChecked: item.isChecked || false,
            order: item.order || 0,
            creatorUserId: idMaps.users.get(item.creatorUserId)!,
            createdAt: item.dateCreated
              ? new Date(item.dateCreated)
              : new Date(),
          },
        });
        idMaps.checklistItems.set(item.id, created.id);
      }
      console.log(
        `✅ Migrated ${data.checklistItems?.length || 0} checklist items\n`
      );

      // Update projects with actionPlanId (now that action plans exist)
      console.log("📦 Updating project action plans...");
      for (const proj of data.projects) {
        if (proj.actionPlanId) {
          await tx.project.update({
            where: { id: idMaps.projects.get(proj.originalId) },
            data: {
              actionPlanId: idMaps.actionPlans.get(proj.actionPlanId) || null,
            },
          });
        }
      }
      console.log(`✅ Updated project action plans\n`);
    });

    console.log("\n✅ Migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Helper functions
function mapUserRole(
  role: string
): "ADMIN" | "CHIEF" | "LEADER" | "HEAD" | "MEMBER" | "USER" {
  const map: Record<string, any> = {
    Admin: "ADMIN",
    Chief: "CHIEF",
    Leader: "LEADER",
    Head: "HEAD",
    Member: "MEMBER",
    User: "USER",
  };
  return map[role] || "USER";
}

function mapUserStatus(status: string): "ACTIVE" | "SUSPENDED" | "INACTIVE" {
  const map: Record<string, any> = {
    Active: "ACTIVE",
    Suspended: "SUSPENDED",
    Inactive: "INACTIVE",
  };
  return map[status] || "ACTIVE";
}

function mapProjectStatus(
  status: string
): "ACTIVE" | "COMPLETED" | "ON_HOLD" | "ARCHIVED" {
  const map: Record<string, any> = {
    Active: "ACTIVE",
    Completed: "COMPLETED",
    "On Hold": "ON_HOLD",
    Archived: "ARCHIVED",
  };
  return map[status] || "ACTIVE";
}

function mapStatusType(type: string): "NOT_STARTED" | "IN_PROGRESS" | "DONE" {
  const map: Record<string, any> = {
    "Not Started": "NOT_STARTED",
    "In Progress": "IN_PROGRESS",
    Done: "DONE",
  };
  return map[type] || "NOT_STARTED";
}

function mapCloseType(type: string): "COMPLETED" | "ABORTED" {
  return type === "Completed" ? "COMPLETED" : "ABORTED";
}

main();
```

### 4.3 Running the Migration

```bash
# 1. Export data from GAS
# Run exportAllDataForMigration() in GAS, save output to migration_data.json

# 2. Setup PostgreSQL database on render.com
# Get connection string from render.com dashboard

# 3. Setup Prisma
npm install @prisma/client prisma
npx prisma init

# 4. Update .env with DATABASE_URL
DATABASE_URL="postgresql://user:password@host:port/dbname"

# 5. Push schema to database
npx prisma db push

# 6. Run migration script
npm run migrate:data

# 7. Verify data
npx prisma studio
# Check record counts, spot check data
```

---

## 5. Data Integrity Checks

### 5.1 Pre-Migration Checks

```typescript
// scripts/pre-migration-check.ts

async function preMigrationCheck(data: any) {
  const checks = {
    totalUsers: data.users.length,
    totalProjects: data.projects.length,
    totalTasks: data.tasks.length,
    totalComments: data.taskComments.length,

    // Check for orphaned records
    orphanedTasks: data.tasks.filter(
      (t: any) => !data.projects.find((p: any) => p.originalId === t.projectId)
    ).length,

    orphanedStatuses: data.statuses.filter(
      (s: any) => !data.projects.find((p: any) => p.originalId === s.projectId)
    ).length,

    // Check for invalid foreign keys
    invalidAssignees: data.tasks.filter(
      (t: any) =>
        t.assigneeUserId &&
        !data.users.find((u: any) => u.email === t.assigneeUserId)
    ).length,

    // Check for required fields
    tasksWithoutName: data.tasks.filter((t: any) => !t.name).length,
    usersWithoutEmail: data.users.filter((u: any) => !u.email).length,
  };

  console.log("Pre-migration checks:", JSON.stringify(checks, null, 2));

  const hasErrors =
    checks.orphanedTasks > 0 ||
    checks.orphanedStatuses > 0 ||
    checks.invalidAssignees > 0 ||
    checks.tasksWithoutName > 0 ||
    checks.usersWithoutEmail > 0;

  if (hasErrors) {
    throw new Error("Data integrity issues found! Fix before migrating.");
  }

  return checks;
}
```

### 5.2 Post-Migration Verification

```typescript
// scripts/verify-migration.ts

async function verifyMigration(originalData: any) {
  const checks = [];

  // Record counts
  const userCount = await prisma.user.count();
  checks.push({
    name: "Users",
    expected: originalData.users.length,
    actual: userCount,
    match: userCount === originalData.users.length,
  });

  const projectCount = await prisma.project.count();
  checks.push({
    name: "Projects",
    expected: originalData.projects.length,
    actual: projectCount,
    match: projectCount === originalData.projects.length,
  });

  const taskCount = await prisma.task.count();
  checks.push({
    name: "Tasks",
    expected: originalData.tasks.length,
    actual: taskCount,
    match: taskCount === originalData.tasks.length,
  });

  // Foreign key integrity
  const tasksWithInvalidProject = await prisma.task.count({
    where: { project: null },
  });
  checks.push({
    name: "Tasks with valid project",
    expected: 0,
    actual: tasksWithInvalidProject,
    match: tasksWithInvalidProject === 0,
  });

  // Spot check - compare random records
  const randomTask =
    originalData.tasks[Math.floor(Math.random() * originalData.tasks.length)];
  const migratedTask = await prisma.task.findFirst({
    where: {
      name: randomTask.name,
      createdAt: new Date(randomTask.dateCreated),
    },
  });
  checks.push({
    name: "Spot check - random task",
    expected: randomTask.name,
    actual: migratedTask?.name,
    match: migratedTask?.name === randomTask.name,
  });

  console.log("\n📊 Migration Verification Results:\n");
  console.table(checks);

  const allPassed = checks.every((c) => c.match);
  if (allPassed) {
    console.log("\n✅ All verification checks passed!");
  } else {
    console.log("\n❌ Some verification checks failed!");
    throw new Error("Migration verification failed");
  }
}
```

---

## 6. Indexes and Performance

### 6.1 Required Indexes

The Prisma schema above includes `@@index` directives. These will create indexes automatically.

### 6.2 Additional Custom Indexes

```sql
-- For full-text search on task names and descriptions
CREATE INDEX idx_tasks_name_search ON tasks USING GIN (to_tsvector('english', name));
CREATE INDEX idx_tasks_description_search ON tasks USING GIN (to_tsvector('english', description));

-- For complex queries on activity logs
CREATE INDEX idx_activity_logs_composite ON activity_logs (entity_type, entity_id, created_at DESC);

-- For notification queries
CREATE INDEX idx_notifications_unread ON notifications (user_id, is_read) WHERE is_read = false;
```

### 6.3 Performance Optimization

```typescript
// Use Prisma query optimization

// ❌ Bad: N+1 query problem
const tasks = await prisma.task.findMany();
for (const task of tasks) {
  const assignee = await prisma.user.findUnique({
    where: { id: task.assigneeUserId },
  });
}

// ✅ Good: Use include to fetch relations in one query
const tasks = await prisma.task.findMany({
  include: {
    assignee: true,
    status: true,
    project: true,
  },
});

// ✅ Better: Use select to fetch only needed fields
const tasks = await prisma.task.findMany({
  select: {
    id: true,
    name: true,
    priority: true,
    dueDate: true,
    assignee: {
      select: {
        id: true,
        fullName: true,
        profileImageUrl: true,
      },
    },
    status: {
      select: {
        name: true,
        color: true,
      },
    },
  },
});
```

---

## 7. Timeline

| Phase                    | Duration | Tasks                                           |
| ------------------------ | -------- | ----------------------------------------------- |
| **Schema Design**        | 2 days   | Design Prisma schema, review with stakeholders  |
| **Export Script**        | 2 days   | Write GAS export functions, test data export    |
| **Import Script**        | 3 days   | Write transformation logic, validation, import  |
| **Testing**              | 2 days   | Pre-migration checks, dry run, verify integrity |
| **Production Migration** | 1 day    | Export prod data, import to prod DB, verify     |
| **Monitoring**           | 1 week   | Monitor for issues, fix data problems           |

**Total:** ~2 weeks

---

## 8. Rollback Plan

**If migration fails:**

1. Keep Google Sheets data untouched (read-only during migration)
2. Drop PostgreSQL database and recreate
3. Re-run migration with fixes
4. If critical: Revert to GAS app (DNS change)

---

## Next Steps

1. Review Prisma schema
2. Test export script with sample data
3. Create staging database on render.com
4. Run dry-run migration
5. Verify data integrity
6. Schedule production migration window

---

**Document Status:** ✅ DRAFT
**Next:** [02_API_MIGRATION.md](./02_API_MIGRATION.md)
