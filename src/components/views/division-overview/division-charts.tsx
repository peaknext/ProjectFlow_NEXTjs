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
import type { DivisionCharts } from "@/types/division";
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

interface DivisionChartsProps {
  charts: DivisionCharts;
}

export function DivisionChartsComponent({ charts }: DivisionChartsProps) {
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
            <CardTitle className="text-base">จำนวนงานแยกตามหน่วยงาน</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px]" />
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              สัดส่วนงานแยกตามระดับความเร่งด่วน
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[350px]" />
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">จำนวนงานแยกตามสถานะและหน่วยงาน</CardTitle>
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
        position: "right" as const,
        labels: {
          color: isDark ? "#e2e8f0" : "#1e293b",
          font: {
            family: "Sarabun, ui-sans-serif, system-ui, sans-serif",
            size: 12,
            weight: 500,
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
          weight: 600,
        },
        bodyFont: {
          family: "Sarabun, ui-sans-serif, system-ui, sans-serif",
          size: 15,
        },
        callbacks: {
          label: function (context: any) {
            const label = context.dataset.label || context.label || "";
            const value = context.raw ?? 0;
            return `${label}: ${Number(value)} งาน`;
          },
        },
      },
    },
  };

  // Chart 1: Workload Distribution (Bar Chart)
  const workloadLabels = charts.workloadDistribution.map(
    (d) => d.departmentName
  );
  const workloadData = charts.workloadDistribution.map((d) => d.taskCount);

  const workloadChartData = {
    labels: workloadLabels,
    datasets: [
      {
        label: "จำนวนงาน",
        data: workloadData,
        backgroundColor: "rgba(59, 130, 246, 0.8)", // blue-500
        borderColor: "rgb(59, 130, 246)",
        borderWidth: 1,
      },
    ],
  };

  const workloadBarOptions: ChartOptions<"bar"> = {
    ...commonOptions,
    indexAxis: "y" as const, // Horizontal bar for better department name display
    scales: {
      x: {
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
      y: {
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
    },
  };

  // Chart 2: Priority Distribution (Doughnut Chart)
  const priorityLabels = ["ด่วนมาก", "สูง", "ปานกลาง", "ต่ำ"];
  const priorityData = [
    charts.priorityDistribution.priority1 || 0,
    charts.priorityDistribution.priority2 || 0,
    charts.priorityDistribution.priority3 || 0,
    charts.priorityDistribution.priority4 || 0,
  ];

  const priorityChartData = {
    labels: priorityLabels,
    datasets: [
      {
        data: priorityData,
        backgroundColor: [
          "rgba(239, 68, 68, 0.8)", // red-500 (Urgent)
          "rgba(251, 146, 60, 0.8)", // orange-500 (High)
          "rgba(59, 130, 246, 0.8)", // blue-500 (Normal)
          "rgba(148, 163, 184, 0.8)", // slate-500 (Low)
        ],
        borderColor: [
          "rgb(239, 68, 68)",
          "rgb(251, 146, 60)",
          "rgb(59, 130, 246)",
          "rgb(148, 163, 184)",
        ],
        borderWidth: 2,
      },
    ],
  };

  // Chart 3: Status Distribution (Stacked Bar Chart)
  const statusDeptNames = charts.statusDistribution.map(
    (d) => d.departmentName
  );
  const notStartedData = charts.statusDistribution.map((d) => d.notStarted);
  const inProgressData = charts.statusDistribution.map((d) => d.inProgress);
  const doneData = charts.statusDistribution.map((d) => d.done);

  const statusChartData = {
    labels: statusDeptNames,
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

  const statusBarOptions: ChartOptions<"bar"> = {
    ...commonOptions,
    indexAxis: "y" as const, // Horizontal stacked bar
    scales: {
      x: {
        stacked: true,
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
      y: {
        stacked: true,
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
    },
  };

  return (
    <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
      {/* Chart 1: Workload Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">ภาระงานแยกตามหน่วยงาน</CardTitle>
        </CardHeader>
        <CardContent className="h-[350px] flex items-center justify-center">
          <Bar data={workloadChartData} options={workloadBarOptions} />
        </CardContent>
      </Card>

      {/* Chart 2: Priority Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            จำนวนงานแยกตามความเร่งด่วน
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[350px] flex items-center justify-center">
          <Doughnut data={priorityChartData} options={commonOptions} />
        </CardContent>
      </Card>

      {/* Chart 3: Status Distribution (Full Width) */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">
            จำนวนงานแยกตามสถานะและหน่วยงาน
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[350px]">
          <Bar data={statusChartData} options={statusBarOptions} />
        </CardContent>
      </Card>
    </div>
  );
}
