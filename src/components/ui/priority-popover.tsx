'use client';

import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export type PriorityValue = '1' | '2' | '3' | '4';

interface PriorityOption {
  id: PriorityValue;
  name: string;
  color: string;
  icon: string;
}

const PRIORITY_OPTIONS: PriorityOption[] = [
  { id: '1', name: 'ด่วนที่สุด', color: '#ef4444', icon: 'flag' },
  { id: '2', name: 'ด่วน', color: '#f97316', icon: 'flag' },
  { id: '3', name: 'ปกติ', color: '#eab308', icon: 'flag' },
  { id: '4', name: 'ต่ำ', color: '#22c55e', icon: 'flag' }
];

interface PriorityPopoverProps {
  value: PriorityValue;
  onChange: (value: PriorityValue) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * PriorityPopover Component
 *
 * Dropdown selector for task priority with color-coded options.
 * Features:
 * - 4 priority levels (Urgent → Low)
 * - Icon + color + label display
 * - Click-to-toggle popover
 * - Auto-close on selection
 * - Disabled state support
 *
 * @example
 * <PriorityPopover
 *   value={priority}
 *   onChange={(newPriority) => setPriority(newPriority)}
 *   disabled={isClosed || !canEdit}
 * />
 */
export function PriorityPopover({
  value,
  onChange,
  disabled = false,
  className
}: PriorityPopoverProps) {
  const [open, setOpen] = useState(false);

  const selectedOption = PRIORITY_OPTIONS.find(opt => opt.id === value) || PRIORITY_OPTIONS[2]; // Default to "ปกติ"

  const handleSelect = (option: PriorityOption) => {
    onChange(option.id);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            'flex items-center justify-start gap-2 h-[46px] w-full px-3 py-2 text-base text-left',
            'bg-white dark:bg-background border border-input rounded-lg',
            'text-foreground',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'hover:bg-accent hover:text-accent-foreground',
            'transition-colors',
            className
          )}
        >
          <span
            className="material-symbols-outlined text-lg flex-shrink-0"
            style={{ color: selectedOption.color }}
          >
            {selectedOption.icon}
          </span>
          <span className="truncate">{selectedOption.name}</span>
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-56 p-2" align="start">
        <div className="space-y-1">
          {PRIORITY_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => handleSelect(option)}
              className={cn(
                'flex items-center w-full gap-2 p-2 text-base rounded-md',
                'hover:bg-accent hover:text-accent-foreground',
                'transition-colors cursor-pointer',
                option.id === value && 'bg-accent'
              )}
            >
              <span
                className="material-symbols-outlined text-lg"
                style={{ color: option.color }}
              >
                {option.icon}
              </span>
              <span>{option.name}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Priority Trigger Component (for use in forms)
 *
 * Standalone trigger button that shows current priority.
 * Used in conjunction with PriorityPopover.
 */
interface PriorityTriggerProps {
  value: PriorityValue;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export function PriorityTrigger({
  value,
  onClick,
  disabled = false,
  className
}: PriorityTriggerProps) {
  const selectedOption = PRIORITY_OPTIONS.find(opt => opt.id === value) || PRIORITY_OPTIONS[2];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex items-center justify-start gap-2 h-[46px] w-full px-3 py-2 text-base text-left',
        'bg-white dark:bg-background border border-input rounded-lg',
        'text-foreground',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'hover:bg-accent hover:text-accent-foreground',
        'transition-colors',
        className
      )}
    >
      <span
        className="material-symbols-outlined text-lg flex-shrink-0"
        style={{ color: selectedOption.color }}
      >
        {selectedOption.icon}
      </span>
      <span className="truncate">{selectedOption.name}</span>
    </button>
  );
}

// Export priority options for use in other components
export { PRIORITY_OPTIONS };
