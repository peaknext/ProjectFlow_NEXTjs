'use client';

import { useState, useMemo } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Project {
  id: string;
  name: string;
  status?: string;
}

interface ProjectPopoverProps {
  projects: Project[];
  value: string | null;
  onChange: (projectId: string) => void;
  disabled?: boolean;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

/**
 * ProjectPopover Component
 *
 * Single-select dropdown for projects with search.
 * Matches GAS CreateTaskModal design pattern.
 *
 * @example
 * <ProjectPopover
 *   projects={availableProjects}
 *   value={selectedProjectId}
 *   onChange={(id) => setSelectedProjectId(id)}
 *   disabled={!!prefilledProjectId}
 *   required
 * />
 */
export function ProjectPopover({
  projects,
  value,
  onChange,
  disabled = false,
  placeholder = 'เลือกโปรเจค',
  required = false,
  className
}: ProjectPopoverProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter projects based on search query
  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    const query = searchQuery.toLowerCase();
    return projects.filter(project =>
      project.name.toLowerCase().includes(query)
    );
  }, [projects, searchQuery]);

  // Get selected project for display
  const selectedProject = projects.find(p => p.id === value);

  const handleSelectProject = (projectId: string) => {
    onChange(projectId);
    setOpen(false);
    setSearchQuery('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'w-full justify-between h-11 text-base px-3 py-2',
            'bg-white dark:bg-slate-800',
            !selectedProject && 'text-muted-foreground',
            className
          )}
        >
          <span className="truncate">
            {selectedProject?.name || placeholder}
            {required && !selectedProject && <span className="text-red-500 ml-1">*</span>}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <div className="flex flex-col">
          {/* Search Input */}
          <div className="p-2 border-b">
            <Input
              placeholder="ค้นหาโปรเจค..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9"
              autoFocus
            />
          </div>

          {/* Projects List */}
          <div className="max-h-[300px] overflow-y-auto">
            {filteredProjects.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                ไม่พบโปรเจค
              </div>
            ) : (
              filteredProjects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => handleSelectProject(project.id)}
                  className={cn(
                    'w-full px-3 py-2.5 text-sm text-left hover:bg-accent',
                    'transition-colors border-b border-border last:border-0',
                    value === project.id && 'bg-accent'
                  )}
                >
                  <div className="truncate">{project.name}</div>
                </button>
              ))
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
