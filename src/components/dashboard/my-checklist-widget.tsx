"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckSquare } from "lucide-react";
import { useUIStore } from "@/stores/use-ui-store";
import { useToggleChecklistItem } from "@/hooks/use-dashboard";
import type { MyChecklistGroup } from "@/types/dashboard";
import { cn } from "@/lib/utils";

interface MyChecklistWidgetProps {
  myChecklists: MyChecklistGroup[];
  isLoading: boolean;
}

export function MyChecklistWidget({
  myChecklists,
  isLoading,
}: MyChecklistWidgetProps) {
  const [showAll, setShowAll] = useState(false);

  // Calculate overall completion across all groups
  let totalItems = 0;
  let completedItems = 0;
  myChecklists.forEach((group) => {
    totalItems += group.items.length;
    completedItems += group.items.filter((item) => item.isChecked).length;
  });

  const completionPercentage =
    totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  if (isLoading) {
    return <MyChecklistSkeleton />;
  }

  // Empty state
  if (myChecklists.length === 0) {
    return (
      <Card>
        <CardHeader className="border-b">
          <CardTitle className="text-lg">Checklist ของฉัน</CardTitle>
        </CardHeader>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center text-center space-y-3">
            <CheckSquare className="h-12 w-12 text-muted-foreground" />
            <div>
              <p className="font-medium text-muted-foreground">
                ยังไม่มี Checklist
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                เพิ่ม Checklist ในงานเพื่อติดตามความคืบหน้า
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayGroups = showAll ? myChecklists : myChecklists.slice(0, 5);
  const hasMore = myChecklists.length > 5;

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="text-lg">Checklist ของฉัน</CardTitle>
          <div className="flex items-center gap-3">
            <Progress value={completionPercentage} className="h-2 w-32" />
            <Badge variant="secondary" className="whitespace-nowrap">
              {completedItems}/{totalItems} สำเร็จ
            </Badge>
          </div>
        </div>
      </CardHeader>

      {/* Checklist Groups by Task */}
      <CardContent className="p-0">
        <div className="max-h-[500px] overflow-y-auto">
          {displayGroups.map((group) => (
            <TaskChecklistGroup key={group.taskId} group={group} />
          ))}
        </div>

        {/* "ดูเพิ่มเติม" Button */}
        {hasMore && !showAll && (
          <div className="p-4 flex justify-center border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAll(true)}
              className="text-sm"
            >
              ดูเพิ่มเติม ({myChecklists.length - 5} งาน)
            </Button>
          </div>
        )}

        {/* "ซ่อน" Button */}
        {showAll && (
          <div className="p-4 flex justify-center border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAll(false)}
              className="text-sm"
            >
              ซ่อน
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Component for each task group with its checklist items
function TaskChecklistGroup({ group }: { group: MyChecklistGroup }) {
  const { openTaskPanel } = useUIStore();
  const toggleChecklistItem = useToggleChecklistItem();

  const completedCount = group.items.filter((item) => item.isChecked).length;
  const totalCount = group.items.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const handleTaskClick = () => {
    openTaskPanel(group.taskId);
  };

  const handleCheckboxChange = (checklistId: string, isChecked: boolean) => {
    toggleChecklistItem.mutate({
      taskId: group.taskId,
      checklistId,
      isChecked: !isChecked,
    });
  };

  return (
    <div className="border-b last:border-b-0">
      {/* Task Header with Progress in same line */}
      <div
        className="px-6 py-3 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={handleTaskClick}
      >
        <div className="flex items-center justify-between gap-4">
          {/* Left: Task name and project */}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">{group.taskName}</h4>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {group.projectName}
            </p>
          </div>
          {/* Right: Progress bar (same line, same length as header) */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <Progress value={progressPercentage} className="h-2 w-32" />
            <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">
              {completedCount}/{totalCount}
            </span>
          </div>
        </div>
      </div>

      {/* Checklist Items */}
      <div className="divide-y">
        {group.items.map((item) => (
          <div
            key={item.id}
            className="px-6 py-3 hover:bg-accent/30 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  handleCheckboxChange(item.id, item.isChecked);
                }}
                className="pt-0.5"
              >
                <Checkbox checked={item.isChecked} className="h-5 w-5" />
              </div>
              <span
                className={cn(
                  "text-sm flex-1",
                  item.isChecked && "line-through text-muted-foreground"
                )}
              >
                {item.name}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MyChecklistSkeleton() {
  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between gap-4">
          <Skeleton className="h-6 w-40" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-2 w-32" />
            <Skeleton className="h-5 w-16" />
          </div>
        </div>
      </CardHeader>

      {/* Task Groups Skeleton */}
      <CardContent className="p-0">
        {[1, 2].map((groupIdx) => (
          <div key={groupIdx} className="border-b last:border-b-0">
            {/* Task Header Skeleton */}
            <div className="px-6 py-3 bg-muted/30">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-2 w-32" />
                  <Skeleton className="h-3 w-10" />
                </div>
              </div>
            </div>
            {/* Checklist Items Skeleton */}
            <div className="divide-y">
              {[1, 2, 3].map((itemIdx) => (
                <div key={itemIdx} className="px-6 py-3">
                  <div className="flex items-start gap-3">
                    <Skeleton className="h-5 w-5 rounded" />
                    <Skeleton className="h-4 flex-1" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
