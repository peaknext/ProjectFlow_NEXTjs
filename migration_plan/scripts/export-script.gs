/**
 * ========================================
 * ProjectFlow Data Export Script
 * ========================================
 *
 * Purpose: Export all data from Google Sheets to JSON for PostgreSQL migration
 * Version: 2.0 (Updated: 2025-10-20)
 * Date: 2025-10-20
 *
 * CHANGES IN v2.0:
 * - Updated to match ACTUAL schema from original GAS project (Code.gs)
 * - Added tables: COMMENTS, HISTORY, HOLIDAYS, REQUESTS, CONFIG, PERMISSIONS, ROLE_PERMISSIONS
 * - Fixed columns for: PROJECTS, CHECKLISTS, HOSP_MISSIONS, IT_GOALS, ACTION_PLANS
 * - Total tables: 21 (all tables from original GAS project)
 *
 * HOW TO USE:
 * 1. Open your Google Apps Script project (Tools > Script editor)
 * 2. Copy this entire file content
 * 3. Paste it into a new .gs file (or replace existing Code.gs)
 * 4. Run the function: exportAllDataForMigration()
 * 5. Copy the output from Logger (View > Logs or Ctrl+Enter)
 * 6. Save to a file named: migration_data.json
 *
 * WARNING: This will export ALL data including password hashes.
 * Keep the exported JSON file secure and delete it after migration.
 */

// ========================================
// CONFIGURATION
// ========================================

const ss = SpreadsheetApp.getActiveSpreadsheet();

// ========================================
// SCHEMA DEFINITIONS (From original Code.gs)
// All 21 tables with their ACTUAL column positions
// ========================================

const SCHEMA = {
  USERS: {
    NAME: "Users",
    USER_ID: 1,           // Email
    FULL_NAME: 2,
    PASSWORD_HASH: 3,
    SALT: 4,
    ROLE: 5,              // Admin, Chief, Leader, Head, Member, User
    PROFILE_IMAGE_URL: 6,
    DEPARTMENT_ID: 7,     // FK to Departments
    IS_VERIFIED: 8,
    VERIFICATION_TOKEN: 9,
    RESET_TOKEN: 10,
    RESET_TOKEN_EXPIRY: 11,
    USER_STATUS: 12,      // Active, Suspended
    USER_JOB_TITLE: 13,
    USER_JOB_LEVEL: 14,
    PINNED_TASKS: 15,     // JSON array of task IDs
    ADDITIONAL_ROLE: 16,  // JSON object: {"Role1": "BranchId1", ...}
  },

  USER_SESSIONS: {
    NAME: "UserSessions",
    SESSION_TOKEN: 1,     // PRIMARY KEY
    USER_ID: 2,           // FK to Users
    EXPIRY_TIMESTAMP: 3,
  },

  DIVISIONS: {
    NAME: "Divisions",
    ID: 1,                // PRIMARY KEY
    NAME_COL: 2,
    MISSION_GROUP_ID: 3,  // FK to MissionGroups
    LEADER_USER_ID: 4,    // FK to Users
  },

  DEPARTMENTS: {
    NAME: "Departments",
    ID: 1,                // PRIMARY KEY
    NAME_COL: 2,
    DIVISION_ID: 3,       // FK to Divisions
    HEAD_USER_ID: 4,      // FK to Users
    DEPARTMENT_TEL: 5,
  },

  MISSION_GROUPS: {
    NAME: "MissionGroups",
    ID: 1,                // PRIMARY KEY
    NAME_COL: 2,
    CHIEF_USER_ID: 3,     // FK to Users
  },

  TASKS: {
    NAME: "Tasks",
    ID: 1,                // PRIMARY KEY
    NAME_COL: 2,
    PROJECT_ID: 3,        // FK to Projects
    DESCRIPTION: 4,
    ASSIGNEE_USER_ID: 5,  // FK to Users
    STATUS_ID: 6,         // FK to Statuses
    PRIORITY: 7,          // e.g., Low, Medium, High
    START_DATE: 8,
    DUE_DATE: 9,
    PARENT_TASK_ID: 10,   // FK to Tasks (self-reference)
    DATE_CREATED: 11,
    CREATOR_USER_ID: 12,  // FK to Users
    CLOSE_DATE: 13,
    DIFFICULTY: 14,       // 1-5
    IS_CLOSED: 15,        // Boolean
    CLOSE_TYPE: 16,       // Completed, Aborted
    USER_CLOSED_ID: 17,   // FK to Users
  },

  STATUSES: {
    NAME: "Statuses",
    ID: 1,                // PRIMARY KEY
    NAME_COL: 2,
    COLOR: 3,             // Hex color code
    ORDER: 4,
    TYPE: 5,              // Not Started, In Progress, Done
    PROJECT_ID: 6,        // FK to Projects
  },

  PROJECTS: {
    NAME: "Projects",
    ID: 1,                // PRIMARY KEY
    NAME_COL: 2,
    DESCRIPTION: 3,
    DEPARTMENT_ID: 4,     // FK to Departments
    OWNER_USER_ID: 5,     // FK to Users
    CREATED_DATE: 6,
    STATUS: 7,            // Active, Completed, On Hold
    ACTION_PLAN_ID: 8,    // FK to ActionPlans
    DATE_DELETED: 9,      // For soft delete
    USER_DELETED: 10,     // FK to Users
  },

  COMMENTS: {
    NAME: "Comments",
    ID: 1,                // PRIMARY KEY
    TASK_ID: 2,           // FK to Tasks
    COMMENTOR_USER_ID: 3, // FK to Users
    COMMENT_TEXT: 4,
    CREATED_AT: 5,
    MENTIONS: 6,          // JSON array of user IDs
  },

  NOTIFICATIONS: {
    NAME: "Notifications",
    ID: 1,                // PRIMARY KEY
    USER_ID: 2,           // FK to Users (recipient)
    TRIGGERED_BY_USER_ID: 3, // FK to Users
    TYPE: 4,              // assignment, mention, status changed, etc.
    MESSAGE: 5,
    TASK_ID: 6,           // FK to Tasks
    CREATED_AT: 7,
    IS_READ: 8,           // Boolean
  },

  CHECKLISTS: {
    NAME: "Checklists",
    ID: 1,                // PRIMARY KEY
    NAME_COL: 2,
    IS_CHECKED: 3,        // Boolean
    CREATOR_USER_ID: 4,   // FK to Users
    CREATED_DATE: 5,
    TASK_ID: 6,           // FK to Tasks
  },

  HISTORY: {
    NAME: "History",
    ID: 1,                // PRIMARY KEY
    HISTORY_TEXT: 2,
    HISTORY_DATE: 3,
    TASK_ID: 4,           // FK to Tasks
    USER_ID: 5,           // FK to Users
  },

  HOLIDAYS: {
    NAME: "Holidays",
    DATE: 1,              // PRIMARY KEY
    NAME_COL: 2,
  },

  HOSP_MISSIONS: {
    NAME: "HospMissions",
    ID: 1,                // PRIMARY KEY
    NAME_COL: 2,
    DESCRIPTION: 3,
    START_YEAR: 4,
    END_YEAR: 5,
  },

  IT_GOALS: {
    NAME: "ITGoals",
    ID: 1,                // PRIMARY KEY
    NAME_COL: 2,
    HOSP_MISSION_ID: 3,   // FK to HospMissions
  },

  ACTION_PLANS: {
    NAME: "ActionPlans",
    ID: 1,                // PRIMARY KEY
    NAME_COL: 2,
    HOSP_MISSION_ID: 3,   // FK to HospMissions
    IT_GOAL_IDS: 4,       // JSON array of IT Goal IDs
  },

  REQUESTS: {
    NAME: "Requests",
    ID: 1,                // PRIMARY KEY
    USER_ID: 2,           // FK to Users
    REQUEST_TYPE: 3,
    REQUEST_DESCRIPTION: 4,
    REQUEST_NAME: 5,
    CREATED_AT: 6,
    TASK_ID: 7,           // FK to Tasks
    REQUEST_PURPOSE: 8,
    REQUEST_PURPOSE_DETAILS: 9,
    REQUEST_DAYS_DEMANDED: 10,
    REQUEST_DAYS_NEEDED: 11,
    USER_TEL: 12,
  },

  CONFIG: {
    NAME: "Config",
    ID: 1,                // PRIMARY KEY
    CONFIG_KEY: 2,
    CONFIG_VALUE: 3,
  },

  PERMISSIONS: {
    NAME: "Permissions",
    PERMISSION_KEY: 1,    // PRIMARY KEY
    PERMISSION_NAME: 2,
    CATEGORY: 3,
  },

  ROLE_PERMISSIONS: {
    NAME: "RolePermissions",
    ROLE_NAME: 1,
    PERMISSION_KEY: 2,
    ALLOWED: 3,           // Boolean
  },

  PHASES: {
    NAME: "Phases",
    ID: 1,                // PRIMARY KEY
    NAME_COL: 2,
    PHASE_ORDER: 3,
    PROJECT_ID: 4,        // FK to Projects
    START_DATE: 5,
    END_DATE: 6,
  },
};

