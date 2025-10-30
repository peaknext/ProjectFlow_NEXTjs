/**
 * TaskCard - แสดงการ์ดงานใน Board View
 * รองรับ drag-and-drop, skeleton loading, และ closed state
 */

'use client';

import { cn } from '@/lib/utils';
import { PriorityBadge, PriorityDot } from '@/components/common/priority-badge';
import { UserAvatar } from '@/components/common/user-avatar';
import { Badge } from '@/components/ui/badge';
import { Calendar, MessageSquare, CheckSquare, Pin, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import type { Task } from '@/hooks/use-tasks';
import { useUIStore } from '@/stores/use-ui-store';

interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
  onClick?: () => void;
}

export function TaskCard({ task, isDragging, onClick }: TaskCardProps) {
  const closingTasks = useUIStore((state) => state.closingTasks);
  const closingTypes = useUIStore((state) => state.closingTypes);

  const isClosing = closingTasks.has(task.id);
  const closingType = closingTypes.get(task.id);

  // แสดง skeleton state ถ้ากำลัง close task
  if (isClosing) {
    return (
      <TaskCardSkeleton
        message={
          closingType === 'completing' ? 'กำลังปิดงาน...' : 'กำลังยกเลิกงาน...'
        }
      />
    );
  }

  const isPinned = task.isPinned || false;
  const isClosed = task.isClosed;

  return (
    <div
      className={cn(
        'group relative bg-card border rounded-lg p-3 space-y-2.5',
        'hover:shadow-md transition-all cursor-pointer',
        isDragging && 'shadow-lg rotate-2 opacity-50',
        isClosed && 'opacity-60 bg-muted/30',
        !isClosed && 'hover:border-primary/50'
      )}
      onClick={onClick}
    >
      {/* Pin indicator */}
      {isPinned && !isClosed && (
        <div className="absolute -top-1 -right-1">
          <div className="bg-primary text-primary-foreground rounded-full p-1">
            <Pin className="h-3 w-3 fill-current" />
          </div>
        </div>
      )}

      {/* Task name */}
      <div className="font-medium text-sm leading-snug pr-4">
        {task.name}
      </div>

      {/* Description (if exists) */}
      {task.description && (
        <p className="text-xs text-muted-foreground line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Priority badge */}
      <div className="flex items-center gap-2">
        <PriorityDot priority={task.priority} />
        <span className="text-xs text-muted-foreground">
          {
            {
              1: 'ด่วนมาก',
              2: 'สูง',
              3: 'ปานกลาง',
              4: 'ต่ำ',
            }[task.priority]
          }
        </span>
      </div>

      {/* Due date */}
      {task.dueDate && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>
            {format(new Date(task.dueDate), 'd MMM yyyy', { locale: th })}
          </span>
        </div>
      )}

      {/* Footer: Comments, Checklists, Closed badge */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          {/* Comments count */}
          {task._count && task._count.comments > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MessageSquare className="h-3 w-3" />
              <span>{task._count.comments}</span>
            </div>
          )}

          {/* Checklists count */}
          {task._count && task._count.checklists > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <CheckSquare className="h-3 w-3" />
              <span>{task._count.checklists}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Closed badge */}
          {isClosed && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {task.closeType === 'COMPLETED' ? 'ปิดงาน' : 'ยกเลิก'}
            </Badge>
          )}
        </div>
      </div>

      {/* Assignee avatar - positioned at bottom right */}
      {task.assignees?.[0] && (
        <div className="absolute bottom-2 right-2">
          <UserAvatar user={task.assignees[0]} size="xs" />
        </div>
      )}
    </div>
  );
}

/**
 * TaskCardSkeleton - แสดง loading state ขณะดำเนินการกับ task
 */
interface TaskCardSkeletonProps {
  message?: string;
}

export function TaskCardSkeleton({ message = 'กำลังดำเนินการ...' }: TaskCardSkeletonProps) {
  return (
    <div className="relative bg-card border rounded-lg p-3">
      {/* Overlay with loading */}
      <div className="flex flex-col items-center justify-center py-8 gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

/**
 * TaskCardPlaceholder - Empty state สำหรับ column ที่ไม่มีงาน
 */
export function TaskCardPlaceholder() {
  return (
    <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
      <p className="text-sm text-muted-foreground">ไม่มีงานในสถานะนี้</p>
    </div>
  );
}
