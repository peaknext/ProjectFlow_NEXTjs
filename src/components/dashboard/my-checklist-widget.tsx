"use client";

import { useState, useMemo } from "react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CheckSquare } from "lucide-react";
import { useUIStore } from "@/stores/use-ui-store";
import { useToggleChecklistItem } from "@/hooks/use-dashboard";
import type { MyChecklistGroup } from "@/types/dashboard";
import { cn } from "@/lib/utils";

interface MyChecklistWidgetProps {
  myChecklists: MyChecklistGroup[];
  isLoading: boolean;
}

interface FlattenedChecklistItem {
  id: string;
  name: string;
  isChecked: boolean;
  taskId: string;
  taskName: string;
  projectName: string;
}

export function MyChecklistWidget({
  myChecklists,
  isLoading,
}: MyChecklistWidgetProps) {
  const [showAll, setShowAll] = useState(false);

  // Flatten all checklist items from all groups
  const allItems = useMemo(() => {
    const flattened: FlattenedChecklistItem[] = [];
    myChecklists.forEach((group) => {
      group.items.forEach((item) => {
        flattened.push({
          ...item,
          taskId: group.taskId,
          taskName: group.taskName,
          projectName: group.projectName,
        });
      });
    });
    return flattened;
  }, [myChecklists]);

  // Calculate overall completion
  const totalItems = allItems.length;
  const completedItems = allItems.filter((item) => item.isChecked).length;
  const completionPercentage =
    totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  if (isLoading) {
    return <MyChecklistSkeleton />;
  }

  // Empty state
  if (totalItems === 0) {
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

  const displayItems = showAll ? allItems : allItems.slice(0, 10);
  const hasMore = totalItems > 10;

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

      {/* Checklist Items */}
      <CardContent className="p-0">
        <div className="divide-y max-h-[500px] overflow-y-auto">
          {displayItems.map((item) => (
            <ChecklistItemRow key={item.id} item={item} />
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
              ดูเพิ่มเติม ({totalItems - 10} รายการ)
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

function ChecklistItemRow({ item }: { item: FlattenedChecklistItem }) {
  const { openTaskPanel } = useUIStore();
  const toggleChecklistItem = useToggleChecklistItem();

  const handleCheckboxChange = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleChecklistItem.mutate({
      taskId: item.taskId,
      checklistId: item.id,
      isChecked: !item.isChecked,
    });
  };

  const handleTaskClick = () => {
    openTaskPanel(item.taskId);
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="p-4 cursor-pointer" onClick={handleTaskClick}>
            {/* Checkbox + Item Name */}
            <div className="flex items-start gap-3">
              <div onClick={handleCheckboxChange} className="pt-0.5">
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
        </TooltipTrigger>
        <TooltipContent>
          <p>{item.taskName}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function MyChecklistSkeleton() {
  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-6 w-20" />
        </div>
      </CardHeader>

      {/* Progress Bar Skeleton */}
      <CardContent className="pt-4 pb-3 border-b">
        <div className="space-y-2">
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-3 w-12 ml-auto" />
        </div>
      </CardContent>

      {/* Checklist Items Skeleton */}
      <CardContent className="p-0">
        <div className="divide-y">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4 space-y-1">
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-4 flex-1" />
              </div>
              <Skeleton className="h-3 w-32 ml-8" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
