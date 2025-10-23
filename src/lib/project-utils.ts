/**
 * Utility functions for project management
 */

import type { ProjectWithDetails, CurrentPhase } from "@/types/project";

/**
 * Calculate project progress based on tasks and statuses
 * @param project Project with tasks and statuses
 * @returns Progress percentage (0-100)
 */
export function calculateProjectProgress(project: ProjectWithDetails): number {
  const tasks = project.tasks || [];
  const statuses = project.statuses || [];

  if (tasks.length === 0 || statuses.length === 0) {
    return 0;
  }

  // Find DONE status
  const doneStatus = statuses.find((s) => s.type === "DONE");
  if (!doneStatus) {
    return 0;
  }

  // Count tasks in DONE status
  const completedTasks = tasks.filter((t) => t.statusId === doneStatus.id);
  const progress = (completedTasks.length / tasks.length) * 100;

  return Math.round(progress * 10) / 10; // Round to 1 decimal
}

/**
 * Get current phase based on today's date
 * @param phases Array of phases with start/end dates
 * @returns Current phase information
 */
export function getCurrentPhase(
  phases: ProjectWithDetails["phases"]
): CurrentPhase {
  if (!phases || phases.length === 0) {
    return {
      name: "ไม่ได้กำหนด",
      order: 0,
      status: "upcoming",
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Sort by phase order
  const sortedPhases = [...phases].sort((a, b) => a.phaseOrder - b.phaseOrder);

  // Find current phase
  for (const phase of sortedPhases) {
    const startDate = phase.startDate ? new Date(phase.startDate) : null;
    const endDate = phase.endDate ? new Date(phase.endDate) : null;

    if (startDate) startDate.setHours(0, 0, 0, 0);
    if (endDate) endDate.setHours(0, 0, 0, 0);

    // Check if today is within phase date range
    if (startDate && endDate) {
      if (today >= startDate && today <= endDate) {
        return {
          name: phase.name,
          order: phase.phaseOrder,
          status: "active",
        };
      } else if (today < startDate) {
        return {
          name: `กำลังจะเริ่ม: ${phase.name}`,
          order: 0,
          status: "upcoming",
        };
      }
    }
  }

  // If past all phases
  const lastPhase = sortedPhases[sortedPhases.length - 1];
  return {
    name: "เสร็จสิ้น",
    order: lastPhase.phaseOrder + 1,
    status: "completed",
  };
}

/**
 * Get phase badge color variant based on order
 * @param order Phase order (1-4)
 * @returns Tailwind CSS classes for badge
 */
export function getPhaseColorClasses(order: number): string {
  switch (order) {
    case 1:
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
    case 2:
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
    case 3:
      return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
    case 4:
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    default:
      return "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300";
  }
}

/**
 * Get progress bar color classes based on percentage
 * @param progress Progress percentage (0-100)
 * @returns Tailwind CSS classes for progress bar
 */
export function getProgressColorClasses(progress: number): {
  bar: string;
  text: string;
} {
  if (progress === 0) {
    return {
      bar: "bg-slate-400",
      text: "text-slate-600 dark:text-slate-400",
    };
  } else if (progress < 30) {
    return {
      bar: "bg-red-500",
      text: "text-red-600 dark:text-red-400",
    };
  } else if (progress < 70) {
    return {
      bar: "bg-yellow-500",
      text: "text-yellow-600 dark:text-yellow-400",
    };
  } else if (progress < 100) {
    return {
      bar: "bg-blue-500",
      text: "text-blue-600 dark:text-blue-400",
    };
  } else {
    return {
      bar: "bg-green-500",
      text: "text-green-600 dark:text-green-400",
    };
  }
}

/**
 * Filter projects based on filters
 * @param projects Array of projects
 * @param filters Filter criteria
 * @returns Filtered projects
 */
export function filterProjects(
  projects: ProjectWithDetails[],
  filters: {
    missionGroupId?: string | null;
    divisionId?: string | null;
    departmentId?: string | null;
    searchQuery?: string;
  }
): ProjectWithDetails[] {
  let filtered = [...projects];

  // Filter by department (most specific)
  if (filters.departmentId) {
    filtered = filtered.filter((p) => p.departmentId === filters.departmentId);
  }
  // Filter by division (includes all departments in division)
  else if (filters.divisionId) {
    filtered = filtered.filter(
      (p) => p.department.divisionId === filters.divisionId
    );
  }
  // Filter by mission group (includes all divisions and departments)
  else if (filters.missionGroupId) {
    filtered = filtered.filter(
      (p) => p.department.division.missionGroupId === filters.missionGroupId
    );
  }

  // Filter by search query
  if (filters.searchQuery) {
    const query = filters.searchQuery.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.owner.fullName.toLowerCase().includes(query)
    );
  }

  return filtered;
}

/**
 * Sort projects
 * @param projects Array of projects
 * @param column Sort column
 * @param direction Sort direction
 * @returns Sorted projects
 */
export function sortProjects(
  projects: ProjectWithDetails[],
  column: "name" | "owner" | "phase",
  direction: "asc" | "desc"
): ProjectWithDetails[] {
  const sorted = [...projects];

  sorted.sort((a, b) => {
    let aVal: string | number;
    let bVal: string | number;

    switch (column) {
      case "name":
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
        break;
      case "owner":
        aVal = a.owner.fullName.toLowerCase();
        bVal = b.owner.fullName.toLowerCase();
        break;
      case "phase":
        aVal = getCurrentPhase(a.phases).order;
        bVal = getCurrentPhase(b.phases).order;
        break;
      default:
        return 0;
    }

    if (aVal < bVal) return direction === "asc" ? -1 : 1;
    if (aVal > bVal) return direction === "asc" ? 1 : -1;
    return 0;
  });

  return sorted;
}
