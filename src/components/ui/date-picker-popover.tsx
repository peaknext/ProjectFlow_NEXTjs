'use client';

import { useState, useEffect } from 'react';
import { format, addMonths, subMonths } from 'date-fns';
import { th } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { motion, PanInfo } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * SwipeableCalendar - Calendar with swipe gesture support
 * Wraps shadcn/ui Calendar with left/right swipe to change months
 */
interface SwipeableCalendarProps {
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  onMonthChange?: (month: Date) => void;
  [key: string]: any; // Allow any other props to pass through to Calendar
}

function SwipeableCalendar({ selected, onMonthChange, ...calendarProps }: SwipeableCalendarProps) {
  const [displayMonth, setDisplayMonth] = useState(selected || new Date());

  // Sync with selected date changes
  useEffect(() => {
    if (selected) {
      setDisplayMonth(selected);
    }
  }, [selected]);

  // Handle swipe gesture
  const handlePanEnd = (_event: any, info: PanInfo) => {
    const { offset, velocity } = info;
    const swipeThreshold = 80;
    const velocityThreshold = 500;
    const verticalThreshold = 50;

    // Ignore if too much vertical movement
    if (Math.abs(offset.y) > verticalThreshold) {
      return;
    }

    // Check if swipe is significant
    const isSignificantSwipe =
      Math.abs(offset.x) > swipeThreshold ||
      Math.abs(velocity.x) > velocityThreshold;

    if (!isSignificantSwipe) {
      return;
    }

    // Swipe left → Next month
    if (offset.x < 0) {
      const nextMonth = addMonths(displayMonth, 1);
      setDisplayMonth(nextMonth);
      onMonthChange?.(nextMonth);
    }

    // Swipe right → Previous month
    if (offset.x > 0) {
      const prevMonth = subMonths(displayMonth, 1);
      setDisplayMonth(prevMonth);
      onMonthChange?.(prevMonth);
    }
  };

  return (
    <motion.div
      className="cursor-grab active:cursor-grabbing"
      onPanEnd={handlePanEnd}
      drag={false}
    >
      <Calendar
        {...calendarProps}
        month={displayMonth}
        onMonthChange={(month) => {
          setDisplayMonth(month);
          onMonthChange?.(month);
        }}
      />
    </motion.div>
  );
}

/**
 * Format date in Thai Buddhist Era format
 * @param date - Date to format
 * @returns Formatted string like "21 ตุลาคม 2568"
 */
function formatThaiDate(date: Date): string {
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }

  const day = date.getDate();
  const month = date.toLocaleString('th-TH', { month: 'long' });
  const year = date.getFullYear() + 543; // Convert to Buddhist Era
  return `${day} ${month} ${year}`;
}

