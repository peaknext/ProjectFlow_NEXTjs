"use client";

import { useState } from "react";
import { Search, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type {
  ServiceRequestType,
  RequestStatus,
} from "@/generated/prisma";
import type { ServiceRequestFilters } from "@/hooks/use-service-requests";

/**
 * Request List Filters Component
 *
 * Provides filtering controls for service requests:
 * - Type filter (DATA, PROGRAM, IT_ISSUE, All)
 * - Status filter (PENDING, APPROVED, etc., All)
 * - Fiscal year multi-select (from global store)
 * - Search input (by subject/description)
 * - My Requests toggle
 */

interface RequestListFiltersProps {
  filters: ServiceRequestFilters;
  onChange: (filters: ServiceRequestFilters) => void;
  onReset: () => void;
}

const typeOptions: { value: ServiceRequestType | "ALL"; label: string }[] = [
  { value: "ALL", label: "ทั้งหมด" },
  { value: "DATA", label: "ขอข้อมูล" },
  { value: "PROGRAM", label: "พัฒนาโปรแกรม" },
  { value: "IT_ISSUE", label: "แจ้งปัญหา IT" },
];

const statusOptions: { value: RequestStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "ทุกสถานะ" },
  { value: "PENDING", label: "รอการอนุมัติ" },
  { value: "APPROVED", label: "อนุมัติแล้ว" },
  { value: "REJECTED", label: "ไม่อนุมัติ" },
  { value: "IN_PROGRESS", label: "กำลังดำเนินการ" },
  { value: "COMPLETED", label: "เสร็จสิ้น" },
  { value: "CANCELLED", label: "ยกเลิก" },
];

export function RequestListFilters({
  filters,
  onChange,
  onReset,
}: RequestListFiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.search || "");

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
  };

  const handleSearchSubmit = () => {
    onChange({ ...filters, search: searchInput.trim() || undefined });
  };

  const handleSearchClear = () => {
    setSearchInput("");
    onChange({ ...filters, search: undefined });
  };

  const handleTypeChange = (value: string) => {
    onChange({
      ...filters,
      type: value === "ALL" ? undefined : (value as ServiceRequestType),
    });
  };

  const handleStatusChange = (value: string) => {
    onChange({
      ...filters,
      status: value === "ALL" ? undefined : (value as RequestStatus),
    });
  };

  const handleMyRequestsToggle = (checked: boolean) => {
    onChange({ ...filters, myRequests: checked });
  };

  // Count active filters
  const activeFiltersCount =
    (filters.type ? 1 : 0) +
    (filters.status ? 1 : 0) +
    (filters.search ? 1 : 0) +
    (filters.myRequests ? 1 : 0);

  return (
    <div className="space-y-4 rounded-lg border bg-card p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-medium">ตัวกรอง</h3>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {activeFiltersCount}
            </Badge>
          )}
        </div>
        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-8 text-xs"
          >
            ล้างตัวกรอง
          </Button>
        )}
      </div>

      {/* Search Input */}
      <div className="space-y-2">
        <Label>ค้นหา</Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="ค้นหาจากหัวข้อหรือรายละเอียด..."
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearchSubmit();
                }
              }}
              className="pl-9 pr-9"
            />
            {searchInput && (
              <button
                onClick={handleSearchClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button onClick={handleSearchSubmit} size="default">
            ค้นหา
          </Button>
        </div>
      </div>

      {/* Type Filter */}
      <div className="space-y-2">
        <Label>ประเภทคำร้อง</Label>
        <Select
          value={filters.type || "ALL"}
          onValueChange={handleTypeChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="เลือกประเภท" />
          </SelectTrigger>
          <SelectContent>
            {typeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Status Filter */}
      <div className="space-y-2">
        <Label>สถานะ</Label>
        <Select
          value={filters.status || "ALL"}
          onValueChange={handleStatusChange}
        >
          <SelectTrigger>
            <SelectValue placeholder="เลือกสถานะ" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* My Requests Toggle */}
      <div className="flex items-center justify-between pt-2">
        <Label htmlFor="my-requests" className="cursor-pointer">
          แสดงเฉพาะคำร้องของฉัน
        </Label>
        <Switch
          id="my-requests"
          checked={filters.myRequests || false}
          onCheckedChange={handleMyRequestsToggle}
        />
      </div>
    </div>
  );
}
