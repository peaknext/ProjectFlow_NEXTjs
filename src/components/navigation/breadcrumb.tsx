"use client";

/**
 * Breadcrumb Navigation Component
 * Multi-level navigation: Mission Group > Division > Department > Project
 *
 * Features:
 * - Displays hierarchical navigation path
 * - Clickable links to navigate back to parent levels (role-based)
 * - Current level is non-clickable and highlighted
 * - Role-based access control for breadcrumb items and selectors
 *
 * Role-based permissions:
 * - USER: No clickable items, no selectors
 * - MEMBER/HEAD: Department clickable, Department selector only
 * - LEADER: Department + Division clickable, Department + Division selectors
 * - CHIEF/ADMIN: All clickable, All selectors (including Mission Group)
 *
 * Pattern: Based on GAS renderBreadcrumb() function
 */

import { useRouter } from "next/navigation";
import { ChevronRight, FolderKanban } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useBreadcrumbPath,
  useNavigationStore,
} from "@/stores/use-navigation-store";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";

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

/**
 * Helper: Check if breadcrumb level is clickable based on user role
 */
function canClickLevel(
  role: string | undefined,
  level: "missionGroup" | "division" | "department" | "project"
): boolean {
  if (!role) return false;

  // USER: Cannot click anything
  if (role === "USER") return false;

  // MEMBER, HEAD: Can click department and project only
  if (role === "MEMBER" || role === "HEAD") {
    return level === "department" || level === "project";
  }

  // LEADER: Can click division, department, and project
  if (role === "LEADER") {
    return level === "division" || level === "department" || level === "project";
  }

  // CHIEF, ADMIN: Can click everything except mission group (display only)
  if (role === "CHIEF" || role === "ADMIN") {
    return level !== "missionGroup";
  }

  return false;
}

/**
 * Helper: Check if selector should be shown after level based on user role
 */
function canShowSelector(
  role: string | undefined,
  level: "missionGroup" | "division" | "department" | "project"
): boolean {
  if (!role) return false;

  // USER: No selectors
  if (role === "USER") return false;

  // MEMBER, HEAD: Department selector only
  if (role === "MEMBER" || role === "HEAD") {
    return level === "department";
  }

  // LEADER: Division and Department selectors
  if (role === "LEADER") {
    return level === "division" || level === "department";
  }

  // CHIEF, ADMIN: All selectors (Mission Group, Division, Department)
  if (role === "CHIEF" || role === "ADMIN") {
    return level === "missionGroup" || level === "division" || level === "department";
  }

  return false;
}

