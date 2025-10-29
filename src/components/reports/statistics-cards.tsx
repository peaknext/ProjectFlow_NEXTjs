"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import type { ReportStatistics } from "@/hooks/use-reports";

interface StatisticsCardsProps {
  statistics: ReportStatistics;
}

export function StatisticsCards({ statistics }: StatisticsCardsProps) {
  const cards = [
    {
      title: "ยังไม่มอบหมาย",
      value: statistics.summary.unassigned,
      icon: ClipboardList,
      bgColor: "bg-slate-500/10",
      iconColor: "text-slate-500",
      darkBgColor: "dark:bg-slate-500/20",
    },
    {
      title: "กำลังดำเนินการ",
      value: statistics.summary.inProgress,
      icon: Clock,
      bgColor: "bg-blue-500/10",
      iconColor: "text-blue-500",
      darkBgColor: "dark:bg-blue-500/20",
    },
    {
      title: "เสร็จสิ้น",
      value: statistics.summary.completed,
      icon: CheckCircle2,
      bgColor: "bg-green-500/10",
      iconColor: "text-green-500",
      darkBgColor: "dark:bg-green-500/20",
    },
    {
      title: "เกินกำหนด",
      value: statistics.summary.overdue,
      icon: AlertCircle,
      bgColor: "bg-red-500/10",
      iconColor: "text-red-500",
      darkBgColor: "dark:bg-red-500/20",
    },
  ];

  return (
    <div className="grid gap-2 md:gap-4 grid-cols-4">
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
              <p className="text-xs text-muted-foreground mt-1">งาน</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
