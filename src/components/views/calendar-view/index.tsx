/**
 * CalendarView - FullCalendar view for tasks
 * Shows tasks by due date with drag-and-drop support
 */

"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type {
  EventClickArg,
  EventMountArg,
  EventDropArg,
  EventResizeDoneArg,
} from "@fullcalendar/core";
import { useTheme } from "next-themes";
import { useQueryClient } from "@tanstack/react-query";
import { useProject, projectKeys } from "@/hooks/use-projects";
import { useUpdateTask } from "@/hooks/use-tasks";
import { useUIStore } from "@/stores/use-ui-store";
import { usePersistedFilters } from "@/hooks/use-persisted-filters";
import { getCalendarColor, getCalendarTextColor } from "@/lib/calendar-colors";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TaskFilterBar } from "@/components/views/common/task-filter-bar";
import {
  filterTasks,
  getUniqueAssignees,
} from "@/components/views/common/filter-tasks";
import type { Task } from "@/hooks/use-tasks";

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

  const isDarkMode = theme === "dark";

  // Filter state with localStorage persistence
  const [filters, setFilters] = usePersistedFilters();

  // Get unique statuses and assignees for filters
  const uniqueStatuses = useMemo(() => data?.statuses || [], [data?.statuses]);
  const uniqueAssignees = useMemo(
    () => getUniqueAssignees(data?.tasks || []),
    [data?.tasks]
  );

  // Use server data directly (no local state to avoid race conditions)
  const tasks = data?.tasks || [];

  // Debug: Log when tasks change
  useEffect(() => {
    if (tasks.length > 0) {
    }
  }, [tasks]);

  // Apply filters to tasks
  const filteredTasks = useMemo(
    () => filterTasks(tasks, filters),
    [tasks, filters]
  );

  // Transform tasks to calendar events
  const events = filteredTasks
    .filter((task) => {
      // Only show tasks with due date (unless creating/closing)
      if (!task.isCreating && !task.isClosing && !task.dueDate) {
        return false;
      }

      return true;
    })
    .map((task) => {
      // Calculate start and end dates
      // FullCalendar uses exclusive end dates for all-day events, so we need to add 1 day
      const startDate = task.startDate
        ? new Date(task.startDate)
        : task.dueDate
          ? new Date(task.dueDate)
          : new Date();

      // For end date: add 1 day to make it exclusive (FullCalendar convention)
      const endDate = new Date(task.dueDate || startDate);
      endDate.setDate(endDate.getDate() + 1); // Make exclusive

      // Skeleton state for creating/closing tasks
      if (task.isCreating || task.isClosing) {
        const title = task.isClosing
          ? task.closeType === "COMPLETED"
            ? "กำลังปิดงาน..."
            : "กำลังยกเลิกงาน..."
          : task.name;

        return {
          id: task.id,
          title,
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          backgroundColor: "#e5e7eb",
          borderColor: "#e5e7eb",
          textColor: "#6b7280",
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
      const textColor = isDarkMode
        ? getCalendarTextColor(task.priority)
        : "#424242";

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

    // Find task
    const task = tasks.find((t) => t.id === taskId);
    if (!task) {
      info.revert();
      console.error("Task not found:", taskId);
      return;
    }

    // Check if closed
    if (task.isClosed) {
      info.revert();
      console.warn("Cannot edit closed task:", taskId);
      return;
    }

    // Calculate new dates from event (FullCalendar uses exclusive end dates for day-based events)
    // For all-day events: end date is exclusive (next day), so we need to subtract 1 day
    const newStartDate = info.event.start
      ? info.event.start.toISOString()
      : task.startDate;

    // FullCalendar end date is exclusive, so subtract 1 day to get the actual end date
    let newDueDate: string | null = null;
    if (info.event.end) {
      const endDate = new Date(info.event.end);
      endDate.setDate(endDate.getDate() - 1); // Convert exclusive to inclusive
      newDueDate = endDate.toISOString();
    } else {
      // If no end date, use start date as due date
      newDueDate = newStartDate || task.dueDate;
    }

    // If dates haven't changed, do nothing
    if (newStartDate === task.startDate && newDueDate === task.dueDate) {
      return;
    }

    // Prepare update data
    const updateData: { startDate?: string | null; dueDate?: string | null } =
      {};
    if (newStartDate !== task.startDate) {
      updateData.startDate = newStartDate;
    }
    if (newDueDate !== task.dueDate) {
      updateData.dueDate = newDueDate;
    }

    // IMPORTANT: We do immediate cache update here for instant calendar feedback
    // Then mutation will also do optimistic update (redundant but safe)
    // This prevents flicker because React Query rerender happens synchronously
    const queryKey = projectKeys.board(projectId);

    // Save previous data for potential rollback
    const previousData = queryClient.getQueryData(queryKey);

    // Immediate synchronous cache update (prevents flicker)
    queryClient.setQueryData(queryKey, (old: any) => {
      if (!old?.tasks) return old;
      return {
        ...old,
        tasks: old.tasks.map((t: Task) =>
          t.id === taskId ? { ...t, ...updateData } : t
        ),
      };
    });

    // Call mutation - it will also do optimistic update (redundant but ensures consistency)
    // The mutation's optimistic update won't cause issues because it updates to the same values
    updateTaskMutation.mutate(
      {
        taskId,
        data: updateData,
      },
      {
        onError: (error) => {
          // Rollback our immediate cache update
          queryClient.setQueryData(queryKey, previousData);
          // Revert calendar UI
          info.revert();
          console.error("Failed to update task dates:", error);
        },
      }
    );
  };

  // Handle event resize (wrapper for handleEventDrop)
  const handleEventResize = (info: EventResizeDoneArg) => {
    // EventResizeDoneArg has the same structure as EventDropArg
    handleEventDrop(info as EventDropArg);
  };

  // Handle event click
  const handleEventClick = (info: EventClickArg) => {
    const taskId = info.event.id;
    const projectId = info.event.extendedProps.projectId;

    if (taskId && projectId) {
      openTaskPanel(taskId);
    } else {
      console.warn("[Calendar] Missing taskId or projectId:", {
        taskId,
        projectId,
      });
    }
  };

  // Handle event mount (add pin indicator)
  const handleEventDidMount = (info: EventMountArg) => {
    const isPinned = info.event.extendedProps.isPinned;
    const isSkeleton = info.event.extendedProps.isSkeleton;

    // Add pin indicator to pinned tasks
    if (isPinned && !isSkeleton) {
      const pinIcon = document.createElement("span");
      pinIcon.className = "material-symbols-outlined";
      pinIcon.style.fontSize = "12px";
      pinIcon.style.marginRight = "2px";
      pinIcon.textContent = "keep";
      pinIcon.title = "ปักหมุดแล้ว";

      const titleEl = info.el.querySelector(".fc-event-title");
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
        <p className="text-sm text-muted-foreground">ไม่พบข้อมูลโปรเจกต์</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Filter Bar */}
      <div className="px-6 pt-4 pb-3">
        <TaskFilterBar
          filters={filters}
          onFiltersChange={setFilters}
          statuses={uniqueStatuses}
          assignees={uniqueAssignees}
        />
      </div>

      {/* Calendar */}
      <div className="flex-1 px-6 pb-6">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale="th"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          events={events}
          editable={true}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          eventClick={handleEventClick}
          eventDidMount={handleEventDidMount}
          dayCellContent={(arg) => {
            // Remove " วัน" suffix from Thai locale
            return arg.dayNumberText.replace(" วัน", "");
          }}
          height="100%"
          eventTimeFormat={{
            hour: "2-digit",
            minute: "2-digit",
            meridiem: false,
          }}
        />
      </div>
    </div>
  );
}
