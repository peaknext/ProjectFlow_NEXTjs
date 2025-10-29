"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DateInput } from "@/components/ui/date-picker-popover";
import { Filter } from "lucide-react";
import { useWorkspace } from "@/hooks/use-workspace";
import { useUIStore } from "@/stores/use-ui-store";
import { formatDateForAPI, getFiscalYearStartDate } from "@/hooks/use-reports";
import type { ReportFilters } from "@/hooks/use-reports";

interface ReportToolbarProps {
  filters: ReportFilters;
  onFiltersChange: (filters: ReportFilters) => void;
}

export function ReportToolbar({
  filters,
  onFiltersChange,
}: ReportToolbarProps) {
  // State for mobile filter toggle (from global UI store)
  const isFilterOpen = useUIStore((state) => state.isReportFilterOpen);

  // Fetch workspace data (filtered by user's scope)
  const { data: workspace } = useWorkspace();

  // Extract mission groups, divisions, and departments from workspace
  const missionGroups = workspace?.hierarchical || [];
  const allDivisions = missionGroups.flatMap((mg) =>
    (mg.divisions || []).map((div) => ({
      ...div,
      missionGroupId: mg.id,
    }))
  );
  const allDepartments = allDivisions.flatMap((div) =>
    (div.departments || []).map((dept) => ({
      ...dept,
      divisionId: div.id,
    }))
  );

  // Local state for date inputs - NO defaults, let user choose dates
  const [startDate, setStartDate] = useState(filters.startDate || "");
  const [endDate, setEndDate] = useState(filters.endDate || "");

  // Filter divisions and departments based on selections
  const filteredDivisions = filters.missionGroupId
    ? allDivisions.filter((d) => d.missionGroupId === filters.missionGroupId)
    : allDivisions;

  const filteredDepartments = filters.divisionId
    ? allDepartments.filter((d) => d.divisionId === filters.divisionId)
    : allDepartments;

  // Handle date changes (apply immediately)
  const handleStartDateChange = (date: string | null) => {
    const newStartDate = date || "";
    setStartDate(newStartDate);

    // Validate date range
    if (new Date(newStartDate) <= new Date(endDate)) {
      onFiltersChange({
        ...filters,
        startDate: newStartDate,
        endDate,
      });
    }
  };

  const handleEndDateChange = (date: string | null) => {
    const newEndDate = date || "";
    setEndDate(newEndDate);

    // Validate date range
    if (new Date(startDate) <= new Date(newEndDate)) {
      onFiltersChange({
        ...filters,
        startDate,
        endDate: newEndDate,
      });
    }
  };

  const handleMissionGroupChange = (value: string) => {
    const newFilters: ReportFilters = {
      ...filters,
      missionGroupId: value === "all" ? undefined : value,
      divisionId: undefined, // Reset dependent filters
      departmentId: undefined,
    };
    onFiltersChange(newFilters);
  };

  const handleDivisionChange = (value: string) => {
    const newFilters: ReportFilters = {
      ...filters,
      divisionId: value === "all" ? undefined : value,
      departmentId: undefined, // Reset dependent filter
    };
    onFiltersChange(newFilters);
  };

  const handleDepartmentChange = (value: string) => {
    const newFilters: ReportFilters = {
      ...filters,
      departmentId: value === "all" ? undefined : value,
    };
    onFiltersChange(newFilters);
  };

  return (
    <>
      {/* Desktop - Always Visible */}
      <div className="max-md:hidden bg-card border-b flex flex-col gap-4 px-6 py-4 flex-shrink-0">
        {/* Header: Title and Description */}
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">รายงาน</h1>
          <p className="text-sm text-muted-foreground mt-1">ภาพรวมและสถิติ</p>
        </div>

        {/* Filters Section */}
        <div className="flex items-center flex-wrap gap-3">
        {/* Start Date */}
        <div className="flex flex-col gap-1">
          <Label htmlFor="start-date" className="text-xs text-muted-foreground">
            วันที่เริ่มต้น
          </Label>
          <DateInput
            value={startDate}
            onChange={handleStartDateChange}
            placeholder="เลือกวันที่เริ่มต้น"
            className="w-full md:w-[200px] h-10"
          />
        </div>

        {/* End Date */}
        <div className="flex flex-col gap-1">
          <Label htmlFor="end-date" className="text-xs text-muted-foreground">
            วันที่สิ้นสุด
          </Label>
          <DateInput
            value={endDate}
            onChange={handleEndDateChange}
            placeholder="เลือกวันที่สิ้นสุด"
            className="w-full md:w-[200px] h-10"
          />
        </div>

        {/* Mission Group */}
        <div className="flex flex-col gap-1">
          <Label
            htmlFor="mission-group"
            className="text-xs text-muted-foreground"
          >
            กลุ่มภารกิจ
          </Label>
          <Select
            value={filters.missionGroupId || "all"}
            onValueChange={handleMissionGroupChange}
          >
            <SelectTrigger id="mission-group" className="w-full md:w-[200px] h-10">
              <SelectValue placeholder="ทั้งหมด" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทั้งหมด</SelectItem>
              {missionGroups.map((mg) => (
                <SelectItem key={mg.id} value={mg.id}>
                  {mg.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Division */}
        <div className="flex flex-col gap-1">
          <Label htmlFor="division" className="text-xs text-muted-foreground">
            กลุ่มงาน
          </Label>
          <Select
            value={filters.divisionId || "all"}
            onValueChange={handleDivisionChange}
            disabled={!filters.missionGroupId}
          >
            <SelectTrigger id="division" className="w-full md:w-[200px] h-10">
              <SelectValue placeholder="ทั้งหมด" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทั้งหมด</SelectItem>
              {filteredDivisions.map((div) => (
                <SelectItem key={div.id} value={div.id}>
                  {div.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Department */}
        <div className="flex flex-col gap-1">
          <Label htmlFor="department" className="text-xs text-muted-foreground">
            หน่วยงาน
          </Label>
          <Select
            value={filters.departmentId || "all"}
            onValueChange={handleDepartmentChange}
            disabled={!filters.divisionId}
          >
            <SelectTrigger id="department" className="w-[200px] h-10">
              <SelectValue placeholder="ทั้งหมด" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทั้งหมด</SelectItem>
              {filteredDepartments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        </div>
      </div>

      {/* Mobile - Toggle with Animation */}
      <div
        className={`
          md:hidden bg-card border-b flex flex-col px-4 flex-shrink-0
          transition-all duration-300 ease-in-out
          ${isFilterOpen
            ? "gap-4 py-3 max-h-[1000px] opacity-100"
            : "gap-0 py-0 max-h-0 opacity-0 overflow-hidden"
          }
        `}
      >
        {/* Filters Section - Mobile */}
        <div className="grid grid-cols-1 gap-3">
          {/* Start Date */}
          <div className="flex flex-col gap-1">
            <Label htmlFor="start-date-mobile" className="text-xs text-muted-foreground">
              วันที่เริ่มต้น
            </Label>
            <DateInput
              value={startDate}
              onChange={handleStartDateChange}
              placeholder="เลือกวันที่เริ่มต้น"
              className="w-full h-10"
            />
          </div>

          {/* End Date */}
          <div className="flex flex-col gap-1">
            <Label htmlFor="end-date-mobile" className="text-xs text-muted-foreground">
              วันที่สิ้นสุด
            </Label>
            <DateInput
              value={endDate}
              onChange={handleEndDateChange}
              placeholder="เลือกวันที่สิ้นสุด"
              className="w-full h-10"
            />
          </div>

          {/* Mission Group */}
          <div className="flex flex-col gap-1">
            <Label
              htmlFor="mission-group-mobile"
              className="text-xs text-muted-foreground"
            >
              กลุ่มภารกิจ
            </Label>
            <Select
              value={filters.missionGroupId || "all"}
              onValueChange={handleMissionGroupChange}
            >
              <SelectTrigger id="mission-group-mobile" className="w-full h-10">
                <SelectValue placeholder="ทั้งหมด" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                {missionGroups.map((mg) => (
                  <SelectItem key={mg.id} value={mg.id}>
                    {mg.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Division */}
          <div className="flex flex-col gap-1">
            <Label htmlFor="division-mobile" className="text-xs text-muted-foreground">
              กลุ่มงาน
            </Label>
            <Select
              value={filters.divisionId || "all"}
              onValueChange={handleDivisionChange}
              disabled={!filters.missionGroupId}
            >
              <SelectTrigger id="division-mobile" className="w-full h-10">
                <SelectValue placeholder="ทั้งหมด" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                {filteredDivisions.map((div) => (
                  <SelectItem key={div.id} value={div.id}>
                    {div.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Department */}
          <div className="flex flex-col gap-1">
            <Label htmlFor="department-mobile" className="text-xs text-muted-foreground">
              หน่วยงาน
            </Label>
            <Select
              value={filters.departmentId || "all"}
              onValueChange={handleDepartmentChange}
              disabled={!filters.divisionId}
            >
              <SelectTrigger id="department-mobile" className="w-full h-10">
                <SelectValue placeholder="ทั้งหมด" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                {filteredDepartments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </>
  );
}
