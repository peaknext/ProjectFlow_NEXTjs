/**
 * DepartmentToolbar - Toolbar for department tasks view
 * Contains breadcrumb, title, and create task button
 */

'use client';

import { useMemo } from 'react';
import { CreateTaskButton } from '@/components/common/create-task-button';
import { Breadcrumb } from '@/components/navigation/breadcrumb';
import { useWorkspace } from '@/hooks/use-workspace';
import { useNavigationStore } from '@/stores/use-navigation-store';

interface DepartmentToolbarProps {
  /**
   * Optional title override (defaults to "งานในหน่วยงาน")
   */
  title?: string;
  /**
   * Current department ID (optional - will use from navigation store if not provided)
   */
  departmentId?: string;
}

export function DepartmentToolbar({ title = 'งานในหน่วยงาน', departmentId: propDepartmentId }: DepartmentToolbarProps) {
  // Fetch workspace data for breadcrumb selectors
  const { data: workspaceData } = useWorkspace();

  // Get department from navigation store or props
  const { department: navDepartment } = useNavigationStore();
  const currentDepartmentId = propDepartmentId || navDepartment?.id;

  // Filter projects to only show those from the current department
  const departmentProjects = useMemo(() => {
    if (!workspaceData?.hierarchical || !currentDepartmentId) {
      console.log('[DepartmentToolbar] No workspace data or departmentId:', {
        hasWorkspace: !!workspaceData?.hierarchical,
        currentDepartmentId,
      });
      return [];
    }

    // Find the current department and extract its projects
    for (const mg of workspaceData.hierarchical) {
      for (const div of mg.divisions) {
        for (const dept of div.departments) {
          if (dept.id === currentDepartmentId) {
            console.log('[DepartmentToolbar] Found department projects:', {
              departmentId: dept.id,
              departmentName: dept.name,
              projectCount: dept.projects.length,
            });
            return dept.projects;
          }
        }
      }
    }

    console.log('[DepartmentToolbar] Department not found:', currentDepartmentId);
    return [];
  }, [workspaceData, currentDepartmentId]);

  return (
    <div className="bg-card border-b flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-6 py-4 flex-shrink-0">
      {/* Left side: Breadcrumb and Title */}
      <div className="min-w-0">
        {/* Breadcrumb Navigation */}
        <Breadcrumb
          className="mb-1"
          workspace={workspaceData}
          projects={departmentProjects}
        />

        {/* Title */}
        <h1 className="text-2xl font-bold">{title}</h1>
      </div>

      {/* Right side: Create Button */}
      <div className="flex items-center gap-2 sm:gap-4 w-full md:w-auto justify-end">
        <CreateTaskButton
          departmentId={currentDepartmentId}
          availableProjects={departmentProjects}
        />
      </div>
    </div>
  );
}
