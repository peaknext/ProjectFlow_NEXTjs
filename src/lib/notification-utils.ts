/**
 * Notification Utilities
 *
 * Helper functions for notification display and formatting
 */

import { type NotificationType } from "@/hooks/use-notifications";
import { formatDistanceToNow } from "date-fns";
import { th } from "date-fns/locale";

// ============================================
// ICON MAPPING
// ============================================

export interface NotificationIcon {
  name: string;
  bgColor: string;
  iconColor: string;
}

/**
 * Get icon configuration for notification type
 * Maps notification types to Lucide icons and colors
 */
export function getNotificationIcon(type: NotificationType): NotificationIcon {
  switch (type) {
    case "TASK_ASSIGNED":
      return {
        name: "UserPlus", // person_add → UserPlus
        bgColor: "bg-blue-500",
        iconColor: "text-blue-600 dark:text-blue-400",
      };
    case "COMMENT_MENTION":
      return {
        name: "AtSign", // alternate_email → AtSign
        bgColor: "bg-purple-500",
        iconColor: "text-purple-600 dark:text-purple-400",
      };
    case "TASK_UPDATED":
      return {
        name: "RefreshCw", // sync_alt → RefreshCw
        bgColor: "bg-green-500",
        iconColor: "text-green-600 dark:text-green-400",
      };
    case "TASK_CLOSED":
      return {
        name: "CheckCircle", // done → CheckCircle
        bgColor: "bg-emerald-500",
        iconColor: "text-emerald-600 dark:text-emerald-400",
      };
    case "PROJECT_UPDATED":
      return {
        name: "FolderEdit", // folder → FolderEdit
        bgColor: "bg-orange-500",
        iconColor: "text-orange-600 dark:text-orange-400",
      };
    default:
      return {
        name: "Bell", // notifications → Bell
        bgColor: "bg-gray-500",
        iconColor: "text-gray-600 dark:text-gray-400",
      };
  }
}

// ============================================
// TIME FORMATTING
// ============================================

/**
 * Format notification timestamp as relative time in Thai
 * Examples: "2 นาทีที่แล้ว", "1 ชั่วโมงที่แล้ว", "3 วันที่แล้ว"
 */
export function formatNotificationTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    return formatDistanceToNow(date, {
      addSuffix: true,
      locale: th,
    });
  } catch (error) {
    console.error("Error formatting notification time:", error);
    return dateString;
  }
}

/**
 * Format relative time (backward compatibility with old GAS)
 * Alias for formatNotificationTime
 */
export function formatRelativeTime(dateString: string): string {
  return formatNotificationTime(dateString);
}

// ============================================
// NOTIFICATION GROUPING
// ============================================

/**
 * Group notifications by time periods
 * Returns: "วันนี้", "เมื่อวาน", "สัปดาห์นี้", "เก่ากว่า"
 */
export function getNotificationTimePeriod(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

  if (diffInHours < 24) {
    return "วันนี้";
  } else if (diffInHours < 48) {
    return "เมื่อวาน";
  } else if (diffInHours < 168) {
    // 7 days
    return "สัปดาห์นี้";
  } else {
    return "เก่ากว่า";
  }
}

/**
 * Group notifications by time period
 */
export function groupNotificationsByTime<T extends { createdAt: string }>(
  notifications: T[]
): Record<string, T[]> {
  const groups: Record<string, T[]> = {
    วันนี้: [],
    เมื่อวาน: [],
    สัปดาห์นี้: [],
    เก่ากว่า: [],
  };

  notifications.forEach((notification) => {
    const period = getNotificationTimePeriod(notification.createdAt);
    groups[period].push(notification);
  });

  // Remove empty groups
  return Object.fromEntries(
    Object.entries(groups).filter(([_, items]) => items.length > 0)
  );
}

// ============================================
// NOTIFICATION MESSAGES
// ============================================

/**
 * Get user-friendly notification message
 * (Backend already provides message, but this can be used for customization)
 */
export function getNotificationMessage(
  type: NotificationType,
  triggeredByName?: string,
  taskName?: string
): string {
  switch (type) {
    case "TASK_ASSIGNED":
      return `${triggeredByName} ได้มอบหมายงาน "${taskName}" ให้กับคุณ`;
    case "COMMENT_MENTION":
      return `${triggeredByName} ได้แท็กคุณในความคิดเห็น`;
    case "TASK_UPDATED":
      return `${triggeredByName} ได้อัพเดทงาน "${taskName}"`;
    case "TASK_CLOSED":
      return `${triggeredByName} ได้ปิดงาน "${taskName}"`;
    case "PROJECT_UPDATED":
      return `${triggeredByName} ได้อัพเดทโปรเจกต์`;
    default:
      return "คุณมีการแจ้งเตือนใหม่";
  }
}

// ============================================
// BADGE DISPLAY
// ============================================

/**
 * Format unread count for badge display
 * Returns: "9+" for counts > 9, otherwise the count
 */
export function formatUnreadBadge(count: number): string {
  if (count <= 0) return "";
  if (count > 9) return "9+";
  return count.toString();
}

/**
 * Check if notification should show unread indicator
 */
export function shouldShowUnreadIndicator(
  isRead: boolean,
  createdAt: string
): boolean {
  // Don't show indicator for read notifications
  if (isRead) return false;

  // Don't show indicator for very old notifications (> 7 days)
  const date = new Date(createdAt);
  const now = new Date();
  const diffInDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);

  return diffInDays < 7;
}
