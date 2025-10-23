'use client';

import { Control, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { TaskFormData } from './index';
import { Label } from '@/components/ui/label';
import { AssigneePopover } from '@/components/ui/assignee-popover';
import { PriorityPopover, PriorityValue } from '@/components/ui/priority-popover';
import { DifficultyPopover, DifficultyValue } from '@/components/ui/difficulty-popover';
import { DateInput } from '@/components/ui/date-picker-popover';

interface User {
  id: string;
  fullName: string;
  email: string;
  profileImageUrl?: string | null;
}

interface FieldGridProps {
  control: Control<TaskFormData>;
  setValue: UseFormSetValue<TaskFormData>;
  watch: UseFormWatch<TaskFormData>;
  disabled?: boolean;
  users?: User[];
}

/**
 * FieldGrid Component
 *
 * 3-column responsive grid containing:
 * - Assignee selector
 * - Priority selector
 * - Difficulty selector
 * - Start date picker
 * - Due date picker
 *
 * Layout:
 * - Desktop (lg): 3 columns
 * - Tablet (md): 2 columns
 * - Mobile: 1 column
 *
 * @example
 * <FieldGrid
 *   control={control}
 *   setValue={setValue}
 *   watch={watch}
 *   disabled={!canEdit}
 *   users={projectUsers}
 * />
 */
export function FieldGrid({
  control,
  setValue,
  watch,
  disabled = false,
  users = []
}: FieldGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Assignee Selector */}
      <div>
        <Label className="block mb-1">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            ผู้รับผิดชอบ
          </span>
        </Label>
        <Controller
          name="assigneeUserIds"
          control={control}
          render={({ field }) => (
            <AssigneePopover
              users={users}
              selectedUserIds={field.value}
              onSave={(newIds) => field.onChange(newIds)}
              disabled={disabled}
              size="lg"
            />
          )}
        />
      </div>

      {/* Priority Selector */}
      <div>
        <Label className="block mb-1">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            ความเร่งด่วน
          </span>
        </Label>
        <Controller
          name="priority"
          control={control}
          render={({ field }) => (
            <PriorityPopover
              value={field.value as PriorityValue}
              onChange={(newValue) => field.onChange(newValue)}
              disabled={disabled}
            />
          )}
        />
      </div>

      {/* Difficulty Selector */}
      <div>
        <Label className="block mb-1">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            ระดับความยาก
          </span>
        </Label>
        <Controller
          name="difficulty"
          control={control}
          render={({ field }) => (
            <DifficultyPopover
              value={field.value as DifficultyValue}
              onChange={(newValue) => field.onChange(newValue)}
              disabled={disabled}
            />
          )}
        />
      </div>

      {/* Start Date Picker */}
      <div>
        <Label className="block mb-1">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            วันเริ่มงาน
          </span>
        </Label>
        <Controller
          name="startDate"
          control={control}
          render={({ field }) => (
            <DateInput
              value={field.value}
              onChange={(newDate) => field.onChange(newDate)}
              placeholder="เลือกวันที่"
              disabled={disabled}
            />
          )}
        />
      </div>

      {/* Due Date Picker */}
      <div>
        <Label className="block mb-1">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            วันสิ้นสุด
          </span>
        </Label>
        <Controller
          name="dueDate"
          control={control}
          render={({ field }) => (
            <DateInput
              value={field.value}
              onChange={(newDate) => field.onChange(newDate)}
              placeholder="เลือกวันที่"
              disabled={disabled}
            />
          )}
        />
      </div>
    </div>
  );
}
