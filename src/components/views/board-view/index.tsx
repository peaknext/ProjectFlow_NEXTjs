/**
 * BoardView - Kanban Board View
 * แสดงงานในรูปแบบบอร์ด พร้อม drag-and-drop
 */

'use client';

import { useState, useEffect } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { StatusColumn } from './status-column';
import { useProject } from '@/hooks/use-projects';
import { useUpdateTask } from '@/hooks/use-tasks';
import { useUIStore } from '@/stores/use-ui-store';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Task } from '@/hooks/use-tasks';

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

  // Sync local tasks with server data
  useEffect(() => {
    if (data?.tasks) {
      setLocalTasks(data.tasks);
    }
  }, [data?.tasks]);

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
    openCreateTaskModal(projectId, statusId);
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
        <p className="text-sm text-muted-foreground">ไม่พบข้อมูลโปรเจค</p>
      </div>
    );
  }

  const { statuses } = data;

  // Sort statuses by order
  const sortedStatuses = [...statuses].sort((a, b) => a.order - a.order);

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto p-6 h-full">
        {sortedStatuses.map((status) => {
          // Filter tasks for this status using local state
          const statusTasks = localTasks.filter(
            (task) => task.statusId === status.id
          );

          return (
            <StatusColumn
              key={status.id}
              status={status}
              tasks={statusTasks}
              onTaskClick={handleTaskClick}
              onAddTask={handleAddTask}
            />
          );
        })}
      </div>
    </DragDropContext>
  );
}
