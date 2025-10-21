/**
 * Calendar Page - หน้าปฏิทินงานสำหรับโปรเจค
 */

'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarView } from '@/components/views/calendar-view';
import { ProjectToolbar } from '@/components/layout/project-toolbar';
import { useAppStore } from '@/stores/use-app-store';
import { useUIStore } from '@/stores/use-ui-store';
import { useProject } from '@/hooks/use-projects';
import { useEffect } from 'react';

interface CalendarPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default function CalendarPage({ params }: CalendarPageProps) {
  const router = useRouter();
  const { projectId } = use(params);
  const setCurrentProject = useAppStore((state) => state.setCurrentProject);
  const setCurrentView = useAppStore((state) => state.setCurrentView);
  const openCreateTaskModal = useUIStore((state) => state.openCreateTaskModal);

  // Fetch project data for breadcrumb
  const { data: projectData } = useProject(projectId);

  useEffect(() => {
    // Update app store with current project
    setCurrentProject(projectId);
    setCurrentView('calendar');
  }, [projectId, setCurrentProject, setCurrentView]);

  // Build breadcrumbs from project data
  const breadcrumbs = projectData?.project
    ? [
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
      ]
    : [];

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
    <div className="h-full flex flex-col">
      <ProjectToolbar
        breadcrumbs={breadcrumbs}
        currentView="calendar"
        onViewChange={handleViewChange}
        onCreateTask={handleCreateTask}
      />
      <div className="flex-1 overflow-hidden">
        <CalendarView projectId={projectId} />
      </div>
    </div>
  );
}
