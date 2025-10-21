/**
 * StatusColumn - คอลัมน์สำหรับแสดงงานในแต่ละสถานะ
 * รองรับ drag-and-drop
 */

'use client';

import { Droppable, Draggable } from '@hello-pangea/dnd';
import { cn } from '@/lib/utils';
import { TaskCard, TaskCardPlaceholder } from './task-card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import type { Task } from '@/hooks/use-tasks';

interface Status {
  id: string;
  name: string;
  color: string;
  order: number;
  type: string;
}

interface StatusColumnProps {
  status: Status;
  tasks: Task[];
  onTaskClick: (taskId: string) => void;
  onAddTask: (statusId: string) => void;
}

export function StatusColumn({
  status,
  tasks,
  onTaskClick,
  onAddTask,
}: StatusColumnProps) {
  // กรองเฉพาะงานที่ยังไม่ถูกปิด (หรือแสดงทั้งหมดตาม filter)
  const activeTasks = tasks.filter((task) => !task.isClosed);
  const taskCount = activeTasks.length;

  // Convert hex to rgba with opacity (like GAS version)
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const columnBgColor = hexToRgba(status.color, 0.08);
  const cardAreaBgColor = hexToRgba(status.color, 0.12);

  return (
    <div
      className="flex flex-col w-80 flex-shrink-0 rounded-lg border"
      style={{
        borderColor: status.color,
        backgroundColor: columnBgColor
      }}
    >
      {/* Column Header */}
      <div className="p-4 border-b bg-card rounded-t-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {/* Status color indicator */}
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: status.color }}
            />
            {/* Status name */}
            <h3 className="font-semibold text-sm">{status.name}</h3>
            {/* Task count */}
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {taskCount}
            </span>
          </div>

          {/* Add task button */}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => onAddTask(status.id)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Droppable Area */}
      <Droppable droppableId={status.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              'flex-1 p-3 space-y-2.5 overflow-y-auto min-h-[200px] max-h-[calc(100vh-300px)] rounded-b-lg',
              snapshot.isDraggingOver && 'ring-2 ring-primary ring-inset'
            )}
            style={{
              backgroundColor: snapshot.isDraggingOver
                ? hexToRgba(status.color, 0.2)
                : cardAreaBgColor
            }}
          >
            {/* Tasks */}
            {activeTasks.length === 0 ? (
              <TaskCardPlaceholder />
            ) : (
              activeTasks.map((task, index) => (
                <Draggable
                  key={task.id}
                  draggableId={task.id}
                  index={index}
                  isDragDisabled={task.isClosed}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                    >
                      <TaskCard
                        task={task}
                        isDragging={snapshot.isDragging}
                        onClick={() => onTaskClick(task.id)}
                      />
                    </div>
                  )}
                </Draggable>
              ))
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
