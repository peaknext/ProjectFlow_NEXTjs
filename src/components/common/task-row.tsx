/**
 * TaskRow Component - Reusable task table row
 * Based on List View pattern with inline editing
 */

'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useUpdateTask, useDeleteTask, useCloseTask, useTogglePinTask, type Task } from '@/hooks/use-tasks';
import { useUIStore } from '@/stores/use-ui-store';
import { useSession } from '@/hooks/use-session';
import { canEditTask } from '@/hooks/use-task-permissions';
import { projectKeys } from '@/hooks/use-projects';
import type { TaskWithProject } from '@/types/prisma-extended';
import { TableCell, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PriorityBadge } from '@/components/common/priority-badge';
import { AssigneePopover } from '@/components/ui/assignee-popover';
import { DateInput } from '@/components/ui/date-picker-popover';
import {
  MoreHorizontal,
  Edit2,
  CheckCircle2,
  XCircle,
  Trash2,
  Pin,
  PinOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Status {
  id: string;
  name: string;
  color: string;
  type: 'NOT_STARTED' | 'IN_PROGRESS' | 'DONE';
}

interface User {
  id: string;
  fullName: string;
  email: string;
  profileImageUrl?: string | null;
}

interface TaskRowProps {
  task: Task;
  statuses: Status[];
  users: User[];
  isSelected: boolean;
  onToggleSelect: (taskId: string) => void;
  showProjectColumn?: boolean; // Optional: show project name column
  // Optional: custom mutation functions for department view
  customMutations?: {
    updateTask?: any;
    closeTask?: any;
    togglePinTask?: any;
    deleteTask?: any;
  };
}

export function TaskRow({
  task,
  statuses,
  users,
  isSelected,
  onToggleSelect,
  showProjectColumn = false,
  customMutations,
}: TaskRowProps) {
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  // Use custom mutations if provided, otherwise use default project mutations
  const defaultUpdateTask = useUpdateTask();
  const defaultDeleteTask = useDeleteTask();
  const defaultCloseTask = useCloseTask();
  const defaultTogglePinTask = useTogglePinTask();

  const updateTaskMutation = customMutations?.updateTask || defaultUpdateTask;
  const deleteTaskMutation = customMutations?.deleteTask || defaultDeleteTask;
  const closeTaskMutation = customMutations?.closeTask || defaultCloseTask;
  const togglePinMutation = customMutations?.togglePinTask || defaultTogglePinTask;

  const openTaskPanel = useUIStore((state) => state.openTaskPanel);

  // Helper function to check if user can edit this task
  const canUserEditTask = () => {
    return canEditTask(task, session?.userId, session?.user?.role);
  };

  const [editingName, setEditingName] = useState(false);
  const [editingTaskName, setEditingTaskName] = useState(task.name);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [closeType, setCloseType] = useState<'COMPLETED' | 'ABORTED'>('COMPLETED');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Quick update handlers - mutations handle optimistic updates automatically
  const handleQuickUpdate = (data: Partial<Task>) => {
    updateTaskMutation.mutate({
      taskId: task.id,
      data,
    });
  };

  const handleQuickStatusChange = (statusId: string) => {
    const status = statuses.find((s) => s.id === statusId);
    handleQuickUpdate({ statusId, status });
  };

  const handleQuickPriorityChange = (priority: number) => {
    handleQuickUpdate({ priority });
  };

  const handleQuickDueDateChange = (dueDate: string | null) => {
    handleQuickUpdate({ dueDate });
  };

  const handleQuickAssigneeChange = (assigneeUserIds: string[]) => {
    // ✅ BUG FIX: Only send assigneeUserIds to API
    // API will handle updating assignees relation table
    // Don't send full user objects - they'll be fetched on next render
    handleQuickUpdate({
      assigneeUserIds,
    });
  };

  // Task name editing
  const startEditingTaskName = () => {
    setEditingName(true);
    setEditingTaskName(task.name);
  };

  const cancelEditingTaskName = () => {
    setEditingName(false);
    setEditingTaskName(task.name);
  };

  const saveTaskName = () => {
    const newName = editingTaskName.trim();
    if (!newName) {
      cancelEditingTaskName();
      return;
    }

    if (newName !== task.name) {
      handleQuickUpdate({ name: newName });
    }

    setEditingName(false);
  };

  // Toggle pin with optimistic update
  const handleTogglePin = () => {
    const boardKey = projectKeys.board(task.projectId);

    queryClient.setQueryData(boardKey, (old: any) => {
      if (!old?.tasks) return old;
      return {
        ...old,
        tasks: old.tasks.map((t: Task) =>
          t.id === task.id ? { ...t, isPinned: !task.isPinned } : t
        ),
      };
    });

    togglePinMutation.mutate({
      taskId: task.id,
      isPinned: task.isPinned || false,
    });
  };

  // Close task dialog
  const handleOpenCloseDialog = () => {
    if (!statuses || statuses.length === 0) {
      setCloseType('ABORTED');
      setCloseDialogOpen(true);
      return;
    }
    const currentStatus = statuses.find((s) => s.id === task.statusId);
    setCloseType(currentStatus?.type === 'DONE' ? 'COMPLETED' : 'ABORTED');
    setCloseDialogOpen(true);
  };

  const handleCloseTask = () => {
    closeTaskMutation.mutate(
      { taskId: task.id, closeType },
      {
        onSuccess: () => {
          setCloseDialogOpen(false);
        },
      }
    );
  };

  // Delete task
  const handleDeleteTask = () => {
    deleteTaskMutation.mutate(task.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
      },
    });
  };

  // Get close button properties
  const getCloseButtonProps = () => {
    if (!statuses || statuses.length === 0) {
      return { label: 'ปิดงาน', isDone: false, icon: XCircle };
    }
    const currentStatus = statuses.find((s) => s.id === task.statusId);
    if (currentStatus?.type === 'DONE') {
      return { label: 'แล้วเสร็จ', isDone: true, icon: CheckCircle2 };
    }
    return { label: 'ยกเลิกงาน', isDone: false, icon: XCircle };
  };

  const closeProps = getCloseButtonProps();
  const CloseIcon = closeProps.icon;

  return (
    <>
      <TableRow
        className={cn(
          'cursor-pointer transition-colors bg-card hover:bg-accent/30',
          task.isClosed && 'opacity-60',
          isSelected && 'bg-primary/10 hover:bg-primary/15'
        )}
        onClick={(e) => {
          if (
            (e.target as HTMLElement).closest('button') ||
            (e.target as HTMLElement).closest('[role="checkbox"]')
          ) {
            return;
          }
          openTaskPanel(task.id);
        }}
      >
        {/* Checkbox */}
        <TableCell onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleSelect(task.id)}
          />
        </TableCell>

        {/* Pin Icon */}
        <TableCell onClick={(e) => e.stopPropagation()}>
          <button
            onClick={handleTogglePin}
            disabled={task.isClosed}
            className={cn(
              'transition-transform',
              !task.isClosed && 'hover:scale-110'
            )}
            title={
              task.isClosed
                ? 'ไม่สามารถปักหมุดงานที่ปิดแล้ว'
                : task.isPinned
                ? 'ยกเลิกปักหมุด'
                : 'ปักหมุด'
            }
          >
            <Pin
              className={cn(
                'h-4 w-4 transition-colors',
                task.isPinned
                  ? 'text-amber-500 fill-amber-500'
                  : 'text-gray-300 dark:text-gray-600',
                task.isClosed && 'opacity-30 cursor-not-allowed'
              )}
            />
          </button>
        </TableCell>

        {/* Project Column (optional) */}
        {showProjectColumn && (
          <TableCell className="text-sm text-muted-foreground">
            {(task as unknown as TaskWithProject).project?.name || '-'}
          </TableCell>
        )}

        {/* Task Name - Inline Editor */}
        <TableCell
          className="font-medium text-sm"
          onClick={(e) => {
            e.stopPropagation();
            if (!editingName && canUserEditTask()) {
              startEditingTaskName();
            }
          }}
        >
          {editingName ? (
            <Input
              value={editingTaskName}
              onChange={(e) => setEditingTaskName(e.target.value)}
              onBlur={saveTaskName}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  saveTaskName();
                } else if (e.key === 'Escape') {
                  cancelEditingTaskName();
                }
              }}
              autoFocus
              className="h-8 text-sm"
            />
          ) : (
            <div
              className={cn(
                'rounded px-2 py-1 -mx-2 -my-1 transition-colors',
                canUserEditTask() && 'cursor-text hover:bg-accent/50'
              )}
            >
              <div className={cn(task.isClosed && 'line-through')}>
                {task.name}
              </div>
            </div>
          )}
        </TableCell>

        {/* Priority - Inline Editor */}
        <TableCell onClick={(e) => e.stopPropagation()}>
          <Select
            value={task.priority.toString()}
            onValueChange={(value) => handleQuickPriorityChange(parseInt(value))}
            disabled={!canUserEditTask()}
          >
            <SelectTrigger className="h-8 w-full text-xs">
              <SelectValue>
                <PriorityBadge priority={task.priority} size="sm" showIcon={false} />
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">
                <PriorityBadge priority={1} size="sm" />
              </SelectItem>
              <SelectItem value="2">
                <PriorityBadge priority={2} size="sm" />
              </SelectItem>
              <SelectItem value="3">
                <PriorityBadge priority={3} size="sm" />
              </SelectItem>
              <SelectItem value="4">
                <PriorityBadge priority={4} size="sm" />
              </SelectItem>
            </SelectContent>
          </Select>
        </TableCell>

        {/* Status */}
        <TableCell onClick={(e) => e.stopPropagation()}>
          <Select
            value={task.statusId}
            onValueChange={handleQuickStatusChange}
            disabled={!canUserEditTask() || !statuses || statuses.length === 0}
          >
            <SelectTrigger className="h-8 w-full">
              <SelectValue>
                <Badge
                  style={{
                    backgroundColor: task.status?.color + '20',
                    borderColor: task.status?.color,
                    color: task.status?.color,
                  }}
                  variant="outline"
                  className="font-normal"
                >
                  {task.status?.name || '-'}
                </Badge>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {statuses && statuses.length > 0 ? (
                statuses.map((status) => (
                  <SelectItem key={status.id} value={status.id}>
                    <Badge
                      style={{
                        backgroundColor: status.color + '20',
                        borderColor: status.color,
                        color: status.color,
                      }}
                      variant="outline"
                    >
                      {status.name}
                    </Badge>
                  </SelectItem>
                ))
              ) : (
                <div className="p-2 text-sm text-muted-foreground">ไม่มีสถานะ</div>
              )}
            </SelectContent>
          </Select>
        </TableCell>

        {/* Assignee - Multi-select popover */}
        <TableCell onClick={(e) => e.stopPropagation()}>
          <AssigneePopover
            users={users}
            selectedUserIds={task.assigneeUserIds || []}
            onSave={(newIds) => handleQuickAssigneeChange(newIds)}
            disabled={!canUserEditTask()}
            maxVisible={3}
          />
        </TableCell>

        {/* Due Date - Editable */}
        <TableCell onClick={(e) => e.stopPropagation()}>
          <DateInput
            value={task.dueDate}
            onChange={handleQuickDueDateChange}
            placeholder="เลือกวันที่"
            className="text-xs h-8 w-full"
            disabled={!canUserEditTask()}
          />
        </TableCell>

        {/* Actions */}
        <TableCell onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openTaskPanel(task.id)}>
                <Edit2 className="mr-2 h-4 w-4" />
                แก้ไข
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleTogglePin}>
                {task.isPinned ? (
                  <>
                    <PinOff className="mr-2 h-4 w-4" />
                    ยกเลิกปักหมุด
                  </>
                ) : (
                  <>
                    <Pin className="mr-2 h-4 w-4" />
                    ปักหมุด
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {task.isClosed ? (
                <DropdownMenuItem disabled>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {task.closeType === 'COMPLETED' ? 'ปิดแล้ว (สำเร็จ)' : 'ปิดแล้ว (ยกเลิก)'}
                </DropdownMenuItem>
              ) : canUserEditTask() ? (
                <DropdownMenuItem
                  onClick={handleOpenCloseDialog}
                  className={closeProps.isDone ? 'text-green-600' : ''}
                >
                  <CloseIcon className="mr-2 h-4 w-4" />
                  {closeProps.label}
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem disabled>
                  <XCircle className="mr-2 h-4 w-4" />
                  ไม่สามารถปิดงาน
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {canUserEditTask() && (
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  ลบ
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>

      {/* Close Task Dialog */}
      <AlertDialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {closeType === 'COMPLETED' ? 'ปิดงาน' : 'ยกเลิกงาน'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {closeType === 'COMPLETED'
                ? 'ปิดงานและบันทึกว่างานนี้สำเร็จแล้ว และจะไม่สามารถแก้ไขได้อีก'
                : 'ยกเลิกงานนี้ และจะไม่สามารถแก้ไขได้อีก คุณยืนยันหรือไม่?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCloseTask}
              className={closeType === 'COMPLETED' ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              ยืนยัน{closeType === 'COMPLETED' ? 'ปิดงาน' : 'ยกเลิกงาน'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Task Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ลบงาน</AlertDialogTitle>
            <AlertDialogDescription>
              คุณแน่ใจหรือไม่ว่าต้องการลบงาน "{task.name}"
              การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTask}
              className="bg-red-600 hover:bg-red-700"
            >
              ยืนยันลบงาน
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
