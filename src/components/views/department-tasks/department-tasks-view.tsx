/**
 * DepartmentTasksView - Department-level task management view
 * Features: Pinned tasks table + Project-grouped tables with sorting
 */

'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { type Task } from '@/hooks/use-tasks';
import { usePersistedFilters } from '@/hooks/use-persisted-filters';
import {
  useUpdateDepartmentTask,
  useToggleDepartmentTaskPin,
  useCloseDepartmentTask
} from '@/hooks/use-department-tasks';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { TaskRow } from '@/components/common/task-row';
import { ArrowUpDown, ArrowUp, ArrowDown, Pin, FolderKanban, ChevronDown, ChevronRight, FileText, CheckCircle, AlertCircle, Clock, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/use-ui-store';

interface Status {
  id: string;
  name: string;
  color: string;
  order: number;
  type: 'NOT_STARTED' | 'IN_PROGRESS' | 'DONE';
}

interface User {
  id: string;
  fullName: string;
  email: string;
  profileImageUrl?: string | null;
}

interface Project {
  id: string;
  name: string;
  isActive: boolean;
  progress: number; // 0-1 from API (calculated using GAS formula)
  tasks: Task[];
  statuses: Status[];
}

interface DepartmentTasksViewProps {
  departmentId: string;
  projects: Project[];
  allUsers: User[];
}

type SortField = 'name' | 'priority' | 'dueDate' | 'assignee' | 'status' | 'createdAt';
type SortOrder = 'asc' | 'desc';

export function DepartmentTasksView({ departmentId, projects, allUsers }: DepartmentTasksViewProps) {
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [pinnedSortField, setPinnedSortField] = useState<SortField>('priority');
  const [pinnedSortOrder, setPinnedSortOrder] = useState<SortOrder>('asc');
  const [projectSorts, setProjectSorts] = useState<Record<string, { field: SortField; order: SortOrder }>>({});

  // Edit Project Modal
  const openEditProjectModal = useUIStore((state) => state.openEditProjectModal);

  // Initialize collapsed state: collapse projects with no tasks (after filter)
  const [collapsedProjects, setCollapsedProjects] = useState<Set<string>>(() => {
    const collapsed = new Set<string>();
    projects.forEach((project) => {
      const nonPinnedTasks = project.tasks.filter((task) => !task.isPinned && !task.isClosed);
      if (nonPinnedTasks.length === 0) {
        collapsed.add(project.id);
      }
    });
    return collapsed;
  });

  const [isPinnedCollapsed, setIsPinnedCollapsed] = useState<boolean>(false);

  // Filter state with localStorage persistence
  const [filters, setFilters] = usePersistedFilters();

  // Department-specific mutations with optimistic updates
  // Must pass the same filters used in the query for cache key matching
  const apiFilters = {
    view: "grouped" as const,
    includeCompleted: false,
    sortBy: "dueDate" as const,
    sortDir: "asc" as const,
  };

  const updateTaskMutation = useUpdateDepartmentTask(departmentId, apiFilters);
  const togglePinMutation = useToggleDepartmentTaskPin(departmentId, apiFilters);
  const closeTaskMutation = useCloseDepartmentTask(departmentId, apiFilters);

  // Apply filters to tasks
  const applyFilters = (tasks: Task[]): Task[] => {
    let filtered = [...tasks];

    // Filter by hideClosed
    if (filters.hideClosed) {
      filtered = filtered.filter((task) => !task.isClosed);
    }

    // Filter by search
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(
        (task) =>
          task.name.toLowerCase().includes(search) ||
          task.description?.toLowerCase().includes(search)
      );
    }

    // Filter by status
    if (filters.statusId) {
      filtered = filtered.filter((task) => task.statusId === filters.statusId);
    }

    // Filter by priority
    if (filters.priorityId) {
      filtered = filtered.filter((task) => task.priority === parseInt(filters.priorityId));
    }

    // Filter by assignee
    if (filters.assigneeId) {
      filtered = filtered.filter((task) =>
        task.assigneeUserIds?.includes(filters.assigneeId) ||
        task.assigneeUserId === filters.assigneeId // Fallback for old data
      );
    }

    return filtered;
  };

  // Get all pinned tasks across all projects (with filters)
  const pinnedTasks = useMemo(() => {
    const tasks: Task[] = [];
    projects.forEach((project) => {
      project.tasks.forEach((task) => {
        if (task.isPinned && !task.isClosed) {
          tasks.push(task);
        }
      });
    });
    return applyFilters(tasks);
  }, [projects, filters]);

  // Get all statuses and users for TaskRow
  const allStatuses = useMemo(() => {
    const statusMap = new Map();
    projects.forEach((project) => {
      if (project.statuses && Array.isArray(project.statuses)) {
        project.statuses.forEach((status) => {
          statusMap.set(status.id, status);
        });
      }
    });
    return Array.from(statusMap.values());
  }, [projects]);

  // Create project statuses map for pinned tasks
  // Each task should only see statuses from its own project
  const projectStatusesMap = useMemo(() => {
    const map = new Map();
    projects.forEach((project) => {
      if (project.statuses && Array.isArray(project.statuses)) {
        map.set(project.id, project.statuses);
      }
    });
    return map;
  }, [projects]);

  // Get unique statuses for filter
  const uniqueStatuses = useMemo(() => {
    return allStatuses;
  }, [allStatuses]);

  // Get unique assignees for filter
  const uniqueAssignees = useMemo(() => {
    const assigneeMap = new Map();
    projects.forEach((project) => {
      project.tasks.forEach((task) => {
        task.assignees?.forEach((assignee) => {
          assigneeMap.set(assignee.id, assignee);
        });
        // Fallback for old data
        if (task.assignee) {
          assigneeMap.set(task.assignee.id, task.assignee);
        }
      });
    });
    return Array.from(assigneeMap.values());
  }, [projects]);

  // Sort tasks helper
  const sortTasks = (tasks: Task[], field: SortField, order: SortOrder): Task[] => {
    return [...tasks].sort((a, b) => {
      let comparison = 0;

      switch (field) {
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

      return order === 'asc' ? comparison : -comparison;
    });
  };

  // Sorted pinned tasks
  const sortedPinnedTasks = useMemo(() => {
    return sortTasks(pinnedTasks, pinnedSortField, pinnedSortOrder);
  }, [pinnedTasks, pinnedSortField, pinnedSortOrder]);

  // Handle sort for pinned table
  const handlePinnedSort = (field: SortField) => {
    if (pinnedSortField === field) {
      setPinnedSortOrder(pinnedSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setPinnedSortField(field);
      setPinnedSortOrder('asc');
    }
  };

  // Handle sort for project table
  const handleProjectSort = (projectId: string, field: SortField) => {
    const currentSort = projectSorts[projectId] || { field: 'priority', order: 'asc' };

    if (currentSort.field === field) {
      setProjectSorts({
        ...projectSorts,
        [projectId]: { field, order: currentSort.order === 'asc' ? 'desc' : 'asc' },
      });
    } else {
      setProjectSorts({
        ...projectSorts,
        [projectId]: { field, order: 'asc' },
      });
    }
  };

  // Get sorted tasks for a project (with filters)
  const getSortedProjectTasks = (project: Project): Task[] => {
    const sort = projectSorts[project.id] || { field: 'priority', order: 'asc' };
    const nonPinnedTasks = project.tasks.filter((task) => !task.isPinned);
    const filteredTasks = applyFilters(nonPinnedTasks);
    return sortTasks(filteredTasks, sort.field, sort.order);
  };

  // Selection handlers
  const toggleSelectTask = (taskId: string) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTasks(newSelected);
  };

  const toggleSelectAll = (tasks: Task[]) => {
    const taskIds = tasks.map((t) => t.id);
    const allSelected = taskIds.every((id) => selectedTasks.has(id));

    const newSelected = new Set(selectedTasks);
    if (allSelected) {
      taskIds.forEach((id) => newSelected.delete(id));
    } else {
      taskIds.forEach((id) => newSelected.add(id));
    }
    setSelectedTasks(newSelected);
  };

  // Toggle project collapse
  const toggleProjectCollapse = (projectId: string) => {
    const newCollapsed = new Set(collapsedProjects);
    if (newCollapsed.has(projectId)) {
      newCollapsed.delete(projectId);
    } else {
      newCollapsed.add(projectId);
    }
    setCollapsedProjects(newCollapsed);
  };

  // Render sort icon
  const SortIcon = ({ field, currentField, currentOrder }: { field: SortField; currentField: SortField; currentOrder: SortOrder }) => {
    if (currentField !== field) {
      return <ArrowUpDown className="ml-1 h-3 w-3 opacity-30" />;
    }
    return currentOrder === 'asc' ? (
      <ArrowUp className="ml-1 h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3" />
    );
  };

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
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
          <Label htmlFor="hide-closed-dept" className="cursor-pointer text-sm">
            ซ่อนงานที่ปิดแล้ว
          </Label>
          <Switch
            id="hide-closed-dept"
            checked={filters.hideClosed}
            onCheckedChange={(checked) =>
              setFilters((prev) => ({ ...prev, hideClosed: checked }))
            }
          />
        </div>
      </div>

      {/* Pinned Tasks Table */}
      {pinnedTasks.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-900 bg-amber-50/30 dark:bg-amber-950/10">
          <CardHeader className="pb-3 bg-amber-50/50 dark:bg-amber-950/20">
            <CardTitle className="text-base flex items-center gap-2">
              <button
                onClick={() => setIsPinnedCollapsed(!isPinnedCollapsed)}
                className="p-0.5 hover:bg-amber-100 dark:hover:bg-amber-900 rounded transition-colors"
              >
                {isPinnedCollapsed ? (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
              <span className="text-amber-700 dark:text-amber-600">งานที่ปักหมุด</span>
              <Badge variant="secondary" className="ml-2 bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-100">
                {pinnedTasks.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          {!isPinnedCollapsed && (
            <CardContent className="p-0">
              <div className="border-t border-amber-200 dark:border-amber-900">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]">
                      <Checkbox
                        checked={
                          pinnedTasks.length > 0 &&
                          pinnedTasks.every((t) => selectedTasks.has(t.id))
                        }
                        onCheckedChange={() => toggleSelectAll(pinnedTasks)}
                      />
                    </TableHead>
                    <TableHead className="w-[40px]"></TableHead>
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => handlePinnedSort('name')}
                    >
                      <div className="flex items-center">
                        ชื่องาน
                        <SortIcon field="name" currentField={pinnedSortField} currentOrder={pinnedSortOrder} />
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none w-[120px]"
                      onClick={() => handlePinnedSort('priority')}
                    >
                      <div className="flex items-center">
                        ความสำคัญ
                        <SortIcon field="priority" currentField={pinnedSortField} currentOrder={pinnedSortOrder} />
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none w-[150px]"
                      onClick={() => handlePinnedSort('status')}
                    >
                      <div className="flex items-center">
                        สถานะ
                        <SortIcon field="status" currentField={pinnedSortField} currentOrder={pinnedSortOrder} />
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none w-[140px]"
                      onClick={() => handlePinnedSort('assignee')}
                    >
                      <div className="flex items-center">
                        ผู้รับผิดชอบ
                        <SortIcon field="assignee" currentField={pinnedSortField} currentOrder={pinnedSortOrder} />
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none w-[165px]"
                      onClick={() => handlePinnedSort('dueDate')}
                    >
                      <div className="flex items-center">
                        กำหนดเสร็จ
                        <SortIcon field="dueDate" currentField={pinnedSortField} currentOrder={pinnedSortOrder} />
                      </div>
                    </TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedPinnedTasks.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      statuses={projectStatusesMap.get(task.projectId) || []}
                      users={allUsers}
                      isSelected={selectedTasks.has(task.id)}
                      onToggleSelect={toggleSelectTask}
                      showProjectColumn={false}
                      customMutations={{
                        updateTask: updateTaskMutation,
                        closeTask: closeTaskMutation,
                        togglePinTask: togglePinMutation,
                      }}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        )}
        </Card>
      )}

      {/* Project Tables */}
      {projects.map((project) => {
        const sortedTasks = getSortedProjectTasks(project);
        const sort = projectSorts[project.id] || { field: 'priority', order: 'asc' };
        const isCollapsed = collapsedProjects.has(project.id);
        // Use progress from API (0-1, convert to 0-100 for display)
        // API calculates using GAS formula: Σ(statusOrder × difficulty) / Σ(Smax × difficulty) × 100
        const progress = Math.round((project.progress || 0) * 100);
        const totalTasks = project.tasks.length;
        const completedTasks = project.tasks.filter((t) => t.isClosed).length;

        return (
          <Card key={project.id}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleProjectCollapse(project.id)}
                    className="p-0.5 hover:bg-accent rounded transition-colors"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Link
                      href={`/projects/${project.id}/list`}
                      className="text-primary hover:text-primary/80 hover:underline transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {project.name}
                    </Link>
                    <TooltipProvider delayDuration={300}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditProjectModal(project.id);
                            }}
                            className="p-1 rounded-full hover:bg-accent transition-colors"
                            aria-label="รายละเอียดโปรเจค"
                          >
                            <Info className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" sideOffset={8}>
                          รายละเอียดโปรเจค
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </CardTitle>
                  {!project.isActive && (
                    <Badge variant="outline" className="text-xs">
                      ไม่ทำงาน
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  {/* Quick Stats */}
                  <TooltipProvider delayDuration={300}>
                    <div className="flex items-center gap-3 text-xs">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1.5 cursor-help">
                            <FileText className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                            <span className="font-medium">{totalTasks}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" sideOffset={8}>
                          งานทั้งหมด
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1.5 cursor-help">
                            <CheckCircle className="h-3.5 w-3.5 text-green-600" aria-hidden="true" />
                            <span className="font-medium text-green-600">{completedTasks}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" sideOffset={8}>
                          งานที่เสร็จแล้ว
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1.5 cursor-help">
                            <AlertCircle className="h-3.5 w-3.5 text-red-600" aria-hidden="true" />
                            <span className="font-medium text-red-600">
                              {project.tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && !t.isClosed).length}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" sideOffset={8}>
                          งานเกินกำหนด
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1.5 cursor-help">
                            <Clock className="h-3.5 w-3.5 text-orange-600" aria-hidden="true" />
                            <span className="font-medium text-orange-600">
                              {project.tasks.filter(t => {
                                if (!t.dueDate || t.isClosed) return false;
                                const daysUntilDue = Math.ceil((new Date(t.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                                return daysUntilDue >= 0 && daysUntilDue <= 3;
                              }).length}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" sideOffset={8}>
                          งานใกล้ครบกำหนด (0-3 วัน)
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </TooltipProvider>

                  {/* Progress Bar */}
                  <TooltipProvider delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="w-32 cursor-help">
                          <Progress value={progress} className="h-2" aria-label={`ความคืบหน้า ${progress}%`} />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" sideOffset={8}>
                        ความคืบหน้า: {progress}%
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </CardHeader>
            {!isCollapsed && (
              <CardContent className="p-0">
                <div className="border-t">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]">
                        <Checkbox
                          checked={
                            sortedTasks.length > 0 &&
                            sortedTasks.every((t) => selectedTasks.has(t.id))
                          }
                          onCheckedChange={() => toggleSelectAll(sortedTasks)}
                        />
                      </TableHead>
                      <TableHead className="w-[40px]"></TableHead>
                      <TableHead
                        className="cursor-pointer select-none"
                        onClick={() => handleProjectSort(project.id, 'name')}
                      >
                        <div className="flex items-center">
                          ชื่องาน
                          <SortIcon field="name" currentField={sort.field} currentOrder={sort.order} />
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer select-none w-[120px]"
                        onClick={() => handleProjectSort(project.id, 'priority')}
                      >
                        <div className="flex items-center">
                          ความสำคัญ
                          <SortIcon field="priority" currentField={sort.field} currentOrder={sort.order} />
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer select-none w-[150px]"
                        onClick={() => handleProjectSort(project.id, 'status')}
                      >
                        <div className="flex items-center">
                          สถานะ
                          <SortIcon field="status" currentField={sort.field} currentOrder={sort.order} />
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer select-none w-[140px]"
                        onClick={() => handleProjectSort(project.id, 'assignee')}
                      >
                        <div className="flex items-center">
                          ผู้รับผิดชอบ
                          <SortIcon field="assignee" currentField={sort.field} currentOrder={sort.order} />
                        </div>
                      </TableHead>
                      <TableHead
                        className="cursor-pointer select-none w-[165px]"
                        onClick={() => handleProjectSort(project.id, 'dueDate')}
                      >
                        <div className="flex items-center">
                          กำหนดเสร็จ
                          <SortIcon field="dueDate" currentField={sort.field} currentOrder={sort.order} />
                        </div>
                      </TableHead>
                      <TableHead className="w-[60px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedTasks.length > 0 ? (
                      sortedTasks.map((task) => (
                        <TaskRow
                          key={task.id}
                          task={task}
                          statuses={project.statuses}
                          users={allUsers}
                          isSelected={selectedTasks.has(task.id)}
                          onToggleSelect={toggleSelectTask}
                          showProjectColumn={false}
                          customMutations={{
                            updateTask: updateTaskMutation,
                            closeTask: closeTaskMutation,
                            togglePinTask: togglePinMutation,
                          }}
                        />
                      ))
                    ) : (
                      <TableRow>
                        <td colSpan={8} className="h-24 text-center text-muted-foreground">
                          ไม่มีงานที่ตรงกับตัวกรอง
                        </td>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
