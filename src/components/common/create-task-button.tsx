/**
 * CreateTaskButton - Reusable create task button component
 * Used across dashboard, toolbar, and other views
 */

'use client';

import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreateTaskButtonProps {
  onClick: () => void;
  className?: string;
  fullWidth?: boolean;
}

export function CreateTaskButton({
  onClick,
  className,
  fullWidth = false,
}: CreateTaskButtonProps) {
  return (
    <Button
      onClick={onClick}
      size="lg"
      className={cn(
        'h-12 text-primary-foreground',
        fullWidth && 'w-full',
        className
      )}
    >
      <Plus className="h-5 w-5 mr-2" />
      <span className="font-medium text-base">สร้างงานใหม่</span>
    </Button>
  );
}
