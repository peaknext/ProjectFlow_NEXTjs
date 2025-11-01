"use client";

import { format } from "date-fns";
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
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useRequestTimeline } from "@/hooks/use-service-requests";

interface RequestTimelineProps {
  requestId: string;
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
 * - Show task assignees and status for TASK_CREATED events
 *
 * Action Types:
 * - CREATED: Request was created
 * - VIEWED: Approver viewed the request
 * - COMMENTED: Someone added a comment
 * - APPROVED: Request was approved
 * - REJECTED: Request was rejected
 * - TASK_CREATED: Task was created from request (shows assignees and status)
 * - CANCELLED: Request was cancelled
 * - COMPLETED: Request was completed
 */
export function RequestTimeline({ requestId, task }: RequestTimelineProps) {
  const { data: timeline, isLoading } = useRequestTimeline(requestId);

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

                        {/* Task Details - Show for TASK_CREATED action */}
                        {item.action === "TASK_CREATED" && task && (
                          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-md border border-blue-200 dark:border-blue-800 space-y-2">
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
    </Card>
  );
}
