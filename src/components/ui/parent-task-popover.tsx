'use client';

import { useState, useMemo } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronDown, CornerDownRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Task {
  id: string;
  name: string;
  projectId?: string;
}

interface ParentTaskPopoverProps {
  tasks: Task[];
  value: string | null | undefined;
  onChange: (taskId: string | undefined) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

/**
 * ParentTaskPopover Component
 *
 * Single-select dropdown for parent task with search and clear button.
 * Matches ProjectPopover design pattern.
 *
 * @example
 * <ParentTaskPopover
 *   tasks={projectTasks}
 *   value={selectedParentTaskId}
 *   onChange={(id) => setParentTaskId(id)}
 *   placeholder="เลือกงานหลัก..."
 * />
 */
export function ParentTaskPopover({
  tasks,
  value,
  onChange,
  disabled = false,
  placeholder = 'ไม่มี (งานหลัก)',
  className
}: ParentTaskPopoverProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter tasks based on search query
  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) return tasks;
    const query = searchQuery.toLowerCase();
    return tasks.filter(task =>
      task.name.toLowerCase().includes(query)
    );
  }, [tasks, searchQuery]);

  // Get selected task for display
  const selectedTask = tasks.find(t => t.id === value);

  const handleSelectTask = (taskId: string) => {
    onChange(taskId);
    setOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange(undefined);
  };

  return (
    <div className="relative">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              'w-full h-11 text-base pl-3 py-2',
              'bg-white dark:bg-slate-800',
              !selectedTask && 'text-muted-foreground',
              selectedTask ? 'pr-14' : 'pr-10', // More padding when selected for X button
              className
            )}
          >
            <span className="truncate flex items-center gap-1.5 flex-1">
              {selectedTask ? (
                <>
                  <CornerDownRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  {selectedTask.name}
                </>
              ) : (
                placeholder
              )}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <div className="flex flex-col">
            {/* Search Input */}
            <div className="p-2 border-b">
              <Input
                placeholder="ค้นหางาน..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9"
                autoFocus
              />
            </div>

            {/* Task List */}
            <div className="max-h-[300px] overflow-y-auto">
              {filteredTasks.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  ไม่พบงาน
                </div>
              ) : (
                <div className="p-1">
                  {filteredTasks.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => handleSelectTask(task.id)}
                      className={cn(
                        'w-full text-left px-3 py-2 rounded-md text-sm',
                        'hover:bg-accent hover:text-accent-foreground',
                        'transition-colors',
                        'flex items-center gap-1.5',
                        value === task.id && 'bg-accent text-accent-foreground font-medium'
                      )}
                    >
                      <CornerDownRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">{task.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* ChevronDown Icon - Fixed Position */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <ChevronDown className="h-4 w-4 opacity-50" />
      </div>

      {/* Clear Button - Between text and chevron */}
      {selectedTask && !disabled && (
        <button
          onClick={handleClear}
          className="absolute right-9 top-1/2 -translate-y-1/2 p-0.5 hover:bg-accent rounded-sm transition-colors z-10"
          type="button"
        >
          <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
        </button>
      )}
    </div>
  );
}
