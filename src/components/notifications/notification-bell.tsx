"use client";

import { useState, useRef, useEffect } from "react";
import { NotificationDropdown } from "./notification-dropdown";
import { useUnreadCount } from "@/hooks/use-notifications";
import { formatUnreadBadge } from "@/lib/notification-utils";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);

  // Fetch unread count with 1-minute polling
  const { data } = useUnreadCount({ refetchInterval: 60 * 1000 });
  const unreadCount = data?.unreadCount || 0;

  const badgeText = formatUnreadBadge(unreadCount);
  const showBadge = unreadCount > 0;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
        >
          <Bell className="h-5 w-5" />
          {showBadge && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs font-semibold flex items-center justify-center">
              {badgeText}
            </span>
          )}
          <span className="sr-only">
            การแจ้งเตือน {unreadCount > 0 && `(${unreadCount} ใหม่)`}
          </span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[380px] p-0">
        {/* Header */}
        <div className="p-4 border-b">
          <h3 className="font-semibold text-base">การแจ้งเตือน</h3>
        </div>

        {/* Dropdown Content */}
        <NotificationDropdown onClose={() => setIsOpen(false)} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
