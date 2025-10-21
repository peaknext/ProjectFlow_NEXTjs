/**
 * Board Page - หน้าบอร์ด Kanban สำหรับโปรเจค
 */

'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { BoardView } from '@/components/views/board-view';
import { ProjectToolbar } from '@/components/layout/project-toolbar';
import { useAppStore } from '@/stores/use-app-store';
import { useUIStore } from '@/stores/use-ui-store';
import { useProject } from '@/hooks/use-projects';
import { useEffect } from 'react';

interface BoardPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default function BoardPage({ params }: BoardPageProps) {
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
    setCurrentView('board');
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
        currentView="board"
        onViewChange={handleViewChange}
        onCreateTask={handleCreateTask}
      />
      <div className="flex-1 overflow-hidden">
        <BoardView projectId={projectId} />
      </div>
    </div>
  );
}
