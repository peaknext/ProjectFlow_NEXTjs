/**
 * ListView - แสดงงานในรูปแบบตาราง
 * พร้อม sorting, filtering, bulk actions, และ inline editing
 */

'use client';

import { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useProject, projectKeys } from '@/hooks/use-projects';
import { useUpdateTask, useDeleteTask, useCloseTask, useTogglePinTask, type Task } from '@/hooks/use-tasks';
import { useUIStore } from '@/stores/use-ui-store';
import { usePersistedFilters } from '@/hooks/use-persisted-filters';
import { api } from '@/lib/api-client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
import { PriorityBadge, PriorityDot } from '@/components/common/priority-badge';
import { UserAvatar } from '@/components/common/user-avatar';
import { AssigneePopover } from '@/components/ui/assignee-popover';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DateInput } from '@/components/ui/date-picker-popover';
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
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  MoreHorizontal,
  Loader2,
  AlertCircle,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  Calendar,
  User,
  Pin,
  PinOff,
} from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ListViewProps {
  projectId: string;
}

type SortField = 'name' | 'priority' | 'dueDate' | 'assignee' | 'status' | 'createdAt';
type SortOrder = 'asc' | 'desc';

export function ListView({ projectId }: ListViewProps) {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useProject(projectId);
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();
  const closeTaskMutation = useCloseTask();
  const togglePinMutation = useTogglePinTask();
  const openTaskPanel = useUIStore((state) => state.openTaskPanel);

  // State
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('priority');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  // Filter state with localStorage persistence
  const [filters, setFilters] = usePersistedFilters();
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskName, setEditingTaskName] = useState<string>('');
  const [closeDialogTask, setCloseDialogTask] = useState<Task | null>(null);
  const [closeType, setCloseType] = useState<'COMPLETED' | 'ABORTED'>('COMPLETED');
  const [deleteDialogTask, setDeleteDialogTask] = useState<Task | null>(null);

  // Filter and sort tasks
  const filteredAndSortedTasks = useMemo(() => {
    if (!data?.tasks) return [];

    let tasks = [...data.tasks];

    // Apply filters
    if (filters.hideClosed) {
      tasks = tasks.filter((task) => !task.isClosed);
    }

    if (filters.search) {
      const search = filters.search.toLowerCase();
      tasks = tasks.filter(
        (task) =>
          task.name.toLowerCase().includes(search) ||
          task.description?.toLowerCase().includes(search)
      );
    }

    if (filters.statusId) {
      tasks = tasks.filter((task) => task.statusId === filters.statusId);
    }

    if (filters.priorityId) {
      tasks = tasks.filter((task) => task.priority === parseInt(filters.priorityId));
    }

    if (filters.assigneeId) {
      tasks = tasks.filter((task) =>
        task.assigneeUserIds?.includes(filters.assigneeId) ||
        task.assigneeUserId === filters.assigneeId // Fallback for old data
      );
    }

    // Apply sorting
    tasks.sort((a, b) => {
      // Pinned tasks always come first
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      // If both pinned or both unpinned, sort by selected field
      let comparison = 0;

      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name, 'th');
          break;

        case 'priority':
          comparison = a.priority - b.priority;
          break;

        case 'dueDate':
          const dateA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
          const dateB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
          comparison = dateA - dateB;
          break;

        case 'assignee':
          // Sort by first assignee's name
          const nameA = a.assignees?.[0]?.fullName || a.assignee?.fullName || 'zzz';
          const nameB = b.assignees?.[0]?.fullName || b.assignee?.fullName || 'zzz';
          comparison = nameA.localeCompare(nameB, 'th');
          break;

        case 'status':
          const statusA = a.status?.name || '';
          const statusB = b.status?.name || '';
          comparison = statusA.localeCompare(statusB, 'th');
          break;

        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return tasks;
  }, [data?.tasks, filters, sortField, sortOrder]);

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedTasks.size === filteredAndSortedTasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(filteredAndSortedTasks.map((t) => t.id)));
    }
  };

  const toggleSelectTask = (taskId: string) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTasks(newSelected);
  };

  // Sorting handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Bulk actions
  const handleBulkDelete = async () => {
    if (!confirm(`ต้องการลบงาน ${selectedTasks.size} รายการ?`)) return;

    const promises = Array.from(selectedTasks).map((taskId) =>
      deleteTaskMutation.mutateAsync(taskId)
    );

    await Promise.all(promises);
    setSelectedTasks(new Set());
  };

  const handleBulkStatusChange = async (statusId: string) => {
    // Filter out closed tasks from bulk status change
    const tasksToUpdate = filteredAndSortedTasks
      .filter(task => selectedTasks.has(task.id) && !task.isClosed)
      .map(task => task.id);

    if (tasksToUpdate.length === 0) {
      alert('ไม่สามารถเปลี่ยนสถานะของงานที่ปิดแล้ว');
      return;
    }

    if (tasksToUpdate.length < selectedTasks.size) {
      const skipped = selectedTasks.size - tasksToUpdate.length;
      if (!confirm(`จะเปลี่ยนสถานะ ${tasksToUpdate.length} งาน (ข้าม ${skipped} งานที่ปิดแล้ว)`)) {
        return;
      }
    }

    const promises = tasksToUpdate.map((taskId) =>
      updateTaskMutation.mutateAsync({ taskId, data: { statusId } })
    );

    await Promise.all(promises);
    setSelectedTasks(new Set());
  };

  // Quick actions - WITH OPTIMISTIC UI
  const handleQuickStatusChange = (taskId: string, statusId: string) => {
    // Get the status object for optimistic update
    const status = uniqueStatuses.find(s => s.id === statusId);

    // Optimistically update local cache IMMEDIATELY
    const boardKey = projectKeys.board(projectId);

    queryClient.setQueryData(boardKey, (old: any) => {
      if (!old?.tasks) return old;
      return {
        ...old,
        tasks: old.tasks.map((task: Task) =>
          task.id === taskId ? { ...task, statusId, status } : task
        ),
      };
    });

    // Then trigger server mutation (with its own optimistic update)
    updateTaskMutation.mutate({
      taskId,
      data: { statusId },
    });
  };

  // Quick priority change handler - WITH OPTIMISTIC UI
  const handleQuickPriorityChange = (taskId: string, priority: number) => {
    // Optimistically update local cache IMMEDIATELY
    const boardKey = projectKeys.board(projectId);

    queryClient.setQueryData(boardKey, (old: any) => {
      if (!old?.tasks) return old;
      return {
        ...old,
        tasks: old.tasks.map((task: Task) =>
          task.id === taskId ? { ...task, priority } : task
        ),
      };
    });

    // Then trigger server mutation
    updateTaskMutation.mutate({
      taskId,
      data: { priority },
    });
  };

  // Quick due date change handler - WITH OPTIMISTIC UI
  const handleQuickDueDateChange = (taskId: string, dueDate: string | null) => {
    // Optimistically update local cache IMMEDIATELY
    const boardKey = projectKeys.board(projectId);

    queryClient.setQueryData(boardKey, (old: any) => {
      if (!old?.tasks) return old;
      return {
        ...old,
        tasks: old.tasks.map((task: Task) =>
          task.id === taskId ? { ...task, dueDate } : task
        ),
      };
    });

    // Then trigger server mutation
    updateTaskMutation.mutate({
      taskId,
      data: { dueDate },
    });
  };

  // Quick assignee change handler - WITH OPTIMISTIC UI
  const handleQuickAssigneeChange = (taskId: string, assigneeUserIds: string[]) => {
    // Get assignee objects for optimistic update
    const assignees = assigneeUserIds
      .map(id => uniqueAssignees.find(a => a.id === id))
      .filter(Boolean) as Array<{ id: string; fullName: string; email: string; profileImageUrl?: string | null }>;

    // Optimistically update local cache IMMEDIATELY
    const boardKey = projectKeys.board(projectId);

    queryClient.setQueryData(boardKey, (old: any) => {
      if (!old?.tasks) return old;
      return {
        ...old,
        tasks: old.tasks.map((task: Task) =>
          task.id === taskId
            ? {
                ...task,
                assigneeUserIds,
                assignees,
                // Keep legacy field for backward compatibility
                assigneeUserId: assigneeUserIds[0] || null,
                assignee: assignees[0] || null,
              }
            : task
        ),
      };
    });

    // Then trigger server mutation
    updateTaskMutation.mutate({
      taskId,
      data: { assigneeUserIds },
    });
  };

  // Task name editing handlers
  const startEditingTaskName = (taskId: string, currentName: string) => {
    setEditingTaskId(taskId);
    setEditingTaskName(currentName);
  };

  const cancelEditingTaskName = () => {
    setEditingTaskId(null);
    setEditingTaskName('');
  };

  const saveTaskName = (taskId: string) => {
    if (!editingTaskName.trim()) {
      cancelEditingTaskName();
      return;
    }

    const newName = editingTaskName.trim();
    if (newName !== data?.tasks.find(t => t.id === taskId)?.name) {
      // Optimistically update local cache IMMEDIATELY
      const boardKey = projectKeys.board(projectId);

      queryClient.setQueryData(boardKey, (old: any) => {
        if (!old?.tasks) return old;
        return {
          ...old,
          tasks: old.tasks.map((task: Task) =>
            task.id === taskId ? { ...task, name: newName } : task
          ),
        };
      });

      // Then trigger server mutation
      updateTaskMutation.mutate({
        taskId,
        data: { name: newName },
      });
    }

    cancelEditingTaskName();
  };

  // Close task handlers
  const handleOpenCloseDialog = (task: Task) => {
    if (!data?.statuses) return;

    const currentStatus = data.statuses.find((s) => s.id === task.statusId);
    if (!currentStatus) return;

    // Auto-select close type based on status type
    // DONE → COMPLETED, NOT_STARTED/IN_PROGRESS → ABORTED
    setCloseType(currentStatus.type === 'DONE' ? 'COMPLETED' : 'ABORTED');
    setCloseDialogTask(task);
  };

  const handleCloseTask = () => {
    if (!closeDialogTask) return;

    closeTaskMutation.mutate(
      { taskId: closeDialogTask.id, closeType },
      {
        onSuccess: () => {
          setCloseDialogTask(null);
        },
      }
    );
  };

  // Get close button properties based on task status
  const getCloseButtonProps = (task: Task) => {
    if (!data?.statuses) {
      return { label: 'ปิดงาน', isDone: false, icon: XCircle };
    }

    const currentStatus = data.statuses.find((s) => s.id === task.statusId);
    if (!currentStatus) {
      return { label: 'ปิดงาน', isDone: false, icon: XCircle };
    }

    // Check if status type is DONE
    if (currentStatus.type === 'DONE') {
      return {
        label: 'แล้วเสร็จ',
        isDone: true,
        icon: CheckCircle2,
      };
    }

    // Status is NOT_STARTED or IN_PROGRESS
    return {
      label: 'ยกเลิกงาน',
      isDone: false,
      icon: XCircle,
    };
  };

  // Toggle pin task - WITH OPTIMISTIC UPDATE
  const handleTogglePin = (task: Task) => {
    // Optimistically update board cache IMMEDIATELY
    const boardKey = projectKeys.board(projectId);

    queryClient.setQueryData(boardKey, (old: any) => {
      if (!old?.tasks) return old;
      return {
        ...old,
        tasks: old.tasks.map((t: Task) =>
          t.id === task.id ? { ...t, isPinned: !task.isPinned } : t
        ),
      };
    });

    // Then trigger mutation with optimistic update
    togglePinMutation.mutate({
      taskId: task.id,
      isPinned: task.isPinned || false,
    });
  };

  // Delete task handler
  const handleDeleteTask = () => {
    if (!deleteDialogTask) return;

    deleteTaskMutation.mutate(deleteDialogTask.id, {
      onSuccess: () => {
        setDeleteDialogTask(null);
      },
    });
  };

  // Render sort icon
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-1 h-3 w-3 opacity-30" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="ml-1 h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3" />
    );
  };

  // Get unique values for filters
  const uniqueStatuses = useMemo(
    () => data?.statuses || [],
    [data?.statuses]
  );

  // Use all department users for assignee dropdown (not just assigned users)
  const availableUsers = useMemo(
    () => data?.users || [],
    [data?.users]
  );

  // Get unique assignees for filter dropdown (only users who are assigned)
  const uniqueAssignees = useMemo(() => {
    if (!data?.tasks) return [];
    const assignees = new Map();
    data.tasks.forEach((task) => {
      // Support both new multi-assignee and legacy single assignee
      if (task.assignees) {
        task.assignees.forEach((assignee) => {
          assignees.set(assignee.id, assignee);
        });
      } else if (task.assignee) {
        assignees.set(task.assignee.id, task.assignee);
      }
    });
    return Array.from(assignees.values());
  }, [data?.tasks]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          เกิดข้อผิดพลาดในการโหลดข้อมูล: {error.message}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Filters and Bulk Actions Bar */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="ค้นหางาน..."
            value={filters.search}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, search: e.target.value }))
            }
            className="max-w-sm bg-white dark:bg-gray-800"
          />
        </div>

        {/* Filter Label */}
        <span className="text-sm text-muted-foreground font-medium">ตัวกรอง:</span>

        {/* Status Filter */}
        <Select
          value={filters.statusId || 'ALL'}
          onValueChange={(value) =>
            setFilters((prev) => ({ ...prev, statusId: value === 'ALL' ? '' : value }))
          }
        >
          <SelectTrigger className="w-[150px] bg-white dark:bg-gray-800">
            <SelectValue placeholder="สถานะทั้งหมด" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">ทั้งหมด</SelectItem>
            {uniqueStatuses.map((status) => (
              <SelectItem key={status.id} value={status.id}>
                {status.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Priority Filter */}
        <Select
          value={filters.priorityId || 'ALL'}
          onValueChange={(value) =>
            setFilters((prev) => ({ ...prev, priorityId: value === 'ALL' ? '' : value }))
          }
        >
          <SelectTrigger className="w-[150px] bg-white dark:bg-gray-800">
            <SelectValue placeholder="ความสำคัญทั้งหมด" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">ทั้งหมด</SelectItem>
            <SelectItem value="1">ด่วนมาก</SelectItem>
            <SelectItem value="2">สูง</SelectItem>
            <SelectItem value="3">ปานกลาง</SelectItem>
            <SelectItem value="4">ต่ำ</SelectItem>
          </SelectContent>
        </Select>

        {/* Assignee Filter */}
        <Select
          value={filters.assigneeId || 'ALL'}
          onValueChange={(value) =>
            setFilters((prev) => ({ ...prev, assigneeId: value === 'ALL' ? '' : value }))
          }
        >
          <SelectTrigger className="w-[180px] bg-white dark:bg-gray-800">
            <SelectValue placeholder="ผู้รับผิดชอบทั้งหมด" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">ทั้งหมด</SelectItem>
            {uniqueAssignees.map((assignee) => (
              <SelectItem key={assignee.id} value={assignee.id}>
                {assignee.fullName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Hide Closed Tasks Toggle */}
        <div className="flex items-center gap-2 ml-auto">
          <Label htmlFor="hide-closed" className="cursor-pointer text-sm">
            ซ่อนงานที่ปิดแล้ว
          </Label>
          <Switch
            id="hide-closed"
            checked={filters.hideClosed}
            onCheckedChange={(checked) =>
              setFilters((prev) => ({ ...prev, hideClosed: checked }))
            }
          />
        </div>

        {/* Bulk Actions */}
        {selectedTasks.size > 0 && (
          <>
            <div className="text-sm text-muted-foreground">
              เลือก {selectedTasks.size} รายการ
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  การดำเนินการ
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleBulkDelete()}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  ลบที่เลือก
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {uniqueStatuses.map((status) => (
                  <DropdownMenuItem
                    key={status.id}
                    onClick={() => handleBulkStatusChange(status.id)}
                  >
                    เปลี่ยนเป็น: {status.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedTasks(new Set())}
            >
              ยกเลิก
            </Button>
          </>
        )}
      </div>

      {/* Table */}
      <div className="border rounded-lg bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={
                    selectedTasks.size === filteredAndSortedTasks.length &&
                    filteredAndSortedTasks.length > 0
                  }
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead className="w-[40px]"></TableHead>
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center">
                  ชื่องาน
                  <SortIcon field="name" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none w-[120px]"
                onClick={() => handleSort('priority')}
              >
                <div className="flex items-center">
                  ความสำคัญ
                  <SortIcon field="priority" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none w-[150px]"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center">
                  สถานะ
                  <SortIcon field="status" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none w-[140px]"
                onClick={() => handleSort('assignee')}
              >
                <div className="flex items-center">
                  ผู้รับผิดชอบ
                  <SortIcon field="assignee" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none w-[165px]"
                onClick={() => handleSort('dueDate')}
              >
                <div className="flex items-center">
                  กำหนดเสร็จ
                  <SortIcon field="dueDate" />
                </div>
              </TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedTasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  <div className="text-muted-foreground">
                    {filters.search || filters.statusId || filters.priorityId || filters.assigneeId
                      ? 'ไม่พบงานที่ตรงกับเงื่อนไข'
                      : 'ยังไม่มีงานในโปรเจกต์นี้'}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedTasks.map((task) => (
                <TableRow
                  key={task.id}
                  className={cn(
                    'cursor-pointer transition-colors bg-card hover:bg-accent/30',
                    task.isClosed && 'opacity-60',
                    selectedTasks.has(task.id) && 'bg-primary/10 hover:bg-primary/15'
                  )}
                  onClick={(e) => {
                    // Don't open panel if clicking on checkbox or actions
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
                      checked={selectedTasks.has(task.id)}
                      onCheckedChange={() => toggleSelectTask(task.id)}
                    />
                  </TableCell>

                  {/* Pin Icon */}
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleTogglePin(task)}
                      disabled={task.isClosed}
                      className={cn(
                        "transition-transform",
                        !task.isClosed && "hover:scale-110"
                      )}
                      title={task.isClosed ? 'ไม่สามารถปักหมุดงานที่ปิดแล้ว' : (task.isPinned ? 'ยกเลิกปักหมุด' : 'ปักหมุด')}
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

                  {/* Task Name - Inline Editor */}
                  <TableCell
                    className="font-medium text-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (editingTaskId !== task.id && !task.isClosed) {
                        startEditingTaskName(task.id, task.name);
                      }
                    }}
                  >
                    {editingTaskId === task.id ? (
                      <Input
                        value={editingTaskName}
                        onChange={(e) => setEditingTaskName(e.target.value)}
                        onBlur={() => saveTaskName(task.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            saveTaskName(task.id);
                          } else if (e.key === 'Escape') {
                            cancelEditingTaskName();
                          }
                        }}
                        autoFocus
                        className="h-8 text-sm"
                      />
                    ) : (
                      <div className={cn(
                        "rounded px-2 py-1 -mx-2 -my-1 transition-colors",
                        !task.isClosed && "cursor-text hover:bg-accent/50"
                      )}>
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
                      onValueChange={(value) => handleQuickPriorityChange(task.id, parseInt(value))}
                      disabled={task.isClosed}
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
                      onValueChange={(value) => handleQuickStatusChange(task.id, value)}
                      disabled={task.isClosed}
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
                            {task.status?.name}
                          </Badge>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {uniqueStatuses.map((status) => (
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
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>

                  {/* Assignee - Multi-select popover */}
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <AssigneePopover
                      users={availableUsers}
                      selectedUserIds={task.assigneeUserIds || []}
                      onSave={(newIds) => handleQuickAssigneeChange(task.id, newIds)}
                      disabled={task.isClosed}
                      maxVisible={3}
                    />
                  </TableCell>

                  {/* Due Date - Editable */}
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DateInput
                      value={task.dueDate}
                      onChange={(newDate) => handleQuickDueDateChange(task.id, newDate)}
                      placeholder="เลือกวันที่"
                      className="text-xs h-8 w-full"
                      disabled={task.isClosed}
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
                        <DropdownMenuItem onClick={() => handleTogglePin(task)}>
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
                        ) : (() => {
                          const closeProps = getCloseButtonProps(task);
                          const CloseIcon = closeProps.icon;
                          return (
                            <DropdownMenuItem
                              onClick={() => handleOpenCloseDialog(task)}
                              className={closeProps.isDone ? 'text-green-600' : ''}
                            >
                              <CloseIcon className="mr-2 h-4 w-4" />
                              {closeProps.label}
                            </DropdownMenuItem>
                          );
                        })()}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => setDeleteDialogTask(task)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          ลบ
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Task Count - Moved below table */}
      <div className="text-sm text-muted-foreground text-center">
        แสดง {filteredAndSortedTasks.length} จากทั้งหมด {data?.tasks?.length || 0} รายการ
      </div>

      {/* Close Task Dialog */}
      <AlertDialog open={!!closeDialogTask} onOpenChange={(open) => !open && setCloseDialogTask(null)}>
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
      <AlertDialog open={!!deleteDialogTask} onOpenChange={(open) => !open && setDeleteDialogTask(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ลบงาน</AlertDialogTitle>
            <AlertDialogDescription>
              คุณแน่ใจหรือไม่ว่าต้องการลบงาน "{deleteDialogTask?.name}"
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
    </div>
  );
}
