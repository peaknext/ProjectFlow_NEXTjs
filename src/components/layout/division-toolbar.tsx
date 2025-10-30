/**
 * DivisionToolbar - Toolbar for division overview page
 * Contains breadcrumb, title, and filter controls
 */

"use client";

import { useMemo } from "react";
import { Breadcrumb } from "@/components/navigation/breadcrumb";
import { useWorkspace } from "@/hooks/use-workspace";
import { useNavigationStore } from "@/stores/use-navigation-store";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { DivisionFilters } from "@/types/division";

interface DivisionToolbarProps {
  /**
   * Optional title override (defaults to "งานในกลุ่มงาน")
   */
  title?: string;
  /**
   * Current division ID (optional - will use from navigation store if not provided)
   */
  divisionId?: string;
  /**
   * Current filters
   */
  filters: DivisionFilters;
  /**
   * Filter change handler
   */
  onFiltersChange: (filters: DivisionFilters) => void;
}

export function DivisionToolbar({
  title = "สถิติงานในกลุ่มงาน",
  divisionId: propDivisionId,
  filters,
  onFiltersChange,
}: DivisionToolbarProps) {
  // Fetch workspace data for breadcrumb selectors
  const { data: workspaceData } = useWorkspace();

  // Get division from navigation store or props
  const { divisionId: navDivisionId } = useNavigationStore();
  const currentDivisionId = propDivisionId || navDivisionId;

  // Filter projects to only show those from the current division
  const divisionProjects = useMemo(() => {
    if (!workspaceData?.hierarchical || !currentDivisionId) {
      return [];
    }

    // Find the current division and extract all projects from all departments
    const projects: any[] = [];
    for (const mg of workspaceData.hierarchical) {
      for (const div of mg.divisions) {
        if (div.id === currentDivisionId) {
          for (const dept of div.departments) {
            projects.push(...dept.projects);
          }
          break;
        }
      }
    }

    return projects;
  }, [workspaceData, currentDivisionId]);

  // Handle hide closed toggle
  const handleHideClosedChange = (checked: boolean) => {
    onFiltersChange({
      ...filters,
      includeCompleted: !checked, // Invert: checked = hide, unchecked = show
    });
  };

  return (
    <div className="bg-card border-b flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-6 py-4 flex-shrink-0">
      {/* Left side: Breadcrumb and Title */}
      <div className="min-w-0">
        {/* Breadcrumb Navigation */}
        <Breadcrumb
          className="mb-1"
          workspace={workspaceData}
          projects={divisionProjects}
        />

        {/* Title */}
        <h1 className="text-2xl font-bold">{title}</h1>
      </div>

      {/* Right side: Filter Controls */}
      <div className="flex items-center gap-2 sm:gap-4 w-full md:w-auto justify-end flex-wrap">
        {/* Hide Closed Tasks Toggle */}
        <div className="flex items-center gap-2">
          <Label
            htmlFor="hide-closed-division"
            className="text-sm cursor-pointer whitespace-nowrap"
          >
            ซ่อนงานที่ปิดแล้ว
          </Label>
          <Switch
            id="hide-closed-division"
            checked={!filters.includeCompleted}
            onCheckedChange={handleHideClosedChange}
          />
        </div>
      </div>
    </div>
  );
}
