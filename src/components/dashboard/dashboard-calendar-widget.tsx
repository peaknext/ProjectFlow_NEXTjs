"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  isPast,
  differenceInDays,
  startOfDay,
} from "date-fns";
import { th } from "date-fns/locale";
import { motion, PanInfo } from "framer-motion";
import type { DashboardTask } from "@/types/dashboard";
import { cn } from "@/lib/utils";

interface DashboardCalendarProps {
  calendarTasks: DashboardTask[];
  isLoading: boolean;
  currentMonth?: Date;
  onMonthChange?: (date: Date) => void;
}

const thaiMonths = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

const thaiDayAbbreviations = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

export function DashboardCalendarWidget({
  calendarTasks,
  isLoading,
  currentMonth: controlledMonth,
  onMonthChange,
}: DashboardCalendarProps) {
  // Use internal state if not controlled
  const [internalMonth, setInternalMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Determine if controlled or uncontrolled
  const currentMonth = controlledMonth || internalMonth;
  const setCurrentMonth = onMonthChange || setInternalMonth;

  // Group tasks by date
  const tasksByDate = useMemo(() => {
    const grouped: Record<string, DashboardTask[]> = {};
    calendarTasks.forEach((task) => {
      if (task.dueDate) {
        const dateKey = format(new Date(task.dueDate), "yyyy-MM-dd");
        if (!grouped[dateKey]) grouped[dateKey] = [];
        grouped[dateKey].push(task);
      }
    });
    return grouped;
  }, [calendarTasks]);

  // Generate calendar grid
  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });

    // Add days from previous month to fill first week
    const firstDayOfWeek = getDay(start);
    const previousMonthDays = [];
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(start);
      date.setDate(date.getDate() - (i + 1));
      previousMonthDays.push(date);
    }

    // Add days from next month to fill last week (total 42 cells = 6 weeks)
    const allDays = [...previousMonthDays, ...days];
    const remainingCells = 42 - allDays.length;
    for (let i = 1; i <= remainingCells; i++) {
      const date = new Date(end);
      date.setDate(date.getDate() + i);
      allDays.push(date);
    }

    return allDays;
  }, [currentMonth]);

  if (isLoading) {
    return <CalendarSkeleton />;
  }

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  // Get dot indicators for a date
  const getDateIndicators = (date: Date) => {
    const dateKey = format(date, "yyyy-MM-dd");
    const tasks = tasksByDate[dateKey] || [];
    const today = startOfDay(new Date());

    const hasOverdue = tasks.some(
      (t) =>
        isPast(new Date(t.dueDate!)) &&
        !t.isClosed &&
        new Date(t.dueDate!) < today
    );
    const hasDueSoon = tasks.some((t) => {
      if (t.isClosed) return false;
      const dueDate = new Date(t.dueDate!);
      const daysUntil = differenceInDays(dueDate, today);
      return daysUntil >= 0 && daysUntil <= 3;
    });
    const hasUpcoming = tasks.some((t) => {
      if (t.isClosed) return false;
      const dueDate = new Date(t.dueDate!);
      const daysUntil = differenceInDays(dueDate, today);
      return daysUntil > 3;
    });

    return { hasOverdue, hasDueSoon, hasUpcoming, taskCount: tasks.length };
  };

  // Handle swipe gesture for changing months
  const handlePanEnd = (_event: any, info: PanInfo) => {
    const { offset, velocity } = info;
    const swipeThreshold = 80; // Larger than SwipeablePages (50px)
    const velocityThreshold = 500;
    const verticalThreshold = 50; // Ensure it's a horizontal swipe

    // Ignore if too much vertical movement (probably scrolling)
    if (Math.abs(offset.y) > verticalThreshold) {
      return;
    }

    // Determine if swipe is significant enough
    const isSignificantSwipe =
      Math.abs(offset.x) > swipeThreshold ||
      Math.abs(velocity.x) > velocityThreshold;

    if (!isSignificantSwipe) {
      return;
    }

    // Swipe left → Next month
    if (offset.x < 0) {
      goToNextMonth();
    }

    // Swipe right → Previous month
    if (offset.x > 0) {
      goToPreviousMonth();
    }
  };

  // Format month/year header
  const monthName = thaiMonths[currentMonth.getMonth()];
  const buddhistYear = currentMonth.getFullYear() + 543;

  return (
    <Card>
      <CardHeader className="border-b pb-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPreviousMonth}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <h3 className="font-semibold text-base">
            {monthName} {buddhistYear}
          </h3>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={goToNextMonth}
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="h-8 text-xs ml-2"
            >
              วันนี้
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {/* Calendar Grid with Swipe Detection */}
        <motion.div
          className="space-y-2 cursor-grab active:cursor-grabbing"
          onPanEnd={handlePanEnd}
          drag={false}
        >
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {thaiDayAbbreviations.map((day, i) => (
              <div
                key={i}
                className="text-center text-xs font-medium text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Date cells */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, i) => {
              const dateKey = format(day, "yyyy-MM-dd");
              const tasks = tasksByDate[dateKey] || [];
              const indicators = getDateIndicators(day);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isTodayDate = isToday(day);

              return (
                <TooltipProvider key={i}>
                  <Tooltip delayDuration={200}>
                    <TooltipTrigger asChild>
                      <button
                        className={cn(
                          "relative h-10 flex flex-col items-center justify-center rounded-md text-sm transition-colors",
                          "hover:bg-muted/50",
                          !isCurrentMonth && "text-muted-foreground/40",
                          isTodayDate &&
                            "bg-primary text-primary-foreground font-bold hover:bg-primary/90"
                        )}
                      >
                        <span>{day.getDate()}</span>
                        {/* Task indicators */}
                        {indicators.taskCount > 0 && (
                          <div className="flex items-center gap-0.5 mt-0.5">
                            {indicators.hasOverdue && (
                              <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
                            )}
                            {indicators.hasDueSoon && (
                              <div className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                            )}
                            {indicators.hasUpcoming && (
                              <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                            )}
                          </div>
                        )}
                      </button>
                    </TooltipTrigger>

                    {tasks.length > 0 && (
                      <TooltipContent className="max-w-xs" side="top">
                        <div className="space-y-1">
                          <p className="font-semibold text-xs mb-2">
                            {format(day, "d MMMM yyyy", { locale: th })}
                          </p>
                          <div className="space-y-1 max-h-48 overflow-y-auto">
                            {tasks.slice(0, 5).map((task) => (
                              <div
                                key={task.id}
                                className="text-xs flex items-start gap-1.5"
                              >
                                <div
                                  className={cn(
                                    "h-1.5 w-1.5 rounded-full mt-1 flex-shrink-0",
                                    task.priority === 1 && "bg-red-500",
                                    task.priority === 2 && "bg-orange-500",
                                    task.priority === 3 && "bg-blue-500",
                                    task.priority === 4 && "bg-gray-500"
                                  )}
                                />
                                <span
                                  className={cn(
                                    task.isClosed && "line-through opacity-60"
                                  )}
                                >
                                  {task.name}
                                </span>
                              </div>
                            ))}
                            {tasks.length > 5 && (
                              <p className="text-xs text-muted-foreground mt-1">
                                และอีก {tasks.length - 5} งาน...
                              </p>
                            )}
                          </div>
                        </div>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-end gap-4 mt-4 pt-4 border-t text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-red-500" />
            <span>เกินกำหนด</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-orange-500" />
            <span>ใกล้ครบกำหนด</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-blue-500" />
            <span>งานถัดไป</span>
          </div>
        </div>
        </motion.div>
      </CardContent>
    </Card>
  );
}

function CalendarSkeleton() {
  return (
    <Card>
      <CardHeader className="border-b pb-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-6 w-32" />
          <div className="flex items-center gap-1">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-16 ml-2" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        <div className="space-y-2">
          {/* Day headers skeleton */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {[...Array(7)].map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>

          {/* Date cells skeleton */}
          <div className="grid grid-cols-7 gap-1">
            {[...Array(42)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </div>

        {/* Legend skeleton */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-4 w-24" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
