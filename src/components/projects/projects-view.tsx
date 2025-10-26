"use client";

import { useState, useMemo } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useUIStore } from "@/stores/use-ui-store";
import { useProjectsList } from "@/hooks/use-projects-list";
import { ProjectFilterBar } from "./project-filter-bar";
import { ProjectsTable } from "./projects-table";
import { ProjectsPagination } from "./projects-pagination";
import { EditProjectModal } from "@/components/modals/edit-project-modal";
import { filterProjects, sortProjects } from "@/lib/project-utils";
import type { ProjectFilters } from "@/types/project";

export function ProjectsView() {
  const { user } = useAuth();
  const { data: projects = [], isLoading, error } = useProjectsList();

  // State
  const [filters, setFilters] = useState<ProjectFilters>({
    missionGroupId: null,
    divisionId: null,
    departmentId: null,
    searchQuery: "",
  });
  const [sortColumn, setSortColumn] = useState<"name" | "owner" | "phase">(
    "name"
  );
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Check if user can create projects
  const canCreateProject =
    user?.role && ["ADMIN", "CHIEF", "LEADER", "HEAD"].includes(user.role);

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    let result = filterProjects(projects, filters);
    result = sortProjects(result, sortColumn, sortDirection);
    return result;
  }, [projects, filters, sortColumn, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredProjects.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedProjects = filteredProjects.slice(startIndex, endIndex);

  // Handlers
  const handleSort = (column: "name" | "owner" | "phase") => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page
  };

  const handleFiltersChange = (newFilters: ProjectFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page
  };

  const handleClearFilters = () => {
    setFilters({
      missionGroupId: null,
      divisionId: null,
      departmentId: null,
      searchQuery: "",
    });
    setCurrentPage(1);
  };

  const openCreateProjectModal = useUIStore((state) => state.openCreateProjectModal);

  const handleCreateProject = () => {
    openCreateProjectModal();
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16">
        <span className="material-symbols-outlined text-6xl text-red-500 mb-4">
          error
        </span>
        <h3 className="text-xl font-semibold mb-2">เกิดข้อผิดพลาด</h3>
        <p className="text-muted-foreground text-center max-w-md">
          ไม่สามารถโหลดข้อมูลโปรเจคได้
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div>
          <h1 className="text-3xl font-bold">จัดการโปรเจค</h1>
          <p className="text-muted-foreground mt-1">
            จัดการและติดตามความคืบหน้าของโปรเจคทั้งหมด
          </p>
        </div>
        {canCreateProject && (
          <Button onClick={handleCreateProject} size="lg" className="px-8 py-6 text-lg">
            <Plus className="mr-2 h-6 w-6" />
            สร้างโปรเจค
          </Button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex-shrink-0 mb-4">
        <ProjectFilterBar
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
          totalCount={projects.length}
          filteredCount={filteredProjects.length}
        />
      </div>

      {/* Projects Table - Scrollable Area */}
      <div className="flex-1 min-h-0 mb-4">
        <ProjectsTable
          projects={paginatedProjects}
          isLoading={isLoading}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={handleSort}
        />
      </div>

      {/* Pagination */}
      {filteredProjects.length > 0 && (
        <div className="flex-shrink-0">
          <ProjectsPagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={filteredProjects.length}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </div>
      )}

      {/* Edit Project Modal */}
      <EditProjectModal />
    </div>
  );
}
