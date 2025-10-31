"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CreateTaskButton } from "@/components/common/create-task-button";
import { RefreshCw, Loader2 } from "lucide-react";
import { DashboardStatsCards } from "@/components/dashboard/dashboard-stats-cards";
import { OverdueTasksAlert } from "@/components/dashboard/overdue-tasks-alert";
import { PinnedTasksWidget } from "@/components/dashboard/pinned-tasks-widget";
import { MyCreatedTasksWidget } from "@/components/dashboard/my-created-tasks-widget";
import { MyTasksWidget } from "@/components/dashboard/my-tasks-widget";
import { DashboardCalendarWidget } from "@/components/dashboard/dashboard-calendar-widget";
import { RecentActivitiesWidget } from "@/components/dashboard/recent-activities-widget";
import { MyChecklistWidget } from "@/components/dashboard/my-checklist-widget";
import { useDashboard, useRefreshDashboard } from "@/hooks/use-dashboard";
import { useIsMobile } from "@/hooks/use-media-query";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import type { DashboardTask, MyTasksData } from "@/types/dashboard";

export default function DashboardPage() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  // Pagination state for each widget
  const [myCreatedTasksOffset, setMyCreatedTasksOffset] = useState(0);
  const [assignedToMeTasksOffset, setAssignedToMeTasksOffset] = useState(0);
  const [isLoadingMoreCreated, setIsLoadingMoreCreated] = useState(false);
  const [isLoadingMoreAssigned, setIsLoadingMoreAssigned] = useState(false);

  // Accumulated tasks state
  const [accumulatedCreatedTasks, setAccumulatedCreatedTasks] = useState<DashboardTask[]>([]);
  const [accumulatedAssignedTasks, setAccumulatedAssignedTasks] = useState<DashboardTask[]>([]);

  // Fetch dashboard data with pagination options
  const { data, isLoading, refetch } = useDashboard({
    myCreatedTasksLimit: 10,
    myCreatedTasksOffset,
    assignedToMeTasksLimit: 10,
    assignedToMeTasksOffset,
  });
  const refresh = useRefreshDashboard();

  // ✅ IMPORTANT: ALL useEffect hooks MUST be called before any early return!

  // Update accumulated tasks when data changes
  useEffect(() => {
    if (data?.myCreatedTasks?.tasks) {
      if (myCreatedTasksOffset === 0) {
        // Initial load - replace
        setAccumulatedCreatedTasks(data.myCreatedTasks.tasks);
      } else {
        // Load more - append (filter out duplicates)
        setAccumulatedCreatedTasks((prev) => [
          ...prev,
          ...data.myCreatedTasks.tasks.filter(
            (newTask) => !prev.some((existingTask) => existingTask.id === newTask.id)
          ),
        ]);
      }
      setIsLoadingMoreCreated(false);
    }
  }, [data?.myCreatedTasks?.tasks, myCreatedTasksOffset]);

  useEffect(() => {
    if (data?.assignedToMeTasks?.tasks) {
      if (assignedToMeTasksOffset === 0) {
        // Initial load - replace
        setAccumulatedAssignedTasks(data.assignedToMeTasks.tasks);
      } else {
        // Load more - append (filter out duplicates)
        setAccumulatedAssignedTasks((prev) => [
          ...prev,
          ...data.assignedToMeTasks.tasks.filter(
            (newTask) => !prev.some((existingTask) => existingTask.id === newTask.id)
          ),
        ]);
      }
      setIsLoadingMoreAssigned(false);
    }
  }, [data?.assignedToMeTasks?.tasks, assignedToMeTasksOffset]);

  // Redirect to /my-tasks if mobile
  useEffect(() => {
    if (isMobile) {
      router.replace('/my-tasks');
    }
  }, [isMobile, router]);

  // Redirect USER role to IT Service (they shouldn't see dashboard)
  useEffect(() => {
    if (user && user.role === 'USER') {
      router.replace('/it-service');
    }
  }, [user, router]);

  // ✅ Early return AFTER all hooks
  // Show loading while redirecting
  if (isMobile) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Show loading while redirecting USER role to IT Service
  if (user && user.role === 'USER') {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Handle refresh
  const handleRefresh = async () => {
    // Reset pagination first
    setMyCreatedTasksOffset(0);
    setAssignedToMeTasksOffset(0);

    // ✅ BUG FIX: Don't clear accumulated tasks immediately
    // Let refetch complete first, then useEffect will update with fresh data

    // Refetch dashboard data
    await refetch();
  };

  // Handle load more for "งานที่ฉันสร้าง"
  const handleLoadMoreCreated = () => {
    setIsLoadingMoreCreated(true);
    setMyCreatedTasksOffset((prev) => prev + 10);
  };

  // Handle load more for "งานที่มอบหมายให้ฉัน"
  const handleLoadMoreAssigned = () => {
    setIsLoadingMoreAssigned(true);
    setAssignedToMeTasksOffset((prev) => prev + 10);
  };

  // Prepare data with accumulated tasks
  const myCreatedTasksData: MyTasksData = {
    tasks: accumulatedCreatedTasks,
    total: data?.myCreatedTasks?.total || 0,
    hasMore: data?.myCreatedTasks?.hasMore || false,
  };

  const assignedToMeTasksData: MyTasksData = {
    tasks: accumulatedAssignedTasks,
    total: data?.assignedToMeTasks?.total || 0,
    hasMore: data?.assignedToMeTasks?.hasMore || false,
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
          <CreateTaskButton />
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

          {/* My Created Tasks Widget */}
          <MyCreatedTasksWidget
            myCreatedTasks={myCreatedTasksData}
            isLoading={isLoading && myCreatedTasksOffset === 0}
            onLoadMore={handleLoadMoreCreated}
            isLoadingMore={isLoadingMoreCreated}
          />

          {/* Assigned to Me Tasks Widget */}
          <MyTasksWidget
            myTasks={assignedToMeTasksData}
            isLoading={isLoading && assignedToMeTasksOffset === 0}
            onLoadMore={handleLoadMoreAssigned}
            isLoadingMore={isLoadingMoreAssigned}
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
