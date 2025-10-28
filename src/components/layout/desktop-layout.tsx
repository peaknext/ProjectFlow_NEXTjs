/**
 * DesktopLayout Component
 *
 * Desktop-optimized layout for screens >= 768px
 * Features:
 * - Left sidebar navigation (256px fixed width)
 * - Top navbar with logo, search, notifications, profile
 * - Main content area with scrolling
 * - Global modals (Task Panel, Create Task, etc.)
 *
 * Layout Structure:
 * ┌────────────────────────────────────────┐
 * │ Navbar (Logo, Search, Profile)         │
 * ├──────────┬─────────────────────────────┤
 * │          │                             │
 * │ Sidebar  │   Main Content              │
 * │ (256px)  │   (Scrollable)              │
 * │          │                             │
 * └──────────┴─────────────────────────────┘
 *
 * Used when viewport >= 768px (md breakpoint)
 */

'use client';

import { Navbar } from '@/components/layout/navbar';
import { Sidebar } from '@/components/layout/sidebar';
import { TaskPanel } from '@/components/task-panel';
import { CreateTaskModal } from '@/components/modals/create-task-modal';
import { CreateProjectModal } from '@/components/modals/create-project-modal';
import { CreateUserModal } from '@/components/modals/create-user-modal';
import { EditUserModal } from '@/components/modals/edit-user-modal';
import { EditProjectModal } from '@/components/modals/edit-project-modal';
import { Toaster } from 'sonner';

interface DesktopLayoutProps {
  children: React.ReactNode;
}

export function DesktopLayout({ children }: DesktopLayoutProps) {
  return (
    <div className="flex h-screen flex-col">
      {/* Top Navbar - Fixed */}
      <Navbar />

      {/* Main Layout - Sidebar + Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Fixed width, scrollable */}
        <Sidebar />

        {/* Main Content Area - Flexible, scrollable */}
        <main className="flex-1 overflow-y-auto p-6 bg-muted/40">
          {children}
        </main>
      </div>

      {/* Global Task Panel - Slide-in from right when opened */}
      <TaskPanel />

      {/* Global Modals - Open when triggered */}
      <CreateTaskModal />
      <CreateProjectModal />
      <CreateUserModal />
      <EditUserModal />
      <EditProjectModal />

      {/* Toast Notifications - Global */}
      <Toaster
        toastOptions={{
          style: {
            fontFamily: 'var(--font-sarabun), sans-serif',
          },
        }}
      />
    </div>
  );
}
