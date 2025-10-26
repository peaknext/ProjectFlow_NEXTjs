/**
 * Dashboard Types
 *
 * TypeScript interfaces for Dashboard data structures
 */

export interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  thisWeekTasks: number;
}

export interface TaskAssignee {
  userId: string;
  user: {
    id: string;
    fullName: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    profileImageUrl: string | null;
  };
}

export interface TaskStatus {
  id: string;
  name: string;
  color: string;
  type: "NOT_STARTED" | "IN_PROGRESS" | "DONE";
}

export interface TaskProject {
  id: string;
  name: string;
  department?: {
    id: string;
    name: string;
  };
}

export interface DashboardTask {
  id: string;
  name: string;
  description: string | null;
  priority: number;
  difficulty: number | null;
  dueDate: Date | null;
  startDate: Date | null;
  isClosed: boolean;
  closeType: string | null;
  createdAt: Date;
  updatedAt: Date;
  assignees: TaskAssignee[];
  project: TaskProject;
  status: TaskStatus;
}

export interface MyTasksData {
  tasks: DashboardTask[];
  total: number;
  hasMore: boolean;
}

// Activity types (extensible for future activity sources)
export type ActivityType = "comment" | "history";

// Unified Activity interface (replaces old RecentActivity)
export interface Activity {
  id: string; // Format: "comment-{id}" or "history-{id}"
  type: ActivityType; // Type of activity
  timestamp: string; // ISO timestamp for sorting
  user: {
    id: string;
    fullName: string;
    profileImageUrl: string | null;
  };
  content: string; // Activity text to display
  task: {
    id: string;
    name: string;
  };
  project: {
    id: string;
    name: string;
  };
}

// Legacy type for backward compatibility
export interface RecentActivity {
  id: string;
  historyText: string;
  historyDate: Date;
  user: {
    id: string;
    fullName: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    profileImageUrl: string | null;
  };
  task: {
    id: string;
    name: string;
    project: TaskProject;
  };
}

export interface ChecklistItem {
  id: string;
  name: string;
  isChecked: boolean;
}

export interface MyChecklistGroup {
  taskId: string;
  taskName: string;
  projectName: string;
  items: ChecklistItem[];
}

export interface DashboardData {
  stats: DashboardStats;
  overdueTasks: DashboardTask[];
  pinnedTasks: DashboardTask[];
  myTasks: MyTasksData;
  calendarTasks: DashboardTask[];
  recentActivities: RecentActivity[];
  myChecklists: MyChecklistGroup[];
}

export interface DashboardResponse {
  success: boolean;
  data: DashboardData;
}

export interface UseDashboardOptions {
  limit?: number;
  offset?: number;
}
