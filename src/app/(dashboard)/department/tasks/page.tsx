"use client";

import { useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useDepartmentTasks, type ProjectGroup } from "@/hooks/use-department-tasks";
import { DepartmentTasksView } from "@/components/views/department-tasks";
import { DepartmentToolbar } from "@/components/layout/department-toolbar";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useNavigationStore } from "@/stores/use-navigation-store";
import { EditProjectModal } from "@/components/modals/edit-project-modal";

export default function DepartmentTasksPage() {
  // Get current user from auth hook
  const { user, isLoading: isLoadingUser } = useAuth();
  const searchParams = useSearchParams();

  // Get departmentId from URL query param or fallback to user's department
  const departmentIdFromUrl = searchParams.get("departmentId");
  const departmentId =
    departmentIdFromUrl || user?.departmentId || user?.department?.id;

  const { setDepartment } = useNavigationStore();

  // Fetch department tasks (always include completed, filter on frontend)
  const { data, isLoading, error } = useDepartmentTasks(
    departmentId || "",
    {
      view: "grouped",
      includeCompleted: true, // Always fetch all tasks, let frontend filter decide
      sortBy: "dueDate",
      sortDir: "asc",
    },
    {
      enabled: !!departmentId, // Only fetch if departmentId exists
    }
  );

  // Get all users for TaskRow component (must be before any conditional returns)
  const allUsers = useMemo(() => {
    return data?.users || [];
  }, [data?.users]);

  // Update navigation store when department data loads
  useEffect(() => {
    if (data?.department) {
      const department = data.department;
      const division = department.division;
      const missionGroup = division?.missionGroup;

      setDepartment(
        department.id,
        department.name,
        division?.id || null,
        division?.name || null,
        missionGroup?.id || null,
        missionGroup?.name || null
      );
    }
  }, [data, setDepartment]);

  // Loading user data
  if (isLoadingUser) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">
              กำลังโหลดข้อมูลผู้ใช้...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // No department assigned
  if (!departmentId) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              ไม่พบข้อมูลแผนก
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              บัญชีของคุณยังไม่ได้ถูกกำหนดแผนก
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              กรุณาติดต่อผู้ดูแลระบบเพื่อกำหนดแผนกให้กับบัญชีของคุณ
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Loading tasks
  if (isLoading) {
    return (
      <div className="p-6">
        {/* Header Skeleton */}
        <div className="mb-6">
          <Skeleton className="h-8 w-64 mb-1" />
          <Skeleton className="h-4 w-32 mb-6" />
        </div>

        {/* Project Cards Skeleton */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              เกิดข้อผิดพลาด
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {error.message || "ไม่สามารถโหลดข้อมูลงานได้"}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              โหลดใหม่
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!data || data.projects.length === 0) {
    return (
      <div className="h-full flex flex-col">
        <DepartmentToolbar departmentId={departmentId} />

        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              ยังไม่มีโครงการในหน่วยงานนี้
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              เริ่มสร้างโครงการแรกของคุณ
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Success state - display data
  return (
    <div className="h-full flex flex-col">
      <DepartmentToolbar departmentId={departmentId} />

      <div className="flex-1 overflow-auto p-6">
        <DepartmentTasksView
          departmentId={departmentId}
          projects={data.projects as unknown as any[]}
          allUsers={allUsers}
        />

        {/* Footer Info */}
        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          แสดง {data.projects.length} โครงการ | รวม {data.stats.totalTasks} งาน
        </div>
      </div>

      {/* Edit Project Modal */}
      <EditProjectModal />
    </div>
  );
}
