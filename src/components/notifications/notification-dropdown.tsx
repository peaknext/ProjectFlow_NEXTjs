"use client";

import { useState, useEffect } from "react";
import { NotificationItem } from "./notification-item";
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
} from "@/hooks/use-notifications";
import { useUIStore } from "@/stores/use-ui-store";
import { Button } from "@/components/ui/button";
import { CheckCheck, Loader2 } from "lucide-react";

interface NotificationDropdownProps {
  onClose?: () => void;
}

export function NotificationDropdown({ onClose }: NotificationDropdownProps) {
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [markedAsReadOnce, setMarkedAsReadOnce] = useState(false);

  const openTaskPanel = useUIStore((state) => state.openTaskPanel);
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  // Fetch ทั้งหมด (unread + read) limit 50 รายการ
  const { data, isLoading } = useNotifications({
    isRead: undefined,  // fetch ทั้งหมด
    limit: 50,
  });

  const allNotifications = data?.notifications || [];

  // Filter ใน client-side ตาม showUnreadOnly
  // GAS: default แสดงทั้งหมด, toggle เพื่อดูแค่ unread
  const notifications = showUnreadOnly
    ? allNotifications.filter((n) => !n.isRead)  // แสดงแค่ unread
    : allNotifications;  // แสดงทั้งหมด (DEFAULT)

  const hasUnread = allNotifications.some((n) => !n.isRead);

  // Auto-mark as read when dropdown opens (with 2.5s delay)
  useEffect(() => {
    if (!markedAsReadOnce && hasUnread && allNotifications.length > 0) {
      const timer = setTimeout(() => {
        markAllAsRead.mutate();
        setMarkedAsReadOnce(true);
        // ไม่เปลี่ยน showAll → notifications ยังแสดงอยู่
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [hasUnread, allNotifications.length, markedAsReadOnce, markAllAsRead]);

  const handleNotificationClick = (notification: any) => {
    // Mark as read if not already
    if (!notification.isRead) {
      markAsRead.mutate(notification.id);
    }

    // Open task panel if taskId exists
    if (notification.taskId && notification.task?.project?.id) {
      openTaskPanel(notification.taskId, notification.task.project.id);
      onClose?.();
    }
  };

  const toggleUnreadOnly = () => {
    setShowUnreadOnly((prev) => !prev);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">กำลังโหลด...</p>
      </div>
    );
  }

  // Empty state
  if (notifications.length === 0) {
    return (
      <div>
        <div className="p-6 text-center">
          <CheckCheck className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600" />
          <p className="mt-2 text-sm text-muted-foreground">
            {showUnreadOnly
              ? "ไม่มีการแจ้งเตือนใหม่"
              : "ไม่มีการแจ้งเตือน"}
          </p>
        </div>

        {/* ถ้ากรองแค่ unread แต่มี notifications ทั้งหมด → แสดงปุ่มดูทั้งหมด */}
        {showUnreadOnly && allNotifications.length > 0 && (
          <div className="p-2 text-center border-t">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-primary hover:bg-primary/10"
              onClick={toggleUnreadOnly}
            >
              แสดงรายการที่อ่านแล้ว
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Notification List */}
      <div className="max-h-[400px] overflow-y-auto">
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onClick={() => handleNotificationClick(notification)}
          />
        ))}
      </div>

      {/* Footer with toggle button */}
      <div className="p-2 text-center border-t">
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-primary hover:bg-primary/10"
          onClick={toggleUnreadOnly}
        >
          {showUnreadOnly ? "แสดงทั้งหมด" : "ซ่อนรายการที่อ่านแล้ว"}
        </Button>
      </div>
    </div>
  );
}
