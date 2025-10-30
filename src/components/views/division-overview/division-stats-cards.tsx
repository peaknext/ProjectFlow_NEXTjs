"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, FolderKanban, ClipboardList, Trophy, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { DivisionStats } from "@/types/division";

interface DivisionStatsCardsProps {
  stats: DivisionStats;
}

export function DivisionStatsCards({ stats }: DivisionStatsCardsProps) {
  // Determine trend icon
  const TrendIcon = stats.trend.direction === 'up'
    ? TrendingUp
    : stats.trend.direction === 'down'
    ? TrendingDown
    : Minus;

  const trendColor = stats.trend.direction === 'up'
    ? 'text-green-500'
    : stats.trend.direction === 'down'
    ? 'text-red-500'
    : 'text-muted-foreground';

  const cards = [
    {
      title: "หน่วยงานทั้งหมด",
      value: stats.totalDepartments,
      subtitle: `${stats.activeDepartments} หน่วยงานที่ใช้งานอยู่`,
      icon: Building2,
      bgColor: "bg-blue-500/10",
      iconColor: "text-blue-500",
      darkBgColor: "dark:bg-blue-500/20",
      showTrend: false,
    },
    {
      title: "โปรเจกต์ทั้งหมด",
      value: stats.totalProjects,
      subtitle: `${stats.activeProjects} โปรเจกต์กำลังทำ`,
      icon: FolderKanban,
      bgColor: "bg-purple-500/10",
      iconColor: "text-purple-500",
      darkBgColor: "dark:bg-purple-500/20",
      showTrend: false,
    },
    {
      title: "งานทั้งหมด",
      value: stats.totalTasks,
      subtitle: `${stats.completedTasks} งานเสร็จสิ้น`,
      icon: ClipboardList,
      bgColor: "bg-green-500/10",
      iconColor: "text-green-500",
      darkBgColor: "dark:bg-green-500/20",
      showTrend: false,
    },
    {
      title: "อัตราความสำเร็จเฉลี่ย",
      value: `${stats.avgCompletionRate.toFixed(0)}%`,
      subtitle: `${stats.trend.direction === 'up' ? '+' : stats.trend.direction === 'down' ? '-' : ''}${Math.abs(stats.trend.value).toFixed(0)}% จากเดือนที่แล้ว`,
      icon: Trophy,
      bgColor: "bg-amber-500/10",
      iconColor: "text-amber-500",
      darkBgColor: "dark:bg-amber-500/20",
      showTrend: true,
    },
  ];

  return (
    <div className="grid gap-2 md:gap-4 grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title} className="overflow-hidden">
            <CardHeader className="pb-2 md:pb-3 px-3 md:px-6 pt-3 md:pt-6 min-h-[60px] md:min-h-[70px]">
              <div className="flex items-start justify-between gap-1">
                <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground leading-tight">
                  {card.title}
                </CardTitle>
                <div
                  className={`p-1 md:p-2 rounded-lg ${card.bgColor} ${card.darkBgColor} flex-shrink-0`}
                >
                  <Icon className={`h-3 w-3 md:h-4 md:w-4 ${card.iconColor}`} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
              <div className="text-xl md:text-3xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{card.subtitle}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
