"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { ClipboardList, Folder, Calendar, Plus, Loader2 } from "lucide-react";
import { useUIStore } from "@/stores/use-ui-store";
import { useCompleteTask } from "@/hooks/use-tasks";
import { format, isPast } from "date-fns";
import { th } from "date-fns/locale";
import type { MyTasksData, DashboardTask } from "@/types/dashboard";
import { cn } from "@/lib/utils";

interface MyTasksWidgetProps {
  myTasks: MyTasksData;
  isLoading: boolean;
  onLoadMore: () => void;
  isLoadingMore?: boolean;
}

type FilterType = "all" | "in_progress" | "not_started" | "done";

export function MyTasksWidget({
  myTasks,
  isLoading,
  onLoadMore,
  isLoadingMore = false,
}: MyTasksWidgetProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [hideClosedTasks, setHideClosedTasks] = useState(() => {
    // Load from localStorage on mount
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("dashboard.myTasks.hideClosedTasks");
      return saved === "true";
    }
    return false;
  });
  const { openCreateTaskModal } = useUIStore();

  // Save to localStorage when hideClosedTasks changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "dashboard.myTasks.hideClosedTasks",
        String(hideClosedTasks)
      );
    }
  }, [hideClosedTasks]);

  if (isLoading) {
    return <MyTasksSkeleton />;
  }

  // Client-side filtering
  const filteredTasks = myTasks.tasks.filter((task) => {
    // Filter by status
    let matchesFilter = true;
    if (activeFilter === "all") matchesFilter = true;
    else if (activeFilter === "in_progress")
      matchesFilter = task.status.type === "IN_PROGRESS";
    else if (activeFilter === "not_started")
      matchesFilter = task.status.type === "NOT_STARTED";
    else if (activeFilter === "done")
      matchesFilter = task.status.type === "DONE" || task.isClosed;

    // Filter by closed status
    const isClosedTask = task.isClosed || task.status.type === "DONE";
    if (hideClosedTasks && isClosedTask) return false;

    return matchesFilter;
  });

  // Empty state
  if (filteredTasks.length === 0) {
    return (
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between gap-4">
            <CardTitle>งานของฉัน</CardTitle>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 mr-2">
                <label
                  htmlFor="hide-closed-tasks"
                  className="text-sm text-muted-foreground cursor-pointer"
                >
                  ซ่อนงานที่ปิดแล้ว
                </label>
                <Switch
                  id="hide-closed-tasks"
                  checked={hideClosedTasks}
                  onCheckedChange={setHideClosedTasks}
                />
              </div>
              <FilterTab
                label="ทั้งหมด"
                isActive={activeFilter === "all"}
                onClick={() => setActiveFilter("all")}
              />
              <FilterTab
                label="กำลังทำ"
                isActive={activeFilter === "in_progress"}
                onClick={() => setActiveFilter("in_progress")}
              />
              <FilterTab
                label="รอดำเนินการ"
                isActive={activeFilter === "not_started"}
                onClick={() => setActiveFilter("not_started")}
              />
              <FilterTab
                label="เสร็จแล้ว"
                isActive={activeFilter === "done"}
                onClick={() => setActiveFilter("done")}
              />
              <Badge variant="secondary">{myTasks.total} งาน</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Empty State */}
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
            <ClipboardList className="h-12 w-12 text-muted-foreground" />
            <div>
              <p className="font-medium text-muted-foreground">
                ไม่มีงานที่มอบหมาย
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                สร้างงานใหม่เพื่อเริ่มต้น
              </p>
            </div>
            <Button onClick={openCreateTaskModal} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              สร้างงาน
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between gap-4">
          <CardTitle>งานของฉัน</CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 mr-2">
              <label
                htmlFor="hide-closed-tasks"
                className="text-sm text-muted-foreground cursor-pointer"
              >
                ซ่อนงานที่ปิดแล้ว
              </label>
              <Switch
                id="hide-closed-tasks"
                checked={hideClosedTasks}
                onCheckedChange={setHideClosedTasks}
              />
            </div>
            <FilterTab
              label="ทั้งหมด"
              isActive={activeFilter === "all"}
              onClick={() => setActiveFilter("all")}
            />
            <FilterTab
              label="กำลังทำ"
              isActive={activeFilter === "in_progress"}
              onClick={() => setActiveFilter("in_progress")}
            />
            <FilterTab
              label="รอดำเนินการ"
              isActive={activeFilter === "not_started"}
              onClick={() => setActiveFilter("not_started")}
            />
            <FilterTab
              label="เสร็จแล้ว"
              isActive={activeFilter === "done"}
              onClick={() => setActiveFilter("done")}
            />
            <Badge variant="secondary">{filteredTasks.length} งาน</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Task List */}
        <div className="divide-y max-h-[600px] overflow-y-auto">
          {filteredTasks.map((task) => (
            <TaskRow key={task.id} task={task} />
          ))}

          {/* Load More Section */}
          {myTasks.hasMore && (
            <div className="p-4 border-t bg-muted/20">
              <Button
                variant="outline"
                onClick={onLoadMore}
                disabled={isLoadingMore}
                className="w-full"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    กำลังโหลด...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    โหลดงานเพิ่ม
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function FilterTab({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      variant={isActive ? "default" : "ghost"}
      size="sm"
      onClick={onClick}
      className="text-xs"
    >
      {label}
    </Button>
  );
}

function TaskRow({ task }: { task: DashboardTask }) {
  const { openTaskPanel } = useUIStore();
  const completeTask = useCompleteTask();
  const isCompleted = task.isClosed || task.status.type === "DONE";
  const isOverdue =
    task.dueDate && isPast(new Date(task.dueDate)) && !isCompleted;

  const handleRowClick = () => {
    openTaskPanel(task.id);
  };

  const handleCheckboxChange = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isCompleted) {
      completeTask.mutate(task.id);
    }
  };

  return (
    <div
      className="relative py-4 pl-6 pr-4 hover:bg-muted/50 cursor-pointer transition-colors"
      onClick={handleRowClick}
    >
      {/* Department Badge (top right) */}
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

      {/* Line 1: Checkbox + Task Name */}
      <div className="flex items-start gap-3 mb-2">
        <div onClick={handleCheckboxChange} className="pt-0.5">
          <Checkbox checked={isCompleted} className="h-5 w-5" />
        </div>
        <span
          className={cn(
            "font-medium flex-1",
            isCompleted && "line-through text-muted-foreground"
          )}
        >
          {task.name}
        </span>
      </div>

      {/* Line 2: Metadata (Project + Due Date) */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground ml-8">
        {/* Project */}
        <div className="flex items-center gap-1">
          <Folder className="h-3.5 w-3.5" />
          <span>{task.project.name}</span>
        </div>

        {task.dueDate && (
          <>
            <span>•</span>
            <div
              className={cn(
                "flex items-center gap-1",
                isOverdue && "text-red-600 dark:text-red-400 font-medium"
              )}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>
                {format(new Date(task.dueDate), "d MMM yyyy", { locale: th })}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function MyTasksSkeleton() {
  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-6 w-16" />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Filter Tabs Skeleton */}
        <div className="flex items-center gap-2 p-4 border-b">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-8 w-20" />
          ))}
        </div>

        {/* Task Rows Skeleton */}
        <div className="divide-y">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4 space-y-2">
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-5 flex-1" />
              </div>
              <div className="flex items-center gap-2 ml-8">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