export function Breadcrumb({
  workspace,
  projects,
  onProjectSelect,
  className,
}: BreadcrumbProps) {
  const router = useRouter();
  const { path, currentLevel } = useBreadcrumbPath();
  const navigation = useNavigationStore();
  const { navigateToLevel, setDepartment, setDivision, setProject } =
    useNavigationStore();
  const { user } = useAuth();

  /**
   * Handle breadcrumb link click
   * Navigate back to selected level (with role-based permission check)
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

    // Check role-based permission
    if (!canClickLevel(user?.role, level)) {
      return;
    }

    // Navigate based on level
    switch (level) {
      case "division":
        // Navigate to division overview
        router.push(`/division/overview`);
        break;

      case "department":
        // Navigate to department view
        setDepartment(id, name);
        router.push(`/department/tasks?departmentId=${id}`);
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
  const handleDivisionSelect = (
    divisionId: string,
    divisionName: string,
    missionGroupId: string,
    missionGroupName: string
  ) => {
    setDivision(divisionId, divisionName, missionGroupId, missionGroupName);
    router.push(`/division/overview`);
  };

  /**
   * Handle department selection from breadcrumb selector
   */
  const handleDepartmentSelect = (
    departmentId: string,
    departmentName: string
  ) => {
    // Get division and mission group from current navigation state
    const division = workspace?.hierarchical
      ?.flatMap((mg) => mg.divisions)
      .find((div) => div.departments.some((dept) => dept.id === departmentId));

    const missionGroup = workspace?.hierarchical?.find((mg) =>
      mg.divisions.some((div) =>
        div.departments.some((dept) => dept.id === departmentId)
      )
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
    const missionGroup = workspace?.hierarchical?.find(
      (mg) => mg.id === missionGroupId
    );
    return missionGroup?.divisions || [];
  };

  /**
   * Get departments list for current division
   */
  const getDepartmentsForDivision = (divisionId: string): Department[] => {
    const division = workspace?.hierarchical
      ?.flatMap((mg) => mg.divisions)
      .find((div) => div.id === divisionId);
    return division?.departments || [];
  };

  // If no path, don't render breadcrumb
  if (path.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 text-sm text-muted-foreground",
        className
      )}
    >
      {path.map((item, index) => {
        const isCurrentLevel = item.level === currentLevel;
        const isClickable = canClickLevel(user?.role, item.level) && !isCurrentLevel;
        const isLast = index === path.length - 1;

        // Determine what selector to show after this item (role-based)
        let selectorType: "division" | "department" | "project" | null = null;
        let selectorData: any[] = [];

        if (item.level === "missionGroup" && workspace && canShowSelector(user?.role, "missionGroup")) {
          // Show division selector after mission group (CHIEF/ADMIN only)
          selectorType = "division";
          selectorData = getDivisionsForMissionGroup(item.id);
        } else if (item.level === "division" && workspace && canShowSelector(user?.role, "division")) {
          // Show department selector after division (LEADER/CHIEF/ADMIN)
          selectorType = "department";
          selectorData = getDepartmentsForDivision(item.id);
        } else if (
          item.level === "department" &&
          projects &&
          projects.length > 0 &&
          canShowSelector(user?.role, "department")
        ) {
          // Show project selector after department (MEMBER/HEAD/LEADER/CHIEF/ADMIN)
          selectorType = "project";
          selectorData = projects;
        }

        const showSelector = selectorType && selectorData.length > 0;

        return (
          <div key={item.id} className="flex items-center gap-2">
            {/* Breadcrumb Item */}
            {isClickable ? (
              // Clickable: Based on role permission
              <button
                onClick={() =>
                  handleBreadcrumbClick(item.level, item.id, item.name)
                }
                className="font-medium hover:text-primary transition-colors hover:underline"
              >
                {item.name}
              </button>
            ) : (
              // Non-clickable: No permission or current level
              <span
                className={cn(
                  "font-medium",
                  isCurrentLevel && "text-foreground font-semibold"
                )}
              >
                {item.name}
              </span>
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
                      {selectorType === "division" && "เลือกกลุ่มงาน"}
                      {selectorType === "department" && "เลือกหน่วยงาน"}
                      {selectorType === "project" && "เลือกโปรเจกต์"}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder={
                        selectorType === "division"
                          ? "ค้นหากลุ่มงาน..."
                          : selectorType === "department"
                            ? "ค้นหาหน่วยงาน..."
                            : "ค้นหาโปรเจกต์..."
                      }
                    />
                    <CommandEmpty>
                      {selectorType === "division" && "ไม่พบกลุ่มงาน"}
                      {selectorType === "department" && "ไม่พบหน่วยงาน"}
                      {selectorType === "project" && "ไม่พบโปรเจกต์"}
                    </CommandEmpty>
                    <CommandGroup className="max-h-[300px] overflow-y-auto">
                      {selectorType === "division" &&
                        (selectorData as Division[]).map((division) => (
                          <CommandItem
                            key={division.id}
                            value={division.name}
                            onSelect={() => {
                              const mg = workspace?.hierarchical?.find(
                                (mg) => mg.id === division.missionGroupId
                              );
                              if (mg) {
                                handleDivisionSelect(
                                  division.id,
                                  division.name,
                                  mg.id,
                                  mg.name
                                );
                              }
                            }}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <span className="flex-1">{division.name}</span>
                          </CommandItem>
                        ))}
                      {selectorType === "department" &&
                        (selectorData as Department[]).map((department) => (
                          <CommandItem
                            key={department.id}
                            value={department.name}
                            onSelect={() =>
                              handleDepartmentSelect(
                                department.id,
                                department.name
                              )
                            }
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <span className="flex-1">{department.name}</span>
                          </CommandItem>
                        ))}
                      {selectorType === "project" &&
                        (selectorData as Project[]).map((project) => (
                          <CommandItem
                            key={project.id}
                            value={project.name}
                            onSelect={() =>
                              handleProjectSelectorSelect(project.id)
                            }
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
export function BreadcrumbWithProjects(
  props: Omit<BreadcrumbProps, "projects">
) {
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
