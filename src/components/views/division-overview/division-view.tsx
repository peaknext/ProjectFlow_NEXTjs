/**
 * DivisionView - Division overview display component
 * Displays comprehensive overview for executives managing multiple departments
 */

"use client";

import { DivisionStatsCards } from "./division-stats-cards";
import { DepartmentComparisonTable } from "./department-comparison-table";
import { DivisionChartsComponent } from "./division-charts";
import { CriticalTasksSection } from "./critical-tasks-section";
import type { DivisionOverview } from "@/types/division";

interface DivisionViewProps {
  data: DivisionOverview;
}

export function DivisionView({ data }: DivisionViewProps) {
  return (
    <div className="space-y-6">
      {/* [1] Stats Cards Section */}
      <DivisionStatsCards stats={data.stats} />

      {/* [2] Department Comparison Table */}
      <DepartmentComparisonTable departments={data.departments} />

      {/* [3] Performance Charts Section */}
      <DivisionChartsComponent charts={data.charts} />

      {/* [4] Critical Tasks Section */}
      <CriticalTasksSection criticalTasks={data.criticalTasks} />
    </div>
  );
}
