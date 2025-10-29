/**
 * Notifications Page (Mobile-First)
 *
 * Dedicated page for viewing all notifications on mobile devices.
 * Reuses existing notification components from notification-dropdown.
 *
 * Features:
 * - Show all notifications (unread + read)
 * - Filter toggle (all vs unread only)
 * - Mark all as read button
 * - Click notification to open task panel
 * - Pull-to-refresh (Phase 10)
 * - Works on both mobile and desktop
 *
 * Route: /notifications
 */

'use client';

import { useState } from 'react';
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
} from '@/hooks/use-notifications';
import { useUIStore } from '@/stores/use-ui-store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { NotificationItem } from '@/components/notifications/notification-item';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { SwipeablePages } from '@/components/layout/swipeable-pages';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCheck, Bell, BellOff } from 'lucide-react';

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');

  const openTaskPanel = useUIStore((state) => state.openTaskPanel);
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  // Fetch all notifications (limit 100 for full page view)
  const { data, isLoading } = useNotifications({
    isRead: undefined, // fetch all
    limit: 100,
  });

  const allNotifications = data?.notifications || [];

  // Filter by active tab
  const notifications =
    activeTab === 'unread'
      ? allNotifications.filter((n) => !n.isRead)
      : allNotifications;

  const unreadCount = allNotifications.filter((n) => !n.isRead).length;
  const hasUnread = unreadCount > 0;

  const handleNotificationClick = (notification: any) => {
    // Mark as read if not already
    if (!notification.isRead) {
      markAsRead.mutate(notification.id);
    }

    // Open task panel if taskId exists
    if (notification.taskId) {
      openTaskPanel(notification.taskId);
    }
  };

  const handleMarkAllAsRead = () => {
    if (hasUnread) {
      markAllAsRead.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-2" />
          <p className="text-sm text-muted-foreground">กำลังโหลดการแจ้งเตือน...</p>
        </div>
      </div>
    );
  }

  return (
    <SwipeablePages>
      <div className="h-full">
        {/* Page Header - Hidden on mobile (shown in mobile-top-bar) */}
        <div className="hidden md:flex md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">การแจ้งเตือน</h1>
          <p className="text-muted-foreground">การแจ้งเตือนทั้งหมดของคุณ</p>
        </div>
        {hasUnread && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={markAllAsRead.isPending}
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            ทำเครื่องหมายว่าอ่านแล้วทั้งหมด
          </Button>
        )}
      </div>

      {/* Mobile Header with Mark All Button */}
      <div className="md:hidden flex items-center justify-between mb-4">
        {hasUnread && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={markAllAsRead.isPending}
            className="ml-auto"
          >
            <CheckCheck className="h-4 w-4 mr-1" />
            <span className="text-xs">อ่านแล้วทั้งหมด</span>
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'all' | 'unread')}>
        <TabsList className="w-full grid grid-cols-2 mb-4">
          <TabsTrigger value="all" className="gap-2">
            <Bell className="h-4 w-4" />
            <span>ทั้งหมด</span>
            <Badge variant="secondary" className="ml-1 text-xs">
              {allNotifications.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="unread" className="gap-2">
            <BellOff className="h-4 w-4" />
            <span>ยังไม่ได้อ่าน</span>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-1 text-xs">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* All Notifications Tab */}
        <TabsContent value="all" className="mt-0">
          {notifications.length === 0 ? (
            <Card className="p-12 text-center">
              <Bell className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground">ไม่มีการแจ้งเตือน</p>
            </Card>
          ) : (
            <div className="space-y-0">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className="cursor-pointer"
                >
                  <NotificationItem notification={notification} />
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Unread Notifications Tab */}
        <TabsContent value="unread" className="mt-0">
          {notifications.length === 0 ? (
            <Card className="p-12 text-center">
              <CheckCheck className="h-12 w-12 mx-auto mb-3 text-green-500 opacity-50" />
              <p className="text-sm text-muted-foreground">ไม่มีการแจ้งเตือนที่ยังไม่ได้อ่าน</p>
              <p className="text-xs text-muted-foreground mt-1">คุณอ่านครบแล้ว! 🎉</p>
            </Card>
          ) : (
            <div className="space-y-0">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className="cursor-pointer"
                >
                  <NotificationItem notification={notification} />
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

        {/* Pull to Refresh Hint - Mobile Only */}
        <div className="md:hidden text-center mt-8 mb-4 text-xs text-muted-foreground">
          <p>ดึงลงเพื่อรีเฟรช</p>
          <p className="text-[10px]">(Phase 10 - Coming Soon)</p>
        </div>
      </div>
    </SwipeablePages>
  );
}
