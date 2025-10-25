'use client';

import { format } from 'date-fns';
import { th } from 'date-fns/locale';

interface Creator {
  id: string;
  fullName: string;
  email: string;
}

interface TaskMetadataProps {
  creator?: Creator | null;
  createdAt?: string;
}

/**
 * TaskMetadata Component
 *
 * Displays task creator and creation date.
 * Features:
 * - Creator name (from task creator object)
 * - Date created (formatted with Thai locale)
 * - Small text, muted color
 *
 * @example
 * <TaskMetadata
 *   creator={task.creator}
 *   createdAt={task.createdAt}
 * />
 */
export function TaskMetadata({ creator, createdAt }: TaskMetadataProps) {
  // Format date
  const formattedDate = createdAt
    ? format(new Date(createdAt), 'd MMMM yyyy, HH:mm', { locale: th })
    : '-';

  return (
    <div className="flex items-center justify-end gap-4 text-xs text-muted-foreground">
      <div className="flex items-center gap-1.5">
        <span>สร้างโดย:</span>
        <span className="font-medium text-foreground">
          {creator?.fullName || '-'}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <span>วันที่สร้าง:</span>
        <span className="font-medium text-foreground">{formattedDate}</span>
      </div>
    </div>
  );
}
