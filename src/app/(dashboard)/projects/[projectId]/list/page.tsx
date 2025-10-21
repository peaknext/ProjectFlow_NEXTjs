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
  const { data: projectData, isLoading, error } = useProject(projectId);

  // Set current project and view on mount
  useEffect(() => {
    setCurrentProject(projectId);
    setCurrentView('list');
  }, [projectId, setCurrentProject, setCurrentView]);

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

  // Build breadcrumbs from project data
  const breadcrumbs = [
    {
      label: projectData.project.department.name,
      level: 'department' as const,
      id: projectData.project.department.id,
    },
    {
      label: projectData.project.name,
      level: 'project' as const,
      id: projectData.project.id,
    },
  ];

  const handleViewChange = (view: 'list' | 'board' | 'calendar') => {
    setCurrentView(view);
    router.push(`/projects/${projectId}/${view}`);
  };

  const handleCreateTask = () => {
    // Open create task modal with default status (first status)
    const defaultStatusId = projectData?.statuses[0]?.id;
    openCreateTaskModal(projectId, defaultStatusId);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Project Toolbar */}
      <ProjectToolbar
        breadcrumbs={breadcrumbs}
        currentView="list"
        onViewChange={handleViewChange}
        onCreateTask={handleCreateTask}
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
