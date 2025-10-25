"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pin,
  Folder,
  Calendar,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import { useUIStore } from "@/stores/use-ui-store";
import { useUnpinTask } from "@/hooks/use-tasks";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import type { DashboardTask } from "@/types/dashboard";

interface PinnedTasksWidgetProps {
  pinnedTasks: DashboardTask[];
  isLoading: boolean;
}

export function PinnedTasksWidget({
  pinnedTasks,
  isLoading,
}: PinnedTasksWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (isLoading) {
    return <PinnedTasksSkeleton />;
  }

  // Empty state
  if (!pinnedTasks || pinnedTasks.length === 0) {
    return (
      <Card className="border-amber-200 dark:border-amber-800">
        <CardHeader className="bg-amber-50 dark:bg-amber-900/10 border-b border-amber-200 dark:border-amber-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Pin className="h-5 w-5 text-amber-500 fill-amber-500" />
              <CardTitle>งานที่ปักหมุด</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center text-center space-y-3">
            <Pin className="h-12 w-12 text-muted-foreground" />
            <div>
              <p className="font-medium text-muted-foreground">
                ไม่มีงานที่ปักหมุด
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                ปักหมุดงานสำคัญเพื่อเข้าถึงได้ง่าย
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayTasks = isExpanded ? pinnedTasks : pinnedTasks.slice(0, 5);
  const hasMore = pinnedTasks.length > 5;

  return (
    <Card className="border-amber-200 dark:border-amber-800">
      <CardHeader className="bg-amber-50 dark:bg-amber-900/10 border-b border-amber-200 dark:border-amber-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pin className="h-5 w-5 text-amber-500 fill-amber-500" />
            <CardTitle>งานที่ปักหมุด</CardTitle>
          </div>
          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/30 cursor-default">
            {pinnedTasks.length} งาน
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          <AnimatePresence mode="popLayout">
            {displayTasks.map((task) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <TaskRow task={task} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Expand/Collapse Button */}
        {hasMore && (
          <div className="p-4 flex justify-center border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-sm"
            >
              {isExpanded ? (
                <>
                  ซ่อน
                  <ChevronUp className="h-4 w-4 ml-1" />
                </>
              ) : (
                <>
                  ดูทั้งหมด ({pinnedTasks.length})
                  <ChevronDown className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TaskRow({ task }: { task: DashboardTask }) {
  const [isHovering, setIsHovering] = useState(false);
  const { openTaskPanel } = useUIStore();
  const unpinTask = useUnpinTask();

  const handleRowClick = () => {
    openTaskPanel(task.id);
  };

  const handleUnpin = (e: React.MouseEvent) => {
    e.stopPropagation();
    unpinTask.mutate(task.id);
  };

  const priorityColors = {
    1: "bg-red-500 text-white",
    2: "bg-orange-500 text-white",
    3: "bg-blue-500 text-white",
    4: "bg-gray-500 text-white",
  };

  return (
    <div
      className="py-4 pl-6 pr-4 hover:bg-muted/50 cursor-pointer transition-colors"
      onClick={handleRowClick}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          {/* Line 1: Pin + Priority + Task Name */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleUnpin}
              className="flex-shrink-0 hover:scale-110 transition-transform"
              aria-label="ยกเลิกการปักหมุด"
            >
              {isHovering ? (
                <X className="h-4 w-4 text-red-500" />
              ) : (
                <Pin className="h-4 w-4 fill-amber-500 text-amber-500" />
              )}
            </button>

            <Badge
              className={`${
                priorityColors[task.priority as keyof typeof priorityColors]
              } font-bold`}
            >
              {task.priority}
            </Badge>

            <span className="font-medium flex-1">{task.name}</span>
          </div>

          {/* Line 2: Metadata (Project, Due Date) */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground ml-6">
            {/* Project */}
            <div className="flex items-center gap-1">
              <Folder className="h-3.5 w-3.5" />
              <span>{task.project.name}</span>
            </div>

            {task.dueDate && (
              <>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>
                    {format(new Date(task.dueDate), "d MMM yyyy", { locale: th })}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Assignees at top right */}
        {task.assignees && task.assignees.length > 0 && (
          <div className="flex items-center -space-x-2">
            {task.assignees.slice(0, 3).map((assignee) => {
              const fullName = assignee.user?.fullName || assignee.user?.firstName || "?";
              return (
                <Avatar
                  key={assignee.userId}
                  className="h-7 w-7 border-2 border-background"
                >
                  {assignee.user?.profileImageUrl && (
                    <AvatarImage src={assignee.user.profileImageUrl} alt={fullName} />
                  )}
                  <AvatarFallback className="text-[10px]">
                    {fullName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              );
            })}
            {task.assignees.length > 3 && (
              <div className="h-7 w-7 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                <span className="text-[10px] font-medium">
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

function PinnedTasksSkeleton() {
  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-6 w-32" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-5 w-8" />
                <Skeleton className="h-5 flex-1" />
              </div>
              <div className="flex items-center gap-2 ml-6">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-16" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