interface DatePickerPopoverProps {
  value: string | null; // ISO date string
  onChange: (date: string | null) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

/**
 * DatePickerPopover Component
 *
 * Date picker with calendar grid and Thai locale support.
 * Features:
 * - Calendar grid view
 * - Month/Year navigation
 * - Today button
 * - Clear button
 * - Thai locale (Buddhist Era)
 * - ISO date string format
 *
 * @example
 * <DatePickerPopover
 *   value={startDate}
 *   onChange={(newDate) => setStartDate(newDate)}
 *   placeholder="เลือกวันที่"
 *   disabled={isClosed || !canEdit}
 * />
 */
export function DatePickerPopover({
  value,
  onChange,
  disabled = false,
  placeholder = 'เลือกวันที่',
  className
}: DatePickerPopoverProps) {
  const [open, setOpen] = useState(false);

  // Calculate year range: current year ±5
  const currentYear = new Date().getFullYear();
  const startYear = currentYear - 5;
  const endYear = currentYear + 5;

  // Parse ISO string to Date object (use local timezone to avoid offset issues)
  const selectedDate = value
    ? (() => {
        // Extract date part only (YYYY-MM-DD) to avoid timezone issues
        const datePart = value.split('T')[0];
        // Append T00:00:00 to force local timezone interpretation
        const date = new Date(datePart + 'T00:00:00');
        return isNaN(date.getTime()) ? undefined : date;
      })()
    : undefined;

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      // Convert to ISO string (YYYY-MM-DD format) using local timezone
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const isoDate = `${year}-${month}-${day}`;
      onChange(isoDate);
      setOpen(false);
    }
  };

  const handleClear = () => {
    onChange(null);
    setOpen(false);
  };

  const handleToday = () => {
    const today = new Date();
    // Convert to ISO string using local timezone
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const isoDate = `${year}-${month}-${day}`;
    onChange(isoDate);
    setOpen(false);
  };

  // Format display text (Thai locale with Buddhist Era)
  const displayText = selectedDate ? formatThaiDate(selectedDate) : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            'flex items-center justify-start gap-2 h-[46px] w-full px-3 py-2 text-base text-left',
            'bg-white dark:bg-background border border-input rounded-lg',
            !selectedDate && 'text-muted-foreground',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'hover:bg-accent hover:text-accent-foreground',
            'transition-colors',
            className
          )}
        >
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          <span className="truncate">{displayText}</span>
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0 bg-white dark:bg-popover" align="start">
        <div className="p-3 space-y-3">
          <SwipeableCalendar
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
            locale={th}
            initialFocus
            fromYear={startYear}
            toYear={endYear}
          />

          <div className="flex items-center justify-between gap-2 pt-2 border-t">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={!selectedDate}
              className="text-xs"
            >
              ล้าง
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleToday}
              className="text-xs"
            >
              วันนี้
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/**
 * DateInput Component (Read-only with icon)
 *
 * Alternative date input that opens date picker popover.
 * Matches the original GAS implementation style.
 */
interface DateInputProps {
  value: string | null;
  onChange: (date: string | null) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function DateInput({
  value,
  onChange,
  disabled = false,
  placeholder = 'เลือกวันที่',
  className
}: DateInputProps) {
  const [open, setOpen] = useState(false);

  // Calculate year range: current year ±5
  const currentYear = new Date().getFullYear();
  const startYear = currentYear - 5;
  const endYear = currentYear + 5;

  // Parse ISO string to Date object (use local timezone to avoid offset issues)
  const selectedDate = value
    ? (() => {
        // Extract date part only (YYYY-MM-DD) to avoid timezone issues
        const datePart = value.split('T')[0];
        // Append T00:00:00 to force local timezone interpretation
        const date = new Date(datePart + 'T00:00:00');
        return isNaN(date.getTime()) ? undefined : date;
      })()
    : undefined;

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      // Convert to ISO string (YYYY-MM-DD format) using local timezone
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const isoDate = `${year}-${month}-${day}`;
      onChange(isoDate);
      setOpen(false);
    }
  };

  const handleClear = () => {
    onChange(null);
    setOpen(false);
  };

  const handleToday = () => {
    const today = new Date();
    // Convert to ISO string using local timezone
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const isoDate = `${year}-${month}-${day}`;
    onChange(isoDate);
    setOpen(false);
  };

  const displayText = selectedDate ? formatThaiDate(selectedDate) : '';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="relative">
        <PopoverTrigger asChild>
          <input
            type="text"
            value={displayText}
            readOnly
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              'w-full px-3 pl-10 py-2',
              'bg-white dark:bg-background border border-input rounded-lg',
              'text-foreground placeholder:text-muted-foreground',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
              'disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
              !className?.includes('h-') && 'h-[46px]', // Default height if not overridden
              !className?.includes('text-') && 'text-sm', // Default text size if not overridden
              className
            )}
          />
        </PopoverTrigger>
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none text-sm">
          calendar_month
        </span>
      </div>

      <PopoverContent className="w-auto p-0 bg-white dark:bg-popover" align="start">
        <div className="p-3 space-y-3">
          <SwipeableCalendar
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
            locale={th}
            initialFocus
            fromYear={startYear}
            toYear={endYear}
          />

          <div className="flex items-center justify-between gap-2 pt-2 border-t">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={!selectedDate}
              className="text-xs"
            >
              ล้าง
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleToday}
              className="text-xs"
            >
              วันนี้
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
