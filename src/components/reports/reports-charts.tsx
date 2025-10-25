"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Doughnut, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";
import type { ReportStatistics } from "@/hooks/use-reports";
import { useTheme } from "next-themes";

// Register Chart.js components
ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ReportsChartsProps {
  statistics: ReportStatistics;
}

export function ReportsCharts({ statistics }: ReportsChartsProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">งานแยกตามสถานะ</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]" />
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">งานแยกตามผู้รับผิดชอบ</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]" />
        </Card>
      </div>
    );
  }

  const isDark = theme === "dark";

  // Common chart options
  const commonOptions: ChartOptions<any> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          color: isDark ? "#e2e8f0" : "#1e293b",
          font: {
            family: "inherit",
            size: 14, // เพิ่มจาก default (~12) เป็น 14 (ใหญ่กว่าเกือบ 2 เท่า)
          },
          padding: 15,
        },
      },
      tooltip: {
        backgroundColor: isDark ? "#1e293b" : "#ffffff",
        titleColor: isDark ? "#f1f5f9" : "#0f172a",
        bodyColor: isDark ? "#e2e8f0" : "#334155",
        borderColor: isDark ? "#334155" : "#e2e8f0",
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          label: function (context: any) {
            const label = context.label || "";
            // Handle both number and object values (for different chart types)
            let value = context.parsed;
            if (typeof value === 'object' && value !== null) {
              value = value.y ?? value.x ?? context.raw ?? 0;
            } else if (value === null || value === undefined) {
              value = context.raw ?? 0;
            }
            return `${label}: ${Number(value)} งาน`;
          },
        },
      },
    },
  };

  // Chart 1: Workload by Status Type (Donut)
  const workloadByTypeData = {
    labels: ["ยังไม่เริ่ม", "กำลังทำ", "เสร็จแล้ว"],
    datasets: [
      {
        data: [
          Object.values(statistics.workloadByType).reduce(
            (sum, user) => sum + user["Not Started"],
            0
          ),
          Object.values(statistics.workloadByType).reduce(
            (sum, user) => sum + user["In Progress"],
            0
          ),
          Object.values(statistics.workloadByType).reduce(
            (sum, user) => sum + user.Done,
            0
          ),
        ],
        backgroundColor: [
          "rgba(148, 163, 184, 0.8)", // slate-500 (Not Started)
          "rgba(59, 130, 246, 0.8)", // blue-500 (In Progress)
          "rgba(16, 185, 129, 0.8)", // green-500 (Done)
        ],
        borderColor: [
          "rgb(148, 163, 184)",
          "rgb(59, 130, 246)",
          "rgb(16, 185, 129)",
        ],
        borderWidth: 2,
      },
    ],
  };

  // Chart 2: Tasks by Assignee (Donut)
  const assigneeColors = [
    "rgba(59, 130, 246, 0.8)", // blue
    "rgba(16, 185, 129, 0.8)", // green
    "rgba(245, 158, 11, 0.8)", // amber
    "rgba(139, 92, 246, 0.8)", // violet
    "rgba(236, 72, 153, 0.8)", // pink
    "rgba(20, 184, 166, 0.8)", // teal
    "rgba(239, 68, 68, 0.8)", // red
    "rgba(99, 102, 241, 0.8)", // indigo
    "rgba(251, 146, 60, 0.8)", // orange
    "rgba(168, 85, 247, 0.8)", // purple
    "rgba(34, 197, 94, 0.8)", // emerald
    "rgba(234, 179, 8, 0.8)", // yellow
  ];

  const tasksByAssigneeData = {
    labels: Object.keys(statistics.tasksByAssignee),
    datasets: [
      {
        data: Object.values(statistics.tasksByAssignee),
        backgroundColor: Object.keys(statistics.tasksByAssignee).map(
          (_, i) => assigneeColors[i % assigneeColors.length]
        ),
        borderColor: "transparent",
        borderWidth: 2,
      },
    ],
  };

  // Chart 3: Open Tasks by Assignee (Bar)
  const assigneeNames = Object.keys(statistics.workloadByType);
  const openTasksByAssignee = assigneeNames.map((name) => {
    const userData = statistics.workloadByType[name];
    const notStarted = Number(userData["Not Started"]) || 0;
    const inProgress = Number(userData["In Progress"]) || 0;
    const total = notStarted + inProgress;
    console.log(`📊 Bar chart data for ${name}:`, {
      userData,
      notStarted,
      inProgress,
      total
    });
    return total;
  });

  console.log('📊 Bar chart final data:', {
    labels: assigneeNames,
    data: openTasksByAssignee,
  });

  const openTasksData = {
    labels: assigneeNames,
    datasets: [
      {
        label: "งานที่ยังไม่เสร็จ",
        data: openTasksByAssignee,
        backgroundColor: "rgba(59, 130, 246, 0.8)",
        borderColor: "rgb(59, 130, 246)",
        borderWidth: 1,
      },
    ],
  };

  const barOptions: ChartOptions<"bar"> = {
    ...commonOptions,
    indexAxis: "x" as const, // Vertical bar (สลับจาก horizontal)
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: isDark ? "#94a3b8" : "#64748b",
          font: {
            family: "inherit",
          },
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: isDark ? "rgba(148, 163, 184, 0.1)" : "rgba(148, 163, 184, 0.2)",
        },
        ticks: {
          color: isDark ? "#94a3b8" : "#64748b",
          font: {
            family: "inherit",
          },
        },
      },
    },
  };

  return (
    <>
      {/* Row 1: Two Donut Charts */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {/* Chart 1: Workload by Type */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">งานแยกตามสถานะ</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            <Doughnut data={workloadByTypeData} options={commonOptions} />
          </CardContent>
        </Card>

        {/* Chart 2: Tasks by Assignee */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">งานแยกตามผู้รับผิดชอบ</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            <Doughnut data={tasksByAssigneeData} options={commonOptions} />
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">งานที่ยังไม่เสร็จแยกตามผู้รับผิดชอบ</CardTitle>
        </CardHeader>
        <CardContent className="h-[400px]">
          <Bar data={openTasksData} options={barOptions} />
        </CardContent>
      </Card>
    </>
  );
}
