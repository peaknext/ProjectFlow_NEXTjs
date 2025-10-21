/**
 * ListView - แสดงงานในรูปแบบตาราง
 * พร้อม sorting, filtering, bulk actions, และ inline editing
 */

'use client';

import { useState, useMemo } from 'react';
import { useProject } from '@/hooks/use-projects';
import { useUpdateTask, useDeleteTask, type Task } from '@/hooks/use-tasks';
import { useUIStore } from '@/stores/use-ui-store';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
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

interface Filters {
  search: string;
  statusId: string;
  priorityId: string;
  assigneeId: string;
  showClosed: boolean;
}

export function ListView({ projectId }: ListViewProps) {
  const { data, isLoading, error } = useProject(projectId);
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();
  const openTaskPanel = useUIStore((state) => state.openTaskPanel);

  // State
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('priority');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [filters, setFilters] = useState<Filters>({
    search: '',
    statusId: '',
    priorityId: '',
    assigneeId: '',
    showClosed: false,
  });

  // Filter and sort tasks
  const filteredAndSortedTasks = useMemo(() => {
    if (!data?.tasks) return [];

    let tasks = [...data.tasks];

    // Apply filters
    if (!filters.showClosed) {
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
      tasks = tasks.filter((task) => task.assigneeUserId === filters.assigneeId);
    }

    // Apply sorting
    tasks.sort((a, b) => {
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
          const nameA = a.assignee?.fullName || 'zzz';
          const nameB = b.assignee?.fullName || 'zzz';
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
    const promises = Array.from(selectedTasks).map((taskId) =>
      updateTaskMutation.mutateAsync({ taskId, data: { statusId } })
    );

    await Promise.all(promises);
    setSelectedTasks(new Set());
  };

  // Quick actions
  const handleTogglePin = async (task: Task) => {
    // This would call a pin/unpin API
    console.log('Toggle pin:', task.id);
  };

  const handleQuickStatusChange = async (taskId: string, statusId: string) => {
    await updateTaskMutation.mutateAsync({
      taskId,
      data: { statusId },
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

  const uniqueAssignees = useMemo(() => {
    if (!data?.tasks) return [];
    const assignees = new Map();
    data.tasks.forEach((task) => {
      if (task.assignee) {
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
            className="max-w-sm"
          />
        </div>

        {/* Status Filter */}
        <Select
          value={filters.statusId || 'ALL'}
          onValueChange={(value) =>
            setFilters((prev) => ({ ...prev, statusId: value === 'ALL' ? '' : value }))
          }
        >
          <SelectTrigger className="w-[150px]">
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
          <SelectTrigger className="w-[150px]">
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
          <SelectTrigger className="w-[180px]">
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

        {/* Show Closed Toggle */}
        <Button
          variant={filters.showClosed ? 'default' : 'outline'}
          size="sm"
          onClick={() =>
            setFilters((prev) => ({ ...prev, showClosed: !prev.showClosed }))
          }
        >
          {filters.showClosed ? 'แสดงทั้งหมด' : 'เฉพาะที่เปิด'}
        </Button>

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

      {/* Task Count */}
      <div className="text-sm text-muted-foreground">
        แสดง {filteredAndSortedTasks.length} จากทั้งหมด {data?.tasks?.length || 0} รายการ
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
                className="cursor-pointer select-none w-[120px]"
                onClick={() => handleSort('dueDate')}
              >
                <div className="flex items-center">
                  กำหนดเสร็จ
                  <SortIcon field="dueDate" />
                </div>
              </TableHead>
              <TableHead className="w-[100px] text-center">Progress</TableHead>
              <TableHead className="w-[60px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedTasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center">
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
                  <TableCell>
                    {task.isPinned && (
                      <Pin className="h-4 w-4 text-amber-500 fill-amber-500" />
                    )}
                  </TableCell>

                  {/* Task Name */}
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <PriorityDot priority={task.priority} />
                      <div>
                        <div className={cn(task.isClosed && 'line-through')}>
                          {task.name}
                        </div>
                        {task.description && (
                          <div className="text-xs text-muted-foreground truncate max-w-[300px]">
                            {task.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>

                  {/* Priority */}
                  <TableCell>
                    <PriorityBadge priority={task.priority} size="sm" showIcon={false} />
                  </TableCell>

                  {/* Status */}
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Select
                      value={task.statusId}
                      onValueChange={(value) => handleQuickStatusChange(task.id, value)}
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

                  {/* Assignee */}
                  <TableCell>
                    {task.assignee ? (
                      <div className="flex items-center gap-2">
                        <UserAvatar user={task.assignee} size="xs" />
                        <span className="text-sm truncate">
                          {task.assignee.fullName}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">ไม่ระบุ</span>
                    )}
                  </TableCell>

                  {/* Due Date */}
                  <TableCell>
                    {task.dueDate ? (
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span
                          className={cn(
                            new Date(task.dueDate) < new Date() &&
                              !task.isClosed &&
                              'text-red-600 font-medium'
                          )}
                        >
                          {format(new Date(task.dueDate), 'd MMM', { locale: th })}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>

                  {/* Progress */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${task.progress || 0}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-8 text-right">
                        {task.progress || 0}%
                      </span>
                    </div>
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
                            ปิดแล้ว
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem>
                            <XCircle className="mr-2 h-4 w-4" />
                            ปิดงาน
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => {
                            if (confirm('ต้องการลบงานนี้?')) {
                              deleteTaskMutation.mutate(task.id);
                            }
                          }}
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
    </div>
  );
}
