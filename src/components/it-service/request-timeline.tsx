"use client";

import { useState, useEffect } from "react";
import { format, differenceInMinutes, differenceInHours, differenceInDays } from "date-fns";
import { th } from "date-fns/locale";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  FileText,
  MessageSquare,
  Briefcase,
  User,
  RefreshCw,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useRequestTimeline } from "@/hooks/use-service-requests";
import { VerticalTaskTimeline } from "./vertical-task-timeline";
import type { RequestStatus } from "@/generated/prisma";

interface RequestTimelineProps {
  requestId: string;
  createdAt: string | Date;
  status: RequestStatus;
  completedAt?: string | Date | null;
  task?: {
    id: string;
    name: string;
    status?: {
      id: string;
      name: string;
      type: string;
    };
    assignees?: {
      user: {
        id: string;
        titlePrefix?: string | null;
        firstName: string;
        lastName: string;
        profileImageUrl?: string | null;
      };
    }[];
    project?: {
      id: string;
      name: string;
      statuses: {
        id: string;
        name: string;
        order: number;
      }[];
    };
  } | null;
}

/**
 * Request Timeline Component
 *
 * Features:
 * - Chronological timeline of request events
 * - Icons for different action types
 * - User avatars and names
 * - Timestamps in Thai format
 * - Auto-refresh every minute
 * - Show task assignees and status for TASK_CREATED and TASK_STATUS_CHANGED events
 * - Display elapsed time from creation to now (or completion)
 *
 * Action Types:
 * - CREATED: Request was created
 * - VIEWED: Approver viewed the request
 * - COMMENTED: Someone added a comment
 * - APPROVED: Request was approved
 * - REJECTED: Request was rejected
 * - TASK_CREATED: Task was created from request (shows assignees and status)
 * - TASK_STATUS_CHANGED: Task status was updated (shows assignees and status)
 * - CANCELLED: Request was cancelled
 * - COMPLETED: Request was completed
 */
