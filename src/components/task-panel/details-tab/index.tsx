'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useUpdateTask } from '@/hooks/use-tasks';
import { useTaskPanelTab } from '../task-panel-tabs';
import { useTaskPermissions, getPermissionNotice } from '@/hooks/use-task-permissions';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, AlertCircle } from 'lucide-react';
import { ParentTaskBanner } from './parent-task-banner';
import { TaskNameInput } from './task-name-input';
import { DescriptionTextarea } from './description-textarea';
import { TaskMetadata } from './task-metadata';
import { FieldGrid } from './field-grid';
import { SubtasksSection } from './subtasks-section';
import { ChecklistsSection } from './checklists-section';
import { CommentsSection } from './comments-section';
import { StatusSlider } from '@/components/ui/status-slider';
import { logger } from '@/lib/logger';

interface Task {
  id: string;
  name: string;
  description: string | null;
  projectId: string;
  statusId: string;
  priority: number;
  difficulty: number | null;
  startDate: string | null;
  dueDate: string | null;
  assigneeUserIds?: string[];
  parentTaskId: string | null;
  isClosed?: boolean;
  creator?: {
    id: string;
    fullName: string;
    email: string;
  };
  createdAt?: string;
  project?: {
    id: string;
    name: string;
    department?: {
      id: string;
      name: string;
    };
  };
}

interface User {
  id: string;
  fullName: string;
  email: string;
  profileImageUrl: string | null;
}

interface Status {
  id: string;
  name: string;
  color: string;
  order: number;
  type: string;
}

interface DetailsTabProps {
  task?: Task | null;
  isLoading?: boolean;
  users?: User[];
  statuses?: Status[];
  updateFormState?: (updates: { isDirty?: boolean; isSubmitting?: boolean; currentStatusId?: string }) => void;
  registerSubmitHandler?: (handler: () => Promise<void>) => void;
}

// Validation schema
const taskFormSchema = z.object({
  name: z.string().min(1, 'กรุณาระบุชื่องาน'),
  description: z.string(),
  statusId: z.string(),
  priority: z.string(),
  difficulty: z.string(),
  startDate: z.string().nullable(),
  dueDate: z.string().nullable(),
  assigneeUserIds: z.array(z.string()),
}).refine((data) => {
  // ตรวจสอบว่า startDate ไม่มากกว่า dueDate
  if (data.startDate && data.dueDate) {
    const start = new Date(data.startDate);
    const due = new Date(data.dueDate);
    return start <= due;
  }
  return true;
}, {
  message: 'วันเริ่มงานต้องไม่มากกว่าวันสิ้นสุด',
  path: ['startDate'], // แสดง error ที่ startDate field
});

export interface TaskFormData {
  name: string;
  description: string;
  statusId: string;
  priority: string;
  difficulty: string;
  startDate?: string;
  dueDate?: string;
  assigneeUserIds: string[];
}

/**
 * DetailsTab Component
 *
 * Main details tab containing all task form fields.
 * Features:
 * - Form state management (React Hook Form)
 * - Permission-based field disabling
 * - Dirty state tracking
 * - Loading skeletons
 * - Informative notices
 *
 * Structure:
 * - Parent Task Banner (conditional)
 * - Task Name Input
 * - Status Slider
 * - Field Grid (3 columns: Assignee, Priority, Difficulty, Dates)
 * - Description Textarea
 * - Task Metadata (Creator, Date Created)
 * - Subtasks Section
 * - Checklists Section
 * - Comments Section
 *
 * @example
 * <DetailsTab
 *   task={task}
 *   isLoading={isLoading}
 *   users={projectUsers}
 *   statuses={projectStatuses}
 * />
 */
