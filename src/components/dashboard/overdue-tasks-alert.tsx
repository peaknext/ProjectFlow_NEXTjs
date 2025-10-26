"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertTriangle, Folder, Calendar } from "lucide-react";
import { DashboardTask } from "@/types/dashboard";
import { useUIStore } from "@/stores/use-ui-store";
import { format } from "date-fns";
import { th } from "date-fns/locale";

interface OverdueTasksAlertProps {
  overdueTasks: DashboardTask[];
  isLoading?: boolean;
}

/**
 * Get initials from full name
 */
function getInitials(fullName: string): string {
  const parts = fullName.split(" ").filter((p) => p.length > 0);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return fullName.substring(0, 2).toUpperCase();
}

/**
 * Priority Badge Component
 */
function PriorityBadge({ priority }: { priority: number }) {
  const config = {
    1: { label: "ด่วนมาก", variant: "destructive" as const },
    2: { label: "สูง", variant: "destructive" as const },
    3: { label: "ปานกลาง", variant: "secondary" as const },
    4: { label: "ต่ำ", variant: "outline" as const },
  };

  const { label, variant } =
    config[priority as keyof typeof config] || config[3];

  return (
    <Badge variant={variant} className="text-[10px] px-1.5 py-0">
      {label}
    </Badge>
  );
}

/**
 * Task Row Component
 */
function TaskRow({
  task,
  onClick,
}: {
  task: DashboardTask;
  onClick: () => void;
}) {
  return (
    <div
      className="relative py-4 pl-8 pr-4 hover:bg-red-100 dark:hover:bg-red-900/20 cursor-pointer transition-colors"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* Department Badge (top right, above assignees) */}
      {task.project.department && (
        <div className="absolute top-2 right-4">
          <Badge
            variant="outline"
            className="text-[12px] px-2 py-0.5 bg-background/80"
          >
            {task.project.department.name}
          </Badge>
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          {/* Task Name + Priority */}
          <div className="flex items-center gap-2">
            <PriorityBadge priority={task.priority} />
            <h4 className="font-medium text-red-900 dark:text-red-100">
              {task.name}
            </h4>
          </div>

          {/* Project */}
          <div className="flex items-center gap-2 text-sm text-red-700 dark:text-red-300">
            <Folder className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{task.project.name}</span>
          </div>

          {/* Due Date */}
          <div className="flex items-center gap-2 text-sm text-red-700 dark:text-red-300">
            <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
            <span>
              ครบกำหนด:{" "}
              {task.dueDate
                ? format(new Date(task.dueDate), "d MMM yyyy", { locale: th })
                : "-"}
            </span>
          </div>
        </div>

        {/* Assignees at top right (pushed down to avoid badge) */}
        {task.assignees && task.assignees.length > 0 && (
          <div className="flex items-center -space-x-2 mt-10">
            {task.assignees.slice(0, 3).map((assignee) => (
              <Avatar
                key={assignee.userId}
                className="h-7 w-7 border-2 border-background"
              >
                {assignee.user.profileImageUrl && (
                  <AvatarImage
                    src={assignee.user.profileImageUrl}
                    alt={assignee.user.fullName}
                  />
                )}
                <AvatarFallback className="text-[10px] bg-red-200 dark:bg-red-800 text-red-900 dark:text-red-100">
                  {getInitials(assignee.user.fullName)}
                </AvatarFallback>
              </Avatar>
            ))}
            {task.assignees.length > 3 && (
              <div className="h-7 w-7 rounded-full bg-red-200 dark:bg-red-800 border-2 border-background flex items-center justify-center">
                <span className="text-[10px] font-medium text-red-900 dark:text-red-100">
                  +{task.assignees.length - 3}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Overdue Tasks Alert Component
 *
 * Displays alert for overdue tasks. Only renders when there are overdue tasks.
 */
export function OverdueTasksAlert({
  overdueTasks,
  isLoading,
}: OverdueTasksAlertProps) {
  const { openTaskPanel } = useUIStore();

  // Loading state
  if (isLoading) {
    return null; // Or show skeleton
  }

  // Don't render if no overdue tasks
  if (!overdueTasks || overdueTasks.length === 0) {
    return null;
  }

  const displayTasks = overdueTasks.slice(0, 5);
  const hasMore = overdueTasks.length > 5;

  return (
    <Card className="bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <CardTitle className="text-base text-red-900 dark:text-red-100">
              งานเกินกำหนด
            </CardTitle>
          </div>
          <Badge variant="destructive">{overdueTasks.length} งาน</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-red-200 dark:divide-red-900">
          {displayTasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onClick={() => openTaskPanel(task.id)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
