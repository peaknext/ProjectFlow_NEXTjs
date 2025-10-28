/**
 * BottomNavigation Component
 *
 * Mobile bottom navigation with 5 tabs (Facebook-style)
 * Features:
 * - Fixed at bottom of screen
 * - Active state with primary color
 * - Badge for notifications count
 * - Touch-friendly tap targets (48x48px minimum)
 *
 * Tabs:
 * 1. 🏠 หน้าหลัก → /dashboard
 * 2. 📋 งานของฉัน → /my-tasks
 * 3. ➕ สร้าง → Opens CreateTaskModal
 * 4. 🔔 แจ้งเตือน → /notifications
 * 5. ☰ เมนู → Opens MobileMenu drawer
 */

'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Home,
  CheckSquare,
  PlusCircle,
  Bell,
  Menu,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/use-ui-store';
import { useNotifications } from '@/hooks/use-notifications';
import { Badge } from '@/components/ui/badge';
import { MobileMenu } from '@/components/layout/mobile-menu';

const tabs = [
  {
    id: 'home',
    label: 'หน้าหลัก',
    icon: Home,
    href: '/dashboard',
    type: 'link' as const,
  },
  {
    id: 'my-tasks',
    label: 'งานของฉัน',
    icon: CheckSquare,
    href: '/my-tasks',
    type: 'link' as const,
  },
  {
    id: 'create',
    label: 'สร้าง',
    icon: PlusCircle,
    href: null,
    type: 'action' as const,
    action: 'create',
  },
  {
    id: 'notifications',
    label: 'แจ้งเตือน',
    icon: Bell,
    href: '/notifications',
    type: 'link' as const,
    showBadge: true,
  },
  {
    id: 'menu',
    label: 'เมนู',
    icon: Menu,
    href: null,
    type: 'action' as const,
    action: 'menu',
  },
];

export function BottomNavigation() {
  const pathname = usePathname();
  const openCreateTaskModal = useUIStore((state) => state.openCreateTaskModal);

  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const openMobileMenu = () => {
    setMobileMenuOpen(true);
  };

  // Get unread notifications count for badge
  const { data: notificationsData } = useNotifications();
  const unreadCount = notificationsData?.notifications?.filter(n => !n.isRead).length || 0;

  const handleTabClick = (tab: typeof tabs[number]) => {
    if (tab.type === 'action') {
      // Handle action tabs (Create, Menu)
      if (tab.action === 'create') {
        openCreateTaskModal({});
      } else if (tab.action === 'menu') {
        openMobileMenu();
      }
    }
    // Link tabs handled by Next.js Link component
  };

  const isActive = (tab: typeof tabs[number]): boolean => {
    if (!tab.href) return false;
    return pathname === tab.href || pathname?.startsWith(tab.href + '/');
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t"
      role="navigation"
      aria-label="Mobile bottom navigation"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab);

          const tabClassName = cn(
            'flex flex-col items-center justify-center',
            'flex-1 h-full',
            'min-h-[48px] min-w-[48px]', // Touch-friendly tap target
            'transition-colors duration-200',
            'relative', // For badge positioning
            !active && 'text-muted-foreground hover:text-foreground',
            active && 'text-primary'
          );

          const tabContent = (
            <>
              {/* Icon with optional badge */}
              <div className="relative">
                <Icon className="h-6 w-6" />

                {/* Notification Badge */}
                {tab.showBadge && unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
              </div>

              {/* Label */}
              <span
                className={cn(
                  'text-xs font-medium mt-1',
                  'truncate max-w-full px-1'
                )}
              >
                {tab.label}
              </span>

              {/* Active indicator - bottom border */}
              {active && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-primary rounded-t-full" />
              )}
            </>
          );

          // Render Link for link tabs, button for action tabs
          if (tab.type === 'link' && tab.href) {
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={tabClassName}
                aria-label={tab.label}
                aria-current={active ? 'page' : undefined}
              >
                {tabContent}
              </Link>
            );
          }

          // Render button for action tabs
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabClick(tab)}
              className={tabClassName}
              aria-label={tab.label}
              aria-current={active ? 'page' : undefined}
            >
              {tabContent}
            </button>
          );
        })}
      </div>

      {/* Mobile Menu Drawer */}
      <MobileMenu open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} />
    </nav>
  );
}