// ========================================
// HELPER FUNCTIONS
// ========================================

/**
 * Parse JSON field from Google Sheets cell
 */
function parseJSONField(value) {
  if (!value || value === '') return null;
  try {
    return JSON.parse(value);
  } catch (e) {
    Logger.log('JSON parse error: ' + e + ', value: ' + value);
    return null;
  }
}

/**
 * Convert various boolean representations to true/false
 */
function parseBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toUpperCase() === 'TRUE' || value === '1';
  }
  return value === true || value === 1;
}

/**
 * Safely parse integer
 */
function parseInteger(value, defaultValue = 0) {
  const parsed = parseInt(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Check if a sheet exists
 */
function sheetExists(sheetName) {
  return ss.getSheetByName(sheetName) !== null;
}

// ========================================
// EXPORT FUNCTIONS
// ========================================

function exportUsers() {
  const sheet = ss.getSheetByName(SCHEMA.USERS.NAME);
  if (!sheet) {
    Logger.log('⚠️  Warning: Users sheet not found');
    return [];
  }

  const data = sheet.getDataRange().getValues();

  return data.slice(1).map((row, index) => ({
    originalRowNumber: index + 2,
    email: row[SCHEMA.USERS.USER_ID - 1],
    fullName: row[SCHEMA.USERS.FULL_NAME - 1],
    passwordHash: row[SCHEMA.USERS.PASSWORD_HASH - 1],
    salt: row[SCHEMA.USERS.SALT - 1],
    role: row[SCHEMA.USERS.ROLE - 1],
    profileImageUrl: row[SCHEMA.USERS.PROFILE_IMAGE_URL - 1] || null,
    departmentId: row[SCHEMA.USERS.DEPARTMENT_ID - 1] || null,
    isVerified: parseBoolean(row[SCHEMA.USERS.IS_VERIFIED - 1]),
    verificationToken: row[SCHEMA.USERS.VERIFICATION_TOKEN - 1] || null,
    resetToken: row[SCHEMA.USERS.RESET_TOKEN - 1] || null,
    resetTokenExpiry: row[SCHEMA.USERS.RESET_TOKEN_EXPIRY - 1] || null,
    userStatus: row[SCHEMA.USERS.USER_STATUS - 1] || 'Active',
    jobTitle: row[SCHEMA.USERS.USER_JOB_TITLE - 1] || null,
    jobLevel: row[SCHEMA.USERS.USER_JOB_LEVEL - 1] || null,
    pinnedTasks: parseJSONField(row[SCHEMA.USERS.PINNED_TASKS - 1]),
    additionalRoles: parseJSONField(row[SCHEMA.USERS.ADDITIONAL_ROLE - 1]),
  })).filter(user => user.email && user.email !== '');
}

function exportSessions() {
  const sheet = ss.getSheetByName(SCHEMA.USER_SESSIONS.NAME);
  if (!sheet) {
    Logger.log('⚠️  Warning: UserSessions sheet not found');
    return [];
  }

  const data = sheet.getDataRange().getValues();

  return data.slice(1).map((row, index) => ({
    originalRowNumber: index + 2,
    sessionToken: row[SCHEMA.USER_SESSIONS.SESSION_TOKEN - 1],
    userId: row[SCHEMA.USER_SESSIONS.USER_ID - 1],
    expiryTimestamp: row[SCHEMA.USER_SESSIONS.EXPIRY_TIMESTAMP - 1],
  })).filter(session => session.sessionToken);
}

function exportMissionGroups() {
  const sheet = ss.getSheetByName(SCHEMA.MISSION_GROUPS.NAME);
  if (!sheet) {
    Logger.log('⚠️  Warning: MissionGroups sheet not found');
    return [];
  }

  const data = sheet.getDataRange().getValues();

  return data.slice(1).map((row, index) => ({
    originalRowNumber: index + 2,
    originalId: row[SCHEMA.MISSION_GROUPS.ID - 1],
    name: row[SCHEMA.MISSION_GROUPS.NAME_COL - 1],
    chiefUserId: row[SCHEMA.MISSION_GROUPS.CHIEF_USER_ID - 1] || null,
  })).filter(mg => mg.originalId);
}

function exportDivisions() {
  const sheet = ss.getSheetByName(SCHEMA.DIVISIONS.NAME);
  if (!sheet) {
    Logger.log('⚠️  Warning: Divisions sheet not found');
    return [];
  }

  const data = sheet.getDataRange().getValues();

  return data.slice(1).map((row, index) => ({
    originalRowNumber: index + 2,
    originalId: row[SCHEMA.DIVISIONS.ID - 1],
    name: row[SCHEMA.DIVISIONS.NAME_COL - 1],
    missionGroupId: row[SCHEMA.DIVISIONS.MISSION_GROUP_ID - 1],
    leaderUserId: row[SCHEMA.DIVISIONS.LEADER_USER_ID - 1] || null,
  })).filter(div => div.originalId);
}

function exportDepartments() {
  const sheet = ss.getSheetByName(SCHEMA.DEPARTMENTS.NAME);
  if (!sheet) {
    Logger.log('⚠️  Warning: Departments sheet not found');
    return [];
  }

  const data = sheet.getDataRange().getValues();

  return data.slice(1).map((row, index) => ({
    originalRowNumber: index + 2,
    originalId: row[SCHEMA.DEPARTMENTS.ID - 1],
    name: row[SCHEMA.DEPARTMENTS.NAME_COL - 1],
    divisionId: row[SCHEMA.DEPARTMENTS.DIVISION_ID - 1],
    headUserId: row[SCHEMA.DEPARTMENTS.HEAD_USER_ID - 1] || null,
    tel: row[SCHEMA.DEPARTMENTS.DEPARTMENT_TEL - 1] || null,
  })).filter(dept => dept.originalId);
}

function exportProjects() {
  const sheet = ss.getSheetByName(SCHEMA.PROJECTS.NAME);
  if (!sheet) {
    Logger.log('⚠️  Warning: Projects sheet not found');
    return [];
  }

  const data = sheet.getDataRange().getValues();

  return data.slice(1).map((row, index) => ({
    originalRowNumber: index + 2,
    originalId: row[SCHEMA.PROJECTS.ID - 1],
    name: row[SCHEMA.PROJECTS.NAME_COL - 1],
    description: row[SCHEMA.PROJECTS.DESCRIPTION - 1] || null,
    departmentId: row[SCHEMA.PROJECTS.DEPARTMENT_ID - 1],
    ownerUserId: row[SCHEMA.PROJECTS.OWNER_USER_ID - 1],
    createdDate: row[SCHEMA.PROJECTS.CREATED_DATE - 1] || null,
    status: row[SCHEMA.PROJECTS.STATUS - 1] || 'Active',
    actionPlanId: row[SCHEMA.PROJECTS.ACTION_PLAN_ID - 1] || null,
    dateDeleted: row[SCHEMA.PROJECTS.DATE_DELETED - 1] || null,
    userDeleted: row[SCHEMA.PROJECTS.USER_DELETED - 1] || null,
  })).filter(proj => proj.originalId);
}

function exportTasks() {
  const sheet = ss.getSheetByName(SCHEMA.TASKS.NAME);
  if (!sheet) {
    Logger.log('⚠️  Warning: Tasks sheet not found');
    return [];
  }

  const data = sheet.getDataRange().getValues();

  return data.slice(1).map((row, index) => ({
    originalRowNumber: index + 2,
    originalId: row[SCHEMA.TASKS.ID - 1],
    name: row[SCHEMA.TASKS.NAME_COL - 1],
    projectId: row[SCHEMA.TASKS.PROJECT_ID - 1],
    description: row[SCHEMA.TASKS.DESCRIPTION - 1] || null,
    assigneeUserId: row[SCHEMA.TASKS.ASSIGNEE_USER_ID - 1] || null,
    statusId: row[SCHEMA.TASKS.STATUS_ID - 1],
    priority: parseInteger(row[SCHEMA.TASKS.PRIORITY - 1], 3),
    startDate: row[SCHEMA.TASKS.START_DATE - 1] || null,
    dueDate: row[SCHEMA.TASKS.DUE_DATE - 1] || null,
    parentTaskId: row[SCHEMA.TASKS.PARENT_TASK_ID - 1] || null,
    dateCreated: row[SCHEMA.TASKS.DATE_CREATED - 1] || null,
    creatorUserId: row[SCHEMA.TASKS.CREATOR_USER_ID - 1],
    closeDate: row[SCHEMA.TASKS.CLOSE_DATE - 1] || null,
    difficulty: parseInteger(row[SCHEMA.TASKS.DIFFICULTY - 1], 2),
    isClosed: parseBoolean(row[SCHEMA.TASKS.IS_CLOSED - 1]),
    closeType: row[SCHEMA.TASKS.CLOSE_TYPE - 1] || null,
    userClosedId: row[SCHEMA.TASKS.USER_CLOSED_ID - 1] || null,
  })).filter(task => task.originalId);
}

function exportStatuses() {
  const sheet = ss.getSheetByName(SCHEMA.STATUSES.NAME);
  if (!sheet) {
    Logger.log('⚠️  Warning: Statuses sheet not found');
    return [];
  }

  const data = sheet.getDataRange().getValues();

  return data.slice(1).map((row, index) => ({
    originalRowNumber: index + 2,
    originalId: row[SCHEMA.STATUSES.ID - 1],
    name: row[SCHEMA.STATUSES.NAME_COL - 1],
    color: row[SCHEMA.STATUSES.COLOR - 1] || null,
    order: parseInteger(row[SCHEMA.STATUSES.ORDER - 1], 0),
    type: row[SCHEMA.STATUSES.TYPE - 1] || 'In Progress',
    projectId: row[SCHEMA.STATUSES.PROJECT_ID - 1],
  })).filter(status => status.originalId);
}

function exportComments() {
  const sheet = ss.getSheetByName(SCHEMA.COMMENTS.NAME);
  if (!sheet) {
    Logger.log('⚠️  Info: Comments sheet not found (optional)');
    return [];
  }

  const data = sheet.getDataRange().getValues();

  return data.slice(1).map((row, index) => ({
    originalRowNumber: index + 2,
    originalId: row[SCHEMA.COMMENTS.ID - 1],
    taskId: row[SCHEMA.COMMENTS.TASK_ID - 1],
    commentorUserId: row[SCHEMA.COMMENTS.COMMENTOR_USER_ID - 1],
    commentText: row[SCHEMA.COMMENTS.COMMENT_TEXT - 1],
    createdAt: row[SCHEMA.COMMENTS.CREATED_AT - 1] || null,
    mentions: parseJSONField(row[SCHEMA.COMMENTS.MENTIONS - 1]),
  })).filter(comment => comment.originalId);
}

function exportNotifications() {
  const sheet = ss.getSheetByName(SCHEMA.NOTIFICATIONS.NAME);
  if (!sheet) {
    Logger.log('⚠️  Warning: Notifications sheet not found');
    return [];
  }

  const data = sheet.getDataRange().getValues();

  return data.slice(1).map((row, index) => ({
    originalRowNumber: index + 2,
    originalId: row[SCHEMA.NOTIFICATIONS.ID - 1],
    userId: row[SCHEMA.NOTIFICATIONS.USER_ID - 1],
    triggeredByUserId: row[SCHEMA.NOTIFICATIONS.TRIGGERED_BY_USER_ID - 1] || null,
    type: row[SCHEMA.NOTIFICATIONS.TYPE - 1],
    message: row[SCHEMA.NOTIFICATIONS.MESSAGE - 1] || null,
    taskId: row[SCHEMA.NOTIFICATIONS.TASK_ID - 1] || null,
    createdAt: row[SCHEMA.NOTIFICATIONS.CREATED_AT - 1] || null,
    isRead: parseBoolean(row[SCHEMA.NOTIFICATIONS.IS_READ - 1]),
  })).filter(notif => notif.originalId);
}

function exportChecklists() {
  const sheet = ss.getSheetByName(SCHEMA.CHECKLISTS.NAME);
  if (!sheet) {
    Logger.log('⚠️  Info: Checklists sheet not found (optional)');
    return [];
  }

  const data = sheet.getDataRange().getValues();

  return data.slice(1).map((row, index) => ({
    originalRowNumber: index + 2,
    originalId: row[SCHEMA.CHECKLISTS.ID - 1],
    name: row[SCHEMA.CHECKLISTS.NAME_COL - 1],
    isChecked: parseBoolean(row[SCHEMA.CHECKLISTS.IS_CHECKED - 1]),
    creatorUserId: row[SCHEMA.CHECKLISTS.CREATOR_USER_ID - 1],
    createdDate: row[SCHEMA.CHECKLISTS.CREATED_DATE - 1] || null,
    taskId: row[SCHEMA.CHECKLISTS.TASK_ID - 1],
  })).filter(item => item.originalId);
}

function exportHistory() {
  const sheet = ss.getSheetByName(SCHEMA.HISTORY.NAME);
  if (!sheet) {
    Logger.log('⚠️  Info: History sheet not found (optional)');
    return [];
  }

  const data = sheet.getDataRange().getValues();

  return data.slice(1).map((row, index) => ({
    originalRowNumber: index + 2,
    originalId: row[SCHEMA.HISTORY.ID - 1],
    historyText: row[SCHEMA.HISTORY.HISTORY_TEXT - 1],
    historyDate: row[SCHEMA.HISTORY.HISTORY_DATE - 1] || null,
    taskId: row[SCHEMA.HISTORY.TASK_ID - 1],
    userId: row[SCHEMA.HISTORY.USER_ID - 1],
  })).filter(h => h.originalId);
}

function exportHolidays() {
  const sheet = ss.getSheetByName(SCHEMA.HOLIDAYS.NAME);
  if (!sheet) {
    Logger.log('⚠️  Info: Holidays sheet not found (optional)');
    return [];
  }

  const data = sheet.getDataRange().getValues();

  return data.slice(1).map((row, index) => ({
    originalRowNumber: index + 2,
    date: row[SCHEMA.HOLIDAYS.DATE - 1],
    name: row[SCHEMA.HOLIDAYS.NAME_COL - 1],
  })).filter(h => h.date);
}

function exportHospMissions() {
  const sheet = ss.getSheetByName(SCHEMA.HOSP_MISSIONS.NAME);
  if (!sheet) {
    Logger.log('⚠️  Info: HospMissions sheet not found (optional)');
    return [];
  }

  const data = sheet.getDataRange().getValues();

  return data.slice(1).map((row, index) => ({
    originalRowNumber: index + 2,
    originalId: row[SCHEMA.HOSP_MISSIONS.ID - 1],
    name: row[SCHEMA.HOSP_MISSIONS.NAME_COL - 1],
    description: row[SCHEMA.HOSP_MISSIONS.DESCRIPTION - 1] || null,
    startYear: parseInteger(row[SCHEMA.HOSP_MISSIONS.START_YEAR - 1], null),
    endYear: parseInteger(row[SCHEMA.HOSP_MISSIONS.END_YEAR - 1], null),
  })).filter(mission => mission.originalId);
}

function exportITGoals() {
  const sheet = ss.getSheetByName(SCHEMA.IT_GOALS.NAME);
  if (!sheet) {
    Logger.log('⚠️  Info: ITGoals sheet not found (optional)');
    return [];
  }

  const data = sheet.getDataRange().getValues();

  return data.slice(1).map((row, index) => ({
    originalRowNumber: index + 2,
    originalId: row[SCHEMA.IT_GOALS.ID - 1],
    name: row[SCHEMA.IT_GOALS.NAME_COL - 1],
    hospMissionId: row[SCHEMA.IT_GOALS.HOSP_MISSION_ID - 1],
  })).filter(goal => goal.originalId);
}

function exportActionPlans() {
  const sheet = ss.getSheetByName(SCHEMA.ACTION_PLANS.NAME);
  if (!sheet) {
    Logger.log('⚠️  Info: ActionPlans sheet not found (optional)');
    return [];
  }

  const data = sheet.getDataRange().getValues();

  return data.slice(1).map((row, index) => ({
    originalRowNumber: index + 2,
    originalId: row[SCHEMA.ACTION_PLANS.ID - 1],
    name: row[SCHEMA.ACTION_PLANS.NAME_COL - 1],
    hospMissionId: row[SCHEMA.ACTION_PLANS.HOSP_MISSION_ID - 1],
    itGoalIds: parseJSONField(row[SCHEMA.ACTION_PLANS.IT_GOAL_IDS - 1]),
  })).filter(plan => plan.originalId);
}

function exportRequests() {
  const sheet = ss.getSheetByName(SCHEMA.REQUESTS.NAME);
  if (!sheet) {
    Logger.log('⚠️  Info: Requests sheet not found (optional)');
    return [];
  }

  const data = sheet.getDataRange().getValues();

  return data.slice(1).map((row, index) => ({
    originalRowNumber: index + 2,
    originalId: row[SCHEMA.REQUESTS.ID - 1],
    userId: row[SCHEMA.REQUESTS.USER_ID - 1],
    requestType: row[SCHEMA.REQUESTS.REQUEST_TYPE - 1],
    requestDescription: row[SCHEMA.REQUESTS.REQUEST_DESCRIPTION - 1] || null,
    requestName: row[SCHEMA.REQUESTS.REQUEST_NAME - 1] || null,
    createdAt: row[SCHEMA.REQUESTS.CREATED_AT - 1] || null,
    taskId: row[SCHEMA.REQUESTS.TASK_ID - 1] || null,
    requestPurpose: row[SCHEMA.REQUESTS.REQUEST_PURPOSE - 1] || null,
    requestPurposeDetails: row[SCHEMA.REQUESTS.REQUEST_PURPOSE_DETAILS - 1] || null,
    requestDaysDemanded: parseInteger(row[SCHEMA.REQUESTS.REQUEST_DAYS_DEMANDED - 1], null),
    requestDaysNeeded: parseInteger(row[SCHEMA.REQUESTS.REQUEST_DAYS_NEEDED - 1], null),
    userTel: row[SCHEMA.REQUESTS.USER_TEL - 1] || null,
  })).filter(req => req.originalId);
}

function exportConfig() {
  const sheet = ss.getSheetByName(SCHEMA.CONFIG.NAME);
  if (!sheet) {
    Logger.log('⚠️  Info: Config sheet not found (optional)');
    return [];
  }

  const data = sheet.getDataRange().getValues();

  return data.slice(1).map((row, index) => ({
    originalRowNumber: index + 2,
    originalId: row[SCHEMA.CONFIG.ID - 1],
    configKey: row[SCHEMA.CONFIG.CONFIG_KEY - 1],
    configValue: row[SCHEMA.CONFIG.CONFIG_VALUE - 1],
  })).filter(cfg => cfg.originalId);
}

function exportPermissions() {
  const sheet = ss.getSheetByName(SCHEMA.PERMISSIONS.NAME);
  if (!sheet) {
    Logger.log('⚠️  Info: Permissions sheet not found (optional)');
    return [];
  }

  const data = sheet.getDataRange().getValues();

  return data.slice(1).map((row, index) => ({
    originalRowNumber: index + 2,
    permissionKey: row[SCHEMA.PERMISSIONS.PERMISSION_KEY - 1],
    permissionName: row[SCHEMA.PERMISSIONS.PERMISSION_NAME - 1],
    category: row[SCHEMA.PERMISSIONS.CATEGORY - 1] || null,
  })).filter(perm => perm.permissionKey);
}

function exportRolePermissions() {
  const sheet = ss.getSheetByName(SCHEMA.ROLE_PERMISSIONS.NAME);
  if (!sheet) {
    Logger.log('⚠️  Info: RolePermissions sheet not found (optional)');
    return [];
  }

  const data = sheet.getDataRange().getValues();

  return data.slice(1).map((row, index) => ({
    originalRowNumber: index + 2,
    roleName: row[SCHEMA.ROLE_PERMISSIONS.ROLE_NAME - 1],
    permissionKey: row[SCHEMA.ROLE_PERMISSIONS.PERMISSION_KEY - 1],
    allowed: parseBoolean(row[SCHEMA.ROLE_PERMISSIONS.ALLOWED - 1]),
  })).filter(rp => rp.roleName && rp.permissionKey);
}

function exportPhases() {
  const sheet = ss.getSheetByName(SCHEMA.PHASES.NAME);
  if (!sheet) {
    Logger.log('⚠️  Info: Phases sheet not found (optional)');
    return [];
  }

  const data = sheet.getDataRange().getValues();

  return data.slice(1).map((row, index) => ({
    originalRowNumber: index + 2,
    originalId: row[SCHEMA.PHASES.ID - 1],
    name: row[SCHEMA.PHASES.NAME_COL - 1],
    phaseOrder: parseInteger(row[SCHEMA.PHASES.PHASE_ORDER - 1], 0),
    projectId: row[SCHEMA.PHASES.PROJECT_ID - 1],
    startDate: row[SCHEMA.PHASES.START_DATE - 1] || null,
    endDate: row[SCHEMA.PHASES.END_DATE - 1] || null,
  })).filter(phase => phase.originalId);
}

// ========================================
// MAIN EXPORT FUNCTION
// ========================================

function exportAllDataForMigration() {
  Logger.log('========================================');
  Logger.log('ProjectFlow Data Export v2.0 Starting...');
  Logger.log('========================================\n');

  const startTime = new Date();

  // Export core tables (1-9)
  Logger.log('Exporting Core Tables (1-9)...');
  const users = exportUsers();
  Logger.log(`✅ Users: ${users.length} records`);

  const sessions = exportSessions();
  Logger.log(`✅ Sessions: ${sessions.length} records`);

  const missionGroups = exportMissionGroups();
  Logger.log(`✅ MissionGroups: ${missionGroups.length} records`);

  const divisions = exportDivisions();
  Logger.log(`✅ Divisions: ${divisions.length} records`);

  const departments = exportDepartments();
  Logger.log(`✅ Departments: ${departments.length} records`);

  const projects = exportProjects();
  Logger.log(`✅ Projects: ${projects.length} records`);

  const tasks = exportTasks();
  Logger.log(`✅ Tasks: ${tasks.length} records`);

  const statuses = exportStatuses();
  Logger.log(`✅ Statuses: ${statuses.length} records`);

  const notifications = exportNotifications();
  Logger.log(`✅ Notifications: ${notifications.length} records`);

  // Export additional tables (10-21)
  Logger.log('\nExporting Additional Tables (10-21)...');

  const comments = exportComments();
  Logger.log(`✅ Comments: ${comments.length} records`);

  const checklists = exportChecklists();
  Logger.log(`✅ Checklists: ${checklists.length} records`);

  const history = exportHistory();
  Logger.log(`✅ History: ${history.length} records`);

  const holidays = exportHolidays();
  Logger.log(`✅ Holidays: ${holidays.length} records`);

  const hospMissions = exportHospMissions();
  Logger.log(`✅ HospMissions: ${hospMissions.length} records`);

  const itGoals = exportITGoals();
  Logger.log(`✅ ITGoals: ${itGoals.length} records`);

  const actionPlans = exportActionPlans();
  Logger.log(`✅ ActionPlans: ${actionPlans.length} records`);

  const requests = exportRequests();
  Logger.log(`✅ Requests: ${requests.length} records`);

  const config = exportConfig();
  Logger.log(`✅ Config: ${config.length} records`);

  const permissions = exportPermissions();
  Logger.log(`✅ Permissions: ${permissions.length} records`);

  const rolePermissions = exportRolePermissions();
  Logger.log(`✅ RolePermissions: ${rolePermissions.length} records`);

  const phases = exportPhases();
  Logger.log(`✅ Phases: ${phases.length} records`);

  // Compile all data
  const data = {
    exportMetadata: {
      exportDate: new Date().toISOString(),
      version: '2.0',
      spreadsheetId: ss.getId(),
      spreadsheetName: ss.getName(),
      totalTables: 21,
      note: 'Complete export from original GAS project (all 21 tables)',
    },
    users: users,
    sessions: sessions,
    missionGroups: missionGroups,
    divisions: divisions,
    departments: departments,
    projects: projects,
    tasks: tasks,
    statuses: statuses,
    notifications: notifications,
    comments: comments,
    checklists: checklists,
    history: history,
    holidays: holidays,
    hospMissions: hospMissions,
    itGoals: itGoals,
    actionPlans: actionPlans,
    requests: requests,
    config: config,
    permissions: permissions,
    rolePermissions: rolePermissions,
    phases: phases,
  };

  // Calculate totals
  const totalRecords =
    users.length + sessions.length + missionGroups.length + divisions.length +
    departments.length + projects.length + tasks.length + statuses.length +
    notifications.length + comments.length + checklists.length + history.length +
    holidays.length + hospMissions.length + itGoals.length + actionPlans.length +
    requests.length + config.length + permissions.length + rolePermissions.length +
    phases.length;

  const endTime = new Date();
  const duration = (endTime - startTime) / 1000; // seconds

  Logger.log('\n========================================');
  Logger.log('Export Summary:');
  Logger.log('========================================');
  Logger.log(`Total Records: ${totalRecords}`);
  Logger.log(`Total Tables: 21`);
  Logger.log(`Duration: ${duration.toFixed(2)} seconds`);
  Logger.log(`Timestamp: ${new Date().toISOString()}`);
  Logger.log('========================================\n');
  Logger.log('✅ Export completed successfully!');
  Logger.log('\nNext steps:');
  Logger.log('1. Copy the JSON output below');
  Logger.log('2. Save to file: migration_data.json');
  Logger.log('3. Verify the file is valid JSON');
  Logger.log('4. Keep the file secure (contains password hashes)');
  Logger.log('5. Use import script to migrate to PostgreSQL');
  Logger.log('\n========================================');
  Logger.log('JSON OUTPUT (Copy everything below):');
  Logger.log('========================================\n');

  // Convert to JSON
  const jsonOutput = JSON.stringify(data, null, 2);

  Logger.log(jsonOutput);

  Logger.log('\n========================================');
  Logger.log('END OF JSON OUTPUT');
  Logger.log('========================================');

  return jsonOutput;
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

function checkAllSheetsExist() {
  Logger.log('Checking if all sheets exist...\n');

  const coreSheets = [
    'Users', 'UserSessions', 'MissionGroups', 'Divisions', 'Departments',
    'Projects', 'Tasks', 'Statuses', 'Notifications'
  ];

  const additionalSheets = [
    'Comments', 'Checklists', 'History', 'Holidays', 'HospMissions',
    'ITGoals', 'ActionPlans', 'Requests', 'Config', 'Permissions',
    'RolePermissions', 'Phases'
  ];

  let allCore = true;

  Logger.log('Core Sheets (Required):');
  coreSheets.forEach(sheetName => {
    const exists = sheetExists(sheetName);
    Logger.log(`${exists ? '✅' : '❌'} ${sheetName}`);
    if (!exists) allCore = false;
  });

  Logger.log('\nAdditional Sheets (Optional but recommended):');
  additionalSheets.forEach(sheetName => {
    const exists = sheetExists(sheetName);
    Logger.log(`${exists ? '✅' : 'ℹ️ '} ${sheetName}`);
  });

  Logger.log('\n========================================');
  if (allCore) {
    Logger.log('✅ All core sheets exist! Ready to export.');
    Logger.log(`📊 Total: ${coreSheets.length} core + ${additionalSheets.length} additional = 21 tables`);
  } else {
    Logger.log('❌ Some core sheets are missing. Please create them first.');
  }
  Logger.log('========================================');

  return allCore;
}

function testExportUsers() {
  Logger.log('Testing Users export...\n');
  const users = exportUsers();
  Logger.log(`Found ${users.length} users`);
  Logger.log('\nSample (first 3 users):');
  Logger.log(JSON.stringify(users.slice(0, 3), null, 2));
  return users;
}

function countAllRecords() {
  Logger.log('Counting records in all tables...\n');

  const counts = {
    users: exportUsers().length,
    sessions: exportSessions().length,
    missionGroups: exportMissionGroups().length,
    divisions: exportDivisions().length,
    departments: exportDepartments().length,
    projects: exportProjects().length,
    tasks: exportTasks().length,
    statuses: exportStatuses().length,
    notifications: exportNotifications().length,
    comments: exportComments().length,
    checklists: exportChecklists().length,
    history: exportHistory().length,
    holidays: exportHolidays().length,
    hospMissions: exportHospMissions().length,
    itGoals: exportITGoals().length,
    actionPlans: exportActionPlans().length,
    requests: exportRequests().length,
    config: exportConfig().length,
    permissions: exportPermissions().length,
    rolePermissions: exportRolePermissions().length,
    phases: exportPhases().length,
  };

  Logger.log('Record Counts:');
  Logger.log('========================================');
  Object.keys(counts).forEach(key => {
    Logger.log(`${key}: ${counts[key]}`);
  });

  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
  Logger.log('========================================');
  Logger.log(`TOTAL: ${total} records across 21 tables`);

  return counts;
}

// ========================================
// SOLUTION FOR "OUTPUT TOO LARGE" PROBLEM
// ========================================

/**
 * Export all data and save directly to Google Drive
 * Use this if the log output is too large to copy
 *
 * @returns {string} Google Drive file URL
 */
function exportToGoogleDrive() {
  Logger.log('========================================');
  Logger.log('Exporting to Google Drive...');
  Logger.log('========================================');

  const startTime = new Date();

  // Get all data (this returns JSON string)
  const jsonOutput = exportAllDataForMigration();

  // Create filename with timestamp
  const timestamp = Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone(),
    'yyyyMMdd_HHmmss'
  );
  const fileName = `ProjectFlow_Migration_Data_${timestamp}.json`;

  // Save to Google Drive
  const file = DriveApp.createFile(fileName, jsonOutput, 'application/json');

  const duration = ((new Date() - startTime) / 1000).toFixed(2);

  Logger.log('');
  Logger.log('========================================');
  Logger.log('✅ Export to Google Drive Successful!');
  Logger.log('========================================');
  Logger.log(`File Name: ${fileName}`);
  Logger.log(`File ID: ${file.getId()}`);
  Logger.log(`File Size: ${(file.getSize() / 1024).toFixed(2)} KB`);
  Logger.log(`Duration: ${duration} seconds`);
  Logger.log('');
  Logger.log('File URL:');
  Logger.log(file.getUrl());
  Logger.log('');
  Logger.log('========================================');
  Logger.log('Next Steps:');
  Logger.log('1. Click the URL above to open the file');
  Logger.log('2. Download the JSON file');
  Logger.log('3. Verify it\'s valid JSON');
  Logger.log('4. Keep the file secure (contains sensitive data)');
  Logger.log('5. Use the import script for migration');
  Logger.log('========================================');

  return file.getUrl();
}

/**
 * Export in batches to avoid log size limit
 * Option 1: Export only Core Tables (9 tables)
 *
 * @returns {object} JSON object with core tables only
 */
function exportCoreTables() {
  Logger.log('========================================');
  Logger.log('Exporting CORE TABLES ONLY (9 tables)');
  Logger.log('========================================');

  const startTime = new Date();

  Logger.log('Exporting core tables...');
  const users = exportUsers();
  Logger.log(`✅ Users: ${users.length} records`);

  const sessions = exportSessions();
  Logger.log(`✅ Sessions: ${sessions.length} records`);

  const missionGroups = exportMissionGroups();
  Logger.log(`✅ MissionGroups: ${missionGroups.length} records`);

  const divisions = exportDivisions();
  Logger.log(`✅ Divisions: ${divisions.length} records`);

  const departments = exportDepartments();
  Logger.log(`✅ Departments: ${departments.length} records`);

  const projects = exportProjects();
  Logger.log(`✅ Projects: ${projects.length} records`);

  const tasks = exportTasks();
  Logger.log(`✅ Tasks: ${tasks.length} records`);

  const statuses = exportStatuses();
  Logger.log(`✅ Statuses: ${statuses.length} records`);

  const notifications = exportNotifications();
  Logger.log(`✅ Notifications: ${notifications.length} records`);

  const duration = ((new Date() - startTime) / 1000).toFixed(2);
  const totalRecords = users.length + sessions.length + missionGroups.length +
                       divisions.length + departments.length + projects.length +
                       tasks.length + statuses.length + notifications.length;

  Logger.log('');
  Logger.log('========================================');
  Logger.log('Core Tables Export Summary:');
  Logger.log('========================================');
  Logger.log(`Total Records: ${totalRecords}`);
  Logger.log(`Total Tables: 9`);
  Logger.log(`Duration: ${duration} seconds`);
  Logger.log('========================================');

  const data = {
    exportMetadata: {
      exportDate: new Date().toISOString(),
      version: '2.0',
      spreadsheetId: SpreadsheetApp.getActiveSpreadsheet().getId(),
      spreadsheetName: SpreadsheetApp.getActiveSpreadsheet().getName(),
      exportType: 'CORE_TABLES_ONLY',
      totalTables: 9,
      totalRecords: totalRecords,
      duration: duration,
    },
    users: users,
    sessions: sessions,
    missionGroups: missionGroups,
    divisions: divisions,
    departments: departments,
    projects: projects,
    tasks: tasks,
    statuses: statuses,
    notifications: notifications,
  };

  Logger.log('');
  Logger.log('========================================');
  Logger.log('JSON OUTPUT (Copy below):');
  Logger.log('========================================');
  Logger.log(JSON.stringify(data, null, 2));
  Logger.log('========================================');
  Logger.log('END OF JSON OUTPUT');
  Logger.log('========================================');

  return data;
}

/**
 * Export in batches to avoid log size limit
 * Option 2: Export only Additional Tables (12 tables)
 *
 * @returns {object} JSON object with additional tables only
 */
function exportAdditionalTables() {
  Logger.log('========================================');
  Logger.log('Exporting ADDITIONAL TABLES ONLY (12 tables)');
  Logger.log('========================================');

  const startTime = new Date();

  Logger.log('Exporting additional tables...');
  const comments = exportComments();
  Logger.log(`✅ Comments: ${comments.length} records`);

  const checklists = exportChecklists();
  Logger.log(`✅ Checklists: ${checklists.length} records`);

  const history = exportHistory();
  Logger.log(`✅ History: ${history.length} records`);

  const holidays = exportHolidays();
  Logger.log(`✅ Holidays: ${holidays.length} records`);

  const hospMissions = exportHospMissions();
  Logger.log(`✅ HospMissions: ${hospMissions.length} records`);

  const itGoals = exportITGoals();
  Logger.log(`✅ ITGoals: ${itGoals.length} records`);

  const actionPlans = exportActionPlans();
  Logger.log(`✅ ActionPlans: ${actionPlans.length} records`);

  const requests = exportRequests();
  Logger.log(`✅ Requests: ${requests.length} records`);

  const config = exportConfig();
  Logger.log(`✅ Config: ${config.length} records`);

  const permissions = exportPermissions();
  Logger.log(`✅ Permissions: ${permissions.length} records`);

  const rolePermissions = exportRolePermissions();
  Logger.log(`✅ RolePermissions: ${rolePermissions.length} records`);

  const phases = exportPhases();
  Logger.log(`✅ Phases: ${phases.length} records`);

  const duration = ((new Date() - startTime) / 1000).toFixed(2);
  const totalRecords = comments.length + checklists.length + history.length +
                       holidays.length + hospMissions.length + itGoals.length +
                       actionPlans.length + requests.length + config.length +
                       permissions.length + rolePermissions.length + phases.length;

  Logger.log('');
  Logger.log('========================================');
  Logger.log('Additional Tables Export Summary:');
  Logger.log('========================================');
  Logger.log(`Total Records: ${totalRecords}`);
  Logger.log(`Total Tables: 12`);
  Logger.log(`Duration: ${duration} seconds`);
  Logger.log('========================================');

  const data = {
    exportMetadata: {
      exportDate: new Date().toISOString(),
      version: '2.0',
      spreadsheetId: SpreadsheetApp.getActiveSpreadsheet().getId(),
      spreadsheetName: SpreadsheetApp.getActiveSpreadsheet().getName(),
      exportType: 'ADDITIONAL_TABLES_ONLY',
      totalTables: 12,
      totalRecords: totalRecords,
      duration: duration,
    },
    comments: comments,
    checklists: checklists,
    history: history,
    holidays: holidays,
    hospMissions: hospMissions,
    itGoals: itGoals,
    actionPlans: actionPlans,
    requests: requests,
    config: config,
    permissions: permissions,
    rolePermissions: rolePermissions,
    phases: phases,
  };

  Logger.log('');
  Logger.log('========================================');
  Logger.log('JSON OUTPUT (Copy below):');
  Logger.log('========================================');
  Logger.log(JSON.stringify(data, null, 2));
  Logger.log('========================================');
  Logger.log('END OF JSON OUTPUT');
  Logger.log('========================================');

  return data;
}

/**
 * Save Core Tables to Google Drive
 * Use this if full export is too large
 *
 * @returns {string} Google Drive file URL
 */
function exportCoreToGoogleDrive() {
  Logger.log('Exporting Core Tables to Google Drive...');

  const jsonOutput = JSON.stringify(exportCoreTables(), null, 2);

  const timestamp = Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone(),
    'yyyyMMdd_HHmmss'
  );
  const fileName = `ProjectFlow_CoreTables_${timestamp}.json`;

  const file = DriveApp.createFile(fileName, jsonOutput, 'application/json');

  Logger.log('✅ Core Tables saved to Google Drive');
  Logger.log(`File: ${fileName}`);
  Logger.log(`URL: ${file.getUrl()}`);

  return file.getUrl();
}

/**
 * Save Additional Tables to Google Drive
 * Use this if full export is too large
 *
 * @returns {string} Google Drive file URL
 */
function exportAdditionalToGoogleDrive() {
  Logger.log('Exporting Additional Tables to Google Drive...');

  const jsonOutput = JSON.stringify(exportAdditionalTables(), null, 2);

  const timestamp = Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone(),
    'yyyyMMdd_HHmmss'
  );
  const fileName = `ProjectFlow_AdditionalTables_${timestamp}.json`;

  const file = DriveApp.createFile(fileName, jsonOutput, 'application/json');

  Logger.log('✅ Additional Tables saved to Google Drive');
  Logger.log(`File: ${fileName}`);
  Logger.log(`URL: ${file.getUrl()}`);

  return file.getUrl();
}
