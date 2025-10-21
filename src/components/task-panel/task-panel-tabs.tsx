'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

export type TaskPanelTab = 'details' | 'history';

interface TaskPanelTabsProps {
  defaultTab?: TaskPanelTab;
  onTabChange?: (tab: TaskPanelTab) => void;
}

/**
 * TaskPanelTabs Component
 *
 * Tab navigation for Details and History sections.
 * Features:
 * - Two tabs: Details (default) and History
 * - Active state styling (border + text color)
 * - Click to switch tabs
 * - Manages active tab state internally
 *
 * Note: Tab content visibility is managed by parent components
 * using the `useTaskPanelTab` hook or data attributes.
 *
 * @example
 * <TaskPanelTabs onTabChange={(tab) => setActiveTab(tab)} />
 */
export function TaskPanelTabs({ defaultTab = 'details', onTabChange }: TaskPanelTabsProps) {
  const [activeTab, setActiveTab] = useState<TaskPanelTab>(defaultTab);

  const handleTabClick = (tab: TaskPanelTab) => {
    setActiveTab(tab);
    onTabChange?.(tab);

    // Also emit custom event for components that need to listen
    const event = new CustomEvent('taskpanel:tabchange', { detail: { tab } });
    document.dispatchEvent(event);
  };

  return (
    <div className="border-b border-slate-200 dark:border-slate-800">
      <nav className="flex px-4 -mb-px overflow-x-auto">
        <button
          onClick={() => handleTabClick('details')}
          className={cn(
            'px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors',
            activeTab === 'details'
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-primary'
          )}
        >
          รายละเอียด
        </button>

        <button
          onClick={() => handleTabClick('history')}
          className={cn(
            'px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors',
            activeTab === 'history'
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-primary'
          )}
        >
          ประวัติ
        </button>
      </nav>
    </div>
  );
}

/**
 * useTaskPanelTab Hook
 *
 * Hook to manage tab state and listen for tab changes.
 * Used by Details and History tab components to show/hide content.
 *
 * @example
 * function DetailsTab() {
 *   const { isActive } = useTaskPanelTab('details');
 *   if (!isActive) return null;
 *   return <div>Details content</div>;
 * }
 */
export function useTaskPanelTab(tab: TaskPanelTab) {
  const [isActive, setIsActive] = useState(tab === 'details'); // Details is default

  // Listen for tab change events
  useState(() => {
    const handleTabChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ tab: TaskPanelTab }>;
      setIsActive(customEvent.detail.tab === tab);
    };

    document.addEventListener('taskpanel:tabchange', handleTabChange);
    return () => document.removeEventListener('taskpanel:tabchange', handleTabChange);
  });

  return { isActive };
}
