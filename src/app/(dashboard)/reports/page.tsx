"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { ShieldAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ReportToolbar } from "@/components/reports/report-toolbar";
import { StatisticsCards } from "@/components/reports/statistics-cards";
import { ReportsCharts } from "@/components/reports/reports-charts";
import { ReportsTable } from "@/components/reports/reports-table";
import {
  useReportData,
  calculateReportStatistics,
  formatDateForAPI,
  getFiscalYearStartDate,
} from "@/hooks/use-reports";
import type { ReportFilters } from "@/hooks/use-reports";

export default function ReportsPage() {
  const { user } = useAuth();

  // Initialize filters with fiscal year defaults
  // NO default dates - show ALL tasks initially
  // Let users filter by date if they want
  const [filters, setFilters] = useState<ReportFilters>({});

  // Check permission (all roles except USER)
  const hasAccess =
    user &&
    ["ADMIN", "CHIEF", "LEADER", "HEAD", "MEMBER"].includes(user.role);

  // Fetch report data
  const { data, isLoading, error } = useReportData(filters);

  // Access denied screen
  if (!hasAccess) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-3">
                <ShieldAlert className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">ไม่มีสิทธิ์เข้าถึง</h2>
                <p className="text-sm text-muted-foreground">
                  คุณไม่มีสิทธิ์เข้าถึงหน้ารายงาน
                  <br />
                  หากคุณคิดว่านี่เป็นข้อผิดพลาด โปรดติดต่อผู้ดูแลระบบ
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="h-screen flex flex-col">
        <ReportToolbar filters={filters} onFiltersChange={setFilters} />
        <div className="flex-1 overflow-auto p-6 space-y-6">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-32 bg-muted/50" />
              </Card>
            ))}
          </div>
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            {[1, 2].map((i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-[350px] bg-muted/50" />
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-screen flex flex-col">
        <ReportToolbar filters={filters} onFiltersChange={setFilters} />
        <div className="flex-1 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-3">
                  <ShieldAlert className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold">เกิดข้อผิดพลาด</h2>
                  <p className="text-sm text-muted-foreground">
                    ไม่สามารถโหลดข้อมูลรายงานได้
                    <br />
                    {error instanceof Error ? error.message : "กรุณาลองใหม่อีกครั้ง"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const statistics =
    data && data.tasks && data.users
      ? calculateReportStatistics(data.tasks, data.users)
      : {
          summary: { unassigned: 0, inProgress: 0, completed: 0, overdue: 0 },
          tasksByAssignee: {},
          workloadByType: {},
          statusTypes: ["Not Started", "In Progress", "Done"],
        };

  return (
    <div className="h-screen flex flex-col">
      {/* Toolbar */}
      <ReportToolbar filters={filters} onFiltersChange={setFilters} />

      {/* Content */}
      <div className="flex-1">
        <div className="p-6 space-y-6">
          {/* Statistics Cards */}
          <StatisticsCards statistics={statistics} />

          {/* Charts */}
          <ReportsCharts statistics={statistics} />

          {/* Table */}
          <ReportsTable statistics={statistics} users={data?.users || []} />
        </div>
      </div>
    </div>
  );
}
