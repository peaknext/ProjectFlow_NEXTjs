'use client';

import { Plus } from 'lucide-react';
import { useTasks } from '@/hooks/use-tasks';
import { useUIStore } from '@/stores/use-ui-store';
import { useTaskPermissions } from '@/hooks/use-task-permissions';
import { UserAvatar } from '@/components/common/user-avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface Task {
  id: string;
  name: string;
  statusId: string;
  assigneeUserIds?: string[];
  isClosed?: boolean;
}

interface User {
  id: string;
  fullName: string;
  profileImageUrl?: string | null;
}

interface Status {
  id: string;
  name: string;
  color: string;
}

interface SubtasksSectionProps {
  taskId: string;
  projectId: string;
  task?: Task | null;
  users?: User[];
  statuses?: Status[];
}

/**
 * SubtasksSection Component
 *
 * Displays and manages subtasks.
 * Features:
 * - List all subtasks with status color dot
 * - Show first assignee avatar
 * - Clickable to navigate to subtask
 * - "Add Subtask" button opens Create Task Modal
 * - Disabled for closed tasks
 * - Loading skeleton
 * - Empty state
 *
 * @example
 * <SubtasksSection
 *   taskId={task.id}
 *   task={task}
 *   users={projectUsers}
 *   statuses={projectStatuses}
 * />
 */
export function SubtasksSection({
  taskId,
  projectId,
  task,
  users = [],
  statuses = []
}: SubtasksSectionProps) {
  const permissions = useTaskPermissions(task);
  const openTaskPanel = useUIStore((state) => state.openTaskPanel);
  const closeTaskPanel = useUIStore((state) => state.closeTaskPanel);
  const openCreateTaskModal = useUIStore((state) => state.openCreateTaskModal);

  // Fetch subtasks - only for this specific parent task
  const { data: subtasksData, isLoading } = useTasks({
    projectId: projectId,
    parentTaskId: taskId
  });

  const subtasks = subtasksData?.tasks || [];

  // Get user by ID
  const getUserById = (userId: string | null) => {
    if (!userId) return null;
    return users.find(u => u.id === userId);
  };

  // Get status by ID
  const getStatusById = (statusId: string) => {
    return statuses.find(s => s.id === statusId) || {
      id: statusId,
      name: 'Unknown',
      color: '#808080'
    };
  };

  // Handle subtask click
  const handleSubtaskClick = (subtaskId: string) => {
    openTaskPanel(subtaskId);
  };

  // Handle add subtask
  const handleAddSubtask = () => {
    if (!task) return;
    // Close task panel first, then open create task modal with parent task pre-filled
    closeTaskPanel();
    openCreateTaskModal({ parentTaskId: task.id });
  };

  return (
    <div className="border-t border-slate-200 dark:border-slate-700/50 pt-8 space-y-4">
      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
        งานย่อย
      </h3>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      )}

      {/* Subtasks list */}
      {!isLoading && subtasks.length > 0 && (
        <div className="space-y-1">
          {subtasks.map((subtask) => {
            const assignee = getUserById(subtask.assigneeUserIds?.[0]);
            const status = getStatusById(subtask.statusId);

            return (
              <button
                key={subtask.id}
                onClick={() => handleSubtaskClick(subtask.id)}
                className={cn(
                  'flex items-center gap-3 w-full p-3 rounded-lg',
                  'border border-transparent',
                  'hover:border-primary/50 dark:hover:border-primary/50',
                  'bg-slate-50 dark:bg-slate-800/20',
                  'hover:bg-primary/5 dark:hover:bg-primary/10',
                  'transition-colors duration-200 cursor-pointer',
                  'text-left'
                )}
              >
                {/* Status color dot */}
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: status.color }}
                  title={status.name}
                />

                {/* Task name */}
                <span className="flex-1 text-foreground truncate">
                  {subtask.name}
                </span>

                {/* Assignee avatar */}
                {assignee ? (
                  <UserAvatar user={assignee} size="sm" className="flex-shrink-0" />
                ) : (
                  <div className="w-6 h-6" /> // Placeholder for alignment
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && subtasks.length === 0 && (
        <p className="text-sm text-muted-foreground py-2">
          ยังไม่มีงานย่อย
        </p>
      )}

      {/* Add subtask button */}
      {permissions.canAddSubtask && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleAddSubtask}
          className="text-primary hover:text-primary/80 font-medium gap-1"
        >
          <Plus className="h-4 w-4" />
          <span>เพิ่มงานย่อย</span>
        </Button>
      )}
    </div>
  );
}
