"use client";

import { type Notification } from "@/hooks/use-notifications";
import {
  formatNotificationTime,
  getNotificationIcon,
  shouldShowUnreadIndicator,
} from "@/lib/notification-utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, UserPlus, AtSign, RefreshCw, CheckCircle, FolderEdit } from "lucide-react";
import { cn } from "@/lib/utils";

interface NotificationItemProps {
  notification: Notification;
  onClick?: () => void;
}

// Icon component mapping
const IconMap = {
  Bell,
  UserPlus,
  AtSign,
  RefreshCw,
  CheckCircle,
  FolderEdit,
};

export function NotificationItem({
  notification,
  onClick,
}: NotificationItemProps) {
  const { name: iconName, bgColor, iconColor } = getNotificationIcon(
    notification.type
  );
  const IconComponent = IconMap[iconName as keyof typeof IconMap] || Bell;

  const showUnreadIndicator = shouldShowUnreadIndicator(
    notification.isRead,
    notification.createdAt
  );

  return (
    <div
      className={cn(
        "p-4 hover:bg-muted/50 cursor-pointer border-b last:border-b-0 transition-colors",
        !notification.isRead && "bg-blue-50/50 dark:bg-blue-900/10"
      )}
      onClick={onClick}
    >
      <div className="flex gap-3">
        {/* Avatar or Icon */}
        <div className="relative flex-shrink-0">
          {notification.triggeredBy?.profileImageUrl ? (
            <>
              <Avatar className="w-10 h-10">
                <AvatarImage
                  src={notification.triggeredBy.profileImageUrl}
                  alt={notification.triggeredBy.fullName}
                />
                <AvatarFallback>
                  {notification.triggeredBy.fullName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              {/* Icon badge on avatar */}
              <span
                className={cn(
                  "absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-white",
                  bgColor
                )}
              >
                <IconComponent className="h-3 w-3" />
              </span>
            </>
          ) : (
            /* No triggeredBy - show icon only */
            <div
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                "bg-blue-100 dark:bg-blue-900/30"
              )}
            >
              <IconComponent
                className={cn("h-5 w-5", iconColor)}
              />
            </div>
          )}

          {/* Unread indicator dot */}
          {showUnreadIndicator && (
            <span className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-white dark:border-gray-800" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Message */}
          <p className="text-sm text-foreground line-clamp-2">
            {notification.message}
          </p>

          {/* Task name (if available) */}
          {notification.task && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
              งาน: {notification.task.name}
            </p>
          )}

          {/* Timestamp */}
          <p className="text-xs text-muted-foreground mt-1">
            {formatNotificationTime(notification.createdAt)}
          </p>
        </div>
      </div>
    </div>
  );
}