export function RequestTimeline({ requestId, createdAt, status, completedAt, task }: RequestTimelineProps) {
  const { data: timeline, isLoading } = useRequestTimeline(requestId);
  const [elapsedTime, setElapsedTime] = useState("");

  // Calculate elapsed time
  useEffect(() => {
    const calculateElapsedTime = () => {
      const startDate = new Date(createdAt);

      // Determine end date: use completedAt if request is closed, otherwise use current time
      const isClosed = ["COMPLETED", "CANCELLED", "REJECTED"].includes(status);
      const endDate = isClosed && completedAt ? new Date(completedAt) : new Date();

      // Calculate differences
      const totalMinutes = differenceInMinutes(endDate, startDate);
      const days = Math.floor(totalMinutes / (24 * 60));
      const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
      const minutes = totalMinutes % 60;

      // Format text
      let text = "ระยะเวลาในการดำเนินงาน ";
      if (days > 0) {
        text += `${days} วัน `;
      }
      if (hours > 0 || days > 0) {
        text += `${hours} ชั่วโมง `;
      }
      text += `${minutes} นาที`;

      setElapsedTime(text);
    };

    // Calculate immediately
    calculateElapsedTime();

    // If request is not closed, update every minute
    const isClosed = ["COMPLETED", "CANCELLED", "REJECTED"].includes(status);
    if (!isClosed) {
      const interval = setInterval(calculateElapsedTime, 60000); // Update every 1 minute
      return () => clearInterval(interval);
    }
  }, [createdAt, status, completedAt]);

  // Find the latest task-related timeline item (TASK_CREATED, TASK_STATUS_CHANGED, or TASK_ASSIGNEES_CHANGED)
  // Use slice().reverse() to find from the end (latest item first)
  const latestTaskTimelineId = timeline
    ?.slice()
    .reverse()
    .find(
      (item) =>
        item.action === "TASK_CREATED" ||
        item.action === "TASK_STATUS_CHANGED" ||
        item.action === "TASK_ASSIGNEES_CHANGED"
    )?.id;

  // Get icon for action type
  const getActionIcon = (action: string) => {
    switch (action) {
      case "CREATED":
        return <FileText className="h-4 w-4" />;
      case "VIEWED":
        return <Eye className="h-4 w-4" />;
      case "COMMENTED":
        return <MessageSquare className="h-4 w-4" />;
      case "APPROVED":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "REJECTED":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "TASK_CREATED":
        return <Briefcase className="h-4 w-4 text-blue-600" />;
      case "TASK_STATUS_CHANGED":
        return <RefreshCw className="h-4 w-4 text-blue-600" />;
      case "TASK_ASSIGNEES_CHANGED":
        return <User className="h-4 w-4 text-blue-600" />;
      case "CANCELLED":
        return <XCircle className="h-4 w-4 text-gray-600" />;
      case "COMPLETED":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  // Get color for timeline dot
  const getDotColor = (action: string) => {
    switch (action) {
      case "CREATED":
        return "bg-blue-500";
      case "VIEWED":
        return "bg-gray-400";
      case "COMMENTED":
        return "bg-purple-500";
      case "APPROVED":
        return "bg-green-500";
      case "REJECTED":
        return "bg-red-500";
      case "TASK_CREATED":
        return "bg-blue-600";
      case "TASK_STATUS_CHANGED":
        return "bg-blue-600";
      case "TASK_ASSIGNEES_CHANGED":
        return "bg-blue-600";
      case "CANCELLED":
        return "bg-gray-500";
      case "COMPLETED":
        return "bg-green-600";
      default:
        return "bg-gray-400";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>ประว ัติการดำเนินการ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-4">
            กำลังโหลด...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!timeline || timeline.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>ประวัติการดำเนินการ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-4">
            ไม่มีประวัติ
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>ประวัติการดำเนินการ</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-0">
          {timeline.map((item, index) => (
            <div key={item.id}>
              <div className="flex gap-4">
                {/* Timeline dot and line */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full ${getDotColor(
                      item.action
                    )} flex items-center justify-center text-white flex-shrink-0`}
                  >
                    {getActionIcon(item.action)}
                  </div>
                  {index < timeline.length - 1 && (
                    <div className="w-0.5 h-full bg-border min-h-[60px] mt-2" />
                  )}
                </div>

                {/* Timeline content */}
                <div className="flex-1 pb-8">
                  <div className="space-y-1">
                    {/* User and action */}
                    <div className="flex items-start gap-2">
                      {item.userName && (
                        <Avatar className="h-6 w-6">
                          {item.user?.profileImageUrl && (
                            <AvatarImage
                              src={item.user.profileImageUrl}
                              alt={item.userName}
                            />
                          )}
                          <AvatarFallback className="text-xs">
                            {item.userName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {item.userName && (
                            <span className="font-semibold text-sm">
                              {item.userName}
                            </span>
                          )}
                          <span className="text-sm text-muted-foreground">
                            {item.description}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {format(
                            new Date(item.createdAt),
                            "d MMMM yyyy 'เวลา' HH:mm 'น.'",
                            { locale: th }
                          )}
                        </div>

                        {/* Task Details - Show only for the latest TASK_CREATED or TASK_STATUS_CHANGED action */}
                        {item.id === latestTaskTimelineId && task && (
                          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-md border border-blue-200 dark:border-blue-800 flex gap-3">
                            {/* Left side - Task Status + Assignees */}
                            <div className="flex-1 space-y-2">
                              {/* Task Status */}
                              {task.status && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-muted-foreground">สถานะงาน:</span>
                                  <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                                    {task.status.name}
                                  </span>
                                </div>
                              )}

                              {/* Task Assignees */}
                              {task.assignees && task.assignees.length > 0 && (
                                <div className="space-y-1.5">
                                  <span className="text-xs font-medium text-muted-foreground">มอบหมายให้:</span>
                                  <div className="flex flex-wrap gap-2">
                                    {task.assignees.map((assignee) => (
                                      <div
                                        key={assignee.user.id}
                                        className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-2 py-1 rounded-md border border-blue-200 dark:border-blue-800"
                                      >
                                        <Avatar className="h-5 w-5">
                                          {assignee.user.profileImageUrl && (
                                            <AvatarImage src={assignee.user.profileImageUrl} />
                                          )}
                                          <AvatarFallback className="text-xs">
                                            {assignee.user.firstName.charAt(0)}
                                          </AvatarFallback>
                                        </Avatar>
                                        <span className="text-xs font-medium">
                                          {`${assignee.user.titlePrefix || ''}${assignee.user.firstName} ${assignee.user.lastName}`}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Right side - Vertical Timeline */}
                            {task.status && task.project?.statuses && task.project.statuses.length > 0 && (
                              <div className="flex-shrink-0 pt-1">
                                <VerticalTaskTimeline
                                  statuses={task.project.statuses}
                                  currentStatusId={task.status.id}
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>

      {/* Elapsed Time Footer */}
      {elapsedTime && (
        <CardFooter className="border-t pt-4 justify-center">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>{elapsedTime}</span>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
