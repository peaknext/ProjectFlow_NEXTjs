/**
 * My Tasks Page (Mobile-First)
 *
 * Dedicated page for personal task management on mobile devices.
 * Shows two categories:
 * 1. งานที่ฉันสร้าง (Tasks I Created) - Blue theme
 * 2. งานที่มอบหมายให้ฉัน (Tasks Assigned to Me) - Green theme
 *
 * Features:
 * - Tab switcher for created vs assigned tasks
 * - Task list with inline actions
 * - Pull-to-refresh (Phase 10)
 * - Touch-friendly design (48px tap targets)
 * - Works on both mobile and desktop
 *
 * Route: /my-tasks
 */

'use client';

import { useState } from 'react';
import { useDashboard } from '@/hooks/use-dashboard';
import { useUIStore } from '@/stores/use-ui-store';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, FileText, UserCheck, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export default function MyTasksPage() {
  const [activeTab, setActiveTab] = useState<'created' | 'assigned'>('assigned');
  const { data, isLoading } = useDashboard();
  const openTaskPanel = useUIStore((state) => state.openTaskPanel);

  const createdTasks = data?.myCreatedTasks?.tasks || [];
  const assignedTasks = data?.assignedToMeTasks?.tasks || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const renderTaskList = (tasks: any[], type: 'created' | 'assigned') => {
    if (tasks.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">
            {type === 'created' ? 'คุณยังไม่ได้สร้างงานใดๆ' : 'ไม่มีงานที่มอบหมายให้คุณ'}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {tasks.map((task: any) => {
          const isPinned = task.isPinned;
          const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.isClosed;

          return (
            <Card
              key={task.id}
              className={cn(
                'p-4 cursor-pointer transition-colors hover:bg-accent/50',
                'active:bg-accent', // Mobile tap feedback
                isPinned && 'border-amber-500/50 bg-amber-50/30 dark:bg-amber-950/20'
              )}
              onClick={() => openTaskPanel(task.id)}
            >
              <div className="flex items-start gap-3">
                {/* Task Content */}
                <div className="flex-1 min-w-0">
                  {/* Task Name */}
                  <h3 className="font-medium text-sm line-clamp-2 mb-1">
                    {task.name}
                  </h3>

                  {/* Project Name */}
                  {task.project && (
                    <p className="text-xs text-muted-foreground mb-2">
                      📁 {task.project.name}
                    </p>
                  )}

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

                    {/* Assignees (for created tasks) */}
                    {type === 'created' && task.assignees && task.assignees.length > 0 && (
                      <div className="flex items-center gap-1">
                        <UserCheck className="h-3 w-3" />
                        <span>{task.assignees.length} คน</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Side - Avatar or Chevron */}
                <div className="flex items-center gap-2">
                  {/* Creator Avatar (for assigned tasks) */}
                  {type === 'assigned' && task.creator && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={
                          task.creator.profileImageUrl ||
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${task.creator.id}`
                        }
                        alt={task.creator.fullName}
                      />
                      <AvatarFallback className="text-xs">
                        {task.creator.fullName?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  )}

                  {/* Chevron */}
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="h-full">
      {/* Page Header - Hidden on mobile (shown in mobile-top-bar) */}
      <div className="hidden md:block mb-6">
        <h1 className="text-2xl font-bold">งานของฉัน</h1>
        <p className="text-muted-foreground">งานที่สร้างและงานที่ได้รับมอบหมาย</p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'created' | 'assigned')}>
        <TabsList className="w-full grid grid-cols-2 mb-4">
          <TabsTrigger value="assigned" className="gap-2">
            <UserCheck className="h-4 w-4" />
            <span>งานที่ได้รับ</span>
            <Badge variant="secondary" className="ml-1 text-xs">
              {assignedTasks.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="created" className="gap-2">
            <FileText className="h-4 w-4" />
            <span>งานที่สร้าง</span>
            <Badge variant="secondary" className="ml-1 text-xs">
              {createdTasks.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assigned" className="mt-0">
          {renderTaskList(assignedTasks, 'assigned')}
        </TabsContent>

        <TabsContent value="created" className="mt-0">
          {renderTaskList(createdTasks, 'created')}
        </TabsContent>
      </Tabs>

      {/* Pull to Refresh Hint - Mobile Only */}
      <div className="md:hidden text-center mt-8 mb-4 text-xs text-muted-foreground">
        <p>ดึงลงเพื่อรีเฟรช</p>
        <p className="text-[10px]">(Phase 10 - Coming Soon)</p>
      </div>
    </div>
  );
}
