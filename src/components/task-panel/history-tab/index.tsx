'use client';

import { useTaskPanelTab } from '../task-panel-tabs';
import { useTaskHistory } from '@/hooks/use-tasks';
import { Skeleton } from '@/components/ui/skeleton';
import { ActivityTimeline } from './activity-timeline';

interface Task {
  id: string;
}

interface HistoryTabProps {
  task?: Task | null;
}

/**
 * HistoryTab Component
 *
 * History tab showing task activity timeline.
 * Features:
 * - Activity timeline (sorted newest first)
 * - Loading skeleton
 * - Empty state message
 * - Lazy loading (only fetches when tab is active)
 *
 * @example
 * <HistoryTab task={task} />
 */
export function HistoryTab({ task }: HistoryTabProps) {
  const { isActive } = useTaskPanelTab('history');

  // Only fetch history when tab is active
  const { data: historyData, isLoading } = useTaskHistory(task?.id || null);
  const history = historyData?.history || [];

  // Don't render if not active tab
  if (!isActive) return null;

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (history.length === 0) {
    return (
      <div className="p-6 lg:p-8">
        <p className="text-center text-muted-foreground py-8">
          ยังไม่มีกิจกรรมในงานนี้
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <ActivityTimeline activities={history} />
    </div>
  );
}
