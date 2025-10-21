'use client';

import { UserAvatar } from '@/components/common/user-avatar';
import { formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';

interface User {
  id: string;
  fullName: string;
  email: string;
  profileImageUrl?: string | null;
}

interface Activity {
  id: string;
  description: string;
  createdAt: string;
  user: User;
}

interface ActivityTimelineProps {
  activities: Activity[];
}

/**
 * ActivityTimeline Component
 *
 * Displays task activity history in timeline format.
 * Features:
 * - Sorted newest first
 * - User avatar + name (bold)
 * - Activity description
 * - Relative timestamp (e.g., "2 ชั่วโมงแล้ว")
 * - Vertical timeline layout with borders
 *
 * @example
 * <ActivityTimeline activities={history} />
 */
export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  // Format relative time
  const formatRelativeTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return formatDistanceToNow(date, { addSuffix: true, locale: th });
    } catch (error) {
      return timestamp;
    }
  };

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div
          key={activity.id}
          className="flex items-start gap-3"
        >
          {/* User Avatar */}
          <UserAvatar
            user={activity.user}
            size="md"
            className="flex-shrink-0 mt-0.5"
          />

          {/* Activity Details */}
          <div className="flex-1 min-w-0">
            {/* User Name (bold) + Description */}
            <p className="text-sm text-foreground">
              <span className="font-semibold">{activity.user.fullName}</span>{' '}
              {activity.description}
            </p>
            {/* Relative Time */}
            <span className="text-xs text-muted-foreground">
              {formatRelativeTime(activity.createdAt)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
