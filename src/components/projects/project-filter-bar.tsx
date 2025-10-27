"use client";

import { useState, useEffect } from "react";
import { Search, X, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useWorkspace } from "@/hooks/use-workspace";
import type { ProjectFilters } from "@/types/project";

interface PopoverState {
  missionGroup: boolean;
  division: boolean;
  department: boolean;
}

interface ProjectFilterBarProps {
  filters: ProjectFilters;
  onFiltersChange: (filters: ProjectFilters) => void;
  onClearFilters: () => void;
  totalCount: number;
  filteredCount: number;
}

export function ProjectFilterBar({
  filters,
  onFiltersChange,
  onClearFilters,
  totalCount,
  filteredCount,
}: ProjectFilterBarProps) {
  const { data: workspace } = useWorkspace();
  const [searchValue, setSearchValue] = useState(filters.searchQuery);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(
    null
  );
  const [popoverOpen, setPopoverOpen] = useState<PopoverState>({
    missionGroup: false,
    division: false,
    department: false,
  });

  // Debounced search
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      onFiltersChange({ ...filters, searchQuery: searchValue });
    }, 300);

    setSearchTimeout(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue]);

  // Get filter options from hierarchical structure
  const missionGroups = workspace?.hierarchical || [];

  // Flatten divisions from all mission groups
  const divisions = missionGroups.flatMap((mg) =>
    (mg.divisions || []).map((div) => ({
      ...div,
      missionGroupId: mg.id,
    }))
  );

  // Flatten departments from all divisions
  const departments = divisions.flatMap((div) =>
    (div.departments || []).map((dept) => ({
      ...dept,
      divisionId: div.id,
    }))
  );

  // Filter cascading (Division depends on MG, Department depends on Division)
  const availableDivisions = filters.missionGroupId
    ? divisions.filter((d) => d.missionGroupId === filters.missionGroupId)
    : divisions;

  const availableDepartments = filters.divisionId
    ? departments.filter((d) => d.divisionId === filters.divisionId)
    : filters.missionGroupId
      ? departments.filter((d) => {
          const division = divisions.find((div) => div.id === d.divisionId);
          return division?.missionGroupId === filters.missionGroupId;
        })
      : departments;

  // Get selected names
  const selectedMissionGroup = missionGroups.find(
    (mg) => mg.id === filters.missionGroupId
  );
  const selectedDivision = divisions.find((d) => d.id === filters.divisionId);
  const selectedDepartment = departments.find(
    (d) => d.id === filters.departmentId
  );

  // Handlers
  const handleMissionGroupChange = (mgId: string | null) => {
    onFiltersChange({
      ...filters,
      missionGroupId: mgId,
      divisionId: null, // Reset cascade
      departmentId: null,
    });
    setPopoverOpen({ ...popoverOpen, missionGroup: false });
  };

  const handleDivisionChange = (divId: string | null) => {
    onFiltersChange({
      ...filters,
      divisionId: divId,
      departmentId: null, // Reset cascade
    });
    setPopoverOpen({ ...popoverOpen, division: false });
  };

  const handleDepartmentChange = (deptId: string | null) => {
    onFiltersChange({
      ...filters,
      departmentId: deptId,
    });
    setPopoverOpen({ ...popoverOpen, department: false });
  };

  const hasActiveFilters =
    filters.missionGroupId ||
    filters.divisionId ||
    filters.departmentId ||
    filters.searchQuery;

  return (
    <div className="bg-card rounded-lg border border-border p-4 mb-4">
      <div className="flex flex-wrap items-center gap-4 mb-4">
        {/* Mission Group Filter */}
        <div className="flex-shrink-0">
          <Label className="text-sm font-medium mb-2 block">กลุ่มภารกิจ</Label>
          <Popover
            open={popoverOpen.missionGroup}
            onOpenChange={(open) =>
              setPopoverOpen({ ...popoverOpen, missionGroup: open })
            }
          >
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-[240px] justify-between h-10 bg-white dark:bg-background"
              >
                <span className="truncate">
                  {selectedMissionGroup?.name || "ทั้งหมด"}
                </span>
                <Filter className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[240px] p-0" align="start">
              <div className="max-h-[300px] overflow-auto">
                <button
                  onClick={() => handleMissionGroupChange(null)}
                  className="w-full px-3 py-2 text-left hover:bg-accent transition-colors text-sm"
                >
                  ทั้งหมด
                </button>
                {missionGroups.map((mg) => (
                  <button
                    key={mg.id}
                    onClick={() => handleMissionGroupChange(mg.id)}
                    className="w-full px-3 py-2 text-left hover:bg-accent transition-colors text-sm"
                  >
                    {mg.name}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Division Filter */}
        <div className="flex-shrink-0">
          <Label className="text-sm font-medium mb-2 block">กลุ่มงาน</Label>
          <Popover
            open={popoverOpen.division}
            onOpenChange={(open) =>
              setPopoverOpen({ ...popoverOpen, division: open })
            }
          >
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-[240px] justify-between h-10 bg-white dark:bg-background"
                disabled={availableDivisions.length === 0}
              >
                <span className="truncate">
                  {selectedDivision?.name || "ทั้งหมด"}
                </span>
                <Filter className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[240px] p-0" align="start">
              <div className="max-h-[300px] overflow-auto">
                <button
                  onClick={() => handleDivisionChange(null)}
                  className="w-full px-3 py-2 text-left hover:bg-accent transition-colors text-sm"
                >
                  ทั้งหมด
                </button>
                {availableDivisions.map((div) => (
                  <button
                    key={div.id}
                    onClick={() => handleDivisionChange(div.id)}
                    className="w-full px-3 py-2 text-left hover:bg-accent transition-colors text-sm"
                  >
                    {div.name}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Department Filter */}
        <div className="flex-shrink-0">
          <Label className="text-sm font-medium mb-2 block">หน่วยงาน</Label>
          <Popover
            open={popoverOpen.department}
            onOpenChange={(open) =>
              setPopoverOpen({ ...popoverOpen, department: open })
            }
          >
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-[240px] justify-between h-10 bg-white dark:bg-background"
                disabled={availableDepartments.length === 0}
              >
                <span className="truncate">
                  {selectedDepartment?.name || "ทั้งหมด"}
                </span>
                <Filter className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[240px] p-0" align="start">
              <div className="max-h-[300px] overflow-auto">
                <button
                  onClick={() => handleDepartmentChange(null)}
                  className="w-full px-3 py-2 text-left hover:bg-accent transition-colors text-sm"
                >
                  ทั้งหมด
                </button>
                {availableDepartments.map((dept) => (
                  <button
                    key={dept.id}
                    onClick={() => handleDepartmentChange(dept.id)}
                    className="w-full px-3 py-2 text-left hover:bg-accent transition-colors text-sm"
                  >
                    {dept.name}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Search */}
        <div className="flex-1 min-w-[250px]">
          <Label className="text-sm font-medium mb-2 block">
            ค้นหาโปรเจกต์
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="ค้นหาชื่อโปรเจกต์..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
        </div>
      </div>

      {/* Filter Info */}
      <div className="flex items-center justify-between text-sm">
        <div className="text-muted-foreground">
          {hasActiveFilters ? (
            <>
              กำลังแสดง <span className="font-medium">{filteredCount}</span> จาก{" "}
              {totalCount} โปรเจกต์
            </>
          ) : (
            <>แสดงทั้งหมด {totalCount} โปรเจกต์</>
          )}
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-8"
          >
            <X className="mr-1 h-4 w-4" />
            ล้างตัวกรอง
          </Button>
        )}
      </div>
    </div>
  );
}
