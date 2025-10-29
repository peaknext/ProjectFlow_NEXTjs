/**
 * Project Mobile View Page
 *
 * Mobile-optimized view for viewing all tasks in a project.
 * Shows task list with:
 * - Task cards similar to My Tasks page
 * - Priority and due date indicators
 * - Assignee avatars
 * - Status badges
 * - Touch-friendly design
 *
 * Route: /projects/[projectId]/mobile
 */

'use client';

import { use } from 'react';
import { useProject } from '@/hooks/use-projects';
import { useUIStore } from '@/stores/use-ui-store';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, ChevronRight, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface PageProps {
  params: Promise<{ projectId: string }>;
}

export default function ProjectMobilePage({ params }: PageProps) {
  const { projectId } = use(params);
  const { data, isLoading } = useProject(projectId);
  const openTaskPanel = useUIStore((state) => state.openTaskPanel);

  const project = data?.project;
  const tasks = data?.tasks || [];
  const statuses = data?.statuses || [];

  // Filter out closed tasks and sort by pinned status (pinned first)
  const openTasks = tasks
    .filter((task: any) => !task.isClosed)
    .sort((a: any, b: any) => {
      // 1. Pinned tasks first
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      // 2. Then by priority (1 = highest, 4 = lowest)
      if (a.priority !== b.priority) return (a.priority || 4) - (b.priority || 4);

      // 3. Then by due date (earliest first)
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (a.dueDate) return -1; // Tasks with due date before tasks without
      if (b.dueDate) return 1;

      // 4. Finally by creation date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <FileText className="h-16 w-16 mx-auto mb-4 opacity-20" />
        <h3 className="text-lg font-medium mb-2">ไม่พบโปรเจกต์</h3>
        <p className="text-sm text-muted-foreground">
          โปรเจกต์นี้อาจถูกลบหรือคุณไม่มีสิทธิ์เข้าถึง
        </p>
      </div>
    );
  }

  const getStatusColor = (statusId: string) => {
    const status = statuses.find((s: any) => s.id === statusId);
    return status?.color || '#94a3b8';
  };

  const getStatusName = (statusId: string) => {
    const status = statuses.find((s: any) => s.id === statusId);
    return status?.name || 'ไม่ระบุ';
  };

  return (
    <div className="h-full pb-4">
      {/* Page Header - Hidden on mobile (shown in mobile-top-bar) */}
      <div className="hidden md:block mb-6">
        <h1 className="text-2xl font-bold">{project.name}</h1>
        {project.description && (
          <p className="text-muted-foreground">{project.description}</p>
        )}
      </div>

      {/* Project Info Card - Mobile Only */}
      <Card className="p-4 mb-4 md:hidden">
        <h2 className="font-semibold text-lg mb-1">{project.name}</h2>
        {project.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {project.description}
          </p>
        )}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <FileText className="h-4 w-4" />
          <span>{openTasks.length} งาน</span>
        </div>
      </Card>

      {/* Tasks List */}
      {openTasks.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">ไม่มีงานในโปรเจกต์นี้</p>
        </div>
      ) : (
        <div className="space-y-2">
          {openTasks.map((task: any) => {
            const isPinned = task.isPinned;
            const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
            const statusColor = getStatusColor(task.statusId);
            const statusName = getStatusName(task.statusId);
            // Filter out assignees without user (deleted users)
            const validAssignees = task.assignees?.filter((a: any) => a.user) || [];

            return (
              <Card
                key={task.id}
                className={cn(
                  'p-4 cursor-pointer transition-colors hover:bg-accent/50',
                  'active:bg-accent',
                  isPinned && 'border-amber-500/50 bg-amber-50/30 dark:bg-amber-950/20'
                )}
                onClick={() => openTaskPanel(task.id)}
              >
                <div className="flex items-start gap-3">
                  {/* Task Content */}
                  <div className="flex-1 min-w-0">
                    {/* Task Name */}
                    <h3 className="font-medium text-sm line-clamp-2 mb-2">
                      {task.name}
                    </h3>

                    {/* Status Badge */}
                    <div className="mb-2">
                      <Badge
                        variant="outline"
                        className="text-[10px] px-2 py-0.5"
                        style={{
                          borderColor: statusColor,
                          color: statusColor,
                        }}
                      >
                        {statusName}
                      </Badge>
                    </div>

                    {/* Metadata Row */}
                    <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                      {/* Priority */}
                      {task.priority === 1 && (
                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                          ด่วนมาก
                        </Badge>
                      )}
                      {task.priority === 2 && (
                        <Badge variant="default" className="text-[10px] px-1.5 py-0">
                          ด่วน
                        </Badge>
                      )}

                      {/* Due Date */}
                      {task.dueDate && (
                        <span className={cn(isOverdue && 'text-destructive font-medium')}>
                          {isOverdue && '⚠️ '}
                          {formatDistanceToNow(new Date(task.dueDate), {
                            addSuffix: true,
                            locale: th,
                          })}
                        </span>
                      )}

                      {/* Assignees Count */}
                      {validAssignees.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>{validAssignees.length} คน</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Side - Assignee Avatars + Chevron */}
                  <div className="flex items-center gap-2">
                    {/* Assignee Avatars (max 3) */}
                    {validAssignees.length > 0 && (
                      <div className="flex -space-x-2">
                        {validAssignees.slice(0, 3).map((assignee: any) => (
                          <Avatar
                            key={assignee.userId}
                            className="h-8 w-8 border-2 border-background"
                          >
                            <AvatarImage
                              src={
                                assignee.user.profileImageUrl ||
                                `https://api.dicebear.com/7.x/avataaars/svg?seed=${assignee.userId}`
                              }
                              alt={assignee.user.fullName}
                            />
                            <AvatarFallback className="text-xs">
                              {assignee.user.fullName?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {validAssignees.length > 3 && (
                          <div className="h-8 w-8 rounded-full border-2 border-background bg-muted flex items-center justify-center">
                            <span className="text-[10px] font-medium">
                              +{validAssignees.length - 3}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Chevron */}
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pull to Refresh Hint - Mobile Only */}
      <div className="md:hidden text-center mt-8 mb-4 text-xs text-muted-foreground">
        <p>ดึงลงเพื่อรีเฟรช</p>
        <p className="text-[10px]">(Coming Soon)</p>
      </div>
    </div>
  );
}
