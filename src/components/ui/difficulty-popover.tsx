'use client';

import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export type DifficultyValue = '1' | '2' | '3';

interface DifficultyOption {
  id: DifficultyValue;
  name: string;
  color: string;
}

const DIFFICULTY_OPTIONS: DifficultyOption[] = [
  { id: '1', name: 'ง่าย', color: '#22c55e' },     // green-500
  { id: '2', name: 'ปกติ', color: '#eab308' },     // yellow-500
  { id: '3', name: 'ยาก', color: '#ef4444' }       // red-500
];

interface DifficultyPopoverProps {
  value: DifficultyValue;
  onChange: (value: DifficultyValue) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * DifficultyPopover Component
 *
 * Dropdown selector for task difficulty with color-coded dots.
 * Features:
 * - 3 difficulty levels (Easy, Normal, Hard)
 * - Colored dot + label display
 * - Click-to-toggle popover
 * - Auto-close on selection
 * - Disabled state support
 *
 * @example
 * <DifficultyPopover
 *   value={difficulty}
 *   onChange={(newDifficulty) => setDifficulty(newDifficulty)}
 *   disabled={isClosed || !canEdit}
 * />
 */
export function DifficultyPopover({
  value,
  onChange,
  disabled = false,
  className
}: DifficultyPopoverProps) {
  const [open, setOpen] = useState(false);

  const selectedOption = DIFFICULTY_OPTIONS.find(opt => opt.id === value) || DIFFICULTY_OPTIONS[1]; // Default to "ปกติ"

  const handleSelect = (option: DifficultyOption) => {
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
            className="h-3 w-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: selectedOption.color }}
          />
          <span className="truncate">{selectedOption.name}</span>
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-48 p-2" align="start">
        <div className="space-y-1">
          {DIFFICULTY_OPTIONS.map((option) => (
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
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: option.color }}
              />
              <span>{option.name}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Difficulty Trigger Component (for use in forms)
 *
 * Standalone trigger button that shows current difficulty.
 * Used in conjunction with DifficultyPopover.
 */
interface DifficultyTriggerProps {
  value: DifficultyValue;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export function DifficultyTrigger({
  value,
  onClick,
  disabled = false,
  className
}: DifficultyTriggerProps) {
  const selectedOption = DIFFICULTY_OPTIONS.find(opt => opt.id === value) || DIFFICULTY_OPTIONS[1];

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
        className="h-3 w-3 rounded-full flex-shrink-0"
        style={{ backgroundColor: selectedOption.color }}
      />
      <span className="truncate">{selectedOption.name}</span>
    </button>
  );
}

// Export difficulty options for use in other components
export { DIFFICULTY_OPTIONS };