export function DetailsTab({
  task,
  isLoading,
  users = [],
  statuses = [],
  updateFormState,
  registerSubmitHandler
}: DetailsTabProps) {
  const { isActive } = useTaskPanelTab('details');
  const permissions = useTaskPermissions(task);
  const permissionNotice = getPermissionNotice(task, permissions);

  // Update task mutation
  const { mutate: updateTask } = useUpdateTask();

  // Form state management
  const {
    register,
    control,
    watch,
    setValue,
    reset,
    handleSubmit,
    formState: { isDirty, isSubmitting, errors }
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      name: '',
      description: '',
      statusId: '',
      priority: '3',
      difficulty: '2',
      startDate: null,
      dueDate: null,
      assigneeUserIds: []
    }
  });

  // Submit handler - wrapped in useCallback to prevent infinite loops
  const onSubmit = useCallback(async (data: TaskFormData) => {
    if (!task) return;

    // Convert form data to API format
    const updates = {
      name: data.name,
      description: data.description,
      statusId: data.statusId,
      priority: parseInt(data.priority, 10),
      difficulty: parseInt(data.difficulty, 10),
      startDate: data.startDate,
      dueDate: data.dueDate,
      assigneeUserIds: data.assigneeUserIds, // ✅ Send array of assignee IDs
    };

    return new Promise<void>((resolve, reject) => {
      updateTask(
        { taskId: task.id, data: updates },
        {
          onSuccess: (response) => {
            // Reset form with the actual server response data to ensure consistency
            if (response?.task) {
              reset({
                name: response.task.name,
                description: response.task.description || '',
                statusId: response.task.statusId,
                priority: response.task.priority.toString(),
                difficulty: response.task.difficulty?.toString() || '2',
                startDate: response.task.startDate,
                dueDate: response.task.dueDate,
                assigneeUserIds: response.task.assigneeUserIds || [] // ✅ Use array from response
              });
            }
            resolve();
          },
          onError: (error) => {
            logger.error('Task panel: Failed to update task', error as Error, { taskId: task.id });
            reject(error);
          },
        }
      );
    });
  }, [task, updateTask, reset]);

  // Reset form when task ID changes (not the entire task object to avoid unnecessary resets)
  useEffect(() => {
    if (!task) return;

    reset({
      name: task.name,
      description: task.description || '',
      statusId: task.statusId,
      priority: task.priority.toString(),
      difficulty: task.difficulty?.toString() || '2',
      startDate: task.startDate,
      dueDate: task.dueDate,
      assigneeUserIds: task.assigneeUserIds || [] // ✅ Use array if available, fallback to empty
    });
  }, [task?.id, reset]); // ✅ Only re-run when task ID changes, not when task object changes

  // Watch statusId changes
  const currentStatusId = watch('statusId');

  // Sync form state to parent
  useEffect(() => {
    updateFormState?.({ isDirty, isSubmitting, currentStatusId });
  }, [isDirty, isSubmitting, currentStatusId, updateFormState]);

  // Register submit handler with parent
  useEffect(() => {
    if (registerSubmitHandler) {
      registerSubmitHandler(handleSubmit(onSubmit));
    }
  }, [handleSubmit, onSubmit, registerSubmitHandler]);

  // Don't render if not active tab
  if (!isActive) return null;

  // Loading skeleton
  if (isLoading || !task) {
    return (
      <div className="p-6 lg:p-8 space-y-8">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const canEdit = permissions.canEdit;

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* Permission Notice */}
      {permissionNotice && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>{permissionNotice}</AlertDescription>
        </Alert>
      )}

      {/* Parent Task Banner (for subtasks) */}
      {task.parentTaskId && <ParentTaskBanner parentTaskId={task.parentTaskId} />}

      {/* Task Name */}
      <TaskNameInput
        {...register('name', { required: true })}
        disabled={!canEdit}
      />

      {/* Status Slider */}
      <div className="my-8">
        <StatusSlider
          statuses={statuses}
          value={watch('statusId')}
          onChange={(newStatusId) => setValue('statusId', newStatusId, { shouldDirty: true })}
          disabled={!canEdit}
        />
      </div>

      {/* Field Grid (Assignee, Priority, Difficulty, Dates) */}
      <FieldGrid
        control={control}
        setValue={setValue}
        watch={watch}
        errors={errors}
        disabled={!canEdit}
        users={users}
      />

      {/* Description */}
      <DescriptionTextarea
        {...register('description')}
        disabled={!canEdit}
      />

      {/* Task Metadata */}
      <TaskMetadata
        creator={task.creator}
        createdAt={task.createdAt}
        department={task.project?.department}
      />

      {/* Subtasks Section */}
      <SubtasksSection
        taskId={task.id}
        projectId={task.projectId}
        task={task}
        users={users}
        statuses={statuses}
      />

      {/* Checklists Section */}
      <ChecklistsSection taskId={task.id} task={task} />

      {/* Comments Section */}
      <CommentsSection
        taskId={task.id}
        task={task}
        users={users}
      />
    </div>
  );
}
