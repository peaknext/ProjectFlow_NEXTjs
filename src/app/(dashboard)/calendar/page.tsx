"use client";

import { useState, useMemo } from "react";
import { DashboardCalendarWidget } from "@/components/dashboard/dashboard-calendar-widget";
import { useDashboard } from "@/hooks/use-dashboard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useUIStore } from "@/stores/use-ui-store";
import { format, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { th } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { CalendarDays, User, Clock, AlertCircle } from "lucide-react";
import type { DashboardTask } from "@/types/dashboard";
import { SwipeablePages } from "@/components/layout/swipeable-pages";

/**
 * Calendar Page Component for Mobile
 *
 * Features:
 * - Top: Dashboard Calendar Widget (interactive calendar with task indicators)
 * - Bottom: Task list for current month (sorted by date)
 *
 * Layout inspired by mobile calendar apps like Google Calendar
 */
export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { data: dashboardData, isLoading } = useDashboard();
  const openTaskPanel = useUIStore((state) => state.openTaskPanel);

  // Filter tasks for current month
  const monthTasks = useMemo(() => {
    if (!dashboardData?.calendarTasks) return [];

    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);

    return dashboardData.calendarTasks
      .filter((task) => {
        if (!task.dueDate) return false;
        const dueDate = new Date(task.dueDate);
        return isWithinInterval(dueDate, { start, end });
      })
      .sort((a, b) => {
        // Sort by due date, then priority
        const dateA = new Date(a.dueDate!).getTime();
        const dateB = new Date(b.dueDate!).getTime();
        if (dateA !== dateB) return dateA - dateB;
        return (a.priority || 4) - (b.priority || 4);
      });
  }, [dashboardData?.calendarTasks, currentMonth]);

  // Group tasks by date
  const tasksByDate = useMemo(() => {
    const grouped: Record<string, DashboardTask[]> = {};
    monthTasks.forEach((task) => {
      const dateKey = format(new Date(task.dueDate!), "yyyy-MM-dd");
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(task);
    });
    return grouped;
  }, [monthTasks]);

  const handleTaskClick = (taskId: string) => {
    openTaskPanel(taskId);
  };

  if (isLoading) {
    return <CalendarPageSkeleton />;
  }

  return (
    <SwipeablePages>
      <div className="flex flex-col h-full bg-background">
        {/* Calendar Widget */}
        <div className="flex-shrink-0 p-4">
          <DashboardCalendarWidget
            calendarTasks={dashboardData?.calendarTasks || []}
            isLoading={isLoading}
            currentMonth={currentMonth}
            onMonthChange={setCurrentMonth}
          />
        </div>

        {/* Task List */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur-sm py-2 border-b z-10">
              <h2 className="text-base font-semibold flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
              <span>งานในเดือนนี้</span>
              <Badge variant="secondary" className="text-xs">
                {monthTasks.length}
              </Badge>
            </h2>
          </div>

          {/* Task Groups by Date */}
          {Object.keys(tasksByDate).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CalendarDays className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">
                ไม่มีงานในเดือนนี้
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(tasksByDate).map(([dateKey, tasks]) => {
                const date = new Date(dateKey);
                const isToday = format(new Date(), "yyyy-MM-dd") === dateKey;
                const isPast = new Date(dateKey) < new Date() && !isToday;

                return (
                  <div key={dateKey} className="space-y-2">
                    {/* Date Header */}
                    <div
                      className={cn(
                        "flex items-center gap-2 text-sm font-medium sticky top-[52px] bg-background/95 backdrop-blur-sm py-1.5 border-b",
                        isToday && "text-primary",
                        isPast && "text-muted-foreground"
                      )}
                    >
                      <span>
                        {format(date, "d MMMM yyyy", { locale: th })}
                      </span>
                      {isToday && (
                        <Badge variant="default" className="text-xs">
                          วันนี้
                        </Badge>
                      )}
                    </div>

                    {/* Tasks for this date */}
                    <div className="space-y-2">
                      {tasks.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onClick={() => handleTaskClick(task.id)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          </div>
        </div>
      </div>
    </SwipeablePages>
  );
}

/**
 * Task Card Component
 */
interface TaskCardProps {
  task: DashboardTask;
  onClick: () => void;
}

function TaskCard({ task, onClick }: TaskCardProps) {
  const priorityColors = {
    1: "text-red-600 dark:text-red-400",
    2: "text-orange-600 dark:text-orange-400",
    3: "text-blue-600 dark:text-blue-400",
    4: "text-gray-600 dark:text-gray-400",
  };

  const priorityLabels = {
    1: "ด่วนมาก",
    2: "สูง",
    3: "ปานกลาง",
    4: "ต่ำ",
  };

  const statusColors: Record<string, string> = {
    NOT_STARTED: "bg-gray-500/20 text-gray-700 dark:text-gray-300",
    IN_PROGRESS: "bg-blue-500/20 text-blue-700 dark:text-blue-300",
    DONE: "bg-green-500/20 text-green-700 dark:text-green-300",
  };

  const isPast = task.dueDate && new Date(task.dueDate) < new Date();
  const validAssignees = task.assignees?.filter((a) => a.user) || [];

  return (
    <Card
      className={cn(
        "p-3 cursor-pointer transition-all duration-150",
        "hover:shadow-md hover:scale-[1.01] active:scale-[0.99]",
        task.isClosed && "opacity-60"
      )}
      onClick={onClick}
    >
      <div className="space-y-2">
        {/* Task Name & Priority */}
        <div className="flex items-start justify-between gap-2">
          <h3
            className={cn(
              "text-sm font-medium flex-1 line-clamp-2",
              task.isClosed && "line-through"
            )}
          >
            {task.name}
          </h3>
          <Badge
            variant="outline"
            className={cn(
              "text-xs flex-shrink-0",
              priorityColors[task.priority as keyof typeof priorityColors]
            )}
          >
            {priorityLabels[task.priority as keyof typeof priorityLabels]}
          </Badge>
        </div>

        {/* Project & Status */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground truncate">
            {task.project.name}
          </span>
          <span className="text-muted-foreground">•</span>
          <Badge
            variant="secondary"
            className={cn("text-xs", statusColors[task.status.type])}
          >
            {task.status.name}
          </Badge>
        </div>

        {/* Due Time & Assignees */}
        <div className="flex items-center justify-between gap-2">
          {/* Due Time */}
          {task.dueDate && (
            <div
              className={cn(
                "flex items-center gap-1 text-xs",
                isPast && !task.isClosed && "text-red-600 dark:text-red-400",
                !isPast && "text-muted-foreground"
              )}
            >
              {isPast && !task.isClosed ? (
                <AlertCircle className="h-3 w-3" />
              ) : (
                <Clock className="h-3 w-3" />
              )}
              <span>{format(new Date(task.dueDate), "HH:mm")}</span>
            </div>
          )}

          {/* Assignees */}
          {validAssignees.length > 0 && (
            <div className="flex items-center gap-1">
              <div className="flex -space-x-2">
                {validAssignees.slice(0, 3).map((assignee) => (
                  <Avatar
                    key={assignee.userId}
                    className="h-6 w-6 border-2 border-background"
                  >
                    <AvatarImage
                      src={
                        assignee.user.profileImageUrl ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${assignee.userId}`
                      }
                      alt={assignee.user.fullName}
                    />
                    <AvatarFallback className="text-[10px]">
                      {assignee.user.fullName?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {validAssignees.length > 3 && (
                  <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                    <span className="text-[10px] font-medium">
                      +{validAssignees.length - 3}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

/**
 * Loading Skeleton
 */
function CalendarPageSkeleton() {
  return (
    <div className="flex flex-col h-full bg-background">
      {/* Calendar Skeleton */}
      <div className="flex-shrink-0 p-4">
        <Card className="p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-8 w-20" />
            </div>
            <div className="grid grid-cols-7 gap-1">
              {[...Array(42)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Task List Skeleton */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="space-y-4">
          <Skeleton className="h-8 w-40" />
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
