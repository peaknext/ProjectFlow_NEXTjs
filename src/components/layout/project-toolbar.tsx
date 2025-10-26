/**
 * ProjectToolbar - Toolbar for project views
 * Contains breadcrumb, view title, view switcher, and create task button
 */

'use client';

import { Button } from '@/components/ui/button';
import { CreateTaskButton } from '@/components/common/create-task-button';
import { List, LayoutGrid, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Breadcrumb } from '@/components/navigation/breadcrumb';
import { useWorkspace } from '@/hooks/use-workspace';

type ViewType = 'list' | 'board' | 'calendar';

interface ProjectToolbarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  /**
   * Project name to display in title
   */
  projectName?: string;
  /**
   * Optional projects list for breadcrumb project selector
   * If provided, shows project selector button in breadcrumb
   */
  projects?: Array<{ id: string; name: string; status?: string }>;
  /**
   * Callback when project is selected from breadcrumb
   */
  onProjectSelect?: (projectId: string) => void;
}

const VIEW_CONFIG = {
  list: {
    icon: List,
    title: 'รายการงาน',
    label: 'List View',
  },
  board: {
    icon: LayoutGrid,
    title: 'บอร์ดงาน',
    label: 'Board View',
  },
  calendar: {
    icon: Calendar,
    title: 'ปฏิทินงาน',
    label: 'Calendar View',
  },
};

export function ProjectToolbar({
  currentView,
  onViewChange,
  projectName,
  projects,
  onProjectSelect,
}: ProjectToolbarProps) {
  const viewTitle = VIEW_CONFIG[currentView].title;

  // Fetch workspace data for breadcrumb selectors
  const { data: workspaceData } = useWorkspace();

  return (
    <div className="bg-card border-b flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-6 py-4 flex-shrink-0">
      {/* Left side: Breadcrumb and Title */}
      <div className="min-w-0">
        {/* Breadcrumb Navigation */}
        <Breadcrumb
          workspace={workspaceData}
          projects={projects}
          onProjectSelect={onProjectSelect}
          className="mb-1"
        />

        {/* Title */}
        <h1 className="text-2xl font-bold">
          {viewTitle}{projectName && `: ${projectName}`}
        </h1>
      </div>

      {/* Right side: View Switcher and Create Button */}
      <div className="flex items-center gap-2 sm:gap-4 w-full md:w-auto">
        {/* View Switcher */}
        <div className="relative flex items-center bg-muted rounded-lg p-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewChange('list')}
            className={cn(
              'px-4 py-2 rounded-md transition-colors',
              currentView === 'list'
                ? 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-transparent'
            )}
            title="List View"
          >
            <List className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewChange('board')}
            className={cn(
              'px-4 py-2 rounded-md transition-colors',
              currentView === 'board'
                ? 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-transparent'
            )}
            title="Board View"
          >
            <LayoutGrid className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewChange('calendar')}
            className={cn(
              'px-4 py-2 rounded-md transition-colors',
              currentView === 'calendar'
                ? 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-transparent'
            )}
            title="Calendar View"
          >
            <Calendar className="h-5 w-5" />
          </Button>
        </div>

        {/* Create Task Button */}
        <CreateTaskButton />
      </div>
    </div>
  );
}
