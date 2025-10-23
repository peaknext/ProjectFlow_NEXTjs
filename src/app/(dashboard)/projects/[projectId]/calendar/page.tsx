/**
 * Calendar Page - หน้าปฏิทินงานสำหรับโปรเจค
 */

'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarView } from '@/components/views/calendar-view';
import { ProjectToolbar } from '@/components/layout/project-toolbar';
import { useAppStore } from '@/stores/use-app-store';
import { useUIStore } from '@/stores/use-ui-store';
import { useNavigationStore } from '@/stores/use-navigation-store';
import { useProject } from '@/hooks/use-projects';

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
  const { setProject } = useNavigationStore();

  // Fetch project data for breadcrumb and navigation
  const { data: projectData } = useProject(projectId);

  useEffect(() => {
    // Update app store with current project
    setCurrentProject(projectId);
    setCurrentView('calendar');
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

  const handleViewChange = (view: 'list' | 'board' | 'calendar') => {
    setCurrentView(view);
    router.push(`/projects/${projectId}/${view}`);
  };

  // Get department projects for breadcrumb project selector
  const departmentProjects = projectData?.project?.department?.projects || [];

  return (
    <div className="h-full flex flex-col">
      <ProjectToolbar
        currentView="calendar"
        onViewChange={handleViewChange}
        projectName={projectData?.project?.name}
        projects={departmentProjects.map((p) => ({
          id: p.id,
          name: p.name,
          status: p.status,
        }))}
      />
      <div className="flex-1 overflow-hidden">
        <CalendarView projectId={projectId} />
      </div>
    </div>
  );
}
