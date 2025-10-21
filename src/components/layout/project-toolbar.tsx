/**
 * ProjectToolbar - Toolbar for project views
 * Contains breadcrumb, view title, view switcher, and create task button
 */

'use client';

import { Button } from '@/components/ui/button';
import { CreateTaskButton } from '@/components/common/create-task-button';
import { List, LayoutGrid, Calendar, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type ViewType = 'list' | 'board' | 'calendar';

interface BreadcrumbItem {
  label: string;
  href?: string;
  level: 'missionGroup' | 'division' | 'department' | 'project';
  id: string;
}

interface ProjectToolbarProps {
  breadcrumbs?: BreadcrumbItem[];
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  onCreateTask: () => void;
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
  breadcrumbs = [],
  currentView,
  onViewChange,
  onCreateTask,
}: ProjectToolbarProps) {
  const viewTitle = VIEW_CONFIG[currentView].title;

  return (
    <div className="bg-card border-b flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-6 py-4 flex-shrink-0">
      {/* Left side: Breadcrumb and Title */}
      <div>
        {/* Breadcrumb */}
        {breadcrumbs.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            {breadcrumbs.map((item, index) => {
              const isLast = index === breadcrumbs.length - 1;
              const isCurrentLevel = isLast;

              return (
                <div key={item.id} className="flex items-center gap-2">
                  {index > 0 && (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  {isCurrentLevel ? (
                    <span className="font-semibold text-foreground">
                      {item.label}
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        // Handle breadcrumb navigation
                        if (item.href) {
                          window.location.href = item.href;
                        }
                      }}
                      className="hover:text-primary transition-colors"
                    >
                      {item.label}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Title */}
        <h1 className="text-2xl font-bold">{viewTitle}</h1>
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
        <CreateTaskButton onClick={onCreateTask} />
      </div>
    </div>
  );
}
