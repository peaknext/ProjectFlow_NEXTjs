/**
 * React Hook Form Type Helpers
 * Type-safe form handling with Zod schema integration
 */

import type { Control, UseFormHandleSubmit, FieldValues, UseFormReturn } from 'react-hook-form';
import type { z } from 'zod';

// ==================== Generic Form Types ====================

/**
 * Generic form control type from Zod schema
 */
export type FormControl<T extends z.ZodType> = Control<z.infer<T>>;

/**
 * Generic form submit handler from Zod schema
 */
export type FormSubmitHandler<T extends z.ZodType> = UseFormHandleSubmit<z.infer<T>>;

/**
 * Generic form return type from Zod schema
 */
export type FormReturn<T extends z.ZodType> = UseFormReturn<z.infer<T>>;

// ==================== Task Form Types ====================

/**
 * Task form data structure
 */
export interface TaskFormData {
  name: string;
  description: string;
  statusId: string;
  priority: number;
  startDate: Date | null;
  dueDate: Date | null;
  assigneeUserIds: string[];
  difficulty: number | null;
  parentTaskId: string | null;
}

/**
 * Task creation form data
 */
export interface CreateTaskFormData {
  name: string;
  description?: string;
  projectId: string;
  statusId?: string;
  priority?: number;
  difficulty?: number;
  assigneeUserIds?: string[];
  startDate?: Date | null;
  dueDate?: Date | null;
  parentTaskId?: string | null;
}

/**
 * Task update form data (all fields optional)
 */
export interface UpdateTaskFormData {
  name?: string;
  description?: string;
  statusId?: string;
  priority?: number;
  startDate?: Date | null;
  dueDate?: Date | null;
  assigneeUserIds?: string[];
  difficulty?: number | null;
}

// ==================== Project Form Types ====================

/**
 * Project form data structure
 */
export interface ProjectFormData {
  name: string;
  description: string;
  startDate: Date | null;
  endDate: Date | null;
  ownerId: string;
  departmentId: string;
  status: 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
  progress: number;
  actionPlanId?: string | null;
  itGoalId?: string | null;
  hospMissionId?: string | null;
}

/**
 * Project creation form data
 */
export interface CreateProjectFormData {
  name: string;
  description?: string;
  departmentId: string;
  ownerId: string;
  startDate?: Date | null;
  endDate?: Date | null;
  status?: string;
  actionPlanId?: string | null;
  itGoalId?: string | null;
  hospMissionId?: string | null;
}

/**
 * Project update form data (all fields optional)
 */
export interface UpdateProjectFormData {
  name?: string;
  description?: string;
  startDate?: Date | null;
  endDate?: Date | null;
  ownerId?: string;
  status?: string;
  progress?: number;
}

// ==================== User Form Types ====================

/**
 * User form data structure
 */
export interface UserFormData {
  email: string;
  titlePrefix: string;
  firstName: string;
  lastName: string;
  password?: string;
  role: string;
  departmentId: string;
  jobTitleId?: string | null;
  profileImageUrl?: string | null;
  notes?: string;
}

/**
 * User creation form data
 */
export interface CreateUserFormData {
  email: string;
  titlePrefix: string;
  firstName: string;
  lastName: string;
  password: string;
  role: string;
  departmentId: string;
  jobTitleId?: string | null;
}

/**
 * User update form data (all fields optional)
 */
export interface UpdateUserFormData {
  titlePrefix?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  departmentId?: string;
  jobTitleId?: string | null;
  profileImageUrl?: string | null;
  notes?: string;
}

/**
 * Password change form data
 */
export interface ChangePasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// ==================== Auth Form Types ====================

/**
 * Login form data
 */
export interface LoginFormData {
  email: string;
  password: string;
}

/**
 * Register form data
 */
export interface RegisterFormData {
  email: string;
  titlePrefix: string;
  firstName: string;
  lastName: string;
  password: string;
  confirmPassword: string;
  departmentId: string;
}

/**
 * Password reset request form data
 */
export interface RequestResetFormData {
  email: string;
}

/**
 * Password reset form data
 */
export interface ResetPasswordFormData {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

// ==================== Status Form Types ====================

/**
 * Status form data
 */
export interface StatusFormData {
  name: string;
  color: string;
  order: number;
  statusType: 'NOT_STARTED' | 'IN_PROGRESS' | 'DONE' | 'CANCELED';
}

/**
 * Create status form data
 */
export interface CreateStatusFormData {
  name: string;
  color: string;
  projectId: string;
  statusType?: string;
}

// ==================== Comment Form Types ====================

/**
 * Comment form data
 */
export interface CommentFormData {
  content: string;
  mentionedUserIds?: string[];
}

// ==================== Checklist Form Types ====================

/**
 * Checklist item form data
 */
export interface ChecklistFormData {
  name: string;
  isChecked: boolean;
}

// ==================== Filter Form Types ====================

/**
 * Task filter form data
 */
export interface TaskFilterFormData {
  search?: string;
  statusIds?: string[];
  assigneeUserIds?: string[];
  priorities?: number[];
  startDate?: Date | null;
  dueDate?: Date | null;
  includeCompleted?: boolean;
}

/**
 * Project filter form data
 */
export interface ProjectFilterFormData {
  search?: string;
  departmentIds?: string[];
  statuses?: string[];
  ownerIds?: string[];
}

/**
 * User filter form data
 */
export interface UserFilterFormData {
  search?: string;
  roles?: string[];
  departmentIds?: string[];
  statuses?: string[];
}

// ==================== Report Filter Form Types ====================

/**
 * Reports filter form data
 */
export interface ReportsFilterFormData {
  startDate: Date;
  endDate: Date;
  missionGroupId?: string | null;
  divisionId?: string | null;
  departmentId?: string | null;
}

// ==================== Type Helper Functions ====================

/**
 * Type guard to check if form has errors
 */
export function hasFormErrors(formState: { errors: Record<string, any> }): boolean {
  return Object.keys(formState.errors).length > 0;
}

/**
 * Type helper to extract form values from schema
 */
export type InferFormValues<T extends z.ZodType> = z.infer<T>;
