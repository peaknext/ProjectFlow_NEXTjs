"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AlertCircle, Clock, UserPlus, Zap } from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { useUIStore } from "@/stores/use-ui-store";
import { cn } from "@/lib/utils";
import type { CriticalTasks } from "@/types/division";

interface CriticalTasksSectionProps {
  criticalTasks: CriticalTasks;
}

export function CriticalTasksSection({
  criticalTasks,
}: CriticalTasksSectionProps) {
  const [activeTab, setActiveTab] = useState("overdue");
  const openTaskPanel = useUIStore((state) => state.openTaskPanel);

  // Priority badge colors
  const getPriorityBadge = (priority: number) => {
    const variants = {
      1: { label: "ด่วนมาก", className: "bg-red-500/10 text-red-700 dark:text-red-400" },
      2: { label: "สูง", className: "bg-orange-500/10 text-orange-700 dark:text-orange-400" },
      3: { label: "ปานกลาง", className: "bg-blue-500/10 text-blue-700 dark:text-blue-400" },
      4: { label: "ต่ำ", className: "bg-slate-500/10 text-slate-700 dark:text-slate-400" },
    };

    const variant = variants[priority as keyof typeof variants] || variants[3];

    return (
      <Badge variant="secondary" className={cn(variant.className)}>
        {variant.label}
      </Badge>
    );
  };

  // Task card component
  const TaskCard = ({ task }: { task: any }) => {
    return (
      <Card
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => openTaskPanel(task.id)}
      >
        <CardContent className="pt-4 pb-4">
          <div className="space-y-3">
            {/* Header: Task name + Department badge */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm line-clamp-2">{task.name}</h4>
              </div>
              <Badge
                variant="outline"
                className="flex-shrink-0 text-xs backdrop-blur-sm"
              >
                {task.departmentName}
              </Badge>
            </div>

            {/* Priority and Status */}
            <div className="flex items-center gap-2 flex-wrap">
              {getPriorityBadge(task.priority)}
              {task.status && (
                <Badge
                  variant="outline"
                  style={{
                    borderColor: task.status.color,
                    color: task.status.color,
                  }}
                  className="text-xs"
                >
                  {task.status.name}
                </Badge>
              )}
            </div>

            {/* Due Date */}
            {task.dueDate && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>
                  ครบกำหนด:{" "}
                  {format(new Date(task.dueDate), "d MMM yyyy", {
                    locale: th,
                  })}
                </span>
              </div>
            )}

            {/* Assignees */}
            <div className="flex items-center gap-2">
              {task.assignees && task.assignees.length > 0 ? (
                <TooltipProvider>
                  <div className="flex -space-x-2">
                    {task.assignees.slice(0, 3).map((assignee: any) => (
                      <Tooltip key={assignee.id}>
                        <TooltipTrigger asChild>
                          <Avatar className="h-6 w-6 border-2 border-background">
                            <AvatarImage src={assignee.profileImageUrl || undefined} />
                            <AvatarFallback className="text-[10px]">
                              {assignee.fullName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">{assignee.fullName}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                    {task.assignees.length > 3 && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                            <span className="text-[10px] font-medium text-muted-foreground">
                              +{task.assignees.length - 3}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="space-y-1">
                            {task.assignees.slice(3).map((assignee: any) => (
                              <p key={assignee.id} className="text-xs">
                                {assignee.fullName}
                              </p>
                            ))}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </TooltipProvider>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>ยังไม่มอบหมาย</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Empty state component
  const EmptyState = ({ icon: Icon, message }: { icon: any; message: string }) => {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-3 mb-3">
          <Icon className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>งานวิกฤติที่ต้องให้ความสนใจ</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overdue" className="gap-1.5">
              <AlertCircle className="h-4 w-4" />
              <span className="hidden sm:inline">เกินกำหนด</span>
              {criticalTasks.overdue.length > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1 bg-red-500/10 text-red-700 dark:text-red-400 h-5 min-w-[20px] px-1"
                >
                  {criticalTasks.overdue.length}
                </Badge>
              )}
            </TabsTrigger>

            <TabsTrigger value="urgent" className="gap-1.5">
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">ด่วนมาก</span>
              {criticalTasks.urgent.length > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1 bg-red-500/10 text-red-700 dark:text-red-400 h-5 min-w-[20px] px-1"
                >
                  {criticalTasks.urgent.length}
                </Badge>
              )}
            </TabsTrigger>

            <TabsTrigger value="dueSoon" className="gap-1.5">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">ใกล้ครบกำหนด</span>
              {criticalTasks.dueSoon.length > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1 bg-orange-500/10 text-orange-700 dark:text-orange-400 h-5 min-w-[20px] px-1"
                >
                  {criticalTasks.dueSoon.length}
                </Badge>
              )}
            </TabsTrigger>

            <TabsTrigger value="unassigned" className="gap-1.5">
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">ยังไม่มอบหมาย</span>
              {criticalTasks.unassigned.length > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1 bg-slate-500/10 text-slate-700 dark:text-slate-400 h-5 min-w-[20px] px-1"
                >
                  {criticalTasks.unassigned.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Overdue Tasks */}
          <TabsContent value="overdue" className="mt-4">
            {criticalTasks.overdue.length > 0 ? (
              <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {criticalTasks.overdue.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={AlertCircle}
                message="ไม่มีงานที่เกินกำหนด"
              />
            )}
          </TabsContent>

          {/* Urgent Tasks */}
          <TabsContent value="urgent" className="mt-4">
            {criticalTasks.urgent.length > 0 ? (
              <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {criticalTasks.urgent.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Zap}
                message="ไม่มีงานด่วนมาก"
              />
            )}
          </TabsContent>

          {/* Due Soon Tasks */}
          <TabsContent value="dueSoon" className="mt-4">
            {criticalTasks.dueSoon.length > 0 ? (
              <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {criticalTasks.dueSoon.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Clock}
                message="ไม่มีงานที่ใกล้ครบกำหนด"
              />
            )}
          </TabsContent>

          {/* Unassigned Tasks */}
          <TabsContent value="unassigned" className="mt-4">
            {criticalTasks.unassigned.length > 0 ? (
              <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {criticalTasks.unassigned.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={UserPlus}
                message="ไม่มีงานที่ยังไม่ได้มอบหมาย"
              />
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
