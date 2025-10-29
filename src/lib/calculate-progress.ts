/**
 * Shared Progress Calculation Utility
 *
 * Calculate project progress using GAS formula:
 * Progress = Σ(statusOrder × difficulty) / Σ(Smax × difficulty) × 100
 *
 * This file is shared between backend and frontend to ensure consistency.
 * Can be used in both server-side and client-side contexts.
 */

export interface TaskForProgress {
  difficulty: number | null;
  closeType: 'COMPLETED' | 'ABORTED' | null;
  status: {
    order: number;
  };
}

export interface StatusForProgress {
  order: number;
}

export interface ProgressResult {
  progress: number; // Percentage (0-100)
  completedWeight: number;
  totalWeight: number;
  maxStatusOrder: number;
  totalTasks: number;
  completedTasks: number;
  abortedTasks: number;
  openTasks: number;
}

/**
 * Calculate project progress percentage
 *
 * @param tasks - Array of tasks with difficulty, closeType, and status
 * @param statuses - Array of project statuses to find Smax
 * @returns Progress result with percentage and metadata
 *
 * @example
 * const result = calculateProgress(tasks, statuses);
 * console.log(result.progress); // 66.67
 */
export function calculateProgress(
  tasks: TaskForProgress[],
  statuses: StatusForProgress[]
): ProgressResult {
  // Filter out ABORTED tasks
  const validTasks = tasks.filter((task) => task.closeType !== 'ABORTED');
  const abortedTasks = tasks.filter((task) => task.closeType === 'ABORTED');

  const totalTasks = validTasks.length;

  // If no valid tasks, return 0%
  if (totalTasks === 0) {
    return {
      progress: 0,
      completedWeight: 0,
      totalWeight: 0,
      maxStatusOrder: 0,
      totalTasks: 0,
      completedTasks: 0,
      abortedTasks: abortedTasks.length,
      openTasks: 0,
    };
  }

  // Find Smax (maximum status order)
  const Smax =
    statuses.length > 0 ? Math.max(...statuses.map((s) => s.order)) : 1;

  // Calculate progress using GAS formula:
  // Progress = Σ(statusOrder × difficulty) / Σ(Smax × difficulty) × 100
  let completedWeight = 0; // Σ(statusOrder × difficulty)
  let totalWeight = 0; // Σ(Smax × difficulty)

  validTasks.forEach((task) => {
    const difficulty = task.difficulty || 2; // Default to 2 (ปกติ) if not set

    // Validate difficulty is 1-5 (GAS used 1-3, Next.js uses 1-5)
    const validDifficulty = [1, 2, 3, 4, 5].includes(difficulty)
      ? difficulty
      : 2;

    // For COMPLETED tasks, use Smax (count as 100% complete)
    // For open tasks, use their current status order
    const statusOrder = task.closeType === 'COMPLETED'
      ? Smax
      : (task.status?.order || 1);

    completedWeight += statusOrder * validDifficulty;
    totalWeight += Smax * validDifficulty;
  });

  // Calculate progress percentage (round to 2 decimal places)
  const progress =
    totalWeight > 0
      ? Math.round((completedWeight / totalWeight) * 100 * 100) / 100
      : 0;

  // Count tasks by type
  const completedTasks = validTasks.filter(
    (t) => t.closeType === 'COMPLETED'
  ).length;
  const openTasks = validTasks.length - completedTasks;

  return {
    progress,
    completedWeight,
    totalWeight,
    maxStatusOrder: Smax,
    totalTasks: validTasks.length,
    completedTasks,
    abortedTasks: abortedTasks.length,
    openTasks,
  };
}

/**
 * Helper function to update project progress in database
 * This is a backend-only function (uses Prisma)
 *
 * @param projectId - Project ID to update
 * @param progress - Calculated progress percentage
 */
export async function updateProjectProgress(
  projectId: string,
  progress: number
) {
  // Dynamic import to avoid bundling Prisma in frontend
  const { prisma } = await import('@/lib/db');

  await prisma.project.update({
    where: { id: projectId },
    data: {
      progress,
      progressUpdatedAt: new Date(),
    },
  });
}
