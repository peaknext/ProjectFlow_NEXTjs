/**
 * Checklist Page (Mobile-First)
 *
 * Dedicated page for viewing and managing all checklist items across tasks.
 * Shows grouped checklists by task with:
 * - Task name and project name
 * - Checkbox to toggle completion
 * - Progress indicator per task
 * - Touch-friendly design
 *
 * Route: /checklist
 */

'use client';

import { useDashboard, useToggleChecklistItem } from '@/hooks/use-dashboard';
import { useUIStore } from '@/stores/use-ui-store';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Loader2, ListChecks, ChevronRight, CheckCircle2, FolderKanban } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SwipeablePages } from '@/components/layout/swipeable-pages';

export default function ChecklistPage() {
  const { data, isLoading } = useDashboard();
  const openTaskPanel = useUIStore((state) => state.openTaskPanel);
  const { mutate: toggleChecklistItem } = useToggleChecklistItem();

  const checklistGroups = data?.myChecklists || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (checklistGroups.length === 0) {
    return (
      <div className="text-center py-12">
        <ListChecks className="h-16 w-16 mx-auto mb-4 opacity-20" />
        <h3 className="text-lg font-medium mb-2">ไม่มีรายการเช็คลิสต์</h3>
        <p className="text-sm text-muted-foreground">
          เมื่อคุณเพิ่มรายการเช็คลิสต์ในงาน มันจะปรากฏที่นี่
        </p>
      </div>
    );
  }

  const handleCheckboxChange = (taskId: string, checklistId: string, currentValue: boolean) => {
    toggleChecklistItem({ taskId, checklistId, isChecked: !currentValue });
  };

  return (
    <SwipeablePages>
      <div className="h-full pb-4">
        {/* Page Header - Hidden on mobile (shown in mobile-top-bar) */}
        <div className="hidden md:block mb-6">
          <h1 className="text-2xl font-bold">เช็คลิสต์</h1>
          <p className="text-muted-foreground">รายการเช็คลิสต์ทั้งหมดของคุณ</p>
        </div>

        {/* Checklist Groups */}
        <div className="space-y-4">
          {checklistGroups.map((group: any) => {
            const completedCount = group.items.filter((item: any) => item.isChecked).length;
            const totalCount = group.items.length;
            const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
            const isComplete = completedCount === totalCount && totalCount > 0;

            return (
              <Card key={group.taskId} className="overflow-hidden">
                {/* Group Header */}
                <div
                  className={cn(
                    'p-4 border-b cursor-pointer transition-colors hover:bg-accent/50',
                    'active:bg-accent'
                  )}
                  onClick={() => openTaskPanel(group.taskId)}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm line-clamp-2 mb-1">
                        {group.taskName}
                      </h3>
                      <div className="flex items-center gap-1">
                        <FolderKanban className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                        <p className="text-xs text-muted-foreground truncate">
                          {group.projectName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isComplete && (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      )}
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="flex items-center gap-2">
                    <Progress value={progressPercentage} className="h-2 flex-1" />
                    <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">
                      {completedCount}/{totalCount}
                    </span>
                  </div>
                </div>

                {/* Checklist Items */}
                <div className="divide-y">
                  {group.items.map((item: any) => (
                    <div
                      key={item.id}
                      className={cn(
                        'flex items-start gap-3 p-4 transition-colors',
                        'hover:bg-accent/30',
                        item.isChecked && 'opacity-60'
                      )}
                    >
                      <Checkbox
                        id={item.id}
                        checked={item.isChecked}
                        onCheckedChange={() =>
                          handleCheckboxChange(group.taskId, item.id, item.isChecked)
                        }
                        className="mt-0.5"
                      />
                      <label
                        htmlFor={item.id}
                        className={cn(
                          'flex-1 text-sm cursor-pointer select-none',
                          item.isChecked && 'line-through text-muted-foreground'
                        )}
                      >
                        {item.name}
                      </label>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Pull to Refresh Hint - Mobile Only */}
        <div className="md:hidden text-center mt-8 mb-4 text-xs text-muted-foreground">
          <p>ดึงลงเพื่อรีเฟรช</p>
          <p className="text-[10px]">(Coming Soon)</p>
        </div>
      </div>
    </SwipeablePages>
  );
}
