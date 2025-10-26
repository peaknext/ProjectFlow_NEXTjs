"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface UsersPaginationProps {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export function UsersPagination({
  page,
  limit,
  total,
  totalPages,
  hasNext,
  hasPrev,
  onPageChange,
  onLimitChange,
}: UsersPaginationProps) {
  // Calculate pagination info
  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const showPages = new Set<number>();

    // Always show first page
    showPages.add(1);

    // Always show last page
    if (totalPages > 1) {
      showPages.add(totalPages);
    }

    // Show current page and adjacent pages
    for (
      let i = Math.max(1, page - 1);
      i <= Math.min(totalPages, page + 1);
      i++
    ) {
      showPages.add(i);
    }

    // Convert to sorted array
    const sortedPages = Array.from(showPages).sort((a, b) => a - b);

    // Build array with ellipsis
    for (let i = 0; i < sortedPages.length; i++) {
      const pageNum = sortedPages[i];

      // Add ellipsis if there's a gap
      if (i > 0 && sortedPages[i - 1] < pageNum - 1) {
        pages.push("...");
      }

      pages.push(pageNum);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="border-t border-border bg-card px-6 py-4 mt-4 rounded-b-lg">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left: Pagination info */}
        <div className="text-sm text-muted-foreground whitespace-nowrap">
          แสดง {startItem}-{endItem} จาก {total} รายการ
        </div>

        {/* Center: Page navigation */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(page - 1)}
            disabled={!hasPrev}
            className="h-9 w-9"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {pageNumbers.map((pageNum, index) => {
            if (pageNum === "...") {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="px-2 text-muted-foreground"
                >
                  ...
                </span>
              );
            }

            const num = pageNum as number;
            const isActive = num === page;

            return (
              <Button
                key={num}
                variant={isActive ? "default" : "outline"}
                size="icon"
                onClick={() => onPageChange(num)}
                disabled={isActive}
                className="h-9 w-9"
              >
                {num}
              </Button>
            );
          })}

          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(page + 1)}
            disabled={!hasNext}
            className="h-9 w-9"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Right: Page size selector */}
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span className="text-sm text-muted-foreground">แสดง</span>
          <Select
            value={limit.toString()}
            onValueChange={(value) => onLimitChange(parseInt(value, 10))}
          >
            <SelectTrigger className="w-[70px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">รายการ</span>
        </div>
      </div>
    </div>
  );
}
