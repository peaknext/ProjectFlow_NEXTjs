/**
 * useReports - Hooks for reports data fetching
 */

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

// Types
export interface ReportTask {
  id: string;
  name: string;
  projectId: string;
  departmentId: string;
  statusId: string;
  priority: number;
  difficulty: number | null;
  startDate: string | null;
  dueDate: string | null;
  dateCreated: string;
  closeDate: string | null;
  closeType: string | null;
  isClosed: boolean;
  assigneeUserIds: string[];
  assignees: Array<{
    id: string;
    fullName: string;
    profileImageUrl: string | null;
  }>;
  creator: {
    id: string;
    fullName: string;
    profileImageUrl: string | null;
  };
  creatorId: string;
  parentTaskId: string | null;
  status: {
    id: string;
    name: string;
    color: string;
    order: number;
    type: string; // "NOT_STARTED" | "IN_PROGRESS" | "DONE"
  };
}

export interface ReportStatus {
  id: string;
  name: string;
  color: string;
  order: number;
  type: string; // "NOT_STARTED" | "IN_PROGRESS" | "DONE"
  projectId: string;
}

export interface ReportUser {
  id: string;
  fullName: string;
  profileImageUrl: string | null;
  departmentId: string | null;
  role: string;
}

export interface ReportDataResponse {
  tasks: ReportTask[];
  statuses: ReportStatus[];
  users: ReportUser[];
}

export interface ReportFilters {
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  missionGroupId?: string;
  divisionId?: string;
  departmentId?: string;
}

// Query keys
export const reportKeys = {
  all: ['reports'] as const,
  tasks: (filters: ReportFilters) => [...reportKeys.all, 'tasks', filters] as const,
};

/**
 * Fetch report data with filters
 */
export function useReportData(filters: ReportFilters) {
  return useQuery({
    queryKey: reportKeys.tasks(filters),
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.missionGroupId) params.append('missionGroupId', filters.missionGroupId);
      if (filters.divisionId) params.append('divisionId', filters.divisionId);
      if (filters.departmentId) params.append('departmentId', filters.departmentId);

      const response = await api.get<ReportDataResponse>(
        `/api/reports/tasks?${params.toString()}`
      );

      return response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
  });
}

/**
 * Calculate statistics from report data
 */
export interface ReportStatistics {
  summary: {
    unassigned: number;
    inProgress: number;
    completed: number;
    overdue: number;
  };
  tasksByAssignee: Record<string, number>;
  workloadByType: Record<
    string,
    {
      'Not Started': number;
      'In Progress': number;
      Done: number;
      total: number;
      overdue: number;
    }
  >;
  statusTypes: string[];
}

export function calculateReportStatistics(
  tasks: ReportTask[],
  users: ReportUser[]
): ReportStatistics {
  console.log('🔍 calculateReportStatistics called with:', {
    tasksCount: tasks.length,
    usersCount: users.length,
    firstTask: tasks[0],
    firstUser: users[0],
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize to start of day

  const stats: ReportStatistics = {
    summary: {
      unassigned: 0,
      inProgress: 0,
      completed: 0,
      overdue: 0,
    },
    tasksByAssignee: {},
    workloadByType: {},
    statusTypes: ['Not Started', 'In Progress', 'Done'],
  };

  // Initialize workload for all users
  users.forEach((user) => {
    stats.workloadByType[user.fullName] = {
      'Not Started': 0,
      'In Progress': 0,
      Done: 0,
      total: 0,
      overdue: 0,
    };
    stats.tasksByAssignee[user.fullName] = 0;
  });

  // Add "Unassigned" category
  stats.workloadByType['Unassigned'] = {
    'Not Started': 0,
    'In Progress': 0,
    Done: 0,
    total: 0,
    overdue: 0,
  };
  stats.tasksByAssignee['Unassigned'] = 0;

  // Process each task
  tasks.forEach((task) => {
    const statusType = task.status.type || 'NOT_STARTED';
    const normalizedType =
      statusType === 'NOT_STARTED'
        ? 'Not Started'
        : statusType === 'IN_PROGRESS'
        ? 'In Progress'
        : 'Done';

    // Check if overdue
    const isOverdue =
      task.dueDate &&
      new Date(task.dueDate) < today &&
      normalizedType !== 'Done';

    // Count by status type
    if (normalizedType === 'In Progress') {
      stats.summary.inProgress++;
    } else if (normalizedType === 'Done') {
      stats.summary.completed++;
    }

    if (isOverdue) {
      stats.summary.overdue++;
    }

    // Handle unassigned tasks
    if (!task.assigneeUserIds || task.assigneeUserIds.length === 0) {
      stats.summary.unassigned++;
      stats.tasksByAssignee['Unassigned']++;
      stats.workloadByType['Unassigned'][normalizedType]++;
      stats.workloadByType['Unassigned'].total++;
      if (isOverdue) {
        stats.workloadByType['Unassigned'].overdue++;
      }
      return;
    }

    // Handle assigned tasks (can have multiple assignees)
    task.assignees.forEach((assignee) => {
      const assigneeName = assignee.fullName;

      // Initialize if not exists
      if (!stats.workloadByType[assigneeName]) {
        stats.workloadByType[assigneeName] = {
          'Not Started': 0,
          'In Progress': 0,
          Done: 0,
          total: 0,
          overdue: 0,
        };
      }

      if (!stats.tasksByAssignee[assigneeName]) {
        stats.tasksByAssignee[assigneeName] = 0;
      }

      // Increment counts
      stats.tasksByAssignee[assigneeName]++;
      stats.workloadByType[assigneeName][normalizedType]++;
      stats.workloadByType[assigneeName].total++;

      if (isOverdue) {
        stats.workloadByType[assigneeName].overdue++;
      }
    });
  });

  // Remove users with no tasks (except Unassigned)
  Object.keys(stats.workloadByType).forEach((name) => {
    if (name !== 'Unassigned' && stats.workloadByType[name].total === 0) {
      delete stats.workloadByType[name];
      delete stats.tasksByAssignee[name];
    }
  });

  console.log('✅ calculateReportStatistics result:', {
    summary: stats.summary,
    workloadByType: stats.workloadByType,
    tasksByAssignee: stats.tasksByAssignee,
  });

  return stats;
}

/**
 * Get fiscal year start date (Thai fiscal year: Oct 1 - Sep 30)
 */
export function getFiscalYearStartDate(): Date {
  const today = new Date();
  const currentMonth = today.getMonth(); // 0-indexed (0 = Jan, 9 = Oct)
  const currentYear = today.getFullYear();

  // If before October (month < 9), use previous year's Oct 1
  // If October or later (month >= 9), use current year's Oct 1
  const fiscalStartYear = currentMonth < 9 ? currentYear - 1 : currentYear;

  return new Date(fiscalStartYear, 9, 1, 0, 0, 0, 0); // Oct 1 at 00:00:00
}

/**
 * Format date to YYYY-MM-DD for API
 */
export function formatDateForAPI(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
