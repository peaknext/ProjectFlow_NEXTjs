/**
 * MobileLayout Component
 *
 * Mobile-optimized layout for screens < 768px
 * Features:
 * - Bottom navigation (5 tabs: Home, My Tasks, Create, Notifications, Menu)
 * - Mobile top bar (back button, title, actions)
 * - No sidebar (replaced by hamburger menu)
 * - Full-screen modals
 * - Pull-to-refresh support (added in Phase 10)
 *
 * Layout Structure:
 * ┌────────────────────────────────────────┐
 * │ Mobile Top Bar (Back, Title, Actions)  │
 * ├────────────────────────────────────────┤
 * │                                        │
 * │                                        │
 * │   Main Content (Scrollable)            │
 * │   + padding-bottom for bottom nav      │
 * │                                        │
 * │                                        │
 * ├────────────────────────────────────────┤
 * │ Bottom Nav (Home, Tasks, +, 🔔, Menu) │
 * └────────────────────────────────────────┘
 *
 * Used when viewport < 768px (mobile devices)
 */

'use client';

import { BottomNavigation } from '@/components/layout/bottom-navigation';
import { MobileTopBar } from '@/components/layout/mobile-top-bar';
import { TaskPanel } from '@/components/task-panel';
import { CreateTaskModal } from '@/components/modals/create-task-modal';
import { CreateProjectModal } from '@/components/modals/create-project-modal';
import { CreateUserModal } from '@/components/modals/create-user-modal';
import { EditUserModal } from '@/components/modals/edit-user-modal';
import { EditProjectModal } from '@/components/modals/edit-project-modal';
import { Toaster } from 'sonner';

interface MobileLayoutProps {
  children: React.ReactNode;
}

export function MobileLayout({ children }: MobileLayoutProps) {
  return (
    <div className="flex flex-col h-screen">
      {/* Mobile Top Bar - Sticky */}
      <MobileTopBar />

      {/* Main Content Area - Scrollable with bottom padding */}
      <main className="flex-1 overflow-y-auto pb-16 bg-muted/40">
        {/* pb-16 (64px) to prevent content hiding under bottom nav */}
        {children}
      </main>

      {/* Bottom Navigation - Fixed at bottom */}
      <BottomNavigation />

      {/* Global Task Panel - Full-screen on mobile */}
      <TaskPanel />

      {/* Global Modals - Full-screen on mobile */}
      <CreateTaskModal />
      <CreateProjectModal />
      <CreateUserModal />
      <EditUserModal />
      <EditProjectModal />

      {/* Toast Notifications - Mobile optimized */}
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            fontFamily: 'var(--font-sarabun), sans-serif',
          },
          // Mobile-specific toast styling
          className: 'text-sm',
        }}
      />
    </div>
  );
}
