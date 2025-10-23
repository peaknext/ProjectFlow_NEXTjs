/**
 * CreateTaskButton - Reusable create task button component
 * Opens CreateTaskModal with context-aware options
 */

'use client';

import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/use-ui-store';
import { useProject } from '@/hooks/use-projects';

interface Project {
  id: string;
  name: string;
  status?: string;
}

interface CreateTaskButtonProps {
  className?: string;
  fullWidth?: boolean;
  // Optional overrides for department/other views
  projectId?: string;
  projectName?: string;
  departmentId?: string; // For department tasks view - filter projects by department
  availableProjects?: Project[]; // Pre-filtered projects to pass to modal
  parentTaskId?: string;
  defaultStartDate?: string;
  defaultDueDate?: string;
}

export function CreateTaskButton({
  className,
  fullWidth = false,
  projectId: propProjectId,
  projectName: propProjectName,
  departmentId,
  availableProjects,
  parentTaskId,
  defaultStartDate,
  defaultDueDate,
}: CreateTaskButtonProps) {
  const params = useParams();
  const openCreateTaskModal = useUIStore((state) => state.openCreateTaskModal);

  // Get projectId from route params if not provided
  const projectId = propProjectId || (params?.projectId as string);

  // Get project name if in project view
  const { data } = useProject(projectId);
  const projectName = propProjectName || data?.project?.name;

  const handleClick = () => {
    console.log('CreateTaskButton clicked!', {
      projectId,
      projectName,
      departmentId,
      availableProjects: availableProjects?.length,
      parentTaskId,
      defaultStartDate,
      defaultDueDate,
    });
    openCreateTaskModal({
      projectId,
      projectName,
      departmentId,
      availableProjects, // Pass pre-filtered projects to modal
      parentTaskId,
      defaultStartDate,
      defaultDueDate,
    });
  };

  return (
    <Button
      onClick={handleClick}
      size="lg"
      className={cn(
        'h-12 px-8 text-base text-primary-foreground',
        fullWidth && 'w-full',
        className
      )}
    >
      <Plus className="h-5 w-5 mr-2" />
      <span className="font-semibold text-base">สร้างงานใหม่</span>
    </Button>
  );
}
