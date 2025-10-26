/**
 * List View Page
 * แสดงงานในรูปแบบตาราง พร้อม sorting, filtering, และ bulk actions
 */

'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ListView } from '@/components/views/list-view';
import { ProjectToolbar } from '@/components/layout/project-toolbar';
import { useAppStore } from '@/stores/use-app-store';
import { useUIStore } from '@/stores/use-ui-store';
import { useNavigationStore } from '@/stores/use-navigation-store';
import { useProject } from '@/hooks/use-projects';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ListViewPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const setCurrentProject = useAppStore((state) => state.setCurrentProject);
  const setCurrentView = useAppStore((state) => state.setCurrentView);
  const openCreateTaskModal = useUIStore((state) => state.openCreateTaskModal);
  const { setProject } = useNavigationStore();
  const { data: projectData, isLoading, error } = useProject(projectId);

  // Set current project and view on mount
  useEffect(() => {
    setCurrentProject(projectId);
    setCurrentView('list');
  }, [projectId, setCurrentProject, setCurrentView]);

  // Update navigation store when project data loads
  useEffect(() => {
    if (projectData?.project) {
      const project = projectData.project;
      const department = project.department;
      const division = department.division;
      const missionGroup = division?.missionGroup;

      setProject(
        project.id,
        project.name,
        department.id,
        department.name,
        division?.id,
        division?.name,
        missionGroup?.id,
        missionGroup?.name
      );
    }
  }, [projectData, setProject]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        {/* Toolbar Skeleton */}
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="h-14 px-4 flex items-center">
            <div className="h-6 w-48 bg-muted animate-pulse rounded" />
          </div>
        </div>

        {/* Loading Spinner */}
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">กำลังโหลดข้อมูล...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col h-full">
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="h-14 px-4 flex items-center">
            <h1 className="text-lg font-semibold">เกิดข้อผิดพลาด</h1>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <Alert variant="destructive" className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              ไม่สามารถโหลดข้อมูลโปรเจกต์ได้: {error.message}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // No project found
  if (!projectData) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center p-6">
          <Alert className="max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>ไม่พบโปรเจกต์นี้</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const handleViewChange = (view: 'list' | 'board' | 'calendar') => {
    setCurrentView(view);
    router.push(`/projects/${projectId}/${view}`);
  };

  // Get department projects for breadcrumb project selector
  const departmentProjects = projectData?.project?.department?.projects || [];

  // Debug: Check if projects are loaded from API

  return (
    <div className="flex flex-col h-full">
      {/* Project Toolbar */}
      <ProjectToolbar
        currentView="list"
        onViewChange={handleViewChange}
        projectName={projectData?.project?.name}
        projects={departmentProjects.map((p) => ({
          id: p.id,
          name: p.name,
          status: p.status,
        }))}
      />

      {/* List View */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <ListView projectId={projectId} />
        </div>
      </div>
    </div>
  );
}
