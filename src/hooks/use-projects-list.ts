/**
 * React Query hook for fetching projects list
 * Used by Project Management page
 */

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { ProjectWithDetails } from "@/types/project";

export const projectsListKeys = {
  all: ["projects-list"] as const,
  lists: () => [...projectsListKeys.all, "list"] as const,
  list: () => [...projectsListKeys.lists()] as const,
};

interface ProjectsListResponse {
  projects: ProjectWithDetails[];
}

/**
 * Fetch all projects with details for project management page
 * @returns React Query result with projects array
 */
export function useProjectsList() {
  return useQuery({
    queryKey: projectsListKeys.list(),
    queryFn: async () => {
      const response = await api.get<ProjectsListResponse>(
        "/api/projects?includeDetails=true"
      );
      return response.projects;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
}
