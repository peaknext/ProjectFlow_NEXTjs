"use client";

/**
 * Breadcrumb Navigation Component
 * Multi-level navigation: Mission Group > Division > Department > Project
 *
 * Features:
 * - Displays hierarchical navigation path
 * - Clickable links to navigate back to parent levels
 * - Current level is non-clickable and highlighted
 * - Mission Group and Division are display-only (non-clickable)
 * - Project selector button after department name
 *
 * Pattern: Based on GAS renderBreadcrumb() function
 */

import { useRouter } from "next/navigation";
import { ChevronRight, FolderKanban } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBreadcrumbPath, useNavigationStore } from "@/stores/use-navigation-store";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";

interface Division {
  id: string;
  name: string;
  missionGroupId: string;
}

interface Department {
  id: string;
  name: string;
  divisionId: string;
}

interface Project {
  id: string;
  name: string;
  status?: string;
  departmentId: string;
}

interface MissionGroup {
  id: string;
  name: string;
  divisions: Array<Division & { departments: Department[] }>;
}

interface BreadcrumbProps {
  /**
   * Optional workspace data for selectors
   * If provided, shows selector buttons after each breadcrumb level
   */
  workspace?: {
    hierarchical?: MissionGroup[];
  };

  /**
   * Optional projects list for project selector
   * If provided, shows project selector button after department name
   */
  projects?: Array<{ id: string; name: string; status?: string }>;

  /**
   * Callback when project is selected from breadcrumb
   */
  onProjectSelect?: (projectId: string) => void;

  /**
   * Custom className
   */
  className?: string;
}

