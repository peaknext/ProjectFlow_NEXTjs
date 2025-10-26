'use client';

import { format } from 'date-fns';
import { th } from 'date-fns/locale';

interface Creator {
  id: string;
  fullName: string;
  email: string;
}

interface Department {
  id: string;
  name: string;
}

interface TaskMetadataProps {
  creator?: Creator | null;
  createdAt?: string;
  department?: Department | null;
}

/**
 * TaskMetadata Component
 *
 * Displays task creator, creation date, and department.
 * Features:
 * - Creator name (from task creator object)
 * - Date created (formatted with Thai locale)
 * - Department name (helps identify cross-department tasks)
 * - Small text, muted color
 *
 * @example
 * <TaskMetadata
 *   creator={task.creator}
 *   createdAt={task.createdAt}
 *   department={task.project.department}
 * />
 */
export function TaskMetadata({ creator, createdAt, department }: TaskMetadataProps) {
  // Format date with Thai Buddhist Era (พ.ศ.)
  const formattedDate = createdAt
    ? (() => {
        const date = new Date(createdAt);
        const thaiYear = date.getFullYear() + 543;
        const dateStr = format(date, 'd MMMM yyyy, HH:mm', { locale: th });
        return dateStr.replace(/\d{4}/, thaiYear.toString());
      })()
    : '-';

  return (
    <div className="flex flex-col gap-2">
      {/* Creator and Date Row */}
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

      {/* Department Row */}
      {department && (
        <div className="flex items-center justify-end gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span>หน่วยงาน:</span>
            <span className="font-medium text-foreground">
              {department.name}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
