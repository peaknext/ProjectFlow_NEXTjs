'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

interface User {
  id: string;
  name: string;
  email: string;
}

interface TaskMetadataProps {
  creatorId?: string;
  dateCreated?: string;
}

/**
 * TaskMetadata Component
 *
 * Displays task creator and creation date.
 * Features:
 * - Creator name (fetched from API if not provided)
 * - Date created (formatted with Thai locale)
 * - Small text, muted color
 * - Loading skeleton
 *
 * @example
 * <TaskMetadata
 *   creatorId={task.creatorId}
 *   dateCreated={task.dateCreated}
 * />
 */
export function TaskMetadata({ creatorId, dateCreated }: TaskMetadataProps) {
  // Fetch creator user data
  const { data: creator, isLoading } = useQuery({
    queryKey: ['user', creatorId],
    queryFn: async () => {
      if (!creatorId) return null;
      const response = await api.get<{ user: User }>(`/api/users/${creatorId}`);
      return response.user;
    },
    enabled: !!creatorId,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  // Format date
  const formattedDate = dateCreated
    ? format(new Date(dateCreated), 'd MMMM yyyy, HH:mm', { locale: th })
    : '-';

  if (isLoading) {
    return (
      <div className="flex items-center justify-end gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span>สร้างโดย:</span>
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex items-center gap-1.5">
          <span>วันที่สร้าง:</span>
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end gap-4 text-xs text-muted-foreground">
      <div className="flex items-center gap-1.5">
        <span>สร้างโดย:</span>
        <span className="font-medium text-foreground">
          {creator?.name || creatorId || '-'}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <span>วันที่สร้าง:</span>
        <span className="font-medium text-foreground">{formattedDate}</span>
      </div>
    </div>
  );
}
