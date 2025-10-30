/**
 * Division View Types
 * Type definitions for division-level overview
 */

export interface DivisionStats {
  totalDepartments: number;
  activeDepartments: number;
  totalProjects: number;
  activeProjects: number;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  dueSoonTasks: number;
  unassignedTasks: number;
  avgCompletionRate: number; // 0-100
  trend: {
    direction: "up" | "down" | "stable";
    value: number; // percentage change
  };
}

export interface DepartmentSummary {
  id: string;
  name: string;
  projectCount: {
    active: number;
    total: number;
  };
  taskStats: {
    total: number;
    inProgress: number;
    completed: number;
    overdue: number;
    dueSoon: number;
  };
  completionRate: number; // 0-100
  progress: number; // 0-100 (average project progress)
  personnelCount: number;
  topPersonnel: {
    id: string;
    fullName: string;
    profileImageUrl?: string | null;
  }[];
  riskLevel: "low" | "medium" | "high";
}

export interface WorkloadData {
  departmentName: string;
  taskCount: number;
  completionRate: number;
}

export interface PriorityDistribution {
  priority1: number;
  priority2: number;
  priority3: number;
  priority4: number;
}

export interface StatusDistribution {
  departmentName: string;
  notStarted: number;
  inProgress: number;
  done: number;
  overdue: number;
}

export interface CriticalTask {
  id: string;
  name: string;
  priority: number;
  statusId: string | null;
  status: {
    id: string;
    name: string;
    color: string;
    type: string;
    order: number;
  } | null;
  dueDate: string | null;
  projectId: string;
  isClosed: boolean;
  isPinned: boolean;
  assignees: {
    id: string;
    fullName: string;
    profileImageUrl?: string | null;
  }[];
  assigneeUserIds: string[];
  departmentId: string;
  departmentName: string;
}

export interface DivisionCharts {
  workloadDistribution: WorkloadData[];
  priorityDistribution: PriorityDistribution;
  statusDistribution: StatusDistribution[];
}

export interface CriticalTasks {
  overdue: CriticalTask[];
  urgent: CriticalTask[];
  dueSoon: CriticalTask[];
  unassigned: CriticalTask[];
}

export interface DivisionOverview {
  division: {
    id: string;
    name: string;
    missionGroup: {
      id: string;
      name: string;
    };
  };
  stats: DivisionStats;
  departments: DepartmentSummary[];
  charts: DivisionCharts;
  criticalTasks: CriticalTasks;
}

export interface DivisionFilters {
  startDate?: string;
  endDate?: string;
  includeCompleted?: boolean;
}
