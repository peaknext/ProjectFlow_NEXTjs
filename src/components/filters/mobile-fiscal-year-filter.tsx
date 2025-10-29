"use client";

/**
 * Mobile Fiscal Year Filter Component
 *
 * Mobile-optimized fiscal year filter with Sheet modal (full-screen on mobile)
 * - Compact icon button in mobile-top-bar
 * - Badge text shows selected years (e.g., "2568" or "ทุกปี")
 * - Full-screen Sheet modal for year selection
 */

import { useState } from "react";
import { Calendar, X, Check } from "lucide-react";
import {
  useFiscalYearStore,
  useFiscalYearBadgeText,
  useIsDefaultFiscalYear,
} from "@/stores/use-fiscal-year-store";
import {
  getCurrentFiscalYear,
  getAvailableFiscalYears,
} from "@/lib/fiscal-year";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export function MobileFiscalYearFilter() {
  const [open, setOpen] = useState(false);

  const selectedYears = useFiscalYearStore((state) => state.selectedYears);
  const setSelectedYears = useFiscalYearStore((state) => state.setSelectedYears);
  const resetToCurrentYear = useFiscalYearStore(
    (state) => state.resetToCurrentYear
  );
  const selectAllYears = useFiscalYearStore((state) => state.selectAllYears);

  const badgeText = useFiscalYearBadgeText();
  const isDefault = useIsDefaultFiscalYear();
  const currentYear = getCurrentFiscalYear();
  const availableYears = getAvailableFiscalYears();

  const isYearSelected = (year: number) => selectedYears.includes(year);

  const toggleYear = (year: number) => {
    if (isYearSelected(year)) {
      // Prevent deselecting if it's the only year selected
      if (selectedYears.length === 1) {
        return; // Do nothing
      }
      // Remove year
      setSelectedYears(selectedYears.filter((y) => y !== year));
    } else {
      // Add year
      setSelectedYears([...selectedYears, year]);
    }
  };

  const handleReset = () => {
    resetToCurrentYear();
  };

  const handleSelectAll = () => {
    selectAllYears();
  };

  const handleResetToCurrentYear = () => {
    resetToCurrentYear();
    setOpen(false);
  };

  const handleApply = () => {
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-9 w-9 relative",
            !isDefault && "text-primary" // Highlight when non-default
          )}
          aria-label="Fiscal Year Filter"
        >
          <Calendar className="h-5 w-5" />
          {/* Badge - Show badge text */}
          {selectedYears.length > 1 && (
            <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 bg-primary text-primary-foreground text-[10px] font-medium rounded-full flex items-center justify-center">
              {selectedYears.length}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[80vh] rounded-t-2xl">
        <SheetHeader className="pb-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle>ปีงบประมาณ</SheetTitle>
            {!isDefault && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={handleReset}
              >
                รีเซ็ต
              </Button>
            )}
          </div>
          <SheetDescription>
            เลือกปีงบประมาณที่ต้องการดูข้อมูล (เลือกได้มากกว่า 1 ปี)
          </SheetDescription>
        </SheetHeader>

        {/* Current Selection Display */}
        <div className="mt-4 p-4 bg-accent/50 rounded-lg">
          <div className="text-sm text-muted-foreground mb-1">ปีงบที่เลือก:</div>
          <div className="text-lg font-semibold text-primary">
            {badgeText === "ทุกปี" ? "ทุกปี" : `ปีงบ ${badgeText}`}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {selectedYears.length} ปี
          </div>
        </div>

        {/* Year List */}
        <div className="mt-6 space-y-2">
          {availableYears.map((year) => {
            const isSelected = isYearSelected(year);
            const isCurrent = year === currentYear;
            const isOnlySelected = isSelected && selectedYears.length === 1;

            return (
              <div
                key={year}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-lg border-2 transition-colors",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-accent",
                  isOnlySelected && "opacity-60 cursor-not-allowed"
                )}
                onClick={() => !isOnlySelected && toggleYear(year)}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => !isOnlySelected && toggleYear(year)}
                  disabled={isOnlySelected}
                  className="data-[state=checked]:bg-primary data-[state=checked]:border-primary h-6 w-6"
                />
                <div className="flex-1">
                  <div className="text-base font-medium">
                    ปีงบประมาณ {year}
                  </div>
                  {isCurrent && (
                    <div className="text-sm text-muted-foreground">
                      ปีปัจจุบัน
                    </div>
                  )}
                </div>
                {isSelected && (
                  <Check className="h-5 w-5 text-primary flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="mt-6 space-y-3">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="lg"
              className="flex-1 h-12"
              onClick={handleSelectAll}
            >
              เลือกทุกปี
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="flex-1 h-12"
              onClick={handleResetToCurrentYear}
            >
              ปีปัจจุบัน
            </Button>
          </div>
          <SheetClose asChild>
            <Button
              size="lg"
              className="w-full h-12"
              onClick={handleApply}
            >
              ใช้งาน
            </Button>
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
}
