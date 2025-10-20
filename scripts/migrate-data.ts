#!/usr/bin/env ts-node

/**
 * ProjectFlow Data Migration Script
 * Migrates data from Google Sheets export (JSON) to PostgreSQL
 *
 * Version: 2.0
 * Tables: 21 (Complete schema)
 *
 * Usage:
 *   npm run migrate
 *   or
 *   ts-node scripts/migrate-data.ts
 */

import { PrismaClient } from '../src/generated/prisma';
import fs from 'fs';
import path from 'path';
import type { MigrationData, IdMaps } from './types';
import {
  mapUserRole,
  mapUserStatus,
  mapProjectStatus,
  mapStatusType,
  mapCloseType,
  mapNotificationType,
  parseJSON,
  parseDate,
  parseIntSafe,
  parseBool,
  cleanString,
  normalizePriority,
  normalizeDifficulty,
  logProgress,
  logError,
  createStats,
  formatDuration,
  validateRequired,
} from './helpers';

const prisma = new PrismaClient();

// ============================================
// MAIN MIGRATION FUNCTION
// ============================================

async function main() {
  const startTime = Date.now();
  logProgress('🚀', 'ProjectFlow Data Migration v2.0 Starting...\n');

  // Read migration data
  const dataPath = path.join(process.cwd(), 'migration_data.json');
  if (!fs.existsSync(dataPath)) {
    throw new Error(`Migration file not found: ${dataPath}`);
  }

  logProgress('📂', 'Reading migration data...');
  const rawData = fs.readFileSync(dataPath, 'utf-8');
  const data: MigrationData = JSON.parse(rawData);

  logProgress('✅', `Loaded ${data.exportMetadata.totalTables} tables`);
  logProgress('📊', `Export version: ${data.exportMetadata.version}`);
  logProgress('📅', `Export date: ${data.exportMetadata.exportDate}\n`);

  // Initialize ID mapping
  const idMaps: IdMaps = {
    users: new Map(),
    missionGroups: new Map(),
    divisions: new Map(),
    departments: new Map(),
    projects: new Map(),
    tasks: new Map(),
    statuses: new Map(),
    hospitalMissions: new Map(),
    itGoals: new Map(),
    actionPlans: new Map(),
    phases: new Map(),
  };

  const stats = createStats();

  try {
    // Use a single transaction for all operations
    await prisma.$transaction(async (tx) => {
      // STEP 1: Users (must be first - many dependencies)
      await migrateUsers(tx, data, idMaps, stats);

      // STEP 2: Organization Structure
      await migrateMissionGroups(tx, data, idMaps, stats);
      await migrateDivisions(tx, data, idMaps, stats);
      await migrateDepartments(tx, data, idMaps, stats);

      // STEP 3: Update Users with departmentId (now that departments exist)
      await updateUserDepartments(tx, data, idMaps, stats);

      // STEP 4: Update org structure leaders (now that users have departments)
      await updateOrgLeaders(tx, data, idMaps, stats);

      // STEP 5: Hospital Missions & Strategic Planning
      await migrateHospitalMissions(tx, data, idMaps, stats);
      await migrateITGoals(tx, data, idMaps, stats);
      await migrateActionPlans(tx, data, idMaps, stats);

      // STEP 6: Projects
      await migrateProjects(tx, data, idMaps, stats);

      // STEP 7: Statuses (must be before tasks)
      await migrateStatuses(tx, data, idMaps, stats);

      // STEP 8: Tasks
      await migrateTasks(tx, data, idMaps, stats);

      // STEP 9: Task Details
      await migrateComments(tx, data, idMaps, stats);
      await migrateChecklists(tx, data, idMaps, stats);
      await migrateHistory(tx, data, idMaps, stats);

      // STEP 10: Notifications
      await migrateNotifications(tx, data, idMaps, stats);

      // STEP 11: Sessions
      await migrateSessions(tx, data, idMaps, stats);

      // STEP 12: Phases
      await migratePhases(tx, data, idMaps, stats);

      // STEP 13: Additional tables
      await migrateHolidays(tx, data, stats);
      await migrateRequests(tx, data, idMaps, stats);
      await migrateConfig(tx, data, stats);
      await migratePermissions(tx, data, stats);
      await migrateRolePermissions(tx, data, stats);
    }, {
      maxWait: 60000, // 1 minute
      timeout: 600000, // 10 minutes
    });

    // Print final summary
    const duration = (Date.now() - startTime) / 1000;
    printSummary(stats, duration);

    logProgress('✅', '\nMigration completed successfully! 🎉\n');

  } catch (error) {
    logError('Migration', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// ============================================
// MIGRATION FUNCTIONS (21 TABLES)
// ============================================

async function migrateUsers(tx: any, data: MigrationData, idMaps: IdMaps, stats: any) {
  logProgress('📦', `Migrating Users (total: ${data.users.length})...`);

  // Validate data first
  if (!data.users || data.users.length === 0) {
    logError('migrateUsers', new Error('No users in migration data!'));
    return;
  }

  let errors = 0;
  for (const user of data.users) {
    try {
      // Validate required fields
      if (!user.email) {
        logError(`migrateUsers: Missing email`, new Error('Email is required'), user);
        errors++;
        continue;
      }
      if (!user.fullName) {
        logError(`migrateUsers: Missing fullName`, new Error('Full name is required'), user);
        errors++;
        continue;
      }
      if (!user.passwordHash) {
        logError(`migrateUsers: Missing passwordHash for ${user.email}`, new Error('Password hash is required'), user);
        errors++;
        continue;
      }
      if (!user.salt) {
        logError(`migrateUsers: Missing salt for ${user.email}`, new Error('Salt is required'), user);
        errors++;
        continue;
      }

      const created = await tx.user.create({
        data: {
          email: user.email,
          fullName: user.fullName,
          passwordHash: user.passwordHash,
          salt: user.salt,
          role: mapUserRole(user.role),
          profileImageUrl: cleanString(user.profileImageUrl),
          isVerified: parseBool(user.isVerified),
          verificationToken: cleanString(user.verificationToken),
          resetToken: cleanString(user.resetToken),
          resetTokenExpiry: parseDate(user.resetTokenExpiry),
          userStatus: mapUserStatus(user.userStatus),
          jobTitle: cleanString(user.jobTitle),
          jobLevel: cleanString(user.jobLevel),
          pinnedTasks: parseJSON(user.pinnedTasks),
          additionalRoles: parseJSON(user.additionalRoles),
          // departmentId will be set later
        },
      });
      idMaps.users.set(user.email, created.id);
      stats.users++;
    } catch (error: any) {
      errors++;
      logError(`migrateUsers (${user.email})`, error, {
        email: user.email,
        fullName: user.fullName,
        hasPassword: !!user.passwordHash,
        hasSalt: !!user.salt,
        role: user.role,
      });
    }
  }
  logProgress('✅', `Migrated ${stats.users} users (${errors} errors)\n`);
}

async function migrateMissionGroups(tx: any, data: MigrationData, idMaps: IdMaps, stats: any) {
  logProgress('📦', 'Migrating Mission Groups...');
  for (const mg of data.missionGroups) {
    try {
      const created = await tx.missionGroup.create({
        data: {
          name: mg.name,
          // chiefUserId will be set later
        },
      });
      idMaps.missionGroups.set(mg.originalId, created.id);
      stats.missionGroups++;
    } catch (error) {
      logError(`migrateMissionGroups (${mg.name})`, error, mg);
    }
  }
  logProgress('✅', `Migrated ${stats.missionGroups} mission groups\n`);
}

async function migrateDivisions(tx: any, data: MigrationData, idMaps: IdMaps, stats: any) {
  logProgress('📦', 'Migrating Divisions...');
  for (const div of data.divisions) {
    try {
      const missionGroupId = idMaps.missionGroups.get(div.missionGroupId);
      if (!missionGroupId) {
        logError(`migrateDivisions: Mission Group not found`, new Error(`Missing: ${div.missionGroupId}`), div);
        continue;
      }

      const created = await tx.division.create({
        data: {
          name: div.name,
          missionGroupId: missionGroupId,
          // leaderUserId will be set later
        },
      });
      idMaps.divisions.set(div.originalId, created.id);
      stats.divisions++;
    } catch (error) {
      logError(`migrateDivisions (${div.name})`, error, div);
    }
  }
  logProgress('✅', `Migrated ${stats.divisions} divisions\n`);
}

async function migrateDepartments(tx: any, data: MigrationData, idMaps: IdMaps, stats: any) {
  logProgress('📦', 'Migrating Departments...');
  for (const dept of data.departments) {
    try {
      const divisionId = idMaps.divisions.get(dept.divisionId);
      if (!divisionId) {
        logError(`migrateDepartments: Division not found`, new Error(`Missing: ${dept.divisionId}`), dept);
        continue;
      }

      const created = await tx.department.create({
        data: {
          name: dept.name,
          divisionId: divisionId,
          tel: cleanString(dept.tel),
          // headUserId will be set later
        },
      });
      idMaps.departments.set(dept.originalId, created.id);
      stats.departments++;
    } catch (error) {
      logError(`migrateDepartments (${dept.name})`, error, dept);
    }
  }
  logProgress('✅', `Migrated ${stats.departments} departments\n`);
}

async function updateUserDepartments(tx: any, data: MigrationData, idMaps: IdMaps, stats: any) {
  logProgress('📦', 'Updating user departments...');
  let updated = 0;
  for (const user of data.users) {
    if (user.departmentId) {
      const newUserId = idMaps.users.get(user.email);
      const newDeptId = idMaps.departments.get(user.departmentId);

      if (newUserId && newDeptId) {
        try {
          await tx.user.update({
            where: { id: newUserId },
            data: { departmentId: newDeptId },
          });
          updated++;
        } catch (error) {
          logError(`updateUserDepartments (${user.email})`, error);
        }
      }
    }
  }
  logProgress('✅', `Updated ${updated} user departments\n`);
}

async function updateOrgLeaders(tx: any, data: MigrationData, idMaps: IdMaps, stats: any) {
  logProgress('📦', 'Updating organization leaders...');

  // Update Mission Group Chiefs
  for (const mg of data.missionGroups) {
    if (mg.chiefUserId) {
      const mgId = idMaps.missionGroups.get(mg.originalId);
      const chiefId = idMaps.users.get(mg.chiefUserId);
      if (mgId && chiefId) {
        try {
          await tx.missionGroup.update({
            where: { id: mgId },
            data: { chiefUserId: chiefId },
          });
        } catch (error) {
          logError(`updateOrgLeaders: Mission Group ${mg.name}`, error);
        }
      }
    }
  }

  // Update Division Leaders
  for (const div of data.divisions) {
    if (div.leaderUserId) {
      const divId = idMaps.divisions.get(div.originalId);
      const leaderId = idMaps.users.get(div.leaderUserId);
      if (divId && leaderId) {
        try {
          await tx.division.update({
            where: { id: divId },
            data: { leaderUserId: leaderId },
          });
        } catch (error) {
          logError(`updateOrgLeaders: Division ${div.name}`, error);
        }
      }
    }
  }

  // Update Department Heads
  for (const dept of data.departments) {
    if (dept.headUserId) {
      const deptId = idMaps.departments.get(dept.originalId);
      const headId = idMaps.users.get(dept.headUserId);
      if (deptId && headId) {
        try {
          await tx.department.update({
            where: { id: deptId },
            data: { headUserId: headId },
          });
        } catch (error) {
          logError(`updateOrgLeaders: Department ${dept.name}`, error);
        }
      }
    }
  }
  logProgress('✅', 'Updated organization leaders\n');
}

async function migrateHospitalMissions(tx: any, data: MigrationData, idMaps: IdMaps, stats: any) {
  logProgress('📦', 'Migrating Hospital Missions...');
  for (const hm of data.hospMissions) {
    try {
      const created = await tx.hospitalMission.create({
        data: {
          name: hm.name,
          description: cleanString(hm.description),
          startYear: hm.startYear,
          endYear: hm.endYear,
        },
      });
      idMaps.hospitalMissions.set(hm.originalId, created.id);
      stats.hospitalMissions++;
    } catch (error) {
      logError(`migrateHospitalMissions (${hm.name})`, error, hm);
    }
  }
  logProgress('✅', `Migrated ${stats.hospitalMissions} hospital missions\n`);
}

async function migrateITGoals(tx: any, data: MigrationData, idMaps: IdMaps, stats: any) {
  logProgress('📦', 'Migrating IT Goals...');
  for (const goal of data.itGoals) {
    try {
      const hospMissionId = idMaps.hospitalMissions.get(goal.hospMissionId);
      if (!hospMissionId) {
        logError(`migrateITGoals: Hospital Mission not found`, new Error(`Missing: ${goal.hospMissionId}`), goal);
        continue;
      }

      const created = await tx.iTGoal.create({
        data: {
          name: goal.name,
          hospMissionId: hospMissionId,
        },
      });
      idMaps.itGoals.set(goal.originalId, created.id);
      stats.itGoals++;
    } catch (error) {
      logError(`migrateITGoals (${goal.name})`, error, goal);
    }
  }
  logProgress('✅', `Migrated ${stats.itGoals} IT goals\n`);
}

async function migrateActionPlans(tx: any, data: MigrationData, idMaps: IdMaps, stats: any) {
  logProgress('📦', 'Migrating Action Plans...');
  for (const ap of data.actionPlans) {
    try {
      const hospMissionId = idMaps.hospitalMissions.get(ap.hospMissionId);
      if (!hospMissionId) {
        logError(`migrateActionPlans: Hospital Mission not found`, new Error(`Missing: ${ap.hospMissionId}`), ap);
        continue;
      }

      const created = await tx.actionPlan.create({
        data: {
          name: ap.name,
          hospMissionId: hospMissionId,
          itGoalIds: parseJSON(ap.itGoalIds),
        },
      });
      idMaps.actionPlans.set(ap.originalId, created.id);
      stats.actionPlans++;
    } catch (error) {
      logError(`migrateActionPlans (${ap.name})`, error, ap);
    }
  }
  logProgress('✅', `Migrated ${stats.actionPlans} action plans\n`);
}

async function migrateProjects(tx: any, data: MigrationData, idMaps: IdMaps, stats: any) {
  logProgress('📦', 'Migrating Projects...');
  for (const project of data.projects) {
    try {
      const deptId = idMaps.departments.get(project.departmentId);
      const ownerId = idMaps.users.get(project.ownerUserId);

      if (!deptId || !ownerId) {
        logError(`migrateProjects: Missing department or owner`, new Error(`Dept: ${project.departmentId}, Owner: ${project.ownerUserId}`), project);
        continue;
      }

      const actionPlanId = project.actionPlanId ? idMaps.actionPlans.get(project.actionPlanId) : null;
      const deletedById = project.userDeletedId ? idMaps.users.get(project.userDeletedId) : null;

      const created = await tx.project.create({
        data: {
          name: project.name,
          description: cleanString(project.description),
          departmentId: deptId,
          ownerUserId: ownerId,
          actionPlanId: actionPlanId,
          dateDeleted: parseDate(project.dateDeleted),
          userDeletedId: deletedById,
          status: mapProjectStatus(project.status),
        },
      });
      idMaps.projects.set(project.originalId, created.id);
      stats.projects++;
    } catch (error) {
      logError(`migrateProjects (${project.name})`, error, project);
    }
  }
  logProgress('✅', `Migrated ${stats.projects} projects\n`);
}

async function migrateStatuses(tx: any, data: MigrationData, idMaps: IdMaps, stats: any) {
  logProgress('📦', 'Migrating Statuses...');
  for (const status of data.statuses) {
    try {
      const projectId = idMaps.projects.get(status.projectId);
      if (!projectId) {
        logError(`migrateStatuses: Project not found`, new Error(`Missing: ${status.projectId}`), status);
        continue;
      }

      const created = await tx.status.create({
        data: {
          name: status.name,
          color: status.color,
          order: status.order,
          type: mapStatusType(status.type),
          projectId: projectId,
        },
      });
      idMaps.statuses.set(status.originalId, created.id);
      stats.statuses++;
    } catch (error) {
      logError(`migrateStatuses (${status.name})`, error, status);
    }
  }
  logProgress('✅', `Migrated ${stats.statuses} statuses\n`);
}

async function migrateTasks(tx: any, data: MigrationData, idMaps: IdMaps, stats: any) {
  logProgress('📦', 'Migrating Tasks (pass 1 - no parent)...');

  // Pass 1: Create tasks without parentTaskId
  for (const task of data.tasks) {
    try {
      const projectId = idMaps.projects.get(task.projectId);
      const statusId = idMaps.statuses.get(task.statusId);
      const creatorId = idMaps.users.get(task.creatorUserId);

      if (!projectId || !statusId || !creatorId) {
        logError(`migrateTasks: Missing project/status/creator`, new Error(`Project: ${task.projectId}, Status: ${task.statusId}, Creator: ${task.creatorUserId}`), task);
        continue;
      }

      const assigneeId = task.assigneeUserId ? idMaps.users.get(task.assigneeUserId) : null;
      const closedById = task.userClosedId ? idMaps.users.get(task.userClosedId) : null;

      const created = await tx.task.create({
        data: {
          name: task.name,
          projectId: projectId,
          description: cleanString(task.description),
          assigneeUserId: assigneeId,
          statusId: statusId,
          priority: normalizePriority(task.priority),
          startDate: parseDate(task.startDate),
          dueDate: parseDate(task.dueDate),
          creatorUserId: creatorId,
          closeDate: parseDate(task.closeDate),
          difficulty: normalizeDifficulty(task.difficulty),
          isClosed: parseBool(task.isClosed),
          closeType: mapCloseType(task.closeType),
          userClosedId: closedById,
          // parentTaskId will be set in pass 2
        },
      });
      idMaps.tasks.set(task.originalId, created.id);
      stats.tasks++;
    } catch (error) {
      logError(`migrateTasks (${task.name})`, error, task);
    }
  }

  // Pass 2: Update parentTaskId
  logProgress('📦', 'Migrating Tasks (pass 2 - parent links)...');
  let linkedTasks = 0;
  for (const task of data.tasks) {
    if (task.parentTaskId) {
      const taskId = idMaps.tasks.get(task.originalId);
      const parentId = idMaps.tasks.get(task.parentTaskId);

      if (taskId && parentId) {
        try {
          await tx.task.update({
            where: { id: taskId },
            data: { parentTaskId: parentId },
          });
          linkedTasks++;
        } catch (error) {
          logError(`migrateTasks: parent link (${task.name})`, error);
        }
      }
    }
  }
  logProgress('✅', `Migrated ${stats.tasks} tasks (${linkedTasks} with parent links)\n`);
}

async function migrateComments(tx: any, data: MigrationData, idMaps: IdMaps, stats: any) {
  logProgress('📦', 'Migrating Comments...');
  for (const comment of data.comments) {
    try {
      const taskId = idMaps.tasks.get(comment.taskId);
      const commentorId = idMaps.users.get(comment.commentorUserId);

      if (!taskId || !commentorId) {
        logError(`migrateComments: Task or user not found`, new Error(`Task: ${comment.taskId}, User: ${comment.commentorUserId}`), comment);
        continue;
      }

      await tx.comment.create({
        data: {
          taskId: taskId,
          commentorUserId: commentorId,
          commentText: comment.commentText,
          mentions: parseJSON(comment.mentions),
          createdAt: parseDate(comment.createdAt) || new Date(),
        },
      });
      stats.comments++;
    } catch (error) {
      logError(`migrateComments`, error, comment);
    }
  }
  logProgress('✅', `Migrated ${stats.comments} comments\n`);
}

async function migrateChecklists(tx: any, data: MigrationData, idMaps: IdMaps, stats: any) {
  logProgress('📦', 'Migrating Checklists...');
  for (const checklist of data.checklists) {
    try {
      const taskId = idMaps.tasks.get(checklist.taskId);
      const creatorId = idMaps.users.get(checklist.creatorUserId);

      if (!taskId || !creatorId) {
        logError(`migrateChecklists: Task or user not found`, new Error(`Task: ${checklist.taskId}, User: ${checklist.creatorUserId}`), checklist);
        continue;
      }

      await tx.checklist.create({
        data: {
          name: checklist.name,
          isChecked: parseBool(checklist.isChecked),
          creatorUserId: creatorId,
          createdDate: parseDate(checklist.createdDate) || new Date(),
          taskId: taskId,
        },
      });
      stats.checklists++;
    } catch (error) {
      logError(`migrateChecklists`, error, checklist);
    }
  }
  logProgress('✅', `Migrated ${stats.checklists} checklists\n`);
}

async function migrateHistory(tx: any, data: MigrationData, idMaps: IdMaps, stats: any) {
  logProgress('📦', 'Migrating History...');
  let skipped = 0;
  for (const hist of data.history) {
    try {
      const taskId = idMaps.tasks.get(hist.taskId);
      const userId = idMaps.users.get(hist.userId);

      if (!taskId || !userId) {
        // Skip silently - task or user may have been deleted in old system
        skipped++;
        continue;
      }

      await tx.history.create({
        data: {
          historyText: hist.historyText,
          historyDate: parseDate(hist.historyDate) || new Date(),
          taskId: taskId,
          userId: userId,
        },
      });
      stats.history++;
    } catch (error) {
      logError(`migrateHistory`, error, hist);
    }
  }
  logProgress('✅', `Migrated ${stats.history} history records (${skipped} skipped - orphaned records)\n`);
}

async function migrateNotifications(tx: any, data: MigrationData, idMaps: IdMaps, stats: any) {
  logProgress('📦', 'Migrating Notifications...');
  for (const notif of data.notifications) {
    try {
      const userId = idMaps.users.get(notif.userId);
      if (!userId) {
        logError(`migrateNotifications: User not found`, new Error(`User: ${notif.userId}`), notif);
        continue;
      }

      const triggeredById = notif.triggeredByUserId ? idMaps.users.get(notif.triggeredByUserId) : null;
      const taskId = notif.taskId ? idMaps.tasks.get(notif.taskId) : null;

      await tx.notification.create({
        data: {
          userId: userId,
          triggeredByUserId: triggeredById,
          type: mapNotificationType(notif.type),
          message: notif.message,
          taskId: taskId,
          isRead: parseBool(notif.isRead),
          createdAt: parseDate(notif.createdAt) || new Date(),
        },
      });
      stats.notifications++;
    } catch (error) {
      logError(`migrateNotifications`, error, notif);
    }
  }
  logProgress('✅', `Migrated ${stats.notifications} notifications\n`);
}

async function migrateSessions(tx: any, data: MigrationData, idMaps: IdMaps, stats: any) {
  logProgress('📦', 'Migrating Sessions...');
  for (const session of data.sessions) {
    try {
      const userId = idMaps.users.get(session.userId);
      if (!userId) {
        logError(`migrateSessions: User not found`, new Error(`User: ${session.userId}`), session);
        continue;
      }

      const expiresAt = parseDate(session.expiryTimestamp);
      if (!expiresAt) {
        logError(`migrateSessions: Invalid expiry date`, new Error(`Date: ${session.expiryTimestamp}`), session);
        continue;
      }

      await tx.session.create({
        data: {
          sessionToken: session.sessionToken,
          userId: userId,
          expiresAt: expiresAt,
        },
      });
      stats.sessions++;
    } catch (error) {
      logError(`migrateSessions`, error, session);
    }
  }
  logProgress('✅', `Migrated ${stats.sessions} sessions\n`);
}

async function migratePhases(tx: any, data: MigrationData, idMaps: IdMaps, stats: any) {
  logProgress('📦', 'Migrating Phases...');
  for (const phase of data.phases) {
    try {
      const projectId = idMaps.projects.get(phase.projectId);
      if (!projectId) {
        logError(`migratePhases: Project not found`, new Error(`Project: ${phase.projectId}`), phase);
        continue;
      }

      await tx.phase.create({
        data: {
          name: phase.name,
          phaseOrder: phase.phaseOrder,
          projectId: projectId,
          startDate: parseDate(phase.startDate),
          endDate: parseDate(phase.endDate),
        },
      });
      stats.phases++;
    } catch (error) {
      logError(`migratePhases`, error, phase);
    }
  }
  logProgress('✅', `Migrated ${stats.phases} phases\n`);
}

async function migrateHolidays(tx: any, data: MigrationData, stats: any) {
  logProgress('📦', 'Migrating Holidays...');
  for (const holiday of data.holidays) {
    try {
      const date = parseDate(holiday.date);
      if (!date) {
        logError(`migrateHolidays: Invalid date`, new Error(`Date: ${holiday.date}`), holiday);
        continue;
      }

      await tx.holiday.create({
        data: {
          date: date,
          name: holiday.name,
        },
      });
      stats.holidays++;
    } catch (error: any) {
      // Ignore duplicate key errors (holiday dates are unique)
      if (!error.code || error.code !== 'P2002') {
        logError(`migrateHolidays`, error, holiday);
      }
    }
  }
  logProgress('✅', `Migrated ${stats.holidays} holidays\n`);
}

async function migrateRequests(tx: any, data: MigrationData, idMaps: IdMaps, stats: any) {
  logProgress('📦', 'Migrating Requests...');
  for (const req of data.requests) {
    try {
      const userId = idMaps.users.get(req.userId);
      if (!userId) {
        logError(`migrateRequests: User not found`, new Error(`User: ${req.userId}`), req);
        continue;
      }

      const taskId = req.taskId ? idMaps.tasks.get(req.taskId) : null;

      await tx.request.create({
        data: {
          userId: userId,
          requestType: req.requestType,
          description: cleanString(req.description),
          name: cleanString(req.name),
          taskId: taskId,
          purpose: cleanString(req.purpose),
          purposeDetails: cleanString(req.purposeDetails),
          daysDemanded: parseIntSafe(req.daysDemanded),
          daysNeeded: parseIntSafe(req.daysNeeded),
          userTel: cleanString(req.userTel),
          createdAt: parseDate(req.createdAt) || new Date(),
        },
      });
      stats.requests++;
    } catch (error) {
      logError(`migrateRequests`, error, req);
    }
  }
  logProgress('✅', `Migrated ${stats.requests} requests\n`);
}

async function migrateConfig(tx: any, data: MigrationData, stats: any) {
  logProgress('📦', 'Migrating Config...');
  for (const cfg of data.config) {
    try {
      await tx.config.create({
        data: {
          configKey: cfg.configKey,
          configValue: cfg.configValue,
        },
      });
      stats.config++;
    } catch (error: any) {
      // Ignore duplicate key errors
      if (!error.code || error.code !== 'P2002') {
        logError(`migrateConfig`, error, cfg);
      }
    }
  }
  logProgress('✅', `Migrated ${stats.config} config entries\n`);
}

async function migratePermissions(tx: any, data: MigrationData, stats: any) {
  logProgress('📦', 'Migrating Permissions...');
  for (const perm of data.permissions) {
    try {
      await tx.permission.create({
        data: {
          permissionKey: perm.permissionKey,
          permissionName: perm.permissionName,
          category: perm.category,
        },
      });
      stats.permissions++;
    } catch (error: any) {
      // Ignore duplicate key errors
      if (!error.code || error.code !== 'P2002') {
        logError(`migratePermissions`, error, perm);
      }
    }
  }
  logProgress('✅', `Migrated ${stats.permissions} permissions\n`);
}

async function migrateRolePermissions(tx: any, data: MigrationData, stats: any) {
  logProgress('📦', 'Migrating Role Permissions...');
  for (const rp of data.rolePermissions) {
    try {
      await tx.rolePermission.create({
        data: {
          roleName: rp.roleName,
          permissionKey: rp.permissionKey,
          allowed: parseBool(rp.allowed),
        },
      });
      stats.rolePermissions++;
    } catch (error: any) {
      // Ignore duplicate key errors
      if (!error.code || error.code !== 'P2002') {
        logError(`migrateRolePermissions`, error, rp);
      }
    }
  }
  logProgress('✅', `Migrated ${stats.rolePermissions} role permissions\n`);
}

// ============================================
// SUMMARY & UTILITIES
// ============================================

function printSummary(stats: any, duration: number) {
  console.log('\n========================================');
  console.log('📊 MIGRATION SUMMARY');
  console.log('========================================');
  console.log(`✅ Users:              ${stats.users}`);
  console.log(`✅ Sessions:           ${stats.sessions}`);
  console.log(`✅ Mission Groups:     ${stats.missionGroups}`);
  console.log(`✅ Divisions:          ${stats.divisions}`);
  console.log(`✅ Departments:        ${stats.departments}`);
  console.log(`✅ Projects:           ${stats.projects}`);
  console.log(`✅ Tasks:              ${stats.tasks}`);
  console.log(`✅ Statuses:           ${stats.statuses}`);
  console.log(`✅ Comments:           ${stats.comments}`);
  console.log(`✅ Checklists:         ${stats.checklists}`);
  console.log(`✅ History:            ${stats.history}`);
  console.log(`✅ Notifications:      ${stats.notifications}`);
  console.log(`✅ Holidays:           ${stats.holidays}`);
  console.log(`✅ Hospital Missions:  ${stats.hospitalMissions}`);
  console.log(`✅ IT Goals:           ${stats.itGoals}`);
  console.log(`✅ Action Plans:       ${stats.actionPlans}`);
  console.log(`✅ Requests:           ${stats.requests}`);
  console.log(`✅ Config:             ${stats.config}`);
  console.log(`✅ Permissions:        ${stats.permissions}`);
  console.log(`✅ Role Permissions:   ${stats.rolePermissions}`);
  console.log(`✅ Phases:             ${stats.phases}`);
  console.log('========================================');

  const total = Object.values(stats).reduce((sum: number, count) => sum + (count as number), 0);
  console.log(`📊 TOTAL RECORDS:      ${total}`);
  console.log(`⏱️  DURATION:           ${formatDuration(duration)}`);
  console.log('========================================');
}

// ============================================
// RUN MIGRATION
// ============================================

main()
  .catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });
