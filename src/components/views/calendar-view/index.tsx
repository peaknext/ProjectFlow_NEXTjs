/**
 * CalendarView - FullCalendar view for tasks
 * Shows tasks by due date with drag-and-drop support
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, { EventDropArg } from '@fullcalendar/interaction';
import { EventClickArg, EventMountArg } from '@fullcalendar/core';
import { useTheme } from 'next-themes';
import { useQueryClient } from '@tanstack/react-query';
import { useProject } from '@/hooks/use-projects';
import { useUpdateTask } from '@/hooks/use-tasks';
import { useUIStore } from '@/stores/use-ui-store';
import { getCalendarColor, getCalendarTextColor } from '@/lib/calendar-colors';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Task } from '@/hooks/use-tasks';
import { projectKeys } from '@/hooks/use-projects';

interface CalendarViewProps {
  projectId: string;
}

export function CalendarView({ projectId }: CalendarViewProps) {
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const { data, isLoading, error, refetch } = useProject(projectId);
  const updateTaskMutation = useUpdateTask();
  const openTaskPanel = useUIStore((state) => state.openTaskPanel);
  const calendarRef = useRef<FullCalendar>(null);

  const isDarkMode = theme === 'dark';

  // Use server data directly (no local state to avoid race conditions)
  const tasks = data?.tasks || [];

  // Transform tasks to calendar events
  const events = tasks
    .filter((task) => {
      // Filter out closed tasks
      if (task.isClosed) return false;

      // Only show tasks with due date (unless creating/closing)
      if (!task.isCreating && !task.isClosing && !task.dueDate) {
        return false;
      }

      return true;
    })
    .map((task) => {
      const startDate = task.startDate ? new Date(task.startDate) : task.dueDate ? new Date(task.dueDate) : new Date();
      const endDate = task.dueDate ? new Date(task.dueDate) : new Date();

      // Skeleton state for creating/closing tasks
      if (task.isCreating || task.isClosing) {
        const title = task.isClosing
          ? task.closeType === 'COMPLETED'
            ? 'กำลังปิดงาน...'
            : 'กำลังยกเลิกงาน...'
          : task.name;

        return {
          id: task.id,
          title,
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          backgroundColor: '#e5e7eb',
          borderColor: '#e5e7eb',
          textColor: '#6b7280',
          editable: false,
          extendedProps: {
            projectId: task.projectId,
            isPinned: task.isPinned || false,
            isSkeleton: true,
          },
        };
      }

      // Normal event with priority colors
      const eventColor = getCalendarColor(task.priority, isDarkMode);
      const textColor = isDarkMode ? getCalendarTextColor(task.priority) : '#424242';

      return {
        id: task.id,
        title: task.name,
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        backgroundColor: eventColor,
        borderColor: eventColor,
        textColor,
        extendedProps: {
          projectId: task.projectId,
          isPinned: task.isPinned || false,
          isSkeleton: false,
        },
      };
    });

  // Handle event drop (drag and drop)
  const handleEventDrop = (info: EventDropArg) => {
    const taskId = info.event.id;
    const newDueDate = info.event.end
      ? info.event.end.toISOString()
      : info.event.start.toISOString();

    // Find task
    const task = tasks.find((t) => t.id === taskId);
    if (!task) {
      info.revert();
      console.error('Task not found:', taskId);
      return;
    }

    // Check if closed
    if (task.isClosed) {
      info.revert();
      console.warn('Cannot edit closed task:', taskId);
      return;
    }

    const originalDueDate = task.dueDate;

    // If date hasn't changed, do nothing
    if (newDueDate === originalDueDate) {
      return;
    }

    // Optimistic update: Update cache immediately before server call
    const queryKey = projectKeys.board(projectId);
    const previousData = queryClient.getQueryData(queryKey);

    // Update cache optimistically
    queryClient.setQueryData(queryKey, (old: any) => {
      if (!old) return old;

      return {
        ...old,
        tasks: old.tasks.map((t: Task) =>
          t.id === taskId
            ? { ...t, dueDate: newDueDate }
            : t
        ),
      };
    });

    // Update server in background (sync animation handled by useSyncMutation)
    updateTaskMutation.mutate(
      {
        taskId,
        data: { dueDate: newDueDate },
      },
      {
        onError: (error) => {
          // Rollback to previous data on error
          queryClient.setQueryData(queryKey, previousData);
          info.revert();
          console.error('Failed to update task due date:', error);
        },
        onSettled: () => {
          // Refetch to ensure sync with server
          queryClient.invalidateQueries({ queryKey });
        },
      }
    );
  };

  // Handle event click
  const handleEventClick = (info: EventClickArg) => {
    const taskId = info.event.id;
    const projectId = info.event.extendedProps.projectId;

    if (taskId && projectId) {
      openTaskPanel(taskId);
    }
  };

  // Handle event mount (add pin indicator)
  const handleEventDidMount = (info: EventMountArg) => {
    const isPinned = info.event.extendedProps.isPinned;
    const isSkeleton = info.event.extendedProps.isSkeleton;

    // Add pin indicator to pinned tasks
    if (isPinned && !isSkeleton) {
      const pinIcon = document.createElement('span');
      pinIcon.className = 'material-symbols-outlined';
      pinIcon.style.fontSize = '12px';
      pinIcon.style.marginRight = '2px';
      pinIcon.textContent = 'keep';
      pinIcon.title = 'ปักหมุดแล้ว';

      const titleEl = info.el.querySelector('.fc-event-title');
      if (titleEl) {
        titleEl.insertBefore(pinIcon, titleEl.firstChild);
      }
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            เกิดข้อผิดพลาดในการโหลดข้อมูล กรุณาลองใหม่อีกครั้ง
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // No data
  if (!data) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-muted-foreground">ไม่พบข้อมูลโปรเจค</p>
      </div>
    );
  }

  // Empty state
  if (events.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center py-16 px-4 bg-card rounded-lg">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-xl font-semibold">ไม่พบงาน</h3>
          <p className="text-muted-foreground mt-2">ไม่มีงานที่มีวันครบกำหนด</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full p-6">
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        locale="th"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        }}
        events={events}
        editable={true}
        eventDrop={handleEventDrop}
        eventClick={handleEventClick}
        eventDidMount={handleEventDidMount}
        dayCellContent={(arg) => {
          // Remove " วัน" suffix from Thai locale
          return arg.dayNumberText.replace(' วัน', '');
        }}
        height="100%"
        eventTimeFormat={{
          hour: '2-digit',
          minute: '2-digit',
          meridiem: false,
        }}
      />
    </div>
  );
}
