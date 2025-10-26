"use client";

import { useState } from "react";
import { ProjectGroup, TaskItem } from "@/hooks/use-department-tasks";
import {
  ChevronDown,
  ChevronRight,
  Folder,
  Users,
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle2,
  Pin,
} from "lucide-react";
import { useUIStore } from "@/stores/use-ui-store";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PriorityBadge, PriorityDot } from "@/components/common/priority-badge";
import { UserAvatar } from "@/components/common/user-avatar";
import { useUpdateTask } from "@/hooks/use-tasks";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface ProjectGroupCardProps {
  project: ProjectGroup;
}

export function ProjectGroupCard({ project }: ProjectGroupCardProps) {
  // Auto-expand if project has tasks (1 or more)
  const [isExpanded, setIsExpanded] = useState(project.tasks.length > 0);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const { openTaskPanel } = useUIStore();
  const updateTaskMutation = useUpdateTask();

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedTasks.size === project.tasks.length) {
      setSelectedTasks(new Set());
    } else {
      setSelectedTasks(new Set(project.tasks.map((t) => t.id)));
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

  // Quick status change handler
  const handleQuickStatusChange = async (taskId: string, statusId: string) => {
    await updateTaskMutation.mutateAsync({
      taskId,
      data: { statusId },
    });
  };

  // Quick priority change handler
  const handleQuickPriorityChange = async (taskId: string, priority: number) => {
    await updateTaskMutation.mutateAsync({
      taskId,
      data: { priority },
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "ON_HOLD":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "COMPLETED":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "ARCHIVED":
        return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "ใช้งานอยู่";
      case "ON_HOLD":
        return "พักไว้";
      case "COMPLETED":
        return "เสร็จสิ้น";
      case "ARCHIVED":
        return "เก็บถาวร";
      default:
        return status;
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1:
        return "bg-red-500";
      case 2:
        return "bg-orange-500";
      case 3:
        return "bg-yellow-500";
      case 4:
        return "bg-gray-400";
      default:
        return "bg-gray-400";
    }
  };

  const getPriorityText = (priority: number) => {
    switch (priority) {
      case 1:
        return "ด่วนที่สุด";
      case 2:
        return "สำคัญ";
      case 3:
        return "ปกติ";
      case 4:
        return "ต่ำ";
      default:
        return "ไม่ระบุ";
    }
  };

  const handleTaskClick = (taskId: string) => {
    openTaskPanel(taskId);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 mb-4">
      {/* Project Header */}
      <div
        className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            {/* Expand/Collapse Icon */}
            <div className="mt-1">
              {isExpanded ? (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-500" />
              )}
            </div>

            {/* Project Icon */}
            <div className="mt-1">
              <Folder className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>

            {/* Project Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                {/* Left: Project Name + Status */}
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-primary truncate">
                    {project.name}
                  </h3>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full flex-shrink-0 ${getStatusColor(
                      project.status
                    )}`}
                  >
                    {getStatusText(project.status)}
                  </span>
                </div>

                {/* Right: Stats + Progress Bar */}
                <div className="flex items-center space-x-4 ml-6 flex-shrink-0">
                  {/* Quick Stats */}
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400">
                      <Users className="w-4 h-4" />
                      <span>{project.assignedUsers.length} คน</span>
                    </div>
                    <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{project.stats.completedTasks}</span>
                    </div>
                    {project.stats.overdueTasks > 0 && (
                      <div className="flex items-center space-x-1 text-red-600 dark:text-red-400">
                        <AlertCircle className="w-4 h-4" />
                        <span>{project.stats.overdueTasks}</span>
                      </div>
                    )}
                    {project.stats.dueSoonTasks > 0 && (
                      <div className="flex items-center space-x-1 text-orange-600 dark:text-orange-400">
                        <Clock className="w-4 h-4" />
                        <span>{project.stats.dueSoonTasks}</span>
                      </div>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-300"
                        style={{ width: `${Math.round((project.progress || 0) * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 w-8 text-right">
                      {Math.round((project.progress || 0) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Task List (Expanded) - Consistent Table Style */}
      {isExpanded && (
        <div className="border-t">
          {project.tasks.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <p>ไม่มีงานในโครงการนี้</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="w-[40px] pl-12">
                    <Checkbox
                      checked={
                        selectedTasks.size === project.tasks.length &&
                        project.tasks.length > 0
                      }
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead>ชื่องาน</TableHead>
                  <TableHead className="w-[120px]">ความสำคัญ</TableHead>
                  <TableHead className="w-[150px]">สถานะ</TableHead>
                  <TableHead className="w-[140px]">ผู้รับผิดชอบ</TableHead>
                  <TableHead className="w-[120px]">กำหนดเสร็จ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                  {project.tasks.map((task) => (
                    <TableRow
                      key={task.id}
                      className={cn(
                        'cursor-pointer transition-colors bg-card hover:bg-accent/30',
                        task.isClosed && 'opacity-60',
                        selectedTasks.has(task.id) && 'bg-primary/10 hover:bg-primary/15'
                      )}
                      onClick={(e) => {
                        // Don't open panel if clicking on checkbox or select
                        if (
                          (e.target as HTMLElement).closest('button') ||
                          (e.target as HTMLElement).closest('[role="checkbox"]')
                        ) {
                          return;
                        }
                        handleTaskClick(task.id);
                      }}
                    >
                      {/* Checkbox */}
                      <TableCell className="pl-12" onClick={(e) => e.stopPropagation()}>
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
                      </TableCell>

                      {/* Priority - Inline Editor */}
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Select
                          value={task.priority.toString()}
                          onValueChange={(value) => handleQuickPriorityChange(task.id, parseInt(value))}
                        >
                          <SelectTrigger className="h-8 w-full">
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

                      {/* Status - Inline Editor */}
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Select
                          value={task.status.id}
                          onValueChange={(value) => handleQuickStatusChange(task.id, value)}
                        >
                          <SelectTrigger className="h-8 w-full">
                            <SelectValue>
                              <Badge
                                style={{
                                  backgroundColor: task.status.color + '20',
                                  borderColor: task.status.color,
                                  color: task.status.color,
                                }}
                                variant="outline"
                                className="font-normal"
                              >
                                {task.status.name}
                              </Badge>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {project.statuses.map((status) => (
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
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}
    </div>
  );
}
