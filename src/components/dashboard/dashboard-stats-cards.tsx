"use client";

import { motion } from "framer-motion";
import { LucideIcon, ClipboardList, CheckCircle2, AlertTriangle, CalendarDays } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { DashboardStats } from "@/types/dashboard";
import { useEffect, useState } from "react";

/**
 * AnimatedNumber Component
 *
 * Animates number changes with smooth count-up effect
 */
function AnimatedNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    // Count-up animation
    const duration = 500; // 500ms
    const steps = 30;
    const stepValue = value / steps;
    const stepDuration = duration / steps;

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      if (currentStep <= steps) {
        setDisplayValue(Math.round(stepValue * currentStep));
      } else {
        setDisplayValue(value);
        clearInterval(timer);
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {displayValue}
    </motion.span>
  );
}

/**
 * StatCard Component
 *
 * Individual stat card with icon, label, animated value, and subtext
 */
interface StatCardProps {
  label: string;
  value: number;
  subtext: string;
  icon: LucideIcon;
  theme: "blue" | "green" | "red" | "purple";
  subtextColor?: "red" | "muted";
}

function StatCard({
  label,
  value,
  subtext,
  icon: Icon,
  theme,
  subtextColor = "muted",
}: StatCardProps) {
  const themeConfig = {
    blue: {
      bg: "bg-blue-100 dark:bg-blue-900/30",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    green: {
      bg: "bg-green-100 dark:bg-green-900/30",
      iconColor: "text-green-600 dark:text-green-400",
    },
    red: {
      bg: "bg-red-100 dark:bg-red-900/30",
      iconColor: "text-red-600 dark:text-red-400",
    },
    purple: {
      bg: "bg-purple-100 dark:bg-purple-900/30",
      iconColor: "text-purple-600 dark:text-purple-400",
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-2">{label}</p>

              {/* Animated Number */}
              <motion.p
                className="text-3xl font-bold"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <AnimatedNumber value={value} />
              </motion.p>

              <p
                className={cn(
                  "text-xs mt-2",
                  subtextColor === "red"
                    ? "text-red-600 dark:text-red-400 font-medium"
                    : "text-muted-foreground"
                )}
              >
                {subtext}
              </p>
            </div>

            {/* Icon Circle */}
            <div
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center",
                themeConfig[theme].bg
              )}
            >
              <Icon className={cn("h-6 w-6", themeConfig[theme].iconColor)} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/**
 * Loading Skeletons
 *
 * Shows skeleton placeholders while data is loading
 */
function StatsCardsSkeletons() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-9 w-16" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-12 w-12 rounded-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * DashboardStatsCards Component
 *
 * Main component that displays 4 stat cards with animations
 */
export interface DashboardStatsCardsProps {
  stats: DashboardStats;
  isLoading?: boolean;
}

export function DashboardStatsCards({
  stats,
  isLoading,
}: DashboardStatsCardsProps) {
  // Show skeleton while loading
  if (isLoading) {
    return <StatsCardsSkeletons />;
  }

  // Calculate completion percentage
  const completionPercentage =
    stats.totalTasks > 0
      ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
      : 0;

  // Conditional subtext for overdue
  const overdueSubtext =
    stats.overdueTasks > 0
      ? "ต้องเร่งด่วน"
      : "ไม่มีงานที่เกินกำหนด";

  const overdueTextColor = stats.overdueTasks > 0 ? "red" : "muted";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Card 1: Total Tasks */}
      <StatCard
        label="งานทั้งหมด"
        value={stats.totalTasks}
        subtext={`${completionPercentage}% สำเร็จแล้ว`}
        icon={ClipboardList}
        theme="blue"
      />

      {/* Card 2: Completed Tasks */}
      <StatCard
        label="งานที่เสร็จแล้ว"
        value={stats.completedTasks}
        subtext={stats.completedTasks > 0 ? "ดีมาก" : "ไม่มีงานที่เสร็จ"}
        icon={CheckCircle2}
        theme="green"
      />

      {/* Card 3: Overdue Tasks */}
      <StatCard
        label="งานเกินกำหนด"
        value={stats.overdueTasks}
        subtext={overdueSubtext}
        icon={AlertTriangle}
        theme="red"
        subtextColor={overdueTextColor}
      />

      {/* Card 4: This Week Tasks */}
      <StatCard
        label="งานสัปดาห์นี้"
        value={stats.thisWeekTasks}
        subtext="กำลังดำเนินการ"
        icon={CalendarDays}
        theme="purple"
      />
    </div>
  );
}