export function Breadcrumb({ workspace, projects, onProjectSelect, className }: BreadcrumbProps) {
  const router = useRouter();
  const { path, currentLevel } = useBreadcrumbPath();
  const navigation = useNavigationStore();
  const { navigateToLevel, setDepartment, setDivision, setProject } = useNavigationStore();

  /**
   * Handle breadcrumb link click
   * Navigate back to selected level
   */
  const handleBreadcrumbClick = async (
    level: "missionGroup" | "division" | "department" | "project",
    id: string,
    name: string
  ) => {
    // Don't navigate if clicking on current level
    if (level === currentLevel) {
      return;
    }

    // Mission Group and Division are non-clickable (display only)
    if (level === "missionGroup" || level === "division") {
      return;
    }

    // Navigate based on level
    switch (level) {
      case "department":
        // Navigate to department view
        setDepartment(id, name);
        router.push(`/department/tasks?id=${id}`);
        break;

      case "project":
        // Navigate to project list view (List is the default task view)
        setProject(id, name);
        router.push(`/projects/${id}/list`);
        break;
    }
  };

  /**
   * Handle division selection from breadcrumb selector
   */
  const handleDivisionSelect = (divisionId: string, divisionName: string, missionGroupId: string, missionGroupName: string) => {
    setDivision(divisionId, divisionName, missionGroupId, missionGroupName);
    router.push(`/division/tasks?id=${divisionId}`);
  };

  /**
   * Handle department selection from breadcrumb selector
   */
  const handleDepartmentSelect = (departmentId: string, departmentName: string) => {
    // Get division and mission group from current navigation state
    const division = workspace?.hierarchical
      ?.flatMap(mg => mg.divisions)
      .find(div => div.departments.some(dept => dept.id === departmentId));

    const missionGroup = workspace?.hierarchical?.find(mg =>
      mg.divisions.some(div => div.departments.some(dept => dept.id === departmentId))
    );

    if (division && missionGroup) {
      setDepartment(
        departmentId,
        departmentName,
        division.id,
        division.name,
        missionGroup.id,
        missionGroup.name
      );
    } else {
      setDepartment(departmentId, departmentName);
    }
    router.push(`/department/tasks?departmentId=${departmentId}`);
  };

  /**
   * Handle project selection from breadcrumb selector
   */
  const handleProjectSelectorSelect = (projectId: string) => {
    if (onProjectSelect) {
      onProjectSelect(projectId);
    } else {
      // Default behavior: navigate to project list view (List is the default task view)
      const project = projects?.find((p) => p.id === projectId);
      if (project) {
        setProject(projectId, project.name);
        router.push(`/projects/${projectId}/list`);
      }
    }
  };

  /**
   * Get divisions list for current mission group
   */
  const getDivisionsForMissionGroup = (missionGroupId: string): Division[] => {
    const missionGroup = workspace?.hierarchical?.find(mg => mg.id === missionGroupId);
    return missionGroup?.divisions || [];
  };

  /**
   * Get departments list for current division
   */
  const getDepartmentsForDivision = (divisionId: string): Department[] => {
    const division = workspace?.hierarchical
      ?.flatMap(mg => mg.divisions)
      .find(div => div.id === divisionId);
    return division?.departments || [];
  };

  // If no path, don't render breadcrumb
  if (path.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
      {path.map((item, index) => {
        const isCurrentLevel = item.level === currentLevel;
        const isNonClickable = item.level === "missionGroup" || item.level === "division";
        const isLast = index === path.length - 1;

        // Determine what selector to show after this item
        let selectorType: 'division' | 'department' | 'project' | null = null;
        let selectorData: any[] = [];

        if (item.level === "missionGroup" && workspace) {
          // Show division selector after mission group
          selectorType = 'division';
          selectorData = getDivisionsForMissionGroup(item.id);
        } else if (item.level === "division" && workspace) {
          // Show department selector after division
          selectorType = 'department';
          selectorData = getDepartmentsForDivision(item.id);
        } else if (item.level === "department" && projects && projects.length > 0) {
          // Show project selector after department
          selectorType = 'project';
          selectorData = projects;
        }

        const showSelector = selectorType && selectorData.length > 0;

        // Debug department item
        if (item.level === "department") {
          console.log('🔍 Department breadcrumb:', {
            itemName: item.name,
            hasProjects: !!projects,
            projectsLength: projects?.length,
            projectsData: projects,
            selectorType,
            selectorDataLength: selectorData.length,
            showSelector
          });
        }

        return (
          <div key={item.id} className="flex items-center gap-2">
            {/* Breadcrumb Item */}
            {isNonClickable || isCurrentLevel ? (
              // Non-clickable: Mission Group, Division, or current level
              <span
                className={cn(
                  "font-medium",
                  isCurrentLevel && "text-foreground font-semibold"
                )}
              >
                {item.name}
              </span>
            ) : (
              // Clickable: Department or Project (if not current)
              <button
                onClick={() => handleBreadcrumbClick(item.level, item.id, item.name)}
                className="font-medium hover:text-primary transition-colors hover:underline"
              >
                {item.name}
              </button>
            )}

            {/* Selector Button (Division/Department/Project) */}
            {showSelector && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-full hover:bg-muted text-muted-foreground hover:text-primary"
                  >
                    <ChevronRight className="h-4 w-4" />
                    <span className="sr-only">
                      {selectorType === 'division' && 'เลือกกลุ่มงาน'}
                      {selectorType === 'department' && 'เลือกหน่วยงาน'}
                      {selectorType === 'project' && 'เลือกโปรเจค'}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder={
                        selectorType === 'division' ? 'ค้นหากลุ่มงาน...' :
                        selectorType === 'department' ? 'ค้นหาหน่วยงาน...' :
                        'ค้นหาโปรเจค...'
                      }
                    />
                    <CommandEmpty>
                      {selectorType === 'division' && 'ไม่พบกลุ่มงาน'}
                      {selectorType === 'department' && 'ไม่พบหน่วยงาน'}
                      {selectorType === 'project' && 'ไม่พบโปรเจค'}
                    </CommandEmpty>
                    <CommandGroup className="max-h-[300px] overflow-y-auto">
                      {selectorType === 'division' && (selectorData as Division[]).map((division) => (
                        <CommandItem
                          key={division.id}
                          value={division.name}
                          onSelect={() => {
                            const mg = workspace?.hierarchical?.find(mg => mg.id === division.missionGroupId);
                            if (mg) {
                              handleDivisionSelect(division.id, division.name, mg.id, mg.name);
                            }
                          }}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <span className="flex-1">{division.name}</span>
                        </CommandItem>
                      ))}
                      {selectorType === 'department' && (selectorData as Department[]).map((department) => (
                        <CommandItem
                          key={department.id}
                          value={department.name}
                          onSelect={() => handleDepartmentSelect(department.id, department.name)}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <span className="flex-1">{department.name}</span>
                        </CommandItem>
                      ))}
                      {selectorType === 'project' && (selectorData as Project[]).map((project) => (
                        <CommandItem
                          key={project.id}
                          value={project.name}
                          onSelect={() => handleProjectSelectorSelect(project.id)}
                          className="cursor-pointer"
                        >
                          {project.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            )}

            {/* Separator (only if no selector) */}
            {!isLast && !showSelector && (
              <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Breadcrumb with auto-loaded projects
 * Automatically fetches projects for current department
 */
export function BreadcrumbWithProjects(props: Omit<BreadcrumbProps, "projects">) {
  const navigation = useNavigationStore();
  // TODO: Add useQuery to fetch projects for current department
  // const { data: projects } = useQuery({
  //   queryKey: ['department-projects', navigation.departmentId],
  //   queryFn: () => api.get(`/api/departments/${navigation.departmentId}/projects`),
  //   enabled: !!navigation.departmentId,
  // });

  // For now, return basic breadcrumb
  // Will add projects fetching in next iteration
  return <Breadcrumb {...props} projects={[]} />;
}
