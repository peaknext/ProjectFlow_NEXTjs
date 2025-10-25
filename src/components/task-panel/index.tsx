'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useUIStore } from '@/stores/use-ui-store';
import { useTask } from '@/hooks/use-tasks';
import { useProject } from '@/hooks/use-projects';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { TaskPanelHeader } from './task-panel-header';
import { TaskPanelFooter } from './task-panel-footer';
import { TaskPanelTabs } from './task-panel-tabs';
import { DetailsTab } from './details-tab';
import { HistoryTab } from './history-tab';

/**
 * TaskPanel Component
 *
 * Main task detail panel with slide-in/out animation.
 * Features:
 * - Skeleton shows immediately when opening (before slide animation)
 * - Panel slides in from right with overlay fade in (300ms)
 * - Panel slides out to right with overlay fade out (300ms)
 * - Smooth animation with proper timing
 * - Backdrop blur + semi-transparent
 * - Overlay click to close
 * - Escape key to close
 * - Tab navigation (Details/History)
 * - Permission-based field disabling
 *
 * State managed via Zustand (useUIStore):
 * - taskPanel.isOpen
 * - taskPanel.taskId
 *
 * @example
 * // Open panel
 * const openTaskPanel = useUIStore((state) => state.openTaskPanel);
 * openTaskPanel(taskId);
 *
 * // Component auto-renders when isOpen is true
 * <TaskPanel />
 */
export function TaskPanel() {
  // Use proper Zustand selectors
  const taskPanel = useUIStore((state) => state.modals.taskPanel);
  const closeTaskPanel = useUIStore((state) => state.closeTaskPanel);
  const { isOpen, taskId } = taskPanel;

  // Local state for animation control
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  // Ref for scrollable content container
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Handle open/close animations
  useEffect(() => {
    if (isOpen) {
      // Opening: render immediately, then trigger animation
      setShouldRender(true);
      // Small delay to ensure DOM is ready before animation starts
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
    } else {
      // Closing: trigger animation, then unmount after animation completes
      setIsVisible(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300); // Match animation duration
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Fetch task data
  const { data: taskResponse, isLoading: isLoadingTask } = useTask(taskId || null);
  const task = taskResponse?.task;

  // Fetch project data (for users and statuses)
  const { data: projectResponse, isLoading: isLoadingProject } = useProject(
    task?.projectId || null
  );
  const project = projectResponse?.project;
  const statuses = projectResponse?.statuses || [];

  // Fetch department users (users who can be assigned tasks in this project)
  const { data: usersResponse, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users', 'department', project?.department?.id],
    queryFn: async () => {
      if (!project?.department?.id) return null;
      return api.get<{ users: any[] }>(`/api/users?departmentId=${project.department.id}&limit=100`);
    },
    enabled: !!project?.department?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  const users = usersResponse?.users || [];

  const isLoading = isLoadingTask || isLoadingProject || isLoadingUsers;

  // Form state management (lifted from DetailsTab for Footer access)
  const [formState, setFormState] = useState({
    isDirty: false,
    isSubmitting: false,
    currentStatusId: task?.statusId || '',
  });

  // Reset form state when taskId changes
  useEffect(() => {
    setFormState({
      isDirty: false,
      isSubmitting: false,
      currentStatusId: task?.statusId || '',
    });
    setHandleSave(null);
  }, [taskId, task?.statusId]);

  // Callback for DetailsTab to update form state
  const updateFormState = useCallback((updates: Partial<typeof formState>) => {
    setFormState(prev => ({ ...prev, ...updates }));
  }, []);

  // Callback for Footer to trigger save
  const [handleSave, setHandleSave] = useState<(() => Promise<void>) | null>(null);

  // Callback for DetailsTab to register submit handler
  const registerSubmitHandler = useCallback((handler: () => Promise<void>) => {
    setHandleSave(() => handler);
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        // Only close if Escape is not handled by a child element
        // (child elements should call e.stopPropagation() to prevent this)
        closeTaskPanel();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeTaskPanel]);

  // Prevent body scroll when panel is open
  useEffect(() => {
    if (shouldRender) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [shouldRender]);

  // Scroll to top when task changes
  useEffect(() => {
    if (scrollContainerRef.current && taskId) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [taskId]);

  if (!shouldRender) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          'fixed inset-0 bg-black/30 z-[100]',
          'transition-opacity duration-300 ease-in-out',
          isVisible ? 'opacity-100' : 'opacity-0'
        )}
        onClick={closeTaskPanel}
      />

      {/* Panel */}
      <div
        className={cn(
          'fixed top-0 right-0 h-full w-full max-w-3xl',
          'bg-background/90 backdrop-blur-sm',
          'rounded-l-xl shadow-2xl z-[101]',
          'flex flex-col',
          'transform transition-transform duration-300 ease-in-out',
          isVisible ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <TaskPanelHeader task={task} isLoading={isLoading} />

        {/* Tabs Navigation */}
        <TaskPanelTabs />

        {/* Body (Scrollable) */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto" key={taskId}>
          <DetailsTab
            key={`details-${taskId}`}
            task={task}
            isLoading={isLoading}
            users={users}
            statuses={statuses}
            updateFormState={updateFormState}
            registerSubmitHandler={registerSubmitHandler}
          />
          <HistoryTab key={`history-${taskId}`} task={task} />
        </div>

        {/* Footer */}
        <TaskPanelFooter
          task={task}
          isLoading={isLoading}
          isDirty={formState.isDirty}
          isSubmitting={formState.isSubmitting}
          onSave={handleSave}
          statuses={statuses}
          currentStatusId={formState.currentStatusId}
        />
      </div>
    </>
  );
}
