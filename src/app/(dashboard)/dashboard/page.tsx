"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreateTaskButton } from "@/components/common/create-task-button";
import { RefreshCw } from "lucide-react";
import { DashboardStatsCards } from "@/components/dashboard/dashboard-stats-cards";
import { OverdueTasksAlert } from "@/components/dashboard/overdue-tasks-alert";
import { PinnedTasksWidget } from "@/components/dashboard/pinned-tasks-widget";
import { MyTasksWidget } from "@/components/dashboard/my-tasks-widget";
import { DashboardCalendarWidget } from "@/components/dashboard/dashboard-calendar-widget";
import { RecentActivitiesWidget } from "@/components/dashboard/recent-activities-widget";
import { MyChecklistWidget } from "@/components/dashboard/my-checklist-widget";
import { useDashboard, useRefreshDashboard, useLoadMoreTasks } from "@/hooks/use-dashboard";
import { useUIStore } from "@/stores/use-ui-store";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  // State for pagination
  const [currentOffset, setCurrentOffset] = useState(0);

  // Fetch dashboard data
  const { data, isLoading, refetch } = useDashboard();
  const refresh = useRefreshDashboard();
  const loadMoreMutation = useLoadMoreTasks();
  const { openCreateTaskModal } = useUIStore();

  // Handle refresh
  const handleRefresh = () => {
    refresh();
    refetch();
    setCurrentOffset(0); // Reset offset on refresh
  };

  // Handle create task
  const handleCreateTask = () => {
    // Open CreateTaskModal with all accessible projects
    openCreateTaskModal();
  };

  // Handle load more tasks
  const handleLoadMore = () => {
    if (loadMoreMutation.isPending) return;
    loadMoreMutation.mutate(currentOffset, {
      onSuccess: ({ newOffset }) => {
        setCurrentOffset(newOffset);
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">แดชบอร์ด</h1>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="default"
            onClick={handleRefresh}
            disabled={isLoading}
            className="h-10 px-4 hover:bg-gray-800 hover:text-white dark:hover:bg-gray-100 dark:hover:text-gray-900 transition-colors"
          >
            <RefreshCw
              className={cn(
                "h-5 w-5 mr-2",
                isLoading && "animate-spin"
              )}
            />
            รีเฟรช
          </Button>
          <CreateTaskButton onClick={handleCreateTask} />
        </div>
      </div>

      {/* Stats Cards - 4 columns with real data */}
      <DashboardStatsCards
        stats={
          data?.stats || {
            totalTasks: 0,
            completedTasks: 0,
            overdueTasks: 0,
            thisWeekTasks: 0,
          }
        }
        isLoading={isLoading}
      />

      {/* Main Grid Layout - 3 columns (2:1 ratio) */}
      <div className="grid grid-cols-3 gap-8">
        {/* Left Column (2/3 width) */}
        <div className="col-span-2 space-y-8">
          {/* Overdue Tasks Alert */}
          <OverdueTasksAlert
            overdueTasks={data?.overdueTasks || []}
            isLoading={isLoading}
          />

          {/* Pinned Tasks Widget */}
          <PinnedTasksWidget
            pinnedTasks={data?.pinnedTasks || []}
            isLoading={isLoading}
          />

          {/* My Tasks Widget */}
          <MyTasksWidget
            myTasks={
              data?.myTasks || { tasks: [], total: 0, hasMore: false }
            }
            isLoading={isLoading}
            onLoadMore={handleLoadMore}
            isLoadingMore={loadMoreMutation.isPending}
          />
        </div>

        {/* Right Column (1/3 width) */}
        <div className="space-y-6">
          {/* Dashboard Calendar Widget */}
          <DashboardCalendarWidget
            calendarTasks={data?.calendarTasks || []}
            isLoading={isLoading}
          />

          {/* Recent Activities Widget */}
          <RecentActivitiesWidget />

          {/* My Checklist Widget */}
          <MyChecklistWidget
            myChecklists={data?.myChecklists || []}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
