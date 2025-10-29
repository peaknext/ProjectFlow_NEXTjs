"use client";

/**
 * Fiscal Year Filter Component
 *
 * Multi-select dropdown for filtering data by Thai fiscal year(s)
 * - Default: Current fiscal year only
 * - Minimum: 1 year must be selected
 * - Available: 5 years (2568, 2567, 2566, 2565, 2564)
 * - Persists: localStorage via Zustand store
 */

import { useState } from "react";
import { Filter, X, Check } from "lucide-react";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export function FiscalYearFilter() {
  const [open, setOpen] = useState(false);

  const selectedYears = useFiscalYearStore((state) => state.selectedYears);
  const setSelectedYears = useFiscalYearStore((state) => state.setSelectedYears);
  const resetToCurrentYear = useFiscalYearStore(
    (state) => state.resetToCurrentYear
  );
  const selectAllYears = useFiscalYearStore((state) => state.selectAllYears);

  const isDefault = useIsDefaultFiscalYear();
  const currentYear = getCurrentFiscalYear();
  const availableYears = getAvailableFiscalYears();

  const isYearSelected = (year: number) => selectedYears.includes(year);

  // Badge text for desktop (fixed width)
  const getBadgeText = () => {
    if (selectedYears.length === 1) {
      return selectedYears[0].toString();
    }
    if (selectedYears.length >= 4) {
      return "ทุกปี";
    }
    return `ถูกเลือก ${selectedYears.length} ปี`;
  };

  const badgeText = getBadgeText();

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
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "h-9 w-[180px] justify-start gap-2",
            !isDefault && "border-primary text-primary"
          )}
        >
          <Filter className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">ปีงบ {badgeText}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h4 className="font-semibold text-sm">ปีงบประมาณ</h4>
          {!isDefault && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={handleReset}
            >
              รีเซ็ต
            </Button>
          )}
        </div>

        {/* Year List */}
        <div className="py-2">
          {availableYears.map((year) => {
            const isSelected = isYearSelected(year);
            const isCurrent = year === currentYear;
            const isOnlySelected = isSelected && selectedYears.length === 1;

            return (
              <div
                key={year}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 hover:bg-accent cursor-pointer",
                  isOnlySelected && "opacity-60 cursor-not-allowed"
                )}
                onClick={() => !isOnlySelected && toggleYear(year)}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => !isOnlySelected && toggleYear(year)}
                  disabled={isOnlySelected}
                  className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <span className="flex-1 text-sm">
                  {year}
                  {isCurrent && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      (ปีปัจจุบัน)
                    </span>
                  )}
                </span>
                {isSelected && (
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 px-4 py-3 border-t">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8"
            onClick={handleSelectAll}
          >
            ทุกปี
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8"
            onClick={handleResetToCurrentYear}
          >
            ปีปัจจุบัน
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
