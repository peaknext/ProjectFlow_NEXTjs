/**
 * filterTasks - ฟังก์ชันกรองงาน
 * ใช้ร่วมกันระหว่าง Board View, Calendar View, และ List View
 */

import { TaskFilters } from './task-filter-bar';

interface Task {
  id: string;
  name: string;
  description: string | null;
  statusId: string;
  priority: number;
  assigneeUserIds?: string[];
  isClosed?: boolean;
  [key: string]: any;
}

/**
 * กรองงานตาม filters
 */
export function filterTasks(tasks: Task[], filters: TaskFilters): Task[] {
  let filtered = [...tasks];

  // Filter: Hide closed tasks
  if (filters.hideClosed) {
    filtered = filtered.filter((task) => !task.isClosed);
  }

  // Filter: Search
  if (filters.search) {
    const search = filters.search.toLowerCase();
    filtered = filtered.filter(
      (task) =>
        task.name.toLowerCase().includes(search) ||
        task.description?.toLowerCase().includes(search)
    );
  }

  // Filter: Status
  if (filters.statusId) {
    filtered = filtered.filter((task) => task.statusId === filters.statusId);
  }

  // Filter: Priority
  if (filters.priorityId) {
    filtered = filtered.filter((task) => task.priority === parseInt(filters.priorityId));
  }

  // Filter: Assignee
  if (filters.assigneeId) {
    filtered = filtered.filter((task) =>
      task.assigneeUserIds?.includes(filters.assigneeId)
    );
  }

  return filtered;
}

/**
 * ดึง unique assignees จาก tasks
 */
export function getUniqueAssignees(tasks: Task[]): Array<{ id: string; fullName: string }> {
  const assignees = new Map();
  tasks.forEach((task: any) => {
    // Support multi-assignee
    if (task.assignees) {
      task.assignees.forEach((assignee: any) => {
        assignees.set(assignee.id, assignee);
      });
    }
  });
  return Array.from(assignees.values());
}
