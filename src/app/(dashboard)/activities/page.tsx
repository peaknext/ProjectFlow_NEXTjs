/**
 * Activities Page (Mobile-First)
 *
 * Dedicated page for viewing recent activities across all tasks.
 * Shows activity feed with:
 * - User avatar and name
 * - Activity description
 * - Task and project context
 * - Timestamp (relative)
 * - Touch-friendly design
 *
 * Route: /activities
 */

'use client';

import { useActivities } from '@/hooks/use-dashboard';
import { useUIStore } from '@/stores/use-ui-store';
import { Card } from '@/components/ui/card';
import { Loader2, Activity as ActivityIcon, ChevronRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function ActivitiesPage() {
  const { data, isLoading } = useActivities();
  const openTaskPanel = useUIStore((state) => state.openTaskPanel);

  const activities = data?.activities || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-12">
        <ActivityIcon className="h-16 w-16 mx-auto mb-4 opacity-20" />
        <h3 className="text-lg font-medium mb-2">ไม่มีกิจกรรม</h3>
        <p className="text-sm text-muted-foreground">
          กิจกรรมล่าสุดของคุณจะปรากฏที่นี่
        </p>
      </div>
    );
  }

  return (
    <div className="h-full pb-4">
      {/* Page Header - Hidden on mobile (shown in mobile-top-bar) */}
      <div className="hidden md:block mb-6">
        <h1 className="text-2xl font-bold">กิจกรรม</h1>
        <p className="text-muted-foreground">กิจกรรมล่าสุดของคุณ</p>
      </div>

      {/* Activities List */}
      <div className="space-y-2">
        {activities.map((activity: any) => {
          return (
            <Card
              key={activity.id}
              className={cn(
                'p-4 cursor-pointer transition-colors hover:bg-accent/50',
                'active:bg-accent'
              )}
              onClick={() => activity.task?.id && openTaskPanel(activity.task.id)}
            >
              <div className="flex items-start gap-3">
                {/* User Avatar */}
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarImage
                    src={
                      activity.user.profileImageUrl ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${activity.user.id}`
                    }
                    alt={activity.user.fullName}
                  />
                  <AvatarFallback className="text-sm">
                    {activity.user.fullName?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>

                {/* Activity Content */}
                <div className="flex-1 min-w-0">
                  {/* Activity Text */}
                  <p className="text-sm leading-relaxed mb-2">
                    <span className="font-medium">{activity.user.fullName}</span>
                    {' '}
                    <span className="text-muted-foreground">{activity.content}</span>
                  </p>

                  {/* Task Name */}
                  {activity.task && (
                    <p className="text-xs text-muted-foreground mb-1 line-clamp-1">
                      📋 {activity.task.name}
                    </p>
                  )}

                  {/* Project Name */}
                  {activity.project && (
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                      📁 {activity.project.name}
                    </p>
                  )}

                  {/* Timestamp */}
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.timestamp), {
                      addSuffix: true,
                      locale: th,
                    })}
                  </p>
                </div>

                {/* Chevron */}
                <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-2" />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Pull to Refresh Hint - Mobile Only */}
      <div className="md:hidden text-center mt-8 mb-4 text-xs text-muted-foreground">
        <p>ดึงลงเพื่อรีเฟรช</p>
        <p className="text-[10px]">(Coming Soon)</p>
      </div>
    </div>
  );
}
