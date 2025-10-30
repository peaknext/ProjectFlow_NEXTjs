/**
 * BoardView - Kanban Board View
 * แสดงงานในรูปแบบบอร์ด พร้อม drag-and-drop
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { StatusColumn } from "./status-column";
import { useProject } from "@/hooks/use-projects";
import { useUpdateTask } from "@/hooks/use-tasks";
import { useUIStore } from "@/stores/use-ui-store";
import { usePersistedFilters } from "@/hooks/use-persisted-filters";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TaskFilterBar } from "@/components/views/common/task-filter-bar";
import {
  filterTasks,
  getUniqueAssignees,
} from "@/components/views/common/filter-tasks";
import type { Task } from "@/hooks/use-tasks";

interface BoardViewProps {
  projectId: string;
}

export function BoardView({ projectId }: BoardViewProps) {
  const { data, isLoading, error } = useProject(projectId);
  const updateTaskMutation = useUpdateTask();
  const openTaskPanel = useUIStore((state) => state.openTaskPanel);
  const openCreateTaskModal = useUIStore((state) => state.openCreateTaskModal);

  // Local state for optimistic updates
  const [localTasks, setLocalTasks] = useState<Task[]>([]);

  // Filter state with localStorage persistence
  const [filters, setFilters] = usePersistedFilters();

  // Sync local tasks with server data
  useEffect(() => {
    if (data?.tasks) {
      setLocalTasks(data.tasks);
    }
  }, [data?.tasks]);

  // Get unique statuses and assignees for filters
  const uniqueStatuses = useMemo(() => data?.statuses || [], [data?.statuses]);
  const uniqueAssignees = useMemo(
    () => getUniqueAssignees(data?.tasks || []),
    [data?.tasks]
  );

  // Apply filters to tasks
  const filteredTasks = useMemo(
    () => filterTasks(localTasks, filters),
    [localTasks, filters]
  );

  // Handle drag end
  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // Dropped outside the list
    if (!destination) {
      return;
    }

    // Dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Optimistic update - update local state immediately
    const taskId = draggableId;
    const newStatusId = destination.droppableId;

    setLocalTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, statusId: newStatusId } : task
      )
    );

    // Then update server
    updateTaskMutation.mutate(
      {
        taskId,
        data: { statusId: newStatusId },
      },
      {
        onError: () => {
          // Rollback on error
          if (data?.tasks) {
            setLocalTasks(data.tasks);
          }
        },
      }
    );
  };

  // Handle task click - open task panel
  const handleTaskClick = (taskId: string) => {
    openTaskPanel(taskId);
  };

  // Handle add task - open create task modal
  const handleAddTask = (statusId: string) => {
    openCreateTaskModal({ projectId, defaultStatusId: statusId });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
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
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
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
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <p className="text-sm text-muted-foreground">ไม่พบข้อมูลโปรเจกต์</p>
      </div>
    );
  }

  const { statuses } = data;

  // Sort statuses by order
  const sortedStatuses = [...statuses].sort((a, b) => a.order - a.order);

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

      {/* Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto px-6 pb-6 flex-1">
          {sortedStatuses.map((status) => {
            // Filter tasks for this status using filtered tasks
            const statusTasks = filteredTasks.filter(
              (task) => task.statusId === status.id
            );

            return (
              <StatusColumn
                key={status.id}
                status={status}
                tasks={statusTasks as any}
                onTaskClick={handleTaskClick}
                onAddTask={handleAddTask}
              />
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}
