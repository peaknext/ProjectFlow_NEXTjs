'use client';

import { forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface TaskNameInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

/**
 * TaskNameInput Component
 *
 * Large, prominent input for task name.
 * Features:
 * - Large font size (text-lg)
 * - Font weight semibold
 * - Required field indicator
 * - Error message display
 * - Disabled state
 *
 * @example
 * <TaskNameInput
 *   {...register('name', { required: true })}
 *   disabled={!canEdit}
 *   error={errors.name?.message}
 * />
 */
export const TaskNameInput = forwardRef<HTMLInputElement, TaskNameInputProps>(
  function TaskNameInput({ error, className, disabled, ...props }, ref) {
    return (
      <div>
        <Label htmlFor="task-name" className="block">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            ชื่องาน
          </span>
        </Label>
        <Input
          id="task-name"
          ref={ref}
          type="text"
          placeholder="e.g., Prepare patient for surgery"
          disabled={disabled}
          className={cn(
            'mt-1 h-[46px] text-base font-normal bg-white dark:bg-background',
            error && 'border-red-500 focus:ring-red-500',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  }
);
