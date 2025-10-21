'use client';

import { X } from 'lucide-react';
import { useUIStore } from '@/stores/use-ui-store';
import { useTogglePinTask } from '@/hooks/use-tasks';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface Task {
  id: string;
  name: string;
  isPinned?: boolean;
}

interface TaskPanelHeaderProps {
  task?: Task | null;
  isLoading?: boolean;
}

/**
 * TaskPanelHeader Component
 *
 * Header section of task panel with title, pin button, and close button.
 * Features:
 * - Title text
 * - Pin/Unpin toggle button (filled/outlined icon)
 * - Close button
 * - Loading skeleton
 *
 * @example
 * <TaskPanelHeader task={task} isLoading={isLoading} />
 */
export function TaskPanelHeader({ task, isLoading }: TaskPanelHeaderProps) {
  const closeTaskPanel = useUIStore((state) => state.closeTaskPanel);
  const { mutate: togglePin } = useTogglePinTask();

  const handlePinToggle = () => {
    if (!task) return;
    togglePin({ taskId: task.id, isPinned: task.isPinned || false });
  };

  return (
    <header className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0 bg-white dark:bg-background rounded-tl-xl">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          รายละเอียดงาน
        </h2>
      </div>

      <div className="flex items-center gap-2">
        {/* Pin Button */}
        {isLoading ? (
          <Skeleton className="h-10 w-10 rounded-full" />
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePinToggle}
            title={task?.isPinned ? 'ยกเลิกปักหมุด' : 'ปักหมุดงาน'}
            className="rounded-full"
          >
            <span
              className={cn(
                'material-symbols-outlined',
                task?.isPinned && 'filled text-primary'
              )}
            >
              keep
            </span>
          </Button>
        )}

        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={closeTaskPanel}
          title="ปิด"
          className="rounded-full"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
