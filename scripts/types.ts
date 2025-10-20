// Type definitions for migration data
// Based on export script v2.0 (21 tables)

export interface ExportMetadata {
  exportDate: string;
  version: string;
  spreadsheetId: string;
  spreadsheetName: string;
  totalTables: number;
  totalRecords?: number;
  duration?: string;
  note?: string;
}

export interface ExportedUser {
  originalRowNumber: number;
  email: string; // Changed from originalId
  fullName: string;
  passwordHash: string;
  salt: string;
  role: string;
  profileImageUrl?: string;
  departmentId?: string;
  isVerified: boolean;
  verificationToken?: string;
  resetToken?: string;
  resetTokenExpiry?: string;
  userStatus: string;
  jobTitle?: string;
  jobLevel?: string;
  pinnedTasks?: any; // JSON
  additionalRoles?: any; // JSON
}

export interface ExportedSession {
  originalRowNumber: number;
  sessionToken: string;
  userId: string; // email
  expiryTimestamp: string;
}

export interface ExportedMissionGroup {
  originalRowNumber: number;
  originalId: string;
  name: string;
  chiefUserId?: string; // email
}

export interface ExportedDivision {
  originalRowNumber: number;
  originalId: string;
  name: string;
  missionGroupId: string;
  leaderUserId?: string; // email
}

export interface ExportedDepartment {
  originalRowNumber: number;
  originalId: string;
  name: string;
  divisionId: string;
  headUserId?: string; // email
  tel?: string;
}

export interface ExportedProject {
  originalRowNumber: number;
  originalId: string;
  name: string;
  description?: string;
  departmentId: string;
  ownerUserId: string; // email
  actionPlanId?: string;
  dateDeleted?: string;
  userDeletedId?: string; // email
  status?: string;
}

export interface ExportedTask {
  originalRowNumber: number;
  originalId: string;
  name: string;
  projectId: string;
  description?: string;
  assigneeUserId?: string; // email
  statusId: string;
  priority: number;
  startDate?: string;
  dueDate?: string;
  parentTaskId?: string;
  creatorUserId: string; // email
  closeDate?: string;
  difficulty?: number;
  isClosed: boolean;
  closeType?: string;
  userClosedId?: string; // email
}

export interface ExportedStatus {
  originalRowNumber: number;
  originalId: string;
  name: string;
  color: string;
  order: number;
  type: string;
  projectId: string;
}

export interface ExportedComment {
  originalRowNumber: number;
  originalId: string;
  taskId: string;
  commentorUserId: string; // email
  commentText: string;
  mentions?: any; // JSON
  createdAt: string;
}

export interface ExportedChecklist {
  originalRowNumber: number;
  originalId: string;
  name: string;
  isChecked: boolean;
  creatorUserId: string; // email
  createdDate: string;
  taskId: string;
}

export interface ExportedHistory {
  originalRowNumber: number;
  originalId: string;
  historyText: string;
  historyDate: string;
  taskId: string;
  userId: string; // email
}

export interface ExportedNotification {
  originalRowNumber: number;
  originalId: string;
  userId: string; // email
  triggeredByUserId?: string; // email
  type: string;
  message: string;
  taskId?: string;
  createdAt: string;
  isRead: boolean;
}

export interface ExportedHoliday {
  originalRowNumber: number;
  date: string; // Primary key
  name: string;
}

export interface ExportedHospitalMission {
  originalRowNumber: number;
  originalId: string;
  name: string;
  description?: string;
  startYear?: number;
  endYear?: number;
}

export interface ExportedITGoal {
  originalRowNumber: number;
  originalId: string;
  name: string;
  hospMissionId: string;
}

export interface ExportedActionPlan {
  originalRowNumber: number;
  originalId: string;
  name: string;
  hospMissionId: string;
  itGoalIds?: any; // JSON array
}

export interface ExportedRequest {
  originalRowNumber: number;
  originalId: string;
  userId: string; // email
  requestType: string;
  description?: string;
  name?: string;
  taskId?: string;
  purpose?: string;
  purposeDetails?: string;
  daysDemanded?: number;
  daysNeeded?: number;
  userTel?: string;
  createdAt: string;
}

export interface ExportedConfig {
  originalRowNumber: number;
  originalId: string;
  configKey: string;
  configValue: string;
}

export interface ExportedPermission {
  originalRowNumber: number;
  permissionKey: string; // Primary key
  permissionName: string;
  category: string;
}

export interface ExportedRolePermission {
  originalRowNumber: number;
  roleName: string;
  permissionKey: string;
  allowed: boolean;
}

export interface ExportedPhase {
  originalRowNumber: number;
  originalId: string;
  name: string;
  phaseOrder: number;
  projectId: string;
  startDate?: string;
  endDate?: string;
}

// Main export data structure
export interface MigrationData {
  exportMetadata: ExportMetadata;
  users: ExportedUser[];
  sessions: ExportedSession[];
  missionGroups: ExportedMissionGroup[];
  divisions: ExportedDivision[];
  departments: ExportedDepartment[];
  projects: ExportedProject[];
  tasks: ExportedTask[];
  statuses: ExportedStatus[];
  comments: ExportedComment[];
  checklists: ExportedChecklist[];
  history: ExportedHistory[];
  notifications: ExportedNotification[];
  holidays: ExportedHoliday[];
  hospMissions: ExportedHospitalMission[];
  itGoals: ExportedITGoal[];
  actionPlans: ExportedActionPlan[];
  requests: ExportedRequest[];
  config: ExportedConfig[];
  permissions: ExportedPermission[];
  rolePermissions: ExportedRolePermission[];
  phases: ExportedPhase[];
}

// ID mapping type for tracking old ID → new ID
export interface IdMaps {
  users: Map<string, string>;          // email → cuid
  missionGroups: Map<string, string>;  // old ID → cuid
  divisions: Map<string, string>;
  departments: Map<string, string>;
  projects: Map<string, string>;
  tasks: Map<string, string>;
  statuses: Map<string, string>;
  hospitalMissions: Map<string, string>;
  itGoals: Map<string, string>;
  actionPlans: Map<string, string>;
  phases: Map<string, string>;
}
