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
          <CardContent className="h-[350px]" />
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">งานแยกตามผู้รับผิดชอบ</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px]" />
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
        position: "right" as const, // Changed from bottom to right for better space utilization
        labels: {
          color: isDark ? "#e2e8f0" : "#1e293b",
          font: {
            family: "Sarabun, ui-sans-serif, system-ui, sans-serif",
            size: 12, // Reduced to 12px (2/3 of 18px)
            weight: "500" as any, // Medium weight for better visibility
          },
          padding: 12,
          boxWidth: 20,
          boxHeight: 20,
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
        titleFont: {
          family: "Sarabun, ui-sans-serif, system-ui, sans-serif",
          size: 16,
          weight: "600" as any,
        },
        bodyFont: {
          family: "Sarabun, ui-sans-serif, system-ui, sans-serif",
          size: 15,
        },
        callbacks: {
          label: function (context: any) {
            const label = context.label || "";
            // Handle both number and object values (for different chart types)
            let value = context.parsed;
            if (typeof value === "object" && value !== null) {
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

  // Chart 3: Tasks by Status per Assignee (Stacked Bar)
  const assigneeNames = Object.keys(statistics.workloadByType);

  // Prepare data for each status
  const notStartedData = assigneeNames.map((name) => {
    const userData = statistics.workloadByType[name];
    return Number(userData["Not Started"]) || 0;
  });

  const inProgressData = assigneeNames.map((name) => {
    const userData = statistics.workloadByType[name];
    return Number(userData["In Progress"]) || 0;
  });

  const doneData = assigneeNames.map((name) => {
    const userData = statistics.workloadByType[name];
    return Number(userData.Done) || 0;
  });

  const stackedTasksData = {
    labels: assigneeNames,
    datasets: [
      {
        label: "ยังไม่เริ่ม",
        data: notStartedData,
        backgroundColor: "rgba(148, 163, 184, 0.8)", // slate-500
        borderColor: "rgb(148, 163, 184)",
        borderWidth: 1,
      },
      {
        label: "กำลังทำ",
        data: inProgressData,
        backgroundColor: "rgba(59, 130, 246, 0.8)", // blue-500
        borderColor: "rgb(59, 130, 246)",
        borderWidth: 1,
      },
      {
        label: "เสร็จแล้ว",
        data: doneData,
        backgroundColor: "rgba(16, 185, 129, 0.8)", // green-500
        borderColor: "rgb(16, 185, 129)",
        borderWidth: 1,
      },
    ],
  };

  const barOptions: ChartOptions<"bar"> = {
    ...commonOptions,
    indexAxis: "x" as const, // Vertical bar
    scales: {
      x: {
        stacked: true, // Enable stacking on x-axis
        grid: {
          display: false,
        },
        ticks: {
          color: isDark ? "#94a3b8" : "#64748b",
          font: {
            family: "Sarabun, ui-sans-serif, system-ui, sans-serif",
            size: 14,
          },
        },
      },
      y: {
        stacked: true, // Enable stacking on y-axis
        beginAtZero: true,
        grid: {
          color: isDark
            ? "rgba(148, 163, 184, 0.1)"
            : "rgba(148, 163, 184, 0.2)",
        },
        ticks: {
          color: isDark ? "#94a3b8" : "#64748b",
          font: {
            family: "Sarabun, ui-sans-serif, system-ui, sans-serif",
            size: 14,
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
          <CardContent className="h-[350px] flex items-center justify-center">
            <Doughnut data={workloadByTypeData} options={commonOptions} />
          </CardContent>
        </Card>

        {/* Chart 2: Tasks by Assignee */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">งานแยกตามผู้รับผิดชอบ</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px] flex items-center justify-center">
            <Doughnut data={tasksByAssigneeData} options={commonOptions} />
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Stacked Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            งานแยกตามสถานะและผู้รับผิดชอบ
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[400px]">
          <Bar data={stackedTasksData} options={barOptions} />
        </CardContent>
      </Card>
    </>
  );
}
