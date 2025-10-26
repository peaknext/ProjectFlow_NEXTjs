"use client";

import { useEffect, useState, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, MessageSquare, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";
import { useActivities } from "@/hooks/use-dashboard";
import { useUIStore } from "@/stores/use-ui-store";
import { useSyncStore } from "@/stores/use-sync-store";
import { cn } from "@/lib/utils";
import type { Activity as ActivityType, ActivityType as ActivityTypeEnum } from "@/types/dashboard";

/**
 * RecentActivitiesWidget Component
 *
 * Displays recent activities (comments + history) from department tasks.
 *
 * Features:
 * - Auto-polling every 60 seconds
 * - Displays 30 activities in scrollable container (5 visible)
 * - New items fade in at top with CSS transition
 * - Click activity to open task panel
 * - Extensible for future activity types
 */
export function RecentActivitiesWidget() {
  const { data, isLoading, isFetching } = useActivities();
  const activities = data?.activities || [];
  const [previousIds, setPreviousIds] = useState<string[]>([]);
  const [newActivityIds, setNewActivityIds] = useState<Set<string>>(new Set());
  const startSync = useSyncStore((state) => state.startSync);
  const endSync = useSyncStore((state) => state.endSync);
  const isSyncingRef = useRef(false);

  // Trigger sync animation when fetching
  useEffect(() => {
    if (isFetching && !isSyncingRef.current) {
      startSync();
      isSyncingRef.current = true;
    } else if (!isFetching && isSyncingRef.current) {
      endSync();
      isSyncingRef.current = false;
    }
  }, [isFetching, startSync, endSync]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isSyncingRef.current) {
        endSync();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Detect new activities on polling
  useEffect(() => {
    const currentIds = activities.map((a) => a.id);

    // First load - just save IDs without marking as new
    if (previousIds.length === 0 && currentIds.length > 0) {
      setPreviousIds(currentIds);
      return;
    }

    // No activities - reset only if not already empty (prevent infinite loop)
    if (currentIds.length === 0 && previousIds.length > 0) {
      setPreviousIds([]);
      return;
    }

    // No change in IDs - skip
    if (currentIds.length === previousIds.length &&
        currentIds.every((id, i) => id === previousIds[i])) {
      return;
    }

    // Compare with previous - find new activities
    const newIds = currentIds.filter((id) => !previousIds.includes(id));

    if (newIds.length > 0) {
      // Mark as new for animation
      setNewActivityIds(new Set(newIds));

      // Remove "new" marker after animation completes
      setTimeout(() => {
        setNewActivityIds(new Set());
      }, 500);
    }

    // Always update previous IDs to current
    setPreviousIds(currentIds);
  }, [activities, previousIds]); // Need both dependencies for comparison

  if (isLoading) {
    return <RecentActivitiesSkeleton />;
  }

  // Empty state
  if (!activities || activities.length === 0) {
    return (
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-lg">ความเคลื่อนไหวล่าสุด</CardTitle>
        </CardHeader>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center text-center space-y-3">
            <Activity className="h-12 w-12 text-muted-foreground" />
            <div>
              <p className="font-medium text-muted-foreground">
                ยังไม่มีกิจกรรมล่าสุด
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                เริ่มทำงานเพื่อดูกิจกรรมของทีม
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Keep only 30 activities
  const displayActivities = activities.slice(0, 30);

  return (
    <Card className="flex flex-col">
      <CardHeader className="border-b px-6 py-4 flex-shrink-0">
        <CardTitle className="text-lg">ความเคลื่อนไหวล่าสุด</CardTitle>
      </CardHeader>

      <CardContent className="p-0">
        {/* Scrollable container: 5 cards visible (128px each = 640px) */}
        <div className="h-[640px] overflow-y-auto activities-scrollbar">
          {displayActivities.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              isNew={newActivityIds.has(activity.id)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * ActivityCard Component
 *
 * Single activity row (128px fixed height).
 * Displays user avatar, activity content, project, and timestamp.
 */
interface ActivityCardProps {
  activity: ActivityType;
  isNew?: boolean;
}

function ActivityCard({ activity, isNew = false }: ActivityCardProps) {
  const openTaskPanel = useUIStore((state) => state.openTaskPanel);

  // Get user initials for avatar fallback
  const getInitials = (fullName: string) => {
    const names = fullName.trim().split(" ");
    if (names.length === 1) {
      return names[0].substring(0, 2).toUpperCase();
    }
    return names
      .slice(0, 3)
      .map((name) => name.charAt(0))
      .join("")
      .toUpperCase();
  };

  // Format relative time
  const relativeTime = formatDistanceToNow(new Date(activity.timestamp), {
    addSuffix: true,
    locale: th,
  });

  const initials = getInitials(activity.user.fullName);

  // Handle click - open task panel (extensible for future action types)
  const handleClick = () => {
    if (activity.task?.id) {
      openTaskPanel(activity.task.id);
    }
    // Future: Handle other activity types (e.g., user requests, mentions)
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "h-32 p-4 flex gap-3 border-b last:border-b-0",
        "hover:bg-muted/50 cursor-pointer transition-all duration-200",
        // New activity animation
        isNew && "animate-fade-in-scale bg-blue-50 dark:bg-blue-950/20"
      )}
    >
      {/* Avatar */}
      <Avatar className="h-10 w-10 flex-shrink-0 mt-0.5">
        {activity.user?.profileImageUrl && (
          <AvatarImage
            src={activity.user.profileImageUrl}
            alt={activity.user.fullName}
          />
        )}
        <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
          {initials}
        </AvatarFallback>
      </Avatar>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col justify-start py-0.5">
        {/* User name + badge */}
        <div className="flex items-center gap-2 mb-1">
          <p className="font-medium text-sm truncate">
            {activity.user.fullName}
          </p>
          <ActivityBadge type={activity.type} />
        </div>

        {/* Content (max 2 lines with line-clamp) */}
        <p className="text-sm text-muted-foreground line-clamp-2 mb-1">
          {activity.content}
        </p>

        {/* Metadata: project + time */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="truncate max-w-[150px]">
            {activity.project.name}
          </span>
          <span>•</span>
          <span className="flex-shrink-0">{relativeTime}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * ActivityBadge Component
 *
 * Small badge showing activity type (comment/history).
 * Extensible for future types (mention, attachment, etc.)
 */
interface ActivityBadgeProps {
  type: ActivityTypeEnum;
}

function ActivityBadge({ type }: ActivityBadgeProps) {
  const config: Record<
    ActivityTypeEnum,
    { icon: typeof MessageSquare; className: string; label: string }
  > = {
    comment: {
      icon: MessageSquare,
      className: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
      label: "ความคิดเห็น",
    },
    history: {
      icon: Clock,
      className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
      label: "ประวัติ",
    },
  };

  const Icon = config[type].icon;

  return (
    <div
      className={cn(
        "px-1.5 py-0.5 rounded text-[10px] flex items-center gap-1 flex-shrink-0",
        config[type].className
      )}
      title={config[type].label}
    >
      <Icon className="h-3 w-3" />
    </div>
  );
}

/**
 * RecentActivitiesSkeleton Component
 *
 * Loading skeleton with 5 activity rows
 */
function RecentActivitiesSkeleton() {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="border-b px-6 py-4 flex-shrink-0">
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent className="p-0 flex-1">
        <div className="h-[400px]">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 p-4 flex gap-3 border-b">
              <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2 flex flex-col justify-center">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
