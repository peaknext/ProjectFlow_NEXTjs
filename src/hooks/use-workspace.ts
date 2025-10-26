/**
 * Workspace Hook
 * Fetch workspace structure based on user's role and permissions
 */

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { UserRole } from '@/generated/prisma';

// Workspace structure types
export interface WorkspaceProject {
  id: string;
  name: string;
  status: string;
  departmentId: string;
}

export interface WorkspaceDepartment {
  id: string;
  name: string;
  divisionId: string;
  projects: WorkspaceProject[];
}

export interface WorkspaceDivision {
  id: string;
  name: string;
  missionGroupId: string;
  departments: WorkspaceDepartment[];
}

export interface WorkspaceMissionGroup {
  id: string;
  name: string;
  divisions: WorkspaceDivision[];
}

// Flat workspace for MEMBER/HEAD/USER
export interface FlatWorkspaceItem {
  type: 'department' | 'project';
  id: string;
  name: string;
  parentName?: string; // Department name for projects
  metadata?: {
    departmentId?: string;
    status?: string;
  };
}

export interface WorkspaceData {
  viewType: 'hierarchical' | 'flat';
  userRole: UserRole;
  hierarchical?: WorkspaceMissionGroup[];
  flat?: FlatWorkspaceItem[];
  departmentName?: string; // For HEAD/MEMBER view
  divisionName?: string; // For LEADER view
  missionGroupName?: string; // For CHIEF view
}

/**
 * Query keys for workspace
 */
export const workspaceKeys = {
  all: ['workspace'] as const,
  detail: () => [...workspaceKeys.all, 'detail'] as const,
};

/**
 * Fetch workspace structure based on user permissions
 */
export function useWorkspace() {
  return useQuery({
    queryKey: workspaceKeys.detail(),
    queryFn: async (): Promise<WorkspaceData> => {
      const response = await api.get<{ workspace: WorkspaceData }>(
        '/api/workspace'
      );
      return response.workspace;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

/**
 * Transform hierarchical data to grouped projects for easy rendering
 * Used for HEAD/MEMBER view to group projects by department
 */
export function groupProjectsByDepartment(
  flat: FlatWorkspaceItem[]
): Map<string, WorkspaceProject[]> {
  const grouped = new Map<string, WorkspaceProject[]>();

  flat
    .filter((item) => item.type === 'project')
    .forEach((item) => {
      const deptName = item.parentName || 'อื่นๆ';
      const projects = grouped.get(deptName) || [];
      projects.push({
        id: item.id,
        name: item.name,
        status: item.metadata?.status || 'ACTIVE',
        departmentId: item.metadata?.departmentId || '',
      });
      grouped.set(deptName, projects);
    });

  return grouped;
}
