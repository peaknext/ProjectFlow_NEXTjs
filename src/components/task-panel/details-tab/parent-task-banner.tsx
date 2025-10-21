'use client';

import { useTask } from '@/hooks/use-tasks';
import { useUIStore } from '@/stores/use-ui-store';
import { MoveRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface ParentTaskBannerProps {
  parentTaskId: string;
}

/**
 * ParentTaskBanner Component
 *
 * Shows parent task info for subtasks.
 * Features:
 * - Icon + "เป็นงานย่อยของ:" text
 * - Clickable parent task name link
 * - Opens parent task in same panel (context-aware navigation)
 * - Loading skeleton
 *
 * @example
 * {task.parentTaskId && <ParentTaskBanner parentTaskId={task.parentTaskId} />}
 */
export function ParentTaskBanner({ parentTaskId }: ParentTaskBannerProps) {
  const { data: parentTask, isLoading } = useTask(parentTaskId);
  const { setTaskPanelOpen } = useUIStore();

  const handleParentClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (parentTask) {
      setTaskPanelOpen(parentTask.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <MoveRight className="h-4 w-4" />
        <span>เป็นงานย่อยของ:</span>
        <Skeleton className="h-5 w-48" />
      </div>
    );
  }

  if (!parentTask) return null;

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <MoveRight className="h-4 w-4" />
      <span>เป็นงานย่อยของ:</span>
      <a
        href="#"
        onClick={handleParentClick}
        className="font-semibold text-primary hover:underline"
      >
        {parentTask.name}
      </a>
    </div>
  );
}
