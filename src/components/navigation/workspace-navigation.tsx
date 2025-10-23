"use client";

/**
 * Workspace Navigation - Collapsible Cards with Icons
 * Modern, visual workspace navigation replacing tree view
 *
 * Features:
 * - Collapsible cards for Mission Groups and Divisions
 * - Icon-based visual hierarchy
 * - Click department name → navigate to department task view
 * - Click project name → navigate to project board view
 * - Badge counters showing number of projects
 * - Smooth expand/collapse animations
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  Building2,
  Briefcase,
  FolderKanban,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useWorkspace } from "@/hooks/use-workspace";
import { useNavigationStore } from "@/stores/use-navigation-store";
import type {
  WorkspaceMissionGroup,
  WorkspaceDivision,
  WorkspaceDepartment,
} from "@/hooks/use-workspace";

export function WorkspaceNavigation() {
  const router = useRouter();
  const { data: workspace, isLoading } = useWorkspace();
  const { setDepartment, setProject } = useNavigationStore();

  // Track expanded state for each level
  const [expandedMissionGroups, setExpandedMissionGroups] = useState<Set<string>>(
    new Set()
  );
  const [expandedDivisions, setExpandedDivisions] = useState<Set<string>>(new Set());
  const [expandedDepartments, setExpandedDepartments] = useState<Set<string>>(
    new Set()
  );

  // Toggle expand/collapse
  const toggleMissionGroup = (id: string) => {
    setExpandedMissionGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleDivision = (id: string) => {
    setExpandedDivisions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleDepartment = (id: string) => {
    setExpandedDepartments((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  /**
   * Navigate to department task view
   */
  const handleDepartmentClick = (
    department: WorkspaceDepartment,
    division: WorkspaceDivision,
    missionGroup: WorkspaceMissionGroup
  ) => {
    // Update navigation store
    setDepartment(
      department.id,
      department.name,
      division.id,
      division.name,
      missionGroup.id,
      missionGroup.name
    );

    // Navigate to department task view with departmentId query param
    router.push(`/department/tasks?departmentId=${department.id}`);
  };

  /**
   * Navigate to project list view (default task view)
   */
  const handleProjectClick = (
    projectId: string,
    projectName: string,
    department: WorkspaceDepartment,
    division: WorkspaceDivision,
    missionGroup: WorkspaceMissionGroup
  ) => {
    // Update navigation store with full hierarchy
    setProject(
      projectId,
      projectName,
      department.id,
      department.name,
      division.id,
      division.name,
      missionGroup.id,
      missionGroup.name
    );

    // Navigate to project list view (List is the default task view)
    router.push(`/projects/${projectId}/list`);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-3 p-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-10 bg-muted animate-pulse rounded-lg" />
            <div className="h-8 bg-muted/50 animate-pulse rounded-lg ml-4" />
          </div>
        ))}
      </div>
    );
  }

  // No workspace data
  if (!workspace) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        ไม่พบข้อมูล Workspace
      </div>
    );
  }

  // Flat view for MEMBER/HEAD/USER roles
  if (workspace.viewType === "flat") {
    return (
      <div className="space-y-1 p-2">
        {workspace.flat?.map((item) => {
          if (item.type === "project") {
            return (
              <button
                key={item.id}
                className="w-full min-w-0 flex items-start gap-2 px-3 py-2 rounded-md text-sm text-left transition-colors hover:bg-accent"
                onClick={() => router.push(`/projects/${item.id}/list`)}
              >
                <FolderKanban className="h-4 w-4 flex-shrink-0 text-muted-foreground mt-0.5" />
                <span className="flex-1 min-w-0 break-words">{item.name}</span>
              </button>
            );
          }
          return null;
        })}
      </div>
    );
  }

  // Hierarchical view for ADMIN/CHIEF/LEADER roles
  return (
    <div className="space-y-2 p-2">
      {workspace.hierarchical?.map((missionGroup) => {
        const isExpanded = expandedMissionGroups.has(missionGroup.id);
        const totalProjects = missionGroup.divisions.reduce(
          (sum, div) =>
            sum +
            div.departments.reduce((dSum, dept) => dSum + dept.projects.length, 0),
          0
        );

        return (
          <div key={missionGroup.id} className="space-y-1">
            {/* Mission Group Card */}
            <button
              onClick={() => toggleMissionGroup(missionGroup.id)}
              className={cn(
                "w-full flex items-start gap-2 px-3 py-2.5 rounded-lg transition-colors",
                "hover:bg-accent/50 group",
                isExpanded && "bg-accent/30"
              )}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground mt-0.5" />
              ) : (
                <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground mt-0.5" />
              )}
              <Target className="h-4 w-4 flex-shrink-0 text-primary mt-0.5" />
              <span className="flex-1 min-w-0 text-left text-sm font-semibold break-words">
                {missionGroup.name}
              </span>
              <Badge variant="secondary" className="text-xs flex-shrink-0 mt-0.5">
                {totalProjects}
              </Badge>
            </button>

            {/* Divisions (collapsible) */}
            {isExpanded && (
              <div className="ml-4 space-y-1 animate-in slide-in-from-top-2 duration-200">
                {missionGroup.divisions.map((division) => {
                  const isDivExpanded = expandedDivisions.has(division.id);
                  const divProjects = division.departments.reduce(
                    (sum, dept) => sum + dept.projects.length,
                    0
                  );

                  return (
                    <div key={division.id} className="space-y-1">
                      {/* Division Card */}
                      <button
                        onClick={() => toggleDivision(division.id)}
                        className={cn(
                          "w-full flex items-start gap-2 px-3 py-2 rounded-lg transition-colors",
                          "hover:bg-accent/50",
                          isDivExpanded && "bg-accent/30"
                        )}
                      >
                        {isDivExpanded ? (
                          <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground mt-0.5" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground mt-0.5" />
                        )}
                        <Briefcase className="h-3.5 w-3.5 flex-shrink-0 text-blue-500 mt-0.5" />
                        <span className="flex-1 min-w-0 text-left text-sm font-medium break-words">
                          {division.name}
                        </span>
                        <Badge variant="outline" className="text-xs flex-shrink-0 mt-0.5">
                          {divProjects}
                        </Badge>
                      </button>

                      {/* Departments (collapsible) */}
                      {isDivExpanded && (
                        <div className="ml-4 space-y-1 animate-in slide-in-from-top-2 duration-200">
                          {division.departments.map((department) => {
                            const isDeptExpanded = expandedDepartments.has(
                              department.id
                            );

                            return (
                              <div key={department.id} className="space-y-1">
                                {/* Department Card - Clickable to navigate to department task view */}
                                <div className="flex items-center gap-1">
                                  {/* Expand/collapse button (only if has projects) */}
                                  {department.projects.length > 0 && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 flex-shrink-0"
                                      onClick={() =>
                                        toggleDepartment(department.id)
                                      }
                                    >
                                      {isDeptExpanded ? (
                                        <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                      ) : (
                                        <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                      )}
                                    </Button>
                                  )}

                                  {/* Department name - clickable */}
                                  <button
                                    onClick={() =>
                                      handleDepartmentClick(
                                        department,
                                        division,
                                        missionGroup
                                      )
                                    }
                                    className={cn(
                                      "flex-1 min-w-0 flex items-start gap-2 px-3 py-2 rounded-lg transition-colors",
                                      "hover:bg-primary/10 hover:text-primary",
                                      department.projects.length === 0 && "ml-8"
                                    )}
                                  >
                                    <Building2 className="h-3.5 w-3.5 flex-shrink-0 text-orange-500 mt-0.5" />
                                    <span className="flex-1 min-w-0 text-left text-sm break-words">
                                      {department.name}
                                    </span>
                                    <Badge variant="outline" className="text-xs flex-shrink-0 mt-0.5">
                                      {department.projects.length}
                                    </Badge>
                                  </button>
                                </div>

                                {/* Projects List */}
                                {isDeptExpanded &&
                                  department.projects.length > 0 && (
                                    <div className="ml-8 space-y-0.5 animate-in slide-in-from-top-2 duration-200">
                                      {department.projects.map((project) => (
                                        <button
                                          key={project.id}
                                          className="w-full min-w-0 flex items-start gap-2 px-3 py-1.5 rounded-md text-xs text-left transition-colors hover:bg-primary/5 hover:text-primary"
                                          onClick={() =>
                                            handleProjectClick(
                                              project.id,
                                              project.name,
                                              department,
                                              division,
                                              missionGroup
                                            )
                                          }
                                        >
                                          <FolderKanban className="h-3 w-3 flex-shrink-0 text-muted-foreground mt-0.5" />
                                          <span className="flex-1 min-w-0 break-words">
                                            {project.name}
                                          </span>
                                        </button>
                                      ))}
                                    </div>
                                  )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
