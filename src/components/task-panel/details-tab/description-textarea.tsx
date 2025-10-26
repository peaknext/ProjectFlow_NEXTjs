"use client";

import { forwardRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface DescriptionTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

/**
 * DescriptionTextarea Component
 *
 * Multi-line textarea for task description.
 * Features:
 * - Min-height 120px
 * - Auto-expand on content
 * - Optional character count
 * - Disabled state
 *
 * @example
 * <DescriptionTextarea
 *   {...register('description')}
 *   disabled={!canEdit}
 * />
 */
export const DescriptionTextarea = forwardRef<
  HTMLTextAreaElement,
  DescriptionTextareaProps
>(function DescriptionTextarea({ error, className, disabled, ...props }, ref) {
  return (
    <div>
      <Label htmlFor="task-description" className="block">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
          รายละเอียด
        </span>
      </Label>
      <Textarea
        id="task-description"
        ref={ref}
        placeholder="เพิ่มรายละเอียดเกี่ยวกับงานนี้..."
        disabled={disabled}
        className={cn(
          "mt-1 min-h-[120px] resize-y text-base bg-white dark:bg-background",
          error && "border-red-500 focus:ring-red-500",
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
});
